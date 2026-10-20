### 1. Make the fetch prove the hooks pin in refresh-branch case (a)

**Site:** `cli/test/refresh-branch-worktree-config.test.mjs`, the test `'(a) The main checkout’s copy refreshes the named worktree under the main hooks, and runs no merge hook'` (about line 139) and its last assertion, `assert.deepEqual(await f.markers(), ['main-rt']);`. Two comments in the same file describe the old mechanism. The file header says `only the \`reference-transaction\` hook its ref` (about line 11). The fixture's `hook` helper comment says `it proves which hooks directory the wrapper's own` (about line 74).

**Failing test:** `cli/test/refresh-branch-worktree-config.test.mjs`. Reported as `not ok 378 - (a) The main checkout’s copy refreshes the named worktree under the main hooks, and runs no merge hook`.

**Failure (from the log):**

```
not ok 378 - (a) The main checkout’s copy refreshes the named worktree under the main hooks, and runs no merge hook
```

The log does not include the assertion diff. The diagnosis below comes from reading the current tree.

**Class:** new this round (no earlier logs).

**Diagnosis:**

- **Which assertion fails.** The only assertion in case (a) that the behaviour change below can break is the marker check, `['main-rt']`.
- **Where `main-rt` used to come from.** The fixture installs a `reference-transaction` hook in each hooks directory. The main one writes `markers/main-rt` and the worktree's writes `markers/wt-rt`. Before Task 4 (commit `d0de0c90`), `cli/templates/scripts/refresh-branch.sh` moved the branch with `main_git update-ref ...`. `main_git` runs `git -c core.hooksPath="$pinned"`, so that ref update fired the main hooks directory's `reference-transaction` hook, and the hook wrote `main-rt`.
- **What Task 4 changed.** The move now goes through `hr_copy_ref_swap_var` in `cli/templates/scripts/lib/harness-run-lib.sh`. On a non-clone target, that function calls `hr_copy_sync_main_git`, and `hr_copy_sync_main_git` runs `git -c core.hooksPath=/dev/null ...`. The new header of `refresh-branch.sh` states this on purpose: `The swap runs no hook.` It also says `the fetch runs \`reference-transaction\`, so the pin still matters.`
- **Why the fetch does not write the marker.** In this fixture, the fetch moves no ref. The fixture's last step is `git push origin trunk` from the main checkout. That push already advanced the main checkout's `refs/remotes/origin/trunk` to the new base. So when `refresh-branch.sh` runs `main_git fetch --no-recurse-submodules origin "$base"`, there is nothing to update and no `reference-transaction` hook runs.
- **Result.** No hook runs, the markers directory stays empty, and `[] !== ['main-rt']`.

The wrapper's behaviour is correct and intended: the plumbing swap runs no hook. What went stale is the test's way of proving the pin. The fix belongs in the test. Do not add hooks back to the swap.

**Concrete fix (in `cli/test/refresh-branch-worktree-config.test.mjs`):**

- [ ] In case (a), right after `const f = await worktreeFixture(t);`, move the main checkout's remote-tracking ref back by one commit so the wrapper's fetch has a real update to make. Then clear the markers that this `update-ref` itself wrote. Insert before `const mainHead = ...`:
  ```js
  // The fixture's push already advanced origin/trunk; put it back one commit so the wrapper's
  // fetch moves a ref, and its reference-transaction hook shows which hooks directory it ran under.
  await runGit(f.main, ['update-ref', `refs/remotes/origin/${BASE}`, `${f.baseSha}~1`]);
  await f.resetMarkers();
  ```
  Keep the last assertion exactly as it is: `assert.deepEqual(await f.markers(), ['main-rt']);`. `main-rt` now comes from the fetch, which runs under the pinned main hooks directory. The swap runs no hook, so no `wt-rt` marker appears and no second marker appears either. The post-merge hook still does not run, so a `main` marker still must not appear.
- [ ] Update the file header (about lines 10–12). Replace `and, built from plumbing, runs no merge hook at all, only the \`reference-transaction\` hook its ref update fires` with wording that says the merge is built from plumbing and its ref swap runs no hook at all, and that the only hook that fires is the `reference-transaction` hook of the wrapper's fetch, under the main hooks directory. Also add one sentence: cases (a) and (d) move the main checkout's `refs/remotes/origin/trunk` back one commit before the refresh, so that the fetch has a ref to move.
- [ ] Update the comment in `worktreeFixture`'s `hook` helper (about lines 73–75). Change `it proves which hooks directory the wrapper's own ref update ran under` to say that it proves which hooks directory the wrapper's fetch ran under.

Do not change `cli/templates/scripts/refresh-branch.sh` or `cli/templates/scripts/lib/harness-run-lib.sh`. Do not change the fixture shared by every case: case (l) asserts that the markers are empty, and it would start seeing `main-rt` if the fixture's tracking ref were moved for every case.
