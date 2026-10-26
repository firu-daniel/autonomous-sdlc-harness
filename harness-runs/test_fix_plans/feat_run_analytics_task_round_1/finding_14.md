### 14. watcher-remote-dispatch: a remote task drop is committed, pushed and dispatched, never spawned

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `launch_remote_run()`, which calls `hr_remote_record_init` and then `bash "$REMOTE_RUN" dispatch`, and → `remote_commit_and_push()`, which calls `watcher_commit` and then `hr_push_landed "$PUSH_BRANCH"`. The mirror is `scripts/autonomous-watcher.sh`. The branch did not change either function.

**Failing test:** `cli/test/watcher-remote-dispatch.test.mjs`, `a remote task drop is committed, pushed and dispatched, never spawned`

**Failure (from the log):**

```
not ok 1076 - a remote task drop is committed, pushed and dispatched, never spawned
```

The log has no assertion message for it.

**Diagnosis (first round, no earlier log):** With `execution.target` set to `github-actions`, the test drops a task prompt and runs one pass. It then asserts:

- the clone's tip subject is `chore: add task prompt for feat_x`;
- `origin/feat_x` equals the clone's HEAD;
- exactly one `workflow run harness-run.yml …` call reached the `gh` stub;
- the copy is a clone;
- the record is `execution` `github-actions`, `status` `running`, with an empty `pid`;
- no prompt was sent;
- exactly one `launched` notice, with detail `dispatched to GitHub Actions`.

The remote arm never calls `spawn_engine`, so it never reaches the branch's only watcher change, `record_run_analytics`. Nothing this branch changed sits on this path. The only related change is the `init`-written tree: `run_analytics/README.md` under the state directory, plus `run-analytics.sh` and its `lib/*.jq` under `scripts/`, which `createDispatchFixture` commits and force-pushes with the rest of the adopted tree.

In the same run, `cli/test/watcher-sandbox-refusal.test.mjs` → `(e) a drop sent to GitHub Actions never consults the probe and is dispatched` passed. It runs the same remote arm on a clone. This file's later remote-dispatch cases (the re-drop, the identical re-drop and the remote review drop) are not in the log's failing list. Only this file's first four tests failed. That points to a transient condition early in the suite's run, not to a deterministic defect.

**Fix:**

- [ ] If the named test passes as the tree stands, edit no code.
- [ ] If it fails, take the failing assertion from its message and fix the code it names, in `launch_remote_run()` / `remote_commit_and_push()` or in the library function they call. Make the identical edit in the `scripts/` mirror so the two copies stay byte-identical.
- [ ] If the newly committed `run_analytics/` README or the new scripts turn out to trip a placement or trust check on the remote arm, fix that check's handling of them. Do not drop the files from `init`'s output.
- [ ] Do not weaken the test.

## Already passing

- **Closed by the operator, not by a unit.** This finding's named test was **not** run on its own. The round-1 failures were caused by a second run's gate suite running on the same host at the same time (`fix_headless_run_host_sleep`). Findings 2–8 of this index, closed one by one, each passed on its own with no code change.
- **Verification:** the round-2 gate run, which runs the whole suite. If this test fails there, round 2's test fix plan lists it again.
- **No code file edited:** this section is the only change, on `d17b3335`.
