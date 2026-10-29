# Architecture review — iteration 0

## Must Fix

1. **The start-up recovery puts a second copy of `running_count`'s live-run rule in the watcher** — `task_11_plan.md`, the `placeholder_start_recover` bullet **The live-run gate.** Rule source: `.claude/context/conventions.md` → `### Where a new responsibility goes`: *"A responsibility that already has a home does not get a second one"* and *"Before adding a copy of anything, grep for it."*
   The plan says to count the candidate registry's records *"that are `running` with a pid `kill -0` answers, by the same rule as `running_count`, through `hr_registry_branches` and `hr_registry_get`"*. Counting this repository's live local runs already has a home: `autonomous-watcher.sh` → `running_count`, which skips remote records (`record_is_remote`), keeps the `running` ones and probes their pid. The plan copies that predicate instead of sharing it. This gate is the only thing that makes the start-up removal safe while a run is live. If `running_count`'s rule changes later (another skip class, a different liveness probe), the start-up gate drifts away from it with no compile error and no failing test, the failure `conventions.md` cites for `cli/src/core/repoPaths.ts`. The copy has a cause the plan does not state. `running_count`, `registry_get`, `registry_branches` and `record_is_remote` are defined well below the `MAIN_REPO=` line, and they read the global `$REGISTRY`, which is not set yet at that point. So the start-up step cannot call them as they stand. The answer is to move the rule to a home both callers can reach, not to write a second copy.
   **Fix:** In `task_11_plan.md`:
   - Add `cli/templates/scripts/lib/harness-run-lib.sh` to `### Targets`.
   - Add a work item that moves the per-record rule into one library function, for example `hr_registry_live_count <registry> [exclude_branch]`. It skips a record whose `execution` is `github-actions`, counts a `running` record whose pid `kill -0` answers, leaves out `exclude_branch`, sets no shell option and logs nothing.
   - Make `running_count [exclude_branch]` a one-line delegation: `hr_registry_live_count "$REGISTRY" "$1"`. This also covers the optional excluded branch the plan already adds.
   - Have `placeholder_start_recover`'s gate call the same function on the candidate's `hr_state_path "<candidate>" autonomous_logs/registry.json`.
   - Replace the *"by the same rule as `running_count`"* wording with the call.
   - Keep the `watcher-running-count.test.mjs` case the plan already names, which now exercises the shared function through `running_count`.
   - In `task_5_plan.md`, change **Depends on:** to say that Task 11 changes `cli/templates/scripts/lib/harness-run-lib.sh` as well as `autonomous-watcher.sh`. Task 5 still copies it, because the file is already one of its targets.

## Should Fix

1. **`machineStateDir`'s account of what lives in the state directory does not name the new manifest.** In `task_2_plan.md`, `hr_run_profile_absent_file` adds `run-profiles/<slug>/<branch>.absent` beside the per-run profile, in the machine-local state directory. `cli/src/machine/paths.ts` → `machineStateDir`'s doc comment lists what lives in that directory, and it names `run-profiles/<slug>/<branch>.json` and its owner `hr_run_profile_file`. It does not name the new sibling. `.claude/context/cli.md` → `**Machine-scoped state is not an adopter's file.**` says what this layer writes outside the repository is enumerated and each piece has one owner. **Fix:** add a work item to `task_2_plan.md` that extends that doc comment by one clause, naming `<branch>.absent` and its owner `hr_run_profile_absent_file`, and add `cli/src/machine/paths.ts` to its `### Targets`.

## Nice to Have

None.
