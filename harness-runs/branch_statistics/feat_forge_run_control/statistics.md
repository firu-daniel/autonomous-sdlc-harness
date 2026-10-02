# Branch statistics: feat_forge_run_control

## Summary

- `success_rate`: **`83.6%`** — headline metric.
- `story_points_total`: `428` — denominator (sum of every task's `_(points: <N>)_` story-point estimate in the story index's `## Phase 2 Readiness — Ordered Fix List`).
- `issue_cost_total`: `70` — subtraction (sum of each user-review observation's severity weight, in story-point units).
- `story_plan_tasks`: `31` — retained raw count of `## Phase 2 Readiness — Ordered Fix List` task entries.
- `user_review_issues`: `10` — retained raw count of observations across all `feat_forge_run_control_review*.md` user-review files.

Formula:

```
success_rate = round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1) percent
```

Worked example: `round(clamp((428 - 70) / 428, 0, 1) * 100, 1)` = `round(83.6448…, 1)` = `83.6%`.

Edge cases (the rate is always computed via the formula, then adjusted by these rules):

- **No issues** — when `issue_cost_total` is `0` (no user review yet, or a fully clean review) the rate is `100%`.
- **Clamped at zero** — when `issue_cost_total > story_points_total` (weighted defect load exceeds the planned story points), the raw value goes negative; the rate is **clamped to `0%`** rather than recorded as a negative number. The rate never exceeds `100%`.
- **No points** — when `story_points_total` is `0` the rate is recorded as `n/a` (cannot divide by zero). This is only reachable when the story index has **zero** task entries; a story index that has tasks but no `_(points: …)_` tags falls back to the legacy task-count denominator (see below), so it still produces a number.
- **No points tags (back-compat fallback)** — when the story index has task entries but **none** carry a `_(points: …)_` tag, `story_points_total` falls back to `story_plan_tasks` (the legacy task-count denominator) and `## Notes` records that points were unavailable.

## Counts breakdown

Per-source raw numbers and per-issue costs are retained so the metric can be refined later without re-deriving them.

- **Story-index source** — `story_points_total`: `428`, `story_plan_tasks`: `31`
  - counted from `harness-runs/story_plans/feat_forge_run_control_story_plan.md` (the `N. [x] **Task K** — … _(layer: …)_ _(points: <N>)_` entries under its `## Phase 2 Readiness — Ordered Fix List`, counting `[ ]` and `[x]` alike; all 31 are `[x]`).
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
  - `dispositioned_points`: `0` — no commit in `dev..HEAD` (`git log --format='%h %s%n%b' dev..HEAD`) carries the `record disposition of ` record, so no unit on this branch was closed without a fix; no tokens, pointed or unpointed.
  - Back-compat fallback: not used — every entry carries a `_(points: …)_` tag.
- **User-review source** — `user_review_issues`: `10`, `issue_cost_total`: `70` (per user-review file, then summed; files matched by `harness-runs/user_reviews/feat_forge_run_control_review*.md`, with `feat_forge_run_control_fix_plan*` files and directories excluded)
  - `harness-runs/user_reviews/feat_forge_run_control_review.md`: `3` observations → cost `25`. Counted by **arm 2, top-level list items** — `grep -cE '^[0-9]+\.|^[-*][[:space:]]' <file>` → `3`, arm 1 (`grep -cE '^#{2,4} +[0-9]+[.):]' <file>`) having returned `0`. The trailing "Not in scope" and "Open question" paragraphs are prose, not list items, and are not counted.
    1. a review requesting changes is refused while a run is in flight and must be resubmitted → **Minor** `5`
    2. a round takes only the starting review's body and that reviewer's inline comments → **Major** `15` — data loss: "A refused review's body is lost, and inline comments by other reviewers are left out unless each of them resubmits."
    3. start the next round automatically from reviews that arrived during a run → **Minor** `5`
  - `harness-runs/user_reviews/feat_forge_run_control_review_2.md`: `7` observations → cost `45`. Counted by **arm 2, top-level list items** — `grep -cE '^[0-9]+\.|^[-*][[:space:]]' <file>` → `7`, arm 1 (`grep -cE '^#{2,4} +[0-9]+[.):]' <file>`) having returned `0`. The four `- *…*` bullets under observation 2 are un-indented, so the arm-2 grep counts each as a top-level item.
    1. the summary text of a "Comment" or "Approve" review is dropped from the round → **Major** `15` — data loss: "its summary text is dropped … A reviewer who writes their feedback in the summary of a "Comment" review loses it silently."
    2. `docs/github-run-control.md` §8 records four rows as unverified that have since been checked → **Minor** `5`
    3. (bullet) concurrency group spans workflows in one repository → **Minor** `5`
    4. (bullet) an artifact is listable before its workflow run completes → **Minor** `5`
    5. (bullet) the jobs API names a job with no `name:` key by its key → **Minor** `5`
    6. (bullet) `concurrency: queue: max` verified and deliberately not used → **Minor** `5`
    7. Gate 12 (xiv)'s two-account review step is replaced by a one-account pending-reviews step → **Minor** `5`
  - **total**: `10` observations → `issue_cost_total` `70`
  - Each file's observation count is the count of whatever top-level enumeration that file uses, taken from the first of four arms to return non-zero and never summed across arms: (1) numbered `##`–`####` headings with required trailing punctuation, `grep -cE '^#{2,4} +[0-9]+[.):]'` — `0` for both files; (2) top-level numbered/bulleted list items, `grep -cE '^[0-9]+\.|^[-*][[:space:]]'` — `3` and `7`, so arm 2 is each file's count; (3) an explicit per-observation marker the file itself uses, with the matching grep recorded beside the count; (4) `1`, reserved for a file with no enumeration of any kind. Every observation the user wrote is counted and weighted, including any a later fix plan verifies as OK — the count measures what the user found, not what survived triage.
  - Each observation is weighted in story-point units: **Major** `15` (explicit `[major]` marker, or the observation describes a broken/incorrect user-facing flow, a missing/client-only authorization gate, data loss/corruption/unprotected data, or an absent whole ported behaviour — the deciding phrase is quoted beside the observation), **Trivial** `2` (explicit `[trivial]` marker), **Minor** `5` (the default for every observation without a Major/Trivial classification). No observation in either file carries a `[major]` or `[trivial]` marker; the two Majors are classified on the data-loss condition, quoted above.

## Status

- status: `post-user-review` — `pre-user-review` means this file was written right after the branch (code) review with no user review yet (`issue_cost_total` `0` → `100%`); `post-user-review` means it was re-written after user-review fixes, with the issues from the `feat_forge_run_control_review*.md` files counted and weighted.
- last_updated: `2026-10-02`

## Notes

This is a deliberately basic but points-weighted estimate of the agentic-workflow success rate. The headline rate is `(story_points_total - issue_cost_total) / story_points_total`: the denominator is the sum of the story-plan tasks' story-point complexity estimates (the scope the agent committed to, weighted by effort rather than raw task count), and the subtraction is the severity-weighted cost of user-review observations (defects found after the workflow finished, each costing Minor `5` by default, Major `15` on an explicit marker or a documented broken-flow / security / data-integrity / missing-behaviour classification — with the deciding phrase quoted in the breakdown — and Trivial `2` only on an explicit marker). The retained raw counts (`story_plan_tasks`, `user_review_issues`) and per-issue costs under `## Counts breakdown` let the metric be refined later (e.g., richer per-issue severity triage) without losing the raw data. The four un-indented bullets under observation 2 of `feat_forge_run_control_review_2.md` are counted as separate observations because the arm-2 grep counts every un-indented list item; read as one observation they would lower `issue_cost_total` by `20`.
