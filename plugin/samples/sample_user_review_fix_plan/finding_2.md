### 2. `RecentSearchRecord` property names break the stored document shape

> **Self-contained per-finding file** for the `feat/recent_searches_panel` user-review fix-plan index (`${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review_fix_plan.md`). The implementer reads only this file to apply the fix — everything needed (location, problem, exact fix) lives here. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here. The `**File:**` line is a plain repo-relative path in this shipped sample; in a real fix plan it is a link into the working tree, and its path sits under one of the adopting repository's `layers[].path` values (here the example layer path `src/data`). Parity sentences below apply **only when `phases.parity` is `true`** in `harness.config.json`; `<parity_vocabulary>` is that file's `parity.referenceName`.

**File:** `src/data/search/records/recentSearchRecord.ts:14`

Task 1 of the task plan ("Introduce `RecentSearchRecord` with fields `query_text` and `searched_at`") was written against `snake_case` field names, and the user flagged that the shipped code already uses `queryText` / `searchedAt` — but the live documents in the backing store hold these as `query_text` / `searched_at`, and so does the `<parity_vocabulary>` implementation's own record. The data layer's serialized keys must mirror the stored document shape exactly (the rule is in the data layer's `layers[].conventions` document), so the wire keys have to stay `query_text` / `searched_at` even though the property names are camelCase. Right now the record serializes `queryText` / `searchedAt` straight to the wire, so reads return `undefined` for both fields and writes corrupt the document shape.

**Fix:** keep the property names `queryText` / `searchedAt` (the codebase's naming convention) but map them to the stored keys through the record's serialization map, so the wire shape is unchanged:

```ts
static readonly serializedKeys = {
  queryText: 'query_text',
  searchedAt: 'searched_at',
};
```

Then update the mapper (`recentSearchMapper.ts`) to read from the camelCase record properties, and adjust the round-trip tests (`recentSearchRecord.test.ts`) to assert the serialized JSON uses `query_text` / `searched_at` while the entity exposes `queryText` / `searchedAt`. Verify against a real stored document that both fields populate after the change.
