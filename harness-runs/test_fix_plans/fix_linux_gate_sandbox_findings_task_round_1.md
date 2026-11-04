# Test Fix Plan: fix_linux_gate_sandbox_findings — task round 1

## Context

- **Branch:** `fix_linux_gate_sandbox_findings`
- **Log:** `harness-runs/test_run_logs/fix_linux_gate_sandbox_findings/task_round_1.log`
- **Summary:** the typecheck gate passed; the test gate exited 1 because gate 4's `npm test` had exactly one failing case — `cli/test/check-machine-paths.test.mjs` (b), where `scripts/check-machine-paths.sh`'s clarifications filter drops the top-level `harness-runs/clarifications/README.md` hit it is meant to keep.

Gate 13a–13c (`BLOCKED`, Python environment not provisioned), 13d and 14d (`SKIPPED`) are reported by `run-gates` as neither passes nor failures (`run-gates: 1 failed, 24 passed`); they are not failures of this round and yield no finding.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop: walk it top-to-bottom and take the first `[ ]` entry. `[ ]` markers anywhere else — including the sub-step bullets inside the per-finding files — are informational only.

1. [x] **Finding 1** — Stop the clarifications filter swallowing the top-level README's hit. _(layer: general)_

## Must Fix

### 1. The clarifications filter in check-machine-paths.sh swallows the top-level README's hit

→ [finding_1.md](fix_linux_gate_sandbox_findings_task_round_1/finding_1.md)

## Not fixable on this branch

None.

## Source failures

- **Gate `typecheck`** — exited 0; no failures.
- **Gate `test`** — exited 1, via `run-gates` gate 4 (`npm test`, exit 1):
  - `cli/test/check-machine-paths.test.mjs` — `(b) the excluded places print nothing, while the clarifications README still prints` → **Finding 1**. Class: first round (no earlier log).
