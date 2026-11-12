# Test Fix Plan: chore_devscene_docs_retrieval — task round 1

## Context

- **Branch:** `chore_devscene_docs_retrieval`
- **Test log:** `harness-runs/test_run_logs/chore_devscene_docs_retrieval/task_round_1.log`
- **Earlier logs:** none

The typecheck gate passed and the test gate exited 1. Gate 6a failed because two committed run artifacts quote the home directory. Gates 13a, 13b and 13c failed because the sandbox refused `uv` access to its user-level cache.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. It walks the entries top to bottom and takes the first `[ ]`. `[ ]` markers anywhere else, including the sub-step bullets inside the per-finding files, are informational only.

1. [x] **Finding 1** — Rewrite the home-directory paths two run artifacts carry. _(layer: general)_

## Must Fix

### 1. Rewrite the home-directory paths two run artifacts carry

→ [finding_1.md](chore_devscene_docs_retrieval_task_round_1/finding_1.md)

## Not fixable on this branch

### 13a Python lint, 13b Python typecheck, 13c Python tests — sandbox refusal on the uv cache

Quoted from the log, with home paths rewritten to `<home>`:

```
  FAIL  13a Python lint (exit 1, 0 s)
        error: Failed to initialize cache at `<home>/.cache/uv`
          cause: failed to open file `<home>/.cache/uv/sdists-v9/.git`: Operation not permitted (os error 1)
  FAIL  13b Python typecheck (exit 1, 0 s)
        error: Failed to initialize cache at `<home>/.cache/uv`
          cause: failed to open file `<home>/.cache/uv/sdists-v9/.git`: Operation not permitted (os error 1)
  FAIL  13c Python tests (exit 1, 0 s)
        error: Failed to initialize cache at `<home>/.cache/uv`
          cause: failed to open file `<home>/.cache/uv/sdists-v9/.git`: Operation not permitted (os error 1)
```

**Reason.** All three gates stop with the same error before any lint, typecheck or test code runs: `uv` cannot open its cache under the home directory. The output carries `Operation not permitted` for a path outside the run copy, the state directory and the temp directory. That is the run sandbox's filesystem boundary, the signature `plugin/agents/layer-implementer.md` describes in **A sandbox refusal is the boundary working, in every mode.** The cause is the host's sandbox profile, not anything in the tree.

No change on the branch can fix this. Moving the uv cache, or skipping or weakening the gate, to get past the refusal is exactly what that paragraph forbids. The same refusal is already on record in Task 7's deviation notes (`harness-runs/task_plans/chore_devscene_docs_retrieval/task_7_plan.md`), where the operator ran `bash scripts/python-service.sh sync` outside the sandbox.

**Operator's remedy** (from that paragraph): set the named opt-out `sandbox.optOut` with its `reason` in `devscene.config.json`, then run `init --force`. Alternatively, run gate 13 by hand outside the sandbox. A `sandbox.allowedDomains[]` entry does not apply here, because the refusal is a filesystem write and not a network host. Granting the write through a profile entry is not something this run may add or request.

## Source failures

| Gate / test (as the log names it) | Section | Class | Mapped to |
|---|---|---|---|
| `6a no machine paths` | test gate → gate 6 — self-containment | new this round (no earlier logs) | Finding 1 |
| `13a Python lint` | test gate → gate 13 — Python docs-retrieval service | new this round (no earlier logs) | `## Not fixable on this branch` |
| `13b Python typecheck` | test gate → gate 13 — Python docs-retrieval service | new this round (no earlier logs) | `## Not fixable on this branch` |
| `13c Python tests` | test gate → gate 13 — Python docs-retrieval service | new this round (no earlier logs) | `## Not fixable on this branch` |

The typecheck gate exited 0 and has no failures. Gates 13d and 14d were reported SKIPPED, and the log lists them under the gates this script cannot run. They are neither failures nor passes and yield no entry.
