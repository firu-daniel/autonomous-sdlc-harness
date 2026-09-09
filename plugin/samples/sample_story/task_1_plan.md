### Task 1 — Introduce `RecentSearchRecord` with fields `query_text` and `searched_at`

> **Self-contained per-task file** for the sample story index (`${CLAUDE_PLUGIN_ROOT}/samples/sample_story_plan.md`), and the per-task-file format reference for the `task-plan-writer` and `task-plan-reviewer` agents. The implementer reads only this file plus the story index's `## Context` — never the other per-task files. The checkbox for this task lives in the index's `## Phase 2 Readiness — Ordered Fix List` and never on the heading above; the entry there also carries this task's `_(layer: data)_` and `_(points: 20)_` tags. Paths below sit under the example layer path `src/data`; a real plan uses the adopting repository's own `layers[].path` values. This file carries no `### Sources of truth` sub-list, because that section appears only when `phases.parity` is `true` **and** the task ports a reference surface — see `${CLAUDE_PLUGIN_ROOT}/samples/sample_story/task_2_plan.md`, which does.

**Goal:** Give the data layer the stored recent-search record and the read/write path behind `searchService`: `RecentSearchRecord` with the fields `query_text` and `searched_at`, which are the keys the documents already in the backing store hold, so the panel above reads what is there rather than a new shape beside it.

**Where this layer stops.** This task returns the raw record with its fields named exactly as stored, and formats nothing. The surface that renders these records is **Task 2's** — the presentation task reads them through `useRecentSearches` and owns every rendering decision, including ordering as displayed, empty state and labels. Nothing above the data layer restates the stored keys, so this file is the only place they are defined.

### Targets

- `src/data/search/records/recentSearchRecord.ts` (new) — the record and its two fields.
- `src/data/search/searchService.ts` — the stored read and write path.
- `src/data/search/records/recentSearchRecord.test.ts` (new) — round-trip coverage, the accompanying test this layer's conventions document requires of a new unit.

**Work:**

- [ ] `recentSearchRecord.ts`: declare `RecentSearchRecord` with exactly two fields, `query_text` (the submitted search string) and `searched_at` (the submission instant), named as the stored documents hold them. No derived or computed field: a record here is what the store holds, nothing more.
- [ ] `searchService.ts`: add `fetchRecentSearches(limit: number): Promise<RecentSearchRecord[]>`, most-recent-first by `searched_at`, and `persistRecentSearch(record: RecentSearchRecord): Promise<void>`, which writes one record. Both return the record type above unchanged — the service maps nothing.
- [ ] `recentSearchRecord.test.ts`: round-trip a document **read from the backing store**, asserting both fields populate, plus the write direction asserting the stored shape is unchanged by a persist.

**Verification:**

- The round-trip test passes against a real stored document rather than a constructed one — the story index's first `Top risks:` entry is precisely that this branch can break readers that already exist.
- `fetchRecentSearches` returns records in most-recent-first order for a store holding more documents than `limit`.
- Grep the two `src/data/search` files for a rendering or formatting concern and find none: anything the panel decides belongs to Task 2.
