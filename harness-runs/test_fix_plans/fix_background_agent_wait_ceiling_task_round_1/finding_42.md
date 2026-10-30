### 42. sandbox refusal (d): the default probe launches the stub

**Site:** `cli/test/watcher-sandbox-refusal.test.mjs` → `test('(d) the helper\'s default probe launches the stub', …)` (near line 155); code under test `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine`, `classify_run_exit`.

**Failing test:** `cli/test/watcher-sandbox-refusal.test.mjs` — `(d) the helper's default probe launches the stub`

**Failure (log):**

```
        not ok 1344 - (d) the helper's default probe launches the stub
```

**Diagnosis.** The log carries no assertion text for this test: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`. Class: first round — no earlier log to compare against. As with Finding 41, this tests the watcher's own preflight against a stubbed probe; the log carries no sandbox-refusal signature.

The branch changes the watcher (`cli/templates/scripts/autonomous-watcher.sh`, mirrored in `scripts/autonomous-watcher.sh`) only in: `spawn_engine`'s launch subshell (`export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, the `log_offset` byte count, `log_stopped_background_tasks` before `record_run_analytics`); `classify_run_exit`'s zero-exit arm, which reads `hr_run_ledger_state` (`cli/templates/scripts/lib/harness-run-lib.sh`) and, with no ledger, keeps `completed` and adds one `classify: '<branch>' has no readable ledger` watcher-log line; `launch_run` / `begin_pause_resume` clearing `pause_reason` / `pause_note_stale`; and `spawn_engine` reading `pause_note_stale` outside job mode.

This case drops a task under the driver's default probe and asserts one prompt and `status: completed`. It reaches the zero-exit arm: the clone carries no flow-progress ledger, so `hr_run_ledger_state` answers `absent` and the record stays `completed` — unless the clone does carry a `flow_progress/feat_x_progress.md` whose phases are not all `done`, which would now classify it `paused` / `unfinished`. The fixture writes no such file (no ledger appears in this suite or its driver), so the branch should not change this outcome. Cases (a), (c) and (e) of the same file are not among the failures. The run lasted 3 390 s with 2 tests cancelled, and the branch's own watcher suites passed; a scaled `TICK_TIMEOUT_MS` exceeded on a loaded host fits. The failing assertion is unknown.

**Suspected shared cause:** likely the same cause as Finding 1 — the shared watcher driver on a path the branch's change does not alter for this fixture.

**Fix**

- [ ] Take the failing assertion of this test and place it in one of the two arms below.
- [ ] **A time bound exceeded, or a watcher pass killed by its bound**, with every value the test asserts otherwise as expected: the branch has no defect here. Leave the code and the test unchanged — no bound raised, no assertion loosened, no case skipped.
- [ ] **`status` other than `completed`** — `paused` from the ledger split reading a ledger the fixture did not write, or any other value the branch changed: change `classify_run_exit` in `cli/templates/scripts/autonomous-watcher.sh` (and `hr_run_ledger_state` in `cli/templates/scripts/lib/harness-run-lib.sh` if the state it answers is wrong) so a run copy without its own ledger classifies `completed` again, without undoing the wait-ceiling export or the ledger split, and carry the identical edit into `scripts/autonomous-watcher.sh` / `scripts/lib/harness-run-lib.sh`. Leave the test file unchanged.
