# Test Fix Plan: fix_task_offer_check_script — task round 1

## Context

- **Branch:** `fix_task_offer_check_script`
- **Log:** `harness-runs/test_run_logs/fix_task_offer_check_script/task_round_1.log`
- **Summary:** The typecheck gate passed (exit 0). The test gate exited 1 on one failure: run-gates check `6a no machine paths`. The check found the operator's absolute home-directory path in the run-local clarification file `harness-runs/clarifications/fix_task_offer_check_script/question_2.md`.

The log also reports `BLOCKED` for 13a–13c, because the Python docs-retrieval environment is not provisioned. It reports `SKIPPED` for 13d (containers not opted in) and 14d (zizmor 1.30.1 unavailable). The log's own summary (`run-gates: 1 failed, 24 passed`) does not count these as failures, and none of them affected the gate's exit status. This plan therefore makes no finding for them.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. Any `[ ]` marker elsewhere in this plan or its per-finding files is informational only.

1. [ ] **Finding 1** — Remove the absolute machine path from park question 2's option (a). _(layer: general)_

## Must Fix

### 1. Remove the absolute machine path from `question_2.md` option (a)
→ [finding_1.md](fix_task_offer_check_script_task_round_1/finding_1.md)

## Not fixable on this branch

None.

## Source failures

- **Gate `test`, check `6a no machine paths`**: Finding 1. New this round (there are no earlier-round logs).
- **Gate `typecheck`**: passed (exited 0), so there is no failure to map.
