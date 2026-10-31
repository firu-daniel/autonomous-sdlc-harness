### 10. placeholder host: the manifest lists exactly the absent paths

**Site:** `cli/test/watcher-placeholder-host.test.mjs` → `test('after a launch the manifest lists exactly the absent exact denyWrite and --add-dir .mcp.json paths', …)` (near line 236); code under test `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine` (the `hr_placeholder_manifest_write` call) and `placeholder_manifests_var`.

**Failing test:** `cli/test/watcher-placeholder-host.test.mjs` — `after a launch the manifest lists exactly the absent exact denyWrite and --add-dir .mcp.json paths`

**Failure (log):**

```
        not ok 1233 - after a launch the manifest lists exactly the absent exact denyWrite and --add-dir .mcp.json paths
```

**Diagnosis.** The log carries no assertion text for this test: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`. Class: first round — no earlier log to compare against.

The branch changes the watcher (`cli/templates/scripts/autonomous-watcher.sh`, mirrored in `scripts/autonomous-watcher.sh`) only in: `spawn_engine`'s launch subshell (`export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, the `log_offset` byte count, `log_stopped_background_tasks` before `record_run_analytics`); `classify_run_exit`'s zero-exit arm, which reads `hr_run_ledger_state` (`cli/templates/scripts/lib/harness-run-lib.sh`) and, with no ledger, keeps `completed` and adds one `classify: '<branch>' has no readable ledger` watcher-log line; `launch_run` / `begin_pause_resume` clearing `pause_reason` / `pause_note_stale`; and `spawn_engine` reading `pause_note_stale` outside job mode.

This case launches on a placeholder host and asserts the manifest's path list. The branch's additions to `spawn_engine` sit beside the manifest write and do not change the set of paths written, nor the manifest's name or place. The run lasted 3 390 s with 2 tests cancelled, and the branch's own watcher suites passed; a scaled `TICK_TIMEOUT_MS` exceeded on a loaded host fits. The failing assertion is unknown.

**Suspected shared cause:** likely the same cause as Finding 1 — the shared watcher driver on a path the branch's change does not alter.

**Fix**

- [ ] Take the failing assertion of this test and place it in one of the two arms below.
- [ ] **A time bound exceeded, or a watcher pass killed by its bound**, with every value the test asserts otherwise as expected: the branch has no defect here. Leave the code and the test unchanged — no bound raised, no assertion loosened, no case skipped.
- [ ] **An assertion on a value the branch changed** — the manifest's contents as `spawn_engine` writes them now, the `classify: … has no readable ledger` line, `pause_reason` / `pause_note_stale`, the session's environment, or `log_stopped_background_tasks` running before `record_run_analytics`: change `cli/templates/scripts/autonomous-watcher.sh` (and `cli/templates/scripts/lib/harness-run-lib.sh` where the value comes from `hr_run_ledger_state`) so the asserted behaviour holds again, without undoing the wait-ceiling export or the ledger split, and carry the identical edit into `scripts/autonomous-watcher.sh` / `scripts/lib/harness-run-lib.sh`. Leave the test file unchanged.

## Already passing

- **(a)** Named test `after a launch the manifest lists exactly the absent exact denyWrite and --add-dir .mcp.json paths`; file run: `cli/test/watcher-placeholder-host.test.mjs`.
- **(b)** `npm test --workspace cli -- test/watcher-placeholder-host.test.mjs`, from the repository root, in the foreground: `ok 2 - after a launch the manifest lists exactly the absent exact denyWrite and --add-dir .mcp.json paths` (`duration_ms: 22969.544167`; rerun on a later dispatch: `ok 2`, `duration_ms: 17742.110916`, `# pass 29`, `# fail 0`); file summary `# tests 29`, `# pass 29`, `# fail 0`, `# cancelled 0`. The Fix section's first arm holds: no assertion on a value the branch changed fails, consistent with a time bound exceeded on the loaded gate host.
- **(c)** No code file was edited; the only write is this record.
