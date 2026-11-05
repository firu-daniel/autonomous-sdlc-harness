# Code Review: fix_runner_seccomp_userns

## Context

**Branch:** `fix_runner_seccomp_userns`
**Date:** 2026-11-05
**Reviewed:** the whole branch diff against the default branch `dev`. This run copy has no local `dev` ref, so the diff was taken as `origin/dev...HEAD`. It covers:
- the new owner values and the nested user-namespace verdict in `cli/src/doctor/sandboxPrerequisites.ts`;
- the probe, the env-var seam and the pure `gradeSandboxPrerequisites` in `cli/src/doctor/checks.ts`;
- the `Install the sandbox prerequisites` step in `cli/templates/github/workflows/harness-run.yml` and its byte-for-byte copy in `scripts/sandbox-probe-runner.yml`;
- the run library's shell mirror and the watcher comment, with their self-adopted copies under `scripts/`;
- the IS3 comment in `scripts/lib/sandbox-probe/legs-runner.sh`;
- six suites under `cli/test/` and the fixture helper;
- `docs/cli.md`, `docs/remote-execution.md`, `docs/sandbox-verification.md`, `docs/watcher.md` and `docs/development.md`.

24 run-artifact files excluded from the reviewed diff.

**Headline conclusions.**
- Every task-prompt deliverable is present. The step disables the stock profile and loads ours with `apparmor_parser -r`. It then always verifies on Linux, including on the early `The sandbox prerequisites are present.` path. It fails with one `::error::` before `Run the harness`, and `sandbox.optOut` is read through the real `hr_sandbox_opted_out`.
- `doctor` runs the bounded nested check through an injectable seam and FAILs in both modes. The watcher refuses a fresh local launch on the same check.
- **Tests.** Every accompanying test the `cli` layer requires is present: the step's remedy, verification and failing arm; the probe runner's copy and its stop-before-session guard; doctor's four verdicts in both modes; and the shell mirror held to the owner. Whether they pass is for the Run gates phase to establish: this review runs no suite.
- `ISOLATED_ENV` turns the new probe off, and the watcher harness overrides `hr_sandbox_prereq_probe_var`, so no test spawns a real `bwrap`.
- The self-adopted `scripts/lib/harness-run-lib.sh` and `scripts/autonomous-watcher.sh` match their templates byte for byte.
- Every new export has a caller outside its defining file. The retired `APPARMOR_RELOAD_COMMAND` has no reader left.
- The task-prompt constraints hold: no sysctl change, no sandbox weakening, and no runner result invented.
- **Parity** is off for this project (`phases.parity` is `false`), so no parity cross-check ran.
- Pass 0's grep half has an empty sweep list in this project, a configuration gap. The caller check ran.
- Per-unit review was off: the `per_task_findings_root` folder does not exist, so Pass 2 had nothing to reconcile.

The five findings below are what is left: four Should Fix and one Nice to Have.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 5** — Restore the column alignment of the `harness-control.yml` row in the workflow's mirrors header _(layer: cli)_
2. [x] **Finding 3** — Make row DP5's *Expected* cell name the load command the uncertain warning now prints _(layer: general)_
3. [ ] **Finding 4** — Drop the three grading cases `SANDBOX_PREREQUISITES_CHECK`'s doc comment restates from `gradeSandboxPrerequisites` _(layer: cli)_
4. [ ] **Finding 2** — Bound the run library's nested user-namespace check with `timeout 10`, as `doctor` bounds it _(layer: cli, general)_
5. [ ] **Finding 1** — Stop prescribing the AppArmor profile for a failed nested check where AppArmor restricts nothing _(layer: cli, general)_

---

## Must Fix

None.

---

## Should Fix

### 1. A failed nested check with no stock profile always prescribes the AppArmor profile, even where AppArmor restricts nothing
→ [finding_1.md](fix_runner_seccomp_userns_code_review/finding_1.md)

### 2. The watcher's nested user-namespace check is unbounded, while the `doctor` probe it declares itself a mirror of is bounded at 10 s
→ [finding_2.md](fix_runner_seccomp_userns_code_review/finding_2.md)

### 3. Row DP5's *Expected* cell still expects the uncertain warning to name "the reload command", which the check no longer prints
→ [finding_3.md](fix_runner_seccomp_userns_code_review/finding_3.md)

### 4. `SANDBOX_PREREQUISITES_CHECK`'s doc comment points to `gradeSandboxPrerequisites` for the cases, then restates three of them
→ [finding_4.md](fix_runner_seccomp_userns_code_review/finding_4.md)

---

## Nice to Have

### 5. The `harness-control.yml` row of the workflow's mirrors header lost a column of alignment
→ [finding_5.md](fix_runner_seccomp_userns_code_review/finding_5.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from, and this section is empty.
