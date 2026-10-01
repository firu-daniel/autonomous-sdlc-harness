# Architecture review — feat_forge_run_control

## Context

Branch `feat_forge_run_control`, reviewed 2026-10-01 against `dev` (`git diff dev...HEAD`), with the story index `harness-runs/story_plans/feat_forge_run_control_story_plan.md` read for intent only. 40 files changed across all three layers. In `cli`: `cli/src/remote/githubActions.ts`, `cli/src/config/model.ts`, `cli/src/core/writer.ts`, `cli/src/generators/githubWorkflows.ts`, `cli/src/commands/init.ts` and `cli/src/doctor/checks.ts`; the workflow templates, including the new `harness-control.yml`; `remote-run.sh` with its new `report`, `deliver` and `control` verbs; the watcher's `notify()`; and seven test suites, four of them new. In `plugin`: `user-review-fix-plan-writer.md` and the two flow documents. In `general`: the schema description, `ARCHITECTURE.md`, `ROADMAP.md`, `README.md`, `llms.txt` and the `docs/` set, including the new `docs/github-run-control.md`. 38 run-artifact files excluded from the reviewed diff.

The headline: the layering holds. Every new GitHub name has one owner, `cli/src/remote/githubActions.ts`, and its shell and YAML mirrors are declared in their own headers. The new workflow is gated on the existing `forgeTriggerApplies` and planned through the write engine with its re-run-table row. Every GitHub-side behaviour lives in `cli/templates/scripts/remote-run.sh` and reuses `harness-run-lib.sh` for configuration, protected branches and state paths. The plugin side only cites the shipped script by its `<scripts_dir>` destination and never executes it. Two Must Fix items remain, both in `cli/src`, and both re-spell a value that already has an owner. `init`'s new report line types a plugin-qualified slash command as a literal instead of building it in `cli/src/core/pluginIdentity.ts`. GitHub's pull-request setting name is spelled separately in `commands/init.ts` and in `doctor/checks.ts`, and the two copies already disagree on the settings path's arrows.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Build the `branch-user-review` command spelling in `core/pluginIdentity.ts` _(layer: cli)_
2. [x] **Finding 2** — Give GitHub's pull-request setting name and path one owner in `remote/githubActions.ts` _(layer: cli)_
3. [ ] **Finding 3** — Derive the forge check's verb list from `COMMAND_VERBS` _(layer: cli)_
4. [ ] **Finding 4** — Point the `user_reviews/` template README at the pull-request round's owner instead of restating it _(layer: cli)_

## Must Fix

### 1. Build the `branch-user-review` command spelling in `core/pluginIdentity.ts`
→ [finding_1.md](feat_forge_run_control_arch_review/finding_1.md)

### 2. Give GitHub's pull-request setting name and path one owner in `remote/githubActions.ts`
→ [finding_2.md](feat_forge_run_control_arch_review/finding_2.md)

## Should Fix

### 3. Derive the forge check's verb list from `COMMAND_VERBS`
→ [finding_3.md](feat_forge_run_control_arch_review/finding_3.md)

### 4. Point the `user_reviews/` template README at the pull-request round's owner instead of restating it
→ [finding_4.md](feat_forge_run_control_arch_review/finding_4.md)

## Nice to Have

None.
