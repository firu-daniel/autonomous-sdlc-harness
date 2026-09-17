# Split task-plan format reference

> **This file is the split-plan format reference for every command and agent that dereferences it by path** — the `/autonomous-sdlc-harness:branch-start-plan` command, the `task-plan-writer` that emits a plan, the `task-plan-reviewer` that grades one, and the `layer-reviewer` that checks a sample fixture against the shape its writer agent must emit. It explains the thin-index-plus-per-item split and links the concrete templates. It deliberately carries **no** plan body of its own — the body lives in the per-task templates linked at the end.
>
> **Placeholders used below, and where each comes from.** `<state_dir>` is `harness.config.json` → `stateDir` (default `sdlc-harness/`), the run-artifact tree every artifact path here is relative to. `<branch>` is the branch being planned, read at runtime from a bare `git rev-parse --abbrev-ref HEAD`; `<N>` and `<K>` are an item's number within its own family. A readiness entry's `_(layer: …)_` tag values are `layers[].name` values, and the **catch-all** layer is the `layers[]` entry whose `path` is `"."`. `<parity_vocabulary>` is `harness.config.json` → `parity.referenceName`, and every sentence that uses it applies **only when `phases.parity` is `true`**.
>
> **Illustrative values.** The templates linked under `## Concrete templates` are one worked example branch — `feat/recent_searches_panel`, the same branch the user-review fixtures use — so the format has something concrete to be about. A real plan names the adopting repository's own branch, files and `layers[].path` values.

## The split: thin index + self-contained per-item files

A task plan is not one monolithic file. It splits into:

1. A thin **story index** — only a `# Story:` heading, a `## Context` section (a **prose description only**: what the story delivers and the architecture constraints, ending with a `Top risks:` paragraph and, when a task needs human-performed infrastructure steps, a `Manual setup required:` list — **no** index-level `### Sources of truth` / `### Targets` sub-lists), and the `## Phase 2 Readiness — Ordered Fix List`, plus the conditional `## Scope register` when the plan has durable-corpus targets (`${CLAUDE_PLUGIN_ROOT}/agents/task-plan-writer.md` → the `**Scope closure:**` bullet). **No `## Tasks` section.**
2. One **self-contained per-task file** per readiness entry — each carries everything an implementer or reviewer needs to do that one task without reading the others.

One writer authors the index and all per-task files in a single invocation, so cross-task naming, `**Depends on:**` links and shared citations stay coherent. Each consumer (implementer, reviewer, committer) then reads only its slice — the story index's `## Context` plus the one per-task file — instead of the whole plan.

This same index-plus-per-item split applies to four artifact families. Only the **planning and review artifacts** split; the per-item review-findings directories (`<state_dir>/task_plan_point_reviews/`, `<state_dir>/review_plan_point_reviews/`, `<state_dir>/user_review_fix_plan_point_reviews/` and their siblings) are unchanged by it — they were already one file per item.

## Naming / folder table

| Family | Index file (Context + Phase 2 Readiness) | Per-item detail files |
|---|---|---|
| **Task plan** | `<state_dir>/story_plans/<branch>_story_plan.md` *(no `## Tasks` section)* | `<state_dir>/task_plans/<branch>/task_<N>_plan.md` |
| **Code review** | `<state_dir>/code_reviews/<branch>_code_review.md` *(name kept — round-suffix logic depends on it)* | `<state_dir>/code_reviews/<branch>_code_review/finding_<N>.md` |
| **User-review fix plan** | `<state_dir>/user_reviews/<branch>_fix_plan.md` *(name kept — round-suffix logic depends on it)* | `<state_dir>/user_reviews/<branch>_fix_plan/finding_<N>.md` |
| **Interactive-test plan** | `<state_dir>/ui_test_plans/<branch>_ui_test_plan.md` *(Context + Phase 2 Readiness; no `## Tasks` section)* | `<state_dir>/ui_test_plans/<branch>/ui_test_<N>.md` |
| **Branch statistics** | `<state_dir>/branch_statistics/<branch>/statistics.md` *(single file — **not** split)* | *(none — single-file family; **no** `## Phase 2 Readiness` section, since it is a report, not a fix list, so nothing keys off it)* |

Round-suffix logic for code reviews and fix plans (`_2`, `_3`, …) mirrors into the per-item folder name (e.g. `<branch>_fix_plan_2/`). The code-review family's own fixture is `${CLAUDE_PLUGIN_ROOT}/samples/sample_code_review.md` with `${CLAUDE_PLUGIN_ROOT}/samples/sample_code_review/finding_<N>.md`, and the fix-plan family's is `${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review_fix_plan.md` with `${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review_fix_plan/finding_<N>.md`.

The **branch statistics** family is the lone single-file artifact: one `statistics.md` per branch, no thin-index / per-item split and no `## Phase 2 Readiness` heading, because nothing iterates over it. It is a catch-all-layer report — the `layers[]` entry whose `path` is `"."` — written by the `statistics-plan-writer` agent. Format reference: `${CLAUDE_PLUGIN_ROOT}/samples/sample_statistics.md`.

The **interactive-test plan** is the QA-side analog of the task plan, written only while `phases.qa` is `true`: the `ui-tests-plan-writer` agent authors the index and the per-test files in one pass, and the `qa-tester` agent consumes them (the index for the ordered run list, one `ui_test_<N>.md` per test case). This family ships **no sample fixture** — write it from the format rules below and from the `ui-tests-plan-writer` body, which states the per-test file's own sections.

## Invariants

- The exact heading `## Phase 2 Readiness — Ordered Fix List` is byte-identical wherever it appears (the orchestrator and the committer key off it). It lives in the **index** file — including the **interactive-test plan index** (`<branch>_ui_test_plan.md`), where the entries are `N. [ ] **Test K** — <title>` and the QA orchestrator keys off the same string.
- Each readiness entry `N. [ ] **Task K** — <title>` maps 1:1 to a per-task file (`task_<K>_plan.md`); a count mismatch in either direction is a `Must Fix` in review. For the interactive-test plan, `N. [ ] **Test K** — <title>` maps 1:1 to a `ui_test_<K>.md` per-test file the same way.
- `[ ]` markers outside the Phase 2 Readiness list — the sub-step bullets inside per-item files — are informational only, and the committer never touches them.
- **Layer tag:** every readiness entry — task-plan `**Task K**`, code-review / fix-plan `**Finding K**`, and interactive-test `**Test K**` — carries a trailing `_(layer: …)_` tag, and its permitted values are the **configured layer names** (`layers[].name`), no other. A readiness entry missing its layer tag is a `Must Fix` in review. Task-plan `**Task K**` entries are **single-layer** — exactly one value, never a comma-joined one — and additionally capped at **≤20 story points OR ≤5 `**Work:**` sub-task bullets**, whichever binds first; a task that would span layers or exceed either ceiling is split into smaller single-layer tasks linked by `**Depends on:**`, sequenced bottom-up in the configured layer order with the **catch-all** layer (`path` `"."`) last. The **comma-joined** multi-layer form, written in that same bottom-up order, applies **only** to `**Finding K**` and `**Test K**` entries, whose tag is a fix-target path that can legitimately span layers.
- **Points tag:** a task-plan `**Task K**` entry additionally carries `_(points: <N>)_` **after** its layer tag, so the full shape is `N. [ ] **Task K** — <title> _(layer: <one layer name>)_ _(points: <N>)_`. The sum over the readiness list is the story's denominator for the statistics report.
- **Routing from the index only:** the orchestrator determines the dispatch layer from the readiness entry's layer tag **only** — it does not open the per-task / per-finding / per-test detail file to infer the layer. Reading detail bodies to route is the exact context leak the split format exists to prevent. (Interactive-test `**Test K**` entries are consumed by the QA orchestrator, which dispatches the single-purpose `qa-tester` rather than a layer agent; a `**Test K**` tag therefore describes the **fix-target** layer used by the fix loop when that test fails — informational until then, not a `qa-tester` selector.)

## Concrete templates

The template set is one illustrative worked branch — `feat/recent_searches_panel`, cut as three single-layer tasks, one per layer it touches — so the templates show the format *and* the target quality end-to-end: the citation density, the cross-task interface hand-offs spelled out on **both** sides, and the `**Verification:**` style a plan is expected to reach.

- Story index: `${CLAUDE_PLUGIN_ROOT}/samples/sample_story_plan.md`
- Per-task files, one per readiness entry:
  - `${CLAUDE_PLUGIN_ROOT}/samples/sample_story/task_1_plan.md` — the data-layer task; note how it draws the boundary with the layer above *in its own body*, so that implementer never guesses which half is someone else's.
  - `${CLAUDE_PLUGIN_ROOT}/samples/sample_story/task_2_plan.md` — the presentation task; demonstrates the cross-file `**Depends on:**` link and the parity-conditioned `### Sources of truth` sub-list.
  - `${CLAUDE_PLUGIN_ROOT}/samples/sample_story/task_3_plan.md` — the catch-all task; demonstrates why the `layers[]` row whose `path` is `"."` ships last, since it wires up and documents what the other layers built.

Each per-task file is self-contained: a `### Task N — <title>` heading (no checkbox — those live only in the index), `**Goal:**`, an optional `**Depends on:**` line, task-scoped `### Sources of truth` (the `<parity_vocabulary>` files the task ports, **only when `phases.parity` is `true`**) and `### Targets` (the project files the task creates or edits) sub-lists — the per-task files are the **sole** home of these two, required whenever the task has either — a `**Source:**` reference line when there is a single primary source, `**Work:**` (sub-step `- [ ]` bullets allowed), and `**Verification:**`.
