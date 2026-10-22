# Code Review: feat_unattended_sandbox_preflight

## Context

**Branch:** `feat_unattended_sandbox_preflight`
**Date:** 2026-10-22
**Reviewed:** the whole branch diff against the default branch `dev`, taken as `origin/dev` because this checkout carries no local `dev` ref. That covers:

- the prerequisite table `cli/src/doctor/sandboxPrerequisites.ts` (Task 1);
- `doctor`'s `sandbox-prerequisites` check, its live probe `probeSandboxHost` and the `--remote-job` grading in `cli/src/doctor/checks.ts` and `cli/src/commands/doctor.ts` (Task 2);
- the run library's mirrors `hr_sandbox_prereq_judge_var`, `hr_sandbox_prereq_probe_var` and `hr_sandbox_opted_out`, with the `sandbox.optedOut` flag `hr_config_load` computes (Task 3);
- the watcher's sandbox preflight in `process_inbox_file` (Task 4);
- the `Install the sandbox prerequisites` step in `harness-run.yml` (Task 5);
- the prose in `docs/cli.md`, `docs/config.md`, `docs/watcher.md`, `docs/remote-execution.md`, `docs/development.md` and `ROADMAP.md` (Tasks 6 and 7);
- the five new suites and the two edited test files that ship with all of the above.

14 run-artifact files excluded from the reviewed diff.

Every accompanying test the `cli` and `general` conventions documents require is present. Whether those tests pass is the Run gates phase's to establish, because this review runs no suite. `phases.parity` is `false`, so no parity cross-check applies.

The branch does what the task prompt asks:

- The table has one owner, and its mirrors are declared in both headers.
- The opt-out mirror matches JavaScript `trim`'s whitespace set byte for byte. The `gsub` class was checked byte by byte against the list.
- The watcher refuses only a fresh local drop. It refuses after the branch-owning-record rejections and before the lane, through `fail_before_launch`, and never defers.
- A remote drop never consults the probe.
- The workflow step runs directly before `Preflight with doctor`, and writes the owner's profile text.
- No refusal or remedy offers the opt-out.
- The root `scripts/` copies are untouched.
- `tick`'s `hr_config_reset` keeps the opt-out read fresh on every pass.

Every new runtime export has a caller outside its defining file. The Pass 0 sweep found no `console`, `process.exit`, shell-string spawn or recursive removal on an added line. Its two `as SandboxPiece` casts are Finding 3. Two findings are behavioural or guarantee-level: a consequence sentence that is wrong outside a local default run, and a declared mirror that no test runs. Two more are cosmetic.

---

## Phase 2 Readiness — Ordered Fix List

This section is the single source of truth for the per-item fix loop. The orchestrator walks the `[ ]` entries below from top to bottom, and the committing role flips each one to `[x]` as that fix's commit lands. Each entry resolves to `harness-runs/code_reviews/feat_unattended_sandbox_preflight_code_review/finding_<K>.md`, the file its `**Finding K**` reference names.

1. [x] **Finding 4** — Restore the sixth space in the watcher header's `a resume` REPRO row _(layer: cli)_
2. [x] **Finding 3** — Narrow `SandboxBinary.binary` to `SandboxBinaryName` and drop the two `as SandboxPiece` casts _(layer: cli)_
3. [ ] **Finding 2** — Run `hr_sandbox_prereq_probe_var` against a stubbed `uname` and `PATH` in the shell-mirror suite _(layer: cli)_
4. [ ] **Finding 1** — Choose the `sandbox-prerequisites` consequence sentence by mode: job, `github-actions` repository, or local _(layer: cli)_

---

## Must Fix

None.

---

## Should Fix

### 1. `sandbox-prerequisites` tells a job, and a `github-actions` repository, that the local watcher will refuse its launches
→ [finding_1.md](feat_unattended_sandbox_preflight_code_review/finding_1.md)

### 2. The probe's shell mirror is declared "held equal" by a suite that never runs it
→ [finding_2.md](feat_unattended_sandbox_preflight_code_review/finding_2.md)

---

## Nice to Have

### 3. `SandboxBinary.binary` is a bare `string`, so the table is cast to `SandboxPiece` at both read sites
→ [finding_3.md](feat_unattended_sandbox_preflight_code_review/finding_3.md)

### 4. The watcher's REPRO table lost a column of alignment on the `a resume` row
→ [finding_4.md](feat_unattended_sandbox_preflight_code_review/finding_4.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`, so this section is empty: there is no reference implementation to diverge from.
