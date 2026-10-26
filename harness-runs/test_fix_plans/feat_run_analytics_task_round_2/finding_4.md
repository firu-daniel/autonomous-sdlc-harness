### 4. watcher-run-analytics: a missing run-analytics.sh changes neither the status nor the notifications (persisting)

**Site:** `cli/templates/scripts/autonomous-watcher.sh` → `record_run_analytics()`, the `[ ! -x "$RUN_ANALYTICS" ]` arm that logs `run analytics: '$RUN_ANALYTICS' is not executable — '$branch' not recorded (\`autonomous-sdlc-harness init --force\` rewrites it)`. The mirror is `scripts/autonomous-watcher.sh`.

**Failing test:** `cli/test/watcher-run-analytics.test.mjs`, `the session's analytics are committed on the run's branch, and a failing step changes no outcome` → subtest `a missing run-analytics.sh changes neither the status nor the notifications`

**Failure (from the log):**

```
not ok 4 - a missing run-analytics.sh changes neither the status nor the notifications
```

The log has no assertion message for it.

**Diagnosis (persisting: failed in round 1 under parent `not ok 1142`):** The subtest removes the fixture's `run-analytics.sh` and runs `failingResume(3, 'sess-missing', …)`. Like Finding 3, it opens with `assert.ok(resumeBaseline, …)`, so it fails whenever Finding 2's subtest did not reach its last lines. The arm under test is a fixed `log` plus `return 0`, and that line carries `run analytics: `, `run-analytics.sh` and `init --force`, which is what the filter looks for.

**Suspected shared cause:** likely the same cause as Finding 1 — the same cascade through `resumeBaseline` as Finding 3.

**Fix:**

- [ ] Address Findings 1 and 2 first. Then run the named test's file on its own and read this subtest's assertion message.
- [ ] If it still fails past the `resumeBaseline` check, fix the cause the message names in `record_run_analytics()` in `cli/templates/scripts/autonomous-watcher.sh`, with the identical edit in `scripts/autonomous-watcher.sh`.
- [ ] Do not weaken, skip or delete any assertion in the test.

## Already passing

- **(a)** Named test: `a missing run-analytics.sh changes neither the status nor the notifications`, under parent `the session's analytics are committed on the run's branch, and a failing step changes no outcome`. File run: `cli/test/watcher-run-analytics.test.mjs`, after Finding 1's commit `ea4a69a1` and the already-passing closes of Findings 2 (`67d80417`) and 3 (`dc862d2a`).
- **(b)** Command: `npm test --workspace cli -- test/watcher-run-analytics.test.mjs`, from the repository root. Result for the named test: `ok 4 - a missing run-analytics.sh changes neither the status nor the notifications`. It therefore got past the `resumeBaseline` check and passed every later assertion. The file's summary was `# tests 5`, `# pass 5`, `# fail 0`. Subtests 1, 2 and 3 also reported `ok`.
- **(c)** No code file was edited. `record_run_analytics()` in `cli/templates/scripts/autonomous-watcher.sh` and in `scripts/autonomous-watcher.sh` is unchanged.
