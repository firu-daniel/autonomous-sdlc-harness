# Branch statistics: feat_arm_a_real_catalog_measurement

## Summary

- `success_rate`: **`100%`**, the headline metric. Corrected by hand by the maintainer from the computed `93.7%` — see `## Maintainer correction`.
- `story_points_total`: `395`, the denominator: the sum of every task's `_(points: <N>)_` story-point estimate in the story index's `## Phase 2 Readiness — Ordered Fix List`.
- `issue_cost_total`: `0` (computed `25`, corrected by hand), the subtraction: the sum of each user-review observation's severity weight, in story-point units.
- `story_plan_tasks`: `25`, the retained raw count of `## Phase 2 Readiness — Ordered Fix List` task entries.
- `user_review_issues`: `5`, the retained raw count of observations across all `feat_arm_a_real_catalog_measurement_review*.md` user-review files.

Formula:

```
success_rate = round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1) percent
```

Worked example: `round(clamp((395 - 0) / 395, 0, 1) * 100, 1)` = `100%`. As computed before the correction: `round(clamp((395 - 25) / 395, 0, 1) * 100, 1)` = `round(93.6708…, 1)` = `93.7%`.

Edge cases (the rate is always computed with the formula, then adjusted by these rules):

- **No issues**: when `issue_cost_total` is `0` (no user review yet, or a fully clean review), the rate is `100%`.
- **Clamped at zero**: when `issue_cost_total > story_points_total` (the weighted defect load is larger than the planned story points), the raw value goes negative. The rate is **clamped to `0%`** and is never recorded as a negative number. The rate never exceeds `100%`.
- **No points**: when `story_points_total` is `0`, the rate is recorded as `n/a` because it cannot divide by zero. This only happens when the story index has **zero** task entries. A story index that has tasks but no `_(points: …)_` tags falls back to the legacy task-count denominator (see below), so it still produces a number.
- **No points tags (back-compat fallback)**: when the story index has task entries but **none** carry a `_(points: …)_` tag, `story_points_total` falls back to `story_plan_tasks` (the legacy task-count denominator), and `## Notes` records that points were unavailable.

## Counts breakdown

Per-source raw numbers and per-issue costs are kept so the metric can be refined later without re-deriving them.

- **Story-index source**: `story_points_total` is `395`, `story_plan_tasks` is `25`
  - Counted from `harness-runs/story_plans/feat_arm_a_real_catalog_measurement_story_plan.md`. These are the `N. [x] **Task K** — … _(layer: …)_ _(points: <N>)_` entries under its `## Phase 2 Readiness — Ordered Fix List`, with `[ ]` and `[x]` counted alike. All 25 are `[x]`.
  - Per-task points (the `_(points: <N>)_` tag on each entry), summed:
    - Task 1: `15`
    - Task 2: `15`
    - Task 3: `10`
    - Task 4: `15`
    - Task 5: `10`
    - Task 6: `18`
    - Task 7: `15`
    - Task 8: `15`
    - Task 9: `20`
    - Task 10: `15`
    - Task 11: `20`
    - Task 12: `20`
    - Task 13: `15`
    - Task 14: `20`
    - Task 15: `10`
    - Task 16: `15`
    - Task 17: `15`
    - Task 18: `20`
    - Task 19: `20`
    - Task 20: `20`
    - Task 21: `10`
    - Task 22: `12`
    - Task 23: `20`
    - Task 24: `15`
    - Task 25: `15`
    - **sum (`story_points_total`)**: `395`
  - `dispositioned_points`: `0`. No commit in `dev..HEAD` (`git log --format='%h %s%n%b' dev..HEAD`, `dev` being `harness.config.json` → `defaultBranch`) carries the `record disposition of ` record, so no unit on this branch was closed without a fix. No tokens matched.
  - Back-compat fallback: not fired. All 25 entries carry a `_(points: …)_` tag.
- **User-review source**: `user_review_issues` is `5`, `issue_cost_total` is `0` after the maintainer correction, `25` as computed (counted per user-review file, then summed)
  - Glob `harness-runs/user_reviews/feat_arm_a_real_catalog_measurement_review*.md` matched one file; no `_fix_plan` file or directory was matched.
  - `harness-runs/user_reviews/feat_arm_a_real_catalog_measurement_review.md`: `5` observations, cost `25`. Counted by **arm 2, top-level list items**: `grep -cE '^[0-9]+\.|^[-*][[:space:]]' <file>` returns `5`, arm 1 (`grep -cE '^#{2,4} +[0-9]+[.):]' <file>`) having returned `0`. The indented `-` sub-items under items 2 and 5 are not counted. Each observation's assigned weight:
    1. Record the decision as a maintainer override of the rule's outcome, not a re-reading of the rule (add a subsection after `### The verdict`) → **Minor** `5`
    2. State the four reasons for keeping retrieval opt-in wherever the decision is recorded → **Minor** `5`
    3. State the recommendation honestly: scope it to the unmeasured situations and disclose that `lexical` scored above `fused-rerank` on recall@5 → **Minor** `5`
    4. Replace roadmap item "Withdrawing docs retrieval" in `docs/development.md` with the record of the unexecuted withdrawal → **Minor** `5`
    5. Correct every statement that says or implies retrieval is withdrawn or to be removed (nine listed sites and any others) → **Minor** `5`
  - **total**: `5` observations, so `issue_cost_total` was computed as `25`; each is re-weighted to `0` by the maintainer correction below, so it stands at `0`.
  - Why all five took the Minor default: none carries a `[major]` or `[trivial]` marker, and none, read from the review text alone, describes a broken user-facing flow, a missing authorization gate, data loss or unprotected data, or an absent ported behaviour. They record a maintainer decision and correct documentation statements that follow from it.
  - Each file's observation count comes from the first of four arms that returns a non-zero count. Arms are never summed:
    1. Numbered `##`–`####` headings that require trailing punctuation: `grep -cE '^#{2,4} +[0-9]+[.):]'`.
    2. Top-level numbered or bulleted list items: `grep -cE '^[0-9]+\.|^[-*][[:space:]]'`.
    3. An explicit per-observation marker that the file itself uses, with the matching grep recorded beside the count.
    4. `1`, reserved for a file with no enumeration of any kind.
  - Each observation is weighted in story-point units:
    - **Major** `15`: an explicit `[major]` marker, or the observation describes a broken or incorrect user-facing flow, a missing or client-only authorization gate, data loss, corruption or unprotected data, or a whole ported behaviour that is absent. The deciding phrase is quoted beside the observation.
    - **Trivial** `2`: an explicit `[trivial]` marker.
    - **Minor** `5`: the default for every other observation.

## Maintainer correction

Recorded by hand on 2026-09-24. The one user-review file on this branch records a **maintainer decision**, not defects: after the measurement's verdict (withdrawn), the maintainer kept docs retrieval opt-in and asked for that decision, its reasons and the statements following from it to be written into the tree. Its five observations describe no error the agents made — the branch implemented the task prompt, which asked for the verdict and the change it named, as written. Counting them as Minor defects would charge the workflow for a change of direction taken after it finished. Each is therefore re-weighted to `0`: `issue_cost_total` is `0` and `success_rate` is `100%`. The raw count, the per-observation list and the computed `25` / `93.7%` above are kept, so the correction can be audited or reverted. The statistics format has no marker for a decision-only review; this correction is the stand-in until it has one.

## Status

- status: `post-user-review`. The file was re-written after the user-review fixes, with the observations in the `feat_arm_a_real_catalog_measurement_review*.md` files counted and weighted.
- last_updated: `2026-09-24`

## Notes

This is a deliberately basic, points-weighted estimate of how often the agentic workflow succeeds. The headline rate is `(story_points_total - issue_cost_total) / story_points_total`:

- The denominator is the sum of the story-plan tasks' story-point estimates. That is the scope the agent committed to, weighted by effort instead of raw task count.
- The subtraction is the severity-weighted cost of user-review observations, meaning defects found after the workflow finished. Each costs Minor `5` by default, Major `15` on an explicit marker or a documented classification (broken flow, security, data integrity or missing behaviour), and Trivial `2` only on an explicit marker.

The raw counts (`story_plan_tasks`, `user_review_issues`) and the per-issue costs under `## Counts breakdown` are kept so the metric can be refined later without losing the raw data. No unit on this branch was closed through the dispositioned outcome, so `dispositioned_points` is `0` and every scoped point was delivered with a fix.
