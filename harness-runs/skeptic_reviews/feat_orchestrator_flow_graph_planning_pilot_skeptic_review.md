# Skeptic Review: feat_orchestrator_flow_graph_planning_pilot

## Context

**Branch:** `feat_orchestrator_flow_graph_planning_pilot`
**Date:** 2026-09-24

**What was reviewed.** The whole-branch diff against `dev`, reviewed adversarially. It covers:
- the walker `cli/templates/scripts/flow-walker.sh`, its gate library, and the graph;
- `hr_phase_enabled` in the shared library, and the `OUTER_LOOP_SCRIPTS` rows with their write policy;
- the rewritten planning core and its two forks and commands;
- the schema, the fixtures and `scripts/check-flow-graph.sh`;
- `docs/flow-graph-walker.md`.

31 run-artifact files excluded from the reviewed diff.

**How it was checked.** The walker was read against the pre-change core (`git show dev:plugin/instructions/task_plan_writing_instructions_core.md`), and each writer's and reviewer's real `## Output contract` was read. `bash scripts/check-flow-graph.sh` exits 0, and the four `scripts/` mirrors are byte-identical to their templates.

**De-duplicated against:**
- the committed code review `harness-runs/code_reviews/feat_orchestrator_flow_graph_planning_pilot_code_review.md`, with Findings 1–5, all applied;
- the plan-stage architecture reviews under `harness-runs/architecture_reviews/feat_orchestrator_flow_graph_planning_pilot/`.

No branch parity review exists, because `phases.parity` is `false`. No branch architecture review exists for this branch.

**Headline.** The walker reproduces the in-session loop faithfully. Two things around it do not hold, and one mapping table is ambiguous:
- **The upgrade path.** An existing adoption that re-runs `init` keeps its older `lib/harness-run-lib.sh`, because that file is written `create-if-absent`. The walker then refuses at the first `skipped` gate, and the only line shown blames `harness.config.json`.
- **Resuming a park raised in the UI-test-plan loop.** The new `## Setup` step 7 routes that resume back into the task-plan loop.
- **The `<outcome>` table.** It matches two rows for a writer return that carries questions.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 3** — Put the `questions` row first in the walker's `<outcome>` table and state first-match precedence _(layer: plugin)_
2. [x] **Finding 2** — Map **extend** to `ui_writer` in `## Setup` step 7 when the resumed answers were raised in the UI-test-plan loop _(layer: plugin)_
3. [x] **Finding 1** — Refuse a stale `lib/harness-run-lib.sh` at walker start with a line naming it, and record the cost _(layer: cli, general)_

---

## Must Fix

### 1. An upgraded adopter's re-run `init` keeps the old shared library, and the walker then refuses at the first gate with a message that blames `harness.config.json`
→ [finding_1.md](feat_orchestrator_flow_graph_planning_pilot_skeptic_review/finding_1.md)

### 2. `## Setup` step 7 maps **extend** to `plan_writer`, so resuming a park raised in the UI-test-plan loop re-enters the task-plan loop and sends the answers to the wrong writer
→ [finding_2.md](feat_orchestrator_flow_graph_planning_pilot_skeptic_review/finding_2.md)

---

## Should Fix

### 3. The walker's `<outcome>` table gives two rows for a writer return that carries both its summary block and a `## Questions` section
→ [finding_3.md](feat_orchestrator_flow_graph_planning_pilot_skeptic_review/finding_3.md)

---

## Nice to Have

_None._

---

## Intentional divergences that survived the two-leg test (call-outs, not fixes)

`phases.parity` is `false`, so there is no reference implementation to diverge from. One ordering choice was re-graded and holds: at the parity gate the run-mode skip is checked before the configuration skip (`docs/flow-graph-walker.md` → `## 3.`, third bullet). It matches the pre-change `### 2.`, which says "Before anything else in this step, re-read the run mode" before its `phases.parity` sentence.
