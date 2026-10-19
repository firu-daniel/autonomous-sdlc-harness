# Test Fix Plan: fix_sandbox_worktree_record_writes — task round 1

## Context

- **Branch:** `fix_sandbox_worktree_record_writes`
- **Log:** `harness-runs/test_run_logs/fix_sandbox_worktree_record_writes/task_round_1.log`
- **Summary:** The typecheck gate passed. The test gate failed on a single check, `run-gates` gate 6a (no machine paths), because the committed task prompt for this branch names an absolute path under the author's home directory.

Gate 13a–13c are reported `BLOCKED` (the Python environment is not provisioned on this host) and 13d `SKIPPED`. The log's own tally (`run-gates: 1 failed, 24 passed`) does not count them as failures, so they get no finding and are not listed below.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. `[ ]` markers anywhere else in this plan are informational only.

1. [ ] **Finding 1** — Replace the home-directory path in this branch's task prompt with `<home>/…`. _(layer: general)_

## Must Fix

### 1. Replace the home-directory path in this branch's task prompt with `<home>/…`

→ [finding_1.md](fix_sandbox_worktree_record_writes_task_round_1/finding_1.md)

## Not fixable on this branch

None.

## Source failures

**Gate `typecheck` (commands.typecheck):** exited 0. No failures.

**Gate `test` (commands.test):**

- `6a no machine paths`: → Finding 1. Class: first round, so no earlier log to compare against.
