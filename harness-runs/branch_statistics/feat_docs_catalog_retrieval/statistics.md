# Branch statistics: feat_docs_catalog_retrieval

## Summary

- `success_rate`: **`91.5%`** — headline metric.
- `story_points_total`: `355` — denominator (sum of every task's `_(points: <N>)_` story-point estimate in the story index's `## Phase 2 Readiness — Ordered Fix List`).
- `issue_cost_total`: `30` — subtraction (sum of each user-review observation's severity weight, in story-point units).
- `story_plan_tasks`: `25` — retained raw count of `## Phase 2 Readiness — Ordered Fix List` task entries.
- `user_review_issues`: `6` — retained raw count of observations across all `feat_docs_catalog_retrieval_review*.md` user-review files.

Formula:

```
success_rate = round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1) percent
```

Worked example: `round(clamp((355 - 30) / 355, 0, 1) * 100, 1)` = `round(91.5492…, 1)` = `91.5%`.

Edge cases (the rate is always computed via the formula, then adjusted by these rules):

- **No issues** — when `issue_cost_total` is `0` (no user review yet, or a fully clean review) the rate is `100%`.
- **Clamped at zero** — when `issue_cost_total > story_points_total` (weighted defect load exceeds the planned story points), the raw value goes negative; the rate is **clamped to `0%`** rather than recorded as a negative number. The rate never exceeds `100%`.
- **No points** — when `story_points_total` is `0` the rate is recorded as `n/a` (cannot divide by zero). This is only reachable when the story index has **zero** task entries; a story index that has tasks but no `_(points: …)_` tags falls back to the legacy task-count denominator (see below), so it still produces a number.
- **No points tags (back-compat fallback)** — when the story index has task entries but **none** carry a `_(points: …)_` tag, `story_points_total` falls back to `story_plan_tasks` and `## Notes` records that points were unavailable. This fallback did **not** fire here: every one of the 25 entries carries a tag.

## Counts breakdown

Per-source raw numbers and per-issue costs are retained so the metric can be refined later without re-deriving them.

- **Story-index source** — `story_points_total`: `355`, `story_plan_tasks`: `25`
  - counted from `harness-runs/story_plans/feat_docs_catalog_retrieval_story_plan.md` (the `N. [ ] **Task K** — … _(layer: …)_ _(points: <N>)_` entries under its `## Phase 2 Readiness — Ordered Fix List`, counting `[ ]` and `[x]` alike; all 25 are `[x]`).
  - per-task points (`_(points: <N>)_` tag on each entry), summed:
    - Task 1: `15`
    - Task 2: `16`
    - Task 3: `15`
    - Task 4: `10`
    - Task 5: `16`
    - Task 6: `15`
    - Task 7: `15`
    - Task 8: `16`
    - Task 9: `14`
    - Task 10: `20`
    - Task 11: `12`
    - Task 12: `18`
    - Task 13: `18`
    - Task 14: `7`
    - Task 15: `15`
    - Task 16: `15`
    - Task 17: `11`
    - Task 18: `10`
    - Task 19: `14`
    - Task 20: `17`
    - Task 21: `20`
    - Task 22: `10`
    - Task 23: `15`
    - Task 24: `6`
    - Task 25: `15`
    - **sum (`story_points_total`)**: `355`
  - `dispositioned_points`: `0` — no commit in `main..HEAD` carries the `record disposition of ` record, so no unit on this branch was closed without a fix, and no unpointed token (a `**Finding K**` unit or a stale-base match) was matched either.
- **User-review source** — `user_review_issues`: `6`, `issue_cost_total`: `30` (per user-review file, then summed)
  - `harness-runs/user_reviews/feat_docs_catalog_retrieval_review.md`: `6` observations → cost `30`. Counted by **arm 2, top-level list items** — `grep -cE '^[0-9]+\.|^[-*][[:space:]]' <file>` → `6`, arm 1 (`grep -cE '^#{2,4} +[0-9]+[.):]'`) having returned `0`. Each observation's assigned weight beside it:
    1. `docs/retrieval.md` → `## Trade-offs` is mis-titled; split into buys / next / costs → **Minor** `5`
    2. adopter-facing surfaces should say "RAG (docs retrieval)"; add a `--rag` alias, rename no identifier → **Minor** `5`
    3. add opt-in `search_docs` query logging behind one environment variable → **Minor** `5`
    4. Gate 10 has no real-corpus cold-build time / index-size measurement step → **Minor** `5`
    5. `ROADMAP.md` `Cloud / CI execution` row should name docs-retrieval provisioning as a sub-problem → **Minor** `5`
    6. an empty `##`/`###` section still becomes its own chunk; emit no row for an empty `##` section with `###` children → **Minor** `5`
  - **total**: `6` observations → `issue_cost_total` `30`
  - Each file's observation count is the count of whatever top-level enumeration that file uses, taken from the first of four arms to return non-zero and never summed across arms: (1) numbered `##`–`####` headings with required trailing punctuation, `grep -cE '^#{2,4} +[0-9]+[.):]'` — here `0`; (2) top-level numbered/bulleted list items, `grep -cE '^[0-9]+\.|^[-*][[:space:]]'` — here `6`, so arm 2 is this file's count; (3) an explicit per-observation marker the file itself uses; (4) `1`, reserved for a file with no enumeration of any kind. The glob `feat_docs_catalog_retrieval_review*.md` matched exactly one file; the `_fix_plan` files and directories in the same folder are excluded by the pattern and were dropped from the match list before counting. Every observation the user wrote is counted and weighted, including any a later fix plan verifies as OK.
  - Each observation is weighted in story-point units: **Major** `15` (explicit `[major]` marker, or the observation describes a broken/incorrect user-facing flow, a missing/client-only authorization gate, data loss/corruption/unprotected data, or an absent whole ported behaviour — the deciding phrase is quoted beside the observation), **Trivial** `2` (explicit `[trivial]` marker), **Minor** `5` (the default for every observation without a Major/Trivial classification).

**Why all six took the Minor default.** The weight is assigned from the observation **as the reviewer wrote it**, not from what the fix turned out to involve: none of the six carries an explicit `[major]` or `[trivial]` marker, and none, read from the review text alone, meets a Major condition. Observations 1, 2 and 5 are documentation framing and vocabulary; 3 and 4 add an observability seam and a measurement step that did not exist rather than repairing one that failed; 6 degrades retrieval ranking on a real corpus ("roughly a hundred near-identical, near-empty rows competing for generic query terms") but describes no user-facing flow that fails end to end, no authorization gate, no data loss and no absent ported behaviour. No Major or Trivial call was made, so no deciding phrase needed quoting for a non-default classification.

## Status

- status: `post-user-review`
- last_updated: `2026-09-20`

## Notes

This is a deliberately basic but points-weighted estimate of the agentic-workflow success rate. The headline rate is `(story_points_total - issue_cost_total) / story_points_total`: the denominator is the sum of the story-plan tasks' story-point complexity estimates (the scope the agent committed to, weighted by effort rather than raw task count), and the subtraction is the severity-weighted cost of user-review observations (defects found after the workflow finished, each costing Minor `5` by default, Major `15` on an explicit marker or a documented broken-flow / security / data-integrity / missing-behaviour classification, and Trivial `2` only on an explicit marker). The retained raw counts (`story_plan_tasks`, `user_review_issues`) and per-issue costs under `## Counts breakdown` let the metric be refined later (e.g., richer per-issue severity triage) without losing the raw data. `dispositioned_points` is `0` on this branch — no unit was closed without a fix — so no story points here are counted as delivered on a disposition.
