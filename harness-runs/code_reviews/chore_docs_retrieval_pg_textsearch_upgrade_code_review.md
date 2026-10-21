# Code Review: chore_docs_retrieval_pg_textsearch_upgrade

## Context

**Branch:** `chore_docs_retrieval_pg_textsearch_upgrade`
**Date:** 2026-10-21
**Reviewed:** the whole branch diff against `dev`, 16 files: the three PGlite packages bumped to the `pg_textsearch` 1.5.1 set in `cli/package.json` and `package-lock.json` (Tasks 2–3); the committed 1.3.1 data-directory fixture and the new `cli/test/docs-retrieval-store-upgrade.test.mjs` (Tasks 1, 4); `openPgliteStore`'s old-index handling, `STALE_EXTENSIONS_QUERY` and `EXTENSION_UPDATE_STATEMENTS` (Task 4); the crossover re-take in `cli/test/docs-retrieval-store.test.mjs` (Task 5); the compose image moved to `v1.5.1` on the `pgvector/pgvector:0.8.7-pg18` base (Task 6, on the maintainer's recorded ruling overriding the story's keep-the-base decision); the Python port of the handling and its parity and container tests (Task 7); and the 1.5.1 figures added to `docs/retrieval-eval-results.md`, `docs/retrieval.md` and the probe doc comment (Tasks 8–13). 18 run-artifact files excluded from the reviewed diff.

Every accompanying test the touched layers' conventions documents require is present. This review runs no suite, so whether they pass is for the Run gates phase to establish. The TypeScript handling is pinned by a suite that opens a real 1.3.1-built archive and asserts both `extversion`s equal their `default_version` afterwards. The Python handling's statements are pinned value for value against the TypeScript constants through `ts_bridge.mjs`. Its update branch cannot be exercised on the 1.5.1 server, because the container ships `pg_textsearch--1.5.1.sql` and `vector--0.8.7.sql` as its only install scripts (checked in the running container). That branch is recorded instead by the dated measurement in `docs-retrieval-service/README.md` item 4. The 1.3.1 figures in `docs/retrieval-eval-results.md` are untouched: that file's diff is additions only. No wall-clock figure was added. The committed archive names no host path. The two new exports have callers outside their defining file (`docs-retrieval-service/tests/ts_bridge.mjs`). `phases.parity` is `false`, so no parity cross-check applies. The three findings below are what remain.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 3** — Say `vector` moved on both engines, not on PGlite alone, in `docs/retrieval.md`'s old-index bullet _(layer: general)_
2. [x] **Finding 1** — Drop the false stdout-notice rationale from `openPgliteStore`'s doc comment _(layer: cli)_
3. [ ] **Finding 2** — Keep the before-handling measurement in `docs/retrieval.md` only, and point the upgrade suite's header at it _(layer: cli, general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. `openPgliteStore`'s doc comment justifies the conditional update with a stdout notice that PGlite never prints
→ [finding_1.md](chore_docs_retrieval_pg_textsearch_upgrade_code_review/finding_1.md)

### 2. The before-handling measurement has two owners: the upgrade suite's header and `docs/retrieval.md`
→ [finding_2.md](chore_docs_retrieval_pg_textsearch_upgrade_code_review/finding_2.md)

---

## Nice to Have

### 3. `docs/retrieval.md` says `vector` moved "on PGlite", but the compose image's `vector` moved too
→ [finding_3.md](chore_docs_retrieval_pg_textsearch_upgrade_code_review/finding_3.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section has no reference-implementation divergences.
