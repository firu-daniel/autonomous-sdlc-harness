### Task 8 — Show the site anchor in the code-review sample fixtures

**Goal:** Make the code-review fixtures — the format specification `review-plan-reviewer` grades a real review against — carry the site anchor a real finding now carries, so no fixture teaches a coordinate and no header note describes a link form the contracts no longer require.

**Depends on:** Task 3, which makes `branch-reviewer.md` and `skeptic-reviewer.md` require C5 in a per-finding file, and Task 4, which removes `review-plan-reviewer.md`'s parenthetical saying the fixtures' `**File:**` lines deviate from *"the markdown link form"*. After this task the fixtures show the live form, so no deviation is left to declare. The contract clause the fixtures demonstrate — restated so this task needs no other file:

```text
the site anchor (the repo-relative path plus the symbol, heading or short quoted substring that locates the change, with a quoted substring beside any symbol whose body spans more than the change and a bare path only when the change is the whole file; a line number may follow as a navigation hint, and nothing depends on it)
```

Its written form is `` `<file>` (`<symbol>`) — "<quoted substring>" ``. The `**File:**` label is kept: no quoter is renamed.

**Where this task stops.** The fixtures describe one worked branch and cite each other by finding number and quoted title (`plugin/samples/README.md`), so no title, number, severity or readiness entry changes here. The fix-plan fixtures are Task 9's.

### Targets

- `plugin/samples/sample_code_review.md` — the `**Illustrative values.**` header paragraph.
- `plugin/samples/sample_code_review/finding_1.md`
- `plugin/samples/sample_code_review/finding_2.md`
- `plugin/samples/sample_code_review/finding_3.md`

**Work:**

- [ ] `sample_code_review.md`: replace *"The feature, branch, symbols, line numbers and date are a worked example"* with *"The feature, branch, symbols, quoted code and date are a worked example"*.
- [ ] All three finding files' header note: replace the sentence that begins *"The `**File:**` line is a plain repo-relative path in this shipped sample"* up to *"into the working tree"* with *"The `**File:**` line is the site anchor a real code review carries — the repo-relative path, the symbol, and a quoted substring an implementer can grep"*, keeping the rest of each note (the `layers[].path` clause in findings 1 and 2, the catch-all sentence in finding 3). In finding 3 end the replacement with *"— here a quoted substring alone, because a README has no symbol"* instead.
- [ ] `**File:**` lines: finding 1 → `` `src/data/search/searchService.ts` (`fetchRecentSearches`) — "store.query('recent_searches'" ``; finding 2 → `` `src/presentation/search/hooks/useSearchHistory.ts` (`useSearchHistory`) — "persistRecentSearch(" ``; finding 3 → `` `README.md` — "Search history" (repository root) ``.
- [ ] In-body coordinates: in finding 1 replace `` (`src/presentation/search/components/SearchPanel.tsx:63`) `` with `` (`src/presentation/search/components/SearchPanel.tsx` (`SearchPanel`)) ``; in finding 2 replace `` (`src/presentation/search/components/SearchPanel.tsx:31`, where the hook is mounted) `` with `` (`src/presentation/search/components/SearchPanel.tsx` (`SearchPanel`) — "useSearchHistory(", where the hook is mounted) ``.

**Verification:**

- `grep -rnE -e '\.tsx*:[0-9]' -e '\.md:[0-9]' -e '#L' plugin/samples/sample_code_review.md plugin/samples/sample_code_review` returns nothing.
- Each finding is still implementable from its own file: its `**File:**` line names a symbol or a quoted substring that the file's own body or fix snippet also names (`store.query`, `persistRecentSearch`, "Search history").
- The fixture pair still resolves: `grep -rno 'samples/[A-Za-z0-9_<>/]*\.md' plugin/agents/` lists no path missing from `find plugin/samples -type f` (`plugin/agents/README.txt` → `Sample fixture pointers`).
- Grep `plugin/samples/sample_user_review.md` for `Finding 2` and confirm it still names the finding whose title is unchanged here.
- `claude plugin validate --strict plugin` prints `✔ Validation passed`.
