# Code Review: feat_sandbox_probe_job_mode

## Context

**Branch:** `feat_sandbox_probe_job_mode`
**Date:** 2026-11-01
**Reviewed:** the whole branch diff against `origin/dev`. There is no local `dev` ref in this checkout (`harness.config.json` → `defaultBranch` is `dev`), so the diff was taken against its remote-tracking ref. It covers 55 files:

- **The probe's job mode:** `scripts/sandbox-probe.sh`; `scripts/lib/sandbox-probe/core.sh`, `job.sh`, `preflight.sh` and `session.sh`.
- **The judge's PD23 shapes:** `judge.sh`, with `legs-protection.sh`'s classifier.
- **The carried-over legs' job arms:** `legs-wrappers.sh`, `legs-network.sh`, `legs-planted-files.sh` and `legs-protection.sh`.
- **The new legs:** `legs-job.sh`, `legs-runner.sh` and `legs-runner-isolation.sh`.
- **The runner workflow:** `scripts/sandbox-probe-runner.yml`.
- **The documents:** Gate 15 in `docs/development.md`, and `docs/sandbox-verification.md` §9.
- **The tests:** the `cli/test/sandbox-probe-*.test.mjs` suites with their fixtures.

32 run-artifact files excluded from the reviewed diff.

**Pass 0.**
- The grep half has no project regexes configured, so it ran no patterns. That is a configuration gap.
- The caller check ran. Every new shell function the diff adds has a caller outside its own definition, and every new leg is reached through the run loop's `sp_leg_<leg>` dispatch.

**Tests.** Every new probe library has a suite, the arch-review fixes are covered, and no test launches `claude`. No new suite reads a tree of repository files as text, so none owes a `treeGuards` entry. This review runs no suite: whether they pass is for the Run gates phase.

**Measurement lessons.** The PD23 widening of the Linux refusal set was checked against `harness-runs/lessons.md` → `## Evidence and measurement`. "Grade a write probe on what reached the disk" holds: the write-protection rows grade every target's inode and shasum on disk, not the call's exit status, so a wider refusal set cannot pass a write that landed. The evidence sentence those rows record does not keep up with the wider set (Finding 6).

**Parity.** `phases.parity` is `false`, so no parity review ran and the call-out section is empty.

**Conclusions.**
- Job mode's launch line, profile check and preflight follow `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine` faithfully.
- Two job-mode defects would distort the runner round:
  - the `wrappers` leg's job arm never cuts its control clone, so its four job rows can never pass (Finding 1);
  - the placeholder handling skips the watcher's pre-spawn sweep, so placeholders leak into the adopted checkout (Finding 2).
- Four smaller items follow.

**Pass 2.** `per_task_findings_root` (`harness-runs/task_plan_point_reviews/feat_sandbox_probe_job_mode_task_plan/`) does not exist in this checkout, so nothing was carried over.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 4** — Restate Gate 15's `run` sentence: the job-mode-only legs left out, seven Linux-only legs _(layer: general)_
2. [x] **Finding 5** — Declare `js-yaml` in `cli/package.json` and the lock's `cli` entry _(layer: cli, general)_
3. [x] **Finding 6** — Build the Linux write-protection pass sentence from the judge's whole refusal set _(layer: cli, general)_
4. [x] **Finding 3** — Record the `userns,` test in the controls file and grade IS3's rewrite case _(layer: cli, general)_
5. [x] **Finding 1** — Cut the control clone in the `wrappers` leg's job arm before its first session _(layer: cli, general)_
6. [ ] **Finding 2** — Run the job's sweep before every job-mode manifest write, as `spawn_engine` does before every spawn _(layer: cli, general)_

---

## Must Fix

### 1. In job mode the `wrappers` leg never cuts its control clone, so P1c, CW5, P1b and CW6 can never print `pass`
→ [finding_1.md](feat_sandbox_probe_job_mode_code_review/finding_1.md)

### 2. Job mode overwrites the placeholder manifest before every session and never sweeps between sessions, so an earlier session's placeholders stay in the adopted checkout
→ [finding_2.md](feat_sandbox_probe_job_mode_code_review/finding_2.md)

---

## Should Fix

### 3. IS3 grades a rewrite of an existing `/etc/apparmor.d/bwrap` as "not needed", because the controls file records only whether the file exists
→ [finding_3.md](feat_sandbox_probe_job_mode_code_review/finding_3.md)

### 4. Gate 15 still says `run` takes every leg but `headless-parity` and `refusal`, and names four Linux-only legs; plain `run` now also leaves out the four job-mode-only legs
→ [finding_4.md](feat_sandbox_probe_job_mode_code_review/finding_4.md)

### 5. `cli/test/sandbox-probe-runner-workflow.test.mjs` imports `js-yaml`, which the `cli` workspace does not declare
→ [finding_5.md](feat_sandbox_probe_job_mode_code_review/finding_5.md)

### 6. The Linux write-protection pass sentence still names two refusal strings, though the judge now passes CS1, CS2 and CS7 on any of four
→ [finding_6.md](feat_sandbox_probe_job_mode_code_review/finding_6.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

_None._ `phases.parity` is `false`, so there is no reference implementation to diverge from.
