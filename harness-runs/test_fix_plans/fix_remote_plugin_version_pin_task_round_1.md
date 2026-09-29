# Test Fix Plan: fix_remote_plugin_version_pin — task round 1

## Context

**Branch:** `fix_remote_plugin_version_pin`
**Test log:** `harness-runs/test_run_logs/fix_remote_plugin_version_pin/task_round_1.log`
**Summary:** One gate failed out of 20 — gate 6a (no machine paths) printed a single hit, a leftover gitignored scratch probe `harness-runs/scratch/t1_probe.mjs` that hardcodes this checkout's absolute path; every other gate passed.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the fix loop.** The loop walks the `[ ]` entries below top-to-bottom, and only the committing role flips a marker to `[x]`. `[ ]` markers anywhere else (e.g. sub-step bullets inside a per-finding file) are informational only.

1. [ ] **Finding 1** — Delete the leftover scratch probe `harness-runs/scratch/t1_probe.mjs` that carries this checkout's absolute path. _(layer: general)_

---

## Must Fix

### 1. Leftover scratch probe carries the checkout's absolute path and trips gate 6a
→ [finding_1.md](fix_remote_plugin_version_pin_task_round_1/finding_1.md)

---

## Not fixable on this branch

None.

---

## Source failures

- **Gate 6a — no machine paths** (`FAIL  6a no machine paths`, hit in `./harness-runs/scratch/t1_probe.mjs:4`) → Finding 1. Class: first round, no earlier log to compare against.
