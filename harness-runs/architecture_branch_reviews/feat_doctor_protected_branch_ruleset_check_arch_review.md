# Architecture review — feat_doctor_protected_branch_ruleset_check

## Context

Branch `feat_doctor_protected_branch_ruleset_check`, reviewed 2026-11-09 against `dev` (this run copy carries no local `dev`, so the base resolved as its remote-tracking ref `origin/dev`), iteration 0. Reviewed: the `cli` diff (`cli/src/doctor/branchProtection.ts` new, `cli/src/doctor/checks.ts`, `cli/src/commands/doctor.ts`, `cli/README.md`, `cli/test/branch-protection.test.mjs` new, `cli/test/doctor-branch-protection.test.mjs` new, `cli/test/doctor.test.mjs`) and the `general` diff (`docs/cli.md`, `docs/config.md`), against `.claude/context/conventions.md`, `.claude/context/cli.md` and `.claude/context/plugin.md`, with the story plan read for intent only. 8 run-artifact files excluded from the reviewed diff. Headline: the layering is sound — the pure grading sits in its own `doctor/` module with a rule-stating header, the check gathers through the existing `runGh` / `classifyGh` / `ghCli` and the protected set through `generators/githooks.ts`'s `resolveProtectedBranches` / `isGlobPattern`, registration is one `CHECKS` row, no `console`, no `git` invocation outside `core/git.ts`, nothing crosses into `plugin/`, and both new units land with suites driving the compiled CLI in temp fixtures. One Must Fix: `checks.ts` retypes the needs phrase the new module owns. One Should Fix: it also re-derives the "rulesets settle it" predicate.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — `checks.ts` retypes the protection-needs phrase that `branchProtection.ts` owns _(layer: cli)_
2. [ ] **Finding 2** — `checks.ts` re-derives "the rulesets block every need", a predicate `assessBranch` already defines _(layer: cli)_

## Must Fix

### 1. `checks.ts` retypes the protection-needs phrase that `branchProtection.ts` owns
→ [finding_1.md](feat_doctor_protected_branch_ruleset_check_arch_review/finding_1.md)

## Should Fix

### 2. `checks.ts` re-derives "the rulesets block every need", a predicate `assessBranch` already defines
→ [finding_2.md](feat_doctor_protected_branch_ruleset_check_arch_review/finding_2.md)
