### Task 9 — Show the site anchor in the user-review fix-plan sample fixtures

**Goal:** Make the fix-plan fixtures `user-review-fix-plan-writer` dereferences carry the site anchor its per-finding contract now requires, and anchor the index's verified-OK reasoning, while leaving the verbatim copy of the user's own observations as the user wrote them.

**Depends on:** Task 7, which makes `user-review-fix-plan-writer.md` store C5 in each `finding_<N>.md` and turn a user's `<file>:<line>` into an anchor. The clause the fixtures demonstrate — restated so this task needs no other file:

```text
the site anchor (the repo-relative path plus the symbol, heading or short quoted substring that locates the change, with a quoted substring beside any symbol whose body spans more than the change and a bare path only when the change is the whole file; a line number may follow as a navigation hint, and nothing depends on it)
```

Its written form is `` `<file>` (`<symbol>`) — "<quoted substring>" ``; the `**File:**` label is kept.

**Where this task stops.** User input is not rewritten: `## Source observations` in the index is a verbatim copy of `plugin/samples/sample_user_review.md`, and both keep observation 4's `src/presentation/search/components/SearchPanel.tsx:142`; finding 1's *"The user cited `SearchPanel.tsx:142`"* quotes that input and stays. No title, number, severity or readiness entry changes. The code-review fixtures are Task 8's.

### Targets

- `plugin/samples/sample_user_review_fix_plan.md` — `## Out of scope / verified-OK`.
- `plugin/samples/sample_user_review_fix_plan/finding_1.md`
- `plugin/samples/sample_user_review_fix_plan/finding_2.md`
- `plugin/samples/sample_user_review_fix_plan/finding_3.md`

**Work:**

- [ ] All three finding files' header note: replace *"The `**File:**` line is a plain repo-relative path in this shipped sample; in a real fix plan it is a link into the working tree, and its path sits under"* with *"The `**File:**` line is the site anchor a real fix plan carries — the repo-relative path, the symbol, and a quoted substring an implementer can grep — and its path sits under"*.
- [ ] `**File:**` lines: finding 1 → `` `src/presentation/search/components/SearchPanelRecentLabel.tsx` (`SearchPanelRecentLabel`) — "fontSize: typeScale.body" ``; finding 2 → `` `src/data/search/records/recentSearchRecord.ts` (`RecentSearchRecord`) — "queryText" ``; finding 3 → `` `src/presentation/search/hooks/useRecentSearches.ts` (`useRecentSearches`) — "searchService.fetchRecentSearches(" ``. In finding 1's `**Fix:**` replace `` in `SearchPanelRecentLabel.tsx:21` `` with `` in `SearchPanelRecentLabel.tsx` (`SearchPanelRecentLabel`) ``.
- [ ] Index observation 2: replace `` Read `src/presentation/search/hooks/useSearchHistory.ts:88-104`: `` with `` Read `src/presentation/search/hooks/useSearchHistory.ts` (`useSearchHistory`) — "persistRecentSearchUseCase.execute(": `` and *"The submit path (line 142) and the `beforeunload` listener (line 161) also call it."* with *"The submit handler and the `beforeunload` listener also call it."*
- [ ] Index observation 5: replace `` Read `src/presentation/components/buttons/PrimaryButton.tsx:54-71`: `` with `` Read `src/presentation/components/buttons/PrimaryButton.tsx` (`PrimaryButton`) — "theme.disabledSurface": ``.

**Verification:**

- `grep -rnE -e '\.tsx*:[0-9]' -e '\(line [0-9]' plugin/samples/sample_user_review_fix_plan.md plugin/samples/sample_user_review_fix_plan` returns only `## Source observations`' observation 4 and finding 1's *"The user cited `SearchPanel.tsx:142`"* — both user input.
- `## Source observations` is still byte-identical to the numbered list in `plugin/samples/sample_user_review.md`: compare the five lines.
- Each finding is still implementable from its own file: its `**File:**` line names a symbol and a quoted substring the body or fix also names (`typeScale.body`, `queryText`, `searchService.fetchRecentSearches`).
- `claude plugin validate --strict plugin` prints `✔ Validation passed`.
- **Deviations from plan:** The standalone `claude plugin validate --strict plugin` call was refused by the permission layer; the evidence is gate `1a plugin manifest` reporting `ok` in `bash scripts/test.sh`, which runs that same command (`scripts/run-gates.sh`), not the printed `✔ Validation passed` line.
