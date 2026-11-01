# Test Fix Plan: fix_linux_test_suite_failures — task round 1

## Context

- **Branch:** `fix_linux_test_suite_failures`
- **Log:** `harness-runs/test_run_logs/fix_linux_test_suite_failures/task_round_1.log`
- **Summary:** The typecheck gate passed (`exited 0`); the test gate exited 1 because `scripts/run-gates.sh` gate **6a no machine paths** printed one hit: the run's own parked-question answer file, `harness-runs/clarifications/fix_linux_test_suite_failures/answer_2.md`, quotes a Node stack frame that carries this run copy's absolute path.

The log also reports gates `13a`, `13b` and `13c` as `BLOCKED` (the Python service environment is not provisioned) and `13d` and `14d` as `SKIPPED`. `run-gates.sh` counts those as neither passes nor failures (`run-gates: 1 failed, 24 passed`), so they are not failures and this plan has no findings for them.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. `[ ]` markers anywhere else in this plan or its finding files are informational only.

1. [x] **Finding 1** — Gate 6a reads the gitignored clarification channel. _(layer: general)_

## Must Fix

### 1. Gate 6a reads the gitignored clarification channel

→ [finding_1.md](fix_linux_test_suite_failures_task_round_1/finding_1.md)

## Not fixable on this branch

None.

## Source failures

- **Gate `typecheck`** (`commands.typecheck`): exited 0, no failures.
- **Gate `test`** (`commands.test`), exited 1:
  - `6a no machine paths` → **Finding 1**. Class: first round, no earlier logs to compare against.
