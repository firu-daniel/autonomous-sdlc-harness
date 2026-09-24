# Skeptic Review: feat_arm_a_real_catalog_measurement

## Context

**Branch:** `feat_arm_a_real_catalog_measurement`
**Date:** 2026-09-24
**Reviewed:** the whole branch diff against `dev`, 45 files. The review was adversarial and made its own checks rather than trusting the plan or the earlier reviews.

44 run-artifact files excluded from the reviewed diff.

**De-duplicated against:**
- `harness-runs/code_reviews/feat_arm_a_real_catalog_measurement_code_review.md` and its six findings, all applied;
- `harness-runs/architecture_branch_reviews/feat_arm_a_real_catalog_measurement_arch_review.md` and its one finding, applied;
- `harness-runs/lessons.md`.

`phases.parity` is `false`, so there was no parity review and check 2's parity leg is inert.

**Checked and found sound:**
- **`SearchResult.bestRerankScore` is the number abstention tests.** It is the `best` compared against `ABSTAIN_SCORE_THRESHOLD`. No renderer, MCP answer or query-log record reads it. `runArm` → `scoreArm` → `readPerQuery` carry it through to the calibration.
- **The two arm A variants are wired through the runner.** Each task file's token count matches what `run-arm-a.sh` checks, and a repeatable `--transcript` renders one row per variant.
- **The decision rule was applied as written on `dev`.** "Relevance does not clear → retrieval is withdrawn."
- **The verdict arithmetic re-derives from the published per-repetition tables.** This covers the medians, the 35/44 and 41/44 recall counts, the `1 / 44` and `0.5 / 44` margins, the cost ratios and the failure shares.
- **The calibration's `cannot-separate` result, and the 6-and-6 overlap at `0.32`, re-derive from the 101 quoted points.**
- **Gate 6e is silent on the tree as committed.**

**Headline:** the measurement and the verdict hold. Two net-new findings remain:
- **Must Fix.** The published record names six scratch launchers as its commands, and no reader of the published tree has any of them. The code review accepted the eval's un-called exports on the premise that those launchers were documented, and they are not.
- **Should Fix.** `docs/retrieval.md` still says the threshold calibration holds on a real catalog, which this branch's own calibration record contradicts.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — Replace `docs/retrieval.md`'s claim that the threshold calibration holds on a real catalog, and its "calibrated abstention threshold" item, with what the record shows _(layer: general)_
2. [x] **Finding 1** — Publish the six cited scratch launchers' source verbatim beside their commands in `docs/retrieval-eval-results.md` _(layer: general)_

---

## Must Fix

### 1. The published verdict, calibration and arm A figures cite six launchers that exist only in a gitignored scratch directory
→ [finding_1.md](feat_arm_a_real_catalog_measurement_skeptic_review/finding_1.md)

---

## Should Fix

### 2. `docs/retrieval.md` still says the threshold calibration holds on the real catalog, which the branch's own record now contradicts
→ [finding_2.md](feat_arm_a_real_catalog_measurement_skeptic_review/finding_2.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from. The branch makes two deliberate choices, and both were checked:

- **It records the *withdrawn* decision without executing it.** The task prompt's `## What to deliver` item 4 made this a scope call to settle in the plan. Roadmap item 18 carries the deferral and owns its row in `docs/development.md` → `## 6. The roadmap this tree defers to`.
- **It leaves `ABSTAIN_SCORE_THRESHOLD` unchanged.** This is the outcome the fixed method's `cannot-separate` case prescribes, and the method was committed before any score existed (Task 3's commit precedes the transcripts' commit).
