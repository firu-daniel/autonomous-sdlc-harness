# Code Review: feat_run_gates_phase

**Context.** Branch `feat_run_gates_phase`, reviewed 2026-09-27 against `dev` (`defaultBranch`) with `git diff dev...HEAD`: 67 files, +1284 / −152, covering all 23 tasks of the story index. The branch adds the Run gates phase: the `run-test-suite.sh` wrapper with its `OUTER_LOOP_SCRIPTS` row and behaviour suite, four new run-artifact directories plus the `test_run_logs` ignore rule, `## The test-run rule` and row `G.4` in the unit loop, the `test-fix-plan-writer` agent, `architecture-reviewer` insertion point 4, `## Phase G — Run gates` in the task-engine core (cited by reference from the user-review fix core), the `G.` / `RG.` ledger entries, the fork, command, supervised-flow and flow-document wiring, the self-adoption mirrors, and gate 6a's log exclusion. 32 run-artifact files excluded from the reviewed diff. Pass 0: the grep-sweep list is an unfilled stub, so half (a) found nothing. Half (b) found no new exported TypeScript symbol. Every new contract has a dispatcher or citer: `test-fix-plan-writer` is dispatched from G.2, `run-test-suite.sh` is invoked from G.1 and the three supervised statistics points, and `## The test-run rule` is cited by exactly its 16-member roster. Tests: the wrapper is covered by `cli/test/run-test-suite.test.mjs` plus new cases in `outer-loop-scripts`, `init` and `doctor`. Nothing here claims a suite verdict, because this review runs no suite. Parity: `phases.parity` is `false`, so no parity review applies. Headline: the phase is coherent end to end, with no Must Fix. The most significant gap is that the wrapper allows two concurrent runs of the same label, which a re-entered Phase G can trigger. The rest are stale enumerations and paraphrases in durable text.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 6** — Give the self-adopted `scripts/run-test-suite.sh` the 0755 mode `init` writes _(layer: general)_
2. [ ] **Finding 5** — Correct the log-path shape in `test-fix-plan-writer.md` to the sanitized branch directory _(layer: plugin)_
3. [ ] **Finding 4** — Fix the `item_<N>` numbering claim in the `test_fix_point_reviews` README and its mirror _(layer: cli, general)_
4. [ ] **Finding 3** — Replace the three blanket "no test run" paraphrases with the rule's own scope _(layer: plugin)_
5. [ ] **Finding 2** — Name `RG` in the user-review fix-plan fork's ledger enumerations _(layer: plugin)_
6. [ ] **Finding 1** — Refuse a second concurrent run of the same label in `run-test-suite.sh` _(layer: cli, plugin, general)_

## Must Fix

_None._

## Should Fix

### 1. `run-test-suite.sh` starts a second concurrent run of a label whose first run is still live
→ [finding_1.md](feat_run_gates_phase_code_review/finding_1.md)

### 2. The user-review fix-plan fork still enumerates its ledger entries as `R1–R5` / `R3–R5`, without `RG`
→ [finding_2.md](feat_run_gates_phase_code_review/finding_2.md)

### 3. Three test-run-rule paraphrases forbid every test run, contradicting the rule's own-test-file allowance
→ [finding_3.md](feat_run_gates_phase_code_review/finding_3.md)

### 4. The `test_fix_point_reviews` README says `item_<N>` carries the finding number; row `G.4` keys it by walk position
→ [finding_4.md](feat_run_gates_phase_code_review/finding_4.md)

### 5. `test-fix-plan-writer.md` states the log path with a raw `<branch>` directory; the wrapper writes a sanitized one
→ [finding_5.md](feat_run_gates_phase_code_review/finding_5.md)

### 6. The self-adopted `scripts/run-test-suite.sh` is tracked at mode 0644; `init` writes it 0755
→ [finding_6.md](feat_run_gates_phase_code_review/finding_6.md)

## Nice to Have

_None._

## Intentional divergences / call-outs

_None — `phases.parity` is `false`, so there is no reference implementation to diverge from._
