# Test Fix Plan: feat_converging_plan_reviews — task round 1

## Context

**Branch:** `feat_converging_plan_reviews`
**Test log:** `harness-runs/test_run_logs/feat_converging_plan_reviews/task_round_1.log` (no earlier-round logs)
**Summary:** The typecheck gate passed (`gate typecheck exited 0`). The test gate failed (`gate test exited 1`) on one test in its gate 4 `npm test` leg, `job: (1) a stall kill in a job sweeps its recorded leftovers before the reset, and the run resumes` in `cli/test/watcher-placeholder-host.test.mjs`. The other 3925 tests passed, and gate 13 (Python docs-retrieval service) reported BLOCKED because its environment is not provisioned.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the fix loop.** The loop walks the `[ ]` entries below top to bottom, and only the committing role flips a marker as that fix's commit lands. `[ ]` markers anywhere else, such as sub-step bullets inside a per-finding file, are informational only: they are never the iteration source.

Each entry resolves to the self-contained `feat_converging_plan_reviews_task_round_1/finding_<K>.md` through its `**Finding K**` reference.

1. [ ] **Finding 1** — Job-mode stall kill: the relaunched session leaves no registry snapshot, and the kill-time placeholder sweep removes nothing. _(layer: cli)_

---

## Must Fix

### 1. Job-mode stall kill: the relaunched session leaves no registry snapshot, and the kill-time placeholder sweep removes nothing
→ [finding_1.md](feat_converging_plan_reviews_task_round_1/finding_1.md)

---

## Not fixable on this branch

- **Gate 13a / 13b / 13c — Python docs-retrieval service (BLOCKED, not counted as failed).** Quoted: `BLOCKED 13a Python lint — uv or the synced Python environment is missing; run bash scripts/python-service.sh sync (0 s)` with `python-service: not provisioned: no synced environment at <home>/.cache/devscene-docs-retrieval/venvs/2653956599; run bash scripts/python-service.sh sync` (13b and 13c say the same). Reason: the cause lies outside the tree. The host has no synced Python environment, and an operator provides one by running `bash scripts/python-service.sh sync` outside the run. The log's own summary (`run-gates: 1 failed, 24 passed`) does not count it as a failure. 13d was `SKIPPED` (not opted in through `HARNESS_GATES_CONTAINERS=1`) and is neither a failure nor a finding.

---

## Source failures

- **Gate `typecheck` (`commands.typecheck`)**: exited 0, so no failures.
- **Gate `test` (`commands.test`)**: exited 1.
  - Gate 4 `npm test`: `not ok 1754 - job: (1) a stall kill in a job sweeps its recorded leftovers before the reset, and the run resumes` in `cli/test/watcher-placeholder-host.test.mjs` → **Finding 1**. Class: first round, with no earlier log to compare against.
  - Gate 13a / 13b / 13c: BLOCKED (environment not provisioned) → `## Not fixable on this branch`. Class: first round, with no earlier log to compare against.
