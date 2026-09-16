### 1. Recent searches are truncated before they are ordered, so the panel lists the oldest searches

> **Self-contained per-finding file** for the `feat/recent_searches_panel` code-review index (`${CLAUDE_PLUGIN_ROOT}/samples/sample_code_review.md`). The implementer reads only this file to apply the fix — everything needed (location, problem, exact fix) lives here. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here. The `**File:**` line is the site anchor a real code review carries — the repo-relative path, the symbol, and a quoted substring an implementer can grep, and its path sits under one of the adopting repository's `layers[].path` values (here the example layer paths `src/data` and `src/presentation`, which is why this finding's readiness tag is comma-joined). Parity sentences below apply **only when `phases.parity` is `true`** in `harness.config.json`; `<parity_vocabulary>` is that file's `parity.referenceName`.

**File:** `src/data/search/searchService.ts` (`fetchRecentSearches`) — "store.query('recent_searches'"

`fetchRecentSearches(limit)` applies `limit` to the stored query without ordering it first, so the store returns the *first* `limit` documents in insertion order — the oldest ones — and every search newer than that page is dropped before the panel ever sees it. `SearchPanel` then sorts what it received by `searched_at` descending before rendering (`src/presentation/search/components/SearchPanel.tsx` (`SearchPanel`)), which is what hides the defect: the rows are genuinely newest-first, but they are the newest of the oldest `limit` records, and the search the user just ran never appears once the store holds more than `limit`. The `<parity_vocabulary>` implementation orders in the query and limits after.

**Fix:** order in the query, before the limit, and let the service hand back display order:

```ts
const rows = await store.query('recent_searches', {
  orderBy: { field: 'searched_at', direction: 'desc' },
  limit,
});
```

Then delete the in-memory sort in `SearchPanel` — it is redundant once the read is ordered, and leaving it in keeps the panel looking correct on a small store, which is the reason this shipped. Re-run Task 1's own `**Verification:**` step ("`fetchRecentSearches` returns records in most-recent-first order for a store holding more documents than `limit`") against a store seeded with more than `limit` records rather than the two-record fixture.
