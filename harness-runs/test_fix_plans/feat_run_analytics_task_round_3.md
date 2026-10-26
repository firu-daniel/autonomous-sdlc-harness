# Test Fix Plan: feat_run_analytics — task round 3

## Context

- **Branch:** `feat_run_analytics`
- **Log:** `harness-runs/test_run_logs/feat_run_analytics/task_round_3.log`
- **Earlier logs:** `harness-runs/test_run_logs/feat_run_analytics/task_round_1.log`, `harness-runs/test_run_logs/feat_run_analytics/task_round_2.log`
- **Summary:** The typecheck gate passed; the test gate exited 1 because sub-gate `4 npm test` had exactly one failing test out of 2328, ``a non-zero command collects exactly `fail <log path>` with exit 1`` in `cli/test/run-test-suite.test.mjs`, which is new this round.

All six round-2 failures (the `watcher-run-analytics`, `watcher-sandbox-refusal` and `watcher-review-drop-payloads` subtests) did not recur. Between round 2 and round 3, the only code change on the branch is commit `ea4a69a1`, which touches `cli/test/helpers/watcher.mjs` and `cli/test/watcher-run-analytics.test.mjs`. Neither is imported by `cli/test/run-test-suite.test.mjs`, and neither touches `cli/templates/scripts/run-test-suite.sh`. The new failure is therefore in a test whose own code and subject were byte-identical in round 2, where it passed. The log gives the test name only, with no assertion message (see Finding 1).

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. It is walked top to bottom, and the first `[ ]` entry is the next unit. `[ ]` markers anywhere else, including the `- [ ]` sub-step bullets inside the per-finding files, are informational only.

1. [ ] **Finding 1** — run-test-suite: a non-zero command collects exactly `fail <log path>` with exit 1. _(layer: cli)_

## Must Fix

### 1. run-test-suite: a non-zero command collects exactly `fail <log path>` with exit 1 (new this round)
→ [finding_1.md](feat_run_analytics_task_round_3/finding_1.md)

## Not fixable on this branch

- **Gate 13a / 13b / 13c — Python lint, typecheck and tests (BLOCKED).**
  > `BLOCKED 13a Python lint — uv or the synced Python environment is missing; run bash scripts/python-service.sh sync`
  > `python-service: not provisioned: no synced environment at <home>/.cache/harness-docs-retrieval/venvs/3004880420; run bash scripts/python-service.sh sync`

  The cause is on the host: the Python environment has not been provisioned. 13b and 13c print the same lines. `run-gates.sh` does not count BLOCKED as failed (`run-gates: 1 failed, 22 passed`). An operator fixes it by running `bash scripts/python-service.sh sync` on the host. No change on the branch fixes it.

## Source failures

**Gate typecheck (`commands.typecheck`):** exited 0. No failures.

**Gate test (`commands.test`):** exited 1. Sub-gates:

- `4 npm test` (exit 1): 1 failing test:
  - ``not ok 996 - a non-zero command collects exactly `fail <log path>` with exit 1`` (`cli/test/run-test-suite.test.mjs`) → **Finding 1**. **New this round**: absent from round 2's log and from round 1's.
- `13a Python lint`, `13b Python typecheck`, `13c Python tests` (BLOCKED, not counted as failed by `run-gates.sh`) → `## Not fixable on this branch`. **Persisting** (rounds 1 and 2).

Round 2's failures did not recur: tests `1123`, `1145` (with its subtests 1–4) and `1161` (round-2 numbering). The log also reports `SKIPPED` lines for 6f, 13d and 14d. Each says it was not run, so none is a failure and none yields a finding.
