# Code Review: feat_arm_a_real_catalog_measurement

## Context

**Branch:** `feat_arm_a_real_catalog_measurement`
**Date:** 2026-09-23
**Reviewed:** the whole branch diff against `dev`, 45 files, in these segments:
- the `cli` library field `SearchResult.bestRerankScore` and its suite, `cli/test/docs-retrieval-rerank-score.test.mjs`;
- the eval plumbing under `evals/docs-retrieval/`: `args.mjs`, `arms.mjs`, `corpora.mjs`, `metrics.mjs`, `queries.mjs`, `results.mjs`, `run.mjs`, the new `calibrate.mjs` and `arm-a/spread.mjs`, the two arm A task texts and `run-arm-a.sh`;
- the `gate10-catalog` query set and the ten committed transcripts;
- gate 6e (`scripts/check-eval-artifacts.sh`, `scripts/run-gates.sh`);
- the prose record: the hand-written sections of `docs/retrieval-eval-results.md` below the end marker, `docs/retrieval-eval.md`, `docs/retrieval.md`, `docs/cli.md`, `docs/config.md`, `docs/development.md`, `ROADMAP.md`, `README.md`, `cli/README.md`, `llms.txt`, the schema description and the eval READMEs.

37 run-artifact files excluded from the reviewed diff.

**Parity:** `phases.parity` is `false`, so no parity review ran and the call-out section below is empty.

**Tests:** the new rerank-score suite covers the four shapes the field can take, plus the no-rendering-change property. It derives its scores from the constant, so it holds at any threshold value.

**Arithmetic:** the decision section was re-checked against the figures it cites, with no discrepancy found:
- the `1 / 44` and `0.5 / 44` margins;
- recall@5 at 35, 41 and 20 of 44;
- the MRR leads and the cost ratios;
- the failure shares;
- the per-repetition billed-token sums, which add to 63,074,281 and 48,000,826;
- the `cannot-separate` case in `## Threshold calibration`, re-derived from the 101 quoted points.

**Query set:** `gate10-catalog.jsonl` carries `situation`, `intent` and `origin` on all 69 records, `negativeKind` on all 25 negatives (15 `near`), and a grade-3 label on all 44 positives.

**Committed eval material:** no absolute home path appears in it.

**Pass 0:** the caller check found a committed caller for every new export except `summarizeVariant`, `calibrateThreshold`, `readPerQuery`, `partitionOf` and `breakdown`. All five sit in the catch-all `general` layer, which is not consumed by any layer above it. Each is called by the run's documented scratch launchers, as the eval's own launcher route prescribes. So none is an unwired feature.

**Pass 2:** the per-unit review root holds no files for this branch, so it had nothing to reconcile.

**What is left:** six findings. One is a false measured claim that this branch extended to the real catalog; the other five are pointer, wording and duplication repairs.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Qualify "every relevance column" to the primary columns at all four sites and record arm E's two strict-column leads over arm D _(layer: general)_
2. [x] **Finding 4** — Replace the stale "has never been run" sentence in `## Running arm A by hand` _(layer: general)_
3. [x] **Finding 2** — Record the publication clearance's terms in `## The real-catalog query set` and repoint `docs/development.md` and `evals/docs-retrieval/README.md` at it _(layer: general)_
4. [ ] **Finding 6** — Name the arm A run and the decision in `llms.txt`'s entry for `docs/retrieval-eval-results.md` _(layer: general)_
5. [ ] **Finding 5** — Make `machineSection` write the machine-half fence through `JSON_FENCE_OPEN` / `JSON_FENCE_CLOSE` _(layer: general)_
6. [ ] **Finding 3** — Stop describing `ABSTAIN_SCORE_THRESHOLD` as calibrated against the measured distribution; cite `## Threshold calibration` instead _(layer: cli, general)_

---

## Must Fix

### 1. "Every relevance column" is false: arm E beats arm D on two strict columns, one of them on the real catalog
→ [finding_1.md](feat_arm_a_real_catalog_measurement_code_review/finding_1.md)

---

## Should Fix

### 2. The publication clearance that licenses the committed query set and transcripts is recorded only in a run artifact the published tree does not carry
→ [finding_2.md](feat_arm_a_real_catalog_measurement_code_review/finding_2.md)

### 3. `ABSTAIN_SCORE_THRESHOLD` is still described as "calibrated against the measured distribution" after the re-calibration on the observed distribution returned `cannot-separate`
→ [finding_3.md](feat_arm_a_real_catalog_measurement_code_review/finding_3.md)

### 4. `## Running arm A by hand` still says the runner "has never been run"
→ [finding_4.md](feat_arm_a_real_catalog_measurement_code_review/finding_4.md)

---

## Nice to Have

### 5. `results.mjs` spells the machine-half fence twice: as literals in `machineSection` and as constants in `readCorpusMachineHalf`
→ [finding_5.md](feat_arm_a_real_catalog_measurement_code_review/finding_5.md)

### 6. `llms.txt` describes `docs/retrieval-eval-results.md` without the arm A run and the decision the README's matching entry now names
→ [finding_6.md](feat_arm_a_real_catalog_measurement_code_review/finding_6.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from, and this section is empty.
