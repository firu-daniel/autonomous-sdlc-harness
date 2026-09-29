# Test Fix Plan: fix_remote_pause_state_and_gate12_record — task round 1

## Context

**Branch:** `fix_remote_pause_state_and_gate12_record`
**Test log:** `harness-runs/test_run_logs/fix_remote_pause_state_and_gate12_record/task_round_1.log`
**Summary:** Gate 4 (`npm test`) failed because `cli/test/workflow-templates.test.mjs` never finished and was cancelled at the 1800000 ms file timeout. A test's walk-back loop goes past the top of `harness-resume.yml` and never ends, because the new `# ACTION PINS.` header now names `actions/upload-artifact@v6` above every step. Every other gate passed, and 1014 of 1015 tests passed.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the fix loop.** The loop walks the `[ ]` entries below from top to bottom, and only the committing role flips an entry to `[x]`. `[ ]` markers anywhere else, including sub-step bullets inside the per-finding files, are informational only.

1. [x] **Finding 1** — Anchor the poller-upload test on the `uses:` line and bound its walk back to the step's `- name:`, so the `# ACTION PINS.` header line can no longer send it into an endless loop. _(layer: cli)_

---

## Must Fix

### 1. Poller-upload test loops forever once the ACTION PINS header names `actions/upload-artifact`
→ [finding_1.md](fix_remote_pause_state_and_gate12_record_task_round_1/finding_1.md)

---

## Not fixable on this branch

None. Every failure in the log is caused by code in the tree.

---

## Source failures

- **Gate 4 — `npm test` (exit 1)**, reported as `not ok 33 - cli/test/workflow-templates.test.mjs` (`testTimeoutFailure`, `cancelled 1`). Mapped to **Finding 1**. Class: *new this round* (no earlier-round log exists; this is round 1).
