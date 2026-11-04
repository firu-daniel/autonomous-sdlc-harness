# Task plan review — iteration 1

All four Must Fix findings from `review_0.md` are resolved in the files. Task 7 and Task 13 now use the `hr_remote_copy_tree` skip line. Task 8 and Task 14 fail FR6 on any `skipped` line. FR7's and JS1's verdicts are cut back to what their Read from columns name. Task 1 owns the defaults, and Task 7 credits Task 5 for `stall_values_unconfirmed`. The findings below are new.

## Must Fix

1. **JS3 is graded on a doctor report that never reaches the `Run the harness` step log** — `task_7_plan.md` and `task_13_plan.md`.
   Task 7 makes JS3 `pass` only when *"the log shows the stall watchdog running its job-surfaces check (`stall_job_surfaces_ok` …, the `doctor … --job-surfaces=<branch>@<commit>@<base>` report), passing, and then the reset and resume lines"*. Task 13 restates this as *"the check's passing report and its reset lines"*. But the caller in `check_stalled_runs` (`cli/templates/scripts/autonomous-watcher.sh`) runs `stall_job_surfaces_ok >>"$log_path" 2>&1`. That sends the doctor report to the per-branch run log, `<stateDir>/autonomous_logs/<branch>.log`, which the bundle carries as `run.log`. It does not go to the watcher's stdout. JS3's Read from is *"the `Run the harness` step log's watchdog lines and the run's recorded status"*. The watcher's `log` (`tee -a "$WATCHER_LOG"`) puts only two outcome lines in that step log:
   - after the check passes: `stall-watchdog: '<b>' -> reset to the last commit and resume (restart #<n>)`;
   - when the check refuses: `stall-watchdog: '<b>' -> failed (stalled <n>s, the branch's own commits change a job surface, or that could not be checked (see <log_path>))`.

   As written, a correct job never shows the report in the step log, so it can never grade `pass`. Task 13's canned answers would put the report in the step log and hide the bug. This is the story index's first `Top risks:` entry: grading the wrong evidence.

   **Fix:** In `task_7_plan.md`, grade JS3 on the step-log lines its caller prints, each cited by symbol:
   - **`pass`:** the `-> reset to the last commit and resume` line, and `status.json` `status` not `failed`.
   - **`fail`:** the `-> failed (… job surface, or that could not be checked …)` line.
   - **`not run`:** no `stall-watchdog:` line.

   The row's *"from a temporary directory"* clause is not in the step log. Either print it as a `source` line (`stall_job_surfaces_ok`'s `mktemp -d` / `cd "$scratch"`), the way FR1's `--settings` clause is printed, or read it from the artifact's `run.log` as a recorded departure. In `task_13_plan.md`, restate those lines, take them from `check_stalled_runs` at test time, and keep the doctor report out of the canned step log.

2. **SB4's route field is undefined, and no allowed value fits how the other tasks read it** — `task_1_plan.md`, with consumers `task_3_plan.md`, `task_7_plan.md`, `task_16_plan.md` and `task_17_plan.md`.
   Task 1 fixes the route field to `full-run` | `plant` | `default-branch` | `hand`. It lists arms only for JS1, JS4, SB2, RJ2 and JS3, and it states the route of every row except SB4. Each consumer then rules out a value:
   - Task 3 treats only JS1, JS4, SB2 and RJ2 as `plant`-route rows, so SB4 is not `plant`.
   - Task 7 prints every `hand`-route row as `hand step: <note>` and grades SB4 separately, so making SB4 `hand` prints it twice.
   - Task 17 maps the route to Task 16's *Taken by* column, so whatever Task 1's implementer picks becomes a documentation contract.

   Each implementer has to guess, and the guesses can disagree.

   **Fix:** In `task_1_plan.md`, state SB4's row explicitly: round step, route and arms (`-`). Either:
   - make it `plant` with arms `-`, and have `task_3_plan.md` skip a `plant` row with no arms, printing its note; or
   - add a route value for it, for example `reads-SB2`.

   Restate the choice in `task_3_plan.md`, `task_7_plan.md` (so SB4 is never printed as a hand row), `task_16_plan.md` and `task_17_plan.md`, including its *Taken by* mapping.

3. **The JS3 branch's push-and-record step has no named producer, so `teardown` can miss it** — `task_3_plan.md`, `task_5_plan.md` and `task_12_plan.md`.
   Task 3's **Push and record** bullet records `{name,row,arm,commit}` in `branches[]` before the push, but it names no function. Task 5's **Depends on:** credits Task 3 only with `g12_branch_build` and `g12_dispatch`. `g12_branch_build` builds and `update-ref`s and does not push. Yet Task 5's step 5 is *"Build, push and dispatch the JS3 branch"*, and Task 5 never says it records that branch in `branches[]`. Task 9 deletes only `branches[]` plus `other_branch`. If the JS3 branch is not recorded, it is left on origin, against prompt goals 2 and 6. Task 12's success case asserts `other_branch` and a JS3 `runs[]` entry, but no `branches[]` entry, so it would not catch this.

   **Fix:**
   - In `task_3_plan.md`, name the push-and-record function, for example `g12_branch_push <row> <arm> <branch> <commit>`, and state its contract: record in `branches[]` before the push, `git push --no-verify`, raise 3 on failure.
   - In `task_5_plan.md`, restate that function under **Depends on:** and call it for the JS3 branch.
   - In `task_12_plan.md`, assert that the JS3 branch is in `branches[]` on success and on the dispatch-failure path.

4. **Round 0's Should Fixes were neither applied nor recorded as rejected** — story index (`feat_gate12_sandbox_round_driver_story_plan.md`), `task_4_plan.md`, `task_16_plan.md`, `task_18_plan.md` and `task_10_plan.md`.
   `harness-runs/lessons.md` → *"In a revision round, a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason. It is never held for a go-ahead the loop does not relay."* `review_0.md` raised two Should Fixes, and neither was handled:
   - **RJ2's refusal is settled by the source.** The route table, Task 4, Task 16 and Task 18 still call it a *"may"*, a *"risk"* and *"conditional"*. `protectedPaths` carries `join(repoRoot, PROFILE_PATH)`, and `jobSurfacePaths` keeps every checkout-relative entry (`cli/src/generators/writeProtection.ts`).
   - **`runRound` and the `main-anchor-isolation` guard.** Task 10 still spawns `bash` with no statement that it blanks `MAIN_REPO_ANCHOR_VARIABLE` or builds on `runBash`. The new `cli/test/**` files select the `test/main-anchor-isolation.test.mjs` tree guard.

   The story index has no `## Rejected findings` section.

   **Fix:** For each of the two, either apply it in the named files or add a `## Rejected findings` section as the story index's last section, recording the finding and the reason for rejecting it.

## Should Fix

- The story index's route table, row SB2's `PAUSE_PROGRESS.md` arm, says a committed link *"never reaches `Save the state bundle`"*. The move-aside in `run_job` only fires when `[ -f "$state_abs/$HR_REMOTE_PAUSE_FILE" ]` holds, and `-f` follows a link. A link whose target is a regular file is moved aside. A dangling link, or a link to a directory, is not moved, and it would reach the save step's `hr_remote_bundle_source_ok`. Check this before stating that the arm has no route, or say in the reason cell which link target the claim assumes.

## Nice to Have

- As in round 0, the readiness list places the catch-all `general` Tasks 1–9 ahead of the `cli` tests, because the tests depend on the scripts. The **Ship order.** paragraph argues this. Noted, not graded.
