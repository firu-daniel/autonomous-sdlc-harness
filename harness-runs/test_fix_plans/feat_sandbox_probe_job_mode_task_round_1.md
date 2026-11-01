# Test Fix Plan: feat_sandbox_probe_job_mode — task round 1

## Context

- **Branch:** `feat_sandbox_probe_job_mode`
- **Log:** `harness-runs/test_run_logs/feat_sandbox_probe_job_mode/task_round_1.log`
- **Earlier logs:** none (round 1)

The `typecheck` gate passed (exited 0). The `test` gate exited 1 because one inner gate failed: gate 4, `npm test`. In that gate, one subtest of `cli/test/sandbox-probe-job-launch.test.mjs` failed, and so did its parent test. The cause is that the subtest plants a writable file as an earlier session's placeholder, and the sweep rightly refuses to remove a writable file.

Inner gate 13 (13a–13c) was reported BLOCKED because the Python environment is not provisioned. `run-gates` counted it as neither failed nor passed (`run-gates: 1 failed, 24 passed`), and it is recorded below under `## Not fixable on this branch`. Inner gates 13d and 14d were reported SKIPPED, are not failures, and yield no finding.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. Any `[ ]` marker elsewhere in this plan or in its per-finding files is informational only.

1. [ ] **Finding 1** — Make the sweep case's planted placeholder read-only. _(layer: cli)_

## Must Fix

### 1. The earlier-session placeholder the sweep case plants is writable, so the sweep keeps it
→ [finding_1.md](feat_sandbox_probe_job_mode_task_round_1/finding_1.md)

## Not fixable on this branch

- **Inner gate 13a–13c (Python docs-retrieval service: lint, typecheck, tests) — BLOCKED.** The log says:

  ```
    BLOCKED 13a Python lint — uv or the synced Python environment is missing; run bash scripts/python-service.sh sync
          python-service: not provisioned: no synced environment at <home>/.cache/harness-docs-retrieval/venvs/938792887; run bash scripts/python-service.sh sync
  ```

  (13b and 13c report the same cause.) Reason: the cause is outside the tree. The synced Python environment under the operator's home cache is not there. `run-gates` does not count this as a failure. Operator's remedy: run `bash scripts/python-service.sh sync` on the host.

## Source failures

- **Gate `typecheck`** — exited 0, no failures.
- **Gate `test`** — exited 1:
  - Inner gate 4 `npm test`, test `a placeholder an earlier session left is swept and listed again` (`cli/test/sandbox-probe-job-launch.test.mjs`) → **Finding 1**. Class: no earlier round (round 1, no earlier logs).
  - Inner gate 4 `npm test`, test `the job-mode placeholder manifest` (`cli/test/sandbox-probe-job-launch.test.mjs`, the parent of the subtest above; `not ok` only because that subtest failed) → **Finding 1**. Class: no earlier round (round 1, no earlier logs).
  - Inner gate 13a–13c, Python docs-retrieval service (BLOCKED, not counted as failed) → `## Not fixable on this branch`. Class: no earlier round (round 1, no earlier logs).
