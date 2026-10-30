### 43. stall host sleep (a)(b): a long host sleep is not silence

**Site:** `cli/test/watcher-stall-host-sleep.test.mjs` → `test('(a)(b) a long host sleep is not silence at the first pass after wake; …')` (near line 252); code under test `cli/templates/scripts/autonomous-watcher.sh` → `check_stalled_runs`.

**Failing test:** `cli/test/watcher-stall-host-sleep.test.mjs` — `(a)(b) a long host sleep is not silence at the first pass after wake; a full awake window after it still kills`

**Failure (log):**

```
        not ok 1346 - (a)(b) a long host sleep is not silence at the first pass after wake; a full awake window after it still kills
```

**Diagnosis.** The log carries no assertion text for this test: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`. Class: first round — no earlier log to compare against.

The branch changes the watcher (`cli/templates/scripts/autonomous-watcher.sh`, mirrored in `scripts/autonomous-watcher.sh`) only in: `spawn_engine`'s launch subshell (`export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, the `log_offset` byte count, `log_stopped_background_tasks` before `record_run_analytics`); `classify_run_exit`'s zero-exit arm, which reads `hr_run_ledger_state` (`cli/templates/scripts/lib/harness-run-lib.sh`) and, with no ledger, keeps `completed` and adds one `classify: '<branch>' has no readable ledger` watcher-log line; `launch_run` / `begin_pause_resume` clearing `pause_reason` / `pause_note_stale`; `spawn_engine` reading `pause_note_stale` outside job mode; and `check_stalled_runs` clearing `pause_note_stale` just before its restart.

This case simulates a host sleep through the last-pass file and asserts the first pass after wake does not count the gap as silence, while a full awake window afterwards still kills. The branch's only change inside `check_stalled_runs` is the `pause_note_stale` clear before the restart's `spawn_engine`, which leaves the restart naming the note the watchdog just wrote — as before the branch; the sleep detection, the warn/kill windows and the busy-CPU gate are untouched, and the branch's header text says so (`A HUNG BACKGROUND AGENT EMITS NOTHING … exactly as before`). The file's third case, `(d) a missing or non-integer last-pass file …`, is not among the failures. A watchdog case is wall-clock driven; the run lasted 3 390 s with 2 tests cancelled, and the branch's own watcher suites passed. A bound exceeded on a loaded host fits. The failing assertion is unknown.

**Suspected shared cause:** likely the same cause as Finding 1 — the shared watcher driver on a path the branch's change does not alter in any value this test asserts.

**Fix**

- [ ] Take the failing assertion of this test and place it in one of the two arms below.
- [ ] **A time bound exceeded, or a watcher pass killed by its bound**, with every value the test asserts otherwise as expected: the branch has no defect here. Leave the code and the test unchanged — no bound raised, no assertion loosened, no case skipped.
- [ ] **An assertion on a value the branch changed** — the restart's `pause_note_stale` clear or its pause-resume clause, a registry field `launch_run` now clears, or a watcher-log line the branch added: change `check_stalled_runs` / `spawn_engine` in `cli/templates/scripts/autonomous-watcher.sh` so the asserted behaviour holds again, without undoing the wait-ceiling export or the ledger split, and carry the identical edit into `scripts/autonomous-watcher.sh`. Leave the test file unchanged.
