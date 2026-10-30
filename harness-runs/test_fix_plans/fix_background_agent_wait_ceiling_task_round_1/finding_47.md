### 47. stall reset: the suite file reported as failed

**Site:** `cli/test/watcher-stall-reset-payloads.test.mjs` — the file as a whole (its first case is `test('an honest hung run resumes: the edit discarded, the branch unmoved, the note written', …)` near line 432).

**Failing test:** `cli/test/watcher-stall-reset-payloads.test.mjs` — `cli/test/watcher-stall-reset-payloads.test.mjs` (the file-level entry the runner reports for the file itself)

**Failure (log):**

```
        not ok 129 - cli/test/watcher-stall-reset-payloads.test.mjs
```

**Diagnosis.** `node --test` runs each test file in its own process and reports a file-level `not ok` for the file itself, here numbered 129 out of sequence with the per-test numbers. The log carries no text for it: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`. Whether this line is only the roll-up of Findings 45 and 46, or also marks the file's process failing or one of the run's 2 cancellations (`# cancelled 2`), is not recorded. Class: first round — no earlier log to compare against.

The branch changes nothing in this file, nor in the shared driver `cli/test/helpers/watcher.mjs`; its watcher changes on this file's path are those listed in Findings 45 and 46 — chiefly the `pause_note_stale` clear in `check_stalled_runs` and the now-local `pause_note_stale` read in `spawn_engine` — neither of which changes what the stall reset refuses or resumes.

**Suspected shared cause:** likely the same cause as Finding 45 — a file-level failure that carries the two failing cases of the same file.

**Fix**

- [ ] Take the file-level failure of this suite and place it in one of the arms below.
- [ ] **A roll-up of the file's failing cases only**: nothing here beyond Findings 45 and 46; no separate code change.
- [ ] **The file's process failing or a case cancelled by a time bound**, with the file's assertions otherwise as expected: the branch has no defect here. Leave the code and the test unchanged — no bound raised, no assertion loosened, no case skipped.
- [ ] **A file-level error caused by a value the branch changed** (an unhandled rejection or a leftover process from a stall session whose shape the branch altered — the restart's `pause_note_stale` handling, the `log_stopped_background_tasks` call, the `log_offset` count, or the session environment in `spawn_engine`): fix `cli/templates/scripts/autonomous-watcher.sh` so the session ends as before, and carry the identical edit into `scripts/autonomous-watcher.sh`. Leave the test file unchanged.
