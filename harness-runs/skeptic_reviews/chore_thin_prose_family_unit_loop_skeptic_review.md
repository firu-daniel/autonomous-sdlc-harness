# Skeptic Review: chore_thin_prose_family_unit_loop

## Context

**Branch:** `chore_thin_prose_family_unit_loop`. **Date:** 2026-10-12. **Reviewed:** the whole-branch diff against `dev` — `plugin/agents/committer.md`, `plugin/agents/layer-implementer.md`, `plugin/agents/layer-reviewer.md` and `.claude/context/conventions.md`. 26 run-artifact files excluded from the reviewed diff. **De-duplicated against:** `harness-runs/code_reviews/chore_thin_prose_family_unit_loop_code_review.md` and its seven findings. No parity review exists, because `phases.parity` is `false`. No architecture review exists for this branch.

**What was checked:**
- **Wiring.** Every inbound `→` citation into the three definitions still resolves. That covers `plugin/instructions/unit_loop_core.md` (the evidence-downgrade bold lead and the `## Resolved values` refused-call fallback), `plan_orchestration_instructions_core.md` (the `### Standard procedure (…)` heading), `improvement_observations_instructions.md`, `plugin/samples/sample_story_plan.md`, the eight state-dir README templates and `.claude/context/plugin.md`.
- **The committer's new caller pointer.** It resolves: `unit_loop_core.md` → `## Substitution table` has the `committer mode` and `committer extra args` columns and carries row `UR-A`. Phases A1.5.2, A2.2, B.3, C2.3, E.1, E.2 and G.3 all exist as headings.
- **Refusal paths and wire literals.** Every committer refusal path and every wire literal the story names survives.

**Headline.** The story claims that every sentence shared with an agent outside the family is kept byte-for-byte. That claim is false in two more places than the code review found.

**How they were found.** A 12-word-window comparison of the `dev` copies against every other `plugin/agents/*.md`, with each hit then confirmed as a whole sentence or clause by `git grep -F` on `dev` and on `HEAD`. It finds two more cross-family copies the branch forked, both of the class the code review's Findings 4 and 5 fixed. Its D3 split rule missed both: one copy differs from its siblings by a single word, and the other is a clause inside a longer sentence.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Restore the shared `## Resolved values` opening clause in `layer-reviewer` _(layer: plugin)_
2. [ ] **Finding 2** — Restore the shared harness-doctrine sentence closing `layer-implementer`'s `## Minimal prose` _(layer: plugin)_

---

## Must Fix

_None._

---

## Should Fix

### 1. `layer-reviewer` forked the `## Resolved values` opening clause that six other agents carry verbatim
→ [finding_1.md](chore_thin_prose_family_unit_loop_skeptic_review/finding_1.md)

### 2. `layer-implementer` forked the harness-doctrine sentence that closes `## Minimal prose`
→ [finding_2.md](chore_thin_prose_family_unit_loop_skeptic_review/finding_2.md)

---

## Nice to Have

_None._

---

## Intentional divergences (call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from. No divergence the plan or the code marks intentional needed the two-leg test.
