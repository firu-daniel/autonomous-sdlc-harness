# Test Fix Plan: fix_clone_main_repo_resolution — task round 1

## Context

- **Branch:** `fix_clone_main_repo_resolution`
- **Log:** `harness-runs/test_run_logs/fix_clone_main_repo_resolution/task_round_1.log`
- **Summary:** The typecheck gate passed; the test gate failed on exactly one arm, gate 6a (no machine paths), because a committed skeptic-review artifact quotes an absolute path under the home directory.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. Any `[ ]` markers elsewhere in this plan or its per-finding files are informational only.

1. [ ] **Finding 1** — Remove the absolute home path from the skeptic review's Check 2 line. _(layer: general)_

## Must Fix

### 1. Skeptic review quotes an absolute home path (gate 6a)

→ [finding_1.md](fix_clone_main_repo_resolution_task_round_1/finding_1.md)

## Not fixable on this branch

None.

## Source failures

Typecheck gate (`commands.typecheck`): exited 0; no failures.

Test gate (`commands.test`), exited 1:

- `6a no machine paths` → **Finding 1**. Class: new this round (round 1; no earlier logs).

Reported by the log but not failures (`run-gates: 1 failed, 24 passed` counts neither), so they yield no finding: `13a Python lint`, `13b Python typecheck`, `13c Python tests` (BLOCKED: Python environment not provisioned), `13d Python container tests` (SKIPPED: not opted in), `14d zizmor over the rendered workflows` (SKIPPED: zizmor 1.30.1 unavailable).
