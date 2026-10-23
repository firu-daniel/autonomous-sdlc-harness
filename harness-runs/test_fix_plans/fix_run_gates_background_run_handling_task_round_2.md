# Test Fix Plan: fix_run_gates_background_run_handling — task round 2

## Context

- **Branch:** `fix_run_gates_background_run_handling`
- **Test log:** `harness-runs/test_run_logs/fix_run_gates_background_run_handling/task_round_2.log` (earlier round: `harness-runs/test_run_logs/fix_run_gates_background_run_handling/task_round_1.log`)
- **Summary:** The typecheck gate passed. The test gate (`scripts/run-gates.sh`) failed only on gate `6b no template in the dot-namespace`, which printed a `.claude/` directory under the run-artifact tree that holds no file. Round 1's only failure, gate `4 npm test`, now passes.

The BLOCKED legs (13a–13c) and SKIPPED legs (6f, 13d, 14d) in the log are reported by `run-gates.sh` as neither a pass nor a failure. Its own tally (`1 failed, 22 passed`) does not count them, so this plan has no finding for them.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. `[ ]` markers anywhere else, including the `- [ ]` sub-step bullets inside the per-finding files, are informational only.

1. [ ] **Finding 1** — Gate 6b reports a file-less `.claude/` directory under the run-artifact tree. _(layer: general)_

## Must Fix

### 1. Gate 6b reports a file-less `.claude/` directory under the run-artifact tree

→ [finding_1.md](fix_run_gates_background_run_handling_task_round_2/finding_1.md)

## Not fixable on this branch

None.

## Source failures

**Gate `typecheck` (`commands.typecheck`):** exited 0, so no failures.

**Gate `test` (`commands.test`):**

- `6b no template in the dot-namespace`: printed `./harness-runs/.claude`. → **Finding 1**. Class: *new this round*. It passed in round 1, and no round-1 fix commit created the directory.
