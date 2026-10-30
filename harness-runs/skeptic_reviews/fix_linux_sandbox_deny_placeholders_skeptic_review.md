# Skeptic review: fix_linux_sandbox_deny_placeholders

## Context

**Branch:** `fix_linux_sandbox_deny_placeholders`
**Date:** 2026-10-29

**What was reviewed.** The whole-branch diff, read adversarially. The configured diff base is `dev`, and no local ref of that name exists in this checkout, so the diff was taken against the remote-tracking ref `origin/dev` (`git diff origin/dev...HEAD`). It covers 26 files: `cli/src`, the three outer-loop templates and their self-adopted copies under `scripts/`, the `cli/test` suites, `docs/`, and the new `scripts/sandbox-absent-path-check.sh`. The branch's new watcher paths were followed into their callers, including the hand-written sandbox probe under `scripts/lib/sandbox-probe/`, which the branch's owed Linux measurements depend on. 30 run-artifact files excluded from the reviewed diff.

**De-duplicated against:** the code review `harness-runs/code_reviews/fix_linux_sandbox_deny_placeholders_code_review.md` (Findings 1–3) and the architecture review `harness-runs/architecture_branch_reviews/fix_linux_sandbox_deny_placeholders_arch_review.md` (Findings 1–3). `phases.parity` is `false`, so no parity review exists. None of those six findings is raised again here.

**Verified first-hand:**
- Every new run-library and watcher function has a live caller.
- `spawn_engine` probes the host before `run_profile_render` and before the manifest write.
- The launch check `hr_run_copy_check_var` reaches `hr_clone_target_check_var`'s condition 3, which still refuses a planted trio file.
- The plan's citation of that condition resolves.
- `hr_run_profile_absent_files`'s `*` branch survives `hr_sanitize_branch`.
- `run_profile_check` accepts a per-run copy that omits entries.

**Headline conclusion.** One Must Fix. The sandbox probe's renderer never takes the placeholder-host answer. As a result, the owed AP1–AP5 re-take and the blocked-leg re-takes would measure a Linux per-run profile that still denies the trio, which is the profile from before this change.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Take the placeholder-host answer in `sp__render` before it renders the probe's per-run profile _(layer: general)_

## Must Fix

### 1. The sandbox probe renders its per-run profile without the placeholder-host answer, so the owed Linux re-take measures the pre-change profile
→ [finding_1.md](fix_linux_sandbox_deny_placeholders_skeptic_review/finding_1.md)

## Should Fix

None.

## Nice to Have

None.

## Out of scope / verified-OK (intentional divergences / call-outs)

None. `phases.parity` is `false`, so this project has no reference implementation. The branch's one declared departure from the task prompt's goal is the trio's sandboxed write on Linux. The user accepted it in `harness-runs/clarifications/fix_linux_sandbox_deny_placeholders/answer_1.md`, as the story plan cites, and it is not a finding.
