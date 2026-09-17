### Task 3 — Declare the `park_loop` notification and status in the notifier and the registry readers

**Goal:** Give every outer-loop script that enumerates the notification vocabulary or the registry status vocabulary the new word `park_loop`, so the loop guard's notification arrives under its own title and a run held by the guard is neither swept away nor treated as idle by a restart.

**Depends on:** Task 2, which emits `notify park_loop "$branch" "$log_path" "<c> no-progress resumes — create <clar_dir>/PARK_LOOP_CLEAR to clear"` and records the registry status `park_loop` for a run whose resumes made no progress; the run's working copy is kept, and the watcher resumes it again once an operator creates `<state_dir>/clarifications/<branch>/PARK_LOOP_CLEAR` in it. This task declares that word and that status for the readers; it changes nothing in the watcher.

### Targets

- `cli/templates/scripts/autonomous-notify.sh` — the `THE EVENT VOCABULARY IS A CONTRACT` header list, the `Usage:` block, the usage error line, and the event `case`.
- `cli/templates/scripts/cleanup-merged-worktrees.sh` — the ACTIVE RUN rule in the header, its REPRO note, and the `jq` select in the active-run check.
- `cli/templates/scripts/restart-watcher.sh` — `WHAT COUNTS AS IN FLIGHT`, its REPRO note, and the `jq` select.
- `cli/src/commands/doctor.ts` — the `TEST_NOTIFICATION_EVENT` doc comment ("the notifier's six lifecycle words") and the `DOCTOR_USAGE` array's line `` `test send carries the event word ${TEST_NOTIFICATION_EVENT}, which is none of the watcher's six` `` (the count is split from its noun across two array elements, the next one opening `"lifecycle words, so it cannot be read as a real run's outcome. …"`).
- `cli/test/doctor.test.mjs` — the doc comment above `TEST_EVENT` (`/** The event word the test send carries — none of the watcher's six, so it reads as no run's outcome. */`).

**Work:**

- [ ] `autonomous-notify.sh`: the vocabulary becomes seven words. Add `park_loop  the watcher stopped resuming a parked run whose resumes made no progress — idle until an operator clears it` to the header list (and change "one of these six words" accordingly), add `park_loop` to the `Usage:` event line and to the `usage:` error string, and add a `park_loop)` arm: `TITLE="[$slug] Run stuck in a park loop — $BRANCH"`, `MESSAGE="Run '$BRANCH' parked again after resumes that made no progress; the watcher has stopped resuming it."` The detail argument Task 2 passes is appended by the existing `[ -n "$DETAIL" ]` line.
- [ ] `cleanup-merged-worktrees.sh`: a `park_loop` record is an ACTIVE RUN — add it to the header sentence (it owns a working copy the watcher returns to once cleared), to the REPRO note that lists the protected statuses, and to the `select(...)` beside `running`, `parked` and `paused`.
- [ ] `restart-watcher.sh`: add `park_loop` beside `parked` in `WHAT COUNTS AS IN FLIGHT`, in the REPRO note, and in the `select(...)`, so the set of "not yet finished" records stays uniform across the two scripts that read it.
- [ ] `cli/src/commands/doctor.ts` and `cli/test/doctor.test.mjs`: every statement of the lifecycle-word count becomes seven. In `doctor.ts`, the doc comment above `TEST_NOTIFICATION_EVENT` says "seven lifecycle words" and its list gains `park_loop` after `resumed`; the `DOCTOR_USAGE` element ending "none of the watcher's six" ends "none of the watcher's seven" instead (the following element is unchanged — keep the line within the block's existing wrap width, re-wrapping only these two elements if it overflows). In `doctor.test.mjs`, the `TEST_EVENT` doc comment says "none of the watcher's seven". Changing the usage literal changes no behaviour: `doctor-test` is still none of the words, and no test asserts the count.

**Verification:**

- `bash -n` exits 0 on all three scripts.
- `HARNESS_PUSH_CMD=<recorder> bash cli/templates/scripts/autonomous-notify.sh park_loop feat/x` (a recorder as in that script's REPRO) records a title containing `Run stuck in a park loop — feat/x` and exits 0; `bash cli/templates/scripts/autonomous-notify.sh` with no arguments still exits 2 and its usage line lists `park_loop`.
- `grep -n 'status == "parked"' cli/templates/scripts/cleanup-merged-worktrees.sh cli/templates/scripts/restart-watcher.sh` shows `park_loop` on every matched line.
- `bash scripts/typecheck.sh` and `bash scripts/test.sh` exit 0 (the test run builds `cli/dist` through the package's `pretest`).
- After that build, `node cli/dist/cli.js doctor --help` prints "none of the watcher's seven" followed by "lifecycle words", and never "watcher's six".
- `grep -rn "watcher's six\|six lifecycle words" cli/src cli/test` prints nothing. (`docs/cli.md` carries the same count and is Task 12's; it is out of this task's roots so this task ships independently.)

**Deviations from plan:**

- Verification `bash scripts/test.sh` exits 1, not 0: the sole failure is gate `6a no machine paths`, whose hits are this worktree's untracked `.git` pointer file and the already-tracked `harness-runs/improvement_observations/feat_readme_summary_compact_llms_txt.md`, neither touched by this task; gate `4 npm test` and the other 12 gates pass.
