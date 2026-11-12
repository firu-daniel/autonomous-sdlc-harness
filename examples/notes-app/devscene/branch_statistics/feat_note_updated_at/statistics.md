# Branch statistics: feat_note_updated_at

## Summary

- `success_rate`: **`100%`** — headline metric.
- `story_points_total`: `63` — denominator (sum of every task's `_(points: <N>)_` story-point estimate in the story index's `## Phase 2 Readiness — Ordered Fix List`).
- `issue_cost_total`: `0` — subtraction (sum of each user-review observation's severity weight, in story-point units).
- `story_plan_tasks`: `6` — retained raw count of `## Phase 2 Readiness — Ordered Fix List` task entries.
- `user_review_issues`: `0` — retained raw count of observations across all `feat_note_updated_at_review*.md` user-review files.

Formula:

```
success_rate = round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1) percent
```

Worked example: `round(clamp((63 - 0) / 63, 0, 1) * 100, 1)` = `round(100.0, 1)` = `100%`.

Edge cases (the rate is always computed via the formula, then adjusted by these rules):

- **No issues** — when `issue_cost_total` is `0` (no user review yet, or a fully clean review) the rate is `100%`. This is the case here: no user review has taken place on this branch yet.
- **Clamped at zero** — when `issue_cost_total > story_points_total` (weighted defect load exceeds the planned story points), the raw value goes negative; the rate is **clamped to `0%`** rather than recorded as a negative number. The rate never exceeds `100%`.
- **No points** — when `story_points_total` is `0` the rate is recorded as `n/a` (cannot divide by zero). This is only reachable when the story index has **zero** task entries; a story index that has tasks but no `_(points: …)_` tags falls back to the legacy task-count denominator (see below), so it still produces a number.
- **No points tags (back-compat fallback)** — when the story index has task entries but **none** carry a `_(points: …)_` tag (an older branch predating story points), `story_points_total` falls back to `story_plan_tasks` (the legacy task-count denominator) and `## Notes` records that points were unavailable. This fallback did **not** fire here — every entry carries a `_(points: …)_` tag.

## Counts breakdown

Per-source raw numbers and per-issue costs are retained so the metric can be refined later without re-deriving them.

- **Story-index source** — `story_points_total`: `63`, `story_plan_tasks`: `6`
  - counted from `sdlc-harness/story_plans/feat_note_updated_at_story_plan.md` (the `N. [ ] **Task K** — … _(layer: …)_ _(points: <N>)_` entries under its `## Phase 2 Readiness — Ordered Fix List`, counting `[ ]` and `[x]` alike — all six entries here are `[x]`, i.e. completed-but-still-planned, and all six count toward scope).
  - per-task points (`_(points: <N>)_` tag on each entry), summed:
    - Task 1 — Add optional `updatedAt` to `NoteRecord` with `UPDATED_AT_WHEN_ABSENT` and its guard clause _(layer: data)_: `10`
    - Task 2 — Carry `updatedAt` on `Note`, map it both ways, and stamp it in `editNote` alone _(layer: domain)_: `15`
    - Task 3 — Render the row's "Edited …" line, published as `note-edited` with the instant as its value _(layer: presentation)_: `10`
    - Task 4 — Pin the widened guard in `test/notesStore.test.mjs` _(layer: tests)_: `8`
    - Task 5 — Pin the mapper boundary and the stamping rule in `test/notesService.test.mjs` _(layer: tests)_: `15`
    - Task 6 — Style `.note__edited` and hide the never-edited state through its status attribute selector _(layer: general)_: `5`
    - **sum (`story_points_total`)**: `63`
  - `dispositioned_points`: `0` — one commit in `main..HEAD` carries the `record disposition of ` record, but its unit token is not an entry of this story index, so it contributes no points to this denominator:
    - `Finding 2` — `b885294` (`chore: Record disposition of Finding 2 — gate unreachable in this flow`) — **unpointed**: a code-review fix-round unit on this branch, not a `**Task K**` entry of this story index. Counted nowhere; listed here for auditability.
  - No task of this story index was closed without a fix, so `story_points_total` is unaffected by the disposition record above.
  - (Back-compat: if no entry had carried a `_(points: …)_` tag, `story_points_total` would have fallen back to `story_plan_tasks` = `6`. It did not fire.)
- **User-review source** — `user_review_issues`: `0`, `issue_cost_total`: `0` (per user-review file, then summed)
  - glob `sdlc-harness/user_reviews/feat_note_updated_at_review*.md` matched **no files** — the directory `sdlc-harness/user_reviews/` holds only `README.md`, which the glob does not match. This is the pre-user-review write: no user review has been performed on this branch yet, so there is nothing to count and nothing to weight.
  - **total**: `0` observations → `issue_cost_total` `0`
  - Each file's observation count would be the count of whatever top-level enumeration that file uses, taken from the first of four arms to return non-zero and never summed across arms: (1) numbered `##`–`####` headings with required trailing punctuation, `grep -cE '^#{2,4} +[0-9]+[.):]'`; (2) top-level numbered/bulleted list items, `grep -cE '^[0-9]+\.|^[-*][[:space:]]'`; (3) an explicit per-observation marker the file itself uses, with the matching grep recorded beside the count; (4) `1`, reserved for a file with no enumeration of any kind. No arm was evaluated here, because no file matched.
  - Each observation would be weighted in story-point units: **Major** `15` (explicit `[major]` marker, or the observation describes a broken/incorrect user-facing flow, a missing/client-only authorization gate, data loss/corruption/unprotected data, or an absent whole ported behaviour — the deciding phrase quoted beside the observation), **Trivial** `2` (explicit `[trivial]` marker), **Minor** `5` (the default for every observation without a Major/Trivial classification). No weight was assigned in this write.

## Status

- status: `pre-user-review` — `pre-user-review` means this file was written right after the branch (code) review with no user review yet (`issue_cost_total` `0` → `100%`); `post-user-review` means it was re-written after user-review fixes, with the issues from the `feat_note_updated_at_review*.md` files counted and weighted.
- last_updated: `2026-09-07`

## Notes

This is a deliberately basic but points-weighted estimate of the agentic-workflow success rate. The headline rate is `(story_points_total - issue_cost_total) / story_points_total`: the denominator is the sum of the story-plan tasks' story-point complexity estimates (the scope the agent committed to, weighted by effort rather than raw task count), and the subtraction is the severity-weighted cost of user-review observations (defects found after the workflow finished, each costing Minor `5` by default, Major `15` on an explicit marker or a documented broken-flow / security / data-integrity / missing-behaviour classification — with the deciding phrase quoted in the breakdown — and Trivial `2` only on an explicit marker). The retained raw counts (`story_plan_tasks`, `user_review_issues`) and per-issue costs under `## Counts breakdown` let the metric be refined later (e.g., richer per-issue severity triage) without losing the raw data.

The `100%` here is the pre-user-review baseline, not a verdict: it records only that no user review has been performed on this branch yet, and it will be superseded by a `post-user-review` rewrite of this same file once one has.

`0` story points were closed without a fix — no task of this story index was dispositioned. One dispositioned unit was matched on this branch and carries no points in this denominator: `Finding 2` (`b885294`), a code-review fix-round unit rather than a `**Task K**` entry of the story index; it is listed in the breakdown and summed nowhere, so it neither raises nor lowers the rate.
