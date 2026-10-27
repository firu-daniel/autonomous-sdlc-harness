# Test Fix Plan: fix_sandbox_probe_round1_findings — task round 2

## Context

**Branch:** `fix_sandbox_probe_round1_findings`
**Test log:** `harness-runs/test_run_logs/fix_sandbox_probe_round1_findings/task_round_2.log`
**Earlier logs:** `harness-runs/test_run_logs/fix_sandbox_probe_round1_findings/task_round_1.log`
**Summary:** The typecheck gate passed and the test gate failed on one test, the same one as in round 1: the top-level `sp__wp_tracked: one tracked file, and nothing on stderr however long the list is` in `cli/test/sandbox-probe-protection-legs.test.mjs` (gate 4, `npm test`: 2549 pass, 1 fail, 0 cancelled). It persists because round 1's prescribed fix was closed as already passing on an isolated run and never landed. Gate 13's three `BLOCKED` lines (13a to 13c, an unprovisioned Python environment) and the `SKIPPED` 13d and 14d are not failing gates (`run-gates: 1 failed, 24 passed` counts only gate 4), so they yield no finding.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the fix loop.** The loop walks the `[ ]` entries below from top to bottom, and only the committing role flips a marker. `[ ]` markers anywhere else, such as the sub-step bullets inside the per-finding files, are informational only and never the iteration source.

1. [ ] **Finding 1** — Disable auto-gc in the `sp__wp_tracked` seed clone and make the case teardown retry. _(layer: cli)_

---

## Must Fix

### 1. `sp__wp_tracked` test still fails in its own setup or teardown: the round-1 fix was never applied
→ [finding_1.md](fix_sandbox_probe_round1_findings_task_round_2/finding_1.md)

---

## Not fixable on this branch

None.

---

## Source failures

- **Gate `typecheck`** (`commands.typecheck`): exited 0, no failure.
- **Gate `test`** (`commands.test`): exited 1, through run-gates gate `4 npm test (exit 1)`:
  - `not ok 1093 - sp__wp_tracked: one tracked file, and nothing on stderr however long the list is` (`cli/test/sandbox-probe-protection-legs.test.mjs`) → **Finding 1**. Class: *persisting*. It is the same test at the same TAP number in `task_round_1.log`.
