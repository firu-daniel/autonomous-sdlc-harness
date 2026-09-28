# Branch statistics: feat_run_gates_phase

## Summary

- `success_rate`: **`96.8%`** — headline metric.
- `story_points_total`: `309` — denominator (sum of every task's `_(points: <N>)_` story-point estimate in the story index's `## Phase 2 Readiness — Ordered Fix List`).
- `issue_cost_total`: `10` — subtraction (sum of each user-review observation's severity weight, in story-point units).
- `story_plan_tasks`: `23` — retained raw count of `## Phase 2 Readiness — Ordered Fix List` task entries.
- `user_review_issues`: `2` — retained raw count of observations across all `feat_run_gates_phase_review*.md` user-review files.

Formula:

```
success_rate = round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1) percent
```

Worked example: `round(clamp((309 - 10) / 309, 0, 1) * 100, 1)` = `round(96.7637…, 1)` = `96.8%`.

Edge cases (the rate is always computed via the formula, then adjusted by these rules):

- **No issues** — when `issue_cost_total` is `0` (no user review yet, or a fully clean review) the rate is `100%`.
- **Clamped at zero** — when `issue_cost_total > story_points_total` (weighted defect load exceeds the planned story points), the raw value goes negative; the rate is **clamped to `0%`** rather than recorded as a negative number. The rate never exceeds `100%`.
- **No points** — when `story_points_total` is `0` the rate is recorded as `n/a` (cannot divide by zero). This is only reachable when the story index has **zero** task entries; a story index that has tasks but no `_(points: …)_` tags falls back to the legacy task-count denominator (see below), so it still produces a number.
- **No points tags (back-compat fallback)** — when the story index has task entries but **none** carry a `_(points: …)_` tag (an older branch predating story points), `story_points_total` falls back to `story_plan_tasks` (the legacy task-count denominator) and `## Notes` records that points were unavailable.

## Counts breakdown

Per-source raw numbers and per-issue costs are retained so the metric can be refined later without re-deriving them.

- **Story-index source** — `story_points_total`: `309`, `story_plan_tasks`: `23`
  - counted from `harness-runs/story_plans/feat_run_gates_phase_story_plan.md` (the `N. [x] **Task K** — … _(layer: …)_ _(points: <N>)_` entries under its `## Phase 2 Readiness — Ordered Fix List`, counting `[ ]` and `[x]` alike; all 23 are `[x]`).
  - per-task points (`_(points: <N>)_` tag on each entry), summed:
    - Task 1: `20`
    - Task 2: `18`
    - Task 3: `20`
    - Task 4: `15`
    - Task 5: `15`
    - Task 6: `15`
    - Task 7: `20`
    - Task 8: `12`
    - Task 9: `20`
    - Task 10: `5`
    - Task 11: `10`
    - Task 12: `10`
    - Task 13: `15`
    - Task 14: `10`
    - Task 15: `10`
    - Task 16: `12`
    - Task 17: `10`
    - Task 18: `15`
    - Task 19: `12`
    - Task 20: `15`
    - Task 21: `5`
    - Task 22: `15`
    - Task 23: `10`
    - **sum (`story_points_total`)**: `309`
  - `dispositioned_points`: `0` — no commit in `dev..HEAD` (`git log --format='%h %s%n%b' dev..HEAD`) carries the `record disposition of ` record, so no task here was closed without a fix, and no unpointed token was matched.
  - (Back-compat: not triggered — every entry carries a `_(points: …)_` tag. Had none, `story_points_total` would fall back to `story_plan_tasks` = `23`.)
- **User-review source** — `user_review_issues`: `2`, `issue_cost_total`: `10` (per user-review file, then summed)
  - glob `harness-runs/user_reviews/feat_run_gates_phase_review*.md` matched one file; `feat_run_gates_phase_fix_plan.md` and the `feat_run_gates_phase_fix_plan/` directory are excluded by the pattern.
  - `harness-runs/user_reviews/feat_run_gates_phase_review.md`: `2` observations → cost `10`. Counted by **arm 1, numbered headings** — `grep -cE '^#{2,4} +[0-9]+[.):]' <file>` → `2`; arm 2 (`grep -cE '^[0-9]+\.|^[-*][[:space:]]'` → `5`, the un-indented sub-bullets inside observation 1) is not evaluated into the count, since arm 1 returned non-zero. Each observation's assigned weight beside it:
    1. one regression that fails many tests runs a full fix unit for every failing test, even after the first fix has cleared them → **Minor** `5`
    2. let the test fix plan writer flag a suspected shared cause, as advice only → **Minor** `5`
  - **total**: `2` observations → `issue_cost_total` `10`
  - Each file's observation count is the count of whatever top-level enumeration that file uses, taken from the first of four arms to return non-zero and never summed across arms: (1) numbered `##`–`####` headings with required trailing punctuation, `grep -cE '^#{2,4} +[0-9]+[.):]'`; (2) top-level numbered/bulleted list items, `grep -cE '^[0-9]+\.|^[-*][[:space:]]'`; (3) an explicit per-observation marker the file itself uses, with the matching grep recorded beside the count; (4) `1`, reserved for a file with no enumeration of any kind. The arm and its grep are recorded beside each file's count above.
  - Each observation is weighted in story-point units: **Major** `15` (explicit `[major]` marker, or the observation describes a broken/incorrect user-facing flow, a missing/client-only authorization gate, data loss/corruption/unprotected data, or an absent whole ported behaviour — the deciding phrase is quoted beside the observation), **Trivial** `2` (explicit `[trivial]` marker), **Minor** `5` (the default for every observation without a Major/Trivial classification).

**Why both took the Minor default.** Neither observation carries an explicit `[major]` or `[trivial]` marker. Observation 1 describes redundant work — *"The best outcome is nine wasted units"* — with a blocker or an invented edit named only as possible worse outcomes, not a flow reported as broken end-to-end; no authorization gate, data loss or absent ported behaviour is described. Observation 2 is a cheap advisory addition. Both therefore take the Minor default.

## Status

- status: `post-user-review` — `pre-user-review` means this file was written right after the branch (code) review with no user review yet (`issue_cost_total` `0` → `100%`); `post-user-review` means it was re-written after user-review fixes, with the issues from the `feat_run_gates_phase_review*.md` files counted and weighted.
- last_updated: `2026-09-28`

## Notes

This is a deliberately basic but points-weighted estimate of the agentic-workflow success rate. The headline rate is `(story_points_total - issue_cost_total) / story_points_total`: the denominator is the sum of the story-plan tasks' story-point complexity estimates (the scope the agent committed to, weighted by effort rather than raw task count), and the subtraction is the severity-weighted cost of user-review observations (defects found after the workflow finished, each costing Minor `5` by default, Major `15` on an explicit marker or a documented broken-flow / security / data-integrity / missing-behaviour classification — with the deciding phrase quoted in the breakdown — and Trivial `2` only on an explicit marker). The retained raw counts (`story_plan_tasks`, `user_review_issues`) and per-issue costs under `## Counts breakdown` let the metric be refined later (e.g., richer per-issue severity triage) without losing the raw data. A unit closed via the unit loop's dispositioned outcome keeps its points in the denominator; on this branch no unit was dispositioned.
