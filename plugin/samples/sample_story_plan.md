# Story: Recent searches panel

> **This file is the story-INDEX format reference for the `task-plan-writer` agent**, and the standard the `task-plan-reviewer` grades a real index against. A task plan is split into this thin index — a `## Context` section of prose, ending with a `Top risks:` paragraph, then the `## Phase 2 Readiness — Ordered Fix List`, then the conditional `## Scope register` worked at the end of this file — plus one self-contained per-task file per readiness entry under `<state_dir>/task_plans/<branch>/task_<N>_plan.md`. There is no `## Tasks` section and no index-level `### Sources of truth` / `### Targets` sub-list; both belong to the per-task files. See `${CLAUDE_PLUGIN_ROOT}/samples/sample_task_plan.md` for how the two halves fit together and `${CLAUDE_PLUGIN_ROOT}/samples/sample_story/task_1_plan.md` for a per-task file. Heading text must match exactly — the orchestrator keys off it.
>
> **Placeholders used below, and where each comes from.** `<branch>` is the branch being planned, read at runtime from a bare `git rev-parse --abbrev-ref HEAD`. `<state_dir>` is `harness.config.json` → `stateDir` (default `sdlc-harness/`), the run-artifact tree every artifact path here is relative to. A readiness entry's `_(layer: …)_` tag values are `layers[].name` values, and the **catch-all** layer is the `layers[]` entry whose `path` is `"."`. `<parity_vocabulary>` is `harness.config.json` → `parity.referenceName`, and every sentence that uses it applies **only when `phases.parity` is `true`**.
>
> **Illustrative values.** The feature, branch and symbols are a worked example — a "recent searches panel" on `feat/recent_searches_panel` — so the format has something concrete to be about. Source paths sit under the example layer paths `src/data` and `src/presentation`, with the catch-all layer at the repository root; a real story index uses the adopting repository's own `layers[].path` values.

## Context

This branch adds a recent-searches panel to the search surface: the searches a user runs are stored, the most recent ones are read back when the surface opens, and each is offered as a one-tap way to run that search again. The work is cut into three single-layer tasks in bottom-up ship order — the stored record and its read path, then the panel that renders them, then the root-level registration and the project's own documentation of the new surface. The catch-all task is last because it wires up and documents what the other two built, which is the ordering rule rather than a preference of this branch.

The stored record is `RecentSearchRecord`, with the fields `query_text` and `searched_at` — the keys the documents already in the backing store hold, so the panel reads what is there rather than a new shape beside it. Task 1 owns that record and the stored read path behind `searchService`, and nothing above the data layer restates the stored keys. Task 2 renders the panel in `SearchPanel` through a `useRecentSearches` hook and owns only what is rendered: the record shape and the stored read path are Task 1's.

Two cross-cutting rules apply to Task 2 and are stated here once rather than in that task alone. **Components stay small**, which is why the recent-searches label is not rendered inline in `SearchPanel` but extracted into its own `SearchPanelRecentLabel` file — a subcomponent Task 2 creates rather than a refactor left for later. And, **when `phases.parity` is `true`**, the `<parity_vocabulary>` implementation's own recent-searches panel is the visual target for this surface; Task 2 names the reference screenshot its work is compared against, so that later polish has one agreed target to measure against instead of a judgement call.

**Top risks:** the stored document shape is the one thing this branch can break for readers that already exist, so Task 1 is the only task allowed to touch it and its verification round-trips a real stored document rather than a constructed one. The second risk is a panel that renders correctly but is never reachable, because the entry point sits outside every layer path — Task 3 exercises the surface end to end rather than only registering it. The third, **when `phases.parity` is `true`**, is silent visual drift from the `<parity_vocabulary>` panel, which Task 2 guards by comparing against the named reference screenshot instead of eyeballing the result.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top-to-bottom; the committer flips each one to `[x]` as that task's commit lands. **Only the committing role flips a marker** — the `committer` agent in every flow that dispatches one, the orchestrator itself in the supervised flow, which dispatches none: an implementer never changes a marker here, and never edits any other line of this section, in an index a run is iterating (this sample's own readiness section is a template, edited only when a dispatched task assigns it — the implementer-side licence is `${CLAUDE_PLUGIN_ROOT}/agents/layer-implementer.md` → `## Working modes`). `[ ]` markers anywhere else (e.g. sub-step bullets inside individual per-task files) are informational progress markers for the implementer agent — they are NEVER the iteration source and the committer does NOT touch them.

Each entry resolves 1:1 to a self-contained `<state_dir>/task_plans/<branch>/task_<K>_plan.md` file — here `${CLAUDE_PLUGIN_ROOT}/samples/sample_story/task_<K>_plan.md`. Ordered bottom-up by ship sequence, with the catch-all layer last.

1. [ ] **Task 1** — Introduce `RecentSearchRecord` with fields `query_text` and `searched_at` _(layer: data)_ _(points: 20)_
2. [ ] **Task 2** — Render the recent-searches panel in `SearchPanel`, with its label extracted into `SearchPanelRecentLabel` _(layer: presentation)_ _(points: 15)_
3. [ ] **Task 3** — Register the panel's entry point at the repository root and document the new surface _(layer: general)_ _(points: 20)_

## Scope register

*(Conditional — a plan whose targets are all application source omits this section entirely. `${CLAUDE_PLUGIN_ROOT}/agents/task-plan-writer.md` → `## Process` → the `**Scope closure:**` bullet states when one is owed and what it carries; the section's **position** — after `## Phase 2 Readiness — Ordered Fix List`, before `## Rejected findings` — is shown here rather than described. The recent-searches plan above documents the new surface in the project's own docs, so it owes the register below; `Copy` names which parallel copy of a mirrored corpus a site lives in, and a site with no mirrored counterpart takes `—`, as every row here does.)*

**Scope predicate**, quoted verbatim from the task prompt: *"everywhere the project's own documentation states that the search surface keeps no history."*

**Derivation entry — corpus files (command).** Re-run verbatim: `git grep -lE 'no history|stateless|is persisted' -- 'docs/**' 'README.md'`

**Derivation entry — standing-artifact rows (procedure).** **First step, runnable:** `grep -nE '^## |^- ' <state_dir>/lessons.md`. **Artifact:** that standing ledger. **Traversal:** its topic headings in file order, then the one-line rules under each. **Decision rule:** a rule is reached when it names a surface on this branch's changed-file list.

**Closure invariant:** every site either entry reaches appears as a row below.

| # | Site | Copy | Evidence (what the derivation matched) | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/search.md` ("the surface keeps no history between sessions") | — | command entry, `no history` | `change` | Task 3 |
| 2 | `README.md` → `## Features` ("Search — stateless, one query at a time") | — | command entry, `stateless` | `change` | Task 3 |
| 3 | `docs/decisions/0007-search-storage.md` ("no search term is persisted") | — | command entry, `is persisted` | `no-change` | decision record of what was true when it was decided; superseded by a new entry rather than edited in place |
| 4 | `<state_dir>/lessons.md` → the rule *"the search surface stores nothing, so it needs no migration"* | — | procedure entry, rule names a changed surface | `change` | Task 1 — the stored record it denies is that task's |
