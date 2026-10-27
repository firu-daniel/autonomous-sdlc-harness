# Test Fix Plan: fix_sandbox_probe_round1_findings — task round 1

## Context

**Branch:** `fix_sandbox_probe_round1_findings`
**Test log:** `harness-runs/test_run_logs/fix_sandbox_probe_round1_findings/task_round_1.log`
**Summary:** The typecheck gate passed and the test gate failed on one test only, the top-level `sp__wp_tracked: one tracked file, and nothing on stderr however long the list is` in `cli/test/sandbox-probe-protection-legs.test.mjs` (gate 4, `npm test`: 2549 pass, 1 fail, 0 cancelled). Gate 13's three `BLOCKED` lines (13a–13c, an unprovisioned Python environment) and the `SKIPPED` 13d and 14d are not failing gates — `run-gates: 1 failed, 24 passed` counts only gate 4 — and yield no finding.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the fix loop.** The loop walks the `[ ]` entries below top-to-bottom; only the committing role flips a marker. `[ ]` markers anywhere else (sub-step bullets inside the per-finding files) are informational only — never the iteration source.

1. [ ] **Finding 1** — Stop the 10,000-object seed commit in the `sp__wp_tracked` test from starting a detached auto-gc that races the case directory's teardown. _(layer: cli)_

---

## Must Fix

### 1. `sp__wp_tracked` test fails in its own setup or teardown, not in an assertion
→ [finding_1.md](fix_sandbox_probe_round1_findings_task_round_1/finding_1.md)

---

## Not fixable on this branch

None.

---

## Source failures

- **Gate `typecheck`** (`commands.typecheck`) — exited 0; no failure.
- **Gate `test`** (`commands.test`) — exited 1, through run-gates gate `4 npm test (exit 1)`:
  - `not ok 1093 - sp__wp_tracked: one tracked file, and nothing on stderr however long the list is` (`cli/test/sandbox-probe-protection-legs.test.mjs`) → **Finding 1**. Class: *new this round* — round 1, no earlier-round log to compare against.
