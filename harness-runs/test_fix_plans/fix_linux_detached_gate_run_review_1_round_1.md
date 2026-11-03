# Test Fix Plan: fix_linux_detached_gate_run — review_1 round 1

## Context

- **Branch:** `fix_linux_detached_gate_run`
- **Log:** `harness-runs/test_run_logs/fix_linux_detached_gate_run/review_1_round_1.log`
- **Summary:** the typecheck gate passed; the test gate failed on exactly one case, `not ok 351 - (g)(h) a started run is pending, collected by --wait, under the expected vector, and its placeholders swept` in `cli/test/launch-sandboxed-gates.test.mjs` (gate 4, `npm test`). Every other gate the runner ran passed.

The log also reports gate 13a–13c `BLOCKED` (the Python docs-retrieval environment is not synced on this host) and 13d / 14d `SKIPPED`. The runner counts none of them as failures (`run-gates: 1 failed, 24 passed`, failing list `- 4 npm test` only) and lists them under `== gates this script cannot run`, so this plan does not treat them as failures.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. Any `[ ]` markers elsewhere in this plan or its per-finding files are informational only.

1. [ ] **Finding 1** — `(g)(h)` launcher run test fails after the review-round launcher changes. _(layer: cli, general)_

## Must Fix

### 1. `(g)(h)` launcher run test fails after the review-round launcher changes
→ [finding_1.md](fix_linux_detached_gate_run_review_1_round_1/finding_1.md)

## Not fixable on this branch

None.

## Source failures

- `== run-test-suite.sh: gate test exited 1 ==` (gate `test`, `commands.test`) → **Finding 1**. Class: not classified against earlier rounds (the prompt named no earlier-round log).
- Gate 4 — `FAIL  4 npm test (exit 1)` → **Finding 1** (its only failing case is test 351). Class: not classified (no earlier-round log named).
- Test 351 — `not ok 351 - (g)(h) a started run is pending, collected by --wait, under the expected vector, and its placeholders swept` (`cli/test/launch-sandboxed-gates.test.mjs`) → **Finding 1**. Class: not classified (no earlier-round log named).
- Gate `typecheck` — exited 0; no failure.
