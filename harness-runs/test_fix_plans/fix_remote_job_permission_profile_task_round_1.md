# Test Fix Plan: fix_remote_job_permission_profile — task round 1

## Context

**Branch:** `fix_remote_job_permission_profile`
**Test log:** `harness-runs/test_run_logs/fix_remote_job_permission_profile/task_round_1.log` (machine-local, uncommitted; everything needed is quoted in the finding files)
**Summary:** Three of twenty gates failed: gate 4 (`npm test`, 2 of 1007 tests failing, neither named in the log's 25-line tail), gate 6a (a committed task prompt carries this machine's home-directory path), and gate 11 (the docs-retrieval runtime is not installed on this host).

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The loop walks the `[ ]` entries below top-to-bottom; only the committing role flips an entry to `[x]`. `[ ]` markers anywhere else, including sub-step bullets inside the per-finding files, are informational only and never an iteration target.

Each entry resolves to a self-contained `fix_remote_job_permission_profile_task_round_1/finding_<K>.md` file via its `**Finding K**` reference. Sorted lowest blast-radius first.

1. [x] **Finding 1** — Replace the home-directory path quoted in the branch's task prompt with a `<home>` placeholder. _(layer: general)_
2. [x] **Finding 2** — Make gate 4's log name its failing tests; the two `npm test` failures are named and fixed from the next round's log. _(layer: general)_

---

## Must Fix

### 1. Task prompt quotes this machine's home-directory path (gate 6a)
→ [finding_1.md](fix_remote_job_permission_profile_task_round_1/finding_1.md)

### 2. `npm test` fails 2 of 1007 tests, unnamed in the gate log (gate 4)
→ [finding_2.md](fix_remote_job_permission_profile_task_round_1/finding_2.md)

---

## Not fixable on this branch

- **Gate 11 — docs-retrieval relevance floor.** Quoted from the log:

  ```
  FAIL  11 docs-retrieval relevance floor (exit 1)
  Error: eval: the retrieval runtime is not installed, so the optional peers cannot be loaded; missing: autonomous-sdlc-harness. Run the harness's retrieval setup to install them
      at assertRealModelsAreAvailable (evals/docs-retrieval/index-build.mjs:54:11)
  ```

  **Reason:** `evals/docs-retrieval/index-build.mjs` → `assertRealModelsAreAvailable` refuses because `cli/src/retrieval/runtime.ts` → `retrievalRuntimeState` finds no runtime copy of the CLI at this package's version under the machine cache (`retrievalRuntimeDir()`, under `machineCacheDir()`, outside the tree). The model cache check before it passed, so the host has the models but not the installed runtime. That is host-level state an operator provisions with the harness's retrieval setup; the branch touches neither `cli/src/retrieval/` nor `evals/`, and nothing in the tree can install the runtime.

---

## Source failures

| # | Failing gate / test (as the log names it) | Class | Mapped to |
|---|---|---|---|
| 1 | Gate 4 — `4 npm test (exit 1)`: `# fail 2` of `# tests 1007`; the two failing tests are not named in the log | new this round (no earlier round) | Finding 2 |
| 2 | Gate 6a — `6a no machine paths`, hit in `harness-runs/task_prompts/fix_remote_job_permission_profile_task_prompt.md:21` | new this round (no earlier round) | Finding 1 |
| 3 | Gate 11 — `11 docs-retrieval relevance floor (exit 1)` | new this round (no earlier round) | `## Not fixable on this branch` |
