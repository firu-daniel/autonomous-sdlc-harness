# Task plan review — iteration 1

Iteration 0's Must Fix (Task 1, point 1's "nowhere else") is resolved: the replacement now reads "…`## Phase G — Run gates`; the suite runs nowhere else in the flow.", and the rule-inventory bullet now records that point 1 places no limit on point 2's per-unit typecheck.

I re-ran every command entry R1–R9c at `b7ebf1f0`. Each prints exactly the files its register rows name, so the command-entry closure holds. Every old text in Tasks 1–9 was found where the task says it is. The probe's `Before` figures reproduce exactly. The task prompt's line-repetition command prints 25 lines, and each has an owning task. The one gap is in procedure entry P2.

## Must Fix
1. **Scope register misses a site that derivation entry P2 reaches** — story index (`chore_thin_shared_agent_prose_story_plan.md`), `## Scope register`.
   P2's traversal is "every `${CLAUDE_PLUGIN_ROOT}/instructions/…` and `${CLAUDE_PLUGIN_ROOT}/samples/…` citation of them in `plugin/agents/*.md` at `b7ebf1f0`, grouped by the section it names". I re-walked it. It reaches `plugin/instructions/unit_loop_core.md` → `## Layer routing table`, and no row covers that section:
   - `plugin/agents/layer-implementer.md` → `## Invocation contract`: "…`unit_loop_core.md` → `## The unit loop` step 3, carrying three values its `## Layer routing table` supplies".
   - `plugin/agents/layer-reviewer.md` → `## Invocation contract`: "You carry **the same three layer values the implementer took**, from that file's `## Layer routing table`".

   `## Layer routing table` is its own `##` section of `unit_loop_core.md`, not part of `## The unit loop`. Rows 233–235 cover only `## The test-run rule`, `## The unit loop` and `## Substitution table`, so the closure invariant ("every site each procedure entry reaches appears as a row") does not hold for P2. The disposition looks clear: both citers are in the unit-loop family, and both citations point at the table that supplies their dispatch values. But the register has to record it.
   **Fix:** In the story index's `## Scope register` table, add one row for `plugin/instructions/unit_loop_core.md` → `## Layer routing table`: Copy `—`, Evidence `P2`, Disposition `no-change`, and a reason such as "cited only by `layer-implementer` and `layer-reviewer` (unit-loop family), as the source of their dispatch values; no other family reads it". Then re-walk P2 to confirm no other section it reaches lacks a row.

## Should Fix
1. **Row 234's reason leaves out two citers of `## The unit loop`'s subsections** — story index, `## Scope register` row 234. The reason says the section is "cited by `committer`, `layer-implementer`, `review-plan-reviewer` and `skeptic-reviewer` only… no agent reads it". It leaves out two more citations, both of subsections inside `## The unit loop`:
   - `layer-reviewer.md` cites `unit_loop_core.md` → `### Per-unit review step`, a dispatch-site back-pointer.
   - `statistics-plan-writer.md` cites `unit_loop_core.md` → `### The dispositioned outcome` to define a dispositioned unit. That is a read through a cited anchor, and only the fix-plan and statistics family makes it.

   `no-change` is still the right disposition, but the stated reason is inaccurate. Name both citations and why neither makes this a section that two or more families read. Alternatively, give each subsection its own row.
2. **Verification bullets state expected file counts** — for example Task 2 ("each list exactly the ten files"), Task 3 ("exactly the eleven `<docs_root>` files"), Task 4 ("exactly the eighteen files"), Task 5 ("exactly the twenty files") and Task 7 ("exactly the six `iteration` files"). Each count sits beside a named file list in that file's `### Targets`, which keeps the bullets checkable. Even so, a stated count goes stale silently if a target list is corrected in revision. Phrasing each bullet as "lists exactly the files under Targets" avoids that.
