# Code Review: fix_linux_detached_gate_run

## Context

**Branch:** `fix_linux_detached_gate_run`
**Date:** 2026-11-03
**Reviewed:** the whole branch diff against `dev`, resolved to `origin/dev` because this run copy has no local `dev` (merge base `408c70b1`). That is 52 files across the `cli`, `plugin` and `general` layers:

- **`cli`:** the new gate launcher template `launch-sandboxed-gates.sh` and its `OUTER_LOOP_SCRIPTS` row; `run-test-suite.sh`'s `--no-detach` form; the run library's Run gates lane owner (`HR_TEST_RUN_*`, `hr_test_run_lane_dir`, `hr_heartbeat_age`), `hr_json_single_object` and `hr_placeholder_sweep_paths_var`; the doctor consequence sentence; the profile `_README`; and the new and changed suites.
- **`plugin`:** the `<gate_launcher>` binding in both Phase G cores and all four forks, with G.1 step 2's branch.
- **`general`:** this checkout's root copies, the probe's `gate-sandbox` leg and the PD25–PD28 fixes, the documents of record, and the notes-app re-render.

34 run-artifact files excluded from the reviewed diff.

**Headline.**

- **The cores and forks.** The plugin cores name only the binding. Every fork over a Phase G core binds it inline, and the autonomous binding's `<MAIN_REPO>` anchor (`## Override B — global kill switch` → **Path:**) resolves in both autonomous forks.
- **The copies.** `scripts/launch-sandboxed-gates.sh`, `scripts/run-test-suite.sh`, `scripts/lib/harness-run-lib.sh` and `scripts/autonomous-watcher.sh` are byte-identical to their templates.
- **The new symbols.** Every new library function and probe function has a caller outside its defining file.
- **The architecture review's two findings** are applied.
- **Tests.** Every accompanying test the conventions documents require is present: `cli/test/launch-sandboxed-gates.test.mjs`, `cli/test/run-gates-lane-lib.test.mjs`, the `--no-detach` cases in `cli/test/run-test-suite.test.mjs`, `cli/test/sandbox-probe-gate-sandbox-legs.test.mjs` and the PD25–PD28 fixtures. Whether they pass is the Run gates phase's to establish; this review runs no suite.
- **Measurements.** No measured result is invented: every GS row, and T3's and WF5's Linux re-takes, read *not yet measured* or owed.
- **Parity.** `phases.parity` is `false`, so no parity cross-check applies.

Two findings remain, both Must Fix. A durable citation of the ruling points at a gitignored file. The gate worker can also write the run copy's `.git` trio, a route the session's own sandbox did not open. The branch relies on downstream trust checks for that route, which `harness-runs/lessons.md` → `## Trust checks` forbids, and the launcher's header and residual 13 overstate what the worker sandbox holds.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Cite `docs/sandbox-verification.md` §5 F10 instead of the gitignored clarification file in the launcher, the probe leg and the two documents _(layer: cli, general)_
2. [ ] **Finding 2** — Bind the target's `.git` read-only in the gate worker's `bwrap` vector to close the `.git` trio, with its test and the header and residual 13 updates _(layer: cli, general)_

---

## Must Fix

### 1. Five durable files cite the ruling at a gitignored clarification path that no reader can open
→ [finding_1.md](fix_linux_detached_gate_run_code_review/finding_1.md)

### 2. The gate worker can write the run copy's `.git` trio, a route the session's own sandbox did not open, and the branch relies on downstream checks instead of closing it
→ [finding_2.md](fix_linux_detached_gate_run_code_review/finding_2.md)

---

## Should Fix

None.

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

None: `phases.parity` is `false`, so there is no reference implementation to diverge from.
