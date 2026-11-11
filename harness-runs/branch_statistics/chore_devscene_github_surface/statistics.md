# Branch statistics: chore_devscene_github_surface

## Summary

- `success_rate`: **`98.6%`** — headline metric.
- `story_points_total`: `370` — denominator (sum of every task's `_(points: <N>)_` story-point estimate in the story index's `## Phase 2 Readiness — Ordered Fix List`).
- `issue_cost_total`: `5` — subtraction (sum of each user-review observation's severity weight, in story-point units).
- `story_plan_tasks`: `24` — retained raw count of `## Phase 2 Readiness — Ordered Fix List` task entries.
- `user_review_issues`: `1` — retained raw count of observations across all `chore_devscene_github_surface_review*.md` user-review files.

Formula:

```
success_rate = round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1) percent
```

Worked example: `round(clamp((370 - 5) / 370, 0, 1) * 100, 1)` = `round(98.6486…, 1)` = `98.6%`.

Edge cases (the rate is always computed via the formula, then adjusted by these rules):

- **No issues** — when `issue_cost_total` is `0` (no user review yet, or a fully clean review) the rate is `100%`.
- **Clamped at zero** — when `issue_cost_total > story_points_total` (weighted defect load exceeds the planned story points), the raw value goes negative; the rate is **clamped to `0%`** rather than recorded as a negative number. The rate never exceeds `100%`.
- **No points** — when `story_points_total` is `0` the rate is recorded as `n/a` (cannot divide by zero). This is only reachable when the story index has **zero** task entries; a story index that has tasks but no `_(points: …)_` tags falls back to the legacy task-count denominator (see below), so it still produces a number.
- **No points tags (back-compat fallback)** — when the story index has task entries but **none** carry a `_(points: …)_` tag (an older branch predating story points), `story_points_total` falls back to `story_plan_tasks` (the legacy task-count denominator) and `## Notes` records that points were unavailable.

## Counts breakdown

Per-source raw numbers and per-issue costs are retained so the metric can be refined later without re-deriving them.

- **Story-index source** — `story_points_total`: `370`, `story_plan_tasks`: `24`
  - counted from `harness-runs/story_plans/chore_devscene_github_surface_story_plan.md` (the `N. [x] **Task K** — … _(layer: …)_ _(points: <N>)_` entries under its `## Phase 2 Readiness — Ordered Fix List`, counting `[ ]` and `[x]` alike; all 24 are `[x]`). Task count via the section-scoped `awk … | grep -cE '^[0-9]+\.\s*\[[ x]\]\s*\*\*Task'` → `24`; points via the section-scoped `awk … | grep -oE '_\(points: *[0-9]+\)_' | grep -oE '[0-9]+' | awk '{s+=$1} END{print s+0}'` → `370`.
  - per-task points (`_(points: <N>)_` tag on each entry), summed:
    - Task 1: `10`
    - Task 2: `20`
    - Task 3: `20`
    - Task 4: `10`
    - Task 5: `15`
    - Task 6: `15`
    - Task 7: `15`
    - Task 8: `20`
    - Task 9: `10`
    - Task 10: `20`
    - Task 11: `20`
    - Task 12: `20`
    - Task 13: `15`
    - Task 14: `15`
    - Task 15: `10`
    - Task 16: `10`
    - Task 17: `15`
    - Task 18: `15`
    - Task 19: `10`
    - Task 20: `5`
    - Task 21: `20`
    - Task 22: `20`
    - Task 23: `20`
    - Task 24: `20`
    - **sum (`story_points_total`)**: `370`
  - `dispositioned_points`: `0` — no commit in `dev..HEAD` (run as `origin/dev..HEAD`, the only `dev` ref in this checkout; a local `dev` does not exist) carries the `record disposition of ` record, so no task here was closed without a fix, and no unpointed token was matched.
  - Back-compat fallback did not fire: every entry carries a `_(points: …)_` tag.
- **User-review source** — `user_review_issues`: `1`, `issue_cost_total`: `5` (per user-review file, then summed)
  - The glob `harness-runs/user_reviews/chore_devscene_github_surface_review*.md` matches one file once `_fix_plan` matches are dropped.
  - `harness-runs/user_reviews/chore_devscene_github_surface_review.md`: `1` observation → cost `5`. Counted by **arm 2, top-level list items** — `grep -cE '^[0-9]+\.|^[-*][[:space:]]' <file>` → `1`, arm 1 (`grep -cE '^#{2,4} +[0-9]+[.):]' <file>`) having returned `0`. Its sub-points `1a`, `1b` and `1c` are inline within the one top-level item, not separate top-level lines, so they are not counted separately. The observation's assigned weight:
    1. remove all pre-rename backwards-compatibility support (the legacy `harness` trigger-label fallback, `init`'s 0.6.1 control-workflow repair, and the docs describing either) → **Minor** `5`
  - **total**: `1` observation → `issue_cost_total` `5`
  - Each file's observation count is the count of whatever top-level enumeration that file uses, taken from the first of four arms to return non-zero and never summed across arms: (1) numbered `##`–`####` headings with required trailing punctuation, `grep -cE '^#{2,4} +[0-9]+[.):]'` — here `0`; (2) top-level numbered/bulleted list items, `grep -cE '^[0-9]+\.|^[-*][[:space:]]'` — here `1`, so arm 2 is this file's count; (3) an explicit per-observation marker the file itself uses, with the matching grep recorded beside the count; (4) `1`, reserved for a file with no enumeration of any kind. The arm and its grep are recorded beside the file's count above. Every observation the user wrote is counted and weighted, including any a later fix plan verifies as OK — the count measures what the user found, not what survived triage.
  - Each observation is weighted in story-point units: **Major** `15` (explicit `[major]` marker, or the observation describes a broken/incorrect user-facing flow, a missing/client-only authorization gate, data loss/corruption/unprotected data, or an absent whole ported behaviour — the deciding phrase is quoted beside the observation), **Trivial** `2` (explicit `[trivial]` marker), **Minor** `5` (the default for every observation without a Major/Trivial classification).

**Why the one observation took the Minor default.** It carries no explicit `[major]` or `[trivial]` marker, and read from the review text alone it describes none of the Major conditions. It asks for compatibility code and documentation to be removed. It does not report a user-facing flow that fails, a missing authorization gate, data loss or unprotected data, or a ported behaviour that is absent.

## Status

- status: `post-user-review` — `pre-user-review` means this file was written right after the branch (code) review with no user review yet (`issue_cost_total` `0` → `100%`); `post-user-review` means it was re-written after user-review fixes, with the issues from the `chore_devscene_github_surface_review*.md` files counted and weighted.
- last_updated: `2026-11-11`

## Notes

This is a deliberately basic but points-weighted estimate of the agentic-workflow success rate. The headline rate is `(story_points_total - issue_cost_total) / story_points_total`: the denominator is the sum of the story-plan tasks' story-point complexity estimates (the scope the agent committed to, weighted by effort rather than raw task count), and the subtraction is the severity-weighted cost of user-review observations (defects found after the workflow finished, each costing Minor `5` by default, Major `15` on an explicit marker or a documented broken-flow / security / data-integrity / missing-behaviour classification — with the deciding phrase quoted in the breakdown — and Trivial `2` only on an explicit marker). The retained raw counts (`story_plan_tasks`, `user_review_issues`) and per-issue costs under `## Counts breakdown` let the metric be refined later (e.g., richer per-issue severity triage) without losing the raw data. A unit closed via the unit loop's dispositioned outcome keeps its points in the denominator, so the rate counts them as delivered; here `dispositioned_points` is `0` and no dispositioned unit was matched.
