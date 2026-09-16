# Code Review: feat/recent_searches_panel

> **This file is the code-review INDEX format reference for the end-of-branch `branch-reviewer`**, and the format specification the `review-plan-reviewer` grades a real index against. A code review is split into this thin index (Context + `## Phase 2 Readiness — Ordered Fix List` + `## Must Fix` / `## Should Fix` / `## Nice to Have` sections that list each finding as a `### N. <title>` heading with a one-line pointer to its detail file + the intentional-divergence call-out) plus self-contained per-finding files under `<state_dir>/code_reviews/<branch>_code_review/finding_<N>.md`. No full description and no fix snippet lives in the index — both live in the finding's own file. See `${CLAUDE_PLUGIN_ROOT}/samples/sample_code_review/finding_1.md` for a per-finding detail file. Heading text must match exactly — the orchestrator keys off it. **The index filename is load-bearing**: it stays `<branch>_code_review.md`, because the round-suffix logic depends on that shape — a re-review of the same branch becomes `<branch>_code_review_2.md`, then `_3.md`, with its detail files under `<branch>_code_review_2/`, the folder always mirroring the suffix its index carries. The skeptic, architecture and reference-parity review families emit output byte-compatible with this file; only the names differ.
>
> **Placeholders used below, and where each comes from.** `<branch>` is the branch under review, read at runtime from a bare `git rev-parse --abbrev-ref HEAD`. `<state_dir>` is `harness.config.json` → `stateDir` (default `sdlc-harness/`), the run-artifact tree every artifact path here is relative to. `<parity_vocabulary>` is `harness.config.json` → `parity.referenceName`, and every sentence that uses it — including the whole closing call-out section — applies **only when `phases.parity` is `true`**. A readiness entry's `_(layer: …)_` tag values are `layers[].name` values, and the **catch-all** layer is the `layers[]` entry whose `path` is `"."`. A `**Finding K**` tag **may** be comma-joined across layers, written bottom-up with the catch-all last, because a finding's tag is a fix-target path and a fix lands wherever it has to reach — Finding 1 below carries `_(layer: data, presentation)_` for exactly that reason. A `**Task K**` tag never may: the plan cuts tasks single-layer so the loop has exactly one implementer to dispatch each to (`${CLAUDE_PLUGIN_ROOT}/samples/sample_task_plan.md` → `## Invariants`).
>
> **Illustrative values.** The feature, branch, symbols, quoted code and date are a worked example — the recent-searches panel on `feat/recent_searches_panel`, the same branch every other fixture in this directory describes, planned as `${CLAUDE_PLUGIN_ROOT}/samples/sample_story_plan.md`. Source paths sit under the example layer paths `src/data` and `src/presentation`, with the catch-all layer at the repository root; a real review uses the adopting repository's own `layers[].path` values. The second observation in `${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review.md` refers back to **Finding 2** of this index by number, so those two fixtures have to keep agreeing about which finding that number names.

## Context

**Branch:** `feat/recent_searches_panel`
**Date:** 2026-04-18
**Reviewed:** the whole branch diff against the default branch — the stored `RecentSearchRecord` and the read/write path behind `searchService` (Task 1), the panel and its extracted `SearchPanelRecentLabel` (Task 2), and the root-level entry-point registration and documentation (Task 3), plus the tests that ship with them.

Every accompanying test the touched layers' conventions documents require is present and green: the record's stored round-trip and the extracted label's own test. The entry point registered at the repository root resolves and the panel is reachable end to end from a cold start, which is the story index's second `Top risks:` entry. **When `phases.parity` is `true`**, the stored keys `query_text` / `searched_at`, the read limit and the one-tap re-run behaviour were cross-checked against the `<parity_vocabulary>` implementation's own recent-searches panel and match — the read *ordering* does not, and that is Finding 1. The three findings below are what is left.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top-to-bottom; the committer flips each one to `[x]` as that fix's commit lands. **Only the committing role flips a marker** — the `committer` agent in every flow that dispatches one, the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else (e.g., sub-step bullets inside individual per-finding files) are informational progress markers for the implementer agent — they are NEVER the iteration source and the committer does NOT touch them.

Each entry resolves to a self-contained `<state_dir>/code_reviews/<branch>_code_review/finding_<K>.md` file via its `**Finding K**` reference (1-to-1 with the `### K. <title>` pointers below) — here `${CLAUDE_PLUGIN_ROOT}/samples/sample_code_review/finding_<K>.md`. Sorted "lowest blast-radius first" → "wider refactors last". **The two numberings are independent, and here they deliberately disagree:** the leading `N.` is the fix order, while the `K` in `**Finding K**` is that finding's stable identity — the number its detail file, its `### K. <title>` pointer and every later reference to it carry — so re-ordering this list never renumbers a finding.

1. [ ] **Finding 3** — Name the surface in the root `README.md` after the label the panel actually renders. _(layer: general)_
2. [ ] **Finding 2** — Persist the pending query from the search hook's effect cleanup (the unmount path) as well as from its submit handler, and make the write idempotent. _(layer: presentation)_
3. [ ] **Finding 1** — Order the recent-search read by `searched_at` descending in the query before it is limited, and drop the panel's in-memory sort. _(layer: data, presentation)_

---

## Must Fix

### 1. Recent searches are truncated before they are ordered, so the panel lists the oldest searches
→ [finding_1.md](sample_code_review/finding_1.md)

---

## Should Fix

### 2. `persistRecentSearch` fires only on submit, so a query typed and navigated away from is never recorded
→ [finding_2.md](sample_code_review/finding_2.md)

---

## Nice to Have

### 3. The root `README.md` calls the surface "Search history" while the panel's label reads "Recent searches"
→ [finding_3.md](sample_code_review/finding_3.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

These are NOT fixes and do NOT appear in the Phase 2 Readiness list — they are call-outs for the user to confirm. **The whole section applies only when `phases.parity` is `true`**; with the phase off there is no reference implementation to diverge from and the section is empty.

- **Intentional divergence — the empty state renders nothing.** The `<parity_vocabulary>` panel renders a short "nothing here yet" caption when no search has been run; the port renders nothing at all. This is authorized rather than missing: Task 2's `**Work:**` bullet says "render nothing when the list is empty", and that per-task file was opened and the citation confirmed to say it. Flagged here so the user can confirm the product call, not fixed.
- **Verified-OK — the stored shape and the read limit match.** The keys `query_text` / `searched_at` and the page size the panel reads are identical to the `<parity_vocabulary>` implementation's own record and query. Its recent-searches source was read top to bottom rather than grepped for the two field names, which is how the ordering divergence in Finding 1 surfaced at all.
