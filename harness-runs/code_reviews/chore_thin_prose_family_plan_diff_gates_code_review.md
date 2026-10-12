# Code Review: chore_thin_prose_family_plan_diff_gates

## Context

**Branch:** `chore_thin_prose_family_plan_diff_gates`
**Date:** 2026-10-12
**Reviewed:** the whole branch diff against `dev` (`6307573a`). Two files changed, both in the `plugin` layer: `plugin/agents/architecture-reviewer.md` (4915 → 4101 words) and `plugin/agents/business-parity-reviewer.md` (5922 → 4807 words). 10 run-artifact files excluded from the reviewed diff.

**Method.** Each thinned definition was read in full against its `6307573a` copy, paragraph by paragraph, to look for dropped rules, edge cases and wire literals. Everything below held:
- Every dispatch block is unchanged.
- Every caller anchor still resolves (`### 2. Business-parity review (plan-review mode)`, `### 3. Architecture review (plan-review mode)`, `### A1.5.1 Generate the parity review`, `### A2.1 Generate the architecture review`, `## Phase G — Run gates`, `### G.2 Write and review the test fix plan`, `test-fix-plan-writer.md` → **Rewrite machine paths before quoting.**).
- These are all intact: the `diff_base` row `plugin/agents/README.txt` quotes, the PASS no-write rule, the disabled-phase reason line, the *"do NOT `mkdir -p` here"* contract, the readiness heading, the rejected-findings rule and the return lines.
- No other file quotes any of the dropped sentences.
- The family check probe (`harness-runs/scratch/plan_diff_gates_family_check.mjs`), re-run with no arguments, prints `PASS`: frozen text, bold leads, `SHARED` lines, wire literals, unchanged reads and lower word counts.

No test was run, because this review runs none. `phases.parity` is `false`, so no parity cross-check applies.

**Result.** One behaviour narrowing remains: sub-cases (b) and (c) now read only the fix-plan index's `## Context` (Finding 1).

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Restore the whole-index read in `## Process` step 2 sub-cases (b) and (c) of both definitions _(layer: plugin)_

---

## Must Fix

### 1. Sub-cases (b) and (c) of `## Process` step 2 now read only the fix-plan index's `## Context`, not the whole index
→ [finding_1.md](chore_thin_prose_family_plan_diff_gates_code_review/finding_1.md)

---

## Should Fix

---

## Nice to Have

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from, and this section is empty.
