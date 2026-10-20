### 2. Make the fetch prove the hooks pin in refresh-branch case (d)

**Site:** `cli/test/refresh-branch-worktree-config.test.mjs`, the test `'(d) The worktree’s own copy with no argument still refreshes the worktree, under the main hooks'` (about line 180) and its last assertion, `assert.deepEqual(await f.markers(), ['main-rt']);`.

**Failing test:** `cli/test/refresh-branch-worktree-config.test.mjs`. Reported as `not ok 381 - (d) The worktree’s own copy with no argument still refreshes the worktree, under the main hooks`.

**Failure (from the log):**

```
not ok 381 - (d) The worktree’s own copy with no argument still refreshes the worktree, under the main hooks
```

The log does not include the assertion diff. The diagnosis below comes from reading the current tree.

**Class:** new this round (no earlier logs).

**Diagnosis:**

- **What case (d) runs.** It uses the worktree's own copy, `f.wtScript`, with no argument. The pinned hooks directory still resolves to the main checkout's `githooks`.
- **Why the marker is gone.** Case (d) expects `['main-rt']`, which was written when the wrapper's own `update-ref` fired the `reference-transaction` hook under the pinned main hooks directory. Task 4 (commit `d0de0c90`) moved that ref update into `hr_copy_ref_swap_var` in `cli/templates/scripts/lib/harness-run-lib.sh`. That function runs git through `hr_copy_sync_main_git` with `-c core.hooksPath=/dev/null`, and the `refresh-branch.sh` header now says `The swap runs no hook.`
- **Why the fetch does not write it either.** The wrapper's other ref-moving step, `main_git fetch ... origin "$base"`, has nothing to update in this fixture. The fixture's `git push origin trunk` already advanced the main checkout's `refs/remotes/origin/trunk`.
- **Result.** No hook runs, the markers directory stays empty, and the assertion fails.

The wrapper's behaviour is correct. The test's way of proving the pin is what went stale.

**Suspected shared cause:** likely the same cause as Finding 1. Both cases relied on the swap's ref update to fire the main `reference-transaction` hook, and Task 4 made the swap hookless.

**Concrete fix (in `cli/test/refresh-branch-worktree-config.test.mjs`):**

- [ ] In case (d), right after `const f = await worktreeFixture(t);`, move the main checkout's remote-tracking ref back by one commit so the wrapper's fetch moves a ref under the pinned hooks directory. Then clear the markers that this `update-ref` itself wrote. Insert before `const mainHead = ...`:
  ```js
  // The fixture's push already advanced origin/trunk; put it back one commit so the wrapper's
  // fetch moves a ref, and its reference-transaction hook shows which hooks directory it ran under.
  await runGit(f.main, ['update-ref', `refs/remotes/origin/${BASE}`, `${f.baseSha}~1`]);
  await f.resetMarkers();
  ```
  Keep the last assertion exactly as it is: `assert.deepEqual(await f.markers(), ['main-rt']);`. `main-rt` now comes from the fetch, and seeing `main-rt` rather than `wt-rt` proves that the worktree's own copy also runs under the main hooks directory.

Do not change `cli/templates/scripts/refresh-branch.sh`, `cli/templates/scripts/lib/harness-run-lib.sh` or the shared `worktreeFixture`. Case (l) asserts that the markers are empty and would break if the fixture's tracking ref were moved for every case.

**Deviations from plan:** None in the fix itself. The row-`G.4` before-run happened after the edit: the HEAD copy of the test file was put back for one run, `npm test --workspace cli -- test/refresh-branch-worktree-config.test.mjs`, where case (d) failed (`actual []`, `expected ['main-rt']`, 13 pass / 1 fail). The fixed file was then restored, and the same command gave 14 pass / 0 fail.
