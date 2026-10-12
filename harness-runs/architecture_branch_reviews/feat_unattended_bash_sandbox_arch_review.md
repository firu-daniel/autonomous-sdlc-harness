# Architecture review — feat_unattended_bash_sandbox

## Context

Branch `feat_unattended_bash_sandbox`, reviewed 2026-10-12 against `dev` (`git diff dev...HEAD`). The review covered all 94 changed files, in five segments: the `cli/src` generators (`sandboxProfile.ts`, `writeProtection.ts`, `permissionProfile.ts`, `outerLoopScripts.ts`, `repoRoot.ts`); the configuration-key contract (`schemas/harness.config.schema.json`, `cli/src/config/model.ts`, `cli/src/config/check.ts`, `docs/config.md` §5, the two negative fixtures and their `validate:config:negative` wiring); `doctor` (`cli/src/doctor/checks.ts`); the shipped shell templates (`cli/templates/scripts/lib/harness-run-lib.sh`, `push-branch.sh`, `refresh-branch.sh`, `setup-worktree.sh`) and their new suites under `cli/test/`; and the plugin corpus and `general` prose (the `<MAIN_REPO>` push spelling, the `dontAsk` rewording, the re-rendered `examples/notes-app` artifacts). 38 run-artifact files excluded from the reviewed diff.

Most of the layering holds. The new configuration key lands in the right order in all four places. Each new `cli/src` module has its rule-stating header and lives in `generators/`. `doctor` takes its expected values from the generator's exports rather than from a second copy. The wrappers' shared git-free logic lives in the run library, not in each wrapper. The plugin half changes prose only and does not reach into `cli/`. Three placement violations remain:

- a `.sh` name used as a second source for the outer-loop table;
- dotted-path and list helpers copied across two `cli/src` areas instead of living in `core/`;
- two new `doctor` checks that re-probe a root `buildCheckContext` already resolves once.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — `writeProtection.ts` spells `harness-run-lib.sh` as a second source for the outer-loop table _(layer: cli)_
2. [x] **Finding 4** — `writeProtection.ts` and `permissionProfile.ts` retype the `sandbox` key instead of importing `SANDBOX_KEY` _(layer: cli)_
3. [x] **Finding 5** — The run library's NAMING header omits `HR_TARGET_REFUSAL` _(layer: cli)_
4. [x] **Finding 3** — The new `doctor` profile checks re-probe the profile root `buildCheckContext` resolves once _(layer: cli)_
5. [ ] **Finding 2** — JSON dotted-path and list helpers are copied across `generators/` and `doctor/` instead of living in `core/json.ts` _(layer: cli)_
6. [ ] **Finding 6** — The new generators close runtime import cycles through `permissionProfile.ts` _(layer: cli)_

## Must Fix

### 1. `writeProtection.ts` spells `harness-run-lib.sh` as a second source for the outer-loop table
→ [finding_1.md](feat_unattended_bash_sandbox_arch_review/finding_1.md)

### 2. JSON dotted-path and list helpers are copied across `generators/` and `doctor/` instead of living in `core/json.ts`
→ [finding_2.md](feat_unattended_bash_sandbox_arch_review/finding_2.md)

### 3. The new `doctor` profile checks re-probe the profile root `buildCheckContext` resolves once
→ [finding_3.md](feat_unattended_bash_sandbox_arch_review/finding_3.md)

## Should Fix

### 4. `writeProtection.ts` and `permissionProfile.ts` retype the `sandbox` key instead of importing `SANDBOX_KEY`
→ [finding_4.md](feat_unattended_bash_sandbox_arch_review/finding_4.md)

### 5. The run library's NAMING header omits `HR_TARGET_REFUSAL`
→ [finding_5.md](feat_unattended_bash_sandbox_arch_review/finding_5.md)

### 6. The new generators close runtime import cycles through `permissionProfile.ts`
→ [finding_6.md](feat_unattended_bash_sandbox_arch_review/finding_6.md)
