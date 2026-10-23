# Code Review: fix_run_gates_background_run_handling

## Context

**Branch:** `fix_run_gates_background_run_handling`
**Date:** 2026-10-23
**Reviewed:** the whole branch diff against `defaultBranch` (`dev`). This checkout has no local `dev` ref, so the base is `origin/dev`. The diff covers 18 files:
- the detaching run form of `cli/templates/scripts/run-test-suite.sh` and its self-adopted copy `scripts/run-test-suite.sh`, which are byte-identical (Tasks 1 and 9);
- the reworked `cli/test/run-test-suite.test.mjs` (Task 2);
- the scripts README row (Task 3) and the `docs/watcher.md` row (Task 10);
- `### G.1 Run the gates` and the D.2 uncollected-gate-run clause in the plan core (Task 4), the `pending` bullet of the three supervised flows (Task 5), §2.5's three measured teardown cases (Task 6), the five autonomous forks' self-pause clause (Task 7), and the user-review fix core's D.2 clause with the improvement-observation duty (Task 8, with architecture-review Finding 1 applied);
- the BG1–BG10 block, F6 row and §6 entries in `docs/sandbox-verification.md` (Task 11).

24 run-artifact files were excluded from the reviewed diff.

**Headline.**
- The wire is kept: `pass` / `fail <log>` / `pending`, the exit map, `.running` / `.verdict` / `.log`, the label pattern and the log marker lines. The marker block in the script stays at lines 18–22 and `GATE_MARKER` in the test stays at lines 82–88, so the line citations in `docs/work-report-research/test-fix-plan-writer.md` still land.
- The watchdog kills by PID and enumerated descendants, not by process group (`cli/templates/scripts/autonomous-watcher.sh` → `check_stalled_runs`), so the story's claim that a detached worker survives the kill holds.
- Every flow that runs Phase G by reference now carries the detached-run bullet. No teardown or backgrounding claim of the old form is left in `plugin/`, `docs/` or `cli/templates/`. `unit_loop_core.md` point 6's citation of G.1's *"Forbidden here, by name"* still lands.
- The required test accompanies the wrapper change. Whether it passes is the Run gates phase's to establish, because this review runs no suite. Task 2's own record says one case failed in 1 of 3 sandboxed runs because of a template defect it handed back (Finding 1 and Question 1).
- `phases.parity` is `false`, so no parity cross-check was run.
- Pass 0: no regex sweep list is configured for this project, so only the caller check ran. The diff adds no exported symbol under `cli/src`, so it had nothing to check.
- Pass 2: the per-unit findings root `harness-runs/task_plan_point_reviews/fix_run_gates_background_run_handling_task_plan/` does not exist, so nothing was carried over.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 4** — Make the `heartbeat_loop` comment name the worker's fd 3, not the run form's _(layer: cli, general)_
2. [x] **Finding 1** — Record the no-signal heartbeat stall in the wrapper header's residuals and qualify ONE RUN PER LABEL _(layer: cli, general)_
3. [x] **Finding 2** — Assert in `run-test-suite.test.mjs` that the worker marker never reaches a gate _(layer: cli)_
4. [x] **Finding 3** — Stop listing WF4 as owed in `docs/sandbox-verification.md`'s headline and F5 row _(layer: general)_

---

## Must Fix

### 1. The wrapper header promises one run per label and watchdog survival, but this branch recorded a heartbeat that stops with no signal sent
→ [finding_1.md](fix_run_gates_background_run_handling_code_review/finding_1.md)

---

## Should Fix

### 2. No case asserts that the worker marker never reaches a gate, the risk the story index ranks second
→ [finding_2.md](fix_run_gates_background_run_handling_code_review/finding_2.md)

### 3. `docs/sandbox-verification.md` still lists WF4 as owed in its headline and its F5 row, though its own stamp says BG10 superseded it
→ [finding_3.md](fix_run_gates_background_run_handling_code_review/finding_3.md)

### 4. The `heartbeat_loop` comment still says the heartbeat reads the run form's fd 3
→ [finding_4.md](fix_run_gates_background_run_handling_code_review/finding_4.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

None: `phases.parity` is `false`, so there is no reference implementation to diverge from.
