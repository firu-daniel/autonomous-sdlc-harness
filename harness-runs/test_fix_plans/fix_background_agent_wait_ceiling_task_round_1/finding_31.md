### 31. run analytics: a refused push is one watcher-log line

**Site:** `cli/test/watcher-run-analytics.test.mjs` → subtest `'a push origin refuses after the commits is one watcher-log line and changes no outcome'` (near line 215), inside the parent test near line 159; code under test `cli/templates/scripts/autonomous-watcher.sh` → `record_run_analytics`.

**Failing test:** `cli/test/watcher-run-analytics.test.mjs` — `a push origin refuses after the commits is one watcher-log line and changes no outcome` (subtest 3 of `the session's analytics are committed and pushed on the run's branch, and a failing step changes no outcome`)

**Failure (log):**

```
            not ok 3 - a push origin refuses after the commits is one watcher-log line and changes no outcome
```

**Diagnosis.** The log carries no assertion text for this subtest: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`. Class: first round — no earlier log to compare against.

The branch changes the watcher (`cli/templates/scripts/autonomous-watcher.sh`, mirrored in `scripts/autonomous-watcher.sh`) only in: `spawn_engine`'s launch subshell (`export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, the `log_offset` byte count, `log_stopped_background_tasks` before `record_run_analytics`); `classify_run_exit`'s zero-exit arm, which reads `hr_run_ledger_state` (`cli/templates/scripts/lib/harness-run-lib.sh`) and, with no ledger, keeps `completed` and adds one `classify: '<branch>' has no readable ledger` watcher-log line; `launch_run` / `begin_pause_resume` clearing `pause_reason` / `pause_note_stale`; and `spawn_engine` reading `pause_note_stale` outside job mode.

This subtest opens with `assert.ok(resumeBaseline, 'the resume case did not run')`, so it fails whenever Finding 30's subtest did not complete. Beyond that, it asserts a third prompt, the outcome equal to `resumeBaseline`, an added analytics commit, one push call, `origin` unmoved, `[remote rejected]` in the run log and exactly one push-warning line among the watcher-log lines it added — a count filtered by that warning text, which the branch's new `classify:` line does not carry. The run lasted 3 390 s with 2 tests cancelled; a bound exceeded on a loaded host fits. The failing assertion is unknown.

**Suspected shared cause:** likely the same cause as Finding 30 — this subtest requires the `resumeBaseline` Finding 30's subtest sets.

**Fix**

- [ ] Take the failing assertion of this subtest and place it in one of the two arms below.
- [ ] **`the resume case did not run`, a time bound exceeded, or a watcher pass killed by its bound**, with every value this subtest asserts otherwise as expected: the branch has no defect here. Leave the code and the test unchanged — no bound raised, no assertion loosened, no case skipped.
- [ ] **An assertion on a value the branch changed** — the push-warning count, the outcome via the ledger split, or a commit as affected by `log_stopped_background_tasks` running first: change `cli/templates/scripts/autonomous-watcher.sh` (and `cli/templates/scripts/lib/harness-run-lib.sh` where the value comes from `hr_run_ledger_state`) so the asserted behaviour holds again, without undoing the wait-ceiling export or the ledger split, and carry the identical edit into `scripts/autonomous-watcher.sh` / `scripts/lib/harness-run-lib.sh`. Leave the test file unchanged.
