# Code Review: fix_docs_retrieval_bm25_index_state_typescript

## Context

**Branch:** `fix_docs_retrieval_bm25_index_state_typescript`
**Date:** 2026-10-21
**Reviewed:** the whole branch diff against the default branch's merge base `d15e5cc3` (`origin/dev`; no local `dev` ref exists in this checkout). That covers 13 files: the store's matching-rows filter, `rebuildIndexes()`, `LEXICAL_SEARCH_STATEMENT`, `END_STATE_STATEMENTS` and the `index_state` marker constants (`cli/src/retrieval/store.ts`, Task 7); the refresh's end state and marker handling (`cli/src/retrieval/refresh.ts`, Task 8); the new `cli/test/docs-retrieval-refresh-end-state.test.mjs` and case (c) of `cli/test/docs-retrieval-store.test.mjs`; the route-2 variant and ad-hoc corpus route in `evals/docs-retrieval/bm25-refresh-rule.mjs` and the `STORE_SELECT` change in `bm25-history.mjs`; the re-recorded `fixture-catalog` B/D `mrr` floors in `evals/docs-retrieval/floor.json`; and the documents of record (`docs/retrieval-eval-results.md` → `### Route 2 on the fix branch` and the recommendation's **What shipped.** line, `docs/retrieval.md`, `docs/retrieval-eval.md`, `docs/development.md` gate 10 leg (vii), `docs-retrieval-service/README.md`, `evals/docs-retrieval/README.md`). 19 run-artifact files excluded from the reviewed diff.

The refresh logic is correct on every path I traced: a first build, an embedder change, a refresh that deletes or upserts, an interrupted refresh that leaves `pending`, and an unchanged refresh over an unmarked index all end in `rebuildIndexes()`. The width-change open path clears the marker together with the embedder record. The score-`0` filter cannot drop a match inside the limit, because matches sort strictly before score-`0` rows. Both tests the task prompt's goal 3 asks for are present. This review runs no suite, so whether they pass is for the Run gates phase to establish; the Task 8 detail file records the without-fix failures. The floor re-record lands in Task 8's own commit with its reason line, as the user ruled and as `docs/retrieval-eval.md` → **The same-commit re-record rule.** requires, and both values follow the margin rule (0.6018… − 0.05 → 0.55, 0.7037… − 0.05 → 0.65). `phases.parity` is `false`, so no parity cross-check ran. The Pass 0 grep sweep over every layer path (raw `console`, `process.exit`, shell strings, hand-built internal errors, machine paths, recursive removals) found nothing on added lines. Nothing on the branch is a Must Fix. Three Should Fix items remain: the marker's `pending` and no-rebuild branches are untested (Finding 2), `docs/retrieval.md` overstates the history-independence of the BM25 scores (Finding 3), and the caller check found one new export, `END_STATE_STATEMENTS`, that is used only inside its defining module, so its `export` is surface nothing consumes (Finding 1).

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Make `END_STATE_STATEMENTS` module-private: it has no consumer outside `store.ts` _(layer: cli)_
2. [x] **Finding 3** — Qualify `docs/retrieval.md` → **Incremental refresh.**'s history-independence claim with the residual its own cited measurement records _(layer: general)_
3. [x] **Finding 2** — Pin the marker's two untested branches: an unchanged refresh over a rebuilt index issues no rebuild, and one over a `pending` index does _(layer: cli)_

---

## Must Fix

_None._

---

## Should Fix

### 2. The `index_state` marker's `pending` branch and its no-rebuild branch are untested, though every `search_docs` call refreshes
→ [finding_2.md](fix_docs_retrieval_bm25_index_state_typescript_code_review/finding_2.md)

### 3. `docs/retrieval.md` says the BM25 scores no longer depend on the index's history, but the measurement it cites records a residual
→ [finding_3.md](fix_docs_retrieval_bm25_index_state_typescript_code_review/finding_3.md)

### 1. `END_STATE_STATEMENTS` is a new export with no call site outside its defining file
→ [finding_1.md](fix_docs_retrieval_bm25_index_state_typescript_code_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from, and this section carries no divergence call-out.
