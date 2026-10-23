# Architecture review — iteration 2

The iteration-1 Must Fix is fixed in the artifact. The ship order is now 1, 3, 4, 2, 5, 6. Tasks 3 and 4 bind `<park_answer_lookup>` in all four forks, and Task 4 declares it in `user_review_fixes_instructions_core.md` in the same commit as the two family-3 fork rows. Both land before Task 2's G.0 read. `## Context` → **Ship order and every interim state** walks each interval, and the invariant sentence is there. The iteration-0 findings stay resolved. No plan file asks for a forbidden test run: Task 5 runs only the test file it creates. There is no `## Rejected findings` section to test.

## Must Fix

1. **Until Task 6 lands, `<park_answer_lookup>` is not a mode-contract binding by the corpus's own definition, yet Tasks 3, 4 and 2 declare it, bind it and read it as one** — `fix_run_gates_answered_park_resume_story_plan.md` (`## Context` → **Ship order and every interim state**, the **After Task 5 and after Task 6.** bullet, and the readiness order, which puts Task 6 last), `task_6_plan.md` (**Depends on:** Tasks 2, 3 and 4), and `task_2_plan.md` (**The binding count.** bullet). Rules violated: `plugin/instructions/mode_contract.md` → `### Bindings vs. path placeholders` ("A **mode-contract binding** is one of the names in the table above … Every other `<…>` name a core or a cited file uses … is a **path placeholder**"). `.claude/context/plugin.md` → `## The placeholder vocabulary` restates this ("Two `<…>` vocabularies exist and conflating them is silent"). `.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent` ("Contract before consumer, always").
   Look at the tree for the three commits from Task 3 through Task 2, and the one after Task 5. The name sits in four fork binding tables and two core binding tables, and G.0 reads it, but it is not in `## Binding vocabulary`. The family-1 core defines its stop condition by that vocabulary: `plugin/instructions/plan_orchestration_instructions_core.md` → `## What you must NOT do`, "A **Mode-contract binding** — one of the eleven names in `mode_contract.md`'s binding vocabulary, **and** in this file exactly the ones its own `## Mode contract — bindings this file uses` table declares". So after Task 2's commit, G.0's read of `<park_answer_lookup>` is a read of a name that is not a binding. A reader that follows `### Bindings vs. path placeholders` resolves it as a path placeholder from the entry core's `## Setup`, and no Setup defines it. Rule (1)'s stop condition does not reach it either. The plan's invariant ("nothing is unbound and nothing is undeclared") is stated in binding terms, so it holds only once the vocabulary row exists. The vocabulary row is the contract and the core and fork rows are its consumers. Shipping the contract last inverts contract-before-consumer.
   A second interim defect follows from any order that adds the vocabulary row before Task 2. The core's "one of the eleven names" goes stale as soon as a twelfth row exists, and Task 2 is the only task that rewords it.
   The plan's reason for putting Task 6 last is that the row's "Exists because" cell cites its sites "as they stand". That reason does not outweigh the definition above. The row can say why it exists without depending on sites that do not exist yet. Rule (4) bars the core from naming `<state_dir>/clarifications/<branch>/…`, and that alone is enough.
   **Fix:** Make the vocabulary row land in or before the first commit that names `<park_answer_lookup>`, and remove the stale count in that same commit. Either option works:
   - (a) Move Task 6's `## Binding vocabulary` row into **Task 3**, which is the first commit to name the binding. Also move Task 2's **The binding count.** rewording of the `## What you must NOT do` bullet in `plan_orchestration_instructions_core.md` into Task 3. Both changes are in `plugin`, so Task 3 stays single-layer. Drop Task 6, or keep it as an empty-of-work task only if the readiness list needs it, and renumber nothing else. Word the row's *Exists because* on the rule (4) bar and the G.0 resume need. The example binding site it cites (the autonomous fork's `<park_answer_lookup>` row) lands in the same commit.
   - (b) Reorder so that Task 6 ships **first among Tasks 3, 4, 2 and 6** (1, 6, 3, 4, 2, 5). Fold the count-free rewording from Task 2 into Task 6. Reword the row's *Exists because* so it claims no site that has not landed yet: state the rule (4) bar and the G.0 resume need, and name no fork row as an existing example, or name it only after Task 3 lands.

   Whichever option you choose, update these to match the new order:
   - `## Context` → **Ship order and every interim state**: for every interval, show that the name is in the vocabulary;
   - the readiness list;
   - the Scope register owning-task cells for rows 2 and 20;
   - `task_2_plan.md` → **Where this file stops.** and its **No stale binding count.** verification bullet;
   - `task_3_plan.md` / `task_4_plan.md` → **Where this file stops.**

## Should Fix

None.

## Nice to Have

None.
