### 5. watcher-run-analytics: a missing run-analytics.sh changes neither the status nor the notifications

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `record_run_analytics()`, the guard `if [ ! -x "$RUN_ANALYTICS" ]; then`. Its one log line contains `run analytics: `, the script path (ending `run-analytics.sh`) and `` `autonomous-sdlc-harness init --force` rewrites it ``. The mirror is `scripts/autonomous-watcher.sh`.

**Failing test:** `cli/test/watcher-run-analytics.test.mjs`, `the session's analytics are committed on the run's branch, and a failing step changes no outcome` → subtest `a missing run-analytics.sh changes neither the status nor the notifications`

**Failure (from the log):**

```
not ok 4 - a missing run-analytics.sh changes neither the status nor the notifications
```

The log has no assertion message for it.

**Diagnosis (first round, no earlier log):** This subtest also starts with `assert.ok(resumeBaseline, …)`, so it fails at once whenever Finding 3's subtest did not finish. On its own terms, it removes the fixture's `run-analytics.sh`, resumes with a new session (`sess-missing`), and asserts three things:

- the outcome equals the clean resume's;
- no analytics commit was added;
- exactly one new watcher-log line contains all three of `run analytics: `, `run-analytics.sh` and `init --force`.

The guard as written matches all three and returns 0.

**Suspected shared cause:** likely the same cause as Finding 2. This subtest needs Finding 3's `resumeBaseline`, which needs Finding 2's launch state.

**Fix:**

- [ ] If the named subtest passes as the tree stands, edit no code.
- [ ] If it still fails once Findings 2–4 pass, read the added watcher-log lines from the assertion message. Make the missing-script path emit exactly one line carrying all three substrings, return 0 and change no outcome. Edit `record_run_analytics()` in `cli/templates/scripts/autonomous-watcher.sh` and make the identical edit in `scripts/autonomous-watcher.sh`.
- [ ] Do not weaken the test.
