# Code Review: fix_run_gates_answered_park_resume

## Context

**Branch:** `fix_run_gates_answered_park_resume`
**Date:** 2026-10-23
**Reviewed:** the whole branch diff against the default branch `dev`. No local `dev` ref exists in this checkout, so the base is `origin/dev`. The diff covers 13 files:
- the `test-fix-plan-writer` answer-mode contract (Task 1);
- the `<park_answer_lookup>` vocabulary row and the count-free must-not bullet (Task 6);
- the task-flow forks' binding rows and the Override 2(a) Phase G exclusion (Task 3);
- the user-review fix forks, their core's declaration and the fix-plan fork's Override 2(a) (Task 4);
- Phase G's G.0 pending-answer arm, and the G.1/G.2/G.3/G.5, stop-condition and must-not edits (Task 2);
- the `cli/test/run-gates-park-answer.test.mjs` source guard, and the `test_fix_plans/` and `clarifications/` README templates (Task 5).

The review also includes the architecture-review fix already on the branch (`1690af15`). 17 run-artifact files were excluded from the reviewed diff. Per-unit review was off for this run, so Pass 2 had nothing to reconcile.

The G.0 decision is sound on the tree. I traced the straight-through, crash-mid-revision, answer-mode `## Questions` / gate-cap, no-code-change and later-round paths, and each reaches the outcome the story index states. `MAX_GATE_ROUNDS` still counts only gate runs, and the semi-autonomous `none` binding leaves those flows unchanged. The new source guard pins the clause, the marker, the origin and the lookup across the files that write and read them. Whether it passes is for the Run gates phase to establish: that phase has not run yet (`G` is `[ ]`), and this review runs no suite. `phases.parity` is `false`, so no parity cross-check applies.

Two findings block the branch's own goal:
- **Finding 1:** the lookup command itself aborts under zsh in the exact first-park case the branch exists to fix.
- **Finding 2:** an answer-authorised sandbox fix is still forbidden by the implementer's own definition at G.4.

The other two findings are wording defects left by the compression pass on `test-fix-plan-writer`.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom, and the committer flips each one to `[x]` as that fix's commit lands. **Only the committing role flips a marker.** That is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else, such as sub-step bullets inside the per-finding files, are informational progress markers for the implementer only. They are never the iteration source, and the committer does not touch them.

Each entry resolves to a self-contained `harness-runs/code_reviews/fix_run_gates_answered_park_resume_code_review/finding_<K>.md` through its `**Finding K**` reference. The leading `N.` is the fix order. `K` is the finding's stable identity.

1. [x] **Finding 4** — Restore the blank line above `## Read on demand` in `test-fix-plan-writer` _(layer: plugin)_
2. [ ] **Finding 3** — Replace "implementable from alone" with "self-contained" in `test-fix-plan-writer` step 6 _(layer: plugin)_
3. [ ] **Finding 1** — Make the `<park_answer_lookup>` command glob-free (recursive `grep --include`) in both autonomous forks and the test pin _(layer: cli, plugin)_
4. [ ] **Finding 2** — Let an `**Authorised by:**` line lift `layer-implementer`'s sandbox-avoidance rule, word-count neutral _(layer: plugin)_

---

## Must Fix

### 1. The `<park_answer_lookup>` command aborts under zsh when either glob matches nothing, so the answered `fixable: 0` park goes undetected
→ [finding_1.md](fix_run_gates_answered_park_resume_code_review/finding_1.md)

### 2. An answer-authorised sandbox fix reaches a G.4 implementer whose own definition still forbids it outright
→ [finding_2.md](fix_run_gates_answered_park_resume_code_review/finding_2.md)

---

## Should Fix

### 3. The compressed per-finding-file rule in `test-fix-plan-writer` reads "implementable from alone"
→ [finding_3.md](fix_run_gates_answered_park_resume_code_review/finding_3.md)

---

## Nice to Have

### 4. The **Answer mode.** paragraph runs straight into the `## Read on demand` heading with no blank line
→ [finding_4.md](fix_run_gates_answered_park_resume_code_review/finding_4.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

These are NOT fixes and do NOT appear in the Phase 2 Readiness list. `phases.parity` is `false`, so there is no reference-implementation divergence to call out.

- **Verified-OK — the `test-fix-plan-writer` word count.** The definition is 2315 words at `origin/dev` and 2315 words at `HEAD`, so the branch keeps `.claude/context/plugin.md` → `## Writing agent prose`'s no-rise rule. Findings 3 and 4 keep it too.
- **Verified-OK — binding-table invariant.** `<park_answer_lookup>` is in `mode_contract.md` → `## Binding vocabulary`. Both cores that run Phase G (one directly, one by reference) declare it, and all four forks bind it: the two autonomous forks to a command, the two semi-autonomous forks to `none`. No binding count survives in the family-1 core.
- **Verified-OK — no line coordinates and no machine paths** were added to any plugin or cli file (an added-lines sweep over `plugin` and `cli`).
