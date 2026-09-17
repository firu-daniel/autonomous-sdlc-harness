# Branch statistics: feat_docs_catalog_retrieval

## Summary

- `success_rate`: **`100%`** — headline metric.
- `story_points_total`: `355` — denominator (sum of every task's `_(points: <N>)_` story-point estimate in the story index's `## Phase 2 Readiness — Ordered Fix List`).
- `issue_cost_total`: `0` — subtraction (sum of each user-review observation's severity weight, in story-point units).
- `story_plan_tasks`: `25` — retained raw count of `## Phase 2 Readiness — Ordered Fix List` task entries.
- `user_review_issues`: `0` — retained raw count of observations across all `feat_docs_catalog_retrieval_review*.md` user-review files.

Formula:

```
success_rate = round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1) percent
```

Worked example: `issue_cost_total` is `0`, so the **no issues** edge case applies directly — `round(clamp((355 - 0) / 355, 0, 1) * 100, 1)` = `100%`.

Edge cases (the rate is always computed via the formula, then adjusted by these rules):

- **No issues** — when `issue_cost_total` is `0` (no user review yet, or a fully clean review) the rate is `100%`. **This is the case here:** no user review has run on this branch yet.
- **Clamped at zero** — when `issue_cost_total > story_points_total` (weighted defect load exceeds the planned story points), the raw value goes negative; the rate is **clamped to `0%`** rather than recorded as a negative number. The rate never exceeds `100%`.
- **No points** — when `story_points_total` is `0` the rate is recorded as `n/a` (cannot divide by zero). This is only reachable when the story index has **zero** task entries; a story index that has tasks but no `_(points: …)_` tags falls back to the legacy task-count denominator (see below), so it still produces a number.
- **No points tags (back-compat fallback)** — when the story index has task entries but **none** carry a `_(points: …)_` tag (an older branch predating story points), `story_points_total` falls back to `story_plan_tasks` (the legacy task-count denominator) and `## Notes` records that points were unavailable. This fallback did **not** fire here: every one of the 25 entries carries a `_(points: …)_` tag.

## Counts breakdown

Per-source raw numbers and per-issue costs are retained so the metric can be refined later without re-deriving them.

- **Story-index source** — `story_points_total`: `355`, `story_plan_tasks`: `25`
  - counted from `harness-runs/story_plans/feat_docs_catalog_retrieval_story_plan.md` (the `N. [ ] **Task K** — … _(layer: …)_ _(points: <N>)_` entries under its `## Phase 2 Readiness — Ordered Fix List`, counting `[ ]` and `[x]` alike; all 25 entries are `[x]`).
  - per-task points (`_(points: <N>)_` tag on each entry), summed:
    - Task 1 (layer `cli`): `15`
    - Task 2 (layer `cli`): `16`
    - Task 3 (layer `cli`): `15`
    - Task 4 (layer `cli`): `10`
    - Task 5 (layer `cli`): `16`
    - Task 6 (layer `cli`): `15`
    - Task 7 (layer `cli`): `15`
    - Task 8 (layer `cli`): `16`
    - Task 9 (layer `cli`): `14`
    - Task 10 (layer `cli`): `20`
    - Task 11 (layer `cli`): `12`
    - Task 12 (layer `cli`): `18`
    - Task 13 (layer `cli`): `18`
    - Task 14 (layer `cli`): `7`
    - Task 15 (layer `plugin`): `15`
    - Task 16 (layer `plugin`): `15`
    - Task 17 (layer `plugin`): `11`
    - Task 18 (layer `general`): `10`
    - Task 19 (layer `general`): `14`
    - Task 20 (layer `general`): `17`
    - Task 21 (layer `general`): `20`
    - Task 22 (layer `general`): `10`
    - Task 23 (layer `general`): `15`
    - Task 24 (layer `general`): `6`
    - Task 25 (layer `general`): `15`
    - **sum (`story_points_total`)**: `355`
  - `dispositioned_points`: `0` — no commit in `main..HEAD` carries the `record disposition of ` record, so no task here was closed without a fix. No unit token and no short SHA is listed, and no unpointed matched token was found.
  - (Back-compat: not applicable — every entry carries a `_(points: …)_` tag, so the task-count fallback of `25` was not used.)
- **User-review source** — `user_review_issues`: `0`, `issue_cost_total`: `0` (per user-review file, then summed)
  - the glob `harness-runs/user_reviews/feat_docs_catalog_retrieval_review*.md` matched **no files** — this is the first write, before any user review has run. The `harness-runs/user_reviews/` directory does hold files for an unrelated branch (`feat_readme_summary_compact_llms_txt_*`), none of which the branch-scoped glob matches, and any `*_fix_plan*` path is excluded by the pattern regardless.
  - **total**: `0` observations → `issue_cost_total` `0`
  - Each file's observation count is the count of whatever top-level enumeration that file uses, taken from the first of four arms to return non-zero and never summed across arms: (1) numbered `##`–`####` headings with required trailing punctuation, `grep -cE '^#{2,4} +[0-9]+[.):]'`; (2) top-level numbered/bulleted list items, `grep -cE '^[0-9]+\.|^[-*][[:space:]]'`; (3) an explicit per-observation marker the file itself uses, with the matching grep recorded beside the count; (4) `1`, reserved for a file with no enumeration of any kind. No arm was exercised here, because no file matched.
  - Each observation is weighted in story-point units: **Major** `15` (explicit `[major]` marker, or the observation describes a broken/incorrect user-facing flow, a missing/client-only authorization gate, data loss/corruption/unprotected data, or an absent whole ported behaviour — the deciding phrase is quoted beside the observation), **Trivial** `2` (explicit `[trivial]` marker), **Minor** `5` (the default for every observation without a Major/Trivial classification). No observation was weighted in this round.

## Status

- status: `pre-user-review` — `pre-user-review` means this file was written right after the branch (code) review with no user review yet (`issue_cost_total` `0` → `100%`); `post-user-review` means it was re-written after user-review fixes, with the issues from the `feat_docs_catalog_retrieval_review*.md` files counted and weighted.
- last_updated: `2026-09-17`

## Notes

This is a deliberately basic but points-weighted estimate of the agentic-workflow success rate. The headline rate is `(story_points_total - issue_cost_total) / story_points_total`: the denominator is the sum of the story-plan tasks' story-point complexity estimates (the scope the agent committed to, weighted by effort rather than raw task count), and the subtraction is the severity-weighted cost of user-review observations (defects found after the workflow finished, each costing Minor `5` by default, Major `15` on an explicit marker or a documented broken-flow / security / data-integrity / missing-behaviour classification — with the deciding phrase quoted in the breakdown — and Trivial `2` only on an explicit marker). The retained raw counts (`story_plan_tasks`, `user_review_issues`) and per-issue costs under `## Counts breakdown` let the metric be refined later (e.g., richer per-issue severity triage) without losing the raw data. The `100%` here reflects only that no user review has run yet, not a reviewed-clean branch; the post-user-review update overwrites this file with the counted and weighted result. A unit closed via the unit loop's dispositioned outcome keeps its points in the denominator, so the rate counts them as delivered; `dispositioned_points` is `0` on this branch and no dispositioned unit was matched, so no such sentence appears.
