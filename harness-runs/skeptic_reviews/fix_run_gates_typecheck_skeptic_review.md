# Skeptic Review: fix_run_gates_typecheck

## Context

**Branch:** `fix_run_gates_typecheck`
**Date:** 2026-10-10
**Reviewed:** the whole-branch diff against `dev`, reviewed adversarially: 28 files. That covers the two-gate `run-test-suite.sh` (the template, and this repository's copy, confirmed byte-identical with `cmp`), the `COMMAND_NONE_SENTINEL` mirror note in `cli/src/config/model.ts`, the new cases in `cli/test/run-test-suite.test.mjs`, both orchestration cores, the four forks, the ledger templates, the supervised flows, `layer-implementer`, `unit_loop_core.md` → `## The test-run rule`, `test-fix-plan-writer`, and the CLI, `docs/` and state-directory descriptions. 23 run-artifact files excluded from the reviewed diff.
**De-duplicated against:** `harness-runs/code_reviews/fix_run_gates_typecheck_code_review.md` and its four findings, all `[x]`. No branch-level parity review exists, because `phases.parity` is `false`. No branch-level architecture review exists under `harness-runs/architecture_branch_reviews/` for this branch. Entries in `harness-runs/lessons.md` were treated as out of scope.

**Headline.** The wrapper is wired, and correct as far as these checks go:

- G.1 is its only caller, unchanged.
- The five marker lines it writes match `test-fix-plan-writer` → `## Process` step 1 byte for byte.
- The `<none>` sentinel is trimmed and never `eval`-ed.
- An unset `commands.typecheck` refuses with exit 2 before any file is written.
- A failing type check still runs the test.

Check 3 confirmed every claim in the diff that cites another source: the shell mirror `TYPECHECK_NONE_SENTINEL` that `model.ts` names, the "point 2" that `layer-implementer` and the autonomous fork cite in `## The test-run rule`, and the ledger ids `hr_ledger_phases` keys on, which are by id only. Check 2's parity leg is inert. The runtime-address leg has nothing to compose, because the branch adds no host, region or path assembly. One net-new finding remains. On a round where `commands.typecheck` is `<none>`, the `G` / `RG` ledger rows and their flip rules record a type check as passed when it never ran, which contradicts the cores' own `<none>` rule and the Done summary this branch rewrote.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom. The committing role flips each one to `[x]` as that fix's commit lands. `[ ]` markers anywhere else, such as sub-step bullets inside per-finding files, are informational only, and the committer never touches them. Each entry resolves to `harness-runs/skeptic_reviews/fix_run_gates_typecheck_skeptic_review/finding_<K>.md`.

1. [x] **Finding 1** — Make the `G` / `RG` ledger row text and both flip rules true when `commands.typecheck` is `<none>` _(layer: plugin)_

---

## Must Fix

None.

---

## Should Fix

### 1. The `G` / `RG` ledger rows record "printed pass for typecheck" on a round whose type check was `<none>` and never ran
→ [finding_1.md](fix_run_gates_typecheck_skeptic_review/finding_1.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

These are not fixes and do not appear in the Phase 2 Readiness list.

- **Verified-OK: "run both, report both".** The story plan decided against fail-fast, and Check 4 re-graded that choice. It has no reference behaviour to compare against (`phases.parity` is `false`), and no sibling precedent sets a different convention. The wrapper and G.5 both state the decision and its effect on `MAX_GATE_ROUNDS`, and the tests pin it ("both gates fail: `fail`, and the test still ran").
- **Verified-OK: a failing whole-tree type check outside the unit's change is a downgrade, not a blocker.** Check 3: everything the downgrade now names as "verified by the Run gates phase" is run by Phase G. That holds for `<test_cmd>`, the whole-tree `<typecheck_cmd>`, and a gate script either of them invokes (the last after code-review Finding 1's fix).
