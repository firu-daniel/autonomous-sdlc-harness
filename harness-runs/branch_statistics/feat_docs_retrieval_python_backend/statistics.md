# Branch statistics: feat_docs_retrieval_python_backend

## Summary

- `success_rate`: **`85.7%`** — headline metric.
- `story_points_total`: `280` — denominator (sum of every task's `_(points: <N>)_` story-point estimate in the story index's `## Phase 2 Readiness — Ordered Fix List`).
- `issue_cost_total`: `40` — subtraction (sum of each user-review observation's severity weight, in story-point units).
- `story_plan_tasks`: `17` — retained raw count of `## Phase 2 Readiness — Ordered Fix List` task entries.
- `user_review_issues`: `6` — retained raw count of observations across all `feat_docs_retrieval_python_backend_review*.md` user-review files.

Formula:

```
success_rate = round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1) percent
```

Worked example: `round(clamp((280 - 40) / 280, 0, 1) * 100, 1)` = `round(85.7142…, 1)` = `85.7%`.

Edge cases (the rate is always computed via the formula, then adjusted by these rules):

- **No issues** — when `issue_cost_total` is `0` (no user review yet, or a fully clean review) the rate is `100%`.
- **Clamped at zero** — when `issue_cost_total > story_points_total` (weighted defect load exceeds the planned story points), the raw value goes negative; the rate is **clamped to `0%`** rather than recorded as a negative number. The rate never exceeds `100%`.
- **No points** — when `story_points_total` is `0` the rate is recorded as `n/a` (cannot divide by zero). This is only reachable when the story index has **zero** task entries; a story index that has tasks but no `_(points: …)_` tags falls back to the legacy task-count denominator (see below), so it still produces a number.
- **No points tags (back-compat fallback)** — when the story index has task entries but **none** carry a `_(points: …)_` tag, `story_points_total` falls back to `story_plan_tasks` (the legacy task-count denominator) and `## Notes` records that points were unavailable.

## Counts breakdown

Per-source raw numbers and per-issue costs are retained so the metric can be refined later without re-deriving them.

- **Story-index source** — `story_points_total`: `280`, `story_plan_tasks`: `17`
  - counted from `harness-runs/story_plans/feat_docs_retrieval_python_backend_story_plan.md` (the `N. [x] **Task K** — … _(layer: general)_ _(points: <N>)_` entries under its `## Phase 2 Readiness — Ordered Fix List`, counting `[ ]` and `[x]` alike; all 17 are `[x]`).
  - per-task points (`_(points: <N>)_` tag on each entry), summed:
    - Task 1: `15`
    - Task 2: `15`
    - Task 3: `15`
    - Task 4: `20`
    - Task 5: `15`
    - Task 6: `15`
    - Task 7: `20`
    - Task 8: `20`
    - Task 9: `10`
    - Task 10: `20`
    - Task 11: `20`
    - Task 12: `15`
    - Task 13: `15`
    - Task 14: `15`
    - Task 15: `20`
    - Task 16: `15`
    - Task 17: `15`
    - **sum (`story_points_total`)**: `280`
  - `dispositioned_points`: `0` — no commit in `dev..HEAD` (`git log --format='%h %s%n%b' dev..HEAD`) carries the `record disposition of ` record, so no unit on this branch was closed without a fix, and no unpointed token was matched.
  - Back-compat fallback: not fired — every entry carries a `_(points: …)_` tag.
- **User-review source** — `user_review_issues`: `6`, `issue_cost_total`: `40` (per user-review file, then summed)
  - Glob `harness-runs/user_reviews/feat_docs_retrieval_python_backend_review*.md` matched one file; `feat_docs_retrieval_python_backend_fix_plan.md` and the `feat_docs_retrieval_python_backend_fix_plan/` directory are excluded by the pattern.
  - `harness-runs/user_reviews/feat_docs_retrieval_python_backend_review.md`: `6` observations → cost `40`. Counted by **arm 1, numbered headings** — `grep -cE '^#{2,4} +[0-9]+[.):]' <file>` → `6` (`### 1.` … `### 6.`); arm 2 is not added. Each observation's assigned weight beside it:
    1. A snippet ending in a lone surrogate cannot be serialized on either Python transport → **Major** `15` — deciding phrase: *"for that query the TypeScript backend answers and the Python backend fails to deliver a response"* (a user-facing search flow that does not work end-to-end for that input).
    2. Tool-result failure text carries the whole multi-line driver message → **Minor** `5`
    3. The README's seam record omits that a lost database connection fails every later call → **Minor** `5` (the observation is a missing documentation record; its own fix states *"The finding is the missing record"*)
    4. The refresh-failure remedy diverges from `server.ts` with no deferred-work marker → **Minor** `5`
    5. `fetch-models` under the stub exits 0 having provisioned nothing → **Minor** `5` (a misleading exit status on a documented stub-variable path, not a broken flow; the review itself notes *"The README notes the behaviour"*)
    6. SIGTERM cancels an in-flight call where `serveDocs` drains the queue → **Minor** `5`
  - **total**: `6` observations → `issue_cost_total` `40`
  - Each file's observation count is the count of whatever top-level enumeration that file uses, taken from the first of four arms to return non-zero and never summed across arms: (1) numbered `##`–`####` headings with required trailing punctuation, `grep -cE '^#{2,4} +[0-9]+[.):]'` — here `6`, so arm 1 is this file's count; (2) top-level numbered/bulleted list items, `grep -cE '^[0-9]+\.|^[-*][[:space:]]'` — not evaluated, arm 1 being non-zero; (3) an explicit per-observation marker the file itself uses; (4) `1`, reserved for a file with no enumeration of any kind.
  - Each observation is weighted in story-point units: **Major** `15` (explicit `[major]` marker, or the observation describes a broken/incorrect user-facing flow, a missing/client-only authorization gate, data loss/corruption/unprotected data, or an absent whole ported behaviour — the deciding phrase is quoted beside the observation), **Trivial** `2` (explicit `[trivial]` marker), **Minor** `5` (the default for every observation without a Major/Trivial classification). The file's own `**Severity:**` lines (Must Fix / Should Fix / Nice to Have) are not `[major]` / `[trivial]` markers and were not used as weights; classification reads the observation text alone.

## Status

- status: `post-user-review`
- last_updated: `2026-10-01`

## Notes

This is a deliberately basic but points-weighted estimate of the agentic-workflow success rate. The headline rate is `(story_points_total - issue_cost_total) / story_points_total`: the denominator is the sum of the story-plan tasks' story-point complexity estimates (the scope the agent committed to, weighted by effort rather than raw task count), and the subtraction is the severity-weighted cost of user-review observations (defects found after the workflow finished, each costing Minor `5` by default, Major `15` on an explicit marker or a documented broken-flow / security / data-integrity / missing-behaviour classification — with the deciding phrase quoted in the breakdown — and Trivial `2` only on an explicit marker). The retained raw counts (`story_plan_tasks`, `user_review_issues`) and per-issue costs under `## Counts breakdown` let the metric be refined later (e.g., richer per-issue severity triage) without losing the raw data. No unit on this branch was closed via the dispositioned outcome (`dispositioned_points` `0`).
