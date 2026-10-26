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

## Already passing

- **(a) Named test and file run:** subtest `a run-analytics.sh that exits 1 changes neither the status nor the notifications` under parent `the session's analytics are committed on the run's branch, and a failing step changes no outcome`, in `cli/test/watcher-run-analytics.test.mjs`, run as the whole file (no name pattern).
- **(b) Command and result:** `npm test --workspace cli -- test/watcher-run-analytics.test.mjs` from the repository root (pretest build ran first). The named subtest reported `ok 3 - a run-analytics.sh that exits 1 changes neither the status nor the notifications`. File summary: `# tests 5`, `# pass 5`, `# fail 0`. The two subtests before it on the shared fixture, `ok 1` (launch) and `ok 2` (resume, which sets `resumeBaseline`), also passed. That fits the suspected shared cause with Findings 2 and 3, which were closed already passing in commits `996c1f5a` and `73766b86`.
- **(c) No code file edited:** this detail file is the only write. `git status --short` was empty before this record was appended.
- **Re-verified on re-dispatch:** the same command, run again, again reported `ok 3 - a run-analytics.sh that exits 1 changes neither the status nor the notifications`, with `# tests 5`, `# pass 5`, `# fail 0`. `git status --short` listed only this file.
