# Branch statistics: chore_gate_10_real_catalog_measurement

## Summary

- `success_rate`: **`100%`** — headline metric.
- `story_points_total`: `70` — denominator (sum of every task's `_(points: <N>)_` story-point estimate in the story index's `## Phase 2 Readiness — Ordered Fix List`).
- `issue_cost_total`: `0` — subtraction (sum of each user-review observation's severity weight, in story-point units).
- `story_plan_tasks`: `4` — retained raw count of `## Phase 2 Readiness — Ordered Fix List` task entries.
- `user_review_issues`: `0` — retained raw count of observations across all `chore_gate_10_real_catalog_measurement_review*.md` user-review files.

Formula:

```
success_rate = round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1) percent
```

Worked example: `issue_cost_total` is `0`, so the no-issues edge case applies directly — `round(clamp((70 - 0) / 70, 0, 1) * 100, 1)` = `100%`.

Edge cases (the rate is always computed via the formula, then adjusted by these rules):

- **No issues** — when `issue_cost_total` is `0` (no user review yet, or a fully clean review) the rate is `100%`.
- **Clamped at zero** — when `issue_cost_total > story_points_total` (weighted defect load exceeds the planned story points), the raw value goes negative; the rate is **clamped to `0%`** rather than recorded as a negative number. The rate never exceeds `100%`.
- **No points** — when `story_points_total` is `0` the rate is recorded as `n/a` (cannot divide by zero). This is only reachable when the story index has **zero** task entries; a story index that has tasks but no `_(points: …)_` tags falls back to the legacy task-count denominator (see below), so it still produces a number.
- **No points tags (back-compat fallback)** — when the story index has task entries but **none** carry a `_(points: …)_` tag (an older branch predating story points), `story_points_total` falls back to `story_plan_tasks` (the legacy task-count denominator) and `## Notes` records that points were unavailable.

## Counts breakdown

Per-source raw numbers and per-issue costs are retained so the metric can be refined later without re-deriving them.

- **Story-index source** — `story_points_total`: `70`, `story_plan_tasks`: `4`
  - counted from `harness-runs/story_plans/chore_gate_10_real_catalog_measurement_story_plan.md` (the `N. [ ] **Task K** — … _(layer: …)_ _(points: <N>)_` entries under its `## Phase 2 Readiness — Ordered Fix List`, counting `[ ]` and `[x]` alike — all four entries here are `[x]`).
  - per-task points (`_(points: <N>)_` tag on each entry), summed:
    - Task 1 — Record the real-catalog cold build and index size in `docs/retrieval-eval-results.md`, the file of record: `20`
    - Task 2 — Rewrite `docs/retrieval.md`: strike the rule, make the decision standing, restate the cost as the refresh, record gate 10 as run: `20`
    - Task 3 — Update `docs/development.md`: gate 10's own text records the run and its two command defects, and roadmap item 17 is cancelled: `20`
    - Task 4 — Correct `docs/retrieval-eval.md`'s two timeout-dependent claims and sweep the tree for surviving sites: `10`
    - **sum (`story_points_total`)**: `70`
  - `dispositioned_points`: `0` — no commit in `main..HEAD` carries the `record disposition of ` record (`git log --format='%h %s%n%b' main..HEAD` matched no such line), so no unit on this branch was closed without a fix and no unpointed token was matched.
  - Every entry carries a `_(points: …)_` tag, so the back-compat task-count fallback did not fire.
- **User-review source** — `user_review_issues`: `0`, `issue_cost_total`: `0` (per user-review file, then summed)
  - The glob `harness-runs/user_reviews/chore_gate_10_real_catalog_measurement_review*.md` matched **no files** — this is the first (pre-user-review) write, so there are no observations to enumerate or weight. Nothing in `harness-runs/user_reviews/` belongs to this branch; the `*_fix_plan*` entries present there belong to other branches and are excluded by the `_review*.md` pattern regardless.
  - **total**: `0` observations → `issue_cost_total` `0`
  - Each file's observation count is the count of whatever top-level enumeration that file uses, taken from the first of four arms to return non-zero and never summed across arms: (1) numbered `##`–`####` headings with required trailing punctuation, `grep -cE '^#{2,4} +[0-9]+[.):]'`; (2) top-level numbered/bulleted list items, `grep -cE '^[0-9]+\.|^[-*][[:space:]]'`; (3) an explicit per-observation marker the file itself uses, with the matching grep recorded beside the count; (4) `1`, reserved for a file with no enumeration of any kind. No arm ran here, there being no matched file.
  - Each observation is weighted in story-point units: **Major** `15` (explicit `[major]` marker, or the observation describes a broken/incorrect user-facing flow, a missing/client-only authorization gate, data loss/corruption/unprotected data, or an absent whole ported behaviour — the deciding phrase is quoted beside the observation), **Trivial** `2` (explicit `[trivial]` marker), **Minor** `5` (the default for every observation without a Major/Trivial classification).

## Status

- status: `pre-user-review` — `pre-user-review` means this file was written right after the branch (code) review with no user review yet (`issue_cost_total` `0` → `100%`); `post-user-review` means it was re-written after user-review fixes, with the issues from the `chore_gate_10_real_catalog_measurement_review*.md` files counted and weighted.
- last_updated: `2026-09-22`

## Notes

This is a deliberately basic but points-weighted estimate of the agentic-workflow success rate. The headline rate is `(story_points_total - issue_cost_total) / story_points_total`: the denominator is the sum of the story-plan tasks' story-point complexity estimates (the scope the agent committed to, weighted by effort rather than raw task count), and the subtraction is the severity-weighted cost of user-review observations (defects found after the workflow finished, each costing Minor `5` by default, Major `15` on an explicit marker or a documented broken-flow / security / data-integrity / missing-behaviour classification — with the deciding phrase quoted in the breakdown — and Trivial `2` only on an explicit marker). The retained raw counts (`story_plan_tasks`, `user_review_issues`) and per-issue costs under `## Counts breakdown` let the metric be refined later (e.g., richer per-issue severity triage) without losing the raw data. The `100%` here reflects only that no user review has been recorded for this branch yet; it will be recomputed and this file overwritten once the user review and its fixes land.
