### 38. run profile: refused on sandbox.enabled false

**Site:** `cli/test/watcher-run-profile.test.mjs` → the refusal table's row `'the base\'s sandbox.enabled false with no opt-out marker'` (near line 319), run by the loop's `test(\`the launch is refused on ${name}\`, …)` through `assertLaunchRefused`; code under test `cli/templates/scripts/autonomous-watcher.sh` → `run_profile_check`.

**Failing test:** `cli/test/watcher-run-profile.test.mjs` — `the launch is refused on the base's sandbox.enabled false with no opt-out marker`

**Failure (log):**

```
        not ok 1325 - the launch is refused on the base's sandbox.enabled false with no opt-out marker
```

**Diagnosis.** The log carries no assertion text for this test: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`. Class: first round — no earlier log to compare against.

The branch changes the watcher (`cli/templates/scripts/autonomous-watcher.sh`, mirrored in `scripts/autonomous-watcher.sh`) only in: `spawn_engine`'s launch subshell (`export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, the `log_offset` byte count, `log_stopped_background_tasks` before `record_run_analytics`); `classify_run_exit`'s zero-exit arm, which reads `hr_run_ledger_state` (`cli/templates/scripts/lib/harness-run-lib.sh`) and, with no ledger, keeps `completed` and adds one `classify: '<branch>' has no readable ledger` watcher-log line; `launch_run` / `begin_pause_resume` clearing `pause_reason` / `pause_note_stale`; and `spawn_engine` reading `pause_note_stale` outside job mode.

This case perturbs the base profile and asserts the launch refused by `run_profile_check`, before any session. A refused launch never reaches the session or the zero-exit arm, and the branch does not touch `run_profile_check`. Two of the same table's four identically-shaped cases — `the base's sandbox.failIfUnavailable false` and `an empty base file` — are not among the failures, though they run the same fixture, drop and assertion helper. The run lasted 3 390 s with 2 tests cancelled; a scaled `TICK_TIMEOUT_MS` exceeded on a loaded host fits. The failing assertion is unknown.

**Suspected shared cause:** likely the same cause as Finding 1 — the shared watcher driver on a path the branch's change does not alter, failing for one table row while identically shaped rows pass.

**Fix**

- [ ] Take the failing assertion of this test and place it in one of the two arms below.
- [ ] **A time bound exceeded, or a watcher pass killed by its bound**, with every value the test asserts otherwise as expected: the branch has no defect here. Leave the code and the test unchanged — no bound raised, no assertion loosened, no case skipped.
- [ ] **An assertion on a value the branch changed** — a registry field `launch_run` now clears, or a watcher-log line the branch added: change `cli/templates/scripts/autonomous-watcher.sh` so the asserted refusal holds again, without undoing the wait-ceiling export or the ledger split, and carry the identical edit into `scripts/autonomous-watcher.sh`. Leave the test file unchanged.
