# Test Fix Plan: fix_registry_write_race — task round 1

## Context

**Branch:** `fix_registry_write_race`
**Test log:** `harness-runs/test_run_logs/fix_registry_write_race/task_round_1.log` (machine-local, uncommitted; every line this plan relies on is quoted in the per-finding files)
**Summary:** Gate 4 (`npm test`) failed with one failing case, *"a hung watcher case fails by name with a timeout and leaves no process behind"*, and two test files, `cli/test/docs-retrieval.test.mjs` and `cli/test/doctor.test.mjs`, reported `not ok` by file path and counted as cancelled. All three trace to the `--test-timeout` bounds this branch added in Task 6. Under Node 20.19.5 that timeout also bounds each test **file**, and the hung-watcher case's child gets only 30 seconds for its whole file.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The loop walks the `[ ]` entries below top to bottom, and only the committing role flips a marker to `[x]`. `[ ]` markers anywhere else, such as sub-step bullets inside the per-finding files, are informational only. Each entry resolves to one self-contained `finding_<K>.md` in `fix_registry_write_race_task_round_1/`.

Order: Finding 1 is the likely root cause of both file-level cancellations and comes first. Finding 2 is probably cleared by it, but it keeps its own entry and can be implemented alone. Finding 3 is a separate timer in one test file.

1. [ ] **Finding 1** — Raise the suite's `--test-timeout` above a whole test file's wall time, because Node 20.19.5 applies it per file (`docs-retrieval.test.mjs` cancelled). _(layer: cli, general)_
2. [ ] **Finding 2** — `doctor.test.mjs` cancelled by the same per-file `--test-timeout` expiry. _(layer: cli, general)_
3. [ ] **Finding 3** — Give the hung-watcher case's child `node --test` a file timeout its fixture setup cannot exhaust. _(layer: cli, general)_

---

## Must Fix

### 1. `--test-timeout=300000` cancels `cli/test/docs-retrieval.test.mjs` as a whole file
→ [finding_1.md](fix_registry_write_race_task_round_1/finding_1.md)

### 2. `--test-timeout=300000` cancels `cli/test/doctor.test.mjs` as a whole file
→ [finding_2.md](fix_registry_write_race_task_round_1/finding_2.md)

### 3. The hung-watcher case's child file timeout (30 s) can expire before the 2 s `runBash` bound
→ [finding_3.md](fix_registry_write_race_task_round_1/finding_3.md)

---

## Not fixable on this branch

None. Every failure has its cause in the tree.

---

## Source failures

The prompt named no earlier-round logs, so every failure is classed *first round (no earlier log to compare)*.

| Log line (rewritten per step 5) | Maps to | Class |
|---|---|---|
| `FAIL  4 npm test (exit 1)` (gate 4) | Findings 1, 2, 3 (the gate fails because of the three entries below) | first round |
| `not ok 5 - cli/test/docs-retrieval.test.mjs` | Finding 1 | first round |
| `not ok 6 - cli/test/doctor.test.mjs` | Finding 2 | first round |
| `not ok 260 - a hung watcher case fails by name with a timeout and leaves no process behind` | Finding 3 | first round |
