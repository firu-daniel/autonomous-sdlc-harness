### Task 2 — Render the recent-searches panel in `SearchPanel`, with its label extracted into `SearchPanelRecentLabel`

> **Self-contained per-task file** for the sample story index (`${CLAUDE_PLUGIN_ROOT}/samples/sample_story_plan.md`), and the per-task-file format reference for the `task-plan-writer` and `task-plan-reviewer` agents. The implementer reads only this file plus the story index's `## Context` — never the other per-task files. The checkbox for this task lives in the index's `## Phase 2 Readiness — Ordered Fix List` and never on the heading above; the entry there also carries this task's `_(layer: presentation)_` and `_(points: 15)_` tags. Paths below sit under the example layer path `src/presentation`; a real plan uses the adopting repository's own `layers[].path` values. The `### Sources of truth` sub-list and every sentence below that names `<parity_vocabulary>` (`harness.config.json` → `parity.referenceName`, at `parity.referenceImplPath` = `<reference_impl>`) apply **only when `phases.parity` is `true`** — with the phase off the sub-list is omitted entirely, as it is in the sibling files for Tasks 1 and 3.

**Goal:** Render the recent searches in `SearchPanel` — a list of the stored records, most recent first, each offered as a one-tap way to run that search again — supplied to the panel by a `useRecentSearches` hook, with the panel's label extracted into its own component file.

**Depends on:** Task 1, which produces `RecentSearchRecord` with the fields `query_text` and `searched_at`, named exactly that. This task renders those two fields under those names: `query_text` is the row's text, `searched_at` orders the list. Task 1 owns the stored shape and the read path; this task restates the shape it consumes so neither implementer guesses, and owns nothing below the surface.

### Sources of truth

- `<reference_impl>/search/recent_searches_panel` — the `<parity_vocabulary>` implementation's own recent-searches panel: row order, the one-tap re-run behaviour, and the empty state when no search has been run yet.
- `<reference_impl>/docs/screenshots/recent_searches_panel.png` — the reference screenshot of that panel. It is the agreed visual target for this surface, so later polish measures against one named image instead of a judgement call, and it is the comparison any follow-up styling fix is checked against.

**Source:** `<reference_impl>/search/recent_searches_panel`.

### Targets

- `src/presentation/search/components/SearchPanel.tsx` — render the recent-searches section.
- `src/presentation/search/components/SearchPanelRecentLabel.tsx` (new) — the section's label.
- `src/presentation/search/hooks/useRecentSearches.ts` (new) — the hook that supplies the panel's records.
- `src/presentation/search/components/SearchPanelRecentLabel.test.tsx` (new) — the accompanying test for the extracted component.

**Work:**

- [ ] `SearchPanel.tsx`: render the recent-search rows above the search field, most recent first by `searched_at`, each row showing its `query_text` and re-running that search on tap; render nothing when the list is empty.
- [ ] `SearchPanelRecentLabel.tsx`: **components stay small**, so the section's label does not live inline in `SearchPanel` — extract it into this file as `SearchPanelRecentLabel` as part of this task, not as a refactor left for later, and have `SearchPanel` render `<SearchPanelRecentLabel />`.
- [ ] `useRecentSearches.ts`: expose the recent-search records to the panel in the shape Task 1 defines, plus a loading flag for the first read.
- [ ] `SearchPanelRecentLabel.test.tsx`: the accompanying test that ships with the extracted component — one unit, its own test file, per this layer's conventions document.

**Verification:**

- `SearchPanelRecentLabel.test.tsx` passes, asserting the label renders its text and its type token.
- The panel is compared against the reference screenshot named above rather than eyeballed, which is the third `Top risks:` entry in the story index.
- With the store empty the panel renders nothing, and with records present the topmost row is the most recent `searched_at`.
