# Architecture review — iteration 1

Iteration 0's Must Fix (the copied live-run rule) is resolved: `task_11_plan.md` now moves the rule into `hr_registry_live_count` in `cli/templates/scripts/lib/harness-run-lib.sh`, `running_count` delegates to it, and `task_5_plan.md`'s **Depends on:** names the library change.

## Must Fix

1. **The start-up recovery puts a second no-git checkout locator and a second copy of the leftover test in the watcher** — `task_11_plan.md`, the `placeholder_start_recover` bullet **Locate the main checkout without git.** (and, as the owner of the test, `task_2_plan.md` → `hr_placeholder_sweep_var`). Rule source: `.claude/context/conventions.md` → `### Where a new responsibility goes`: *"A responsibility that already has a home does not get a second one"* and *"Before adding a copy of anything, grep for it."*
   The plan has `placeholder_start_recover` walk up from `SCRIPT_DIR`, made physical with `cd -P`. It passes over a level whose `.git` is "a regular file, not a symbolic link, 0 bytes and carrying no write bit", takes the first level whose `.git` is a real directory, not a symbolic link, and ends the walk on anything else. This adds two copies.
   - **The walk.** Locating a checkout from a script's directory without git already lives in `cli/templates/scripts/lib/harness-run-lib.sh`. `hr_checkout_top_nogit` makes `<dir>` physical with `cd -P` and walks up to the first `.git` entry. `hr_wrapper_main_of`, built on it, refuses a symbolic-link `.git` and accepts a real `.git` directory as the main checkout. The plan's walk is that same walk with one change: it skips a leftover. Writing it inline in `autonomous-watcher.sh` gives the no-git placement rule a second home.
   - **The leftover test.** The "is this a placeholder leftover" test is Task 2's. It is the conjunction in `hr_placeholder_sweep_var`: regular file, not a symbolic link, 0 bytes, no write bit, owned by the effective user. The walk restates four of those five conditions and leaves out the owner test. If Task 2's test changes, the walk's copy drifts from it with no compile error and no failing test. That is the failure `conventions.md` cites for `cli/src/core/repoPaths.ts`. The walk's copy already differs from the sweep's.

   Both copies have to sit in the watcher only if the library cannot answer. It can: the library is sourced after the PATH bootstrap, and the start-up step already calls `hr_config_load`, `hr_state_path`, `hr_repo_slug` and `hr_registry_live_count` from it.
   **Fix:**
   - In `task_2_plan.md`, add a library predicate, for example `hr_placeholder_leftover_var <path>`. It returns 0 when the path passes all five tests. Otherwise it returns 1 and sets `HR_PLACEHOLDER_REASON` to one of the four reasons already listed. It sets no shell option and logs nothing. Have `hr_placeholder_sweep_var` call it for each listed path rather than testing inline. Add one case for it to `placeholder-sweep-lib.test.mjs`. Add both names to the story index's **Cross-task names** bullet for Task 2.
   - In `task_11_plan.md`, add the walk to the library as one function beside `hr_checkout_top_nogit`, for example `hr_main_checkout_past_leftovers_nogit <dir>`. It skips a level whose `.git` passes `hr_placeholder_leftover_var`, takes the first real, non-symlink `.git` directory, and returns 1 on anything else. List it in **Depends on:** / Work as an addition to the library, like `hr_registry_live_count`. Have `placeholder_start_recover` call it rather than walking inline. Name it in the start-up test cases' wording. In **Verification:**, add a `git grep` showing that `autonomous-watcher.sh` carries no `.git` walk of its own.
   - In `task_5_plan.md`, extend **Depends on:** to say that Task 11 adds this function to `cli/templates/scripts/lib/harness-run-lib.sh` as well.

## Should Fix

1. **`machineStateDir`'s account of the state directory still does not name the new manifest** (raised in iteration 0 and neither applied nor recorded under `## Rejected findings`). `task_2_plan.md` → `hr_run_profile_absent_file` adds `run-profiles/<slug>/<branch>.absent` beside the per-run profile. `cli/src/machine/paths.ts` → `machineStateDir`'s doc comment lists what lives in that directory, and it names `run-profiles/<slug>/<branch>.json` with its owner `hr_run_profile_file`. `.claude/context/cli.md` → **Machine-scoped state is not an adopter's file.** says that what this layer writes outside the repository is enumerated and that each piece has one owner. **Fix:** add `cli/src/machine/paths.ts` to `task_2_plan.md`'s `### Targets`, with a work item extending that doc comment by one clause naming `<branch>.absent` and its owner `hr_run_profile_absent_file`.

## Nice to Have

None.
