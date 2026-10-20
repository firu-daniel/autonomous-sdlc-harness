# Test Fix Plan: feat_clone_per_run_switch — task round 1

## Context

- **Branch:** `feat_clone_per_run_switch`
- **Log:** `harness-runs/test_run_logs/feat_clone_per_run_switch/task_round_1.log`
- **Summary:** The typecheck gate passed. The test gate failed only in gate 4 (`npm test`). Two cases in `cli/test/refresh-branch-worktree-config.test.mjs`, (a) and (d), still expect the `main-rt` reference-transaction marker. That marker came from the wrapper's own ref update. Task 4 moved that update into `hr_copy_ref_swap_var`, which runs with `core.hooksPath=/dev/null`, so the update no longer fires the hook.

Gate 13a–13c reported `BLOCKED` because the Python service environment is not provisioned, and 13d reported `SKIPPED`. The wrapper does not count these as failures (`run-gates: 1 failed, 24 passed`), so they get no finding and no not-fixable entry.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. `[ ]` markers anywhere else in this plan or its per-finding files are informational only.

1. [x] **Finding 1** — Make the fetch prove the hooks pin in refresh-branch case (a). _(layer: cli)_
2. [x] **Finding 2** — Make the fetch prove the hooks pin in refresh-branch case (d). _(layer: cli)_

## Must Fix

### 1. Make the fetch prove the hooks pin in refresh-branch case (a)

→ [finding_1.md](feat_clone_per_run_switch_task_round_1/finding_1.md)

### 2. Make the fetch prove the hooks pin in refresh-branch case (d)

→ [finding_2.md](feat_clone_per_run_switch_task_round_1/finding_2.md)

## Not fixable on this branch

None.

## Source failures

**Typecheck gate (`commands.typecheck`):** exited 0, no failures.

**Test gate (`commands.test`):** exited 1. Gate 4 `npm test` failed with 2 failing tests:

- `not ok 378 - (a) The main checkout’s copy refreshes the named worktree under the main hooks, and runs no merge hook` → Finding 1. New this round (no earlier logs).
- `not ok 381 - (d) The worktree’s own copy with no argument still refreshes the worktree, under the main hooks` → Finding 2. New this round (no earlier logs).
