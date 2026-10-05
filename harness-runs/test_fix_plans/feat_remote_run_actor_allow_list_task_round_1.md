# Test Fix Plan: feat_remote_run_actor_allow_list — task round 1

## Context

**Branch:** `feat_remote_run_actor_allow_list`
**Test log:** `harness-runs/test_run_logs/feat_remote_run_actor_allow_list/task_round_1.log`
**Summary:** Gate 4 (`npm test`) failed on one `cli/test/init.test.mjs` subtest whose blanket "no `gh variable set`" assertion now contradicts this branch's intended `HARNESS_RUN_ACTORS` step in the `--upgrade-workflows` report; gate 13a–c were BLOCKED by an unprovisioned Python environment on the host.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the fix loop.** The loop walks the `[ ]` entries below top-to-bottom, and only the committing role flips a marker to `[x]`. `[ ]` markers anywhere else (such as sub-step bullets inside a per-finding file) are informational only.

1. [x] **Finding 1** — Narrow the upgrade-report test's forbidden `gh variable set` to the first-setup variables and pin the `HARNESS_RUN_ACTORS` step. _(layer: cli)_

---

## Must Fix

### 1. The upgrade-report test still forbids every `gh variable set`, but the upgrade now prints the `HARNESS_RUN_ACTORS` one by design
→ [finding_1.md](feat_remote_run_actor_allow_list_task_round_1/finding_1.md)

---

## Not fixable on this branch

- **Gate 13a Python lint, 13b Python typecheck, 13c Python tests — BLOCKED.**
  ```
    BLOCKED 13a Python lint — uv or the synced Python environment is missing; run bash scripts/python-service.sh sync
          python-service: not provisioned: no synced environment at <home>/.cache/harness-docs-retrieval/venvs/3947513543; run bash scripts/python-service.sh sync
  ```
  (13b and 13c report the same line.) The cause is a host-level resource: the Python docs-retrieval service's environment under the user's cache directory has not been provisioned on this machine. Nothing in the tree is wrong, and the branch does not touch the Python service. Gate 13d was SKIPPED (not opted in), which is not a failure.

---

## Source failures

| Failing gate or test (as the log reports it) | Class | Mapped to |
|---|---|---|
| Gate 4 `npm test` (exit 1) | new this round (no earlier log) | Finding 1 |
| `not ok 3 - an upgrade prints its own commit-and-push steps and the in-flight sentence, not the first-setup block` | new this round (no earlier log) | Finding 1 |
| `not ok 117 - init --upgrade-workflows re-pins an older workflow after a .bak, and nothing else does` (parent of `not ok 3`) | new this round (no earlier log) | Finding 1 |
| `not ok 140 - init` (suite containing `not ok 117`) | new this round (no earlier log) | Finding 1 |
| Gate 13a Python lint — BLOCKED | new this round (no earlier log) | `## Not fixable on this branch` |
| Gate 13b Python typecheck — BLOCKED | new this round (no earlier log) | `## Not fixable on this branch` |
| Gate 13c Python tests — BLOCKED | new this round (no earlier log) | `## Not fixable on this branch` |
