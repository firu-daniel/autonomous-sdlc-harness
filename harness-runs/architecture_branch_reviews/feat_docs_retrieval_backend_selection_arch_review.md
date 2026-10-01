# Architecture review — feat_docs_retrieval_backend_selection

## Context

Branch `feat_docs_retrieval_backend_selection`, reviewed 2026-10-01 against `dev...HEAD`, with the story plan `harness-runs/story_plans/feat_docs_retrieval_backend_selection_story_plan.md` read for intent only. Reviewed: 28 changed files in four segments — the `cli` source (`config/model.ts`, `config/check.ts`, the new `retrieval/pythonBackend.ts`, `retrieval/setup.ts`, `doctor/checks.ts`, `commands/init.ts`), the `cli` templates (`scripts/docs-search-server.sh`, `scripts/lib/harness-run-lib.sh`) and the `cli` tests, the `general` contract files (`schemas/harness.config.schema.json`, the new negative fixture and its `package.json` wiring, `docs/config.md` §5), and the `general` package and documents (`docs-retrieval-service/`, `docs/*.md`, `ARCHITECTURE.md`). 24 run-artifact files excluded from the reviewed diff. Rules come from `.claude/context/cli.md`, `.claude/context/conventions.md` and `harness-runs/lessons.md`.

Headline: the layering holds. Every new file sits in the layer and area its kind belongs to. The new configuration key lands in all four places of its contract: the schema, the model, the check and the `docs/config.md` §5 row, plus a wired negative fixture. The Python backend's names have one owner module under `cli/src/retrieval/`, which declares its mirrors. `doctor` imports each answer from the module that owns it. No import crosses between `cli/` and `plugin/`. One Must Fix remains. `retrievalApplies` in `cli/src/config/model.ts` states that its predicate has only one spelling, but this branch adds a shell spelling and a shell copy of `DEFAULT_RETRIEVAL_BACKEND`, and the header was not amended to declare either. Two Should Fix items are an undeclared mirror of the launcher's exit `3` and a `throw new Error` where `internal()` is required.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Declare the shell mirrors of `retrievalApplies` and `DEFAULT_RETRIEVAL_BACKEND` in `config/model.ts` _(layer: cli)_
2. [ ] **Finding 2** — Declare `test_launcher_e2e.py`'s exit-3 copy among `pythonBackend.ts`'s mirrors _(layer: cli)_
3. [ ] **Finding 3** — Throw the `self-check` invariant breach through `internal()`, not `new Error` _(layer: cli)_

## Must Fix

### 1. Declare the shell mirrors of `retrievalApplies` and `DEFAULT_RETRIEVAL_BACKEND` in `config/model.ts`
→ [finding_1.md](feat_docs_retrieval_backend_selection_arch_review/finding_1.md)

## Should Fix

### 2. Declare `test_launcher_e2e.py`'s exit-3 copy among `pythonBackend.ts`'s mirrors
→ [finding_2.md](feat_docs_retrieval_backend_selection_arch_review/finding_2.md)

### 3. Throw the `self-check` invariant breach through `internal()`, not `new Error`
→ [finding_3.md](feat_docs_retrieval_backend_selection_arch_review/finding_3.md)
