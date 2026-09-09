# Branch statistics: feat/recent_searches_panel

> **This file is the `statistics.md` format reference for the `statistics-plan-writer` agent** — the headings, their order, the formula block and the edge-case rules a real report carries. The numbers below are illustrative and are never copied: the writer computes its own. They are not invented either — each is re-derived from the two fixtures a real run counts, `${CLAUDE_PLUGIN_ROOT}/samples/sample_story_plan.md` (the denominator) and `${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review.md` (the subtraction), so this worked example is internally consistent with the formula and can be checked by hand against those two files. A real report lives at `<state_dir>/branch_statistics/<branch>/statistics.md`, one per branch and overwritten rather than round-suffixed, never at this samples root.
>
> **There is deliberately no `## Phase 2 Readiness — Ordered Fix List` here.** Nothing keys off a statistics report: it is a report, not a fix list, so there is no per-item loop to iterate, no per-finding files beside it and no checkbox a committer flips. A statistics file that grows a readiness section has been written by an agent that mistook it for a plan.
>
> **Placeholders used below, and where each comes from.** `<branch>` is the branch being measured, read at runtime from a bare `git rev-parse --abbrev-ref HEAD`. `<state_dir>` is `harness.config.json` → `stateDir` (default `sdlc-harness/`), the run-artifact tree both inputs and the output sit under. `<default_branch>` is `harness.config.json` → `defaultBranch`, the base of the commit range the `dispositioned_points` line is derived over. The `last_updated:` value under `## Status` is the placeholder `<YYYY-MM-DD>` and stays a placeholder here — a real report writes the actual date it was generated and never carries this placeholder through.
>
> **Illustrative values.** The feature and branch are a worked example — the recent-searches panel on `feat/recent_searches_panel`, the same branch every other fixture in this directory describes.

## Summary

- `success_rate`: **`54.5%`** — headline metric.
- `story_points_total`: `55` — denominator (sum of every task's `_(points: <N>)_` story-point estimate in the story index's `## Phase 2 Readiness — Ordered Fix List`).
- `issue_cost_total`: `25` — subtraction (sum of each user-review observation's severity weight, in story-point units).
- `story_plan_tasks`: `3` — retained raw count of `## Phase 2 Readiness — Ordered Fix List` task entries.
- `user_review_issues`: `5` — retained raw count of observations across all `<branch>_review*.md` user-review files.

Formula:

```
success_rate = round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1) percent
```

Worked example: `round(clamp((55 - 25) / 55, 0, 1) * 100, 1)` = `round(54.5454…, 1)` = `54.5%`.

Edge cases (the rate is always computed via the formula, then adjusted by these rules):

- **No issues** — when `issue_cost_total` is `0` (no user review yet, or a fully clean review) the rate is `100%`.
- **Clamped at zero** — when `issue_cost_total > story_points_total` (weighted defect load exceeds the planned story points), the raw value goes negative; the rate is **clamped to `0%`** rather than recorded as a negative number. The rate never exceeds `100%`.
- **No points** — when `story_points_total` is `0` the rate is recorded as `n/a` (cannot divide by zero). This is only reachable when the story index has **zero** task entries; a story index that has tasks but no `_(points: …)_` tags falls back to the legacy task-count denominator (see below), so it still produces a number.
- **No points tags (back-compat fallback)** — when the story index has task entries but **none** carry a `_(points: …)_` tag (an older branch predating story points), `story_points_total` falls back to `story_plan_tasks` (the legacy task-count denominator) and `## Notes` records that points were unavailable.

## Counts breakdown

Per-source raw numbers and per-issue costs are retained so the metric can be refined later without re-deriving them.

- **Story-index source** — `story_points_total`: `55`, `story_plan_tasks`: `3`
  - counted from `<state_dir>/story_plans/<branch>_story_plan.md` — here `${CLAUDE_PLUGIN_ROOT}/samples/sample_story_plan.md` (the `N. [ ] **Task K** — … _(layer: …)_ _(points: <N>)_` entries under its `## Phase 2 Readiness — Ordered Fix List`, counting `[ ]` and `[x]` alike).
  - per-task points (`_(points: <N>)_` tag on each entry), summed:
    - Task 1: `20`
    - Task 2: `15`
    - Task 3: `20`
    - **sum (`story_points_total`)**: `55`
  - `dispositioned_points`: `0` — no commit in `<default_branch>..HEAD` carries the `record disposition of ` record, so no task here was closed without a fix. When it is non-zero, each dispositioned unit's token and short SHA is listed on this line (an unpointed matched token — a `**Finding K**` unit, or a stale-base match — is listed here too and summed nowhere), and `## Notes` states the figure.
  - (Back-compat: if no entry carried a `_(points: …)_` tag, `story_points_total` would fall back to `story_plan_tasks` = `3`, noted in `## Notes`.)
- **User-review source** — `user_review_issues`: `5`, `issue_cost_total`: `25` (per user-review file, then summed)
  - `<branch>_review.md` — here `${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review.md`: `5` observations → cost `25`. Counted by **arm 2, top-level list items** — `grep -cE '^[0-9]+\.|^[-*][[:space:]]' <file>` → `5`, arm 1 having returned `0`. Each observation's assigned weight beside it:
    1. `RecentSearchRecord` field named `queryText` where the task plan said `query_text` → **Minor** `5`
    2. code-review Finding 2's fix covers the submit path but not unmount → **Minor** `5`
    3. a hook calls the data-layer service directly instead of going through a use case → **Minor** `5`
    4. a hardcoded `14px` font size where `typeScale.caption` belongs → **Minor** `5`
    5. the Submit button's disabled colour on the Light theme reads as invisible → **Minor** `5`
  - **total**: `5` observations → `issue_cost_total` `25`
  - Each file's observation count is the count of whatever top-level enumeration that file uses, taken from the first of four arms to return non-zero and never summed across arms: (1) numbered `##`–`####` headings with required trailing punctuation, `grep -cE '^#{2,4} +[0-9]+[.):]'` — here `0`; (2) top-level numbered/bulleted list items, `grep -cE '^[0-9]+\.|^[-*][[:space:]]'` — here `5`, so arm 2 is this file's count; (3) an explicit per-observation marker the file itself uses, with the matching grep recorded beside the count; (4) `1`, reserved for a file with no enumeration of any kind. The arm and its grep are recorded beside each file's count above. Every observation the user wrote is counted and weighted, including any a later fix plan verifies as OK — the count measures what the user found, not what survived triage.
  - Each observation is weighted in story-point units: **Major** `15` (explicit `[major]` marker, or the observation describes a broken/incorrect user-facing flow, a missing/client-only authorization gate, data loss/corruption/unprotected data, or an absent whole ported behaviour — the deciding phrase is quoted beside the observation), **Trivial** `2` (explicit `[trivial]` marker), **Minor** `5` (the default for every observation without a Major/Trivial classification).

**Why all five here took the Minor default.** The weight is assigned from the observation **as the reviewer wrote it**, not from what a later fix plan concluded about it: none of the five carries an explicit `[major]` or `[trivial]` marker, and none, read from the review text alone, describes one of the Major conditions — no end-to-end broken user-facing flow, no missing or client-only authorization gate, no data loss, corruption or unprotected data, and no whole ported behaviour absent. Any one of them would have been Major had the review said so with a marker or described one of those conditions; a partial path, a layering shortcut and a colour-token miss are not those. Reaching downstream for a heavier weight — grading an observation by the severity the fix turned out to have — is how two runs of the same metric stop being comparable, so the classification never looks past the review file.

## Status

- status: `post-user-review` — `pre-user-review` means this file was written right after the branch (code) review with no user review yet (`issue_cost_total` `0` → `100%`); `post-user-review` means it was re-written after user-review fixes, with the issues from the `<branch>_review*.md` files counted and weighted.
- last_updated: `<YYYY-MM-DD>`

## Notes

This is a deliberately basic but points-weighted estimate of the agentic-workflow success rate. The headline rate is `(story_points_total - issue_cost_total) / story_points_total`: the denominator is the sum of the story-plan tasks' story-point complexity estimates (the scope the agent committed to, weighted by effort rather than raw task count), and the subtraction is the severity-weighted cost of user-review observations (defects found after the workflow finished, each costing Minor `5` by default, Major `15` on an explicit marker or a documented broken-flow / security / data-integrity / missing-behaviour classification — with the deciding phrase quoted in the breakdown — and Trivial `2` only on an explicit marker). The retained raw counts (`story_plan_tasks`, `user_review_issues`) and per-issue costs under `## Counts breakdown` let the metric be refined later (e.g., richer per-issue severity triage) without losing the raw data. A unit closed via the unit loop's dispositioned outcome keeps its points in the denominator, so the rate counts them as delivered; where `dispositioned_points` is non-zero, a report states it here as *"`<N>` story points closed without a fix (`Task K`, …)"* — here it is `0`, so no such sentence appears. Do not hard-code a real date under `## Status` in this sample — it uses the `<YYYY-MM-DD>` placeholder, which a real report replaces with the date it was generated.
