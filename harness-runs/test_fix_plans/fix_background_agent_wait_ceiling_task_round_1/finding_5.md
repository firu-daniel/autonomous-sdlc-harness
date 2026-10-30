### 5. keep-awake (e)-(h): the logind hold follows mains power

**Site:** `cli/test/watcher-keep-awake.test.mjs` → `test('(e)-(h) Linux: the logind hold waits on the engine, …')` (near line 379), driven through the suite's `session()` helper; code under test `cli/templates/scripts/autonomous-watcher.sh` → `keep_awake_pass`, `spawn_engine`.

**Failing test:** `cli/test/watcher-keep-awake.test.mjs` — `(e)-(h) Linux: the logind hold waits on the engine, follows mains power pass by pass, and ends with the session`

**Failure (log):**

```
        not ok 1203 - (e)-(h) Linux: the logind hold waits on the engine, follows mains power pass by pass, and ends with the session
```

**Diagnosis.** The log carries no assertion text for this test: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`. Class: first round — no earlier log to compare against.

The branch changes the watcher (`cli/templates/scripts/autonomous-watcher.sh`, mirrored in `scripts/autonomous-watcher.sh`) only in: `spawn_engine`'s launch subshell (`export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, the `log_offset` byte count, `log_stopped_background_tasks` before `record_run_analytics`); `classify_run_exit`'s zero-exit arm, which reads `hr_run_ledger_state` (`cli/templates/scripts/lib/harness-run-lib.sh`) and, with no ledger, keeps `completed` and adds one `classify: '<branch>' has no readable ledger` watcher-log line; `launch_run` / `begin_pause_resume` clearing `pause_reason` / `pause_note_stale`; and `spawn_engine` reading `pause_note_stale` outside job mode.

This case keeps one session alive across three passes under the Linux probe and asserts the `systemd-inhibit` holder on the engine's pid, its release on battery, a new holder on mains, and the holder's end with the session. The branch does not touch the keep-awake functions. Each pass is waited for under `TICK_TIMEOUT_MS` and the script under `SESSION_TIMEOUT_MS`, both scaled; the run lasted 3 390 s with 2 tests cancelled, and the branch's own watcher suites on the same launch path passed. A bound exceeded on a loaded host fits. The failing assertion is unknown.

**Suspected shared cause:** likely the same cause as Finding 1 — the same fixture and launch, on a path the branch's change does not alter.

**Fix**

- [ ] Take the failing assertion of this test and place it in one of the two arms below.
- [ ] **A time bound exceeded (`pass N did not return`, a holder poll, or the session script killed by its bound)**, with every value the test asserts otherwise as expected: the branch has no defect here. Leave the code and the test unchanged — no bound raised, no assertion loosened, no case skipped.
- [ ] **An assertion on a value the branch changed** — the `classify: … has no readable ledger` line, `pause_reason` / `pause_note_stale`, the session's environment, or `log_stopped_background_tasks` running before `record_run_analytics`: change `cli/templates/scripts/autonomous-watcher.sh` (and `cli/templates/scripts/lib/harness-run-lib.sh` where the value comes from `hr_run_ledger_state`) so the asserted behaviour holds again, without undoing the wait-ceiling export or the ledger split, and carry the identical edit into `scripts/autonomous-watcher.sh` / `scripts/lib/harness-run-lib.sh`. Leave the test file unchanged.
