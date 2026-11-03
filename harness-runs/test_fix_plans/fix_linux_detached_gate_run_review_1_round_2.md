# Test Fix Plan: fix_linux_detached_gate_run — review_1 round 2

## Context

- **Branch:** `fix_linux_detached_gate_run`
- **Log:** `harness-runs/test_run_logs/fix_linux_detached_gate_run/review_1_round_2.log` (earlier round: `harness-runs/test_run_logs/fix_linux_detached_gate_run/review_1_round_1.log`)
- **Summary:** the typecheck gate passed. The test gate failed on two cases in `cli/test/launch-sandboxed-gates.test.mjs`: `not ok 356 - (q) …` and `not ok 360 - (m) …`. Every other gate the runner ran passed.

**The code under test did not change between the two rounds.** Round 1 started right after `90d8bdd9` and round 2 right after `ac03c117`. `git diff --stat 90d8bdd9 ac03c117` lists only the round-1 test fix plan and its `finding_1.md`. On that same code, round 1 failed `(g)(h)` and passed `(q)` and `(m)`, and round 2 failed `(q)` and `(m)` and passed `(g)(h)`. All three cases launch the main checkout as the target and collect a `pass` through `--wait`. The round-1 plan established that `(g)(h)` passes when its file is run alone. So the failure is not tied to one case. It is load-dependent and moves between the cases that launch the detached supervisor. As in round 1, the gate log keeps only the `not ok` lines and the TAP tail, so it does not record which assertion failed. Finding 1 therefore also fixes that blind spot.

The log also reports gate 13a–13c as `BLOCKED` (the Python docs-retrieval environment is not synced on this host), and 13d and 14d as `SKIPPED`. The runner counts none of them as failures (`run-gates: 1 failed, 24 passed`, and the failing list is `- 4 npm test` only). This plan does not treat them as failures.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. Any `[ ]` markers elsewhere in this plan or its per-finding files are informational only.

1. [ ] **Finding 1** — `(q)` fails under full-suite load: the launcher's unscaled 30 s start window, and a gate log that drops the assertion. _(layer: cli, general)_
2. [ ] **Finding 2** — `(m)` fails under full-suite load, on the same launched-run path. _(layer: cli, general)_

## Must Fix

### 1. `(q)` fails under full-suite load: the launcher's unscaled 30 s start window, and a gate log that drops the assertion
→ [finding_1.md](fix_linux_detached_gate_run_review_1_round_2/finding_1.md)

### 2. `(m)` fails under full-suite load, on the same launched-run path
→ [finding_2.md](fix_linux_detached_gate_run_review_1_round_2/finding_2.md)

## Not fixable on this branch

None.

## Source failures

- Gate `typecheck` exited 0. No failure.
- `== run-test-suite.sh: gate test exited 1 ==` (gate `test`, `commands.test`), through gate 4, `FAIL  4 npm test (exit 1)`, with `# fail 2`:
  - Test 356: `not ok 356 - (q) job mode: the registry run_job leaves accepts the main checkout, a finished record elsewhere notwithstanding` (`cli/test/launch-sandboxed-gates.test.mjs`) → **Finding 1**. Class: **new this round**, not in `review_1_round_1.log`, where the same code passed it.
  - Test 360: `not ok 360 - (m) the vector pins Claude Code's built-in protected paths at the target's root, .claude read-only after every denyWrite entry` (`cli/test/launch-sandboxed-gates.test.mjs`) → **Finding 2**. Class: **new this round**, not in `review_1_round_1.log`, where the same code passed it.
- For the record, round 1's only failure, `not ok 351 - (g)(h) a started run is pending, collected by --wait, under the expected vector, and its placeholders swept`, is absent from this log: it passed this round on the same code.
