# Test Fix Plan: fix_registry_write_race — task round 2

## Context

**Branch:** `fix_registry_write_race`
**Test log:** `harness-runs/test_run_logs/fix_registry_write_race/task_round_2.log`. The log is machine-local and uncommitted. Every line this plan relies on is quoted in the per-finding file.
**Summary:** Gate 4 (`npm test`) failed on one case, *"a hung watcher case fails by name with a timeout and leaves no process behind"* (`cli/test/test-timeout.test.mjs`). The case already failed in round 1, and round 1's timeout fix did not clear it. The cause is the environment the case passes to its nested `node --test`: it includes the test runner's own `NODE_TEST_CONTEXT` marker, so the nested runner never prints the TAP line the case asserts on. Every other gate passed.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The loop walks the `[ ]` entries below from top to bottom. Only the committing role flips a marker to `[x]`. `[ ]` markers anywhere else, such as sub-step bullets inside the per-finding files, are informational only. Each entry resolves to one self-contained `finding_<K>.md` in `fix_registry_write_race_task_round_2/`.

1. [ ] **Finding 1** — Strip `NODE_TEST_CONTEXT` from the hung-watcher case's nested `node --test` environment, so the child prints TAP that names its case. _(layer: cli)_

---

## Must Fix

### 1. The hung-watcher case passes the runner's `NODE_TEST_CONTEXT` into its nested `node --test`, so the child never prints TAP naming its case
→ [finding_1.md](fix_registry_write_race_task_round_2/finding_1.md)

---

## Not fixable on this branch

None. The one failure has its cause in the tree.

---

## Source failures

Classified against `harness-runs/test_run_logs/fix_registry_write_race/task_round_1.log`.

| Log line (rewritten per step 5) | Maps to | Class |
|---|---|---|
| `FAIL  4 npm test (exit 1)` (gate 4) | Finding 1 (the gate fails only because of the entry below) | persisting |
| `not ok 266 - a hung watcher case fails by name with a timeout and leaves no process behind` | Finding 1 | persisting (round 1: `not ok 260`, same case) |
