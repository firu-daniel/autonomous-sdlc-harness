### 1. keep-awake (b)(c): exit 3 classified failed under a hold

**Site:** `cli/test/watcher-keep-awake.test.mjs` → `test('(b)(c) macOS: an engine exiting 3 is classified failed under a hold, …')` (near line 292); code under test `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine` and `classify_run_exit`.

**Failing test:** `cli/test/watcher-keep-awake.test.mjs` — `(b)(c) macOS: an engine exiting 3 is classified failed under a hold, and the stream carries no keep-awake text`

**Failure (log):**

```
        not ok 1199 - (b)(c) macOS: an engine exiting 3 is classified failed under a hold, and the stream carries no keep-awake text
```

**Diagnosis.** The log carries no assertion text for this test: gate 4's `gate()` in `scripts/run-gates.sh` keeps only the `not ok` lines and the last 25 lines of `npm test`, so which assertion failed is not recorded. Class: first round — no earlier log to compare against.

Against the current tree, the branch changes the watcher (`cli/templates/scripts/autonomous-watcher.sh`, mirrored in `scripts/autonomous-watcher.sh`) in these places only: `spawn_engine`'s launch subshell (`export CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`, the `log_offset` byte count, and a `log_stopped_background_tasks` call before `record_run_analytics`); `classify_run_exit`'s zero-exit arm, which now reads `hr_run_ledger_state` (`cli/templates/scripts/lib/harness-run-lib.sh`) and, with no ledger in the run copy, answers `absent`, keeps `completed` and adds one `classify: '<branch>' has no readable ledger` watcher-log line; `launch_run` and `begin_pause_resume` clearing `pause_reason` / `pause_note_stale`; and `spawn_engine` reading `pause_note_stale` outside job mode as well.

This test launches a stub ending `exit 3` under the macOS probe and asserts `keep_awake: held`, `status: failed`, the `caffeinate` holder gone and no `keep-awake` text in the `.stream.jsonl`. A non-zero exit never reaches the zero-exit arm, and none of the other changes touches the hold, the classification of `rc=3` or the stream. Its sibling `(a)(c) macOS: caffeinate waits on the engine's own pid, …` — the same fixture, probe, launch and holder assertions, differing only in the stub's exit code — is not among the failures, so it passed in this run.

The branch's own new suites driving the same launch path — `cli/test/watcher-background-wait.test.mjs`, `cli/test/watcher-ledger-classification.test.mjs`, `cli/test/watcher-remote-job.test.mjs` — passed in this run too, which lasted 3 390 s and cancelled 2 tests. A scaled time bound (`TICK_TIMEOUT_MS` in `cli/test/helpers/watcher.mjs`, or this suite's own `WAIT_MS`) exceeded on a loaded host fits every failure in this round. That is a suspicion: the failing assertion is unknown. This finding is first in the list because it is the cleanest probe of that suspicion.

**Fix**

- [ ] Take the failing assertion of this test and place it in one of the two arms below.
- [ ] **A time bound exceeded, or a watcher pass killed by its bound**, with every record, notification and log value the test asserts otherwise as expected: the branch has no defect here. Leave the code and the test unchanged — no bound raised, no assertion loosened, no case skipped.
- [ ] **An assertion on a value the branch changed** — the `classify: … has no readable ledger` line, a `pause_reason` or `pause_note_stale` cleared or set, the pause-resume clause `spawn_engine` builds, the session's environment, or `log_stopped_background_tasks` running before `record_run_analytics`: change `cli/templates/scripts/autonomous-watcher.sh` (and `cli/templates/scripts/lib/harness-run-lib.sh` where the value comes from `hr_run_ledger_state`) so the behaviour the test asserts holds again, without undoing the wait-ceiling export or the ledger split, then carry the identical edit into the self-adopted `scripts/autonomous-watcher.sh` / `scripts/lib/harness-run-lib.sh`. Leave the test file unchanged.
