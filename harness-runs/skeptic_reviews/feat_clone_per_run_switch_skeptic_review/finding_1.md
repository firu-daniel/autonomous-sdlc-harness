### 1. Sync-in's heal moves only the clone's ref, so a clone left behind by a main-checkout move reads as reverting that move, and the next wrapper commit can write the revert

**File:** `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_copy_sync_in_var`) — "healing the clone's $ref, which is behind the main checkout"

**The problem.** When the clone's `refs/heads/<branch>` (`oid`) is strictly behind the main checkout's (`main_old`), the heal arm runs one command:

```bash
hr_clone_git "$cmain" "$gitdir" update-ref "$ref" "$main_old" "$oid"
```

`update-ref` moves the ref and nothing else. The clone's `HEAD` is a symbolic ref to that branch, so after the heal the clone's `HEAD` names `main_old`, while its index (`<clone>/.git/index`) and working tree still hold `oid`'s tree. Every change between `oid` and `main_old` now shows in the clone as a staged revert.

**Why the heal's own test passes.** A ref-only heal is only correct when the clone's index and tree are already at `main_old` and only its ref fell behind. That was the old main-first model's failed-sync-out case, which this branch's clone-first order removes. Both heal tests build that safe shape:

- `cli/test/clone-sync.test.mjs` case (c) uses `advanceMain`, which commits `${parent}^{tree}`, the same tree.
- `cli/test/wrapper-clone-arm.test.mjs` case (s) moves the clone's ref back by hand, so its tree is already ahead.

Neither test covers the case that is still reachable: the main checkout's branch moving with a different tree while the clone's tree stays at `oid`.

**How it is reached.** Nothing stops a user from moving the run's branch in the main checkout now. A clone is not a linked worktree, so git's one-branch-one-checkout guard no longer refuses `git checkout <branch>` in the main checkout. Sync-in refuses only while that checkout is still on the branch, and `hr_run_copy_live_var` is consulted only at creation.

A concrete path: a run is paused or parked. The user reviews it from the main checkout: `git checkout <branch>`, edits a file, commits, then `git checkout <defaultBranch>`. Any of these also does it: `git fetch origin <branch>:<branch>`, `git branch -f`, or a `git pull` while the branch is checked out there.

The next sync-in then finds the clone strictly behind and heals the ref alone. What happens after that depends on the caller:

- **`commit-on-branch.sh`** syncs in, then reads `old_tip` from the main checkout. That is `main_old`, the user's commit. It then builds the commit from that tip plus the *clone's working-tree content* for the given paths, and those files still hold `oid`'s version. Any given path the user's commit also changed is reverted in the new commit, and nothing reports it.
  - `hr_commit_paths_var` then syncs only the given paths into the clone's index. Every other path the user changed stays staged as a revert, and `git status --short` in the clone lists it.
  - The committer agent takes its stage-path set from `git status --short`, so a later commit that stages those paths reverts the rest of the user's commit too.
- **The watcher's review-path reuse** (`autonomous-watcher.sh`, "elif ! hr_run_copy_clean; then") runs `hr_run_copy_check_var` first, which heals. `hr_run_copy_clean` then compares the index against `HR_RUN_COPY_TIP`, which is now `main_old`, and fails. The run is refused with *"has uncommitted tracked changes — clean them and drop the review file again"*, even though the user made no change in the clone. By then the clone's ref has already been moved.
- **`refresh-branch.sh` and `hr_run_fast_forward_var`** run a dry-run two-tree `read-tree -m -u <old_tip> <new>` from `main_old`. The index is at `oid`, so the dry run refuses with "nothing was merged", and the refresh or the remote-arm fast-forward fails.

**Proof from the code.**

- `hr_copy_sync_in_var` → the `1)` arm of the `merge-base --is-ancestor "$main_old" "$oid"` case → its inner `0)` arm (oid is an ancestor of main_old) is the only heal code. It calls `update-ref` and nothing that writes `<clone>/.git/index` or the working tree.
- `hr_run_copy_check_var` sets `HR_RUN_COPY_TIP` from the main checkout's ref right after `hr_copy_sync_in_var`.
- `hr_run_copy_clean` returns 1 unless `diff-index --cached "$HR_RUN_COPY_TIP"` is clean.

**Fix.** Make the heal move the clone's index and working tree with its ref, under the same compare-and-swap discipline `hr_run_fast_forward_var` uses: a dry run first, then the ref, then the real tree update, and a put-back if the tree refuses.

1. In `hr_copy_sync_in_var`, replace the inner `0)` arm's body, which today is the one `if ! hr_clone_git … update-ref "$ref" "$main_old" "$oid" …; then … fi`, with:

```bash
          0)
            if ! hr_copy_git_at "$cmain" "$gitdir" "$clone" read-tree -n --no-recurse-submodules -m -u "$oid" "$main_old" >/dev/null 2>&1; then
              HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': the clone is behind the main checkout (${oid:0:12} to ${main_old:0:12}) and its working tree cannot take the main checkout's tip (a changed or untracked file is in the way)"
              return 1
            fi
            if ! hr_clone_git "$cmain" "$gitdir" update-ref "$ref" "$main_old" "$oid" >/dev/null 2>&1; then
              HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': healing the clone's $ref, which is behind the main checkout, from ${oid:0:12} to ${main_old:0:12} failed"
              return 1
            fi
            if ! hr_copy_git_at "$cmain" "$gitdir" "$clone" read-tree --no-recurse-submodules -m -u "$oid" "$main_old" >/dev/null 2>&1; then
              if hr_clone_git "$cmain" "$gitdir" update-ref "$ref" "$oid" "$main_old" >/dev/null 2>&1; then
                HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': its working tree refused the main checkout's tip ${main_old:0:12}; the clone's $ref was put back to ${oid:0:12}"
              else
                HR_SYNC_REFUSAL="cannot sync branch '$branch' in from '$clone': its working tree refused the main checkout's tip ${main_old:0:12}, and putting the clone's $ref back to ${oid:0:12} failed too — inspect the clone by hand"
              fi
              return 1
            fi
            ;;
```

   `hr_copy_git_at` reads both trees from `<main>/.git`, which holds `oid`, because the fetch and `cat-file -e` above it run first, and `main_old` is the main checkout's own tip. A two-tree `read-tree -m` keeps an index entry that already equals `main_old`. So the ref-only-behind shape still heals unchanged, and the existing case (s) in `wrapper-clone-arm.test.mjs` still passes.

2. Update the prose that describes the heal in the same file:
   - In the comment above `hr_copy_sync_in_var`, replace "the clone's ref is fast-forwarded to <main>'s by a compare-and-swap through `hr_clone_git` from the tip `ls-remote` read" with "the clone's index and working tree are moved to <main>'s tip by a two-tree `read-tree -m -u` (dry run first, refused with nothing moved when a changed or untracked file is in the way) and its ref by a compare-and-swap through `hr_clone_git` from the tip `ls-remote` read, put back if the real `read-tree` refuses".
   - In the header's write-exception list, item 6 ("and moves the clone's `refs/heads/<branch>` when it heals a strictly-behind clone"), add "together with the clone's index and working tree (`hr_copy_git_at`'s two-tree `read-tree -m -u`)".
   - In item 5, change "may also heal the clone's `refs/heads/<branch>` by compare-and-swap," to "may also heal the clone's `refs/heads/<branch>` by compare-and-swap, with its index and working tree,".

3. Update the two docs of record sentences that describe the heal:
   - `docs/cli.md` §6, the sentence beginning "A clone strictly behind the main checkout is **healed**": after "fast-forwarded to the main checkout's by compare-and-swap", add ", with its index and working tree moved to that tip by a two-tree `read-tree -m -u` and the heal refused with nothing moved when a changed or untracked file in the clone is in the way".
   - `docs/watcher.md`, the table row beginning "clone arm: sync-in at the copy check": after "is healed by a compare-and-swap fast-forward of the clone's ref through `hr_clone_git`", add ", its index and working tree moved with it by a two-tree `read-tree -m -u`, refused with nothing moved when a changed file is in the way".

4. In `cli/test/clone-sync.test.mjs`, add a case after (c) named `'(c2) A clone behind a main-checkout commit that changed a file is healed with its working tree, and refused with nothing moved when a changed file is in the way'`, with two subtests that each build their own `fixture(t)`:
   - **Heal.**
     - Run `runGit(f.main, ['checkout', '--quiet', BRANCH])`.
     - Write `join(f.main, 'u.txt')` with `'user fix\n'`.
     - Run `runGit(f.main, ['add', 'u.txt'])`, then `runGit(f.main, [...IDENTITY, 'commit', '--quiet', '-m', 'user: fix'])`, then `runGit(f.main, ['checkout', '--quiet', 'trunk'])`.
     - Record `const ahead = await f.mainTip()`.
     - Assert `await f.syncIn()` deep-equals `{ status: '0', tip: ahead, refusal: '' }`.
     - Assert `await f.cloneTip()` equals `ahead`.
     - Assert `readFile(join(f.clone, 'u.txt'), 'utf8')` equals `'user fix\n'`.
     - Assert `(await runGit(f.clone, ['status', '--porcelain'])).stdout` equals `''`.
   - **Refused.**
     - Make the same main-checkout commit of `u.txt`.
     - Before syncing in, write `join(f.clone, 'u.txt')` with `'clone draft\n'`, untracked.
     - Record `const before = await f.mainSnapshot()` and `const cloneBefore = await f.cloneTip()`.
     - Assert `(await f.syncIn()).status` is `'1'` and the refusal matches `/cannot take the main checkout's tip/`.
     - Assert `await f.cloneTip()` equals `cloneBefore`.
     - Assert `await f.mainSnapshot()` deep-equals `before`.
     - Assert the clone's `u.txt` still reads `'clone draft\n'`.

   This is the one test file the fix edits, so the fix runs only it: `npm test --workspace cli -- test/clone-sync.test.mjs` from the repository root.
