# Test Fix Plan: fix_remote_bundle_save_symlinks — task round 1

## Context

- **Branch:** `fix_remote_bundle_save_symlinks`
- **Test log:** `harness-runs/test_run_logs/fix_remote_bundle_save_symlinks/task_round_1.log`
- **Summary:** the typecheck gate passed, and the test gate failed on exactly one run-gates check, 6d (plugin command spellings carry the prefix), which flags two bare `/branch-start-plan-autonomous` spellings in `docs/copilot-foundry-research.md`. Gate 13a–13c were reported BLOCKED because this host has no provisioned Python environment.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. `[ ]` markers anywhere else in this plan or its per-finding files are informational only.

1. [x] **Finding 1** — Respell the two bare plan-engine command spellings in `docs/copilot-foundry-research.md`. _(layer: general)_

## Must Fix

### 1. Bare `/branch-start-plan-autonomous` spellings in `docs/copilot-foundry-research.md` fail gate 6d

→ [finding_1.md](fix_remote_bundle_save_symlinks_task_round_1/finding_1.md)

## Not fixable on this branch

- **Gate 13a Python lint, 13b Python typecheck, 13c Python tests (BLOCKED).**

  ```
  BLOCKED 13a Python lint — uv or the synced Python environment is missing; run bash scripts/python-service.sh sync
        python-service: not provisioned: no synced environment at <home>/.cache/harness-docs-retrieval/venvs/3464952932; run bash scripts/python-service.sh sync
  ```

  13b and 13c carry the same `not provisioned` line. **Reason:** this is a host-level resource. The Python docs-retrieval service's environment lives under the user's cache directory, outside the tree, and nothing on the branch can provision it. run-gates does not count these as failures (`run-gates: 1 failed, 24 passed`). The operator's remedy is the one the log names: `bash scripts/python-service.sh sync` on the host, then gate 13 runs unattended.

## Source failures

**Typecheck gate (`commands.typecheck`):** exited 0, so there are no static failures.

**Test gate (`commands.test`), which exited 1:**

| Failure the log names | Mapped to | Class |
|---|---|---|
| 6d plugin command spellings carry the prefix: `docs/copilot-foundry-research.md:43` and `:119` | Finding 1 | first round (no earlier logs) |
| 13a Python lint (BLOCKED) | `## Not fixable on this branch` | first round (no earlier logs) |
| 13b Python typecheck (BLOCKED) | `## Not fixable on this branch` | first round (no earlier logs) |
| 13c Python tests (BLOCKED) | `## Not fixable on this branch` | first round (no earlier logs) |

13d (SKIPPED, not opted in) is neither a failure nor a pass, so it yields no entry.
