### 4. watcher-run-analytics: a run-analytics.sh that exits 1 changes neither the status nor the notifications

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `record_run_analytics()`, the branch `if [ "$a_rc" -ne 0 ]; then` → `log "run analytics: '$branch' not recorded (exit $a_rc) — see $log_path"` → `return 0`. The mirror is `scripts/autonomous-watcher.sh`.

**Failing test:** `cli/test/watcher-run-analytics.test.mjs`, `the session's analytics are committed on the run's branch, and a failing step changes no outcome` → subtest `a run-analytics.sh that exits 1 changes neither the status nor the notifications`

**Failure (from the log):**

```
not ok 3 - a run-analytics.sh that exits 1 changes neither the status nor the notifications
```

The log has no assertion message for it.

**Diagnosis (first round, no earlier log):** The subtest starts with `assert.ok(resumeBaseline, 'the resume case did not run')`. `resumeBaseline` is set only at the end of Finding 3's subtest. If that subtest failed before its last line, this one fails at once, whatever the hook does. On its own terms, it replaces the fixture's `run-analytics.sh` with `exit 1`, resumes with a new session, and asserts three things:

- the status and notification events equal the clean resume's;
- no analytics commit was added;
- exactly one new watcher-log line contains `run analytics: 'feat_x' not recorded (exit 1)`.

The hook as written emits that line once and returns 0.

**Suspected shared cause:** likely the same cause as Finding 2. This subtest needs Finding 3's `resumeBaseline`, which needs Finding 2's launch state.

**Fix:**

- [ ] If the named subtest passes as the tree stands, edit no code.
- [ ] If it still fails once Findings 2 and 3 pass, there are two likely causes. One is a second matching log line, for example the `log` text repeated by a retry. The other is an outcome difference: the failed analytics step changed the record or a notification. Correct `record_run_analytics()` in `cli/templates/scripts/autonomous-watcher.sh` so it logs exactly one line, returns 0 and leaves `rc` untouched, and make the identical edit in `scripts/autonomous-watcher.sh`.
- [ ] Do not weaken the test.
