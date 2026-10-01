# Test Fix Plan: feat_forge_run_control — review_1 round 1

## Context

- **Branch:** `feat_forge_run_control`
- **Log:** `harness-runs/test_run_logs/feat_forge_run_control/review_1_round_1.log`
- **Summary:** One gate failed — gate 6a (no machine paths) — because three leftover, gitignored probe files under `harness-runs/scratch/` hard-code the checkout's absolute path; the other 19 gates passed.

## Phase 2 Readiness — Ordered Fix List

This list is the **single source of truth** for the fix loop. `[ ]` markers anywhere else in this plan or its per-finding files are informational only.

1. [x] **Finding 1** — Remove the leftover scratch probes that carry the checkout's absolute path. _(layer: general)_

## Must Fix

### 1. Remove the leftover scratch probes that carry the checkout's absolute path
→ [finding_1.md](feat_forge_run_control_review_1_round_1/finding_1.md)

## Not fixable on this branch

None.

## Source failures

| Failure (as the log names it) | Maps to | Class |
|---|---|---|
| gate 6 — `6a no machine paths` | Finding 1 | new this round (no earlier logs) |
