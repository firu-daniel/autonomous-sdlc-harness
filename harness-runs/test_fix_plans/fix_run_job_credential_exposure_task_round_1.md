# Test Fix Plan: fix_run_job_credential_exposure — task round 1

## Context

- **Branch:** `fix_run_job_credential_exposure`
- **Log:** `harness-runs/test_run_logs/fix_run_job_credential_exposure/task_round_1.log`
- **Summary:** the typecheck gate passed and the test gate failed on exactly one check, run-gates gate 6f (`shipped files pass typos`), which flags the token `PN` twice in a comment of `cli/templates/scripts/autonomous-watcher.sh`.

The log also reports gate 13a–13c as `BLOCKED` (the Python docs-retrieval environment is not provisioned) and 13d and 14d as `SKIPPED`. The log's own tally counts none of them as failures (`run-gates: 1 failed, 24 passed`), so they yield no finding and no not-fixable entry.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop: walk it top to bottom and take the first `[ ]` entry. `[ ]` markers anywhere else in this plan or its per-finding files are informational only.

1. [x] **Finding 1** — Reword the watcher comment that trips the typos gate. _(layer: cli)_

## Must Fix

### 1. Shipped watcher comment trips the typos gate on the `PN1–PN3` row ids

→ [finding_1.md](fix_run_job_credential_exposure_task_round_1/finding_1.md)

## Not fixable on this branch

None.

## Source failures

- **Gate `typecheck`** — exited 0; no failure.
- **Gate `test`** — exited 1:
  - `6f shipped files pass typos` (`check-typos: cli/templates/scripts/autonomous-watcher.sh — PN`, reported twice) → **Finding 1**. Class: new this round (round 1; no earlier log).
