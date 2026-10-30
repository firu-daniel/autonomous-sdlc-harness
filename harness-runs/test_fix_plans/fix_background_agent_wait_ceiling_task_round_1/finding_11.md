### 11. placeholder host: a second queued run is deferred at cap 1

**Site:** `cli/test/watcher-placeholder-host.test.mjs` → `test('a second queued run is deferred at cap 1, …')` (near line 268); code under test `cli/templates/scripts/autonomous-watcher.sh` → `placeholder_manifests_var` and the cap check of `tick`.

**Failing test:** `cli/test/watcher-placeholder-host.test.mjs` — `a second queued run is deferred at cap 1, with the bubblewrap host line logged once`

**Failure (log):**

```
        not ok 1234 - a second queued run is deferred at cap 1, with the bubblewrap host line logged once
```

**Diagnosis.** The log carries no assertion text for this test: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`. Class: first round — no earlier log to compare against.

The branch changes the watcher (`cli/templates/scripts/autonomous-watcher.sh`, mirrored in `scripts/autonomous-watcher.sh`) only in: `spawn_engine`'s launch subshell (`export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, the `log_offset` byte count, `log_stopped_background_tasks` before `record_run_analytics`); `classify_run_exit`'s zero-exit arm, which reads `hr_run_ledger_state` (`cli/templates/scripts/lib/harness-run-lib.sh`) and, with no ledger, keeps `completed` and adds one `classify: '<branch>' has no readable ledger` watcher-log line; `launch_run` / `begin_pause_resume` clearing `pause_reason` / `pause_note_stale`; and `spawn_engine` reading `pause_note_stale` outside job mode.

This case queues two drops on a placeholder host and asserts the second deferred at the resolved cap of 1 and the bubblewrap host line logged once. The branch does not touch the cap, the deferral or that host line. The run lasted 3 390 s with 2 tests cancelled, and the branch's own watcher suites passed; a scaled `TICK_TIMEOUT_MS` exceeded on a loaded host fits. The failing assertion is unknown.

**Suspected shared cause:** likely the same cause as Finding 1 — the shared watcher driver on a path the branch's change does not alter.

**Fix**

- [ ] Take the failing assertion of this test and place it in one of the two arms below.
- [ ] **A time bound exceeded, or a watcher pass killed by its bound**, with every value the test asserts otherwise as expected: the branch has no defect here. Leave the code and the test unchanged — no bound raised, no assertion loosened, no case skipped.
- [ ] **An assertion on a value the branch changed** — the `classify: … has no readable ledger` line, `pause_reason` / `pause_note_stale`, the session's environment, or `log_stopped_background_tasks` running before `record_run_analytics`: change `cli/templates/scripts/autonomous-watcher.sh` (and `cli/templates/scripts/lib/harness-run-lib.sh` where the value comes from `hr_run_ledger_state`) so the asserted behaviour holds again, without undoing the wait-ceiling export or the ledger split, and carry the identical edit into `scripts/autonomous-watcher.sh` / `scripts/lib/harness-run-lib.sh`. Leave the test file unchanged.

## Already passing

- **(a)** Named test `a second queued run is deferred at cap 1, with the bubblewrap host line logged once`; file run: `cli/test/watcher-placeholder-host.test.mjs`.
- **(b)** Command `npm test --workspace cli -- test/watcher-placeholder-host.test.mjs`, from the repository root, in the foreground: `ok 3 - a second queued run is deferred at cap 1, with the bubblewrap host line logged once` (`duration_ms: 15472.720708` on the latest run); file totals `# tests 29`, `# pass 29`, `# fail 0`, `# cancelled 0`. No assertion failed, so neither Fix arm applies.
- **(c)** No code file was edited; this section is the only write.
