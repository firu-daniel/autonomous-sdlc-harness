# Architecture review — iteration 0

Reviewed: `harness-runs/story_plans/feat_gate12_sandbox_round_driver_story_plan.md` (`## Context`, readiness list, scope register) and every `task_<N>_plan.md` (Tasks 1–18) under `harness-runs/task_plans/feat_gate12_sandbox_round_driver/`. I checked them against the task prompt, `.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md`, `harness-runs/lessons.md` and `plugin/instructions/unit_loop_core.md` → `## The test-run rule`.

Placement and dependency direction hold:
- The driver and its libraries (Tasks 1–9) sit under the root `scripts/` and are tagged `general`, beside the model `scripts/sandbox-probe.sh`.
- The suites (Tasks 10–15, 17) sit under `cli/test/` and are tagged `cli`. This follows the existing `cli/test/sandbox-probe-*.test.mjs` precedent. The new helper `cli/test/helpers/gate12-round.mjs` builds on `runBash` (`cli/test/helpers/fixture.mjs`) and on `MAIN_REPO_ANCHOR_VARIABLE` from the compiled `cli/dist/core/mainRepoAnchor.js`. Both exist.
- The gate prose (Task 16) lands in `docs/`, and the follow-up prompt (Task 18) lands in the run-artifact tree.
- Nothing under `cli/templates/`, `cli/src/` or `plugin/` changes. Neither shipped half is made to execute the other.
- No shell asset shells out a recursive removal or stages with `git add -A`/`.`.
- Every script task has a test task covering it.
- No `**Verification:**` bullet asks for a forbidden test run. Tasks 10–15 and 17 each name only their own new test file. The other tasks name `commands.typecheck` or ad hoc stub runs.

## Must Fix

_None._

## Should Fix

1. **The state file's key shape gains a key outside its owner.** Offending files: `task_5_plan.md` (and, by omission, `task_2_plan.md` plus the story index `<branch>_story_plan.md` → `## Context` → **The state file**). Rule: `.claude/context/conventions.md` → `### Where a new responsibility goes` → *"A responsibility that already has a home does not get a second one"*, and `## Configuration is the source of truth…` → *"a new persisted artifact joins the module that owns it rather than being named at its use site"*.
   - The story index states the state file's keys "once here".
   - Task 2 makes `state.sh`'s header the declaration of the key shapes (`runs[]` items carry `row`, `arm`, `branch`, `run_id` and `dispatched_at`).
   - Task 5 then writes `stall_values_unconfirmed` onto a `runs[]` item and says outright that *"Task 2's key shapes do not carry it"*. Task 7 reads it.
   - The declared owner of the state file's shape therefore misdescribes the file it owns, and the key's only declaration sits at its use site.

   **Fix:**
   - In `task_2_plan.md` → the `state.sh` key-shapes bullet, add `stall_values_unconfirmed` (optional, absent read as `false`, written by the default-branch leg) to the `runs[]` item shape.
   - In the story index → **The state file**, add it to `runs[]`'s key list.
   - In `task_5_plan.md` and `task_7_plan.md`, replace the "Task 2's key shapes do not carry it" wording with a pointer to that declaration.

## Nice to Have

1. **There is a second derivation of the scratch-directory root.** Offending file: `task_6_plan.md`. Rule: `.claude/context/conventions.md` → `### Where a new responsibility goes` → **Before adding a copy of anything, grep for it.**
   - `runs.sh` spells out `$G12_ROOT/$G12_STATE_DIR/scratch/gate12-sandbox-round/runs/<id>/…` and `…/evidence/<row>.log` itself.
   - `state.sh` (Task 2) already derives the same `…/scratch/gate12-sandbox-round/` root in `g12_state_path`.

   **Fix:** In `task_2_plan.md`, add a `g12_scratch_dir` to `state.sh`, and have `g12_state_path` build on it. In `task_6_plan.md`, have `g12_step_log`, `g12_artifact` and `g12_evidence` build their paths from `g12_scratch_dir` rather than repeating the literal.
