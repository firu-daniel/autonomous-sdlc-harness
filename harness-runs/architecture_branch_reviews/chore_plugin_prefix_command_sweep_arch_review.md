# Architecture review — chore_plugin_prefix_command_sweep

## Context

**Branch:** `chore_plugin_prefix_command_sweep`. **Date:** 2026-09-17. **Scope:** the branch diff against `dev`, 70 files. 21 run-artifact files were left out of the reviewed diff. The plan index `harness-runs/story_plans/chore_plugin_prefix_command_sweep_story_plan.md` was read only to understand what the branch set out to do.

**What the branch does.** It respells command names across `cli/`, `plugin/` and the root documents. It adds a measurement comment to the watcher template and copies that template byte-for-byte to `scripts/autonomous-watcher.sh`. It adds `{{pluginName}}` to the `.claude/CLAUDE.md` template. It also adds a hand-written gate script, `scripts/check-command-spelling.sh`, wired into `scripts/run-gates.sh` as 6d. `docs/development.md` §5 gate 6 is updated first, and that is the contract the script follows.

**Headline.** Almost all of the branch keeps to the layering:

- **Instruction cores:** no `plugin/instructions/*_core.md` file is touched, so rule 4 (cores are literal-free) still holds.
- **Placement and boundaries:** the watcher template and its adopted copy are identical. The new gate script sits beside `scripts/check-llms-txt.sh`, the existing hand-written gate, which is where it belongs. No import or shell `source` crosses the boundary between `cli/` and `plugin/`.
- **Template rendering:** the template takes the plugin name from `PLUGIN_NAME` through a render value, not a literal.

**One architecture violation, in the `cli` layer.** The new plugin-qualified analyze-command spelling is needed by four `cli/src` areas. Each area builds it separately, in five places, instead of taking it from one owner in `cli/src/core/`. To get the prefix, `detect/` gained a new runtime import from `generators/`, and those two areas now depend on each other.

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Give the plugin-qualified analyze command one owner in `cli/src/core/` and remove the new `detect/` → `generators/` import _(layer: cli)_

## Must Fix

### 1. The plugin-qualified analyze command is a cross-area value built in five places, and `detect/` now imports it from `generators/`
→ [finding_1.md](chore_plugin_prefix_command_sweep_arch_review/finding_1.md)

## Should Fix

_None._

## Nice to Have

_None._
