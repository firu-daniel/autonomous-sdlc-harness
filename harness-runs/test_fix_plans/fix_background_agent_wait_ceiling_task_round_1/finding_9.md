### 9. placeholder host: a planted .git/commondir refuses the resume

**Site:** `cli/test/watcher-placeholder-host.test.mjs` → `test('a planted .git/commondir in the clone refuses the resume', …)` (near line 203); code under test `cli/templates/scripts/autonomous-watcher.sh` → `placeholder_manifests_var`, `spawn_engine` (the `hr_placeholder_manifest_write` branch).

**Failing test:** `cli/test/watcher-placeholder-host.test.mjs` — `a planted .git/commondir in the clone refuses the resume`

**Failure (log):**

```
        not ok 1232 - a planted .git/commondir in the clone refuses the resume
```

**Diagnosis.** The log carries no assertion text for this test: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`. Class: first round — no earlier log to compare against.

The branch changes the watcher (`cli/templates/scripts/autonomous-watcher.sh`, mirrored in `scripts/autonomous-watcher.sh`) only in: `spawn_engine`'s launch subshell (`export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, the `log_offset` byte count, `log_stopped_background_tasks` before `record_run_analytics`); `classify_run_exit`'s zero-exit arm, which reads `hr_run_ledger_state` (`cli/templates/scripts/lib/harness-run-lib.sh`) and, with no ledger, keeps `completed` and adds one `classify: '<branch>' has no readable ledger` watcher-log line; `launch_run` / `begin_pause_resume` clearing `pause_reason` / `pause_note_stale`; and `spawn_engine` reading `pause_note_stale` outside job mode.

This case plants a `.git/commondir` in a placeholder-host clone and asserts the resume is refused before any launch. The refusal is the launch check ahead of the session; the branch does not touch the placeholder-host manifest code, the clone checks or the refusal path. Other cases of this file are not among the failures; the run lasted 3 390 s with 2 tests cancelled, and the branch's own watcher suites passed. A scaled bound (`TICK_TIMEOUT_MS` in `cli/test/helpers/watcher.mjs`) exceeded on a loaded host fits. The failing assertion is unknown.

**Suspected shared cause:** likely the same cause as Finding 1 — the shared watcher driver on a path the branch's change does not alter.

**Fix**

- [ ] Take the failing assertion of this test and place it in one of the two arms below.
- [ ] **A time bound exceeded, or a watcher pass killed by its bound**, with every value the test asserts otherwise as expected: the branch has no defect here. Leave the code and the test unchanged — no bound raised, no assertion loosened, no case skipped.
- [ ] **An assertion on a value the branch changed** — the `classify: … has no readable ledger` line, `pause_reason` / `pause_note_stale` (including the pause-resume clause `spawn_engine` now builds outside job mode), the session's environment, or `log_stopped_background_tasks` running before `record_run_analytics`: change `cli/templates/scripts/autonomous-watcher.sh` (and `cli/templates/scripts/lib/harness-run-lib.sh` where the value comes from `hr_run_ledger_state`) so the asserted behaviour holds again, without undoing the wait-ceiling export or the ledger split, and carry the identical edit into `scripts/autonomous-watcher.sh` / `scripts/lib/harness-run-lib.sh`. Leave the test file unchanged.

## Already passing

- **(a)** Named test `a planted .git/commondir in the clone refuses the resume`; file run: `cli/test/watcher-placeholder-host.test.mjs`.
- **(b)** Command: `npm test --workspace cli -- test/watcher-placeholder-host.test.mjs` (from the repository root, foreground). Named test result: `ok 1 - a planted .git/commondir in the clone refuses the resume` (duration_ms 18013; re-run on a later dispatch: duration_ms 21827). File summary, both runs: `# tests 29`, `# pass 29`, `# fail 0`, `# cancelled 0`. No failing assertion reproduced, so the failure falls in the first Fix arm (a time bound on a loaded host); no bound raised, no assertion loosened.
- **(c)** No code file was edited; this record is the only write.
