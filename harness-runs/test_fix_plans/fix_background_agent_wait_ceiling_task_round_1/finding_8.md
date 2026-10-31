### 8. keep-awake (k): kill switch on battery still releases the hold

**Site:** `cli/test/watcher-keep-awake.test.mjs` → `test('(k) Linux: under the global kill switch a pass on battery still releases the hold', …)` (near line 448), driven through the suite's `session()` helper; code under test `cli/templates/scripts/autonomous-watcher.sh` → `keep_awake_pass` and the kill-switch path of `tick`.

**Failing test:** `cli/test/watcher-keep-awake.test.mjs` — `(k) Linux: under the global kill switch a pass on battery still releases the hold`

**Failure (log):**

```
        not ok 1206 - (k) Linux: under the global kill switch a pass on battery still releases the hold
```

**Diagnosis.** The log carries no assertion text for this test: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`. Class: first round — no earlier log to compare against.

The branch changes the watcher (`cli/templates/scripts/autonomous-watcher.sh`, mirrored in `scripts/autonomous-watcher.sh`) only in: `spawn_engine`'s launch subshell (`export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, the `log_offset` byte count, `log_stopped_background_tasks` before `record_run_analytics`); `classify_run_exit`'s zero-exit arm, which reads `hr_run_ledger_state` (`cli/templates/scripts/lib/harness-run-lib.sh`) and, with no ledger, keeps `completed` and adds one `classify: '<branch>' has no readable ledger` watcher-log line; `launch_run` / `begin_pause_resume` clearing `pause_reason` / `pause_note_stale`; and `spawn_engine` reading `pause_note_stale` outside job mode.

This case holds a session alive, drops `AUTONOMOUS_STOP`, switches to battery and asserts the `global kill switch active` line, the battery release line, `keep_awake: battery`, the holder gone and the engine alive. The branch touches neither the kill-switch path nor the keep-awake functions. Each pass is waited for under the scaled `TICK_TIMEOUT_MS` and the script under `SESSION_TIMEOUT_MS`; the run lasted 3 390 s with 2 tests cancelled, and the branch's own watcher suites on the same launch path passed. A bound exceeded on a loaded host fits. The failing assertion is unknown.

**Suspected shared cause:** likely the same cause as Finding 1 — the same fixture and launch, on a path the branch's change does not alter.

**Fix**

- [ ] Take the failing assertion of this test and place it in one of the two arms below.
- [ ] **A time bound exceeded (`pass N did not return`, a holder poll, or the session script killed by its bound)**, with every value the test asserts otherwise as expected: the branch has no defect here. Leave the code and the test unchanged — no bound raised, no assertion loosened, no case skipped.
- [ ] **An assertion on a value the branch changed** — the `classify: … has no readable ledger` line, `pause_reason` / `pause_note_stale`, the session's environment, or `log_stopped_background_tasks` running before `record_run_analytics`: change `cli/templates/scripts/autonomous-watcher.sh` (and `cli/templates/scripts/lib/harness-run-lib.sh` where the value comes from `hr_run_ledger_state`) so the asserted behaviour holds again, without undoing the wait-ceiling export or the ledger split, and carry the identical edit into `scripts/autonomous-watcher.sh` / `scripts/lib/harness-run-lib.sh`. Leave the test file unchanged.

## Already passing

- **(a)** Named test `(k) Linux: under the global kill switch a pass on battery still releases the hold`; file run: `cli/test/watcher-keep-awake.test.mjs`.
- **(b)** `npm test --workspace cli -- test/watcher-keep-awake.test.mjs`, from the repository root: the named test reported `ok 9 - (k) Linux: under the global kill switch a pass on battery still releases the hold` (`duration_ms: 20961.696167`); file totals `# tests 9`, `# pass 9`, `# fail 0`, `# cancelled 0`, `# duration_ms 195220.46475`. The Fix section's "time bound exceeded" arm applies: no assertion failed in this run.
- **(c)** No code file was edited; this record is the only write.
