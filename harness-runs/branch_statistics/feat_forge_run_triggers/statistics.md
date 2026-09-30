# Branch statistics: feat_forge_run_triggers

## Summary

- `success_rate`: **`100%`** — headline metric.
- `story_points_total`: `302` — denominator (sum of every task's `_(points: <N>)_` story-point estimate in the story index's `## Phase 2 Readiness — Ordered Fix List`).
- `issue_cost_total`: `0` — subtraction (sum of each user-review observation's severity weight, in story-point units).
- `story_plan_tasks`: `24` — retained raw count of `## Phase 2 Readiness — Ordered Fix List` task entries.
- `user_review_issues`: `0` — retained raw count of observations across all `feat_forge_run_triggers_review*.md` user-review files.

Formula:

```
success_rate = round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1) percent
```

Worked example: `round(clamp((302 - 0) / 302, 0, 1) * 100, 1)` = `100%` (and the no-issues rule below yields `100%` directly).

Edge cases (the rate is always computed via the formula, then adjusted by these rules):

- **No issues** — when `issue_cost_total` is `0` (no user review yet, or a fully clean review) the rate is `100%`.
- **Clamped at zero** — when `issue_cost_total > story_points_total` (weighted defect load exceeds the planned story points), the raw value goes negative; the rate is **clamped to `0%`** rather than recorded as a negative number. The rate never exceeds `100%`.
- **No points** — when `story_points_total` is `0` the rate is recorded as `n/a` (cannot divide by zero). This is only reachable when the story index has **zero** task entries; a story index that has tasks but no `_(points: …)_` tags falls back to the legacy task-count denominator (see below), so it still produces a number.
- **No points tags (back-compat fallback)** — when the story index has task entries but **none** carry a `_(points: …)_` tag, `story_points_total` falls back to `story_plan_tasks` (the legacy task-count denominator) and `## Notes` records that points were unavailable.

## Counts breakdown

Per-source raw numbers and per-issue costs are retained so the metric can be refined later without re-deriving them.

- **Story-index source** — `story_points_total`: `302`, `story_plan_tasks`: `24`
  - counted from `harness-runs/story_plans/feat_forge_run_triggers_story_plan.md` (the `N. [x] **Task K** — … _(layer: …)_ _(points: <N>)_` entries under its `## Phase 2 Readiness — Ordered Fix List`, counting `[ ]` and `[x]` alike; all 24 are `[x]`).
  - per-task points (`_(points: <N>)_` tag on each entry), summed:
    - Task 1: `10`
    - Task 2: `10`
    - Task 3: `15`
    - Task 4: `15`
    - Task 5: `8`
    - Task 6: `15`
    - Task 7: `20`
    - Task 8: `8`
    - Task 9: `8`
    - Task 10: `20`
    - Task 11: `12`
    - Task 12: `15`
    - Task 13: `20`
    - Task 14: `15`
    - Task 15: `10`
    - Task 16: `10`
    - Task 17: `5`
    - Task 18: `8`
    - Task 19: `10`
    - Task 20: `20`
    - Task 21: `20`
    - Task 22: `10`
    - Task 23: `10`
    - Task 24: `8`
    - **sum (`story_points_total`)**: `302`
  - `dispositioned_points`: `0` — no commit in `dev..HEAD` (`git log --format='%h %s%n%b' dev..HEAD`) carries the `record disposition of ` record, so no unit on this branch was closed without a fix; no tokens matched, pointed or unpointed.
  - Back-compat fallback did not fire: every one of the 24 entries carries a `_(points: …)_` tag.
- **User-review source** — `user_review_issues`: `0`, `issue_cost_total`: `0`
  - no `harness-runs/user_reviews/feat_forge_run_triggers_review*.md` file exists yet (pre-user-review write), so no file was counted and no enumeration arm was applied.
  - **total**: `0` observations → `issue_cost_total` `0`
  - Each file's observation count, once review files exist, is the count of whatever top-level enumeration that file uses, taken from the first of four arms to return non-zero and never summed across arms: (1) numbered `##`–`####` headings with required trailing punctuation, `grep -cE '^#{2,4} +[0-9]+[.):]'`; (2) top-level numbered/bulleted list items, `grep -cE '^[0-9]+\.|^[-*][[:space:]]'`; (3) an explicit per-observation marker the file itself uses, with the matching grep recorded beside the count; (4) `1`, reserved for a file with no enumeration of any kind. Any `*_fix_plan*` match is dropped before counting.
  - Each observation is weighted in story-point units: **Major** `15` (explicit `[major]` marker, or the observation describes a broken/incorrect user-facing flow, a missing/client-only authorization gate, data loss/corruption/unprotected data, or an absent whole ported behaviour — the deciding phrase is quoted beside the observation), **Trivial** `2` (explicit `[trivial]` marker), **Minor** `5` (the default for every observation without a Major/Trivial classification).

## Status

- status: `pre-user-review` — written right after the branch (code) review with no user review yet (`issue_cost_total` `0` → `100%`); a `post-user-review` rewrite will count and weight the issues from the `feat_forge_run_triggers_review*.md` files.
- last_updated: `2026-09-30`

## Notes

This is a deliberately basic but points-weighted estimate of the agentic-workflow success rate. The headline rate is `(story_points_total - issue_cost_total) / story_points_total`: the denominator is the sum of the story-plan tasks' story-point complexity estimates (the scope the agent committed to, weighted by effort rather than raw task count), and the subtraction is the severity-weighted cost of user-review observations (defects found after the workflow finished, each costing Minor `5` by default, Major `15` on an explicit marker or a documented broken-flow / security / data-integrity / missing-behaviour classification — with the deciding phrase quoted in the breakdown — and Trivial `2` only on an explicit marker). The retained raw counts (`story_plan_tasks`, `user_review_issues`) and per-issue costs under `## Counts breakdown` let the metric be refined later without losing the raw data. No unit on this branch was closed via the dispositioned outcome, so no dispositioned-points sentence applies.
