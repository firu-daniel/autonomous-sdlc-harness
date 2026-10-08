# Code Review: feat_docs_retrieval_backend_comparison

## Context

**Branch:** `feat_docs_retrieval_backend_comparison`
**Date:** 2026-10-08
**Reviewed:** the whole branch diff against `dev` — Task 13's `EMBEDDING_EXTRACT_OPTIONS` export in `cli/src/retrieval/models.ts` and the `EMBED_BATCH_SIZE` export in `cli/src/retrieval/refresh.ts`; the eval tooling under `evals/docs-retrieval/` (`mirror-fixture.mjs`, `backends.mjs`, `python-backend.mjs`, `mcp-backend-pass.mjs`, `vector-agreement.mjs`, `backend-comparison.mjs`, and the edits to `args.mjs`, `arms.mjs`, `run.mjs`, `results.mjs`, `query-log-pass.mjs`, `check-floor.mjs` and the directory README); the procedure in `docs/retrieval-eval.md`; the four generated `@typescript` / `@python` blocks and the new `## The Python backend against the TypeScript one` write-up in `docs/retrieval-eval-results.md`; and the settled pending sites in `docs/retrieval.md`, `docs-retrieval-service/README.md` and `llms.txt`. 27 run-artifact files excluded from the reviewed diff.

No file under `plugin/` changed, `harness.config.json` is untouched, and nothing under `docs-retrieval-service/src/` changed, so the Python backend's search behaviour is unchanged (Acceptance 7). The flag-absent run keeps its existing in-process path, heading, provenance and machine half, and `run.mjs` loads `python-backend.mjs` only through a dynamic `import()` on `--backend python`, so gate 11 does not depend on Docker or the Python weights. The plan writes no test file, and this review runs none. Every reader of the generated region (`calibrate.mjs`, `query-log-pass.mjs`, `backend-comparison.mjs`) goes through `readCorpusMachineHalf`, whose exact start marker cannot match a `@<backend>` block. Re-running the deterministic `compare-backends.mjs` launcher over `self-docs` gave the same figures, rank changes, abstention sets and rerank deltas the write-up quotes. Each new exported symbol has a caller outside its defining file, or is entered through a launcher the procedure documents, except the two gratuitous exports in Finding 9. Parity review is off (`phases.parity: false`). The per-unit findings root does not exist on this run, so the Pass 2 reconciliation had nothing to reconcile.

The findings below are what is left. The one Must Fix is a measured fact with no command behind it: the BM25 probe that identifies arm B's divergence cause exists only in a gitignored scratch file.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top-to-bottom. The committing role flips each one to `[x]` as that fix's commit lands. `[ ]` markers anywhere else (sub-step bullets inside per-finding files) are informational only.

Each entry resolves to `harness-runs/code_reviews/feat_docs_retrieval_backend_comparison_code_review/finding_<K>.md` via its `**Finding K**` reference. The leading `N.` is the fix order. `K` is the finding's stable number.

1. [x] **Finding 9** — Drop the `export` from `WRAPPER_PATH` in `python-backend.mjs` and from `cosine` in `vector-agreement.mjs` _(layer: general)_
2. [x] **Finding 8** — Render `renderVectorAgreement`'s main summary and lowest-cosine tables through `summaryTable` and `lowestTable` _(layer: general)_
3. [x] **Finding 7** — Count a no-candidates abstention as consistent with the threshold in `compareAbstention` _(layer: general)_
4. [x] **Finding 6** — Check `backend-comparison.mjs`'s `SIDES` against `BACKENDS` at load _(layer: general)_
5. [ ] **Finding 3** — Remove the unconsumed `packageVersion` from `python-backend.mjs` _(layer: general)_
6. [ ] **Finding 2** — Make the TypeScript `runArm` use `emptyRecord` and `recordRepetition` instead of inline copies _(layer: general)_
7. [ ] **Finding 10** — Say in the write-up that the TypeScript document vectors were embedded in session, not read back from an index _(layer: general)_
8. [ ] **Finding 4** — Tell the operator in the hand-run protocol that the Python blocks carry the compose database's history _(layer: general)_
9. [ ] **Finding 5** — Give step 7's TypeScript leg the workaround for a machine-wide runtime that predates `docs.retrievalBackend` _(layer: general)_
10. [ ] **Finding 1** — Record the BM25 probe's statements and setup in the write-up, so the identified arm B cause can be reproduced _(layer: general)_

---

## Must Fix

### 1. The BM25 probe behind arm B's identified cause has no recorded command
→ [finding_1.md](feat_docs_retrieval_backend_comparison_code_review/finding_1.md)

---

## Should Fix

### 2. `arms.mjs` → `runArm` keeps inline copies of the record logic it extracted for the Python path
→ [finding_2.md](feat_docs_retrieval_backend_comparison_code_review/finding_2.md)

### 3. `openPythonSession` computes and returns `packageVersion`, and nothing consumes it
→ [finding_3.md](feat_docs_retrieval_backend_comparison_code_review/finding_3.md)

### 4. The hand-run protocol does not tell the operator that the Python blocks depend on the database's history
→ [finding_4.md](feat_docs_retrieval_backend_comparison_code_review/finding_4.md)

### 5. Step 7's TypeScript leg prescribes the `config set` that stopped the TypeScript server in the recorded session
→ [finding_5.md](feat_docs_retrieval_backend_comparison_code_review/finding_5.md)

### 6. `backend-comparison.mjs` keeps a second backend list, `SIDES`, that nothing checks against `BACKENDS`
→ [finding_6.md](feat_docs_retrieval_backend_comparison_code_review/finding_6.md)

---

## Nice to Have

### 7. `compareAbstention` reports a no-candidates abstention as inconsistent with the threshold
→ [finding_7.md](feat_docs_retrieval_backend_comparison_code_review/finding_7.md)

### 8. `renderVectorAgreement` inlines the two tables its own helpers render
→ [finding_8.md](feat_docs_retrieval_backend_comparison_code_review/finding_8.md)

### 9. `WRAPPER_PATH` and `cosine` are exported with no caller outside their files
→ [finding_9.md](feat_docs_retrieval_backend_comparison_code_review/finding_9.md)

### 10. The write-up calls the TypeScript side's vectors "stored", though they were embedded in session
→ [finding_10.md](feat_docs_retrieval_backend_comparison_code_review/finding_10.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

None. `phases.parity` is `false`, so no reference implementation is compared and this section is empty.
