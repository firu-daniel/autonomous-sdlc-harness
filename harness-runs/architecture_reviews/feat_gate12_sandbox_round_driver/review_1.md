# Architecture review — iteration 1

Reviewed: `harness-runs/story_plans/feat_gate12_sandbox_round_driver_story_plan.md` (`## Context`, the readiness list, the scope register; the index has no `## Rejected findings` section) and every `task_<N>_plan.md` (Tasks 1–18) under `harness-runs/task_plans/feat_gate12_sandbox_round_driver/`. I checked them against the task prompt, `.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md`, `harness-runs/lessons.md` and `plugin/instructions/unit_loop_core.md` → `## The test-run rule`. No task file has changed since iteration 0, and neither of iteration 0's findings was applied or recorded as rejected. Both are raised again below at their original severity.

Placement and dependency direction still hold:
- The driver and its eleven libraries (Tasks 1–9) sit under the root `scripts/`, beside the model `scripts/sandbox-probe.sh` and `scripts/lib/sandbox-probe/`, and are tagged `general`.
- The suites (Tasks 10–15 and 17) and the helper `cli/test/helpers/gate12-round.mjs` sit under `cli/test/` and are tagged `cli`. This follows the existing `cli/test/sandbox-probe-*.test.mjs` suites. `runBash` (`cli/test/helpers/fixture.mjs`), `cli/test/helpers/isolated-gitconfig` and `cli/src/core/mainRepoAnchor.ts` all exist.
- Task 17 reads `docs/development.md` as a fixed file. `cli/test/sandbox-probe-git-and-legs.test.mjs` already does the same.
- The gate prose (Task 16) lands in `docs/`. The follow-up prompt (Task 18) lands in `harness-runs/task_prompts/`.
- Nothing under `cli/src/`, `cli/templates/` or `plugin/` changes, and neither shipped half is made to execute the other.
- No recursive removal is shelled out. Task 3 removes files by name and then runs `rmdir`.
- No new suite reads a tree, so no `treeGuards` entry is owed (`## The test-run rule` point 8).
- No `**Verification:**` bullet names `commands.test`, a gate script, a tree guard, or a test file its task does not create. Tasks 10–15 and 17 each name only their own new file.

## Must Fix

_None._

## Should Fix

1. **The state file's key shape is still declared outside its owner. Raised again from iteration 0; not applied and not recorded as rejected.** Offending files: `task_5_plan.md` → **Depends on** (*"Task 2's key shapes do not carry it"*), `task_7_plan.md` → **Depends on**, `task_2_plan.md` → the `state.sh` key-shapes bullet, and the story index `feat_gate12_sandbox_round_driver_story_plan.md` → `## Context` → **The state file**. Rule: `.claude/context/conventions.md` → `### Where a new responsibility goes` → *"A responsibility that already has a home does not get a second one"*, and `## Configuration is the source of truth, and it is read at run time` → *"a new persisted artifact joins the module that owns it rather than being named at its use site"*.
   - The story index states the state file's keys "once here".
   - Task 2 makes `state.sh`'s header the declaration of the key shapes.
   - Task 5 writes `stall_values_unconfirmed` onto a `runs[]` item and says that Task 2's shapes do not carry it. Task 7 reads it.
   - So the key is declared only where it is used, and the declared owner gives a wrong description of the file it owns.

   **Fix:**
   - In `task_2_plan.md` → the `state.sh` key-shapes bullet, add `stall_values_unconfirmed` to the `runs[]` item shape: optional, read as `false` when absent, and written only by the default-branch leg.
   - In the story index → **The state file**, add it to `runs[]`'s key list.
   - In `task_5_plan.md` and `task_7_plan.md`, replace *"Task 2's key shapes do not carry it"* with a pointer to that declaration.
   - Alternatively, record this finding under a `## Rejected findings` section in the story index, with the reason.

2. **The plan for the sourced libraries does not include the shebang that every shell file carries.** Offending files: `task_1_plan.md` (`core.sh`), `task_2_plan.md` (`preflight.sh`, `state.sh`), `task_3_plan.md` (`plant.sh`), `task_4_plan.md` (`plants.sh`), `task_5_plan.md` (`default-branch.sh`), `task_6_plan.md` (`runs.sh`, `grade-plant.sh`), `task_7_plan.md` (`grade-state.sh`), `task_8_plan.md` (`grade-full-run.sh`) and `task_9_plan.md` (`teardown.sh`). Rule: `.claude/context/conventions.md` → `## Shell assets` → *"`#!/usr/bin/env bash` on every shell file in this tree"*. Task 1 requires the shebang for the entry point only. Every library of the model, `scripts/lib/sandbox-probe/*.sh`, opens with `#!/usr/bin/env bash` on its first line, and the story index says the new script copies the model's shape. This is a convention gap rather than a layering violation, which is why it is Should Fix.

   **Fix:** Add one line to the story index → `## Context` → the list of the model's shape: *"every file, the sourced libraries included, opens with `#!/usr/bin/env bash`"*. Alternatively, add the same requirement to each listed task's header bullet.

## Nice to Have

1. **The scratch-directory root is derived a second time. Raised again from iteration 0.** Offending files: `task_6_plan.md` (`runs.sh` spells out `$G12_ROOT/$G12_STATE_DIR/scratch/gate12-sandbox-round/runs/<id>/…` and `…/evidence/<row>.log` itself) and `task_2_plan.md` (`g12_state_path` already derives the same root). Rule: `.claude/context/conventions.md` → `### Where a new responsibility goes` → **Before adding a copy of anything, grep for it.**

   **Fix:**
   - In `task_2_plan.md`, add `g12_scratch_dir` to `state.sh`, and build `g12_state_path` on it.
   - In `task_6_plan.md`, build the paths of `g12_step_log`, `g12_artifact` and `g12_evidence` from `g12_scratch_dir` rather than repeating the literal.
