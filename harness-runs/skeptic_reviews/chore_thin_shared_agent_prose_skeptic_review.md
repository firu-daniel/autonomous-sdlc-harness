# Skeptic Review: chore_thin_shared_agent_prose

## Context

**Branch:** `chore_thin_shared_agent_prose`
**Date:** 2026-10-12
**Reviewed:** the whole branch diff against `dev`: 21 files in the `plugin` layer, with 235 insertions and 215 deletions. Of those, 20 are agent definitions. The 21st is `plugin/instructions/unit_loop_core.md` → `## The test-run rule`.

19 run-artifact files excluded from the reviewed diff.

**De-duplicated against:** `harness-runs/code_reviews/chore_thin_shared_agent_prose_code_review.md` and its two findings. Both are already applied: the steering block's sanctioned-dispatch scope, and the review-plan-reviewer "and so do" fix. No parity review exists, because `phases.parity` is `false`. No branch-level architecture review exists for this branch. Lessons-ledger entries are out of scope.

**What was checked adversarially:**

- **Check 3 (citations):** the task prompt, the story plan's scope register and settlements, and the research reports they cite.
- **Check 1, adapted to prose:** whether any thinned text drops a rule or a literal that another file quotes or parses. Every dropped phrase was searched for across `plugin`, `cli`, `scripts`, `docs` and `schemas`, and nothing quotes one. The literals that `flow-walker-gates.sh` parses survive: `## Rejected findings` and `call stands`.
- **Check 4 (re-grading intentional choices):** the plan's recorded calls on Task 10's recipients were re-graded against the per-agent research.

**Headline conclusion.** The thinning in Tasks 1–9 keeps the rules it touches. Task 10's precedence sentence does not. In three of its ten recipients, the definition was silent about the routed document, not narrower than the routing table, so the old behaviour was to read it as well. The sentence now excludes it: the unit-loop implementer and reviewer stop reading the shared cross-layer document, and business-parity-reviewer stops reading the lessons ledger. That breaks the task prompt's "Behaviour does not change" constraint.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Remove the read-list precedence sentence from layer-implementer, layer-reviewer and business-parity-reviewer, whose read lists were additive, not narrower _(layer: plugin)_

---

## Must Fix

### 1. Task 10's precedence sentence makes three agents stop reading documents they read before, so the unit loop loses the cross-layer rules and business-parity-reviewer loses the lessons ledger
→ [finding_1.md](chore_thin_shared_agent_prose_skeptic_review/finding_1.md)

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

- **Verified-OK: the other seven precedence-sentence recipients.** Each of these definitions already states a narrower read list, so the sentence settles a real conflict rather than creating one: `test-fix-plan-writer`, `user-review-fix-plan-writer`, `conventions-writer`, `conventions-reviewer`, `statistics-plan-writer`, `ui-tests-plan-writer` and `ui-tests-plan-reviewer`.
- **Verified-OK: the per-agent differences the story index lists.** Each was confirmed in the diff and kept on purpose: the unit-loop parity row wording, the two reviewers' extra guard carve-out sentence, the user-observation sentence that `test-fix-plan-writer` lacks, and the `<state_dir>` pathspec form.
