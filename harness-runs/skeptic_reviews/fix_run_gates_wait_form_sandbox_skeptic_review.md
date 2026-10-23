# Skeptic Review: fix_run_gates_wait_form_sandbox

## Context

**Branch:** `fix_run_gates_wait_form_sandbox`
**Date:** 2026-10-23
**Reviewed:** the whole branch diff against the default branch `dev`. No local `dev` ref exists in this run copy, so the base is `origin/dev`. The reviewed files are:

- `cli/templates/scripts/run-test-suite.sh` and its self-adopted copy `scripts/run-test-suite.sh` (byte-identical, by `cmp`);
- `cli/templates/scripts/lib/harness-run-lib.sh` and `scripts/lib/harness-run-lib.sh` (byte-identical);
- `cli/test/run-test-suite.test.mjs`;
- `docs/sandbox-verification.md`.

23 run-artifact files excluded from the reviewed diff.

**De-duplicated against:** the committed code review `harness-runs/code_reviews/fix_run_gates_wait_form_sandbox_code_review.md` (Findings 1–7, all applied), and the plan-time architecture reviews under `harness-runs/architecture_reviews/fix_run_gates_wait_form_sandbox/`. `phases.parity` is `false`, so no parity review exists.

**Adversarial checks run:**

- **Wiring.** `heartbeat_loop` is started by `exec 3> >(…)`. Both `run_alive` callers use the heartbeat. `HEARTBEAT_SECONDS` and `RUN_TEST_SUITE_STALE` are both consumed.
- **The fd 3 claim.** It holds under bash 3.2.57. A child that closes fd 3 holds no other copy of the pipe, so the process substitution leaks no write end.
- **Citations against their sources.** The task prompt, the raw `sbx2-results-20261023-083639/` capture, the probe script's header and G.1 were each opened and checked.
- **Behaviour.** Checked: signal and trap ordering, rename-before-remove, the stale bound against the wait slice, and the run form's wait-then-refuse path.

The heartbeat design holds up. One net-new defect survives: the script header attributes a measured fact to the wrong measurement.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Move the `pgrep` refusal out of the 2.1.309 measurement in the `WHY NOT A SIGNAL` header, in both script copies _(layer: cli, general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The `WHY NOT A SIGNAL` header credits the `pgrep` refusal to the 2.1.309 measurement, which never ran `pgrep`
→ [finding_1.md](fix_run_gates_wait_form_sandbox_skeptic_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from. The plan records two departures from the task prompt, and both were checked:

- **Task 3 copies bytes instead of running the self-adopt recipe** (story plan → *"Re-rendering without the forced `init`"*). The two templates this branch changes are copied verbatim by `init`, and both self-adopted copies are byte-identical to them, so the outcome equals the recipe's.
- **The SIGKILL-to-the-run-form-alone residual** is declared in the script header and in the test header's `Not covered here:`. It matches the old `kill -0` behaviour for the same case, so it is not a regression.
