# Test Fix Plan: fix_linux_detached_gate_run — review_1 round 3

## Context

- **Branch:** `fix_linux_detached_gate_run`
- **Log:** `harness-runs/test_run_logs/fix_linux_detached_gate_run/review_1_round_3.log`. Earlier rounds: `harness-runs/test_run_logs/fix_linux_detached_gate_run/review_1_round_1.log` and `harness-runs/test_run_logs/fix_linux_detached_gate_run/review_1_round_2.log`.
- **Summary:** the typecheck gate passed. The test gate failed on one case, `not ok 359 - (l) …` in `cli/test/launch-sandboxed-gates.test.mjs`. Its `--wait` collector was refused with `'…/scripts' is not inside a git repository`. Every other gate the runner ran passed.

This is the first round whose log carries the failing assertion, through the `gate()` excerpt that round 2's Finding 1 added to `scripts/run-gates.sh`. That excerpt shows the failure is not the round-2 timeout. The `bwrap` stub turns the fixture's `scripts/.git` placeholder into an empty regular file after the gate command exits. The test's unsandboxed `--wait` reads that file before the supervisor sweeps it. The four cases that failed across the three rounds, `(g)(h)`, `(q)`, `(l)` and `(m)`, are exactly the cases that launch the main checkout and so carry that placeholder.

The log also reports gates 13a–13c as `BLOCKED`, because the Python docs-retrieval environment is not synced on this host, and 13d and 14d as `SKIPPED`. The runner counts none of them as a failure (`run-gates: 1 failed, 24 passed`, and its failing list is only `- 4 npm test`), so this plan does not treat them as failures.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. Any `[ ]` markers elsewhere in this plan or its per-finding files are informational only.

1. [ ] **Finding 1** — `(l)` fails because the `bwrap` stub leaves a 0-byte `scripts/.git` that the unsandboxed `--wait` collector reads before the sweep. _(layer: cli)_

## Must Fix

### 1. `(l)` fails because the `bwrap` stub leaves a 0-byte `scripts/.git`, and the unsandboxed `--wait` collector reads it before the supervisor sweeps it
→ [finding_1.md](fix_linux_detached_gate_run_review_1_round_3/finding_1.md)

## Not fixable on this branch

None.

## Source failures

- Gate `typecheck` (`commands.typecheck`) exited 0, so there is no failure.
- Gate `test` (`commands.test`) exited 1 (`== run-test-suite.sh: gate test exited 1 ==`). The failure came through gate 4, `FAIL  4 npm test (exit 1)`, with `# fail 1`:
  - Test 359, `not ok 359 - (l) the vector binds the target's .git read-only after every denyWrite entry, closing the omit trio` (`cli/test/launch-sandboxed-gates.test.mjs`), maps to **Finding 1**. Class: **new this round**. It is absent from both `review_1_round_1.log` and `review_1_round_2.log`. Finding 1's diagnosis connects it to round 1's `(g)(h)` and round 2's `(q)` and `(m)`, which are absent from this log.
