### Task 3 — Prove sync-in's heal, the clone's ref subset and the one-live-copy refusals in `clone-sync.test.mjs` and `clone-create-remove.test.mjs`

**Goal:** Lock in three of Task 1's library changes:
- sync-in heals a strictly-behind clone and still refuses a diverged one;
- a new clone holds only the remote-tracking refs the main checkout keeps alive, and survives the main checkout's `gc --prune=now`;
- the one-live-copy rule, now `hr_run_copy_live_var`, still refuses every second live copy it refused inside `hr_clone_create_var`.

**Depends on:** Task 1. These are the contracts this task asserts:
- **`hr_copy_sync_in_var`, strictly behind:** it fast-forwards the clone's `refs/heads/<branch>` to the main checkout's by compare-and-swap and returns `0` with `HR_SYNC_TIP` the main checkout's tip.
- **`hr_copy_sync_in_var`, diverged:** it returns `1` with *"have diverged"*.
- **`hr_run_copy_live_var <main> <branch>`:** `0` with `HR_LIVE_COPY` / `HR_LIVE_COPY_WHY` when a live copy exists, `1` when none does, `2` when it cannot tell.
- **`hr_clone_create_var`:** the clone's `refs/remotes/origin/` holds `origin/<defaultBranch>` (with `origin/HEAD` when the main checkout has it), and `origin/<branch>` when the main checkout has it.

This task changes no script.

### Targets

- `cli/test/clone-sync.test.mjs`
- `cli/test/clone-create-remove.test.mjs`

**Work:**

- [ ] `clone-sync.test.mjs`: replace the case that expects a strictly-behind clone to be refused (*"the clone is behind the main checkout, so a sync-out did not complete"*) with the heal. Afterwards the two `refs/heads/<branch>` are equal and `HR_SYNC_TIP` is the main checkout's tip. Add a perturbation in the same fixture: a clone **ahead** of the main checkout still syncs in, moving the main checkout forward.
- [ ] `clone-sync.test.mjs`: keep or add the diverged case. Neither ref moves and the refusal names both short tips. Update the file's header rule sentence, which today lists "behind" among the refusals.
- [ ] `clone-create-remove.test.mjs`: replace the assertion that the clone's `refs/remotes/origin/*` equals the main checkout's with the subset above. Seed the fixture's main checkout with a third remote-tracking ref (`origin/other`) so the case can fail.
- [ ] `clone-create-remove.test.mjs`: add the alternates-lifetime case.
  1. Create a clone.
  2. In the main checkout, delete `refs/remotes/origin/other` and expire its reflog.
  3. Run `git -C <main> gc --prune=now`.
  4. Assert that the clone's `HEAD^{tree}` and every ref the clone holds still resolve (`git -C <clone> cat-file -e`, read through the alternates), and that a following `hr_copy_sync_in_var` returns `0`.

  Add a header sentence: dissociation is deliberately not used, because it copies the whole history.
- [ ] `clone-create-remove.test.mjs`: one case per `hr_run_copy_live_var` condition: the derived path exists, the registry's `worktree` names an existing path, the main checkout has the branch checked out, and a linked worktree has it. Each asserts the function's `0` and its clause, and that `hr_clone_create_var` still refuses with nothing written. Add one case for `1` (no live copy).

**Verification:**

- `npm test --workspace cli -- test/clone-sync.test.mjs` passes.
- `npm test --workspace cli -- test/clone-create-remove.test.mjs` passes.
- Each new case is red against the library as it stood before Task 1. When this task runs, Tasks 1 and 2 are both committed, so no `HEAD~<n>` names that revision: name it by the merge-base with the default branch. First issue a bare `git merge-base HEAD origin/<defaultBranch>`, with `<defaultBranch>` read from `harness.config.json` before the command is issued. Then confirm each case once against `git show <that hash>:cli/templates/scripts/lib/harness-run-lib.sh` copied into a temp fixture, not by editing the tracked library, and note it in the file's header.
