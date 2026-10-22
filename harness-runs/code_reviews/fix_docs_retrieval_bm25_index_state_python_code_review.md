# Code Review: fix_docs_retrieval_bm25_index_state_python

## Context

**Branch:** `fix_docs_retrieval_bm25_index_state_python`
**Date:** 2026-10-22

**What was reviewed.** The whole branch diff against the default branch `dev`, read as `origin/dev` because this run copy has no local `dev`: 14 files, +963 / −47. 12 run-artifact files excluded from the reviewed diff. Every changed file sits under the catch-all `general` layer, and it falls into four parts:

- **The Python store.** `store.py`: `LEXICAL_SEARCH_STATEMENT`, `END_STATE_STATEMENTS`, the three `INDEX_STATE_*` constants, `DocStore.rebuild_indexes`, the score-`0` filter in `lexical_search`, and the width-change `DELETE FROM meta WHERE key = ANY($1::text[])`.
- **The refresh rule.** Step (6) in `refresh.py` → `refresh_index`.
- **The tests.** The unit cases on the fake, the bridge's statement-parity assertions, the store's container cases and the new container test `tests/test_refresh_end_state_postgres.py`.
- **The documents and the eval header.** The service README, `docs/retrieval.md`, `docs/retrieval-eval.md`, the after-fix and real-catalog figures in `docs/retrieval-eval-results.md`, and the header of `evals/docs-retrieval/bm25-refresh-rule.mjs`.

**Headline conclusions.**

- **The Python refresh rule matches the TypeScript one.** `refresh_index` step (6) and its `before_write` marker are `cli/src/retrieval/refresh.ts` → `refreshIndex` line for line. The store's statements equal `store.ts`'s, and the bridge or a source read asserts each one. `RefreshResult` keeps its shape.
- **Every required test is present.** Whether the tests pass is the Run gates phase's to establish. The branch's own record shows the container test failing 4 of 4 with step (6) removed and passing 4 of 4 with it restored. The maintainer's hand runs recorded `test_both_backends_answer_byte_identically PASSED` twice.
- **Pass 0.** The project's grep-sweep list is the unfilled stub, so half (a) did not run. The new-exported-symbol caller check (half b) found every new constant and `rebuild_indexes` wired outside its defining file.
- **The real-catalog Python result is covered by a recorded ruling.** That result is not the ruled one-hit residual shape, and the maintainer's ruling covering it is recorded in `harness-runs/dispatch_additions/fix_docs_retrieval_bm25_index_state_python.md`.
- **Parity is off** (`phases.parity` is `false`), so no parity review ran.
- **Pass 2 was a no-op.** The supplied `per_task_findings_root` does not exist.

The three findings below are documentation gaps. Each one leaves a reader with a wrong answer.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 3** — Name both `REINDEX` triggers in the Python cost bullet of `docs/retrieval.md` _(layer: general)_
2. [ ] **Finding 2** — Add `tests/test_store_statements.py` to the service README's byte-parity list _(layer: general)_
3. [ ] **Finding 1** — Summarise the Python end-state figures, real catalog included, in `docs/retrieval.md` → **Incremental refresh.** _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. `docs/retrieval.md` cites only the TypeScript end-state figures, so the Python backend reads as measured the same way on the real catalog
→ [finding_1.md](fix_docs_retrieval_bm25_index_state_python_code_review/finding_1.md)

### 2. The service README's byte-parity list omits `tests/test_store_statements.py`, which now carries every statement-parity assertion
→ [finding_2.md](fix_docs_retrieval_bm25_index_state_python_code_review/finding_2.md)

---

## Nice to Have

### 3. The Python cost bullet in `docs/retrieval.md` names only the refresh-that-wrote trigger for the `REINDEX`
→ [finding_3.md](fix_docs_retrieval_bm25_index_state_python_code_review/finding_3.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

_Empty: `phases.parity` is `false`._
