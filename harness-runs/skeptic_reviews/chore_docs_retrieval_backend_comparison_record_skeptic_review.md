# Skeptic Review: chore_docs_retrieval_backend_comparison_record

## Context

**Branch:** `chore_docs_retrieval_backend_comparison_record`
**Date:** 2026-10-22

**What was reviewed.** I reviewed the whole branch diff against `origin/dev`. `defaultBranch` is `dev`, which has no local ref in this checkout, so the remote-tracking ref was the diff base. The diff is prose only:
- `docs/retrieval-eval-results.md`, Tasks 1, 2, 3 and 5;
- `docs/retrieval-eval.md`, Task 4.

12 run-artifact files excluded from the reviewed diff.

**De-duplicated against** `harness-runs/code_reviews/chore_docs_retrieval_backend_comparison_record_code_review.md` and its two findings, both already applied. No parity review exists (`phases.parity` is `false`), and no architecture review exists for this branch.

**What was verified first-hand:**
- **The fresh reading's figures.** I re-ran `harness-runs/scratch/backend-parity/compare-scratch.mjs fixture-catalog` deterministically over the recorded scratch blocks. Every arm figure, per-query count, abstention set and rerank delta the new subsection records matches.
- **The diagnosis lead.** Its stated order matches the section's `###` headings in file order.
- **The shipped end state.** **What shipped.** and `#### The shipped end state at refresh level` support:
  - "every refresh that wrote anything, … and any refresh whose index is not marked rebuilt";
  - the "11 of 12" figure;
  - the "one-hit residuals".
- **The TypeScript eval route.** It builds through `refreshIndex` (`evals/docs-retrieval/index-build.mjs`), so the "both backends in the `REINDEX` state" premise holds.
- **The `#573` provenance.** It matches the task prompt.

**Headline.** One net-new finding. Item 4's **Arms D and E** concludes that arm B contributes nothing to the fresh reading's fusion. Only arm B's top five was compared, and both backends fuse each arm's top 50. The reading's own `q-fc-route-choice` arm D difference shows that inputs past rank five differ.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Stop attributing the fresh reading's arm D and E differences to the vector arm and reranker alone _(layer: general)_

---

## Must Fix

None.

---

## Should Fix

### 1. Divergence source 4's **Arms D and E** claims arm B adds no difference to the fresh reading's fusion, but only arm B's top five was compared
→ [finding_1.md](chore_docs_retrieval_backend_comparison_record_skeptic_review/finding_1.md)

---

## Nice to Have

None.

---

## Intentional divergences surviving the two-leg test (call-outs)

None. `phases.parity` is `false`, and the diff marks no divergence as intentional.
