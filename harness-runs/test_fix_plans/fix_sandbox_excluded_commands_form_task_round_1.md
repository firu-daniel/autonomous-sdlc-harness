# Test Fix Plan: fix_sandbox_excluded_commands_form — task round 1

## Context

- **Branch:** `fix_sandbox_excluded_commands_form`
- **Log:** `harness-runs/test_run_logs/fix_sandbox_excluded_commands_form/task_round_1.log`
- **Summary:** The typecheck gate passed; the test gate exited 1 because `run-gates` gate `6a no machine paths` found an absolute home-directory path in this branch's task prompt, while gate 13's three Python checks reported BLOCKED for an unprovisioned environment (not counted as failures by `run-gates`).

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. `[ ]` markers anywhere else in this plan or its per-finding files are informational only.

1. [x] **Finding 1** — Task prompt quotes an absolute home-directory path, failing gate 6a. _(layer: general)_

## Must Fix

### 1. Task prompt quotes an absolute home-directory path, failing gate 6a

→ [finding_1.md](fix_sandbox_excluded_commands_form_task_round_1/finding_1.md)

## Not fixable on this branch

- **13a Python lint** — `BLOCKED 13a Python lint — uv or the synced Python environment is missing; run bash scripts/python-service.sh sync` / `python-service: not provisioned: no synced environment at <home>/.cache/harness-docs-retrieval/venvs/2580201265; run bash scripts/python-service.sh sync`. Reason: the Python environment lives outside the tree in a machine-local cache and is not provisioned on this host; the operator remedy is `bash scripts/python-service.sh sync`. `run-gates` does not count it as a failure (`1 failed, 24 passed`).
- **13b Python typecheck** — `BLOCKED 13b Python typecheck — uv or the synced Python environment is missing; run bash scripts/python-service.sh sync`. Reason: same unprovisioned machine-local environment as 13a; not counted as a failure.
- **13c Python tests** — `BLOCKED 13c Python tests — uv or the synced Python environment is missing; run bash scripts/python-service.sh sync`. Reason: same unprovisioned machine-local environment as 13a; not counted as a failure.

## Source failures

**Typecheck gate (`commands.typecheck`):** exited 0 — no static failures.

**Test gate (`commands.test`, exited 1):**

| Failure as the log names it | Maps to | Class |
|---|---|---|
| `6a no machine paths` (gate 6 — self-containment) | Finding 1 | new this round (no earlier round) |
| `13a Python lint` (BLOCKED) | Not fixable on this branch | new this round (no earlier round) |
| `13b Python typecheck` (BLOCKED) | Not fixable on this branch | new this round (no earlier round) |
| `13c Python tests` (BLOCKED) | Not fixable on this branch | new this round (no earlier round) |

`13d Python container tests` reported SKIPPED (not opted in) and the gates listed under "gates this script cannot run" are not failures; neither yields an entry.
