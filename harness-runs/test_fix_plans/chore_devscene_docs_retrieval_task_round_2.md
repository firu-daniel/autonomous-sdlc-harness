# Test Fix Plan: chore_devscene_docs_retrieval — task round 2

## Context

- **Branch:** `chore_devscene_docs_retrieval`
- **Log:** `harness-runs/test_run_logs/chore_devscene_docs_retrieval/task_round_2.log` (earlier round: `harness-runs/test_run_logs/chore_devscene_docs_retrieval/task_round_1.log`)
- **Summary:** the typecheck gate passed; the test gate exited 1 because gate 13's three Python legs (13a lint, 13b typecheck, 13c tests) were each refused by the run's sandbox when `uv` tried to open its default cache under the home directory, which is a cause outside the tree, so none of them is fixable on this branch.

This round ran only part of the test gate. The log says: `run-gates: stopped early: ran only gates 2a, 6a, 13a, 13b, 13c and test files none, which failed in task_round_1; every other gate and test file did not run, so this round cannot pass`. Only those five are classified below. Of them, 2a and 6a passed (`ok    2a build`, `ok    6a no machine paths`), so round 1's 6a finding is cleared. The three gate-13 legs failed again.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. `[ ]` markers anywhere else in this plan are informational only.

None. Every failure this round is under `## Not fixable on this branch`.

## Must Fix

None.

## Not fixable on this branch

All three failures have the same cause. `scripts/python-service.sh` runs `lint`, `typecheck` and `test` through `uv run --frozen --no-sync …`. That script exports `UV_PROJECT_ENVIRONMENT`, `RUFF_CACHE_DIR` and `MYPY_CACHE_DIR`, but it does not set `uv`'s own cache, so `uv` opens its default cache at `<home>/.cache/uv`. That path is outside the run copy, the state directory and the temp directory. Opening it failed with `Operation not permitted`, which is the sandbox-refusal signature in `plugin/agents/layer-implementer.md` → **A sandbox refusal is the boundary working, in every mode.**, and the refused path does lie outside the sandbox's write set. `harness-runs/task_plans/chore_devscene_docs_retrieval/task_7_plan.md` records the same refusal for `sync` and `run --help`, and says the operator ran `sync` outside the sandbox.

Two things are ruled out:
- Planning a code change to move the cache, such as exporting a `UV_CACHE_DIR`, would be a change made to avoid a sandbox refusal. This plan forbids that without an answer-file `**Authorised by:**` line naming these failures.
- Adding a profile write entry is never the remedy.

**Operator's remedy:** this is a filesystem refusal, not a host refusal, so a `sandbox.allowedDomains[]` entry would not lift it. Use the named opt-out instead: set `sandbox.optOut` with its `reason` in `devscene.config.json`, then run `npx devscene init --force`. The alternative is to run gate 13 (`bash scripts/python-service.sh lint`, `typecheck`, `test`) outside the sandbox, as was already done for `sync`, and record the result.

- **13a Python lint** (`exit 1`). Log:
  ```
  error: Failed to initialize cache at `<home>/.cache/uv`
    cause: failed to open file `<home>/.cache/uv/sdists-v9/.git`: Operation not permitted (os error 1)
  ```
  (printed twice, once for `ruff check` and once for `ruff format --check`). Reason: `uv` cannot open its cache under the home directory because the sandbox refuses it. The cause is outside the tree.
- **13b Python typecheck** (`exit 1`). Log:
  ```
  error: Failed to initialize cache at `<home>/.cache/uv`
    cause: failed to open file `<home>/.cache/uv/sdists-v9/.git`: Operation not permitted (os error 1)
  ```
  Reason: the same sandbox refusal, on `uv run --frozen --no-sync mypy`.
- **13c Python tests** (`exit 1`). Log:
  ```
  error: Failed to initialize cache at `<home>/.cache/uv`
    cause: failed to open file `<home>/.cache/uv/sdists-v9/.git`: Operation not permitted (os error 1)
  ```
  Reason: the same sandbox refusal, on `uv run --frozen --no-sync pytest`.

**Park answer (Q1 of `harness-runs/clarifications/chore_devscene_docs_retrieval/question_3.md`):** the operator chose none of routes (a)–(c). They removed this run copy's synced Python environment. From now on, gates 13a–13c exit 3, and `scripts/run-gates.sh` grades that status BLOCKED, as it intends for an unprovisioned checkout. Gate 13 is to be treated as hand-run, and the Run gates phase continues. The answer asks for no code change, so no entry is converted. The three entries above stay as the record of this round's failures.

Park answer consumed: harness-runs/clarifications/chore_devscene_docs_retrieval/answer_3.md

## Source failures

- **Gate typecheck** (`commands.typecheck`): exited 0. No failures.
- **Gate test** (`commands.test`): exited 1. Its failures:
  - `13a Python lint`: `## Not fixable on this branch`. *Persisting* (it failed identically in `task_round_1.log`).
  - `13b Python typecheck`: `## Not fixable on this branch`. *Persisting* (it failed identically in `task_round_1.log`).
  - `13c Python tests`: `## Not fixable on this branch`. *Persisting* (it failed identically in `task_round_1.log`).
