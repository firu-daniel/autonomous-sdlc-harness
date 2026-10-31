# Test Fix Plan: fix_run_analytics_jq16 — task round 1

## Context

- **Branch:** `fix_run_analytics_jq16`
- **Log:** `harness-runs/test_run_logs/fix_run_analytics_jq16/task_round_1.log`
- **Summary:** The typecheck gate passed. The test gate failed in two places. Gate 4 (`npm test`) failed one test case, `the accepted stricter case: a registered clone with a config.worktree is silent`, under both the bash and zsh legs of `cli/test/task-offer-fence.test.mjs`. Gate 6a (no machine paths) found the running user's home directory in two lines of this branch's `harness-runs/task_plans/fix_run_analytics_jq16/task_5_plan.md`.

Gates 13a–13c reported `BLOCKED` (the Python environment is not provisioned), and 13d and 14d reported `SKIPPED`. `run-gates.sh` counts none of these as failures (`run-gates: 2 failed, 23 passed`), so this plan does not list them as failures. They are noted here so a reader knows they did not run.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. Any `[ ]` marker elsewhere in this plan or its per-finding files is informational only. The list puts the lowest blast radius first: Finding 1 edits one branch-local run artifact and touches no code, and Finding 2 changes one test fixture line and that test's header.

1. [x] **Finding 1** — Remove the home-directory path from Task 5's plan record. _(layer: general)_
2. [ ] **Finding 2** — Plant a non-empty `config.worktree` in the stricter-case fixture of the opt-out fence test. _(layer: cli)_

## Must Fix

### 1. Gate 6a: home-directory path in `task_5_plan.md`
→ [finding_1.md](fix_run_analytics_jq16_task_round_1/finding_1.md)

### 2. Gate 4: task-offer fence stricter case expects silence for a `config.worktree` shape the library now accepts
→ [finding_2.md](fix_run_analytics_jq16_task_round_1/finding_2.md)

## Not fixable on this branch

None.

## Source failures

- **Gate `typecheck`:** passed (`gate typecheck exited 0`). No failures.
- **Gate `test`, gate 4 — `npm test` (exit 1), `# fail 5`.** All five failing nodes come from one test case definition in `cli/test/task-offer-fence.test.mjs`, together with the parents that fail because it fails:
  - `not ok 7 - the accepted stricter case: a registered clone with a config.worktree is silent` (under `bash`) → **Finding 2**. Class: round 1, so there is no earlier log. The cause predates this branch (base commit `66e1e6c5`).
  - `not ok 1 - bash` (parent of the above) → **Finding 2**. Class: round 1, no earlier log.
  - `not ok 7 - the accepted stricter case: a registered clone with a config.worktree is silent` (under `zsh`) → **Finding 2**. Class: round 1, no earlier log.
  - `not ok 2 - zsh` (parent of the above) → **Finding 2**. Class: round 1, no earlier log.
  - `not ok 1223 - the opt-out script in every run-copy layout` (top-level parent) → **Finding 2**. Class: round 1, no earlier log.
- **Gate `test`, gate 6a — `no machine paths`:** two hits in `harness-runs/task_plans/fix_run_analytics_jq16/task_5_plan.md`, at lines 64 and 73 → **Finding 1**. Class: round 1, so there is no earlier log. This branch introduced the hits (commit `af4a93cb`).
- **Gate `test`, aggregate line:** `FAIL: test (exit 1)` / `gate test exited 1` is the sum of gate 4 and gate 6a above, and needs no separate finding.
