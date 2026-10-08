# Architecture review — feat_docs_retrieval_backend_comparison

## Context

Branch `feat_docs_retrieval_backend_comparison`, reviewed 2026-10-08. Reviewed: the branch's own diff, `git diff dev...HEAD`, 19 files — one `cli`-layer change (`cli/src/retrieval/models.ts`, exporting `EMBEDDING_EXTRACT_OPTIONS`) and eighteen `general`-layer files under `evals/docs-retrieval/`, `docs/`, `docs-retrieval-service/README.md` and `llms.txt`; no file under `plugin/` is touched. The dispatch named `diff_base: main`, but `harness.config.json` → `defaultBranch` is `dev`, `main` is not an ancestor of `dev`, and `main...HEAD` spans 1451 files of work already merged to `dev` on other branches; the branch's twenty commits sit on `dev`, so `dev` is the base used. 23 run-artifact files excluded from the reviewed diff. Headline: placement is sound — every new module lands in `evals/docs-retrieval/` with its row in that directory's README, the measured facts and the write-up land in `docs/` (`.claude/context/conventions.md` → `### Where a new responsibility goes`), the TypeScript path reaches the Python module only through a dynamic `import()`, the mirror fixture was lifted rather than copied, and the `cli` change is the export-not-copy the plan intended. What fails is that same export-not-copy rule applied unevenly: `vector-agreement.mjs` retypes the refresh batch size that its own stated rule depends on, and the Python wrapper route and compose service names are declared again in sibling modules rather than read from one owner.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 3** — State the vector read-back exception in `python-backend.mjs`'s boundary rule _(layer: general)_
2. [x] **Finding 2** — Declare the Python wrapper route, compose directory and service, and CLI entry once, and import them _(layer: general)_
3. [x] **Finding 1** — Export `EMBED_BATCH_SIZE` from `refresh.ts` and import it in `vector-agreement.mjs` instead of retyping it _(layer: cli, general)_

## Must Fix

### 1. `vector-agreement.mjs` retypes `EMBED_BATCH_SIZE` instead of importing it from its owner
→ [finding_1.md](feat_docs_retrieval_backend_comparison_arch_review/finding_1.md)

## Should Fix

### 2. The Python wrapper route, compose directory and service, and CLI entry are declared in more than one eval module
→ [finding_2.md](feat_docs_retrieval_backend_comparison_arch_review/finding_2.md)

### 3. `python-backend.mjs` states an eval-wide boundary that `vector-agreement.mjs` crosses
→ [finding_3.md](feat_docs_retrieval_backend_comparison_arch_review/finding_3.md)
