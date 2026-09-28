# Code Review: fix_gate_11_eval_local_build

## Context

**Branch:** `fix_gate_11_eval_local_build`
**Date:** 2026-09-29
**Reviewed:** the whole branch diff against `dev` (the configured `defaultBranch`). The diff has 9 files, +141 / -45:
- `cli/src/retrieval/runtime.ts` → the new `unresolvedRetrievalPeers()`, with `retrievalCliEntry()` now built on it, and its case (e) in `cli/test/retrieval-loading.test.mjs` (Task 1).
- `evals/docs-retrieval/index-build.mjs` → `assertRealModelsAreAvailable()`'s third refusal, which now checks the local peers instead of the runtime, plus `LOCAL_INSTALL_COMMAND` and the reworded "shipped server" header in `query-log-pass.mjs` (Task 2).
- `evals/docs-retrieval/check-floor.mjs` → `LOCAL_PEERS_ABSENT = 4` and `scripts/run-gates.sh`'s status-4 `BLOCKED` branch (Task 3).
- The gate 11 prose in `docs/development.md`, `docs/retrieval-eval.md` and `docs/cli.md` (Task 4).

7 run-artifact files excluded from the reviewed diff.

**Headline conclusions.**
- The defect is closed at its root. No caller of `assertRealModelsAreAvailable` loads the machine-wide runtime:
  - `buildIndex` and `measureColdBuild` import `cli/dist/retrieval/*`.
  - `runQueryLogPass` spawns `join(repoRoot, CLI_ENTRY)` with `CLI_ENTRY = 'cli/dist/cli.js'`.

  So the runtime check was removed because the evidence supports it, not by blanket deletion. `doctor`'s `retrieval-dependencies` (`cli/src/doctor/checks.ts` → `RETRIEVAL_DEPENDENCIES_CHECK`) still answers from `retrievalRuntimeState()` and is untouched, so gate 10's stale-runtime guard is not weakened.
- Status 4 is reachable. Nothing in `check-floor.mjs`'s static import graph imports a peer statically: `run.mjs` does not import `query-log-pass.mjs`, and `cli/dist` loads peers only through `loadRetrievalModule`. Task 3's recorded `peers-absent` probe exits `4` and names all five peers and `npm ci`.
- The recorded floors hold on the local build with the runtime deliberately at `0.3.0`: `mismatch` → `check-floor exit 0`, `met every recorded floor — 8 over 4 arms`. `floor.json` is untouched.
- The accompanying test is present: case (e) exercises the new predicate both under the refusing resolve hook and without it. Whether it passes is for the Run gates phase to establish, because this review runs no suite.
- The new `npm ci` command in `docs/development.md` sits in its own fenced block, as the lessons ledger requires. The recorded probe output in the task files carries no machine path.
- Parity is off (`phases.parity: false`), so no reference-implementation cross-check applies.
- Pass 0: the grep-sweep list has no regexes filled in. The exported-symbol caller check covered `unresolvedRetrievalPeers`, `LOCAL_INSTALL_COMMAND` and `LOCAL_PEERS_ABSENT`, and every one is wired. `LOCAL_PEERS_ABSENT` is read by value in `scripts/run-gates.sh`, the same way as the existing `MODEL_CACHE_ABSENT`.
- Pass 2: `harness-runs/task_plan_point_reviews/fix_gate_11_eval_local_build_task_plan/` does not exist, so there were no per-unit findings to reconcile.

No fixable finding survived review.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom, and the committing role flips each one to `[x]` when that fix's commit lands.

This review filed no fixable finding, so the list has no entries.

---

## Must Fix

_None._

---

## Should Fix

_None._

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section is empty.
