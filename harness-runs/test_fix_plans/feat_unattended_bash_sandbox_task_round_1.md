# Test Fix Plan: feat_unattended_bash_sandbox — task round 1

## Context

**Branch:** `feat_unattended_bash_sandbox`
**Test log:** `harness-runs/test_run_logs/feat_unattended_bash_sandbox/task_round_1.log`
**Summary:** The typecheck gate passed. The test gate exited 1 because one check failed: gate 6d, "plugin command spellings carry the prefix", flagged bare `/branch-…` command spellings in the `docs/work-report-research/` reports that arrived from `dev`. Gate 13a–13c were also reported BLOCKED because the host has not provisioned the Python environment, but those do not count toward the gate's failure.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the fix loop.** The loop walks the `[ ]` entries below from top to bottom, and the committing role flips each one to `[x]` when that fix's commit lands. `[ ]` markers anywhere else, such as sub-step bullets inside a per-finding file, are informational only.

1. [ ] **Finding 1** — Qualify the bare plugin command spellings in `docs/work-report-research/` with `/autonomous-sdlc-harness:`. _(layer: general)_

---

## Must Fix

### 1. Bare plugin command spellings in `docs/work-report-research/` fail gate 6d
→ [finding_1.md](feat_unattended_bash_sandbox_task_round_1/finding_1.md)

---

## Not fixable on this branch

These three checks are not counted as failures. The log's summary reads `run-gates: 1 failed, 24 passed`, and they did not cause the non-zero exit. They are listed here because the log reports them as not passing. The cause is on the host, outside the tree: the Python docs-retrieval environment has not been provisioned. Nothing on the branch can fix that, and provisioning (`bash scripts/python-service.sh sync`) is a host action for the user, not a code change.

- **13a Python lint**: `BLOCKED 13a Python lint — uv or the synced Python environment is missing; run bash scripts/python-service.sh sync` / `python-service: not provisioned: no synced environment at <home>/.cache/harness-docs-retrieval/venvs/1557832985; run bash scripts/python-service.sh sync`. Reason: host-level environment missing.
- **13b Python typecheck**: `BLOCKED 13b Python typecheck — uv or the synced Python environment is missing; run bash scripts/python-service.sh sync` (same `not provisioned` line as 13a). Reason: host-level environment missing.
- **13c Python tests**: `BLOCKED 13c Python tests — uv or the synced Python environment is missing; run bash scripts/python-service.sh sync` (same `not provisioned` line as 13a). Reason: host-level environment missing.

`13d Python container tests` was reported `SKIPPED` because it was not opted in with `HARNESS_GATES_CONTAINERS=1`. That is neither a failure nor a pass, so it yields no entry.

---

## Source failures

**Gate typecheck (`commands.typecheck`)**: exited 0. No failures.

**Gate test (`commands.test`)**: exited 1.

- `6d plugin command spellings carry the prefix` (FAIL, exit 1). 25 `check-command-spelling` lines in the log, plus a 26th, `docs/work-report-research/README.md:122`, that the gate's `tail -25` cut off. → **Finding 1**. Class: first round, no earlier log.
- `13a Python lint` (BLOCKED) → `## Not fixable on this branch`. Class: first round, no earlier log.
- `13b Python typecheck` (BLOCKED) → `## Not fixable on this branch`. Class: first round, no earlier log.
- `13c Python tests` (BLOCKED) → `## Not fixable on this branch`. Class: first round, no earlier log.
