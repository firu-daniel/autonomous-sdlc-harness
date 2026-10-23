# Branch statistics: fix_run_gates_answered_park_resume

## Summary

- `success_rate`: **`90.6%`** — headline metric.
- `story_points_total`: `106` — denominator (sum of every task's `_(points: <N>)_` story-point estimate in the story index's `## Phase 2 Readiness — Ordered Fix List`).
- `issue_cost_total`: `10` — subtraction (sum of each user-review observation's severity weight, in story-point units).
- `story_plan_tasks`: `6` — retained raw count of `## Phase 2 Readiness — Ordered Fix List` task entries.
- `user_review_issues`: `2` — retained raw count of observations across all `fix_run_gates_answered_park_resume_review*.md` user-review files.

Formula:

```
success_rate = round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1) percent
```

Worked example: `round(clamp((106 - 10) / 106, 0, 1) * 100, 1)` = `round(90.5660…, 1)` = `90.6%`.

Edge cases (the rate is always computed via the formula, then adjusted by these rules):

- **No issues** — when `issue_cost_total` is `0` (no user review yet, or a fully clean review) the rate is `100%`.
- **Clamped at zero** — when `issue_cost_total > story_points_total` (weighted defect load exceeds the planned story points), the raw value goes negative; the rate is **clamped to `0%`** rather than recorded as a negative number. The rate never exceeds `100%`.
- **No points** — when `story_points_total` is `0` the rate is recorded as `n/a` (cannot divide by zero). This is only reachable when the story index has **zero** task entries; a story index that has tasks but no `_(points: …)_` tags falls back to the legacy task-count denominator (see below), so it still produces a number.
- **No points tags (back-compat fallback)** — when the story index has task entries but **none** carry a `_(points: …)_` tag (an older branch predating story points), `story_points_total` falls back to `story_plan_tasks` (the legacy task-count denominator) and `## Notes` records that points were unavailable.

## Counts breakdown

Per-source raw numbers and per-issue costs are retained so the metric can be refined later without re-deriving them.

- **Story-index source** — `story_points_total`: `106`, `story_plan_tasks`: `6`
  - counted from `harness-runs/story_plans/fix_run_gates_answered_park_resume_story_plan.md` (the `N. [x] **Task K** — … _(layer: …)_ _(points: <N>)_` entries under its `## Phase 2 Readiness — Ordered Fix List`, counting `[ ]` and `[x]` alike; all six are `[x]`).
  - per-task points (`_(points: <N>)_` tag on each entry, in ship order), summed:
    - Task 1: `20`
    - Task 6: `8`
    - Task 3: `20`
    - Task 4: `20`
    - Task 2: `20`
    - Task 5: `18`
    - **sum (`story_points_total`)**: `106`
  - `dispositioned_points`: `0` — no commit in `dev..HEAD` (evaluated as `origin/dev..HEAD`, since no local `dev` ref exists in this checkout) carries the `record disposition of ` record, so no task here was closed without a fix and no unpointed token was matched.
  - (Back-compat: every entry carries a `_(points: …)_` tag, so the legacy task-count fallback did not fire.)
- **User-review source** — `user_review_issues`: `2`, `issue_cost_total`: `10` (per user-review file, then summed)
  - glob `harness-runs/user_reviews/fix_run_gates_answered_park_resume_review*.md` matched one file after dropping `_fix_plan` matches (`fix_run_gates_answered_park_resume_fix_plan.md` and the `fix_run_gates_answered_park_resume_fix_plan/` directory were excluded).
  - `fix_run_gates_answered_park_resume_review.md`: `2` observations → cost `10`. Counted by **arm 2, top-level list items** — `grep -cE '^[0-9]+\.|^[-*][[:space:]]' <file>` → `2`, arm 1 (`grep -cE '^#{2,4} +[0-9]+[.):]' <file>`) having returned `0`. The indented `   - ` candidate sub-items under observation 1 are not counted. Each observation's assigned weight beside it:
    1. the instruction prose the branch added is longer than its effect needs (about 2,300 words), against `plugin.md` → `## Writing agent prose`; trim with behaviour unchanged → **Minor** `5`
    2. two definitions in `test-fix-plan-writer.md` (what *new this round* means; the order of the typecheck and test sections in the log) "may have gone" in the word-count trim; check and restore if acted on → **Minor** `5`
  - **total**: `2` observations → `issue_cost_total` `10`
  - Each file's observation count is the count of whatever top-level enumeration that file uses, taken from the first of four arms to return non-zero and never summed across arms: (1) numbered `##`–`####` headings with required trailing punctuation, `grep -cE '^#{2,4} +[0-9]+[.):]'` — here `0`; (2) top-level numbered/bulleted list items, `grep -cE '^[0-9]+\.|^[-*][[:space:]]'` — here `2`, so arm 2 is this file's count; (3) an explicit per-observation marker the file itself uses, with the matching grep recorded beside the count; (4) `1`, reserved for a file with no enumeration of any kind. Every observation the user wrote is counted and weighted, including any a later fix plan verifies as OK — the count measures what the user found, not what survived triage.
  - Each observation is weighted in story-point units: **Major** `15` (explicit `[major]` marker, or the observation describes a broken/incorrect user-facing flow, a missing/client-only authorization gate, data loss/corruption/unprotected data, or an absent whole ported behaviour — the deciding phrase is quoted beside the observation), **Trivial** `2` (explicit `[trivial]` marker), **Minor** `5` (the default for every observation without a Major/Trivial classification).

**Why both took the Minor default.** Neither observation carries an explicit `[major]` or `[trivial]` marker. Observation 1 is prose length and rule-stating style, with behaviour explicitly to stay unchanged. Observation 2 is a conditional possible loss of two definitions ("may have gone", "Check whether either was an edge case"), not a described broken end-to-end flow or an absent whole behaviour.

## Status

- status: `post-user-review` — `pre-user-review` means this file was written right after the branch (code) review with no user review yet (`issue_cost_total` `0` → `100%`); `post-user-review` means it was re-written after user-review fixes, with the issues from the `fix_run_gates_answered_park_resume_review*.md` files counted and weighted.
- last_updated: `2026-10-24`

## Notes

This is a deliberately basic but points-weighted estimate of the agentic-workflow success rate. The headline rate is `(story_points_total - issue_cost_total) / story_points_total`: the denominator is the sum of the story-plan tasks' story-point complexity estimates (the scope the agent committed to, weighted by effort rather than raw task count), and the subtraction is the severity-weighted cost of user-review observations (defects found after the workflow finished, each costing Minor `5` by default, Major `15` on an explicit marker or a documented broken-flow / security / data-integrity / missing-behaviour classification — with the deciding phrase quoted in the breakdown — and Trivial `2` only on an explicit marker). The retained raw counts (`story_plan_tasks`, `user_review_issues`) and per-issue costs under `## Counts breakdown` let the metric be refined later without losing the raw data. A unit closed via the unit loop's dispositioned outcome keeps its points in the denominator, so the rate counts them as delivered; here `dispositioned_points` is `0` and no dispositioned unit was matched. The configured `defaultBranch` is `dev`, which exists in this checkout only as the remote-tracking `origin/dev`; the disposition scan ran over `origin/dev..HEAD`.
