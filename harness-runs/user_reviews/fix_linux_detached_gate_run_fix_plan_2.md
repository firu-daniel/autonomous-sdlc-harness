# User-Review Fix Plan: fix_linux_detached_gate_run

## Context

**Branch:** `fix_linux_detached_gate_run`
**Source user review:** `harness-runs/user_reviews/fix_linux_detached_gate_run_review_2.md` (round 2)
**Summary:** The user flagged two things. First, round 1's move of the gate launcher onto the registry's `run_profile` field left the sandbox probe's own launcher legs (T3 and `gate-sandbox`) without that field, because the probe renders profiles through `sp__render`, not `spawn_engine`. Second, the launcher's root copy is committed without its executable bit. Both observations were verified in the current tree and are valid.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. `[ ]` markers anywhere else, such as sub-step bullets inside the per-finding files, are informational only, and the committer never touches them.

Each entry resolves to `harness-runs/user_reviews/fix_linux_detached_gate_run_fix_plan_2/finding_<K>.md` through its `**Finding K**` reference. The list runs from the lowest blast radius to the widest. Finding 2 is a mode-only change to one file. Finding 1 changes the probe's render, its teardown note and a document of record, and adds fixtures.

1. [x] **Finding 2** — Commit `scripts/launch-sandboxed-gates.sh` as `100755`, like the other rendered wrappers in `scripts/`. _(layer: general)_
2. [x] **Finding 1** — `sp__render` records the rendered per-run profile as the clone record's `run_profile`, as `spawn_engine` does. Teardown's record drop removes it. Add fixtures for the record, the launcher's acceptance and the job-mode arm. _(layer: cli, general)_

---

## Must Fix

### 1. The probe's launcher legs never record the per-run profile in the registry
→ [finding_1.md](fix_linux_detached_gate_run_fix_plan_2/finding_1.md)

---

## Should Fix

_None._

---

## Nice to Have

### 2. `scripts/launch-sandboxed-gates.sh` is committed `100644`
→ [finding_2.md](fix_linux_detached_gate_run_fix_plan_2/finding_2.md)

---

## Out of scope / verified-OK

_None._ Every observation was verified against the current working tree and is valid.

One part of observation 1 needs no code change: *"Confirm the job-mode arm is not refused by the `wrappers` leg's control-clone record."* That was confirmed by reading the tree. The control clone's record carries no `status`, and `hr_registry_foreign_copy_var` counts only `running`, `parked`, `park_loop` and `paused` records as live. Finding 1 step 4 records the reasoning, and fixture (d) pins it.

---

## Source observations

This is a verbatim copy of `harness-runs/user_reviews/fix_linux_detached_gate_run_review_2.md`. **This section stays in the index.**

1. **The probe's launcher legs never record the per-run profile in the registry.** Must fix. `launch-sandboxed-gates.sh` now reads `run_profile` from the run's registry record, which only `spawn_engine` writes. `sp__render` never writes it, so T3 (`legs-local.sh`) and the `gate-sandbox` leg would get the launcher's refusal and print `not run`. Record the rendered profile in the probe clone's record as `spawn_engine` does, remove it at teardown, and add fixtures showing the launcher call is not refused for a missing record. Confirm the job-mode arm is not refused by the `wrappers` leg's control-clone record.

2. **`scripts/launch-sandboxed-gates.sh` is committed `100644`.** Nice to have. The other rendered wrappers in `scripts/` are `100755`.
