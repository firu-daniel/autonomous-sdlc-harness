# Test Fix Plan: fix_run_gates_background_run_handling — task round 1

## Context

- **Branch:** `fix_run_gates_background_run_handling`
- **Log:** `harness-runs/test_run_logs/fix_run_gates_background_run_handling/task_round_1.log`
- **Summary:** The typecheck gate passed (`exited 0`). The test gate exited 1 because `scripts/run-gates.sh` gate 4 (`npm test` in `cli/`) reported 3 failing tests out of 2276: one in `cli/test/run-test-suite.test.mjs`, and one subtest plus its parent in `cli/test/watcher-remote-job.test.mjs`.

Every other gate passed or was reported SKIPPED or BLOCKED (6f, 13a–13d, 14d). `run-gates` does not count those as failures (`run-gates: 1 failed, 22 passed`), so they yield no finding.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. `[ ]` markers anywhere else in this plan or its finding files are informational only.

1. [x] **Finding 1** — The held-off-relaunch usage case keeps a 2-second reset lead a loaded suite outruns. _(layer: cli)_
2. [x] **Finding 2** — The worker's heartbeat stalls while the worker and its gate are alive. _(layer: cli, general)_

## Must Fix

### 1. The held-off-relaunch usage case keeps a 2-second reset lead a loaded suite outruns
→ [finding_1.md](fix_run_gates_background_run_handling_task_round_1/finding_1.md)

### 2. The worker's heartbeat stalls while the worker and its gate are alive, so a killed session's run reads free
→ [finding_2.md](fix_run_gates_background_run_handling_task_round_1/finding_2.md)

## Not fixable on this branch

None.

## Source failures

**Typecheck section** (`commands.typecheck`): no failures (`== run-test-suite.sh: gate typecheck exited 0 ==`).

**Test section** (`commands.test`, `== run-test-suite.sh: gate test exited 1 ==`): the failing gate is `4 npm test` (exit 1). These are its failing tests. Each is first round, with no earlier log to compare against:

- `not ok 992 - a run form killed with its session leaves the worker running, and a re-issued run form collects it` (`cli/test/run-test-suite.test.mjs`) → **Finding 2**.
- `not ok 4 - a relaunch held off past the reset -> the in-job wait bound fires, wait-poller` (subtest of 1088, `cli/test/watcher-remote-job.test.mjs`) → **Finding 1**.
- `not ok 1088 - usage: a short reset is waited out in the job, a reset past the deadline goes to the poller` (`cli/test/watcher-remote-job.test.mjs`) → **Finding 1**. It is the parent of subtest 4, and fails only because that subtest failed.
