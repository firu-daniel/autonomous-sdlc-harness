# Task plan review — iteration 0

## Must Fix
1. **Scope register derivation C3 is under-inclusive: it misses files that quote the family's contracts by agent name** — story index (`chore_thin_prose_family_task_plan_story_plan.md`), `## Scope register`.
   C3 greps only for the filenames `task-plan-writer.md` / `task-plan-reviewer.md`. Many files cite the two definitions by **agent name** (`task-plan-writer`, `task-plan-reviewer`, no `.md`) and quote their wire literals or contracts, so no derivation entry reaches them. The plan's own text proves at least one is a real site. Context says the `## Corpus staleness` heading and its type tokens are "matched by `plugin/instructions/plan_orchestration_instructions_autonomous.md`", and Task 4's Verification re-checks that file. Yet no command prints it and it is not a row. Other sites that quote family contract text without the `.md` name:
   - `plugin/instructions/task_plan_writing_instructions_autonomous.md` consumes the writer's `## Questions` return and the reviewer's `verdict: PASS`.
   - `plugin/agents/ui-tests-plan-writer.md` has "Same shape as the `task-plan-writer`'s revision mode" and "## Split output spec (mirror the `task-plan-writer` exactly)".
   - `plugin/agents/ui-tests-plan-reviewer.md` has "same PASS/FAIL output contract".
   - `plugin/agents/architecture-reviewer.md` has "with the same argument names as `task-plan-reviewer`".
   - `plugin/instructions/dispatch_discipline_instructions.md` lists `task-plan-reviewer` in the roster that carries `## Unsolicited dispatch guidance`.
   - `cli/templates/scripts/flows/task_plan_writing.graph.json` and `scripts/flows/task_plan_writing.graph.json` are the template and adopted copies of the flow graph that dispatches both agents.

   Re-running the wider command below reaches every one of these sites. None of them is a row (sites already in the register are left out):
   - `plugin/instructions/README.md`
   - `plugin/instructions/run_mode_instructions.md`
   - `plugin/instructions/dispatch_discipline_instructions.md`
   - `plugin/instructions/autonomous_pause_and_ledger.md`
   - `plugin/instructions/plan_orchestration_instructions_autonomous.md`
   - `plugin/instructions/task_plan_writing_instructions_autonomous.md`
   - `plugin/instructions/task_plan_writing_instructions_semi_autonomous.md`
   - `plugin/agents/architecture-reviewer.md`
   - `plugin/agents/business-parity-reviewer.md`
   - `plugin/agents/ui-tests-plan-writer.md`
   - `plugin/agents/ui-tests-plan-reviewer.md`
   - `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`
   - `plugin/commands/branch-start-plan-semi-autonomous.md`
   - `plugin/commands/branch-start-docs-autonomous.md`
   - `cli/templates/scripts/flows/task_plan_writing.graph.json` (template copy)
   - `scripts/flows/task_plan_writing.graph.json` (adopted copy)
   - `cli/test/flow-walker.test.mjs`
   - `cli/test/flow-walker-resume.test.mjs`
   - `cli/test/flow-walker-ui-and-reentry.test.mjs`
   - `docs/retrieval.md`
   - `docs/second-runtime-port-decision.md`
   - `ARCHITECTURE.md`

   **Fix:** In the story index's `## Scope register`, replace C3 with this wider, read-only command. Its pattern is a superset of the current one, and it adds the root prose document that matches:
   `grep -r -l -E 'task-plan-(writer|reviewer)' --exclude-dir=work-report-research plugin cli/templates cli/src cli/test scripts docs ARCHITECTURE.md`
   Then add one row per newly reached site listed above, with `Evidence` C3 and a `Disposition` (most will be `no-change`, with the reason naming the literal or contract each quotes and the task that keeps it byte-for-byte). Give the two `task_plan_writing.graph.json` copies one row each, with `Copy` = `template` / `adopted copy`, like rows 8 and 9. Re-run C1–C3 and confirm every path they print is a row.

## Should Fix
1. **Task 1 removes text that Task 4 is told to "keep" in a section that does not contain it** — `task_1_plan.md` and `task_4_plan.md`.
   - Task 1 cuts **How the caller consumes your return** down to the frozen `## Questions` sentence plus a pointer to `## Output contract`. Its reason is that `## Output contract` "already states" the rest.
   - At `4cbe7f72`, though, `## Output contract` does not say that the caller "reads back `story_file`, `task_files_dir` and `tasks_count` and carries them into its hand-off without opening the plan files". That clause exists only in the Invocation contract paragraph Task 1 is cutting.
   - Task 4's Work bullet nevertheless says to "Keep that the caller reads back `story_file`, `task_files_dir` and `tasks_count` without opening the plan files".

   An implementer of Task 4 cannot tell whether to add that clause or drop it.

   **Fix:** Decide whether the clause survives. If it does, Task 4 should say "add, moved from `## Invocation contract`", and Task 1 should name it as moving to `## Output contract`. If it does not (it is rationale the writer does not act on), delete it from Task 4's "keep" list.

## Nice to Have
1. **Task 8's literal list omits the reviewer's cross-file anchor** — `task_8_plan.md`. The reviewer's citation "step 5's conventions-document prohibition" is listed as wire text in `task_7_plan.md` and named in the story index's Context as an anchor that must survive. The probe's `LIT['task-plan-reviewer.md']` array does not include it. Adding it would let the mechanical check cover that anchor as well.
