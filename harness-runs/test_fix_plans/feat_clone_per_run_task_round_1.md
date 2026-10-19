# Test Fix Plan: feat_clone_per_run — task round 1

## Context

- **Branch:** `feat_clone_per_run`
- **Log:** `harness-runs/test_run_logs/feat_clone_per_run/task_round_1.log`
- **Summary:** The typecheck gate passed; the test gate failed on exactly one check, gate 6a "no machine paths", because a committed architecture-review artifact on this branch quotes an absolute path under the home directory.

Gate 13a–13c reported `BLOCKED` (Python service environment not provisioned) and 13d `SKIPPED`; the wrapper does not count these as failures (`run-gates: 1 failed, 24 passed`), so they yield no finding and no not-fixable entry.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. `[ ]` markers anywhere else in this plan or its per-finding files are informational only.

1. [ ] **Finding 1** — Replace the machine path in the round-2 architecture review artifact. _(layer: general)_

## Must Fix

### 1. Replace the machine path in the round-2 architecture review artifact

→ [finding_1.md](feat_clone_per_run_task_round_1/finding_1.md)

## Not fixable on this branch

None.

## Source failures

**Typecheck gate (`commands.typecheck`):** exited 0 — no failures.

**Test gate (`commands.test`):** exited 1.

- `6a no machine paths` → Finding 1 — first observed this round (no earlier logs).
