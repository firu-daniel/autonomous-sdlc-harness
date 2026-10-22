# Skeptic Review: feat_unattended_sandbox_preflight

## Context

**Branch:** `feat_unattended_sandbox_preflight`
**Date:** 2026-10-22
**Reviewed:** the whole branch diff against the default branch `dev`. This checkout has no local `dev` ref, so the diff was taken against `origin/dev`, merge base `b9b4b5bd`. It covers:

- `cli/src/doctor/sandboxPrerequisites.ts`;
- the `sandbox-prerequisites` check and `probeSandboxHost` in `cli/src/doctor/checks.ts`;
- the `--remote-job` text in `cli/src/commands/doctor.ts`;
- the mirror note in `cli/src/config/model.ts`;
- the run library's `hr_sandbox_opted_out`, `hr_sandbox_prereq_judge_var` and `hr_sandbox_prereq_probe_var`, and the `sandbox.optedOut` flag;
- the watcher's sandbox preflight in `process_inbox_file`;
- `harness-run.yml`'s `Install the sandbox prerequisites` step;
- the new and edited suites;
- the prose in `docs/` and `ROADMAP.md`.

19 run-artifact files excluded from the reviewed diff.

**De-duplicated against:**
- the committed code review `harness-runs/code_reviews/feat_unattended_sandbox_preflight_code_review.md` and its findings 1 to 4, all applied;
- the plan-stage architecture reviews `harness-runs/architecture_reviews/feat_unattended_sandbox_preflight/review_0.md` and `review_1.md`;
- `harness-runs/lessons.md`.

No branch-level architecture review and no parity review exist for this branch. `phases.parity` is `false`, so check 2's parity leg is inert.

**Checks run, with no net-new finding:**
- **Check 1 (wiring).** Every new runtime export has a caller. The watcher's preflight is reached by all three inbox patterns, and the workflow step sits directly before `Preflight with doctor`.
- **Check 3 (citations).** The cited sections, and the mirror declarations on both sides, exist and say what the code claims.
- **Check 5 (behaviour).** The refusal archives and never defers. The opt-out is read from `$MAIN_REPO`, and a failed config load counts as not opted out. The step's shell is safe under the runner's `bash -e`.
- **Check 2's runtime-address leg.** The sysctl path, the profile path and the profile text compose correctly. The heredoc's YAML indentation strips to the owner's `bwrapAppArmorProfile()` bytes.

**Headline:** one net-new finding. The stated host-independence mitigation for the watcher suites stops at the shared helper's `tick`. The stall-watchdog suite runs its own `tick` script and still hits the real probe, so its nine local cases fail on a Linux host without `bubblewrap` or `socat`.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Override the sandbox probe in the stall-watchdog suite's own `tick` script _(layer: cli)_

---

## Must Fix

None.

---

## Should Fix

### 1. The stall-watchdog suite ticks the real watcher without overriding the sandbox probe, so all nine of its local cases fail on a Linux host without `bubblewrap` or `socat`
→ [finding_1.md](feat_unattended_sandbox_preflight_skeptic_review/finding_1.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from. The divergences the plan marks deliberate both pass check 4's two legs:

- A resume, job mode and a remote drop are left to `failIfUnavailable`.
- An `uncertain` AppArmor answer never refuses.

Each is stated in the task prompt's goal 4 and in the story's **Where each refusal happens**. No sibling refusal in the watcher sets a different convention: `fail_before_launch` is the existing pre-launch failure path, and it is already used before the working copy is derived.
