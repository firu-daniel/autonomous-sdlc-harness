# Architecture review — feat_unit_tree_guards

## Context

Branch `feat_unit_tree_guards`, reviewed 2026-10-26 against `dev` (diffed as `origin/dev...HEAD`, because no local `dev` ref exists in this checkout). The review covered 22 files across all three configured layers: `cli` (`cli/src/config/model.ts`, `cli/src/config/check.ts`, `cli/src/doctor/checks.ts`, two adopter conventions templates, two new suites, and one edited suite), `plugin` (`unit_loop_core.md` → `## The test-run rule`, five agent definitions, and `AUTONOMOUS_FLOW.md`), and `general` (the schema, a negative fixture with its `validate:config:negative` wiring, `docs/cli.md`, `docs/config.md`, and this repository's `harness.config.json`). 15 run-artifact files excluded from the reviewed diff.

Headline: the CLI half is placed correctly. The new key lands in the schema, model, check, and docs in that order. `configuredTreeGuards` is the single owner of the absent-key fallback. The `doctor` check sits in `CHECKS`, and its id is frozen in `PRE_BRANCH_CHECK_IDS`. Both new suites build their fixtures under the system temp directory. No import crosses from `cli/` into `plugin/`. The plugin half has one ownership defect. The rule that a tree-reading test must register itself in `treeGuards` has no owning section. Four agent definitions each state it in their own words and at different severities. Three of them cite `## The test-run rule` point 7 as the rule's home, but point 7 does not contain it.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — The tree-guard registration rule has no owner; four agents restate it and cite a point that does not carry it _(layer: plugin)_
2. [x] **Finding 2** — `docs/config.md` §5's repo-relative paragraph still lists two exceptions, not three _(layer: general)_

## Must Fix

### 1. The tree-guard registration rule has no owner; four agents restate it and cite a point that does not carry it
→ [finding_1.md](feat_unit_tree_guards_arch_review/finding_1.md)

## Should Fix

### 2. `docs/config.md` §5's repo-relative paragraph still lists two exceptions, not three
→ [finding_2.md](feat_unit_tree_guards_arch_review/finding_2.md)
