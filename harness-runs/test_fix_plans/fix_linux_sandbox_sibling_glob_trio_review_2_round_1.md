# Test Fix Plan: fix_linux_sandbox_sibling_glob_trio — review_2 round 1

## Context

**Branch:** `fix_linux_sandbox_sibling_glob_trio`
**Test log:** `harness-runs/test_run_logs/fix_linux_sandbox_sibling_glob_trio/review_2_round_1.log`
**Summary:** The typecheck gate passed and the test gate failed on exactly one check — gate 6f (`scripts/check-typos.sh`), which flags the word `unparseable` in `plugin/hooks/README.md`, introduced on this branch by commit `e096dbb6`.

The log also reports gates 13a, 13b and 13c as `BLOCKED` (the Python docs-retrieval environment is not provisioned on this host) and gates 13d and 14d as `SKIPPED` (no container opt-in; `zizmor 1.30.1` unavailable). `run-gates` counts none of these as failures (`run-gates: 1 failed, 24 passed`) and lists them under "gates this script cannot run", so they yield no finding and no `## Not fixable on this branch` entry.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top-to-bottom; the committing role flips each one to `[x]` as that fix's commit lands. `[ ]` markers anywhere else (e.g., sub-step bullets inside the per-finding files) are informational only — they are never the iteration source.

Each entry resolves to a self-contained `harness-runs/test_fix_plans/fix_linux_sandbox_sibling_glob_trio_review_2_round_1/finding_<K>.md` file via its `**Finding K**` reference. Sorted lowest blast-radius first.

1. [x] **Finding 1** — Respell `unparseable` as `unparsable` in `plugin/hooks/README.md` so gate 6f's typos check passes. _(layer: plugin)_

---

## Must Fix

### 1. `plugin/hooks/README.md` spells "unparseable", which gate 6f's typos check flags
→ [finding_1.md](fix_linux_sandbox_sibling_glob_trio_review_2_round_1/finding_1.md)

---

## Not fixable on this branch

None.

---

## Source failures

- **Gate typecheck (`commands.typecheck`)** — exited 0; no failures.
- **Gate test (`commands.test`)** — exited 1:
  - `6f shipped files pass typos` — `check-typos: plugin/hooks/README.md — unparseable` → **Finding 1**. Class: first round, no earlier-round log to compare against (introduced by this branch's commit `e096dbb6`).
