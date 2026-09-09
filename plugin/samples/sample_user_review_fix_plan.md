# User-Review Fix Plan: feat/recent_searches_panel

> **This file is the user-review-fix-plan INDEX format reference for the `user-review-fix-plan-writer` agent.** A fix plan is split into this thin index (Context + `## Phase 2 Readiness — Ordered Fix List` + `## Must Fix` / `## Should Fix` / `## Nice to Have` sections that list each finding with a one-line pointer to its detail file + `## Out of scope / verified-OK` + `## Source observations`) plus self-contained per-finding files under `<state_dir>/user_reviews/<branch>_fix_plan/finding_<N>.md`. The filename stays `<branch>_fix_plan.md` (round-suffix logic depends on it: a re-run becomes `<branch>_fix_plan_2.md` with detail files under `<branch>_fix_plan_2/`). The source observations the writer verified live in `${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review.md`. See `${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review_fix_plan/finding_1.md` for a per-finding detail file. Heading text must match exactly — the orchestrator keys off it.
>
> **Placeholders used below, and where each comes from.** `<branch>` is the branch under review, read at runtime from a bare `git rev-parse --abbrev-ref HEAD`. `<state_dir>` is `harness.config.json` → `stateDir` (default `sdlc-harness/`), the run-artifact tree every artifact path here is relative to. `<parity_vocabulary>` is `harness.config.json` → `parity.referenceName`, and every sentence that uses it applies **only when `phases.parity` is `true`**. A readiness entry's `_(layer: …)_` tag values are `layers[].name` values.
>
> **Illustrative values.** The feature, branch, symbols and commit SHA are a worked example; source paths sit under the example layer paths `src/data`, `src/domain` and `src/presentation`, and a real fix plan uses the adopting repository's own `layers[].path` values.

## Context

**Branch:** `feat/recent_searches_panel`
**Source user review:** [`sample_user_review.md`](sample_user_review.md) — in a real fix plan this line names `<state_dir>/user_reviews/<branch>_review.md`.
**Summary:** The user flagged 5 observations after the hands-on review of the new recent-searches panel — 3 are valid and need fixes (one stored-shape break, one layering refactor, one styling polish), 2 were verified against the current code and do not apply.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top-to-bottom; the committer flips each one to `[x]` as that fix's commit lands. **Only the committing role flips a marker** — the `committer` agent in every flow that dispatches one, the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else (e.g., sub-step bullets inside individual per-finding files) are informational progress markers for the implementer agent — they are NEVER the iteration source and the committer does NOT touch them.

Each entry resolves to a self-contained `<state_dir>/user_reviews/<branch>_fix_plan/finding_<K>.md` file via its `**Finding K**` reference (1-to-1 with the `### K. <title>` pointers below). Sorted "lowest blast-radius first" → "wider refactors last".

1. [ ] **Finding 1** — Tighten `SearchPanelRecentLabel` font token from `typeScale.body` to `typeScale.caption` to match the caption-step label in the `<parity_vocabulary>` implementation. _(layer: presentation)_
2. [ ] **Finding 2** — Map `RecentSearchRecord.queryText` / `searchedAt` onto the stored keys `query_text` / `searched_at` (record + mapper + tests). Breaks the stored document shape today. _(layer: data, domain)_
3. [ ] **Finding 3** — Route `useRecentSearches` through a `fetchRecentSearchesUseCase` instead of calling `searchService` directly from the hook. _(layer: domain, presentation)_

---

## Must Fix

### 2. `RecentSearchRecord` property names break the stored document shape
→ [finding_2.md](sample_user_review_fix_plan/finding_2.md)

---

## Should Fix

### 3. `useRecentSearches` calls `searchService` directly, bypassing the use-case layer
→ [finding_3.md](sample_user_review_fix_plan/finding_3.md)

---

## Nice to Have

### 1. `SearchPanelRecentLabel` label uses the wrong type-scale token
→ [finding_1.md](sample_user_review_fix_plan/finding_1.md)

---

## Out of scope / verified-OK

Both invalid observations were verified by reading the cited code in the current working tree. The user can sanity-check the writer's reasoning below. These are NOT in the Phase 2 Readiness list.

- **Observation 2 — "Finding 2's unmount path still does not persist a recent search."** Verified-OK. Read `src/presentation/search/hooks/useSearchHistory.ts:88-104`: the cleanup function returned from the effect calls `persistRecentSearchUseCase.execute(...)` before clearing the hook's local state, which is the unmount path for this hook. The submit path (line 142) and the `beforeunload` listener (line 161) also call it. Finding 2's fix shipped fully.
- **Observation 5 — "Submit button is invisible on Light theme after the disabled-state color change."** Verified-OK. Read `src/presentation/components/buttons/PrimaryButton.tsx:54-71`: the disabled state uses `theme.disabledSurface` for the background and `theme.onDisabledSurface` for the label. On the Light theme those resolve to `#E0E0E0` on `#F7F7F7` (page background) — a 2.1:1 contrast ratio, which is low but visible. The user likely viewed it against a card surface (`#FFFFFF`), which gives a stronger contrast; against the page background the button is present, just subdued. If the user wants higher contrast in the disabled state, that is a separate design decision, not a bug.

---

## Source observations

Verbatim copy of the source user review — here `sample_user_review.md`, in a real fix plan `<state_dir>/user_reviews/<branch>_review.md` — so this fix plan is self-contained: the implement command does NOT re-read the user-review file. **This section stays in the index.**

1. "Task 1 — Introduce `RecentSearchRecord` with fields `query_text` and `searched_at`" from the task plan says to add `query_text`, but the field is actually `queryText` in the code.
2. Finding 2 from the code review (the one about `persistRecentSearch` firing on submit / unmount) — the fix landed but only covers the submit path; unmount still does not save.
3. Commit `deadbeef` adds a hook that calls the data-layer service directly instead of going through a use case.
4. `src/presentation/search/components/SearchPanel.tsx:142` hardcodes a 14px font size for the recent-searches label — should use `typeScale.caption`.
5. The Submit button on the Light theme is invisible after the disabled-state color change from Should Fix Task 2 — the new background is the same hex as the page background.
