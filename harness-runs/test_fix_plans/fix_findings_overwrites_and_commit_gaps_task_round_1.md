# Test Fix Plan: fix_findings_overwrites_and_commit_gaps — task round 1

## Context

**Branch:** `fix_findings_overwrites_and_commit_gaps`
**Test log:** `harness-runs/test_run_logs/fix_findings_overwrites_and_commit_gaps/task_round_1.log`
**Summary:** The typecheck gate passed. The test gate failed on one check only: gate 6d, `plugin command spellings carry the prefix`. `scripts/check-command-spelling.sh` reported 25 bare plugin-command spellings across 11 files under `docs/work-report-research/`. That research folder (#98) and the 6d check (#7) both reached this branch from `main`, and together they fail.

Gate 13a–13c were reported `BLOCKED` because the Python environment was not provisioned on this host, and 13d was reported `SKIPPED` because it was not opted in. `run-gates` counts neither as a failure (`run-gates: 1 failed, 24 passed`), so neither produces a finding.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the fix loop.** The loop walks the `[ ]` entries below from top to bottom, and only the committing role flips an entry to `[x]`. `[ ]` markers anywhere else, such as sub-step bullets inside a per-finding file, are informational only. They never drive the loop.

Each entry resolves to a self-contained `harness-runs/test_fix_plans/fix_findings_overwrites_and_commit_gaps_task_round_1/finding_<K>.md` through its `**Finding K**` reference. Entries are sorted lowest blast-radius first.

1. [ ] **Finding 1** — Qualify the 25 bare `/branch-*` command spellings in `docs/work-report-research/` as `/autonomous-sdlc-harness:<name>`. _(layer: general)_

---

## Must Fix

### 1. Bare plugin-command spellings in `docs/work-report-research/` fail gate 6d
→ [finding_1.md](fix_findings_overwrites_and_commit_gaps_task_round_1/finding_1.md)

---

## Not fixable on this branch

None.

---

## Source failures

**Typecheck gate (`commands.typecheck`):** exited 0, so it has no failures.

**Test gate (`commands.test`):** exited 1.

- `6d plugin command spellings carry the prefix (exit 1)`, with its 25 `check-command-spelling: docs/work-report-research/…: bare command spelling` lines → **Finding 1**. Class: first round. There is no earlier log to compare against.
