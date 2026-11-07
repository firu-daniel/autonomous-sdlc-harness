# Test Fix Plan: chore_unattended_sandbox_record — task round 1

## Context

- **Branch:** `chore_unattended_sandbox_record`
- **Test log:** `harness-runs/test_run_logs/chore_unattended_sandbox_record/task_round_1.log` (round 1; no earlier logs)
- **Summary:** the typecheck gate passed and the test gate failed on one item only — gate 4 (`npm test`), whose single non-passing file, `cli/test/gate12-sandbox-round-default-branch.test.mjs`, was cancelled at the runner's 1 800 000 ms file timeout after one of its cases passed (`# fail 0`, `# cancelled 1`).

Not failures, and so not planned: gate 13a/13b/13c are reported `BLOCKED` (the Python docs-retrieval environment is not provisioned on this host — `python-service: not provisioned: no synced environment at <home>/.cache/harness-docs-retrieval/venvs/2015450160; run bash scripts/python-service.sh sync`), and 13d and 14d are `SKIPPED` (not opted in; zizmor 1.30.1 unavailable). The run's own summary counts them outside the failures: `run-gates: 1 failed, 24 passed`.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop: it walks these entries top to bottom and acts on the first `[ ]`. `[ ]` markers anywhere else — including the `- [ ]` sub-step bullets inside the per-finding files — are informational only.

1. [x] **Finding 1** — Bound the gate12 default-branch suite's child waits so a stuck round fails fast and names itself. _(layer: cli, general)_

## Must Fix

### 1. gate12-sandbox-round-default-branch.test.mjs hangs until the 30-minute file timeout

→ [finding_1.md](chore_unattended_sandbox_record_task_round_1/finding_1.md)

## Not fixable on this branch

None.

## Source failures

- **Gate `typecheck`** (`commands.typecheck`) — exited 0; no failure.
- **Gate `test`** (`commands.test`), exited 1:
  - Gate 4 `npm test` (`FAIL  4 npm test (exit 1, 2444 s)`), its one non-passing file `cli/test/gate12-sandbox-round-default-branch.test.mjs` (`failureType: 'testTimeoutFailure'`, `error: 'test timed out after 1800000ms'`) → **Finding 1**. Class: new this round (round 1, no earlier log).
