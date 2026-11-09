# Architecture review — iteration 2

All three of iteration 1's Should Fix items have been applied in the plan files.
- `task_1_plan.md` → `## Where a report goes` names the mention reader by its instruction file, and a Verification bullet greps the module for `autonomous-sdlc-harness:`.
- `docs-reviewer` has its own row, with a FAIL-only-when-acted-on grade and a `summary:` clause otherwise.
- `task_6_plan.md` rewords the `mention_reading.md` only-instructions bullet and re-derives its citers against `docs/github-run-control.md`.

Layer placement is correct:
- Tasks 1–7 are `plugin/`.
- Task 8's corpus test is `cli/test/`, the same shape as `main-repo-resolution-corpus.test.mjs`.
- Task 9's `harness.config.json` entry is `general`.

Task 8 names Task 9 as its registering task (`unit_loop_core.md` → `## The test-run rule` point 8). No plan file asks for a test run outside the unit's own new test file. The new module is named per `.claude/context/plugin.md` → `## Naming` (no family, so no `_instructions` infix). It carries its own `## Who may cite this` roster per `## What accompanies a new unit of each kind` → *A shared instruction module*. That roster's 29 entries equal the union of Task 8's three `expected` sets.

## Must Fix

(none)

## Should Fix

1. **The new module points at two sections of `run_mode_instructions.md`, but that file's closed `## Activation` set is not updated.** Files: `task_1_plan.md`, `## The rule` item 2 (cites `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` → `## The closed directive set — the only four things a run mode may switch off`) and the `## Where a report goes` run-mode row (cites `## Conflicts, and what happens on one`); and `task_6_plan.md`, the `run_mode_instructions.md` Work bullet. Rule source: `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule`, which says *"`## Activation` fixes which documents may point at it … The same rule governs every shared module here."*
   `plugin/instructions/run_mode_instructions.md` → `## Activation` closes its citer set with *"no document beyond the set named above may activate this file"*. It has one carve-out for a **definitional citation**, and that carve-out describes only one case: naming the file *"to explain what a run-mode-skipped phase is"*. It lists that case's single member, `improvement_observations_instructions.md`, *"as such"*. `untrusted_input.md` cites the file definitionally, to name the closed authority it does not override. But it does not fit that description, and it is not listed. After this branch, a reader applying `## Activation` would find a pointer that the closure claim says cannot exist. Task 6 already edits `run_mode_instructions.md` and says to leave `## Activation` untouched.
   **Fix:** In `task_6_plan.md`, change the `run_mode_instructions.md` Work bullet so it no longer says to leave `## Activation` untouched. Add one clause to that section's **A definitional citation.** carve-out naming `${CLAUDE_PLUGIN_ROOT}/instructions/untrusted_input.md` as a second definitional citer. It names `## The closed directive set — the only four things a run mode may switch off` and `## Conflicts, and what happens on one` only to carve out the run mode's closed authority from task data, and it activates nothing. Widen the bullet's opening description so it covers both cases. Leave every heading line byte-unchanged. Add a Verification bullet: `git grep -n -F 'untrusted_input.md' -- plugin/instructions/run_mode_instructions.md` prints a hit inside `## Activation` as well as the rule pointer. If you reject this finding, record it under a `## Rejected findings` section at the end of the story index, with the reason (for example, that the existing carve-out already covers every definitional citer).

## Nice to Have
