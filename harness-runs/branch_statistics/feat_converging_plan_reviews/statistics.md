# Branch statistics: feat_converging_plan_reviews

## Summary

- `success_rate`: **`100%`**, the headline metric.
- `story_points_total`: `495`, the denominator: the sum of every task's `_(points: <N>)_` story-point estimate in the story index's `## Phase 2 Readiness — Ordered Fix List`.
- `issue_cost_total`: `0`, the subtraction: the sum of each user-review observation's severity weight, in story-point units.
- `story_plan_tasks`: `33`, the retained raw count of `## Phase 2 Readiness — Ordered Fix List` task entries.
- `user_review_issues`: `0`, the retained raw count of observations across all `feat_converging_plan_reviews_review*.md` user-review files.

Formula:

```
success_rate = round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1) percent
```

Worked example: `round(clamp((495 - 0) / 495, 0, 1) * 100, 1)` = `100%`.

Edge cases (the rate is always computed with the formula, then adjusted by these rules):

- **No issues**: when `issue_cost_total` is `0` (no user review yet, or a fully clean review), the rate is `100%`. That rule applies here.
- **Clamped at zero**: when `issue_cost_total > story_points_total` (the weighted defect load exceeds the planned story points), the raw value goes negative. The rate is **clamped to `0%`** and never recorded as a negative number. The rate never exceeds `100%`.
- **No points**: when `story_points_total` is `0`, the rate is recorded as `n/a` (it cannot divide by zero). Only a story index with **zero** task entries reaches this case. A story index that has tasks but no `_(points: …)_` tags falls back to the legacy task-count denominator (see below), so it still produces a number.
- **No points tags (back-compat fallback)**: when the story index has task entries but **none** carry a `_(points: …)_` tag, `story_points_total` falls back to `story_plan_tasks` and `## Notes` records that points were unavailable.

## Counts breakdown

The per-source raw numbers and per-issue costs are kept so the metric can be refined later without re-deriving them.

- **Story-index source**: `story_points_total`: `495`, `story_plan_tasks`: `33`
  - Counted from `harness-runs/story_plans/feat_converging_plan_reviews_story_plan.md`, using the `N. [ ] **Task K** — … _(layer: …)_ _(points: <N>)_` entries under its `## Phase 2 Readiness — Ordered Fix List` and counting `[ ]` and `[x]` alike. The section-scoped `awk … | grep -cE '^[0-9]+\.\s*\[[ x]\]\s*\*\*Task'` gives `33`.
  - Per-task points (the `_(points: <N>)_` tag on each entry, in index order), summed:
    - Task 1: `20`
    - Task 2: `10`
    - Task 3: `20`
    - Task 4: `20`
    - Task 5: `20`
    - Task 6: `15`
    - Task 7: `20`
    - Task 8: `15`
    - Task 9: `10`
    - Task 10: `20`
    - Task 11: `20`
    - Task 12: `20`
    - Task 13: `10`
    - Task 14: `10`
    - Task 15: `15`
    - Task 16: `15`
    - Task 17: `15`
    - Task 18: `15`
    - Task 19: `20`
    - Task 20: `20`
    - Task 21: `15`
    - Task 22: `10`
    - Task 23: `10`
    - Task 24: `10`
    - Task 25: `20`
    - Task 26: `20`
    - Task 27: `10`
    - Task 32: `10`
    - Task 33: `10`
    - Task 28: `15`
    - Task 29: `15`
    - Task 30: `15`
    - Task 31: `5`
    - **sum (`story_points_total`)**: `495`
  - `dispositioned_points`: `0`. No commit message in `<default_branch>..HEAD` contains `record disposition of ` (73 commits checked), so no task was closed without a fix and no unit tokens are listed. `<default_branch>` is `dev` in the config. This checkout has no local `dev` branch, so the range was taken as `origin/dev..HEAD`.
  - The back-compat fallback did not fire, because every entry carries a `_(points: …)_` tag.
- **User-review source**: `user_review_issues`: `0`, `issue_cost_total`: `0`
  - The glob `harness-runs/user_reviews/feat_converging_plan_reviews_review*.md` matches no file. This is the first write, before user review, so no file is counted and no observation is weighted.
  - **total**: `0` observations, so `issue_cost_total` is `0`.
  - How each file's observations are counted: the count is whatever top-level enumeration that file uses, taken from the first of four arms that returns non-zero. The arms are never summed together.
    1. Numbered `##`–`####` headings with required trailing punctuation: `grep -cE '^#{2,4} +[0-9]+[.):]'`.
    2. Top-level numbered or bulleted list items: `grep -cE '^[0-9]+\.|^[-*][[:space:]]'`.
    3. An explicit per-observation marker the file itself uses, with the matching grep recorded beside the count.
    4. `1`, reserved for a file with no enumeration of any kind.
  - Each observation is weighted in story-point units:
    - **Major** `15`: an explicit `[major]` marker, or the observation describes a broken or incorrect user-facing flow, a missing or client-only authorization gate, data loss, corruption or unprotected data, or a whole ported behaviour that is absent. The deciding phrase is quoted beside the observation.
    - **Trivial** `2`: an explicit `[trivial]` marker.
    - **Minor** `5`: the default for every other observation.

## Status

- status: `pre-user-review`. This means the file was written right after the branch (code) review, before any user review, so `issue_cost_total` is `0` and the rate is `100%`. `post-user-review` would mean it was rewritten after user-review fixes, with the issues from the `feat_converging_plan_reviews_review*.md` files counted and weighted.
- last_updated: `2026-11-14`

## Notes

This is a deliberately basic, points-weighted estimate of the agentic-workflow success rate. The headline rate is `(story_points_total - issue_cost_total) / story_points_total`.

- The denominator is the sum of the story-plan tasks' story-point estimates. It measures the scope the agent committed to, weighted by effort rather than by raw task count.
- The subtraction is the severity-weighted cost of user-review observations, meaning defects found after the workflow finished. Each one costs Minor `5` by default. It costs Major `15` on an explicit marker or a documented broken-flow, security, data-integrity or missing-behaviour classification, with the deciding phrase quoted in the breakdown. It costs Trivial `2` only on an explicit marker.

The raw counts (`story_plan_tasks`, `user_review_issues`) and per-issue costs under `## Counts breakdown` are kept so the metric can be refined later without losing the raw data. No unit on this branch was closed through the dispositioned outcome (`dispositioned_points` is `0` and no tokens matched), so no story points are counted as delivered without a fix.
