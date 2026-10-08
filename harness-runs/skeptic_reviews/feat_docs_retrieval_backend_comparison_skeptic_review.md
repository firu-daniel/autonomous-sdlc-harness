# Skeptic Review: feat_docs_retrieval_backend_comparison

## Context

**Branch:** `feat_docs_retrieval_backend_comparison`
**Date:** 2026-10-08
**Reviewed:** the whole branch diff against `dev`, adversarially. That covers Task 13's `EMBEDDING_EXTRACT_OPTIONS` and the `EMBED_BATCH_SIZE` export; the eval tooling under `evals/docs-retrieval/` (`backends.mjs`, `mirror-fixture.mjs`, `python-backend.mjs`, `mcp-backend-pass.mjs`, `vector-agreement.mjs`, `backend-comparison.mjs`, and the edits to `args.mjs`, `arms.mjs`, `run.mjs`, `results.mjs`, `query-log-pass.mjs` and `check-floor.mjs`); the hand-run protocol in `docs/retrieval-eval.md`; the four generated `@typescript` / `@python` blocks and the write-up in `docs/retrieval-eval-results.md`; and the settled sites in `docs/retrieval.md`, `docs-retrieval-service/README.md` and `llms.txt`. 38 run-artifact files excluded from the reviewed diff.

**De-duplicated against** `harness-runs/code_reviews/feat_docs_retrieval_backend_comparison_code_review.md` (Findings 1–10) and `harness-runs/architecture_branch_reviews/feat_docs_retrieval_backend_comparison_arch_review.md` (Findings 1–3), all of them already applied. No parity review exists (`phases.parity: false`), so check 2's parity leg is inert.

**What was verified first-hand and holds.**

- **Callers.** Every new export has a caller or a documented launcher: `transplantCorpusBlock`, `runMcpBackendPass`, `measureVectorAgreement`, `compareBackends`, `loadFloor`, `METRICS`, `EMBEDDING_EXTRACT_OPTIONS` and `EMBED_BATCH_SIZE`.
- **The flag-absent TypeScript path is unchanged.** `run.mjs` reaches `python-backend.mjs` only through a dynamic `import()`.
- **Latency.** The Python `search_ms` is `search_docs` alone, excluding the refresh (`service.py` → `answer`), as the provenance claims.
- **Cited symbols resolve.** `BM25_INDEX_DEFINITION` / `BM25_ORDER_CLAUSE` exist in both stores, and `TIMING_LINE_PREFIX` and `DOCS_SERVER_NAME` agree.
- **The write-up's per-query counts match the comparison outputs.** The same-order counts and rank changes for arms B–E on both corpora agree with the captured `renderBackendComparison` outputs.
- **The recorded MCP and vector-agreement figures match their captures.**

**Headline.** One net-new Should Fix. The `@python` blocks record the TypeScript `search.js` threshold as the one "in force". The pair check on that field therefore never reaches the Python server. The write-up's abstention conclusion still stands, but on the per-entry consistency list, not on the recorded field.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top-to-bottom. The committing role flips each one to `[x]` as that fix's commit lands. `[ ]` markers anywhere else (sub-step bullets inside per-finding files) are informational only.

Each entry resolves to `harness-runs/skeptic_reviews/feat_docs_retrieval_backend_comparison_skeptic_review/finding_<K>.md` via its `**Finding K**` reference. The leading `N.` is the fix order. `K` is the finding's stable number.

1. [x] **Finding 1** — Say in a `@python` block's provenance, in `backend-comparison.mjs`'s header and in the write-up that the recorded threshold is the TypeScript constant, not the Python server's _(layer: general)_

---

## Must Fix

None.

---

## Should Fix

### 1. A `@python` block records the TypeScript abstention threshold as the one "in force", and the comparison's threshold check never reaches the Python server
→ [finding_1.md](feat_docs_retrieval_backend_comparison_skeptic_review/finding_1.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

None. `phases.parity` is `false`, so no reference implementation is compared, and no divergence on this branch is marked intentional.
