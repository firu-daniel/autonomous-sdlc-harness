### 16. remote dispatch: a remote task drop is dispatched, never spawned

**Site:** `cli/test/watcher-remote-dispatch.test.mjs` → `test('a remote task drop is committed, pushed and dispatched, never spawned', …)` (near line 149); code under test `cli/templates/scripts/autonomous-watcher.sh` → `launch_remote_run`.

**Failing test:** `cli/test/watcher-remote-dispatch.test.mjs` — `a remote task drop is committed, pushed and dispatched, never spawned`

**Failure (log):**

```
        not ok 1257 - a remote task drop is committed, pushed and dispatched, never spawned
```

**Diagnosis.** The log carries no assertion text for this test: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`. Class: first round — no earlier log to compare against.

The branch changes the watcher (`cli/templates/scripts/autonomous-watcher.sh`, mirrored in `scripts/autonomous-watcher.sh`) only in `spawn_engine`'s launch subshell, `classify_run_exit`'s zero-exit arm (`hr_run_ledger_state`), `launch_run` / `begin_pause_resume` / `check_stalled_runs` clearing `pause_reason` / `pause_note_stale`, `run_job`'s job-mode pause-note decision and its new `unfinished)` arm, and `hr_remote_status_write` (`cli/templates/scripts/lib/harness-run-lib.sh`) writing `pause_note_stale` into the bundle. A remote drop goes through `launch_remote_run`, which calls neither `spawn_engine` nor `classify_run_exit`, and dispatch writes no `remote_status.json`; nothing the branch changed is on this test's path. The file's first five cases in file order failed and its ten later cases are not among the failures — the same early-cases-only shape the other failing watcher suites show — while the branch's own `cli/test/watcher-remote-job.test.mjs` passed. The run lasted 3 390 s with 2 tests cancelled; a scaled bound (`TICK_TIMEOUT_MS` in `cli/test/helpers/watcher.mjs`) exceeded on a loaded host fits. The failing assertion is unknown.

**Suspected shared cause:** likely the same cause as Finding 1 — the shared watcher driver, here on a path the branch does not touch at all.

**Fix**

- [ ] Take the failing assertion of this test and place it in one of the two arms below.
- [ ] **A time bound exceeded, or a watcher pass killed by its bound**, with every value the test asserts otherwise as expected: the branch has no defect here. Leave the code and the test unchanged — no bound raised, no assertion loosened, no case skipped.
- [ ] **An assertion on a value the branch changed** — a registry field `launch_run` or `hr_remote_status_write` now writes (`pause_reason`, `pause_note_stale`), or a watcher-log line the branch added: change `cli/templates/scripts/autonomous-watcher.sh` and/or `cli/templates/scripts/lib/harness-run-lib.sh` so the asserted dispatch behaviour holds again, without undoing the wait-ceiling export or the ledger split, and carry the identical edit into `scripts/autonomous-watcher.sh` / `scripts/lib/harness-run-lib.sh`. Leave the test file unchanged.
