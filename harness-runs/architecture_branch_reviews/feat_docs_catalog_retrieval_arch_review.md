# Architecture review — feat_docs_catalog_retrieval

## Context

Branch `feat_docs_catalog_retrieval`, reviewed 2026-09-17 against `dev` (`git diff dev...HEAD`), in implemented-solution mode. The review covered 72 changed files in five segments: the new `cli/src/retrieval/` area and its `docs` command; the `init`, generator, config and `doctor` wiring; the templates and the launcher script; the ten plugin agent grants and the guard comment; and the schema, the negative fixture and the documents of record. The plan index was read for intent only. 38 run-artifact files excluded from the reviewed diff.

The layering mostly holds. The retrieval engine is its own area, `cli/src/retrieval/`, and every module there opens with a header. Optional peers are reached only through `runtime.ts` → `loadRetrievalModule`, and every other file takes their types with `import type`. The predicate `retrievalApplies` lives in `config/model.ts` and every consumer imports it. The wire constants have single owners that the consumers import: `DOCS_SERVER_NAME` / `SEARCH_TOOL_PERMISSION` in `retrieval/server.ts`, `INDEX_DIR_NAME` in `retrieval/store.ts`, and `DOCS_SEARCH_SERVER_SCRIPT_NAME` in `generators/outerLoopScripts.ts`. The launcher's mirrored literals are declared in the owning headers.

The configuration key lands in all four places: schema, model, check and `docs/config.md` §5. Its negative fixture is wired into `validate:config:negative`.

Two rules are broken on purpose, and the prompt allows both:
- **The write-engine monopoly.** The task prompt requires a per-checkout, gitignored index refreshed on query, and `retrieval/store.ts` writes it.
- **The single output surface.** The prompt requires a stdio MCP server started from the CLI, and `retrieval/server.ts` writes the protocol to stdout.

Both exceptions are declared in the owning module headers (`core/writer.ts` and `core/report.ts`), as `.claude/context/cli.md` → `## What "done" means here` requires. Both are also raised as `stale-rule` entries in the story index for a supervised amendment. They are not findings.

The one Must Fix is a copy of a single responsibility: the "is a stub selected?" test is written three times across two areas.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Stub-selection predicate re-spelled in `commands/docs.ts` and `retrieval/setup.ts` instead of imported from `retrieval/models.ts` _(layer: cli)_
2. [x] **Finding 2** — `docs search` and `docs serve` ignore `--dry-run` and persist the index _(layer: cli)_
3. [ ] **Finding 3** — The machine-cache writes are missing from the cli layer's list of machine-scoped writes, and `core/writer.ts` names the wrong writer for the model download _(layer: cli)_

## Must Fix

### 1. Stub-selection predicate re-spelled in `commands/docs.ts` and `retrieval/setup.ts` instead of imported from `retrieval/models.ts`
→ [finding_1.md](feat_docs_catalog_retrieval_arch_review/finding_1.md)

## Should Fix

### 2. `docs search` and `docs serve` ignore `--dry-run` and persist the index
→ [finding_2.md](feat_docs_catalog_retrieval_arch_review/finding_2.md)

### 3. The machine-cache writes are missing from the cli layer's list of machine-scoped writes, and `core/writer.ts` names the wrong writer for the model download
→ [finding_3.md](feat_docs_catalog_retrieval_arch_review/finding_3.md)
