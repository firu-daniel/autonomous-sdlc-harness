### 45. stall reset: an honest hung run resumes

**Site:** `cli/test/watcher-stall-reset-payloads.test.mjs` → `test('an honest hung run resumes: the edit discarded, the branch unmoved, the note written', …)` (near line 432), asserted through `assertResumed`; code under test `cli/templates/scripts/autonomous-watcher.sh` → `check_stalled_runs` (the reset, the note, `registry_set "$b" pause_note_stale ""`, then `spawn_engine … "" 1`), and `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_run_reset_var`.

**Failing test:** `cli/test/watcher-stall-reset-payloads.test.mjs` — `an honest hung run resumes: the edit discarded, the branch unmoved, the note written`

**Failure (log):**

```
        not ok 1349 - an honest hung run resumes: the edit discarded, the branch unmoved, the note written
```

**Diagnosis.** The log carries no assertion text for this test: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`. Class: first round — no earlier log to compare against.

The branch changes the watcher (`cli/templates/scripts/autonomous-watcher.sh`, mirrored in `scripts/autonomous-watcher.sh`) only in: `spawn_engine`'s launch subshell (`export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, the `log_offset` byte count, `log_stopped_background_tasks` before `record_run_analytics`); `classify_run_exit`'s zero-exit arm, which reads `hr_run_ledger_state` (`cli/templates/scripts/lib/harness-run-lib.sh`) and, with no ledger, keeps `completed` and adds one `classify: '<branch>' has no readable ledger` watcher-log line; `launch_run` / `begin_pause_resume` clearing `pause_reason` / `pause_note_stale`; `spawn_engine` reading `pause_note_stale` outside job mode (before the branch it read it only in job mode); and `check_stalled_runs` clearing `pause_note_stale` just before its restart.

This is the one failing case that runs through the branch's local `pause_note_stale` change: the watchdog's restart is a pause resume (`spawn_engine … "" 1`), which now reads `pause_note_stale` locally. The branch clears it immediately before the restart, so the relaunch names `PAUSE_PROGRESS.md` exactly as before. `assertResumed` asserts no payload ran, a resumed record `running` with `stall_restarts` `1`, two prompts and a `resumed` notification naming `stall-watchdog restart #1`; the test adds the edit discarded, the tip unmoved, and the note matching `discarded by a reset to the last commit`. None of these reads the relaunch prompt's wording, and the fixture writes no flow-progress ledger. The file's next case, `(S1) …`, and its later cases are not among the failures. The case runs a multi-pass stall script (`localStall`); the run lasted 3 390 s with 2 tests cancelled, and the branch's own watcher suites passed. A bound exceeded on a loaded host fits. The failing assertion is unknown.

**Suspected shared cause:** likely the same cause as Finding 1 — the shared watcher driver on a path the branch's change does not alter in any value this test asserts.

**Fix**

- [ ] Take the failing assertion of this test and place it in one of the two arms below.
- [ ] **A time bound exceeded, or the stall script killed by its bound**, with every value the test asserts otherwise as expected: the branch has no defect here. Leave the code and the test unchanged — no bound raised, no assertion loosened, no case skipped.
- [ ] **An assertion on a value the branch changed** — the resumed record's `status` or `stall_restarts`, the prompt count, the `resumed` notification, or the note as affected by the `pause_note_stale` clear and the now-local `pause_note_stale` read in `spawn_engine`: change `check_stalled_runs` / `spawn_engine` in `cli/templates/scripts/autonomous-watcher.sh` so the restart behaves as the test asserts, without undoing the wait-ceiling export or the ledger split, and carry the identical edit into `scripts/autonomous-watcher.sh`. Leave the test file unchanged.
