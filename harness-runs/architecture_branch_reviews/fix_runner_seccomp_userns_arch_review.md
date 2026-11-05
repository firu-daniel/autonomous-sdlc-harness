# Architecture review — fix_runner_seccomp_userns

## Context

Branch `fix_runner_seccomp_userns`, reviewed 2026-11-05. This is the architecture review (implemented-solution mode, iteration 0) of the branch diff against the default branch `dev`. No local `dev` ref exists in this run copy, so the diff was taken against `origin/dev...HEAD`. The diff covers 20 files across the `cli` layer (`cli/src/doctor/checks.ts`, `cli/src/doctor/sandboxPrerequisites.ts`, the `harness-run.yml` workflow template, the run-library and watcher templates, five suites under `cli/test/` and the fixture helper) and the `general` layer (`docs/`, the self-adopted `scripts/` copies and the sandbox probe runner). 21 run-artifact files excluded from the reviewed diff. Headline: the layering holds. Every new value is declared in its owner, `cli/src/doctor/sandboxPrerequisites.ts`, and `checks.ts` imports it in the allowed direction (`checks.ts` → `sandboxPrerequisites.ts`, never the reverse). The live probe keeps the fixed-argument-vector `execFileSync` form, bounded by a timeout, and its env-var seam has an owner constant in the keep-awake shape. `gradeSandboxPrerequisites` keeps grading pure and inside `doctor/`. The shell mirror, the workflow step and the self-adopted copies each sit in the template subdirectory or root path their layer assigns; the self-adopted `scripts/` copies match their templates byte for byte. Two findings concern how dependencies are declared, not where code is placed. The owner's header claims the shell judge mirrors a remedy it does not carry (Must Fix). The workflow step now sources the run library through a dependency that neither file declares (Should Fix).

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Drop the undeclared-in-fact `bwrapUsernsRestrictRemedy` mirror claim from the owner's header _(layer: cli)_
2. [ ] **Finding 2** — Declare the workflow step's sourcing of `harness-run-lib.sh` → `hr_sandbox_opted_out` on both sides _(layer: cli, general)_

## Must Fix

### 1. The owner's DECLARED MIRRORS block lists `bwrapUsernsRestrictRemedy` as mirrored by the shell judge, which carries no remedy
→ [finding_1.md](fix_runner_seccomp_userns_arch_review/finding_1.md)

## Should Fix

### 2. The workflow's install step now sources the run library and calls `hr_sandbox_opted_out`, and neither file declares that dependency
→ [finding_2.md](fix_runner_seccomp_userns_arch_review/finding_2.md)

## Nice to Have

None.
