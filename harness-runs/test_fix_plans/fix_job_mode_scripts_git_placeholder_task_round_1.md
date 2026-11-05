# Test Fix Plan: fix_job_mode_scripts_git_placeholder — task round 1

## Context

- **Branch:** `fix_job_mode_scripts_git_placeholder`
- **Test log:** `harness-runs/test_run_logs/fix_job_mode_scripts_git_placeholder/task_round_1.log`
- **Summary:** the typecheck gate passed and the test gate failed on two of its sub-gates: gate 4 (`npm test`, one failing case, `(t) F15` in `cli/test/launch-sandboxed-gates.test.mjs`, which snapshots the fixture while the supervisor is still sweeping its placeholders) and gate 6a (`no machine paths`, one absolute home-directory path in this branch's committed task prompt).

The log's gate 13a/13b/13c lines are `BLOCKED` (Python environment not provisioned) and 13d/14d are `SKIPPED`; the log's own summary (`run-gates: 2 failed, 23 passed`) does not count them as failures, so they yield no finding.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. Any `[ ]` markers elsewhere in this plan or in its per-finding files are informational only.

1. [x] **Finding 1** — Replace the absolute home path in the branch's task prompt. _(layer: general)_
2. [ ] **Finding 2** — Wait for the whole placeholder sweep before case (t)'s after-snapshot. _(layer: cli)_

## Must Fix

### 1. Replace the absolute home path in the branch's task prompt

→ [finding_1.md](fix_job_mode_scripts_git_placeholder_task_round_1/finding_1.md)

### 2. Wait for the whole placeholder sweep before case (t)'s after-snapshot

→ [finding_2.md](fix_job_mode_scripts_git_placeholder_task_round_1/finding_2.md)

## Not fixable on this branch

None.

## Source failures

- **Gate `test` → sub-gate 4 `npm test`** — `not ok 458 - (t) F15: job mode with <main>/scripts/.git protected and absent reaches its verdict past the placeholder` (`cli/test/launch-sandboxed-gates.test.mjs`) → **Finding 2**. Class: no earlier logs named, so not classified as new or persisting (round 1).
- **Gate `test` → sub-gate 6a `no machine paths`** — hit in `harness-runs/task_prompts/fix_job_mode_scripts_git_placeholder_task_prompt.md:37` → **Finding 1**. Class: no earlier logs named, so not classified as new or persisting (round 1).
- **Gate `typecheck`** — exited 0; no failure.
