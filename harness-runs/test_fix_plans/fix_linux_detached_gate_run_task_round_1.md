# Test Fix Plan: fix_linux_detached_gate_run — task round 1

## Context

- **Branch:** `fix_linux_detached_gate_run`
- **Log:** `harness-runs/test_run_logs/fix_linux_detached_gate_run/task_round_1.log`
- **Summary:** the typecheck gate passed (exit 0) and the test gate (`scripts/run-gates.sh`) exited 1 on two self-containment sub-gates: 6a found a home-directory path in a committed task plan, and 6f found a non-allowlisted `typos` hit in `cli/templates/scripts/launch-sandboxed-gates.sh`.

The log also reports 13a, 13b and 13c as `BLOCKED` (Python environment not provisioned) and 13d and 14d as `SKIPPED`. `run-gates.sh` counts these as neither passes nor failures (`run-gates: 2 failed, 23 passed`), so they get no finding.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. `[ ]` markers anywhere else in this plan or its per-finding files are informational only.

1. [x] **Finding 1** — Remove the home-directory path from task 18's plan. _(layer: general)_
2. [ ] **Finding 2** — Respell `unparseable` in the sandboxed-gates launcher and its self-adopted copy. _(layer: cli, general)_

## Must Fix

### 1. Remove the home-directory path from task 18's plan
→ [finding_1.md](fix_linux_detached_gate_run_task_round_1/finding_1.md)

### 2. Respell `unparseable` in the sandboxed-gates launcher and its self-adopted copy
→ [finding_2.md](fix_linux_detached_gate_run_task_round_1/finding_2.md)

## Not fixable on this branch

None.

## Source failures

- **Gate `typecheck`:** passed (exit 0). No failures.
- **Gate `test`:** exited 1.
  - `6a no machine paths` → Finding 1 (persisting: there are no earlier rounds' logs, so every failure is classed as persisting).
  - `6f shipped files pass typos` → Finding 2 (persisting: there are no earlier rounds' logs, so every failure is classed as persisting).
