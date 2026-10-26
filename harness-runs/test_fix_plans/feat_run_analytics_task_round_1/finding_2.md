### 2. watcher-run-analytics: a launch commits run-analytics.json then run-analytics.md on the branch

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `record_run_analytics()` and its call `record_run_analytics "$branch" "$worktree" "$log_path"` inside `spawn_engine()`'s subshell, between `rc=${PIPESTATUS[0]}` and `classify_run_exit`. Its byte-identical mirror is `scripts/autonomous-watcher.sh` (same function, same call). The script it runs is `cli/templates/scripts/run-analytics.sh`, mirrored at `scripts/run-analytics.sh`.

**Failing test:** `cli/test/watcher-run-analytics.test.mjs`, `the session's analytics are committed on the run's branch, and a failing step changes no outcome` → subtest `a launch commits run-analytics.json then run-analytics.md on the branch, synced to the main checkout`

**Failure (from the log):**

```
not ok 1 - a launch commits run-analytics.json then run-analytics.md on the branch, synced to the main checkout
not ok 1142 - the session's analytics are committed on the run's branch, and a failing step changes no outcome
```

The log has no assertion message for it.

**Diagnosis (first round, no earlier log):** This is the branch's own new test of the branch's own new hook. It is the one failing test that exercises the new code directly.

The subtest drops a task prompt on an adopted fixture, so `create-worktree.sh` cuts a sibling clone at `<fixture>-feat_x` with `copy_kind` `clone`. The stub prints one complete session (`sess-launch`). The subtest then asserts these things, in order:

1. The record is a clone run, and exactly one prompt was sent.
2. The clone's `feat_x` has exactly two commits with subject `chore: Record run analytics for feat_x`. Newest first, they touch only `sdlc-harness/run_analytics/feat_x/run-analytics.md` and then only `…/run-analytics.json`.
3. The main checkout's `feat_x` has the same commits and the same tip.
4. The status is not `failed`, and the notifications are exactly `launched` plus one outcome.
5. `git status --porcelain` under `sdlc-harness/run_analytics/` is empty in the clone.

A defect in the hook would break one of those assertions. Where each could break:

- **`run-analytics.sh` exits non-zero** inside the fixture. For example, `hr_repo_root`, `hr_state_path` or `hr_main_repo` could resolve differently in a clone, or the `--main-repo` redaction could refuse. Then nothing is written, and assertion 2 sees 0 commits. The watcher log would carry `run analytics: 'feat_x' not recorded (exit N)`.
- **`watcher_commit` → `hr_commit_placed` refuses** the post-session commit with return 1, for example through `hr_run_copy_check_var` on a copy a session has just used, or because `RUN_MAIN` is empty in the subshell. The watcher log would carry `run analytics: could not commit … (exit 1)`.
- **The main checkout is not moved.** `hr_commit_paths_var` moves the clone's ref, then the main checkout's. If the second move fails, assertion 3 fails with `the main checkout lags`.
- **The two blobs are left untracked or modified** in the clone, which breaks assertion 5.

There is a caveat. In this same run, other tests that take the same clone-launch path passed: `spawn_engine` → `record_run_analytics` → `classify_run_exit`, for example `cli/test/watcher-remote-dispatch.test.mjs` → `with the key absent the same drop launches the agent and sends nothing to gh`. Within each failing file, the clone-using tests near the top failed and the later ones passed. So the other 12 clone-test failures need not share a code cause with this one. This test is the only one that commits analytics (its stub prints a real session), so it is the most likely of the 17 to carry a real defect.

**Fix:**

- [ ] If the named subtest passes as the tree stands, edit no code (the flake reading above).
- [ ] If it fails, take the cause from its assertion message and the fixture's watcher log, using the candidates above. Fix it in `record_run_analytics()` (or in `run-analytics.sh` if the script is what exits non-zero) in `cli/templates/scripts/`, and make the identical edit in the `scripts/` mirror so the two copies stay byte-identical.
- [ ] Keep the hook's best-effort contract: it always returns 0, never touches `rc`, and never notifies.
- [ ] Do not weaken, skip or delete any assertion in the test.
