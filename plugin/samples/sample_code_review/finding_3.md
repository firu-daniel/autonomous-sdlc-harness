### 3. The root `README.md` calls the surface "Search history" while the panel's label reads "Recent searches"

> **Self-contained per-finding file** for the `feat/recent_searches_panel` code-review index (`${CLAUDE_PLUGIN_ROOT}/samples/sample_code_review.md`). The implementer reads only this file to apply the fix — everything needed (location, problem, exact fix) lives here. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here. The `**File:**` line is the site anchor a real code review carries — the repo-relative path, the symbol, and a quoted substring an implementer can grep — here a quoted substring alone, because a README has no symbol. This fix target sits at the repository root rather than under one of the example layer paths, because it belongs to the **catch-all** layer — the `layers[]` entry whose `path` is `"."` — which is what its `_(layer: general)_` readiness tag records.

**File:** `README.md` — "Search history" (repository root)

Task 3 documents the new surface in the project's feature list as "Search history", which is the name of the hook behind it (`useSearchHistory`) rather than the name a user ever sees: the panel's own label, rendered by `SearchPanelRecentLabel`, reads "Recent searches", and so does the entry point registered in `routes.ts`. Nothing breaks — this is documentation wording, hence Nice to Have — but the feature list and the UI now name one surface two ways, which is the drift the catch-all task exists to close rather than open.

**Fix:** name the surface after what it renders, and leave the hook's name alone (an internal symbol and a user-facing name are allowed to differ):

```md
- **Recent searches** — on the search surface, the searches you have already run are offered back newest-first, each one tap away from running again. Stored per user.
```
