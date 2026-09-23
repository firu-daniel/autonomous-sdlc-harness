# Architecture review — feat_arm_a_real_catalog_measurement

## Context

Branch `feat_arm_a_real_catalog_measurement`, reviewed 2026-09-23 against `dev...HEAD`. The review covered 45 changed files in four segments:
- the `cli` library: `cli/src/retrieval/search.ts` → `SearchResult.bestRerankScore`, the `queryLog.ts` header, and `cli/test/docs-retrieval-rerank-score.test.mjs`;
- the eval under `evals/docs-retrieval/`: `args`, `arms`, `corpora`, `metrics`, `queries`, `results`, `run`, the new `calibrate.mjs` and `arm-a/spread.mjs`, `run-arm-a.sh`, the task texts, and the committed query sets and transcripts;
- the gate script `scripts/check-eval-artifacts.sh` and its wiring in `scripts/run-gates.sh`;
- the documents: `docs/`, the root prose files, `schemas/harness.config.schema.json` and `cli/README.md`.

35 run-artifact files were excluded from the reviewed diff.

The rules applied were `.claude/context/conventions.md`, `.claude/context/cli.md` and `.claude/context/plugin.md`, together with `harness-runs/lessons.md`. Nothing under `plugin/` changed.

**Headline.** The layering holds:
- **Placement.** The one library change sits in the `cli` area that owns search. Its test is a `cli/test/` suite whose header states the rule. The eval stays in `general`, and every figure is recorded in `docs/`.
- **Dependency direction.** The eval reads `cli/dist` exactly as it already did, and no eval module is imported back into `cli`.
- **Owners.** The branch keeps every owner it touches: arm variants in `arms.mjs`, the marker spelling and block parsing in `results.mjs` (`readCorpusMachineHalf`), `STRICT_GRADE` in `metrics.mjs`, `NEGATIVE_KINDS` in `queries.mjs`, and transcript parsing in `score-transcript.mjs`.

One ownership defect remains: the `unclassed` negative bucket is retyped as a local literal in two eval modules instead of being declared once beside `NEGATIVE_KINDS`.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Declare the `unclassed` negative bucket once beside `NEGATIVE_KINDS` and import it in `calibrate.mjs` and `spread.mjs` _(layer: general)_

## Must Fix

### 1. The `unclassed` negative bucket is declared twice, as a retyped literal in two eval modules
→ [finding_1.md](feat_arm_a_real_catalog_measurement_arch_review/finding_1.md)

## Should Fix

_None._

## Nice to Have

_None._
