# Architecture review — chore_devscene_docs_retrieval

## Context

Branch `chore_devscene_docs_retrieval`, reviewed 2026-11-12, implemented-solution mode, iteration 0. Reviewed: the branch diff against the default branch `dev`. No local `dev` ref exists in this checkout, so the diff base was resolved as its remote-tracking form `origin/dev`. The diff covers 117 files (517 insertions, 517 deletions), grouped into five segments: `cli/src/retrieval/`, the `cli/templates/` retrieval wiring and launcher, `cli/test/`, the `plugin/agents/` allowlists, and the `general` segment. The `general` segment holds the Python package directory rename `docs-retrieval-service/src/harness_docs_retrieval/` → `devscene_docs_retrieval/`, its tests, the compose, Dockerfile and lockfile, this repository's scripts and evals, and the `docs/` prose. 19 run-artifact files excluded from the reviewed diff.

Headline: the branch is a pure rename. It moves no responsibility, adds no module, adds no import, and does not change the direction of any dependency. Each cross-boundary wire is renamed on both sides:
- `DOCS_SERVER_NAME` is `devscene-docs` in `cli/src/retrieval/server.ts` and in `docs-retrieval-service/src/devscene_docs_retrieval/wire.py`.
- `SEARCH_TOOL_PERMISSION` is derived from that name, and all eleven `plugin/agents/*.md` allowlists plus `plugin/agents/README.txt` carry `mcp__devscene-docs__search_docs`.
- The `pythonBackend.ts` `MIRRORS` literals and `RETRIEVAL_STUB_ENV` agree with their declared mirrors.

One accompanying-set gap remains. The live rendered notes-app permission profile was not brought in line with the token-carrying template it renders from.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Re-render the notes-app permission profile's `harness-docs` sentence to match its template _(layer: general)_

## Must Fix

### 1. Re-render the notes-app permission profile's `harness-docs` sentence to match its template
→ [finding_1.md](chore_devscene_docs_retrieval_arch_review/finding_1.md)
