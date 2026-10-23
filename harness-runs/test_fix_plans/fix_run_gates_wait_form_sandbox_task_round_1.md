# Test Fix Plan: fix_run_gates_wait_form_sandbox — task round 1

## Context

- **Branch:** `fix_run_gates_wait_form_sandbox`
- **Log:** `harness-runs/test_run_logs/fix_run_gates_wait_form_sandbox/task_round_1.log`
- **Summary:** the typecheck gate passed; the test gate failed on one check, gate 6f (`shipped files pass typos`), because `typos 1.51.1` flags the word `unparseable` in a comment of `cli/templates/scripts/lib/harness-run-lib.sh`, which is not in `scripts/check-typos.sh`'s deliberate set — gates 13a–13c were reported BLOCKED for an unprovisioned host environment.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. `[ ]` markers anywhere else in this plan or its per-finding files are informational only.

1. [ ] **Finding 1** — Respell `unparseable` in the `hr_sandbox_opted_out` comment. _(layer: cli, general)_

## Must Fix

### 1. Respell `unparseable` in the `hr_sandbox_opted_out` doc comment
→ [finding_1.md](fix_run_gates_wait_form_sandbox_task_round_1/finding_1.md)

## Not fixable on this branch

Gates 13a, 13b and 13c are reported `BLOCKED`, not `FAIL` — the run-gates summary counts them in neither column (`run-gates: 1 failed, 24 passed`). Their cause is a host-level resource outside the tree: the Python docs-retrieval service's synced environment has not been provisioned on this machine. The operator's remedy is `bash scripts/python-service.sh sync`. No code change on the branch clears them.

- **13a Python lint**
  ```
  BLOCKED 13a Python lint — uv or the synced Python environment is missing; run bash scripts/python-service.sh sync
        python-service: not provisioned: no synced environment at <home>/.cache/harness-docs-retrieval/venvs/1979449703; run bash scripts/python-service.sh sync
  ```
- **13b Python typecheck**
  ```
  BLOCKED 13b Python typecheck — uv or the synced Python environment is missing; run bash scripts/python-service.sh sync
        python-service: not provisioned: no synced environment at <home>/.cache/harness-docs-retrieval/venvs/1979449703; run bash scripts/python-service.sh sync
  ```
- **13c Python tests**
  ```
  BLOCKED 13c Python tests — uv or the synced Python environment is missing; run bash scripts/python-service.sh sync
        python-service: not provisioned: no synced environment at <home>/.cache/harness-docs-retrieval/venvs/1979449703; run bash scripts/python-service.sh sync
  ```

`13d Python container tests` was `SKIPPED` (not opted in) and is neither a failure nor a pass; it yields no entry.

## Source failures

**Gate `typecheck` (`commands.typecheck`)** — exited 0; no static failures.

**Gate `test` (`commands.test`)** — exited 1.

| Failure | Maps to | Class |
|---|---|---|
| `6f shipped files pass typos` — `check-typos: cli/templates/scripts/lib/harness-run-lib.sh — unparseable` | Finding 1 | first round (no earlier logs) |
| `13a Python lint` — BLOCKED | `## Not fixable on this branch` | first round (no earlier logs) |
| `13b Python typecheck` — BLOCKED | `## Not fixable on this branch` | first round (no earlier logs) |
| `13c Python tests` — BLOCKED | `## Not fixable on this branch` | first round (no earlier logs) |
