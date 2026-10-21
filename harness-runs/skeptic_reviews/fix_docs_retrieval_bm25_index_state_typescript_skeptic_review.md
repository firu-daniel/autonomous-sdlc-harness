# Skeptic Review: fix_docs_retrieval_bm25_index_state_typescript

## Context

**Branch:** `fix_docs_retrieval_bm25_index_state_typescript`
**Date:** 2026-10-21
**Reviewed:** the whole-branch diff against the merge base `d15e5cc3` of `origin/dev`. This checkout has no local `dev` ref. The diff covers 13 files: `cli/src/retrieval/store.ts` and `refresh.ts`; the new `cli/test/docs-retrieval-refresh-end-state.test.mjs` and case (c) of `cli/test/docs-retrieval-store.test.mjs`; `evals/docs-retrieval/bm25-refresh-rule.mjs`, `bm25-history.mjs` and `floor.json`; and the documents of record. 24 run-artifact files were excluded from the reviewed diff.

**De-duplicated against:** `harness-runs/code_reviews/fix_docs_retrieval_bm25_index_state_typescript_code_review.md` and its Findings 1–3: the `END_STATE_STATEMENTS` export, the untested marker branches, and the history-independence claim in `docs/retrieval.md`. Also checked was the plan-level `harness-runs/architecture_reviews/fix_docs_retrieval_bm25_index_state_typescript/review_0.md`. No branch-level architecture review and no parity review exist (`phases.parity` is `false`).

**Adversarial checks.**
- **Caller check.** `rebuildIndexes()` is reached from `refreshIndex`. `refreshIndex` is reached from `session.refresh`, which `server.ts` (`search_docs`) and `commands/docs.ts` (index and search) both call. The `INDEX_STATE_*` constants are consumed. `LEXICAL_SEARCH_STATEMENT` is consumed by `lexicalSearch`, the store test and `bm25-history.mjs`. The changed `measureRefreshRule` signature has one caller, the launcher in the same module.
- **Marker state machine.** Every path ends `rebuilt`: a first build, an embedder change, deletes only, upserts only, an unchanged refresh over an unmarked or `pending` index, and a width change. A refresh that throws before `rebuildIndexes()` returns leaves `pending`.
- **Score-0 filter.** Matches score strictly below `0`, so they sort before every score-`0` row. Filtering after `LIMIT` therefore cannot drop a match.
- **Citations.** The cited task-prompt leads, the floor arithmetic, the same-commit re-record in `0c4630e5`, and every `docs/retrieval-eval-results.md` heading the documents cite all exist and say what is claimed.
- **Divergences.** The vector-index statement kept out of `END_STATE_STATEMENTS` is supported by the lessons rule and by the story plan's Q1/Task 5 decision.

**Headline.** No Must Fix. One net-new Should Fix: the two documents that list what the Python store no longer issues unchanged miss a third changed statement and the new `rebuildIndexes` method.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Name the widened width-change `DELETE FROM meta` and the missing `rebuildIndexes` in the two lists of what `store.py` does not yet carry _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The two documents listing what `store.py` no longer issues unchanged omit the widened width-change `DELETE FROM meta` and the new `rebuildIndexes` method
→ [finding_1.md](fix_docs_retrieval_bm25_index_state_typescript_skeptic_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

- **No vector-index statement in the end state.** `docs/retrieval-eval-results.md` → `#### The vector arm after a refresh with deletes, before the fix` records that forced onto `chunks_hnsw`, the graph still returned 7 to 32 of the 41 live rows after `REINDEX INDEX chunks_bm25` alone. The full lists it reports come from the `Seq Scan` plan, not from the vector index. The branch records any vector statement only as a proposal to the maintainer, because the figure is fixture-sized (`harness-runs/lessons.md` → `## Evidence and measurement`, and the story plan's scope-register row 32). That passes both legs. The maintainer should confirm that the HNSW short-list behaviour above the crossover stays open for a later branch.
