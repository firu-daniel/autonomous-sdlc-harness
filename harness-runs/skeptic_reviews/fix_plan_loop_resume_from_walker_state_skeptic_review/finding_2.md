### 2. `mode_contract.md` class (i) *Reason:* still says §1.7 names the planner's Override 2 "with neither filename nor heading"

**File:** `plugin/instructions/mode_contract.md` → `### Sanctioned cross-fork anchors` → class (i)'s *Reason:* paragraph, the sentence beginning "The planner's section is named as `Override 2(a)`, with neither filename nor heading, by"

**The problem.** The registry sentence reads:

> The planner's section is named as `Override 2(a)`, with neither filename nor heading, by `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md` → `### 1.7 Resume-from-ledger (every fork, on every (re-)entry)` and by `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_autonomous.md` → its **Resume-from-ledger** paragraph;

This branch added a new sentence to §1.7 step 4 that cites the same section by filename and heading:

> as `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability` applies it.

§1.7 step 5 still uses the bare label (`Override 2(a)`), so the sentence is now only half true of §1.7.

The paragraph uses this sentence to argue that every citing site "must be **rewritten**, not repointed". §1.7 step 4 is now a citation that a relocation only has to repoint.

**Who is misled.** Someone who later relocates class (i) to a family-neutral core, as that section's closing paragraph plans, reads this sentence to scope the move. They would treat §1.7 as holding only label citations and would miss that step 4 needs a heading repoint. The paragraph does tell them to re-derive the citers by grep, so the grep would still find step 4. That is why this is Should Fix: the sentence is wrong, but no decision depends on it alone.

**Provenance.** The plan-time architecture review raised this twice (`harness-runs/architecture_reviews/fix_plan_loop_resume_from_walker_state/review_1.md` → `## Should Fix` item 1, *"Carried over from iteration 0, still unaddressed"*). It was never applied. The story index's `## Scope register` row 8 kept `no-change`, and its reason covers only the heading and the `Override 2(a)` label. The end-of-branch code review did not raise it.

**Fix.** In that sentence, replace:

> The planner's section is named as `Override 2(a)`, with neither filename nor heading, by `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md` → `### 1.7 Resume-from-ledger (every fork, on every (re-)entry)` and by

with:

> The planner's section is named as `Override 2(a)`, with neither filename nor heading, by `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md` → `### 1.7 Resume-from-ledger (every fork, on every (re-)entry)` step 5 — whose step 4 also cites it by filename and heading, a citation a move only repoints — and by

Leave the rest of the sentence and the paragraph unchanged, and leave both class (i) bullets unchanged.
