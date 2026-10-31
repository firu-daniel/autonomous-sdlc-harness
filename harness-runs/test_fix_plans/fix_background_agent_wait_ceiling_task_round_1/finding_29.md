### 29. run analytics: a launch commits both analytics files and pushes

**Site:** `cli/test/watcher-run-analytics.test.mjs` → subtest `'a launch commits run-analytics.json then run-analytics.md on the branch, synced to the main checkout and pushed'` (near line 163), inside the parent `test('the session\'s analytics are committed and pushed on the run\'s branch, …')` (near line 159); code under test `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine` (`log_stopped_background_tasks` then `record_run_analytics`) and `record_run_analytics`.

**Failing test:** `cli/test/watcher-run-analytics.test.mjs` — `a launch commits run-analytics.json then run-analytics.md on the branch, synced to the main checkout and pushed` (subtest 1 of `the session's analytics are committed and pushed on the run's branch, and a failing step changes no outcome`)

**Failure (log):**

```
            not ok 1 - a launch commits run-analytics.json then run-analytics.md on the branch, synced to the main checkout and pushed
```

**Diagnosis.** The log carries no assertion text for this subtest: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`. Class: first round — no earlier log to compare against.

The branch changes the watcher (`cli/templates/scripts/autonomous-watcher.sh`, mirrored in `scripts/autonomous-watcher.sh`) only in: `spawn_engine`'s launch subshell (`export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, the `log_offset` byte count, and a new `log_stopped_background_tasks` call placed immediately before `record_run_analytics`); `classify_run_exit`'s zero-exit arm, which reads `hr_run_ledger_state` (`cli/templates/scripts/lib/harness-run-lib.sh`) and, with no ledger, keeps `completed` and adds one `classify: '<branch>' has no readable ledger` watcher-log line; `launch_run` / `begin_pause_resume` clearing `pause_reason` / `pause_note_stale`; and `spawn_engine` reading `pause_note_stale` outside job mode.

This subtest runs the real analytics hook and asserts a clone copy, one prompt, exactly two analytics commits in the order `run-analytics.md` over `run-analytics.json`, the main checkout and `origin` at the same tip, no push warning, a non-`failed` status and exactly two notifications (`launched` plus one outcome). `log_stopped_background_tasks` always returns 0, writes nothing to the branch and only logs when the run log carries the CLI's stopped-agents line, which the stub never prints; it does not change `record_run_analytics`'s commits or the classification. The shared driver itself names this suite's real analytics commits as "enough to push a pass past its bound under a loaded host" (`cli/test/helpers/watcher.mjs`, choice 6), and the run lasted 3 390 s with 2 tests cancelled while the branch's own watcher suites passed. A bound exceeded on a loaded host fits. The failing assertion is unknown.

**Suspected shared cause:** likely the same cause as Finding 1 — the shared watcher driver on a path the branch's change does not alter in any value this subtest asserts, here with the slowest launch the driver knows.

**Fix**

- [ ] Take the failing assertion of this subtest and place it in one of the two arms below.
- [ ] **A time bound exceeded, or the watcher pass killed by its bound**, with every value the subtest asserts otherwise as expected: the branch has no defect here. Leave the code and the test unchanged — no bound raised, no assertion loosened, no case skipped.
- [ ] **An assertion on a value the branch changed** — the commit count or order, the sync to the main checkout or the push as affected by `log_stopped_background_tasks` running first, the notification count or outcome via the ledger split, or the `classify: … has no readable ledger` line: change `cli/templates/scripts/autonomous-watcher.sh` (and `cli/templates/scripts/lib/harness-run-lib.sh` where the value comes from `hr_run_ledger_state`) so the asserted behaviour holds again, without undoing the wait-ceiling export or the ledger split, and carry the identical edit into `scripts/autonomous-watcher.sh` / `scripts/lib/harness-run-lib.sh`. Leave the test file unchanged.
