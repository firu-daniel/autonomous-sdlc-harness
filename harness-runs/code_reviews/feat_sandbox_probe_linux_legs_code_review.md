# Code Review: feat_sandbox_probe_linux_legs

## Context

**Branch:** `feat_sandbox_probe_linux_legs`
**Date:** 2026-10-28
**Reviewed:** the whole branch diff against `defaultBranch` `dev`. This checkout has no local `dev`, so the diff was taken against its remote-tracking ref: `git diff origin/dev...HEAD`. It covers 50 changed files in three segments:

- **The probe (`general`).** `scripts/sandbox-probe.sh` and `scripts/lib/sandbox-probe/*`:
  - the new `platform.sh` and the five Linux-only leg libraries (`legs-glob.sh`, `legs-registry.sh`, `legs-detached.sh`, `legs-loopback.sh`, `legs-refusal.sh`);
  - the edits to `core.sh`, `preflight.sh`, `judge.sh`, `session.sh`, `legs-local.sh`, `legs-network.sh`, `legs-protection.sh` and `legs-settings.sh`.
- **The rows of record (`general`).** Gate 15 in `docs/development.md`, and `docs/sandbox-verification.md`, including the new `## 8. The Linux legs (owed)`.
- **The suites (`cli`).** Four new and eight edited suites under `cli/test/`, and their JSONL fixtures under `cli/test/fixtures/sandbox-probe/`.

29 run-artifact files excluded from the reviewed diff.

**Headline.** Every test the touched layers' conventions documents require is present. Whether they pass is for the Run gates phase to establish; this review runs no suite. The four new suites read fixed files only, so none of them is a tree guard that owes a `treeGuards` entry. `phases.parity` is `false`, so no parity cross-check applies.

**What was checked.**

- **The task prompt's constraints hold.** Every Linux arm is gated on `SP_PLATFORM` being `linux`, so macOS verdicts are unchanged. Every row the branch adds says *not yet measured*. No profile, generator, wrapper, guard or watcher file is touched. Refusal 6 stays strict for `run`, because only the `refusal` subcommand assigns `SP_PREFLIGHT_PREREQ=absent`.
- **The judge's new `unrecognised` arm** fires only when a refusal (`sandbox` or `network`) is expected. Every legacy caller that expects one was re-read. Each turns it into `not run`, except N3 and N4, which read it as their data as Task 22 intended.
- **RG3's restore** is registered before its session and runs in `sp_teardown` ahead of the clone loop.
- **Pass 0, half (b).** Every new non-private probe function (`sp_platform_of`, `sp_prereq_cmd`, `sp_stamp`, `sp_leg_linux_only`, `sp_leg_platform_skip`, `sp_leg_row_for`, `sp_restore_register`, `sp_restore_clear`, `sp_leg_refusal`) has a caller outside its defining file.
- **Pass 0, half (a)** found nothing to sweep: the regex column of this agent's sweep list is still the unedited stub, a configuration gap rather than a clean result.
- **Pass 2** carried nothing over: the supplied `per_task_findings_root` (`harness-runs/task_plan_point_reviews/feat_sandbox_probe_linux_legs_task_plan/`) does not exist, so per-unit review was off.

The three findings below are all Should Fix.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.**

- The orchestrator walks the `[ ]` entries below top to bottom.
- The committing role flips each one to `[x]` as that fix's commit lands.
- `[ ]` markers anywhere else, such as sub-step bullets in a per-finding file, are informational only. The committer never touches them.

Each entry resolves to `harness-runs/code_reviews/feat_sandbox_probe_linux_legs_code_review/finding_<K>.md`.

1. [x] **Finding 3** — Say "macOS and Linux" in `scripts/sandbox-probe.sh`'s opening header line _(layer: general)_
2. [x] **Finding 2** — Read `SP__NET_LOOPBACK_HOST` in `sp__lb5_grade`'s pass evidence, and amend the grading-functions header line _(layer: general)_
3. [x] **Finding 1** — Raise `SP_BG9_SECONDS` from 20 to 60 so BG9's worker can outlive a real session, and state the bound in the header _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. BG9's worker lasts 20 s, so a session that runs on for 19 s or more after the start call can never grade BG9
→ [finding_1.md](feat_sandbox_probe_linux_legs_code_review/finding_1.md)

### 2. `sp__lb5_grade` still retypes `127.0.0.1` in its pass evidence instead of reading `SP__NET_LOOPBACK_HOST`
→ [finding_2.md](feat_sandbox_probe_linux_legs_code_review/finding_2.md)

### 3. The entry point's opening header line still says the probe measures the sandbox "on macOS"
→ [finding_3.md](feat_sandbox_probe_linux_legs_code_review/finding_3.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section is empty.
