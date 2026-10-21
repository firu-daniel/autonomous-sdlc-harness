# Skeptic Review: chore_docs_retrieval_pg_textsearch_upgrade

## Context

**Branch:** `chore_docs_retrieval_pg_textsearch_upgrade`
**Date:** 2026-10-21
**Reviewed:** the whole branch diff against `dev`, 16 files. 22 run-artifact files excluded from the reviewed diff.

**De-duplicated against:**
- `harness-runs/code_reviews/chore_docs_retrieval_pg_textsearch_upgrade_code_review.md` and its three findings, all applied;
- `harness-runs/architecture_reviews/chore_docs_retrieval_pg_textsearch_upgrade/review_0.md`.

No parity review exists, because `phases.parity` is `false`.

**What was checked adversarially:**
- **Wiring.** `STALE_EXTENSIONS_QUERY` and `EXTENSION_UPDATE_STATEMENTS` are issued from `openPgliteStore` and from `open_postgres_store` before any other statement reads the index. Both constants are also reached through `ts_bridge.mjs`.
- **Package location.** The lockfile now places the three PGlite packages under `cli/node_modules/` rather than the root. Every importer outside `cli/` still resolves them, because it loads them through `cli/dist/retrieval/runtime.js` → `loadRetrievalModule`, whose `import()` resolves from `cli/dist`. `evals/docs-retrieval/bm25-history.mjs` is one such importer.
- **The base-image move.** It overrides the story's keep-the-base decision. The maintainer's ruling is recorded in `task_6_plan.md`.
- **Machine paths in the archive.** The committed 1.3.1 archive, decompressed, contains no `/Users/`, `/var/folders`, `/private/` or build-directory prefix.
- **Headings cited in the new prose.** Every `#`-heading the new `docs/retrieval-eval-results.md` prose cites exists.

**Headline:** the store code is sound. One net-new finding: a dangling pointer in `docs/retrieval.md`, left behind by the code review's own Finding 2 fix.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Name the suite that pins the old-index handling in `docs/retrieval.md`'s TypeScript-backend bullet _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. `docs/retrieval.md` says "that suite pins the handling", but no longer names any suite
→ [finding_1.md](chore_docs_retrieval_pg_textsearch_upgrade_skeptic_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section has no reference-implementation divergences. One accepted risk is already written down in `docs-retrieval-service/postgres/Dockerfile` record 2: the build-stage `postgresql-server-dev-18` is not pinned, so its headers can drift ahead of the base image's server minor. That drift would reproduce the `palloc_mul` load failure. Pinning it is the maintainer's choice under the recorded ruling, so this review files no finding for it.
