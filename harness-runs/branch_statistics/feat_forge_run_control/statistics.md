# Branch statistics: feat_forge_run_control

## Summary

- `success_rate`: **`94.2%`** — headline metric.
- `story_points_total`: `428` — denominator (sum of every task's `_(points: <N>)_` story-point estimate in the story index's `## Phase 2 Readiness — Ordered Fix List`).
- `issue_cost_total`: `25` — subtraction (sum of each user-review observation's severity weight, in story-point units).
- `story_plan_tasks`: `31` — retained raw count of `## Phase 2 Readiness — Ordered Fix List` task entries.
- `user_review_issues`: `3` — retained raw count of observations across all `feat_forge_run_control_review*.md` user-review files.

Formula:

```
success_rate = round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1) percent
```

Worked example: `round(clamp((428 - 25) / 428, 0, 1) * 100, 1)` = `round(94.1588…, 1)` = `94.2%`.

Edge cases (the rate is always computed via the formula, then adjusted by these rules):

- **No issues** — when `issue_cost_total` is `0` (no user review yet, or a fully clean review) the rate is `100%`.
- **Clamped at zero** — when `issue_cost_total > story_points_total` (weighted defect load exceeds the planned story points), the raw value goes negative; the rate is **clamped to `0%`** rather than recorded as a negative number. The rate never exceeds `100%`.
- **No points** — when `story_points_total` is `0` the rate is recorded as `n/a` (cannot divide by zero). This is only reachable when the story index has **zero** task entries; a story index that has tasks but no `_(points: …)_` tags falls back to the legacy task-count denominator (see below), so it still produces a number.
- **No points tags (back-compat fallback)** — when the story index has task entries but **none** carry a `_(points: …)_` tag, `story_points_total` falls back to `story_plan_tasks` (the legacy task-count denominator) and `## Notes` records that points were unavailable.

## Counts breakdown

Per-source raw numbers and per-issue costs are retained so the metric can be refined later without re-deriving them.

- **Story-index source** — `story_points_total`: `428`, `story_plan_tasks`: `31`
  - counted from `harness-runs/story_plans/feat_forge_run_control_story_plan.md` (the `N. [x] **Task K** — … _(layer: …)_ _(points: <N>)_` entries under its `## Phase 2 Readiness — Ordered Fix List`, counting `[ ]` and `[x]` alike — all 31 are `[x]`).
  - per-task points (`_(points: <N>)_` tag on each entry), summed:
    - Task 1: `10`
    - Task 2: `15`
    - Task 3: `20`
    - Task 4: `10`
    - Task 5: `10`
    - Task 6: `20`
    - Task 7: `8`
    - Task 8: `12`
    - Task 9: `12`
    - Task 10: `20`
    - Task 11: `10`
    - Task 12: `15`
    - Task 13: `20`
    - Task 14: `10`
    - Task 15: `15`
    - Task 16: `15`
    - Task 17: `12`
    - Task 18: `15`
    - Task 19: `5`
    - Task 20: `8`
    - Task 21: `12`
    - Task 22: `10`
    - Task 23: `20`
    - Task 24: `20`
    - Task 25: `20`
    - Task 26: `15`
    - Task 27: `15`
    - Task 28: `12`
    - Task 29: `12`
    - Task 30: `15`
    - Task 31: `15`
    - **sum (`story_points_total`)**: `428`
  - `dispositioned_points`: `0` — no commit in `dev..HEAD` (`git log --format='%h %s%n%b' dev..HEAD`) carries the `record disposition of ` record, so no unit was closed without a fix and no unpointed token was matched.
  - Every entry carries a `_(points: …)_` tag; the back-compat task-count fallback did not fire.
- **User-review source** — `user_review_issues`: `3`, `issue_cost_total`: `25` (per user-review file, then summed)
  - Glob `harness-runs/user_reviews/feat_forge_run_control_review*.md` matched one file; `feat_forge_run_control_fix_plan.md` and the `feat_forge_run_control_fix_plan/` directory are excluded by the pattern.
  - `harness-runs/user_reviews/feat_forge_run_control_review.md`: `3` observations → cost `25`. Counted by **arm 2, top-level list items** — `grep -cE '^[0-9]+\.|^[-*][[:space:]]' <file>` → `3`, arm 1 (`grep -cE '^#{2,4} +[0-9]+[.):]' <file>`) having returned `0`. The trailing "Not in scope" and "Open question" paragraphs are un-enumerated prose and are not observations. Each observation's assigned weight beside it:
    1. a review requesting changes is refused while a run is in flight; accept it and reply that it is collected for the next round → **Minor** `5` (the refusal is the shipped, documented behaviour; the observation asks for a changed flow, not a broken one)
    2. round collection takes only the starting reviewer's body and inline comments → **Major** `15` — data loss / flow incorrect end-to-end: *"A refused review's body is lost, and inline comments by other reviewers are left out unless each of them resubmits."*
    3. start the next round automatically from reviews that arrived during a run, without cancelling a pending round → **Minor** `5` (a new behaviour requested; no broken flow, authorization gap or data loss described)
  - **total**: `3` observations → `issue_cost_total` `25`
  - Each file's observation count is the count of whatever top-level enumeration that file uses, taken from the first of four arms to return non-zero and never summed across arms: (1) numbered `##`–`####` headings with required trailing punctuation, `grep -cE '^#{2,4} +[0-9]+[.):]'` — here `0`; (2) top-level numbered/bulleted list items, `grep -cE '^[0-9]+\.|^[-*][[:space:]]'` — here `3`, so arm 2 is this file's count; (3) an explicit per-observation marker the file itself uses; (4) `1`, reserved for a file with no enumeration of any kind.
  - Each observation is weighted in story-point units: **Major** `15` (explicit `[major]` marker, or the observation describes a broken/incorrect user-facing flow, a missing/client-only authorization gate, data loss/corruption/unprotected data, or an absent whole ported behaviour — the deciding phrase is quoted beside the observation), **Trivial** `2` (explicit `[trivial]` marker), **Minor** `5` (the default for every observation without a Major/Trivial classification).

## Status

- status: `post-user-review`
- last_updated: `2026-10-01`

## Notes

This is a deliberately basic but points-weighted estimate of the agentic-workflow success rate. The headline rate is `(story_points_total - issue_cost_total) / story_points_total`: the denominator is the sum of the story-plan tasks' story-point complexity estimates (the scope the agent committed to, weighted by effort rather than raw task count), and the subtraction is the severity-weighted cost of user-review observations (defects found after the workflow finished, each costing Minor `5` by default, Major `15` on an explicit marker or a documented broken-flow / security / data-integrity / missing-behaviour classification — with the deciding phrase quoted in the breakdown — and Trivial `2` only on an explicit marker). The retained raw counts (`story_plan_tasks`, `user_review_issues`) and per-issue costs under `## Counts breakdown` let the metric be refined later (e.g., richer per-issue severity triage) without losing the raw data. No unit on this branch was closed via the dispositioned outcome (`dispositioned_points` `0`).
