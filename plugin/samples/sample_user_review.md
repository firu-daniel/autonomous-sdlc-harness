# User review: feat/recent_searches_panel

> **This file is a format reference for the user-review text, at both of its entry points** — the supervised `/autonomous-sdlc-harness:branch-start-user-review-fix-plan`, which reads a review file the user wrote by hand, and the autonomous `/autonomous-sdlc-harness:branch-user-review` drop, which the watcher lands and chains into the fix flow. The user writes the real review in this same format after a hands-on review of a finished branch. Reference types — task-plan task numbers, code-review finding numbers, commit SHAs, file:line, and freeform descriptions — may be mixed freely within one numbered list. Keep each item short (one or two sentences). The `user-review-fix-plan-writer` agent verifies each item against the current code before classifying it Must Fix / Should Fix / Nice to Have / Invalid.
>
> The feature, branch, symbols, commit SHA and source paths below are an illustrative worked example — a "recent searches panel" — so the format has something concrete to be about. A real review names the adopting repository's own branch and files.

1. "Task 1 — Introduce `RecentSearchRecord` with fields `query_text` and `searched_at`" from the task plan says to add `query_text`, but the field is actually `queryText` in the code.
2. Finding 2 from the code review (the one about `persistRecentSearch` firing on submit / unmount) — the fix landed but only covers the submit path; unmount still does not save.
3. Commit `deadbeef` adds a hook that calls the data-layer service directly instead of going through a use case.
4. `src/presentation/search/components/SearchPanel.tsx:142` hardcodes a 14px font size for the recent-searches label — should use `typeScale.caption`.
5. The Submit button on the Light theme is invisible after the disabled-state color change from Should Fix Task 2 — the new background is the same hex as the page background.
