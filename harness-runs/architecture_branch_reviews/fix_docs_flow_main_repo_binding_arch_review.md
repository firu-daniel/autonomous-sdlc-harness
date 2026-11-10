# Architecture review — fix_docs_flow_main_repo_binding

## Context

Branch `fix_docs_flow_main_repo_binding`, reviewed 2026-11-10 against `origin/dev`. The dispatch named `dev` as the base, but this run copy has no local `dev` ref, so the remote-tracking ref of the same branch was used. Reviewed: the 12 changed files, 11 prose contracts under `plugin/` (one agent, two commands, one flow document and seven instruction files) and one tree-guard suite under `cli/test/`. Each was read from its diff hunks against `.claude/context/conventions.md`, `.claude/context/plugin.md`, `.claude/context/cli.md` and `harness-runs/lessons.md`. 9 run-artifact files excluded from the reviewed diff.

Headline: the layering is sound. Every edit lands in the layer whose `layers[].path` owns it. The new `<MAIN_REPO>` rows sit in each file's own `## Resolved values` table. No mode-free core gains a literal, and no fork-to-fork citation is introduced. `plugin/docs/AUTONOMOUS_FLOW.md` and `plugin/instructions/docs_phase_instructions.md` cite the section that spells the push rather than restating it. The `cli/test/` suite reads `plugin/` files as text, the same established tree-guard pattern its existing rows use, and adds no runtime coupling between the two shipped halves. There is no Must Fix. One Should Fix is outside the architecture lens: a token-declaration gap in the docs engine command.

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Declare `<repo_root>` in `branch-start-docs-autonomous.md`'s `## Resolved values` table _(layer: plugin)_

## Must Fix

_None._

## Should Fix

### 1. Declare `<repo_root>` in `branch-start-docs-autonomous.md`'s `## Resolved values` table
→ [finding_1.md](fix_docs_flow_main_repo_binding_arch_review/finding_1.md)

## Nice to Have

_None._
