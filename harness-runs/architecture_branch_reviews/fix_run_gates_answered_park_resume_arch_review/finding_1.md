### 1. Autonomous forks restate the core G.0's Phase G consumption rule instead of citing it

**Severity:** Must Fix. **Layer:** plugin.

**Site anchors (all four are one finding: one rule copied into several forks):**

- `plugin/instructions/plan_orchestration_instructions_autonomous.md`, the paragraph opening `**The Phase G answer lookup.**`, at the sentences from "The core's `### G.0 Resolve the round` is the **only** consumer of those pairs" to "the gates once more after a round cap."
- `plugin/instructions/user_review_fixes_instructions_autonomous.md`, the paragraph opening `**The Phase G answer lookup.**`, at the sentences from "is the **only** consumer of those pairs, and only while the index they name is pending an answer" to "the gates once more after a round cap." Also the same claim in that file's `**On resume**` paragraph ("which consumes such a pair only when it names a test fix plan index pending an answer; any other Phase `G` pair is read by no agent, and the resumed G.0 follows its existing arms") and in its **Headless / watcher entry point** bullet ("That G.0 consumes only those pairs, and only when the index they name is pending an answer; every other Phase G park's answer is read by no agent").
- `plugin/instructions/task_plan_writing_instructions_autonomous.md`, `## Override 2 — resumability`, case **(a)**: the sentence "`### G.0 Resolve the round` consumes such a pair when it names a test fix plan index pending an answer (…), and any other Phase G pair is read by no agent, the resumed implementation half following that G.0's existing arms". Also the matching sentences in the `**Consume-then-archive (single ordering contract for resume).**` bullet ("Any other Phase G pair is read by no agent and is archived unread, and the resumed phase follows G.0's existing arms").
- `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md`, `## Override 2 — resumability`, case **(a)**: "a Phase `G` pair is consumed only by the fix-implementation phase's cited … `### G.0 Resolve the round`, and only when it names a test fix plan index pending an answer, and any other Phase `G` pair is read by no agent".

**Problem.** The rule for which Phase G answer pairs are consumed, which ones no agent reads, and which arm the resumed phase takes is mode-free. It has one owner: `plugin/instructions/plan_orchestration_instructions_core.md` → `### G.0 Resolve the round` → the paragraph opening `**Which Phase G answers G.0 consumes.**`. Each site above restates that rule in its own words instead of pointing to it. This breaks:

- `.claude/context/conventions.md` → `## Shared code, and where it lives`: "a mode-free core carries the flow, and a **thin fork** overrides only what the mode changes. A rule is stated once and a mode difference is visible as a fork, never as a second copy that drifts".
- `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule`: "A policy file is activated by pointer and never restated … a citer that paraphrases it becomes a second owner. The same rule governs every shared module here".
- `.claude/context/conventions.md` → `### Where a new responsibility goes`: "A responsibility that already has a home does not get a second one."

The copies have already drifted from their owner. The core's paragraph says such an answer "has one later path": when the same round's re-run G.2 leaves its index pending an answer, "the lookup also yields the earlier pair if it named that index's path, and G.0 passes it with the rest". Every fork copy instead says flatly that "every other Phase G pair … is **read by no agent**", with no exception. So an autonomous run reading its fork gets a different consumption rule from one reading the core. This is the silent drift the single-owner rule exists to prevent. With four copies, every later change to G.0's predicate becomes a five-file edit.

**Fix.** At each site above, keep only what the fork owns and replace the restated consumption rule with a citation of its owner.

- **Keep (mode-specific, fork-owned):**
  - the origin names the autonomous question file carries (`Phase G gates`, `Phase G test-fix-plan-writer`, `Phase G architecture-reviewer gate`);
  - that the parks G.0 consumes name the index by its repo-relative `<test_fix_plan_path>`, the string the `<park_answer_lookup>` row greps for;
  - why the lookup also searches `answered/` (the watcher's archive-on-exit, and a pause exit archiving nothing);
  - that the manual / interactive entry point writes no files;
  - each consumer's own exclusion: Override 2(a) does not append a Phase G pair to the `task-plan-writer` / `user-review-fix-plan-writer` dispatch, and **On resume** does not append one to an item or QA dispatch.
- **Replace:** every sentence that states which Phase G pairs G.0 consumes, that the others are read by no agent, or which arm the resumed G.0 takes. Use one pointer of this form: "which Phase G pairs are consumed, and what the resumed phase does with the rest, is `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `### G.0 Resolve the round` → **Which Phase G answers G.0 consumes.**". In the family-3 fork, write the same pointer as "the cited …" wording, as that file already does for its other citations of the core.

The new suite `cli/test/run-gates-park-answer.test.mjs`, case (c), asserts only that the origin string `Phase G test-fix-plan-writer` appears in the three forks' sections. The kept origin names satisfy it, so the suite needs no edit. The adopter-facing `cli/templates/state-dir/clarifications/README.md` sentence is outside this finding: it is a document an adopter reads, not a fork the flow executes.

- **Deviations from plan:** The same restated rule also sat in `plugin/instructions/plan_orchestration_instructions_autonomous.md` → **Headless / watcher entry point** bullet ("is consumed instead by the core's … `### G.0 Resolve the round` when it names a test fix plan index pending an answer, and is otherwise read by no agent"), which the finding's site list omits; it was reduced to a pointer at **The Phase G answer lookup.** under the finding's own Replace rule. The suite `cli/test/run-gates-park-answer.test.mjs` was not run (deferred to the Run gates phase, which runs `commands.test`).
