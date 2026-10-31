### 14. placeholder host (2): a leftover .git/commondir is kept while live

**Site:** `cli/test/watcher-placeholder-host.test.mjs` → `test('(2) a recorded leftover .git/commondir is kept while its run is live and swept after the watchdog kill', …)` (near line 397); code under test `cli/templates/scripts/autonomous-watcher.sh` → `placeholder_manifests_var`, `check_stalled_runs`.

**Failing test:** `cli/test/watcher-placeholder-host.test.mjs` — `(2) a recorded leftover .git/commondir is kept while its run is live and swept after the watchdog kill`

**Failure (log):**

```
        not ok 1238 - (2) a recorded leftover .git/commondir is kept while its run is live and swept after the watchdog kill
```

**Diagnosis.** The log carries no assertion text for this test: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`. Class: first round — no earlier log to compare against.

The branch changes the watcher (`cli/templates/scripts/autonomous-watcher.sh`, mirrored in `scripts/autonomous-watcher.sh`) only in: `spawn_engine`'s launch subshell (`export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, the `log_offset` byte count, `log_stopped_background_tasks` before `record_run_analytics`); `classify_run_exit`'s zero-exit arm, which reads `hr_run_ledger_state` (`cli/templates/scripts/lib/harness-run-lib.sh`) and, with no ledger, keeps `completed` and adds one `classify: '<branch>' has no readable ledger` watcher-log line; `launch_run` / `begin_pause_resume` clearing `pause_reason` / `pause_note_stale`; `spawn_engine` reading `pause_note_stale` outside job mode; and `check_stalled_runs` clearing `pause_note_stale` before its restart.

This case keeps a live run past the stall watchdog's kill and asserts the leftover kept while live and swept after the kill. The only branch change on the watchdog path is the `pause_note_stale` clear before the restart, which makes the restart's pause-resume clause name the note the watchdog just wrote — what it did before the branch. A watchdog case is inherently time-bound; the run lasted 3 390 s with 2 tests cancelled, and the branch's own watcher suites passed. A scaled bound exceeded on a loaded host fits. The failing assertion is unknown.

**Suspected shared cause:** likely the same cause as Finding 1 — the shared watcher driver on a path the branch's change does not alter in any value this test asserts.

**Fix**

- [ ] Take the failing assertion of this test and place it in one of the two arms below.
- [ ] **A time bound exceeded, or a watcher pass killed by its bound**, with every value the test asserts otherwise as expected: the branch has no defect here. Leave the code and the test unchanged — no bound raised, no assertion loosened, no case skipped.
- [ ] **An assertion on a value the branch changed** — the watchdog restart's `pause_note_stale` clear or its pause-resume clause, the `classify: … has no readable ledger` line, `pause_reason`, the session's environment, or `log_stopped_background_tasks` running before `record_run_analytics`: change `cli/templates/scripts/autonomous-watcher.sh` (and `cli/templates/scripts/lib/harness-run-lib.sh` where the value comes from `hr_run_ledger_state`) so the asserted behaviour holds again, without undoing the wait-ceiling export or the ledger split, and carry the identical edit into `scripts/autonomous-watcher.sh` / `scripts/lib/harness-run-lib.sh`. Leave the test file unchanged.
