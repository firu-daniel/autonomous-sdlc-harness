### 40. run profile: the opt-out profile launches

**Site:** `cli/test/watcher-run-profile.test.mjs` → `test('the opt-out profile init renders from sandbox.optOut launches', …)` (near line 386); code under test `cli/templates/scripts/autonomous-watcher.sh` → `run_profile_check`, `spawn_engine`.

**Failing test:** `cli/test/watcher-run-profile.test.mjs` — `the opt-out profile init renders from sandbox.optOut launches`

**Failure (log):**

```
        not ok 1330 - the opt-out profile init renders from sandbox.optOut launches
```

**Diagnosis.** The log carries no assertion text for this test: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`. Class: first round — no earlier log to compare against.

The branch changes the watcher (`cli/templates/scripts/autonomous-watcher.sh`, mirrored in `scripts/autonomous-watcher.sh`) only in: `spawn_engine`'s launch subshell (`export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, the `log_offset` byte count, `log_stopped_background_tasks` before `record_run_analytics`); `classify_run_exit`'s zero-exit arm, which reads `hr_run_ledger_state` (`cli/templates/scripts/lib/harness-run-lib.sh`) and, with no ledger, keeps `completed` and adds one `classify: '<branch>' has no readable ledger` watcher-log line; `launch_run` / `begin_pause_resume` clearing `pause_reason` / `pause_note_stale`; and `spawn_engine` reading `pause_note_stale` outside job mode.

This case regenerates the profile with `init --force` from a `sandbox.optOut` config and asserts the drop launches on it. The branch changes neither `init`'s rendering nor `run_profile_check`. The file's later cases (`a clone run's exit syncs its branch into the main checkout`, …) are not among the failures. The run lasted 3 390 s with 2 tests cancelled, and the branch's own watcher suites passed; a scaled bound exceeded on a loaded host fits — this case also runs `init --force` before its pass. The failing assertion is unknown.

**Suspected shared cause:** likely the same cause as Finding 1 — the shared watcher driver on a path the branch's change does not alter.

**Fix**

- [ ] Take the failing assertion of this test and place it in one of the two arms below.
- [ ] **A time bound exceeded, or a watcher pass killed by its bound**, with every value the test asserts otherwise as expected: the branch has no defect here. Leave the code and the test unchanged — no bound raised, no assertion loosened, no case skipped.
- [ ] **An assertion on a value the branch changed** — the launch vector or environment `spawn_engine` builds, the `classify: … has no readable ledger` line, or `pause_reason` / `pause_note_stale`: change `cli/templates/scripts/autonomous-watcher.sh` (and `cli/templates/scripts/lib/harness-run-lib.sh` where the value comes from it) so the asserted behaviour holds again, without undoing the wait-ceiling export or the ledger split, and carry the identical edit into `scripts/autonomous-watcher.sh` / `scripts/lib/harness-run-lib.sh`. Leave the test file unchanged.
