### 5. watcher-sandbox-refusal: (d) the helper's default probe launches the stub (persisting)

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine()`, the background subshell sequence `record_run_analytics "$branch" "$worktree" "$log_path"` → `classify_run_exit "$branch" "$worktree" "$log_path" "$rc"`, and `record_run_analytics()` itself. The mirror is `scripts/autonomous-watcher.sh`.

**Failing test:** `cli/test/watcher-sandbox-refusal.test.mjs`, `(d) the helper's default probe launches the stub`

**Failure (from the log):**

```
not ok 1161 - (d) the helper's default probe launches the stub
```

The log has no assertion message for it.

**Diagnosis (persisting: failed in round 1 as `not ok 1158`):** The test drops a task prompt and runs one pass with the default probe. It asserts that one prompt was sent and that the record's status is `completed`. Round 1 closed it without running it, on the operator's parallel-run explanation. The round-2 full run failed it again, after #178's doubled bounds. Its sibling `(b)`, which takes the same launch path, passed this round.

The stub prints no session, so `run-analytics.sh` stops at `no session in …` and nothing is committed. Before `classify_run_exit` writes `completed`, the hook still resolves the state directory and runs `run-analytics.sh` with its `jq` calls. On this branch, that adds a stretch of wall-clock time between the session's exit and its classification. If the `status` assertion is the one that fails, either the classification never ran, or something overwrote it after it ran. Two things could cause that. A sourced helper could end the subshell early. Or, under load, the foreground pass's own registry writes could interleave with the subshell's, the case the helper's choice 1 warns about. If the `prompts` assertion fails, the launch itself was refused, and the watcher log names why.

**Suspected shared cause:** likely the same cause as Finding 1 — the same post-session hook in the same background subshell, overlapping the foreground pass under load.

**Fix:**

- [ ] Address Finding 1 first. Then run the named test's file on its own and read the assertion message and the watcher log it prints. **Do not close on a lone pass alone**: this test has failed in two full-suite runs.
- [ ] If the record is not `completed`, find what stops `classify_run_exit` from writing `completed` or what overwrites it. Make `record_run_analytics()` unable to end the subshell, and keep it bounded in time and fail-closed, returning 0. If the overlap with the foreground pass is the cause, apply the same serialization Finding 1 settles on. Edit `cli/templates/scripts/autonomous-watcher.sh` (or `cli/templates/scripts/run-analytics.sh`), with the identical edit in the `scripts/` mirror.
- [ ] For any other assertion, fix the code its message names.
- [ ] Do not weaken, skip or delete any assertion in the test.
