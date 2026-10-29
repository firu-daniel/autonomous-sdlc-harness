# Architecture review — iteration 1

Iteration 0's Must Fix is resolved in `task_2_plan.md` and `task_8_plan.md`. The roster now lists 21 `${CLAUDE_PLUGIN_ROOT}` entries plus the three repo-relative citers, and Task 8 compares only the plugin entries. The fix did not reach the one other task that states the roster's contents, so that task is the finding below.

## Must Fix

1. **Task 4 still says the module's roster is exactly the 21 plugin files, and its verification compares against that** — `task_4_plan.md`, the **Depends on:** paragraph and the third **Verification:** bullet. Rule source: `.claude/context/plugin.md` → `## What accompanies a new unit of each kind`, row *A shared instruction module* (*"Its own activation or citation rule fixing who may point at it, and the roster of those documents inside the module itself"*), read with `## Cores, forks and the single-owner rule` → **A policy file is activated by pointer and never restated. … The same rule governs every shared module here.**

   **Depends on:** says Task 2 creates *"a `## Who may cite this` roster naming exactly the 21 files below"*. The verification bullet then says *"That file list equals the `## Who may cite this` roster in `plugin/instructions/main_repo_resolution.md`, read side by side."* After iteration 0's fix, Task 2 writes a 24-entry roster: the 21 `${CLAUDE_PLUGIN_ROOT}` entries plus `cli/src/doctor/checks.ts`, `docs/watcher.md` and `docs/cli.md`. So the comparison Task 4 prescribes cannot pass as written. An implementer who follows it either reports a false blocker or "fixes" the roster back down to 21, which removes the three non-plugin citers the module's own rule needs. That reopens iteration 0's finding. The plan now states the module's roster contents in two places that disagree.

   **Fix:** In `task_4_plan.md`:
   - Change **Depends on:** to say the roster names these 21 files as `${CLAUDE_PLUGIN_ROOT}/…` entries, plus three repo-relative citers outside the plugin (`cli/src/doctor/checks.ts`, `docs/watcher.md`, `docs/cli.md`) that this task does not touch.
   - Change the third **Verification:** bullet to compare the file list only with the roster's `${CLAUDE_PLUGIN_ROOT}/…` entries, mapped to `plugin/…`. That is the same comparison Task 8 → **The module's two checks** makes. State that the three repo-relative entries are not part of this comparison.

## Should Fix

1. **Citers still re-walk the fallback rather than pointing at it** — `task_5_plan.md`, `task_9_plan.md`. Rule source: `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule` (*"a citer that paraphrases it becomes a second owner. The same rule governs every shared module here."*); `harness-runs/lessons.md` → `## Agent prose`, first entry. This is iteration 0's Should Fix. The `docs/cli.md` anchor bullet is now reduced to an outcome, but three places still describe the mechanism:
   - Task 5's doc comment is told to state *"the fallback stated above"*: the alternates file, the registry confirmation and the first `git worktree list` entry.
   - Task 5's `warn(…)` clause repeats *"through its alternates file and the run registry"*.
   - Task 9 adds *"One sentence of what the fallback does, from the rule above"* to `docs/watcher.md`, and its `docs/cli.md` `_README` and `profile-main-anchor` edits follow the same pattern.

   For each one, keep the pointer to `plugin/instructions/main_repo_resolution.md` → `## The fallback` plus a single outcome. For example: it reaches the main checkout from a registered run clone and otherwise stops, never using the copy. Do not name the alternates and registry checks.

2. **Task 8's mutation predicts a roster-check failure that cannot happen** — `task_8_plan.md` → **Mutation, recorded in the header.** Rule source: `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 8 (the suite is a registered tree guard, so its header is the record later runs trust). Reverting `plugin/commands/branch-status.md` to the old clause fails the first row (the `needle` set and the `forbidden` string). The roster check, though, compares the module's static `${CLAUDE_PLUGIN_ROOT}` entries with the first row's static `expected` keys, and neither changes when a site is reverted. So *"see both the first row and the roster check fail"* will not be observed. The same applies to the claim under **The module's two checks** that *"A plugin site added without a roster entry fails here"*: the first row catches that case, not the roster check. **Fix:** Expect only the first row to fail for the site revert. Add a second in-memory mutation for the roster check, such as deleting one `${CLAUDE_PLUGIN_ROOT}` roster line from the module in the working tree, and record both red runs.

## Nice to Have

None.
