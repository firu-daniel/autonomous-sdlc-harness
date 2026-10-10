# Code Review: fix_run_gates_typecheck

## Context

**Branch:** `fix_run_gates_typecheck`
**Date:** 2026-10-10
**Reviewed:** the whole branch diff against `dev`, 28 files: the two-gate `run-test-suite.sh` (template and this repository's byte-identical copy) and the `COMMAND_NONE_SENTINEL` mirror note in `cli/src/config/model.ts` (Task 1); the new cases in `cli/test/run-test-suite.test.mjs` (Task 2); the CLI-side, `docs/` and state-directory descriptions (Tasks 3, 11, 12); both orchestration cores, the four forks, the ledger templates, the supervised flows, the flow documents and the semi-autonomous command docs (Tasks 4, 5, 7, 9, 10); `layer-implementer` and `unit_loop_core.md` → `## The test-run rule` (Task 6); `test-fix-plan-writer` (Task 8). 18 run-artifact files excluded from the reviewed diff.

The wrapper does what the story plan decided. It makes one call per round and runs typecheck first, then test. The test runs even after a failing typecheck. The `<none>` sentinel is matched after trimming and never `eval`-ed, an unset `commands.typecheck` gets its own exit-2 refusal, and the log carries the five marker lines byte-exact. Those marker lines match `test-fix-plan-writer` → `## Process` step 1 and `cli/templates/state-dir/test_run_logs/README.md`. The scripts/state-directory copies are byte-identical to their templates. Every case the task prompt's goal 7 lists is pinned in the test file, so the required tests are present. Whether they pass is the Run gates phase's to establish, because this review runs no suite. The old single-gate phrases ("test-suite wrapper printed pass", "runs the configured test command once", "the only place in the flow `<test_cmd>` runs" on its own) no longer appear anywhere in `plugin/`, `docs/`, `cli/` or `schemas/`. Pass 0's grep half has no regexes configured, and its caller check found no new exported symbol: the only `cli/src` change is a doc comment. `phases.parity` is `false`, so no parity cross-check ran. Four findings remain. Finding 1 is a false record the implementer contract now prescribes.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top to bottom, and the committing role flips each one to `[x]` as that fix's commit lands. `[ ]` markers anywhere else, such as the sub-step bullets inside per-finding files, are informational only, and the committer never touches them. Each entry resolves to `harness-runs/code_reviews/fix_run_gates_typecheck_code_review/finding_<K>.md`.

1. [x] **Finding 4** — Rename the residual "test-suite wrapper" in the log README pair and say "once per Run gates round" in `docs/watcher.md` _(layer: cli, general)_
2. [x] **Finding 2** — Replace the bare `G` placeholder in both cores' Done-summary Run gates bullet with `<gates_covered>` _(layer: plugin)_
3. [x] **Finding 1** — Count a gate script that `<test_cmd>` or `<typecheck_cmd>` invokes as deferred to the Run gates phase, not as "no phase runs it" _(layer: plugin)_
4. [ ] **Finding 3** — Pin the wrapper's whitespace trim on the `<none>` sentinel with a padded-sentinel case _(layer: cli)_

---

## Must Fix

### 1. `layer-implementer` tells a unit to record a gate script that `<test_cmd>` runs as "no phase of this flow runs it"
→ [finding_1.md](fix_run_gates_typecheck_code_review/finding_1.md)

---

## Should Fix

### 2. The Done-summary Run gates bullet uses a bare `G` as a placeholder, and that letter is also the phase's name
→ [finding_2.md](fix_run_gates_typecheck_code_review/finding_2.md)

---

## Nice to Have

### 3. The wrapper's whitespace trim on the `<none>` sentinel has no test
→ [finding_3.md](fix_run_gates_typecheck_code_review/finding_3.md)

### 4. Two descriptions still call the two-gate wrapper the "test-suite" wrapper or say it runs once per phase
→ [finding_4.md](fix_run_gates_typecheck_code_review/finding_4.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

These are not fixes and do not appear in the Phase 2 Readiness list. `phases.parity` is `false`, so this repository has no reference implementation to diverge from, and the section is empty.
