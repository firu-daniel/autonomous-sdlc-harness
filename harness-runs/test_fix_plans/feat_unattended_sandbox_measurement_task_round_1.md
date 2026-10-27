# Test Fix Plan: feat_unattended_sandbox_measurement — task round 1

## Context

- **Branch:** `feat_unattended_sandbox_measurement`
- **Log:** `harness-runs/test_run_logs/feat_unattended_sandbox_measurement/task_round_1.log`
- **Summary:** The typecheck gate passed (exited 0). The test gate exited 1 because of one failing check, gate 6a "no machine paths". A skeptic-review run artifact carries the absolute checkout path.

Gate 13a–13c are reported `BLOCKED` and gate 13d `SKIPPED` (`python-service: not provisioned: no synced environment at <home>/.cache/harness-docs-retrieval/venvs/1649790355; run bash scripts/python-service.sh sync`). These are not failures: `run-gates: 1 failed, 24 passed` counts only 6a. They yield no finding.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. `[ ]` markers anywhere else in this plan or its per-finding files are informational only.

1. [ ] **Finding 1** — Remove the absolute checkout path from the skeptic-review finding_4 implementer record. _(layer: general)_

## Must Fix

### 1. Remove the absolute checkout path from the skeptic-review finding_4 implementer record

→ [finding_1.md](feat_unattended_sandbox_measurement_task_round_1/finding_1.md)

## Not fixable on this branch

None.

## Source failures

- **typecheck gate** — passed (`== run-test-suite.sh: gate typecheck exited 0 ==`). No failures.
- **test gate** (`== run-test-suite.sh: gate test exited 1 ==`):
  - `6a no machine paths` → **Finding 1**. Class: round 1, no earlier log, so not classified as new or persisting.
