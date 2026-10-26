# Code Review: feat_unit_tree_guards

## Context

**Branch:** `feat_unit_tree_guards`
**Date:** 2026-10-26
**Reviewed:** the whole branch diff against `dev`, taken as `origin/dev...HEAD` because this checkout has no local `dev` ref. 22 files across all three layers:
- **`cli`** — the `treeGuards` model field, `configuredTreeGuards` and the shape check (Task 1); the `tree-guards` doctor check and its frozen-id edit (Task 2); the two adopter conventions templates (Task 3); and the two new suites.
- **`plugin`** — `## The test-run rule` points 1, 3, 4, 7 and 8, plus the implementer, reviewer and planner pointers to it (Tasks 4–5 and the architecture-review fix).
- **`general`** — the schema with its negative fixture and `validate:config:negative` wiring (Task 6), `docs/cli.md` and `docs/config.md` (Task 7), and this repository's seeded `harness.config.json` (Task 8).

19 run-artifact files excluded from the reviewed diff.

**What holds up.** The CLI half is sound. The key lands in all four contract places: schema, model, check and `docs/config.md` §5. `configuredTreeGuards` is the only owner of the absent-key fallback, and its one consumer is the doctor check. The check sits after `layer-drift` in `CHECKS`, its id is frozen in `PRE_BRANCH_CHECK_IDS`, and it appears in the `docs/cli.md` §7 table.

**Tests.** Every accompanying test is present: `cli/test/config-tree-guards.test.mjs` asserts refusals on the bytes on disk, and `cli/test/doctor-tree-guards.test.mjs` covers the check. Both build fixtures under the system temp directory and neither spreads `process.env`. This review runs no suite; whether they pass is for the Run gates phase to establish.

**Other checks.**
- The changed-path commands point 7 prescribes, `git diff` and `git ls-files`, are already allow-listed in `cli/templates/claude/settings.autonomous.json`.
- The three seeded `covers` globs match the trees their tests actually read.
- Neither test the branch adds reads a tree, so it owes no registration of its own (point 8).
- Parity is off (`phases.parity: false`), so no parity review was done.

**Findings.** Seven, listed below.
- **Must Fix (Finding 1).** The rule's own downgrade clause would let the task prompt's first acceptance case be recorded as an evidence downgrade instead of fixed.
- **Should Fix (Findings 2–6).** Findings 2 and 3 are single-owner gaps left after the architecture-review fix. Finding 4 is a template rule that contradicts point 8. Finding 5 is a false `doctor` warning in `appDir`-scoped workspaces. Finding 6 is an uncovered documented branch.
- **Nice to Have (Finding 7).** A ragged header wrap.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom. The committing role flips each one to `[x]` when that fix's commit lands. `[ ]` markers anywhere else are informational only.

1. [x] **Finding 7** — Re-wrap the `check.ts` header's filesystem bullet _(layer: cli)_
2. [x] **Finding 2** — Add `docs/cli.md` to `## The test-run rule`'s citer roster _(layer: plugin)_
3. [x] **Finding 1** — Make point 7's downgrade clause match guard-relative paths and require point 2's symbol condition _(layer: plugin)_
4. [x] **Finding 4** — Align the adopter conventions template's registration rule with point 8's later-task allowance _(layer: cli)_
5. [x] **Finding 6** — Add the absolute-`test` case to `doctor-tree-guards.test.mjs` _(layer: cli)_
6. [ ] **Finding 3** — Re-point the `docs/config.md` §5 `treeGuards` row at points 7 and 8 instead of restating them _(layer: general)_
7. [ ] **Finding 5** — Try `appDir` as a base in the `tree-guards` doctor check _(layer: cli, general)_

---

## Must Fix

### 1. Point 7's downgrade clause lets the acceptance case slip through, because two of the three seeded guards print paths relative to their own root
→ [finding_1.md](feat_unit_tree_guards_code_review/finding_1.md)

---

## Should Fix

### 2. `docs/cli.md` now points at `## The test-run rule` but is missing from that section's closed citer roster
→ [finding_2.md](feat_unit_tree_guards_code_review/finding_2.md)

### 3. The `docs/config.md` §5 `treeGuards` row restates points 7 and 8 of the test-run rule, and its copy of point 8 already disagrees with the owner
→ [finding_3.md](feat_unit_tree_guards_code_review/finding_3.md)

### 4. The adopter conventions template requires same-change registration, which a single-layer task in a layered repository cannot satisfy and point 8 does not require
→ [finding_4.md](feat_unit_tree_guards_code_review/finding_4.md)

### 5. `tree-guards` never tries `appDir` as a base, so a guard relative to a package directory that is not itself a layer path gets a false warning
→ [finding_5.md](feat_unit_tree_guards_code_review/finding_5.md)

### 6. The `doctor-tree-guards` suite header promises the absolute-`test` rule, but no case covers it
→ [finding_6.md](feat_unit_tree_guards_code_review/finding_6.md)

---

## Nice to Have

### 7. The `check.ts` header's "What it deliberately does not re-implement" bullet was left with a ragged wrap
→ [finding_7.md](feat_unit_tree_guards_code_review/finding_7.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from and this section has no entries.
