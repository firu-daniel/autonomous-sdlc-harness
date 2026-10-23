# Code Review: fix_run_gates_wait_form_sandbox

## Context

**Branch:** `fix_run_gates_wait_form_sandbox`
**Date:** 2026-10-23
**Reviewed:** the whole branch diff against the default branch `dev`. No local `dev` ref exists in this run copy, so the diff base is `origin/dev`, merge base `498eb8e8`. The diff covers four parts:

- the `run-test-suite.sh` template's new `.running` mtime heartbeat, which replaces `kill -0` (Task 1, `cli/templates/scripts/run-test-suite.sh`);
- its cases (Task 2, `cli/test/run-test-suite.test.mjs`);
- this checkout's self-adopted copy (Task 3, `scripts/run-test-suite.sh`, confirmed byte-identical to the template with `cmp`);
- the WF1 measurement row, the owed WF2–WF5 rows and F5 (Task 4, `docs/sandbox-verification.md`).

14 run-artifact files excluded from the reviewed diff.

**Headline conclusions.**

- **The design meets the task prompt.** The wire is unchanged: the `pass` / `fail <log>` / `pending` lines, the exit map 0/1/2/3, the `.running` / `.verdict` / `.log` names, the label pattern and the `no run in flight for <label>` text. No reader sends a signal or lists processes. The script carries no `stat` of its own. `STALE_SECONDS` (30) is below `WAIT_SLICE_SECONDS` (60), so a crashed run is refused within one `--wait` call.
- **The three cases the prompt requires are all present**: an unsignalable live run, a run that died without a verdict, and the run form finding a live run of its label. Signal-behaviour cases were added beside them. This review ran no suite; whether the cases pass is the Run gates phase's to establish.
- **One new refusal branch is neither tested nor declared uncovered.** The unreadable-heartbeat refusal is Finding 1.
- **One real defect was reproduced by hand.** The heartbeat's touch loop leaks forever when its stop file cannot be written (Finding 2).
- **The rest is header and document accuracy.**

Pass 0: the sweep table's regex cells are still the stub, so the grep half had nothing to run. The new-exported-symbol caller check found no added export. Pass 2: the supplied `per_task_findings_root` (`harness-runs/task_plan_point_reviews/fix_run_gates_wait_form_sandbox_task_plan/`) does not exist, so Pass 2 was a no-op. `phases.parity` is `false`, so no parity review ran.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 5** — Name `run-test-suite.sh`'s heartbeat read as a second caller in `hr_lane_mtime`'s doc comment, in both library copies _(layer: cli, general)_
2. [x] **Finding 3** — Give the unreadable-heartbeat refusal its own entry in the exit map, reachable from either form, in both script copies _(layer: cli, general)_
3. [x] **Finding 6** — List the transient `<label>.running.stop.<pid>` file under `BESIDE THE LOG`, in both script copies _(layer: cli, general)_
4. [x] **Finding 2** — End the heartbeat's touch loop once `.running` is gone, so an unwritable stop file cannot leave it running forever, in both script copies _(layer: cli, general)_
5. [x] **Finding 1** — Add a case for the `cannot read the heartbeat` refusal in both forms, using a failing `stat` on `PATH` _(layer: cli)_
6. [x] **Finding 7** — Start the two held-run cases under an aborting controller, so a failed assertion cannot hang the suite _(layer: cli)_
7. [ ] **Finding 4** — Count F5 in `docs/sandbox-verification.md`'s headline as a fourth run-stopping defect _(layer: general)_

---

## Must Fix

### 1. The new `cannot read the heartbeat` refusal has no case, and the test header does not say it is uncovered
→ [finding_1.md](fix_run_gates_wait_form_sandbox_code_review/finding_1.md)

---

## Should Fix

### 2. The heartbeat's touch loop never ends if its stop file cannot be written
→ [finding_2.md](fix_run_gates_wait_form_sandbox_code_review/finding_2.md)

### 3. The exit map files the unreadable-heartbeat refusal under "(wait form) no run in flight"
→ [finding_3.md](fix_run_gates_wait_form_sandbox_code_review/finding_3.md)

### 4. The sandbox document's headline still counts three defects, though F5 is a fourth that stops a run
→ [finding_4.md](fix_run_gates_wait_form_sandbox_code_review/finding_4.md)

### 5. `hr_lane_mtime`'s doc comment says it exists for one lock-directory case, and this branch adds a second, different caller
→ [finding_5.md](fix_run_gates_wait_form_sandbox_code_review/finding_5.md)

---

## Nice to Have

### 6. The header's `BESIDE THE LOG` list omits the heartbeat's stop file
→ [finding_6.md](fix_run_gates_wait_form_sandbox_code_review/finding_6.md)

### 7. Two held-run cases leave their stub blocked forever if an assertion fails before the release
→ [finding_7.md](fix_run_gates_wait_form_sandbox_code_review/finding_7.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section has no parity call-outs.
