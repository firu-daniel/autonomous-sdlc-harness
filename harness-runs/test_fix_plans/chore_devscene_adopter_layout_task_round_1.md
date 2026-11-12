# Test Fix Plan: chore_devscene_adopter_layout — task round 1

## Context

- **Branch:** `chore_devscene_adopter_layout`
- **Log:** `harness-runs/test_run_logs/chore_devscene_adopter_layout/task_round_1.log`
- **Summary:** the typecheck gate passed and the test gate failed on gate 4 (`npm test`, 3 of 3904 tests failed): two `cli/test` suites still assert the pre-rename spelling — one expects `harness.config.json` in the sandbox-probe workflow, and one expects path order computed under the old `sdlc-harness` state directory.

Gate 13 (13a–13c, `BLOCKED` — the Python service environment is not provisioned) and the `SKIPPED` gates 13d and 14d are not failures: `run-gates` counts them in neither total (`run-gates: 1 failed, 23 passed`), so this plan yields no finding for them.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. Any `[ ]` markers elsewhere in this plan or its per-finding files are informational only.

1. [x] **Finding 1** — Respell the `Switch to the configured default branch` assertion to `devscene.config.json`. _(layer: cli)_
2. [ ] **Finding 2** — Put the SB2 clarifications arm's expected paths back in `diff-tree` order. _(layer: cli)_

## Must Fix

### 1. Respell the `Switch to the configured default branch` assertion to `devscene.config.json`

→ [finding_1.md](chore_devscene_adopter_layout_task_round_1/finding_1.md)

### 2. Put the SB2 clarifications arm's expected paths back in `diff-tree` order under the `devscene` state directory

→ [finding_2.md](chore_devscene_adopter_layout_task_round_1/finding_2.md)

## Not fixable on this branch

None.

## Source failures

Typecheck gate (`commands.typecheck`): exited 0 — no failures.

Test gate (`commands.test`), gate 4 `npm test`:

- `cli/test/sandbox-probe-runner-workflow.test.mjs` — `not ok 1604 - the job's own steps are copied, byte for byte` → **Finding 1**. Class: first round (no earlier log).
- `cli/test/gate12-sandbox-round-plant.test.mjs` — subtest `not ok 5 - SB2 clarifications` → **Finding 2**. Class: first round (no earlier log).
- `cli/test/gate12-sandbox-round-plant.test.mjs` — `not ok 416 - plant with no --row pushes one plumbing branch per arm, dispatches and records each, and leaves the checkout alone` (`subtestsFailed`, `1 subtest failed`) → **Finding 2**. Class: first round (no earlier log).
