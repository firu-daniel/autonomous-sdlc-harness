# Skeptic Review: fix_docs_retrieval_bm25_index_state_python

## Context

**Branch:** `fix_docs_retrieval_bm25_index_state_python`
**Date:** 2026-10-22

**What was reviewed.** This review covers the whole branch diff against the default branch `dev`. This run copy has no local `dev`, so the diff was read against `origin/dev`: 14 files, +965 / −48. 16 run-artifact files excluded from the reviewed diff. The review read every hunk of the Python store, the refresh rule, the unit and container tests, the parity bridge, the service README, `docs/retrieval.md`, `docs/retrieval-eval.md`, the added sections of `docs/retrieval-eval-results.md` and the eval header. `refresh_index` and the store hooks were compared line for line with `cli/src/retrieval/refresh.ts` → `refreshIndex` and `cli/src/retrieval/store.ts`.

**De-duplicated against** the committed code review `harness-runs/code_reviews/fix_docs_retrieval_bm25_index_state_python_code_review.md` and its three findings, all of them documentation gaps that are already fixed. No parity review exists, because `phases.parity` is `false`. No architecture review exists for this branch: the architecture branch review resolved with no index written.

**What was verified.**

- **Check 1, reachability.** `rebuild_indexes` is called from `refresh_index` step (6), and `refresh_index` is reached from `service.py` → `RetrievalSession.refresh`. Every `DocStore` implementer carries the new method: `_PostgresStore`, `InMemoryDocStore` and the test's `_CountingStore`. Every new constant has a consumer outside its defining file, and so does the `reference_database_url` fixture.
- **Check 2, runtime-address leg.** Not applicable: the branch adds no host, region or path assembly.
- **Check 3, citations.** Each cited source was opened and says what is claimed:
  - the README's "departure 7's snake_case";
  - `docs/retrieval.md` → `## Measured, and how`, item (b);
  - `cli/test/docs-retrieval-store.test.mjs` case (c);
  - the README's new **The end state, and the lock it takes.**;
  - the before-fix Python rows that `docs/retrieval-eval-results.md` compares against.
  
  The real-catalog residual stands on the maintainer ruling recorded in `harness-runs/dispatch_additions/fix_docs_retrieval_bm25_index_state_python.md`.
- **Check 4, divergences.** The branch claims none.
- **Check 5, runtime behaviour.**
  - The `pending` marker covers every write path, the embedder-change `clear` included.
  - `REINDEX` runs on the store's autocommit connection, outside any transaction.
  - The score-`0` filter reads a float column. The container evidence prints float scores.

**Headline conclusion.** The ported rule is correct and wired. The one net-new defect is that gate `13a Python lint` fails on two lines Task 1 added. This was proven with the `uv.lock`-pinned ruff `0.16.9`.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Rewrap the `test_store_statements.py` docstring line and join the `END_STATE_STATEMENTS` comprehension in `store.py` so gate 13a passes _(layer: general)_

---

## Must Fix

### 1. Gate 13a (`Python lint`) fails on the branch: one `E501` in `test_store_statements.py` and one `ruff format` change in `store.py`
→ [finding_1.md](fix_docs_retrieval_bm25_index_state_python_skeptic_review/finding_1.md)

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

_Empty: no divergence was claimed, and `phases.parity` is `false`._
