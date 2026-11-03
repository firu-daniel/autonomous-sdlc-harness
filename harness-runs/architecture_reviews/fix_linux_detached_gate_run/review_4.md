# Architecture review — iteration 4

The plan has been redrafted around the user's ruling (route 1, the re-sandboxing launcher) and now has 18 tasks. Iteration 3's Must Fix is resolved:
- `task_11_plan.md` → PD25 now accepts exactly what `hr_run_copy_check_var` / `hr_clone_target_check_var` accept. That is `git -C / config --file <clone>/.git/config --bool --get extensions.worktreeConfig` exiting 1, or exiting 0 with `false`, and everything else, including exit 128, returns 1.
- `task_14_plan.md` adds the unparseable (`maybe`) case.
- `task_15_plan.md` says *"absent or `false`"*.

Layer placement, dependency direction and the test-run rule hold across all 18 tasks:
- Tasks 1–4 and 12–14 stay under `cli/`, Tasks 5–6 under `plugin/`, and Tasks 7–11 and 15–18 under the catch-all (`scripts/`, `docs/`, `examples/`).
- Neither shipped half reaches into the other at run time. The launcher's `# Used by` line cites the plugin core as text only.
- The cores stay literal-free. `<MAIN_REPO>` appears only in the autonomous forks' binding values (Task 6), and the semi-autonomous forks bind `none`.
- The launcher's shipped artifacts all derive from one `OUTER_LOOP_SCRIPTS` row (Task 3): the excluded entry, the allow forms and the write protection. `sandboxProfile.ts`, `writeProtection.ts` and `profileEntries.ts` are untouched.
- The placeholder sweep has one per-path home: `hr_placeholder_sweep_var` delegates to the new `hr_placeholder_sweep_paths_var`.
- No `**Verification:**` bullet asks for `bash scripts/test.sh`, `scripts/run-gates.sh`, a tree guard, or a test file its task does not create or edit. No new test reads a tree of repository files, so no `treeGuards` registration is owed.

## Must Fix
1. **The launcher re-derives `run-test-suite.sh`'s lane path in a second, undeclared copy.** Offending file: `task_2_plan.md` (`**Work:**` → check 9: *"the lane directory `<target>/<stateDir>/test_run_logs/<hr_sanitize_branch branch>`"*, which check 10 and **The wait** then read for `.running` / `.verdict`). The owner's side is in `task_1_plan.md` (`**Work:**` → **The header.**), which gives the launcher a header section but never states that the launcher mirrors this script's values. Rule broken: `.claude/context/conventions.md` → `### Where a new responsibility goes` (*"A responsibility that already has a home does not get a second one"*, and *"Before adding a copy of anything, grep for it"*). A second rule applies too: `.claude/context/plugin.md` → `## The placeholder vocabulary` (*"A run-artifact path shape is a wire … owned by the file that states it. Changing a shape is a change to every reader of it"*).
   The lane layout has one home today: `cli/templates/scripts/run-test-suite.sh` → `LOG_SUBDIR='test_run_logs'` and `log_dir="$state_dir/$LOG_SUBDIR/$safe_branch"`, with the branch taken from `hr_current_branch`. Task 2 makes the launcher a second reader of that shape. It spells `test_run_logs` as a literal, joins the path itself, and takes the branch through a different function (`hr_wrapper_branch_var`). The launcher's `pending` answer and its "did not start" refusal both depend on this copy matching the files the worker writes. A drift therefore turns every sandboxed round into a launcher refusal, which parks an unattended run, while the gates actually run. Task 2 already declares its other two copies of `run-test-suite.sh` values as mirrors (`LABEL_PATTERN` in check 2, `STALE_SECONDS` in check 10). The lane path is the only copy left undeclared. On the owner's side, Task 1's header edit names none of the three mirrors, so an edit to `run-test-suite.sh` carries no pointer to the launcher.
   **Fix:** Apply one of these two:
   - **(a)** In `task_2_plan.md` check 9, declare the lane composition in the launcher's header as a mirror of `run-test-suite.sh` → `LOG_SUBDIR` and `log_dir`, beside the existing `LABEL_PATTERN` and `STALE_SECONDS` mirror declarations. Name the branch source it must agree with (`hr_current_branch` in the worker, `hr_wrapper_branch_var` in the launcher). Then add one sentence to `task_1_plan.md`'s new `THE NO-DETACH FORM, AND WHO ISSUES IT` header section: `launch-sandboxed-gates.sh` mirrors `LABEL_PATTERN`, `STALE_SECONDS` and the `LOG_SUBDIR` / `log_dir` lane layout, so a change to any of them is an edit to both scripts.
   - **(b)** Move the lane-directory composition into `cli/templates/scripts/lib/harness-run-lib.sh` as one function that both scripts call. Update Task 1's byte-identity claim for the run form, and Task 7's copy, to match.

   Either way, `task_4_plan.md` case (g) already reads the lane through the real `run-test-suite.sh --wait`, so it catches a drift. Leave it unchanged.

## Should Fix
_None._

## Nice to Have
_None._
