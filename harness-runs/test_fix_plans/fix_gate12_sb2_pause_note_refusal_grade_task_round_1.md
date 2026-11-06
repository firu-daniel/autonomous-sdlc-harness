# Test Fix Plan: fix_gate12_sb2_pause_note_refusal_grade — task round 1

## Context

**Branch:** `fix_gate12_sb2_pause_note_refusal_grade`
**Test log:** `harness-runs/test_run_logs/fix_gate12_sb2_pause_note_refusal_grade/task_round_1.log` (round 1, no earlier logs)
**Summary:** The typecheck gate passed (exit 0). The test gate failed (exit 1) on run-gates gate 4 (`npm test`): one subtest in `cli/test/watcher-remote-job.test.mjs` failed, *"a reset 2 seconds ahead -> the run completes in the same job"*, and so did its parent *"usage: a short reset is waited out in the job, a reset past the deadline goes to the poller"*. The subtest's 2-second reset lead is too short to survive full-suite load.

Gate 13a/13b/13c (`BLOCKED`, the Python service environment is not provisioned) and gates 13d/14d (`SKIPPED`) are not failures: the log's own tally reads `run-gates: 1 failed, 24 passed` and names only `4 npm test`. No finding is written for them.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the fix loop.** The loop walks the `[ ]` entries below from top to bottom, and the committer flips each one to `[x]` when that fix's commit lands. Any `[ ]` marker outside this list, such as a sub-step bullet inside a per-finding file, is informational only. It is never the iteration source.

1. [x] **Finding 1** — Give the "reset … ahead -> completes in the same job" usage case the load-tolerant reset lead and PAUSE wait. _(layer: cli, general)_

---

## Must Fix

### 1. The single-run usage case's 2-second reset lead elapses under suite load, so the run never pauses
→ [finding_1.md](fix_gate12_sb2_pause_note_refusal_grade_task_round_1/finding_1.md)

---

## Not fixable on this branch

None.

---

## Source failures

- **Gate `test` (`commands.test`), exited 1** → Finding 1. Round 1, so there is no earlier log to classify it against. It is not a regression from this branch's own changes, which leave both `cli/test/watcher-remote-job.test.mjs` and the watcher scripts untouched.
  - **Run-gates gate 4: `FAIL  4 npm test (exit 1, 1916 s)`** → Finding 1. Round 1, no earlier log.
    - **`not ok 1576 - usage: a short reset is waited out in the job, a reset past the deadline goes to the poller`** (`failureType: 'subtestsFailed'`, `cli/test/watcher-remote-job.test.mjs:846:1`) → Finding 1. Round 1, no earlier log. It fails only because its subtest below failed.
    - **`not ok 1 - a reset 2 seconds ahead -> the run completes in the same job`** (`1 !== 2`, `cli/test/watcher-remote-job.test.mjs:861:14`) → Finding 1. Round 1, no earlier log.
- **Gate `typecheck` (`commands.typecheck`)**: exited 0. No failures.
