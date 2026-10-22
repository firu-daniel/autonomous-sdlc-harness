# Test Fix Plan: fix_self_adopt_regeneration_friction — task round 1

## Context

- **Branch:** `fix_self_adopt_regeneration_friction`
- **Log:** `harness-runs/test_run_logs/fix_self_adopt_regeneration_friction/task_round_1.log`
- **Summary:** the typecheck gate passed. The test gate failed two `run-gates` gates: gate 4 (`npm test`, one failing case in `cli/test/init.test.mjs`) and gate 6a (no machine paths, one hit in this branch's dispatch-additions record). Gate 13a–13c were reported BLOCKED because the Python environment on this host has not been provisioned.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. `[ ]` markers anywhere else in this plan or its per-finding files are informational only.

1. [x] **Finding 1** — Replace the absolute checkout path in the dispatch-additions record. _(layer: general)_
2. [ ] **Finding 2** — Add `carried: false` to the `writeWrapperScripts` result expectations in `init.test.mjs`. _(layer: cli)_

## Must Fix

### 1. Gate 6a: absolute checkout path in `harness-runs/dispatch_additions/fix_self_adopt_regeneration_friction.md`

→ [finding_1.md](fix_self_adopt_regeneration_friction_task_round_1/finding_1.md)

### 2. Gate 4: `init.test.mjs` expects a `writeWrapperScripts` entry without the new `carried` field

→ [finding_2.md](fix_self_adopt_regeneration_friction_task_round_1/finding_2.md)

## Not fixable on this branch

- **Gate 13a Python lint, 13b Python typecheck and 13c Python tests (BLOCKED):**

  > `python-service: not provisioned: no synced environment at <home>/.cache/harness-docs-retrieval/venvs/2088163849; run bash scripts/python-service.sh sync`

  The cause is on the host, not in the tree. The docs-retrieval Python environment has not been provisioned on this machine, and the branch does not touch the Python service. The operator fixes it by running `bash scripts/python-service.sh sync` before the next gate run. `run-gates` counts these as BLOCKED, not failed (`run-gates: 2 failed, 23 passed`).
- **Gate 13d (SKIPPED):** this gate is opt-in (`HARNESS_GATES_CONTAINERS=1` on a machine with Docker). It did not fail, and it is listed here only so every non-passing line in the log is accounted for.

## Source failures

**Typecheck section (`commands.typecheck`):** no failures. The gate exited 0 (`PASS: typecheck`).

**Test section (`commands.test`):**

| Failing gate / test | Maps to | Class |
|---|---|---|
| Gate 4 `npm test`, test `not ok 19 - the command line writeWrapperScripts returns is the one it inlined into the wrapper` (`cli/test/init.test.mjs`, reported under `not ok 268 - init`) | Finding 2 | new this round (round 1, no earlier log) |
| Gate 6a no machine paths, hit at `./harness-runs/dispatch_additions/fix_self_adopt_regeneration_friction.md:3` | Finding 1 | new this round (round 1, no earlier log) |
| Gates 13a / 13b / 13c, BLOCKED (Python service not provisioned) | `## Not fixable on this branch` | new this round (round 1, no earlier log) |
| Gate 13d, SKIPPED (not opted in) | `## Not fixable on this branch` | new this round (round 1, no earlier log) |
