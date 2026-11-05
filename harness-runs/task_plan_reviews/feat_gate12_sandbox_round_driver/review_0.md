# Task plan review — iteration 0

## Must Fix

1. **SB2's skip line is the wrong string** — `task_7_plan.md` and `task_13_plan.md`.
   Task 7 grades SB2 on the `Save the state bundle` log carrying `remote-run.sh: save: skipped <path>: <linked> is a symbolic link` for the planted `clarifications/<branch>/gate12-link.md`, and says *"The string comes from `save_link_free` in `cli/templates/scripts/remote-run.sh`"*. `save_link_free` is called only for `autonomous_logs/registry.json` (`verb_save`: `save_link_free autonomous_logs/registry.json || registry_absent=1`). `clarifications/<branch>/` is a directory source of `hr_remote_bundle_write` in `cli/templates/scripts/lib/harness-run-lib.sh`. That function copies it through `hr_remote_copy_tree`, which prints `remote state bundle: skipped %s: %s is a symbolic link` for a link inside the directory. `hr_remote_bundle_source_ok` prints the same `remote state bundle: skipped …` form for a linked source component. As written, the grader never matches the line the job actually prints, so a correct job grades SB2 `fail`. This is the story index's first `Top risks:` entry. Task 13 restates the wrong form (`save: skipped … is a symbolic link`), and its header names `save_link_free` as where the string comes from, so its canned answers would hide the bug.
   **Fix:** In `task_7_plan.md`, grade the clarifications link on `remote state bundle: skipped <path>: <path> is a symbolic link`, citing `hr_remote_copy_tree` / `hr_remote_bundle_write` in `cli/templates/scripts/lib/harness-run-lib.sh`. Keep `save_link_free` only for what it really prints. In `task_13_plan.md`, restate that string and source, and take it from `harness-run-lib.sh` at test time.

2. **FR6's "no `skipped` line" check misses the bundle writer's skip lines** — `task_8_plan.md` and `task_14_plan.md`.
   FR6's Expected is *"no `skipped` line"* (`docs/sandbox-verification.md` §10, row FR6). Task 8 checks for *"no line containing `save: skipped`"*, and Task 14 restates that. The bundle writer's skip lines read `remote state bundle: skipped …` (`harness-run-lib.sh` → `hr_remote_copy_tree`, `hr_remote_bundle_source_ok`), and they do not contain `save: skipped`. So a parked job whose bundle skipped a source would grade FR6 `pass`.
   **Fix:** In `task_8_plan.md`, fail FR6 on any `skipped` line in the parked job's `Save the state bundle` log. That covers both the `remote-run.sh: save: skipped` form (`verb_save`) and the `remote state bundle: skipped` form (`harness-run-lib.sh`), each cited by symbol. In `task_14_plan.md`, restate the check and add a case where a `remote state bundle: skipped` line turns FR6 to `fail`.

3. **Two verdicts depend on reads the row's Read from does not name** — `task_8_plan.md`, `task_14_plan.md`, `task_6_plan.md` and `task_13_plan.md`.
   The task prompt fixes the contract: *"The script grades a row on exactly what its **Read from** names."*
   - FR7's Read from is *"the resumed job's `Run the harness` step log and the committed index"*. Task 8 also requires the resumed job's `Restore the previous job's state` log to carry `wrote answer_<n>.md for <branch>` before it grades FR7 `pass`, and Task 14 restates that.
   - JS1's Read from names the refusal step log, the job's conclusion and steps, the run's artifacts and the `remote-run.sh sync` record. Task 6 also requires that *"no later `harness run <branch>` run exists"*, read from a `gh run list`, and Task 13 restates that.
   
   Neither extra read is recorded as a departure. JS1's `status`-for-`sync` substitution is recorded as one.
   **Fix:** In `task_8_plan.md`, drop the restore-log clause from FR7's verdict. Keep it only as evidence, or record it as a departure with its reason, and mirror that in `task_14_plan.md`. In `task_6_plan.md`, either drop the later-run listing from JS1's verdict, or record it as a departure naming the row's *"nothing chained"* clause, as the `status` departure is recorded. Mirror that in `task_13_plan.md`.

4. **Cross-task interfaces credited to a producer that does not define them** — `task_5_plan.md`, `task_1_plan.md` and `task_7_plan.md`.
   - `task_5_plan.md` → **Depends on:** credits Task 1 with `G12_OTHER_BRANCH`, `G12_STALL_WARN_SECS`, `G12_STALL_KILL_SECS` and `G12_WAIT_SECS`, *"defaulting to `gate12_other_<stamp>`, 60, 120 and 600"*. `task_1_plan.md` parses these options but states no default. Each implementer can reasonably leave the defaults to the other.
   - `task_7_plan.md` credits `runs[].stall_values_unconfirmed` to *"Task 2's state"*. `task_2_plan.md`'s key shapes do not carry it. Task 5 writes it, and Task 7 does not list Task 5 as a dependency.
   
   **Fix:** Name one owner for the defaults. Either have `task_1_plan.md` state them in its argument-parsing bullet, or have `task_5_plan.md` apply them itself and stop crediting Task 1. In `task_7_plan.md`, credit `stall_values_unconfirmed` to Task 5, which sets it on a wait time-out, and list Task 5 under **Depends on:**.

## Should Fix

- **RJ2's refusal is settled by the source, not a "may"** (story index route table, `task_4_plan.md`, `task_16_plan.md`, `task_18_plan.md`). `PROFILE_PATH` (`.claude/settings.autonomous.json`) is an entry of `protectedPaths` (`cli/src/generators/writeProtection.ts`), and `jobSurfacePaths` keeps every such entry under the checkout. So `Refuse a branch that changed the job's own files` refuses the RJ2 branch every time. If it did not, `Generate the job's permission profile` would rewrite the tracked file and fail on its `git status --porcelain --untracked-files=no` check. Either way the launch check is never reached. State the outcome as read from the source, not as a risk. Then consider listing RJ2 with the other rows that have no route in the follow-up prompt, rather than as conditional.
- **`runRound` and the `main-anchor-isolation` guard** (`task_10_plan.md`). The new `cli/test/**` files select the `test/main-anchor-isolation.test.mjs` tree guard. That guard fails a suite whose spawn spreads `process.env` without blanking the main-checkout anchor. Build `runRound` on `runBash` from `cli/test/helpers/fixture.mjs`, or state that it blanks `MAIN_REPO_ANCHOR_VARIABLE`.

## Nice to Have

- `task_2_plan.md`: check 2 refuses this repository only by top-level equality with the script's own checkout. A checkout of this repository that predates the script passes it, and is then refused only by check 5. A slug comparison against this repository's own origin would make the refusal state its real cause.
- The readiness list puts `general` (catch-all) Tasks 1–9 ahead of the `cli` tasks. The test-after-script dependency forces this, and the index's **Ship order.** paragraph argues it. That is noted here, not graded.
