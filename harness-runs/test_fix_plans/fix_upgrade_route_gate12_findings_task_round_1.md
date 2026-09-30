# Test Fix Plan: fix_upgrade_route_gate12_findings — task round 1

## Context

**Branch:** `fix_upgrade_route_gate12_findings`
**Test log:** `harness-runs/test_run_logs/fix_upgrade_route_gate12_findings/task_round_1.log` (machine-local, uncommitted; every line this plan relies on is quoted in the per-finding file)
**Summary:** Only gate 6a (no machine paths) failed: the tracked task prompt `harness-runs/task_prompts/fix_upgrade_route_gate12_findings_task_prompt.md` names an absolute path under the running user's home directory on line 86; the other 19 gates passed.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The loop walks the `[ ]` entries below top to bottom, and only the committing role flips a marker to `[x]`. `[ ]` markers anywhere else, such as sub-step bullets inside the per-finding files, are informational only. Each entry resolves to one self-contained `finding_<K>.md` in `fix_upgrade_route_gate12_findings_task_round_1/`.

1. [ ] **Finding 1** — Replace the home-directory path in the task prompt's `## Evidence` list with a machine-neutral form. _(layer: general)_

---

## Must Fix

### 1. The task prompt names a machine path under the home directory
→ [finding_1.md](fix_upgrade_route_gate12_findings_task_round_1/finding_1.md)

---

## Not fixable on this branch

None. The only failure has its cause in the tree.

---

## Source failures

The prompt named no earlier-round logs, so every failure is classed *first round (no earlier log to compare)*.

| Log line (rewritten per step 5) | Maps to | Class |
|---|---|---|
| `FAIL  6a no machine paths (printed output, which is the finding)` (gate 6) | Finding 1 | first round |
