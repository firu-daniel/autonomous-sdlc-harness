### Task 3 — Register the panel's entry point at the repository root and document the new surface

> **Self-contained per-task file** for the sample story index (`${CLAUDE_PLUGIN_ROOT}/samples/sample_story_plan.md`), and the per-task-file format reference for the `task-plan-writer` and `task-plan-reviewer` agents. The implementer reads only this file plus the story index's `## Context` — never the other per-task files. The checkbox for this task lives in the index's `## Phase 2 Readiness — Ordered Fix List` and never on the heading above; the entry there also carries this task's `_(layer: general)_` and `_(points: 20)_` tags. This is the **catch-all** task — the `layers[]` row whose `path` is `"."` — so its targets sit at the repository root rather than under a layer path, and a real plan uses the adopting repository's own root files. It carries no `### Sources of truth` sub-list: that section appears only when `phases.parity` is `true` and the task ports a reference surface, which this one does not.

**Goal:** Make the finished panel reachable and documented — register its entry point in the root-level route registry, and describe the new surface in the project's own documentation — so the feature the layers below built is something a user can actually get to.

**Depends on:** Task 2, which renders the panel as `SearchPanel` with its label in `SearchPanelRecentLabel`. This task registers that surface and writes about it; it changes nothing inside it. **The catch-all task ships last for this reason** — it wires up and documents what the other layers built, so every earlier task must already be landed for it to have a real surface to point at, rather than a preference of this branch.

**How this task's implementer reads the conventions.** Per the catch-all contract, the `"."` layer has no single neighbouring layer, so its implementer reads **every** configured layer's `layers[].conventions` document rather than one: the registration touches how this project names and registers a surface, and the documentation has to describe a feature that spans the layers below. Stating that here is deliberate — a fixture that merely happens to be correct teaches less than one that says what it is being careful about.

### Targets

- `routes.ts` (repository root) — the entry-point registration for the panel's surface.
- `README.md` (repository root) — the project's own documentation of the new surface.

**Work:**

- [ ] `routes.ts`: register the search surface's entry point so `SearchPanel` is reachable from the application's navigation, following the registry's existing entry shape rather than a new one.
- [ ] `README.md`: document the recent-searches panel in the project's feature list — what the surface does, how a user reaches it, and that the records behind it are stored per user.

**Verification:**

- Exercise the surface **end to end** from a cold start: navigate to the registered entry point, run a search, reopen the surface and see that search offered as a recent one. The second `Top risks:` entry in the story index is a panel that renders correctly but is never reachable, so registering the route is not on its own evidence that this task is done.
- The documented reach path in `README.md` is the one just exercised, not a remembered one.
