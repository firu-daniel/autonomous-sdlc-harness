# Test Fix Plan: fix_runner_seccomp_userns — task round 1

## Context

- **Branch:** `fix_runner_seccomp_userns`
- **Log:** `harness-runs/test_run_logs/fix_runner_seccomp_userns/task_round_1.log`
- **Summary:** The typecheck gate passed (`gate typecheck exited 0`). The test gate failed (`gate test exited 1`) on exactly one test, `no configured directory is frozen into the file` in `cli/test/workflow-templates.test.mjs`. The cause is a DECLARED MIRRORS comment this branch added to the run workflow template, which spells a `scripts/` path.

The log also reports some sub-gate rows as BLOCKED or SKIPPED: 13a, 13b and 13c (the Python environment is not provisioned), 13d (container tests not opted in) and 14d (zizmor is not available). `run-gates` counts none of them as failures (`run-gates: 1 failed, 24 passed`), so none of them produces a finding.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. `[ ]` markers anywhere else in this plan or its per-finding files are informational only.

1. [ ] **Finding 1** — Remove the frozen `scripts/` path from the run workflow template's DECLARED MIRRORS entry. _(layer: cli)_

## Must Fix

### 1. The run workflow template's DECLARED MIRRORS entry freezes the `scripts/` directory into the file

→ [finding_1.md](fix_runner_seccomp_userns_task_round_1/finding_1.md)

## Not fixable on this branch

None.

## Source failures

- **Gate `typecheck`:** exited 0, no failures.
- **Gate `test`:** exited 1.
  - Sub-gate `4 npm test` (exit 1). Its one failing test, `cli/test/workflow-templates.test.mjs` → `no configured directory is frozen into the file` (`not ok 1656`), maps to **Finding 1**. Class: new this round (first round, no earlier logs).
