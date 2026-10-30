### 2. keep-awake: the driver's default probe is silent

**Site:** `cli/test/watcher-keep-awake.test.mjs` → `test('the driver\'s default probe is silent: …')` (near line 306); code under test `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine` and `classify_run_exit`.

**Failing test:** `cli/test/watcher-keep-awake.test.mjs` — `the driver's default probe is silent: off, no keep-awake line, and an exit 3 is failed as under a hold`

**Failure (log):**

```
        not ok 1200 - the driver's default probe is silent: off, no keep-awake line, and an exit 3 is failed as under a hold
```

**Diagnosis.** The log carries no assertion text for this test: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`. Class: first round — no earlier log to compare against.

The branch changes the watcher (`cli/templates/scripts/autonomous-watcher.sh`, mirrored in `scripts/autonomous-watcher.sh`) only in: `spawn_engine`'s launch subshell (`export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, the `log_offset` byte count, `log_stopped_background_tasks` before `record_run_analytics`); `classify_run_exit`'s zero-exit arm, which reads `hr_run_ledger_state` (`cli/templates/scripts/lib/harness-run-lib.sh`) and, with no ledger, keeps `completed` and adds one `classify: '<branch>' has no readable ledger` watcher-log line; `launch_run` / `begin_pause_resume` clearing `pause_reason` / `pause_note_stale`; and `spawn_engine` reading `pause_note_stale` outside job mode.

This test launches a stub ending `exit 3` under the driver's default (unsupported-host) keep-awake probe and asserts `keep_awake: off`, `status: failed`, no `keep-awake:` watcher-log line and no `caffeinate` / `systemd-inhibit` record. A non-zero exit never reaches the zero-exit arm, and none of the added log lines contains `keep-awake:`. The branch's own watcher suites driving the same launch path passed in this run, which lasted 3 390 s with 2 tests cancelled; a scaled bound (`TICK_TIMEOUT_MS` in `cli/test/helpers/watcher.mjs`) exceeded on a loaded host fits. The failing assertion is unknown.

**Suspected shared cause:** likely the same cause as Finding 1 — the same fixture and an identical non-zero launch, on a path the branch's change does not alter.

**Fix**

- [ ] Take the failing assertion of this test and place it in one of the two arms below.
- [ ] **A time bound exceeded, or a watcher pass killed by its bound**, with every value the test asserts otherwise as expected: the branch has no defect here. Leave the code and the test unchanged — no bound raised, no assertion loosened, no case skipped.
- [ ] **An assertion on a value the branch changed** — the `classify: … has no readable ledger` line, `pause_reason` / `pause_note_stale`, the pause-resume clause, the session's environment, or `log_stopped_background_tasks` running before `record_run_analytics`: change `cli/templates/scripts/autonomous-watcher.sh` (and `cli/templates/scripts/lib/harness-run-lib.sh` where the value comes from `hr_run_ledger_state`) so the asserted behaviour holds again, without undoing the wait-ceiling export or the ledger split, and carry the identical edit into `scripts/autonomous-watcher.sh` / `scripts/lib/harness-run-lib.sh`. Leave the test file unchanged.

## Already passing

- **(a)** Named test `the driver's default probe is silent: off, no keep-awake line, and an exit 3 is failed as under a hold`; file run `cli/test/watcher-keep-awake.test.mjs`.
- **(b)** `npm test --workspace cli -- test/watcher-keep-awake.test.mjs`, from the repository root, foreground: `ok 3 - the driver's default probe is silent: off, no keep-awake line, and an exit 3 is failed as under a hold` (duration_ms 9808.7 on the first run, 9659.4 on a re-dispatch rerun); both runs' file summary `# tests 9`, `# pass 9`, `# fail 0`, `# cancelled 0`. The test is a top-level `test(...)`, so its own `ok` line separates it from the others. This fits the Fix list's first arm (a time bound exceeded on a loaded host). It is not proof, because the round-1 log does not record which assertion failed.
- **(c)** No code file and no test file was edited; this section is the only write.
