# Architecture review — fix_run_gates_answered_park_resume

## Context

Branch `fix_run_gates_answered_park_resume`, reviewed 2026-10-23 against the diff base `dev`. This run copy has no local `dev` ref, so the diff base was resolved as `origin/dev`. Reviewed: the branch diff over 13 files in two layers. In `plugin`: `plugin/agents/test-fix-plan-writer.md`, `plugin/instructions/mode_contract.md`, the family-1 core and both of its forks, the family-3 core and both of its forks, and the autonomous forks of families 2 and 4. In `cli`: `cli/templates/state-dir/clarifications/README.md`, `cli/templates/state-dir/test_fix_plans/README.md` and the new suite `cli/test/run-gates-park-answer.test.mjs`. 15 run-artifact files excluded from the reviewed diff.

Headline: the layering holds, with one exception. Every new file and edit lands in the layer its kind belongs to. The new `<park_answer_lookup>` binding goes through the mechanism `plugin/instructions/mode_contract.md` prescribes: a vocabulary row, a declaration in both cores, inline values in all four forks, and no clarification path in the mode-free core. The one new fork→fork citation is the clarification-channel citation, which is class (i-b) of `### Sanctioned cross-fork anchors`. The self-adopted copies under `harness-runs/` were left for an `init --force` chore. The `cli` source guard follows existing precedent and justifies itself in its header. The exception is the single-owner rule. G.0's mode-free consumption rule (which Phase G pairs G.0 consumes, which ones no agent reads, and which arm the resumed phase takes) is restated in four autonomous forks instead of being cited from the core, and those copies already differ from the core.

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — Autonomous forks restate the core G.0's Phase G consumption rule instead of citing it _(layer: plugin)_

## Must Fix

### 1. Autonomous forks restate the core G.0's Phase G consumption rule instead of citing it
→ [finding_1.md](fix_run_gates_answered_park_resume_arch_review/finding_1.md)
