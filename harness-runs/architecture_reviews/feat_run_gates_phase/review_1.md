# Architecture review — iteration 1

Iteration 0's two Must Fix findings are resolved:
- `task_8_plan.md` now puts `unit_loop_core.md` → `## The test-run rule` and the writer's **Rewrite machine paths before quoting.** step on `## Read first`, and it amends `## Scope boundary`.
- `task_16_plan.md` does the same for `business-parity-reviewer.md`.

Layer placement, the ship order (`cli` → `plugin` → `general`), the direction of the contract (the `stateDir` shape starts in `cli/`, and plugin consumers come after it), and the absence of any run-time coupling between the two halves all check out.

## Must Fix

1. **`## The test-run rule` becomes a policy cited across the corpus, but it lands inside `unit_loop_core.md` with no citation roster, and that file's statement of what it owns is not amended.** The problem is in `task_5_plan.md`. Rule sources:
   - `.claude/context/plugin.md` → `## What accompanies a new unit of each kind`, row **A shared instruction module**: *"Its own activation or citation rule fixing who may point at it, and the roster of those documents inside the module itself."*
   - `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule`: *"A policy file is activated by pointer and never restated. `plugin/instructions/dispatch_discipline_instructions.md` → `## Activation` fixes which documents may point at it … The same rule governs every shared module here."*

   The story index `## Context` makes this section the rule's one canonical home. Tasks 6, 7, 8, 9, 12, 13, 15, 16, 17 and 18 point at it. The citing files sit well outside the unit loop's own callers:
   - `task-plan-writer`, which runs in the planning flow and never loads the unit loop;
   - four plan reviewers;
   - `branch-reviewer` and `skeptic-reviewer`;
   - the new `test-fix-plan-writer`;
   - three supervised instruction files;
   - `AUTONOMOUS_FLOW.md`.

   Structurally this is a new policy module, and the plan has more than a dozen files activating it by pointer. `unit_loop_core.md`'s opening paragraph still declares the file *"the **single owner** of the implement → \[review\] → commit loop"* and nothing else. Task 5 adds a second responsibility (a rule that binds plan writers and plan reviewers) without saying so in that ownership statement. It also adds no roster, so nothing fixes who may point at the heading. The heading is a wire (`.claude/context/plugin.md` → `## Citation`: *"A cited heading is therefore a wire"*). Without a roster, a later edit that rewords or moves it has no in-module list of the citers it would strand. Task 23's criterion-5 grep is a one-time acceptance check, not the module's own roster.

   **Fix:** In `task_5_plan.md` → **Work**, under the `## The test-run rule` bullet, add a sub-bullet. The section ends with a **who may cite this** paragraph in the form of `dispatch_discipline_instructions.md` → `## Activation`. It enumerates the citing documents by `${CLAUDE_PLUGIN_ROOT}/…` path: `agents/layer-implementer.md`, `agents/test-fix-plan-writer.md`, `agents/architecture-reviewer.md`, `agents/business-parity-reviewer.md`, `agents/task-plan-writer.md`, `agents/task-plan-reviewer.md`, `agents/user-review-fix-plan-writer.md`, `agents/review-plan-reviewer.md`, `agents/branch-reviewer.md`, `agents/skeptic-reviewer.md`, `instructions/plan_orchestration_instructions_core.md`, `instructions/plan_orchestration_instructions_autonomous.md`, `instructions/code_review_instructions.md`, `instructions/code_review_fixes_instructions.md`, `instructions/user_review_fixes_instructions.md` and `docs/AUTONOMOUS_FLOW.md`. It also states that a citer points and never restates.

   Add a second sub-bullet that amends the file's opening ownership paragraph: the file also owns `## The test-run rule`, the rule every plan a unit loop walks is written and graded against.

   Add a **Verification** bullet: `grep -rln "The test-run rule" plugin` returns exactly the roster plus `unit_loop_core.md` itself. Task 23's criterion-5 walk re-runs that comparison over the landed tree.

   *(Equivalent alternative: give the rule its own file under `plugin/instructions/` with that roster, and have every citer point there. Either way the owner carries its roster.)*

## Should Fix

1. **The `OuterLoopScript.agentInvocable` doc comment and the module header of `cli/src/generators/outerLoopScripts.ts` still go stale.** This was raised in iteration 0. `task_1_plan.md` neither resolves it nor records it under a `## Rejected findings` section. The doc comment enumerates the `true` rows exactly: *"the git wrappers …, the scratch runner … and the flow walker the orchestrating session steps a flow with"*. The header's opening line enumerates the whole set: *"the run watcher, the git wrappers, the worktree tooling, the flow walker with its gate library and flow graph, and the shared library"*. Task 1 adds a `true` row, `run-test-suite.sh`, that neither enumeration names. `.claude/context/cli.md` → `## What "done" means here`: *"Where the header states a rule, the change either satisfies it or amends the header in the same edit."* Add a Work bullet to name the test-suite runner in both, and a grep in **Verification**.

2. **The machine-path rewrite rule gets three statements.** `task_3_plan.md` states it in the `test_run_logs` README's "one mistake" text. `task_7_plan.md` states it in `test-fix-plan-writer.md` → `## Process`, which is named as the rule's source. `task_8_plan.md` restates it for `architecture-reviewer`'s own findings *"in the reviewer's own words"*. `.claude/context/conventions.md` → `### Where a new responsibility goes`: *"A responsibility that already has a home does not get a second one"*. `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule`: *"never restated"*. Two alternatives:
   - Have Task 8's sub-case (c) bullet point at the writer's step for the reviewer's own quoting too, with no paraphrase.
   - Move the rule into one shared home, for example beside `## The test-run rule` in Task 5, and have the writer, the reviewer and the README point there.

3. **`<fix_plan_iteration>` is sent but never bound.** `task_8_plan.md`'s dispatch block, which Task 9 sends *"verbatim"*, carries `iteration: <fix_plan_iteration>`. `task_9_plan.md` → G.2 says only *"`iteration` starting at 0"* and uses `<i>` in its heartbeats. Nothing in Task 9's `## Setup` rows or its G.2 text binds `<fix_plan_iteration>`. In the precedent, `user_review_fix_plan_writing_instructions_core.md` binds `<arch_iteration>` at its point of use. Have Task 9's G.2 bullet bind `<fix_plan_iteration>` by that name, and use it in the cap sentence (`<fix_plan_iteration> >= 5`) and in the heartbeat.

## Nice to Have

- None.
