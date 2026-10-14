# Architecture review — iteration 0

## Must Fix

1. **Task 5 adds undeclared `<…>` names to B.2, C2.2 and G.2, and the core's own vocabulary rule would treat them as path placeholders that `## Setup` never defines** — offending file: `task_5_plan.md`. Rule source: `.claude/context/plugin.md` → `## The placeholder vocabulary` ("Two `<…>` vocabularies exist and conflating them is silent ... every other `<…>` name is a **path placeholder** and resolves from the flow's own entry core `## Setup`").

   Task 5 tells the implementer to replace each dispatch block's `iteration: <iteration>` with "a separately named next-free index, e.g. `iteration: <meta_review_index>`" in B.2 and C2.2, and to make "the same split" in G.2 without naming G.2's index at all. It never says where the new name is declared. Under `plugin/instructions/plan_orchestration_instructions_core.md`'s own rules, that leaves the names unclassified:
   - The `## Phase G — Run gates` preamble lists the names that are "neither kind" as a closed set: "`<gate_round>`, the wrapper's `<log>` and the counter `<iteration>` are neither kind: they are bound below, at their point of use". Every other `<…>` name in that phase "is a **path placeholder** and resolves from the `## Setup` of the flow's own entry core".
   - `## Stop conditions` qualifier (ii) says the same for the whole file: "Every **other** `<…>` name in this file is a **path placeholder**".

   A new `<…_index>` name in G.2 or B.2/C2.2 that is not added to those statements is, by the file's own contract, a Setup-resolved path placeholder that no `## Setup` row defines. Its sibling tasks do declare their new names. Task 3 binds `<parity_review_index>` / `<arch_review_index>` in the user-review core's "neither kind" sentence. Task 7 adds `<review_index>` to `unit_loop_core.md` → `### Placeholder resolution` → "**Three kinds of name are neither**". Task 5 is the one keying task that leaves its names unclassified.

   **Fix:** In `task_5_plan.md`, fix the names rather than leaving them as "e.g.": for example `<meta_review_index>` for B.2 and C2.2, and a named index for G.2 such as `<test_fix_review_index>`. Then add Work bullets that:
   - (a) add G.2's name to the `## Phase G — Run gates` preamble's "neither kind … bound below, at their point of use" list, beside the counter `<iteration>`;
   - (b) state, in the sentence that introduces each B.2 / C2.2 dispatch block, that the new name is bound there at its point of use and is neither a binding nor a path placeholder, matching Task 3's and Task 7's treatment;
   - (c) add a Verification bullet: `git grep -n '<meta_review_index>\|<test_fix_review_index>' -- plugin` shows each name's binding sentence and its dispatch-block uses only.

## Should Fix

1. **Task 10 makes step 5 consume `<per_unit_review>` but leaves the binding table's `Used at` cell unchanged** — offending file: `task_10_plan.md`. Rule source: `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule` (rule 1, no defaults), together with `plugin/instructions/mode_contract.md`'s requirement that a core declare in its own binding table every binding its sections consume. In `unit_loop_core.md` → `## Mode contract — bindings this file uses`, the `<per_unit_review>` row lists its uses as step 4, `### Per-unit review step` and `## Layer routing table`. After Task 10, step 5 reads that binding too, to decide whether to send `unit_findings_folder:`. The plan correctly mints no new binding, but the `Used at` cell would then under-report where the binding is read. **Fix:** add a Work bullet to update that row's `Used at` cell to include `## The unit loop` step 5 (the `unit_findings_folder:` argument).

2. **Task 9 adds a new dispatch key without adding it to `committer.md`'s `## Resolved values` list of dispatch keys** — offending file: `task_9_plan.md`. Rule source: `.claude/context/plugin.md` → `## The sections an asset carries` / `## The placeholder vocabulary`. The `## Resolved values` lead sentence in `plugin/agents/committer.md` lists the dispatch keys whose values the body resolves where they appear (`plan_path`, `task_file`, `meta_findings_folder`, …). Task 15 updates the equivalent list in `qa_test_instructions.md` for its new names, but Task 9 does not do the same for `unit_findings_folder`. **Fix:** add a Work bullet to add `unit_findings_folder` to that list, beside `meta_findings_folder`.

## Nice to Have

None.
