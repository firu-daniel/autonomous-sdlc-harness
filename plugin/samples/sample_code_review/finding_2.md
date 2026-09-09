### 2. `persistRecentSearch` fires only on submit, so a query typed and navigated away from is never recorded

> **Self-contained per-finding file** for the `feat/recent_searches_panel` code-review index (`${CLAUDE_PLUGIN_ROOT}/samples/sample_code_review.md`). The implementer reads only this file to apply the fix — everything needed (location, problem, exact fix) lives here. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here. The sub-step `- [ ]` bullets under `**Fix:**` are informational progress markers for the implementer; the committer does not touch them either. The `**File:**` line is a plain repo-relative path in this shipped sample; in a real code review it is the markdown link form `[<file>:<line>](<file>#L<line>)` into the working tree, and its path sits under one of the adopting repository's `layers[].path` values (here the example layer path `src/presentation`).

**File:** `src/presentation/search/hooks/useSearchHistory.ts:138`

`useSearchHistory` calls `persistRecentSearch` from its submit handler and from nowhere else. The effect at the top of the hook returns a cleanup that clears the pending query without writing it, and the `beforeunload` listener registered beside it covers only the tab-close path — so when its consumer `SearchPanel` (`src/presentation/search/components/SearchPanel.tsx:31`, where the hook is mounted) unmounts on navigation away, whatever was typed is silently discarded. A user who types a query, takes what they wanted from the suggestions and navigates away leaves nothing in the store, which is the most common way this surface is used and the only stop path with no write at all.

**Fix:** persist from every path where the query stops being live, and make the write safe to repeat — submit and unmount both fire on an ordinary submit-then-close:

- [ ] Call the same `persistRecentSearch` the submit handler already invokes from the cleanup the hook's effect returns, passing the query held in the ref, before the pending query is cleared.
- [ ] Keep the existing submit-handler call — it stays the path that records a search the moment it is run.
- [ ] Make the write idempotent, keyed on the trimmed query text, so re-persisting the same query updates its `searched_at` in place instead of appending a second row.
- [ ] Skip the write when the pending query is empty or unchanged since the last one persisted, so a cleanup that runs with nothing typed does not record a blank row.

Both halves are load-bearing and neither is sufficient alone: adding the cleanup call without the idempotent write double-records every submitted search, and making the write idempotent without adding the cleanup call leaves the abandoned-query case exactly as it is today.
