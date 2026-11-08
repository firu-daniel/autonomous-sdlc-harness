# Skeptic Review: feat_run_analytics_gate_timings

## Context

**Branch:** `feat_run_analytics_gate_timings`
**Date:** 2026-11-08

**Reviewed:** the whole branch diff, adversarially. The base is `origin/dev...HEAD`: `defaultBranch` is `dev`, and the run copy holds no local `dev` ref. The diff covers the lane reader and schema pick in `cli/templates/scripts/run-analytics.sh`, mode `rounds` and `redact_path` in `cli/templates/scripts/lib/run-analytics.jq`, schema 2 and `## Gate rounds` in `cli/templates/scripts/lib/run-analytics-report.jq`, the lane-owner comments, the self-adopted copies (each confirmed byte-identical to its template with `cmp`), the plugin and docs prose, and the three new suites.

24 run-artifact files excluded from the reviewed diff.

**De-duplicated against:**
- `harness-runs/code_reviews/feat_run_analytics_gate_timings_code_review.md`, Findings 1–3, all applied.
- The plan-level architecture reviews under `harness-runs/architecture_reviews/feat_run_analytics_gate_timings/`.
- `harness-runs/lessons.md`.

No parity review exists: `phases.parity` is `false`.

**Verified rather than trusted:**
- **Wiring.** `record_run_analytics` in `scripts/autonomous-watcher.sh` passes `--repo "$worktree"`. That is the same checkout whose `hr_state_dir` and `hr_test_run_lane_dir` `run-test-suite.sh` uses to write the lane, so mode `rounds` is reached in a real run.
- **Record formats.** The validated record shapes match their producers: `gr_record`, `gr__end` and `gr_run_round` in `scripts/lib/gate-round-lib.sh`, the `THE RECORD` paragraph of `scripts/lib/test-timing-reporter.mjs`, and `emit_verdict` / the verdict write in `scripts/run-test-suite.sh`.
- **Verdict paths.** The `fail <log path>` verdict keeps only its first word, so no log path reaches the record.
- **Running rounds.** A non-reusing re-run removes `.verdict` before the gate truncates `gates.tsv`, so a round in flight is never read.
- **Polling rows.** The orchestrator's `bash <scripts_dir>/run-test-suite.sh --wait <gate_key>_round_<gate_round>` (`plan_orchestration_instructions_core.md`, Run gates step 3) ends in the two tokens `label_wait` matches.
- **Citations.** Every heading the new headers cite exists and says what is claimed: `WHAT A GATE IS TOLD`, `ONE RUN PER LABEL`, `BESIDE THE LOG` and `cli/test/helpers/fixture.mjs` → `MAX_ARG_STRING_BYTES`.
- **Other readers.** No other reader of `run-analytics.json` asserts `schema == 1`.

**Headline:** the mechanism is sound. One net-new finding remains: a third stale citation of the `Record` header label this branch renamed, outside the diff and missed by the code review's Finding 1.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Re-point `grade-full-run.sh`'s `lib/run-analytics.jq` "Record block" citation at the *Session record* block _(layer: general)_

---

## Must Fix

### 1. `grade-full-run.sh` still cites `lib/run-analytics.jq`, "the Record block", a header label this branch renamed
→ [finding_1.md](feat_run_analytics_gate_timings_skeptic_review/finding_1.md)

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so no reference divergence exists. The branch states two limits of its own:
- the stale `<phase>.tests.tsv` residual and its producer-side closure, in `lib/run-analytics.jq` → mode `rounds` → `Residual:`
- the `—` wait for a label polled fewer than three times in a session, in `lib/run-analytics-report.jq` → `## Gate rounds`

Both were checked against the code. Each is stated where a reader meets it, so neither is a finding.
