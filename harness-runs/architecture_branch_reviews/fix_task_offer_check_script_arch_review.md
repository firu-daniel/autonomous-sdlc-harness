# Architecture review — fix_task_offer_check_script

## Context

Branch `fix_task_offer_check_script`, reviewed 2026-10-30, iteration 0, against the diff base `dev`. No local `dev` branch exists in this checkout, so the diff was taken against `origin/dev...HEAD`. The diff covers 20 files across the `cli` layer (`cli/src/commands/init.ts`, `cli/src/doctor/checks.ts`, `cli/src/generators/{claudeContext,outerLoopScripts,projectSettings}.ts`, the `cli/templates/` fence item, script and README, and five suites under `cli/test/`), the `plugin` layer (the script-allowlist guard's comment and `plugin/hooks/README.md`), and the `general` layer (`docs/cli.md`, `docs/guard-verification.md`, `docs/watcher.md`, `examples/notes-app/README.md` and the self-adopted `scripts/task-offer-check.sh`). 16 run-artifact files excluded from the reviewed diff.

Placement and dependency direction hold. The script is a new `OUTER_LOOP_SCRIPTS` row whose name is declared once (`TASK_OFFER_CHECK_SCRIPT_NAME`). The fence text, the settings allow rule and `doctor` all read the one invocation producer (`taskOfferCheckInvocation` / `taskOfferCheckRule`, built on `scriptInvocation`). The new generator edges (`claudeContext.ts` and `projectSettings.ts` importing `outerLoopScripts.ts`) stay within `generators/` and add no cycle. The settings write stays a `merge-json` plan request. The guard change touches comments only and is re-measured in `docs/guard-verification.md`. Neither shipped half reaches into the other.

There is one Must Fix. `doctor`'s new `task-offer-rules` arms grade `.claude/settings.json` → `permissions.allow` with a private copy of the classification the settings generator already makes. That copy includes a re-statement of `mergeMissing`'s reach. The cli layer's `doctor` rule forbids such a copy, and the generator's own header records the `marketplaceEntryDefect` precedent for removing exactly this kind of copy. There is also one Should Fix: the self-adopted script's committed mode bit.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — Self-adopted `scripts/task-offer-check.sh` is committed `100644`, not the row's `0755` _(layer: general)_
2. [ ] **Finding 1** — `doctor` re-derives the generator's `permissions.allow` grading instead of asking it _(layer: cli)_

## Must Fix

### 1. `doctor` re-derives the generator's `permissions.allow` grading instead of asking it
→ [finding_1.md](fix_task_offer_check_script_arch_review/finding_1.md)

## Should Fix

### 2. Self-adopted `scripts/task-offer-check.sh` is committed `100644`, not the row's `0755`
→ [finding_2.md](fix_task_offer_check_script_arch_review/finding_2.md)
