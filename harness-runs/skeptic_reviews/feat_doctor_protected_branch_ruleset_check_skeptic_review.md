# Skeptic Review: feat_doctor_protected_branch_ruleset_check

## Context

**Branch:** `feat_doctor_protected_branch_ruleset_check`. **Date:** 2026-11-09. **Base:** this run copy has no local `dev`, so the diff base resolved as the remote-tracking ref `origin/dev`.

**Reviewed:** the whole-branch diff, read adversarially:

- `cli/src/doctor/branchProtection.ts` (new);
- the `branch-protection` check in `cli/src/doctor/checks.ts`, including the fixes already landed for the code-review and architecture-review findings;
- `cli/src/commands/doctor.ts` and `cli/README.md`;
- the two new suites and the one-id change to `cli/test/doctor.test.mjs`;
- `docs/cli.md` §6 and §7, and `docs/config.md` §5.

They were read against the task prompt and story plan, `.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md` and `harness-runs/lessons.md`. 16 run-artifact files excluded from the reviewed diff.

**De-duplicated against:**

- the code review, `harness-runs/code_reviews/feat_doctor_protected_branch_ruleset_check_code_review.md`, findings 1–4;
- the architecture review, `harness-runs/architecture_branch_reviews/feat_doctor_protected_branch_ruleset_check_arch_review.md`, findings 1–2.

There is no parity review, because `phases.parity` is `false`.

**Headline:**

- **Wiring.** The check is reached: it is registered in `CHECKS` after `forge`, and the suite's id list carries it. Every new export in `branchProtection.ts` has a caller in `checks.ts`.
- **Citations.** The cited sources resolve: the header's choice 3, §6's **Four scripts run outside the sandbox, each in one spelling.**, `resolveProtectedBranches` and `isGlobPattern`.
- **Reads and grades.** Every `gh` call is `auth status` or a plain `api` GET. No arm grades `fail`, and every arm that cannot tell grades `warn`.

One net-new Should Fix: the remedy recommends a ruleset that requires a pull request on the default branch. That ruleset refuses the direct default-branch pushes that `doctor`'s other checks and the setup docs tell the adopter to make, and nothing says so.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Say in the `branch-protection` remedy and its docs bullet that a pull-request ruleset refuses the harness's own direct default-branch pushes _(layer: cli, general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The `branch-protection` remedy recommends a pull-request ruleset on the default branch, and never says it refuses the direct default-branch pushes `doctor` and the setup docs print
→ [finding_1.md](feat_doctor_protected_branch_ruleset_check_skeptic_review/finding_1.md)

---

## Nice to Have

_None._

---

## Intentional divergences (call-outs)

_None._ The story plan's decision 1 deliberately departs from the module's `unevaluated()` precedent: this check never fails. The task prompt's `## The goal` item 2 authorizes that ("It never fails the run on this check: it is a warning"), so it is not a divergence to confirm.
