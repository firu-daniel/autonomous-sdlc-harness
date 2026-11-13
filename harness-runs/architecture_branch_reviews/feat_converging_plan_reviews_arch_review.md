# Architecture review — feat_converging_plan_reviews

## Context

Branch `feat_converging_plan_reviews`, reviewed 2026-11-13 in implemented-solution mode against `dev` (this run copy carries no local `dev` ref, so the diff was taken against `origin/dev`, the remote-tracking ref of the same branch). Reviewed: the 79 changed files outside the run artifacts, in five segments — the outer-loop script templates and their self-adopted copies (`cli/templates/scripts/`, `scripts/`), the state-directory generator row and run-artifact READMEs (`cli/src/generators/stateDir.ts`, `cli/templates/state-dir/`, `harness-runs/*/README.md`), the `cli/test/` suites, the plugin contracts (`plugin/agents/`, `plugin/commands/`, `plugin/instructions/`, `plugin/docs/`), and the `general` layer (`schemas/`, `docs/`, `package.json`, `ROADMAP.md`, `README.md`). 47 run-artifact files excluded from the reviewed diff. Headline: the layering holds — the new run-artifact directory enters through `STATE_DIR_ENTRIES` with its template README and an `init` assertion, the new negative schema fixture and the new check fixture are wired into `package.json`, the self-adopted scripts match their templates, no shipped half reaches into the other at run time, and both new suites open on their rule. The one class of violation is the new shared instruction module `plugin/instructions/plan_review_rounds.md`: two plugin assets cite it without being on its `## Who may cite this` roster, which the module itself declares closed.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Add `plan_orchestration_instructions_autonomous.md` to the `plan_review_rounds.md` citer roster _(layer: plugin)_
2. [x] **Finding 2** — Add `user_review_fixes_instructions_autonomous.md` to the `plan_review_rounds.md` citer roster _(layer: plugin)_

## Must Fix

### 1. `plan_orchestration_instructions_autonomous.md` cites `plan_review_rounds.md` but is missing from its roster
→ [finding_1.md](feat_converging_plan_reviews_arch_review/finding_1.md)

### 2. `user_review_fixes_instructions_autonomous.md` cites `plan_review_rounds.md` but is missing from its roster
→ [finding_2.md](feat_converging_plan_reviews_arch_review/finding_2.md)
