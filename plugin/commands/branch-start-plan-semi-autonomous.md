---
description: Drive the plan-writer and plan-reviewer agents to convergence on the current branch's task prompt, then produce the matching UI-test plan.
---

# Scope: Start a plan for the current branch's task prompt (semi-autonomous variant)

## Resolved values

The tokens below are not ordinary **path placeholders** (`<branch>`, `<N>`, which this file's own text resolves): they resolve from the adopting repository's `harness.config.json`. They are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<parity_vocabulary>` / `<reference_impl>` | config value | `parity.referenceName` / `parity.referenceImplPath` — the name of the reference implementation this project is kept in parity with, and the path to it. Read **only** when `phases.parity` is `true`. |

---

## Context

This is the **semi-autonomous** variant of `/autonomous-sdlc-harness:branch-start-plan`. The supervised variant has you draft the plan inline and ask clarification questions yourself; this variant dispatches a `task-plan-writer` agent that writes the plan, an `architecture-reviewer` agent that gates the plan for architecture compliance (catching layer-placement / dependency-direction issues in the plan before any code is written), and a `task-plan-reviewer` agent that meta-reviews it before you present anything to the user. The architecture gate runs ahead of the structural `task-plan-reviewer`; the loop runs without user input (up to 5 iterations) unless the writer surfaces a clarification question.

A fourth agent, `business-parity-reviewer`, gates the plan for business-logic parity with `<reference_impl>` — catching contract, threshold and predicate deviations before any code is written — and it runs **ahead of** the architecture gate. **Skip this phase unless `phases.parity` is `true` in `harness.config.json`.**

The output is a **thin story index** at `<state_dir>/story_plans/<branch>_story_plan.md` (Context + Phase 2 Readiness list) plus one **self-contained per-task file** at `<state_dir>/task_plans/<branch>/task_<N>_plan.md` per readiness entry. Consumers read only their slice; the writer authors the whole set in one pass so cross-task coherence holds.

After the task plan converges, this flow also produces a **UI-test plan** — a thin index at `<state_dir>/ui_test_plans/<branch>_ui_test_plan.md` plus one **self-contained per-test file** at `<state_dir>/ui_test_plans/<branch>/ui_test_<N>.md` per readiness entry — via a `ui-tests-plan-writer` agent meta-reviewed by `ui-tests-plan-reviewer` (same writer/reviewer loop shape). The QA phase of `/autonomous-sdlc-harness:branch-implement-plan-semi-autonomous` consumes this UI-test plan to drive browser QA during implementation. **Skip this phase unless `phases.qa` is `true` in `harness.config.json`.**

You are the **orchestrator** for this phase. You do not draft the plan and you do not review it.

**Skip the parity framing unless `phases.parity` is `true` in `harness.config.json`.** When it is on, this project is kept in parity with `<reference_impl>` — the `<parity_vocabulary>` reference implementation — whose business logic and service contracts are the source of truth and must be matched exactly, unless the prompt asks for something different or the reference is demonstrably wrong; that constraint is what the writer and the parity reviewer are checking against.

## Steps

1. **Determine the current git branch** with `git branch --show-current`.

2. **Confirm the task prompt exists** at `<state_dir>/task_prompts/<branch>_task_prompt.md`, **and establish its run mode**. If missing, stop and tell the user. Having confirmed it exists, run `grep -nE '^#+ *Run mode' <state_dir>/task_prompts/<branch>_task_prompt.md`. **No hit → this run has no run mode**: carry `none` into the loop below, emit `📌 Run mode: none` at the disclosure site, and do not open `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md`. **A hit →** read `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` and follow it; it owns everything else, and none of it is restated here.

3. **Read `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_semi_autonomous.md`** and follow it. That file is this flow's **fork**: it carries the mode-specific binding values — including `<terminal_handoff>`, the "Present to user" hand-off and its approval gate — and runs the shared core by reference. **The canonical loop — Setup, the safety contract, writer/reviewer dispatch, the iteration caps, clarification handling and the convergence facts — is `task_plan_writing_instructions_core.md`.** Enter through the fork; do not duplicate or reinterpret either here.

## Note

Plan implementation happens in a **separate session** via `/autonomous-sdlc-harness:branch-implement-plan-semi-autonomous`, which keys on the story index existing at `<state_dir>/story_plans/<branch>_story_plan.md`. Do not auto-proceed. The UI-test plan at `<state_dir>/ui_test_plans/<branch>_ui_test_plan.md`, where one was produced, comes out of this same planning session and is consumed by that command's QA phase — no separate step is needed to generate it.
