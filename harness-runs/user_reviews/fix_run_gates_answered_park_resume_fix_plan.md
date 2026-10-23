# User-Review Fix Plan: fix_run_gates_answered_park_resume

## Context

**Branch:** `fix_run_gates_answered_park_resume`
**Source user review:** `harness-runs/user_reviews/fix_run_gates_answered_park_resume_review.md`
**Summary:** The user raised 2 observations, and both hold. First, the instruction prose the branch added for resuming an answered Phase G park is longer than its effect needs: it re-narrates routes that G.0 and G.2 already decide, repeats rationale across the two implementation forks, and adds similar explanatory sentences to the planning forks and `mode_contract.md`. Second, trimming `test-fix-plan-writer.md` to hold its word count removed two definitions the agent acts on. Every trim below keeps the behaviour unchanged, every edge case, every wire literal, and every anchor that `cli/test/run-gates-park-answer.test.mjs` or another file quotes.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom, and the committing role flips each one to `[x]` when that fix's commit lands. `[ ]` markers anywhere else, including the sub-step bullets inside the per-finding files, are informational only, and the committer never touches them.

Each entry points to a self-contained `harness-runs/user_reviews/fix_run_gates_answered_park_resume_fix_plan/finding_<K>.md` file through its `**Finding K**` reference. Entries are sorted from lowest blast radius first to wider changes last.

1. [x] **Finding 1** — Restore the *new this round* definition and the order and closing of the log sections in `test-fix-plan-writer.md`, without raising its word count. _(layer: plugin)_
2. [ ] **Finding 2** — Trim the `<park_answer_lookup>` row in `mode_contract.md` to its definition and justification. _(layer: plugin)_
3. [ ] **Finding 3** — Drop the archived-Phase-G-pair rationale from both planning forks' Override 2(a), and tighten the Consume-then-archive statement. _(layer: plugin)_
4. [ ] **Finding 4** — Shorten **The Phase G answer lookup.** paragraph and the row pointers to it in both implementation forks. _(layer: plugin)_
5. [ ] **Finding 5** — Trim G.0's arm sentence, **Which Phase G answers G.0 consumes.**, G.2's restated return arm, and G.5's cap paragraph in the plan-orchestration core. _(layer: plugin)_

---

## Must Fix

### 1. `test-fix-plan-writer` lost two definitions it acts on when it was trimmed to hold its word count
→ [finding_1.md](fix_run_gates_answered_park_resume_fix_plan/finding_1.md)

---

## Should Fix

### 2. The `<park_answer_lookup>` row in `mode_contract.md` restates rules other files own
→ [finding_2.md](fix_run_gates_answered_park_resume_fix_plan/finding_2.md)

### 3. The planning forks explain archived Phase G pairs in sentences no case acts on
→ [finding_3.md](fix_run_gates_answered_park_resume_fix_plan/finding_3.md)

### 4. **The Phase G answer lookup.** is nearly duplicated in both implementation forks and is mostly rationale
→ [finding_4.md](fix_run_gates_answered_park_resume_fix_plan/finding_4.md)

### 5. The Phase G core re-narrates routes that G.0's arms and G.2's returns already decide
→ [finding_5.md](fix_run_gates_answered_park_resume_fix_plan/finding_5.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK

Both observations are valid, so nothing is listed here. One part of observation 1 was checked and deliberately left alone: the added text in `user_review_fixes_instructions_autonomous.md` outside **The Phase G answer lookup.** paragraph stays. That is the headless bullet's naming of a Phase G park's origin and index, and the **On resume** paragraph's rule that a Phase G pair is never appended to an item or QA dispatch. Both are routing rules the fork acts on. The headless bullet is also where the review fork satisfies test case (c).

---

## Source observations

Verbatim copy of `harness-runs/user_reviews/fix_run_gates_answered_park_resume_review.md`:

1. The instruction prose this branch added is longer than its effect needs, against `.claude/context/plugin.md` → `## Writing agent prose` ("A rule is a direct instruction", "Each rule is stated once", "Drop rationale the agent does not act on. Keep every edge case."). The instruction files grew about 2,300 words (`plan_orchestration_instructions_core.md` +1,123, `user_review_fixes_instructions_autonomous.md` +425, `plan_orchestration_instructions_autonomous.md` +301, `task_plan_writing_instructions_autonomous.md` +245, `mode_contract.md` +208). Candidates I noticed, for the fix plan to verify and decide on:
   - `### G.0 Resolve the round` → **Which Phase G answers G.0 consumes.** (~263 words) walks through what happens to every other kind of Phase G park, which G.0's arms already decide.
   - **An answered park never buys a fresh cap.** went from 99 to 243 words and re-narrates the G.0 and G.2 routes; the new fact looks like one sentence.
   - **The Phase G answer lookup.** paragraph is nearly duplicated in `plan_orchestration_instructions_autonomous.md` and `user_review_fixes_instructions_autonomous.md`, and is mostly about why the lookup also searches `answered/`.
   - The `<park_answer_lookup>` row in `mode_contract.md`, the "This arm runs first because…" sentence in G.0, and the "Its answer is read by no agent…" restatements in G.2's return arms.
   Trim so the behaviour is unchanged: keep every edge case, every wire literal (`Park answer:`, `Park answer consumed:`, `**Authorised by:**`, the origin strings) and every cited anchor that `cli/test/run-gates-park-answer.test.mjs` or another file quotes.
2. To hold `test-fix-plan-writer.md` at its word count, the branch trimmed existing text, and two definitions may have gone with it: in step 2, what *new this round* means (absent from the previous round's log), and in step 1, the order in which the typecheck and test sections appear in the log. Check whether either was an edge case the agent acts on, and restore it if so without raising the agent's up-front word count.
