---
description: Draft the plan for the current branch's task prompt — a thin story index plus one self-contained per-task file per readiness entry — and write it only after the user approves.
---

# Scope: Start a plan for the current branch's task prompt

## Resolved values

The tokens below are not ordinary **path placeholders** (`<branch>`, `<N>`, which this file's own text resolves): they resolve from the adopting repository's `harness.config.json`. They are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<layer_names>` | config value | `layers[].name` — the values a readiness entry's `_(layer: …)_` tag carries. **No substitution of the names themselves**: the configured names travel through this flow unchanged. `general` is one of the `layers[]` rows a generated config emits (`{ "name": "general", "path": ".", "conventions": … }`), not an entry beside the array. |
| `<layer_path_map>` | config value | `layers[].path` together with `layers[].conventions` — the code each layer owns, and the rules document to read before planning work in it. |
| `<parity_vocabulary>` / `<reference_impl>` | config value | `parity.referenceName` / `parity.referenceImplPath` — the name of the reference implementation this project is kept in parity with, and the path to it. Read **only** when `phases.parity` is `true`. |

---

## Context

The task prompt on this branch states a change to make to this project. Plan it before any code is written: the plan is the spec the implementation loop executes.

**Skip the parity framing unless `phases.parity` is `true` in `harness.config.json`.** When it is on, this project is kept in parity with `<reference_impl>` — the `<parity_vocabulary>` reference implementation — whose UX and business logic are the source of truth: follow them strictly, and deviate only where the prompt asks for something different, or where the reference is demonstrably wrong.

## Steps

1. **Determine the current git branch** with `git branch --show-current`.

2. **Read the task prompt** at `<state_dir>/task_prompts/<branch>_task_prompt.md` to get the requirements.

3. **Check whether a plan already exists** by testing for the **story index** at `<state_dir>/story_plans/<branch>_story_plan.md`.
   - If yes: present the existing plan (the story index's readiness list + the per-task files under `<state_dir>/task_plans/<branch>/`) to the user and ask whether to **extend it** (add missing tasks), **rewrite from scratch** (the existing one is wrong/stale), or **stop** (the existing plan is good — just run `/autonomous-sdlc-harness:branch-implement-plan` next). Do not silently overwrite.
   - If no: continue.

4. **Apply the project's own standards before looking at any code.** For each layer in `<layer_path_map>`, its `layers[].conventions` value names that layer's rules document — the document `init` generates at that configured path (conventionally under `.claude/context/`). Read the document of every layer this prompt reaches, and treat its content as authoritative rather than re-deriving the rules from memory; the catch-all layer (the `layers[]` entry whose `path` is `"."`) carries the cross-layer ones.

5. **Make a plan** to implement the requirements from the task prompt. Structure it like a tracker story: separate tasks for each independent unit of work, so each task can ship on its own. Each task is **single-layer** — exactly one of `<layer_names>` — and **small** (≤20 story points OR ≤5 `**Work:**` sub-task bullets, whichever binds first). A capability that spans layers becomes **multiple ordered single-layer tasks** sequenced bottom-up **across** tasks — in the adopter's configured layer order, with the catch-all layer last, each task `**Depends on:**` the one it builds on — not bottom-up within one task; a candidate task exceeding either ceiling is likewise split into smaller single-layer tasks. The plan is **split**: a thin **story index** (`## Context` + `## Phase 2 Readiness — Ordered Fix List`, no `## Tasks`) plus one **self-contained per-task file** per readiness entry. Read `${CLAUDE_PLUGIN_ROOT}/samples/sample_task_plan.md` (the format-reference doc) and the concrete templates it links — `${CLAUDE_PLUGIN_ROOT}/samples/sample_story_plan.md` and the per-task templates `${CLAUDE_PLUGIN_ROOT}/samples/sample_story/task_<N>_plan.md` — **three short files, one per layer the sample branch spans; read all three**: `task_1_plan.md` is the lower-layer task and draws the boundary with the layer above *in its own body*, `task_2_plan.md` the surface task demonstrating the cross-file `**Depends on:**` link, `task_3_plan.md` the catch-all task that wires up and documents what the other two built — for the heading shape, checkbox convention, and per-task structure.

6. **If anything is missing or unclear**, do NOT make assumptions — ask clarification questions before drafting the plan.

7. **Present the plan** to the user.

8. **After the user approves**, write the **story index** to `<state_dir>/story_plans/<branch>_story_plan.md` and one self-contained per-task file per readiness entry to `<state_dir>/task_plans/<branch>/task_<N>_plan.md`, then stop. Author the whole set in one pass so cross-task naming, `**Depends on:**` links, and shared source citations stay coherent. The plan implementation will be done in a different session via `/autonomous-sdlc-harness:branch-implement-plan`.

9. **(Optional) UI-test plan.** **Skip this phase unless `phases.qa` is `true` in `harness.config.json`.** Unlike the semi-autonomous flow, this supervised flow does **not** auto-generate a UI-test plan. If the user wants one — for an extra interactive testing session — they may opt in: dispatch the `ui-tests-plan-writer` agent with its initial-write prompt (inputs: the task prompt `<state_dir>/task_prompts/<branch>_task_prompt.md`, the story index, and the per-task files under `<state_dir>/task_plans/<branch>/`; outputs: index `<state_dir>/ui_test_plans/<branch>_ui_test_plan.md` + per-test files `<state_dir>/ui_test_plans/<branch>/ui_test_<N>.md`), or run `/autonomous-sdlc-harness:branch-qa-test`. Do this only on explicit request — never produce a UI-test plan automatically in the supervised flow.
