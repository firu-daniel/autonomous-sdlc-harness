### 23. review drop (L3): a submodule core.fsmonitor is never run

**Site:** `cli/test/watcher-review-drop-payloads.test.mjs` → `test("(L3) a core.fsmonitor in the clone's submodule config is never run: the drop launches", …)` (near line 353); code under test `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_run_surface_check_var`, and the review-drop launch in `cli/templates/scripts/autonomous-watcher.sh`.

**Failing test:** `cli/test/watcher-review-drop-payloads.test.mjs` — `(L3) a core.fsmonitor in the clone's submodule config is never run: the drop launches`

**Failure (log):**

```
        not ok 1304 - (L3) a core.fsmonitor in the clone's submodule config is never run: the drop launches
```

**Diagnosis.** The log carries no assertion text for this test: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`. Class: first round — no earlier log to compare against.

The branch changes the watcher (`cli/templates/scripts/autonomous-watcher.sh`, mirrored in `scripts/autonomous-watcher.sh`) only in: `spawn_engine`'s launch subshell (`export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, the `log_offset` byte count, `log_stopped_background_tasks` before `record_run_analytics`); `classify_run_exit`'s zero-exit arm, which reads `hr_run_ledger_state` (`cli/templates/scripts/lib/harness-run-lib.sh`) and, with no ledger, keeps `completed` and adds one `classify: '<branch>' has no readable ledger` watcher-log line; `launch_run` / `begin_pause_resume` clearing `pause_reason` / `pause_note_stale`; and `spawn_engine` reading `pause_note_stale` outside job mode.

This case plants a `core.fsmonitor` in the clone's submodule config and asserts the payload never ran and the drop launched. The branch does not touch the surface check or any git invocation that could run the payload. The file's first seven cases in file order failed and its later cases are not among the failures. The run lasted 3 390 s with 2 tests cancelled, and the branch's own watcher suites passed; a scaled `TICK_TIMEOUT_MS` exceeded on a loaded host fits. The failing assertion is unknown.

**Suspected shared cause:** likely the same cause as Finding 1 — the shared watcher driver on a path the branch's change does not alter.

**Fix**

- [ ] Take the failing assertion of this test and place it in one of the two arms below.
- [ ] **A time bound exceeded, or a watcher pass killed by its bound**, with every value the test asserts otherwise as expected: the branch has no defect here. Leave the code and the test unchanged — no bound raised, no assertion loosened, no case skipped.
- [ ] **An assertion on a value the branch changed** — the `classify: … has no readable ledger` line, `pause_reason` / `pause_note_stale`, the session's environment, or `log_stopped_background_tasks` running before `record_run_analytics`: change `cli/templates/scripts/autonomous-watcher.sh` (and `cli/templates/scripts/lib/harness-run-lib.sh` where the value comes from `hr_run_ledger_state`) so the asserted behaviour holds again, without undoing the wait-ceiling export or the ledger split, and carry the identical edit into `scripts/autonomous-watcher.sh` / `scripts/lib/harness-run-lib.sh`. Leave the test file unchanged.
