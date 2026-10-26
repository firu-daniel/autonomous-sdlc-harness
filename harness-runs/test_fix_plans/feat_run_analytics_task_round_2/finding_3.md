### 3. watcher-run-analytics: a run-analytics.sh that exits 1 changes neither the status nor the notifications (persisting)

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `record_run_analytics()`, the arm that logs `run analytics: '$branch' not recorded (exit $a_rc) — see $log_path` and returns 0. The mirror is `scripts/autonomous-watcher.sh`.

**Failing test:** `cli/test/watcher-run-analytics.test.mjs`, `the session's analytics are committed on the run's branch, and a failing step changes no outcome` → subtest `a run-analytics.sh that exits 1 changes neither the status nor the notifications`

**Failure (from the log):**

```
not ok 3 - a run-analytics.sh that exits 1 changes neither the status nor the notifications
```

The log has no assertion message for it.

**Diagnosis (persisting: failed in round 1 under parent `not ok 1142`):** The subtest replaces the fixture's `run-analytics.sh` with `exit 1` and runs `failingResume(2, 'sess-fail', …)`. Its first statement is `assert.ok(resumeBaseline, 'the resume case did not run')`. `resumeBaseline` is set only at the end of a successful Finding 2 subtest. So whenever Finding 2's subtest fails before that line, this subtest fails at once, whatever this code does. The hook arm itself is plain: a non-zero exit gives one log line, `return 0`, and `rc` is untouched.

**Suspected shared cause:** likely the same cause as Finding 1 — it cascades through Finding 2's unset `resumeBaseline` in the shared, ordered fixture.

**Fix:**

- [ ] Address Findings 1 and 2 first. Then run the named test's file on its own and read this subtest's assertion message.
- [ ] If it still fails past the `resumeBaseline` check, fix the cause the message names. The status and the notifications must match the baseline, no analytics commit may be added, and exactly one `not recorded (exit 1)` line may be added to the watcher log. Fix it in `record_run_analytics()` in `cli/templates/scripts/autonomous-watcher.sh`, with the identical edit in `scripts/autonomous-watcher.sh`.
- [ ] Do not weaken, skip or delete any assertion in the test.
