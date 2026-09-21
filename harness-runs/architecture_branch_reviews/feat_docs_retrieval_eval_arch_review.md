# Architecture review — `feat_docs_retrieval_eval`

## Context

Branch `feat_docs_retrieval_eval`, reviewed 2026-09-21 against `dev...HEAD` in implemented-solution
mode: 40 changed files, 8,413 insertions — the new `evals/docs-retrieval/` eval runner and its two
committed corpora, one new `cli/test/` suite, one constant and its header in `cli/src/retrieval/`,
gate 11 in `scripts/run-gates.sh` and `docs/development.md` §5, and four `docs/` documents plus
`README.md` and `llms.txt`. 29 run-artifact files excluded from the reviewed diff.

**Headline conclusion: the layering holds.** Every new file lands in the layer its kind belongs to —
the eval runner under `evals/`, which `.claude/context/conventions.md` → `## The layers` gives to
`general`; the suite under `cli/test/`; the figures and the procedure under `docs/`, which that same
document's `### Where a new responsibility goes` names as the only home for a measured fact. The
`evals/docs-retrieval/README.md` module table gives every module one responsibility, the arm table
and the layer list are each read from their single owner rather than copied, and gate 11 lands with
its `docs/development.md` §5 row, its `run-gates.sh` invocation and its three-outcome grading. The
three Must Fix findings below are all **second copies of something that already has an owner**: two
retypings of `cli/src/retrieval/` surfaces inside the new suite, and one deferral recorded in `docs/`
with no owning roadmap row.

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — `LIMIT = 50` retypes the exported `ARM_CANDIDATES` _(layer: cli)_
2. [ ] **Finding 2** — a deferral in `docs/retrieval.md` cites no numbered roadmap item _(layer: general)_
3. [ ] **Finding 3** — the new suite retypes `store.ts`'s BM25 index and lexical ordering SQL _(layer: cli)_

## Must Fix

### 1. `LIMIT = 50` retypes the exported `ARM_CANDIDATES`
→ [finding_1.md](feat_docs_retrieval_eval_arch_review/finding_1.md)

### 2. A deferral in `docs/retrieval.md` cites no numbered roadmap item
→ [finding_2.md](feat_docs_retrieval_eval_arch_review/finding_2.md)

### 3. The new suite retypes `store.ts`'s BM25 index and lexical ordering SQL
→ [finding_3.md](feat_docs_retrieval_eval_arch_review/finding_3.md)

## Should Fix

### 4. A third `${HARNESS_AGENT_CLI:-claude}` read site, outside the inventory's derivation scope
→ [finding_4.md](feat_docs_retrieval_eval_arch_review/finding_4.md)

## Nice to Have

_None._
