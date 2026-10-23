# Architecture review — iteration 3

The iteration-2 Must Fix is resolved in the artifact, using option (b). The ship order is now 1, 6, 3, 4, 2, 5. Task 6 adds the `## Binding vocabulary` row in the first commit that names `<park_answer_lookup>`, and in the same commit it rewords the family-1 core's "one of the eleven names" bullet so it carries no count. The row's *Exists because* cites only the existing `### G.0 Resolve the round` heading and the rule (4) bar. `## Context` → **Ship order and every interim state** shows that the name is in the vocabulary in every interval. Scope register rows 20 and 29 carry Task 6. Task 2 and Task 3 each check that Task 6 has landed before they start. The findings from iterations 0 and 1 stay resolved. No plan file asks for a forbidden test run: Task 5 runs only the test file it creates. There is no `## Rejected findings` section to test.

## Must Fix

1. **After Task 2's commit, Phase G's lead paragraph still says the only bindings Phase G uses are `<escalate>`, `<committer_push>` and `<per_unit_review>`, and that every other `<…>` name in the phase is a path placeholder. G.0 then reads `<park_answer_lookup>` under that paragraph.** Offending files: `task_2_plan.md` (`### Targets` and **Work**, which never touch the paragraph) and `fix_run_gates_answered_park_resume_story_plan.md` → `## Scope register` row 2, which lists the sections of `plan_orchestration_instructions_core.md` that change and leaves this paragraph out. Rules violated:
   - `plugin/instructions/mode_contract.md` → `### Bindings vs. path placeholders`: "Both vocabularies are spelled `<…>`, and conflating them is silent."
   - `.claude/context/plugin.md` → `## The placeholder vocabulary`: "Two `<…>` vocabularies exist and conflating them is silent".
   - `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule`, rule 5. The citing family-3 core runs this section by reference, so the section has to state the complete set of bindings it consumes.

   The blockquote that opens `plugin/instructions/plan_orchestration_instructions_core.md` → `## Phase G — Run gates` is the section's own statement of which of its names are bindings. It exists because the section is "written to be executed by a flow from another family too". The paragraph reads: "The **Mode-contract bindings** it uses are `<escalate>` and `<committer_push>` — plus `<per_unit_review>`, via the unit-loop row G.4 runs … Every **other** `<…>` name here … is a **path placeholder** and resolves from the `## Setup` of the flow's **own entry core**". It also lists the names that are "bound below, at their point of use" (`<gate_round>`, `<log>`, `<iteration>`, `<test_fix_review_index>`).

   Task 2 makes G.0 read `<park_answer_lookup>`. It also has G.0 bind the answer pairs (`<question_file>` / `<answer_file>`) at their point of use, and gives `<log>` a second binding site in G.0's new arm. None of this reaches the paragraph. A family-3 executor reads that paragraph to decide where each name resolves from. It would classify `<park_answer_lookup>` as a path placeholder and look for it in family 3's `## Setup`, where no Setup defines it. Under `### Bindings vs. path placeholders` → **The reader's tell**, an unresolved path placeholder does not halt the flow. So the pending-answer arm would lose its binding without any sign, which is the conflation the rule warns about. The same paragraph would then contradict the core's own binding table, which Task 2 does update.

   **Fix:** In `task_2_plan.md`:
   - Add the `## Phase G — Run gates` lead blockquote to `### Targets`.
   - Add a Work bullet that amends the blockquote's binding list to name `<park_answer_lookup>`, read at `### G.0 Resolve the round`'s pending-answer test, and that adds `<question_file>` / `<answer_file>` (the pairs G.0 binds) to the "bound below, at their point of use" list. Leave the rest of the blockquote byte-identical.
   - Add a verification line: `grep -n '<park_answer_lookup>' plugin/instructions/plan_orchestration_instructions_core.md` also hits that blockquote.

   In the story index, add the blockquote to `## Scope register` row 2's site cell.

## Should Fix

None.

## Nice to Have

None.
