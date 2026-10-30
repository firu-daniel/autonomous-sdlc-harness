### 30. run analytics: a resume adding no session adds no commit

**Site:** `cli/test/watcher-run-analytics.test.mjs` → subtest `'a resume that adds no session adds no analytics commit and pushes nothing'` (near line 199), inside the parent test near line 159; code under test `cli/templates/scripts/autonomous-watcher.sh` → `record_run_analytics`, `spawn_engine`.

**Failing test:** `cli/test/watcher-run-analytics.test.mjs` — `a resume that adds no session adds no analytics commit and pushes nothing` (subtest 2 of `the session's analytics are committed and pushed on the run's branch, and a failing step changes no outcome`)

**Failure (log):**

```
            not ok 2 - a resume that adds no session adds no analytics commit and pushes nothing
```

**Diagnosis.** The log carries no assertion text for this subtest: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`. Class: first round — no earlier log to compare against.

The branch changes the watcher (`cli/templates/scripts/autonomous-watcher.sh`, mirrored in `scripts/autonomous-watcher.sh`) only in: `spawn_engine`'s launch subshell (`export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, the `log_offset` byte count, `log_stopped_background_tasks` before `record_run_analytics`); `classify_run_exit`'s zero-exit arm, which reads `hr_run_ledger_state` (`cli/templates/scripts/lib/harness-run-lib.sh`) and, with no ledger, keeps `completed` and adds one `classify: '<branch>' has no readable ledger` watcher-log line; `launch_run` / `begin_pause_resume` clearing `pause_reason` / `pause_note_stale`; and `spawn_engine` reading `pause_note_stale` outside job mode.

This subtest parks the clone, resumes it with a stub that prints no session, and asserts a second prompt, no new analytics commit, no push, and a non-`failed` outcome, which it stores as `resumeBaseline` for subtests 3–5. It reads the analytics commits subtest 1 made, so it depends on Finding 29's subtest having left the clone in its asserted state. A park resume is a clarification resume, not a pause resume, so the branch's `pause_note_stale` read does not apply to it. The run lasted 3 390 s with 2 tests cancelled, and the branch's own watcher suites passed; a scaled bound exceeded on a loaded host fits. The failing assertion is unknown.

**Suspected shared cause:** likely the same cause as Finding 29 — this subtest builds on the clone state Finding 29's subtest leaves behind.

**Fix**

- [ ] Take the failing assertion of this subtest and place it in one of the two arms below.
- [ ] **A time bound exceeded, a watcher pass killed by its bound, or a precondition Finding 29's subtest failed to leave**, with every value this subtest asserts otherwise as expected: the branch has no defect here. Leave the code and the test unchanged — no bound raised, no assertion loosened, no case skipped.
- [ ] **An assertion on a value the branch changed** — a commit or push from the resume as affected by `log_stopped_background_tasks` running first, the outcome via the ledger split, or a resume clause: change `cli/templates/scripts/autonomous-watcher.sh` (and `cli/templates/scripts/lib/harness-run-lib.sh` where the value comes from `hr_run_ledger_state`) so the asserted behaviour holds again, without undoing the wait-ceiling export or the ledger split, and carry the identical edit into `scripts/autonomous-watcher.sh` / `scripts/lib/harness-run-lib.sh`. Leave the test file unchanged.
