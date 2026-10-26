# Skeptic Review: feat_unit_tree_guards

## Context

**Branch:** `feat_unit_tree_guards`, reviewed 2026-10-26.

**What was reviewed.** The whole-branch diff, 22 files across `cli`, `plugin` and `general`. It was diffed as `origin/dev...HEAD` because this checkout has no local `dev` ref. 27 run-artifact files excluded from the reviewed diff.

**De-duplicated against:**
- the committed code review (`harness-runs/code_reviews/feat_unit_tree_guards_code_review.md`, Findings 1–7);
- the architecture branch review (`harness-runs/architecture_branch_reviews/feat_unit_tree_guards_arch_review.md`, Findings 1–2).

No parity review exists, because `phases.parity` is `false`.

**Checks that held:**
- **Check 1, wiring.** `TREE_GUARDS_CHECK` is in `CHECKS` and its id is frozen in `PRE_BRANCH_CHECK_IDS`. `configuredTreeGuards` has its consumer. `layer-implementer` runs point 7 and reports its result.
- **The permission claim.** The two changed-path commands are allow-listed in `cli/templates/claude/settings.autonomous.json` as `Bash(git diff:*)` and `Bash(git ls-files:*)`. The guard run uses the same `<test_file_cmd>` string a unit already runs.
- **Check 3, citations.** Every citation the branch adds resolves: points 7 and 8 exist, and the roster includes `docs/config.md` and `docs/cli.md`.
- **The `config set` remedy.** The `doctor` remedy `config set treeGuards '<json>'` parses JSON values.

**Headline conclusion.** One net-new Must Fix. The task prompt's claim that the three seeded guards are *"the only tests under `cli/test/` that walk a repository tree"* is false. `cli/test/watcher-main-anchor.test.mjs` reads the whole `cli/templates/scripts/` tree as text, and it is not registered.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Register `watcher-main-anchor.test.mjs` as a fourth tree guard over `cli/templates/scripts/**` _(layer: general)_

---

## Must Fix

### 1. The seeded `treeGuards` list omits `watcher-main-anchor.test.mjs`, a fourth test that reads the whole `cli/templates/scripts/` tree as text
→ [finding_1.md](feat_unit_tree_guards_skeptic_review/finding_1.md)

---

## Should Fix

None.

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from. No divergence in the diff is marked intentional, so this section has no entries.
