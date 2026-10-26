# Test Fix Plan: feat_run_gates_flake_resilience — task round 1

## Context

- **Branch:** `feat_run_gates_flake_resilience`
- **Log:** `harness-runs/test_run_logs/feat_run_gates_flake_resilience/task_round_1.log`
- **Summary:** The typecheck gate passed (exited 0); the test gate exited 1 because `run-gates` gate 4 (`npm test`) had exactly one failing case — `every process.env spread in a test source blanks the anchor in the same object` — tripped by an unguarded `process.env` spread in the new `cli/test/test-time-scale.test.mjs`.

The log's SKIPPED lines (6f typos, 13d container tests, 14d zizmor) and BLOCKED lines (13a–13c, the Python docs-retrieval service not provisioned) are not counted as failures by `run-gates` (`run-gates: 1 failed, 22 passed`) and yield no finding.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. Any `[ ]` markers elsewhere in this plan or its per-finding files are informational only.

1. [ ] **Finding 1** — Blank the main-repo anchor in `test-time-scale.test.mjs`'s child environment. _(layer: cli)_

## Must Fix

### 1. Blank the main-repo anchor in `test-time-scale.test.mjs`'s child environment

→ [finding_1.md](feat_run_gates_flake_resilience_task_round_1/finding_1.md)

## Not fixable on this branch

None.

## Source failures

- **Gate `typecheck`** — exited 0; no failure.
- **Gate `test`** (exited 1), `run-gates` gate 4 `npm test`:
  - `not ok 288 - every process.env spread in a test source blanks the anchor in the same object` (`cli/test/main-anchor-isolation.test.mjs`) → **Finding 1** — new this round (first round; no earlier log).
