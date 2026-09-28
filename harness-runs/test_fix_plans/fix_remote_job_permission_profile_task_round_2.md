# Test Fix Plan: fix_remote_job_permission_profile — task round 2

## Context

- **Branch:** `fix_remote_job_permission_profile`
- **Log:** `harness-runs/test_run_logs/fix_remote_job_permission_profile/task_round_2.log` (earlier: `task_round_1.log`)
- **Summary:** gates 4 and 6a now pass. Only gate 11 (docs-retrieval relevance floor) fails. It refuses before loading anything because this machine's installed retrieval runtime is an older harness version than the checkout's own `cli/package.json`.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. `[ ]` markers anywhere else are informational only.

_No fixable failures this round. The only failure is listed under `## Not fixable on this branch`._

## Must Fix

_None._

## Not fixable on this branch

### Gate 11 — docs-retrieval relevance floor

Log (paths rewritten):

```
  FAIL  11 docs-retrieval relevance floor (exit 1)
        file://evals/docs-retrieval/index-build.mjs:54
        Error: eval: the retrieval runtime is not installed, so the optional peers cannot be loaded; missing: autonomous-sdlc-harness. Run the harness's retrieval setup to install them
            at assertRealModelsAreAvailable (evals/docs-retrieval/index-build.mjs:54:11)
```

**Reason:** the problem is on this machine, not in the tree. `assertRealModelsAreAvailable` in `evals/docs-retrieval/index-build.mjs` calls `retrievalRuntimeState()` in `cli/src/retrieval/runtime.ts`. That function adds the package's own name to `missing` if `node_modules/autonomous-sdlc-harness/dist/cli.js` is absent under the runtime directory. It also adds it if the installed CLI's `package.json` version differs from this package's own version (`version !== ownManifestString('version')`). The runtime directory is `${XDG_CACHE_HOME:-$HOME/.cache}/autonomous-sdlc-harness/retrieval/runtime`. On this machine, `<home>/.cache/autonomous-sdlc-harness/retrieval/runtime/node_modules/autonomous-sdlc-harness/package.json` records version `0.2.0`, while the checkout's `cli/package.json` is at `0.4.0` (the version bump on `main`, "chore: bump version to 0.4.0 (#35)"). The version-match refusal is intended behaviour. The fix is to re-run the harness's retrieval setup on this host so the runtime is reinstalled at `0.4.0`. That is a host-level install, and it needs a network connection. Nothing on the branch can make it pass without weakening a check that exists on purpose.

## Source failures

| Failure in the log | Maps to | Class vs round 1 |
|---|---|---|
| Gate 11 — docs-retrieval relevance floor | `## Not fixable on this branch` | persisting (same error, same line, in round 1) |

Round 1's gate 4 (`npm test`) and gate 6a (`no machine paths`) failures pass in round 2 and are not carried forward.
