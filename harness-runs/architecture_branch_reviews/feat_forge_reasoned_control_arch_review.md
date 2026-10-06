# Architecture review — feat_forge_reasoned_control

## Context

Branch `feat_forge_reasoned_control`, reviewed 2026-10-07 against `dev` (`git diff dev...HEAD`), in implemented-solution mode, with `harness-runs/story_plans/feat_forge_reasoned_control_story_plan.md` read for intent only. What was reviewed: 24 changed files in four segments: `cli/src` (`remote/githubActions.ts`, `doctor/checks.ts`, `commands/init.ts`); `cli/templates` (`scripts/remote-run.sh`, `github/workflows/harness-control.yml`) with their `cli/test` suites; the new `plugin` command `plugin/commands/harness-read-mention.md` and its instruction file `plugin/instructions/mention_reading.md`, plus the plugin READMEs and the whiteboard; and the `general` documents of record. 19 run-artifact files excluded from the reviewed diff. The rules applied come from `.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md` and `harness-runs/lessons.md`.

Headline: the layering is mostly sound.
- The mention names have one owner, `cli/src/remote/githubActions.ts`. `remote-run.sh` mirrors them, the mirror is declared in its header, and `remote-names.test.mjs` checks it byte for byte.
- `doctor` grades the workflow text through a pure helper the names module owns, and `init` only reports.
- The judgement lives in `plugin` as a slash command plus an instruction file. The `cli` template launches that command by name, the same way the watcher launches the plugin's commands, and nothing is imported or sourced across the boundary.

Two placement defects block:
- The mention session's model is fixed in the script instead of being read from `agentModel`, which already owns that value.
- The two new shipped plugin assets cite this repository's own adoption documents (`.claude/context/*.md`) as the source of a rule.

One non-blocking item: `ARCHITECTURE.md`'s engine-launch inventory does not list the new launch site.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Read the mention session's model from `agentModel`, not a frozen `MENTION_MODEL='sonnet'` _(layer: cli)_
2. [x] **Finding 2** — Shipped plugin assets cite this repository's `.claude/context/*.md` as rule sources _(layer: plugin)_
3. [ ] **Finding 3** — `ARCHITECTURE.md`'s engine-launch inventory omits the mention session `remote-run.sh` now launches _(layer: general)_

## Must Fix

### 1. Read the mention session's model from `agentModel`, not a frozen `MENTION_MODEL='sonnet'`
→ [finding_1.md](feat_forge_reasoned_control_arch_review/finding_1.md)

### 2. Shipped plugin assets cite this repository's `.claude/context/*.md` as rule sources
→ [finding_2.md](feat_forge_reasoned_control_arch_review/finding_2.md)

## Should Fix

### 3. `ARCHITECTURE.md`'s engine-launch inventory omits the mention session `remote-run.sh` now launches
→ [finding_3.md](feat_forge_reasoned_control_arch_review/finding_3.md)

## Nice to Have

_None._
