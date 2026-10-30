### 4. keep-awake (l): a released hold is retaken once the key is true

**Site:** `cli/test/watcher-keep-awake.test.mjs` → `test('(l) macOS: a hold released by execution.keepAwake false is taken again once the key is true', …)` (near line 341), driven through the suite's `session()` helper; code under test `cli/templates/scripts/autonomous-watcher.sh` → `keep_awake_pass`, `spawn_engine`.

**Failing test:** `cli/test/watcher-keep-awake.test.mjs` — `(l) macOS: a hold released by execution.keepAwake false is taken again once the key is true`

**Failure (log):**

```
        not ok 1202 - (l) macOS: a hold released by execution.keepAwake false is taken again once the key is true
```

**Diagnosis.** The log carries no assertion text for this test: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`. Class: first round — no earlier log to compare against.

The branch changes the watcher (`cli/templates/scripts/autonomous-watcher.sh`, mirrored in `scripts/autonomous-watcher.sh`) only in: `spawn_engine`'s launch subshell (`export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, the `log_offset` byte count, `log_stopped_background_tasks` before `record_run_analytics`); `classify_run_exit`'s zero-exit arm, which reads `hr_run_ledger_state` (`cli/templates/scripts/lib/harness-run-lib.sh`) and, with no ledger, keeps `completed` and adds one `classify: '<branch>' has no readable ledger` watcher-log line; `launch_run` / `begin_pause_resume` clearing `pause_reason` / `pause_note_stale`; and `spawn_engine` reading `pause_note_stale` outside job mode.

This case keeps one session alive across three passes (the stub waits on a control file) and asserts the `caffeinate` holder released on `keepAwake: false`, the engine still alive, and a new holder on the same engine pid once the key is `true`. The branch does not touch `keep_awake_start` / `keep_awake_pass`. Each pass is waited for under `TICK_TIMEOUT_MS` and the whole script under the suite's `SESSION_TIMEOUT_MS`, both scaled; the run lasted 3 390 s with 2 tests cancelled, and the branch's own watcher suites on the same launch path passed. A bound exceeded on a loaded host fits. The failing assertion is unknown.

**Suspected shared cause:** likely the same cause as Finding 1 — the same fixture and launch, on a path the branch's change does not alter.

**Fix**

- [ ] Take the failing assertion of this test and place it in one of the two arms below.
- [ ] **A time bound exceeded (`pass N did not return`, a holder poll, or the session script killed by its bound)**, with every value the test asserts otherwise as expected: the branch has no defect here. Leave the code and the test unchanged — no bound raised, no assertion loosened, no case skipped.
- [ ] **An assertion on a value the branch changed** — the `classify: … has no readable ledger` line, `pause_reason` / `pause_note_stale`, the session's environment, or `log_stopped_background_tasks` running before `record_run_analytics`: change `cli/templates/scripts/autonomous-watcher.sh` (and `cli/templates/scripts/lib/harness-run-lib.sh` where the value comes from `hr_run_ledger_state`) so the asserted behaviour holds again, without undoing the wait-ceiling export or the ledger split, and carry the identical edit into `scripts/autonomous-watcher.sh` / `scripts/lib/harness-run-lib.sh`. Leave the test file unchanged.
