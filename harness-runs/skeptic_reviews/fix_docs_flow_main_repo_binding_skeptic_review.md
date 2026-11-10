# Skeptic Review: fix_docs_flow_main_repo_binding

## Context

**Branch:** `fix_docs_flow_main_repo_binding`
**Date:** 2026-11-10

**Diff base.** This run copy has no local `dev` ref, so the whole-branch diff was taken against `origin/dev`. It covers 12 files: 11 prose contracts under `plugin/` and the extended `cli/test/main-repo-resolution-corpus.test.mjs`. 14 run-artifact files excluded from the reviewed diff.

**De-duplicated against:**
- the code review `harness-runs/code_reviews/fix_docs_flow_main_repo_binding_code_review.md` (Findings 1–2), with its findings folder
- the architecture review `harness-runs/architecture_branch_reviews/fix_docs_flow_main_repo_binding_arch_review.md` (Finding 1)
- `harness-runs/lessons.md`

No parity review exists, because `phases.parity` is `false`.

**Headline conclusions.**
- **Check 1 (is every new citation used and resolvable?).**
  - Every `<MAIN_REPO>` binding the plan claims is present.
  - `git grep` for `<MAIN_REPO>` under `plugin/` and `cli/templates/` turns up no binder beyond the 14 row binders, the screen, the resolution module and the exempt supervised and `qa-tester` sites.
  - No push spelling other than `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>` remains. There is no prefixed spelling, no `$` argument, and no resolved `scripts/` literal.
- **Check 3 (do the new pointers resolve?).** Each new pointer was opened and resolves:
  - the committer's "step 6", which `ui_test_pass` step h also reuses
  - `AUTONOMOUS_FLOW.md` → `## The wiring table`, the "Git wrappers" row
  - each "per its `## Resolved values` row"
  - the screen's "citing engine command … own `## Resolved values` row". All three engine commands that cite the screen now carry the row.
- **Suite status.** The suite passes 6 of 6 when run with `node --test`.

One net-new Should Fix remains. The regression guard finds `<MAIN_REPO>` binders only through the resolution clause. A future row that inherits the value, shaped like the screen's row, and omits the literal-spelling sentence passes every case. Goal 4 asks the guard to catch exactly that.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Make the corpus suite require the literal-spelling sentence in every file with a `<MAIN_REPO>` table row, the resolution module excepted _(layer: cli)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The guard only checks `<MAIN_REPO>` binders that carry the resolution clause. A new `<MAIN_REPO>` row that inherits the value and omits the literal-spelling sentence passes every case
→ [finding_1.md](fix_docs_flow_main_repo_binding_skeptic_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this section has no reference-implementation divergences.
