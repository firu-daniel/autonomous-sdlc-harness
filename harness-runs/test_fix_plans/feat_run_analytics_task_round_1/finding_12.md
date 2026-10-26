### 12. watcher-sandbox-refusal: (d) the helper's default probe launches the stub

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine()`, the subshell sequence `record_run_analytics "$branch" "$worktree" "$log_path"` → `classify_run_exit "$branch" "$worktree" "$log_path" "$rc"`. The mirror is `scripts/autonomous-watcher.sh`.

**Failing test:** `cli/test/watcher-sandbox-refusal.test.mjs`, `(d) the helper's default probe launches the stub`

**Failure (from the log):**

```
not ok 1158 - (d) the helper's default probe launches the stub
```

The log has no assertion message for it.

**Diagnosis (first round, no earlier log):** The test uses the helper's default probe, which reports nothing missing. It drops a task prompt, runs one pass, and asserts two things: one prompt was sent, and the record's status is `completed`. The second assertion is the one the branch's hook could affect. The hook runs inside the subshell before `classify_run_exit`. If it exited the subshell, or hung past the helper's 60-second tick bound, the record would stay `running` or the pass would time out. As written, the hook always reaches `return 0`, and with a session-less stub it does no more than resolve paths. In the same run, `cli/test/watcher-remote-dispatch.test.mjs` → `with the key absent the same drop launches the agent and sends nothing to gh` passed, and it asserts the same `completed` status on the same path.

**Suspected shared cause:** likely the same cause as Finding 11. Same file, same local clone launch.

**Fix:**

- [ ] If the named test passes as the tree stands, edit no code.
- [ ] If it fails on `status`, there are two likely causes: something in `record_run_analytics()` ends or stalls the subshell before `classify_run_exit` (for example a `set -e`-style exit in a sourced helper, or an unbounded git call), or `run-analytics.sh` blocks on a host reader. Make the hook fail closed and return 0 within bounded time. Edit `cli/templates/scripts/autonomous-watcher.sh` (or `cli/templates/scripts/run-analytics.sh`) and make the identical edit in the `scripts/` mirror. For any other assertion, fix the code it names.
- [ ] Do not weaken the test.

## Already passing

- **Closed by the operator, not by a unit.** This finding's named test was **not** run on its own. The round-1 failures were caused by a second run's gate suite running on the same host at the same time (`fix_headless_run_host_sleep`). Findings 2–8 of this index, closed one by one, each passed on its own with no code change.
- **Verification:** the round-2 gate run, which runs the whole suite. If this test fails there, round 2's test fix plan lists it again.
- **No code file edited:** this section is the only change, on `d17b3335`.
