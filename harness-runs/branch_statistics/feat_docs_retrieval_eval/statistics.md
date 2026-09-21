# Branch statistics: feat_docs_retrieval_eval

## Summary

- `success_rate`: **`100%`** — headline metric.
- `story_points_total`: `225` — denominator (sum of every task's `_(points: <N>)_` story-point estimate in the story index's `## Phase 2 Readiness — Ordered Fix List`).
- `issue_cost_total`: `0` — subtraction (sum of each user-review observation's severity weight, in story-point units). No user review has run on this branch yet.
- `story_plan_tasks`: `14` — retained raw count of `## Phase 2 Readiness — Ordered Fix List` task entries.
- `user_review_issues`: `0` — retained raw count of observations across all `feat_docs_retrieval_eval_review*.md` user-review files (none exist).

Formula:

```
success_rate = round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1) percent
```

Worked example: `round(clamp((225 - 0) / 225, 0, 1) * 100, 1)` = `round(100.0, 1)` = `100%`.

Edge cases (the rate is always computed via the formula, then adjusted by these rules):

- **No issues** — when `issue_cost_total` is `0` (no user review yet, or a fully clean review) the rate is `100%`. This is the case here.
- **Clamped at zero** — when `issue_cost_total > story_points_total` (weighted defect load exceeds the planned story points), the raw value goes negative; the rate is **clamped to `0%`** rather than recorded as a negative number. The rate never exceeds `100%`.
- **No points** — when `story_points_total` is `0` the rate is recorded as `n/a` (cannot divide by zero). This is only reachable when the story index has **zero** task entries; a story index that has tasks but no `_(points: …)_` tags falls back to the legacy task-count denominator (see below), so it still produces a number.
- **No points tags (back-compat fallback)** — when the story index has task entries but **none** carry a `_(points: …)_` tag (an older branch predating story points), `story_points_total` falls back to `story_plan_tasks` (the legacy task-count denominator) and `## Notes` records that points were unavailable. This fallback did **not** fire here: every entry carries a `_(points: …)_` tag.

## Counts breakdown

Per-source raw numbers and per-issue costs are retained so the metric can be refined later without re-deriving them.

- **Story-index source** — `story_points_total`: `225`, `story_plan_tasks`: `14`
  - counted from `harness-runs/story_plans/feat_docs_retrieval_eval_story_plan.md` (the `N. [ ] **Task K** — … _(layer: …)_ _(points: <N>)_` entries under its `## Phase 2 Readiness — Ordered Fix List`, counting `[ ]` and `[x]` alike; all 14 entries here are `[x]`).
  - per-task points (`_(points: <N>)_` tag on each entry), summed:
    - Task 1 — Store case: the lexical arm's non-matching rows, and the synthetic bisect for the index-scan crossover: `20`
    - Task 2 — The two committed corpora and their query sets, in the graded JSONL format: `15`
    - Task 3 — Runner core: runner-owned config, index build, label hygiene, argument surface: `20`
    - Task 4 — Arms B–E, the metrics, and the results file of record: `20`
    - Task 5 — Calibrate `ABSTAIN_SCORE_THRESHOLD` and retire the provisional marker: `10`
    - Task 14 — The threshold calibration record in `docs/retrieval-eval-results.md`: `10`
    - Task 6 — Arm A's harness, its agent-task text and its transcript scorer — built, never run: `15`
    - Task 7 — The query-log pass over MCP against the real models: `15`
    - Task 8 — Cold-build wall time and index size on disk, through `scratch-run.sh`: `15`
    - Task 9 — The regression gate: the recorded floor, `run-gates.sh`, gate 11 in `docs/development.md` §5, and the post-move regeneration of the results file's generated region: `20`
    - Task 10 — `docs/retrieval-eval.md`: how to run it anywhere, what each metric means, and the decision rule: `20`
    - Task 11 — The arm A hand-run procedure, written for an operator at a terminal: `15`
    - Task 12 — `docs/retrieval.md`: the real-model record, the retired and reworded `## Still open` entries, and the `setup-worktree.sh` argument: `20`
    - Task 13 — The two directory contracts: `evals/README.md`'s second tenant and `evals/docs-retrieval/README.md`: `10`
    - **sum (`story_points_total`)**: `225`
  - `dispositioned_points`: `0` — no commit in `main..HEAD` carries the `record disposition of ` record (`git log --format='%h %s%n%b' main..HEAD` matched no such line), so no unit on this branch was closed without a fix. No unpointed matched tokens either.
  - (Back-compat: not applicable — all 14 entries carry a `_(points: …)_` tag, so the legacy task-count denominator of `14` was not used.)
- **User-review source** — `user_review_issues`: `0`, `issue_cost_total`: `0`
  - globbed `harness-runs/user_reviews/feat_docs_retrieval_eval_review*.md` — **no matching files**. This is the first-write (pre-user-review) invocation, so there is nothing to count or weight. (The directory holds only other branches' review and fix-plan files; anything containing `_fix_plan` is excluded by the pattern and was not counted.)
  - **total**: `0` observations → `issue_cost_total` `0`
  - Each file's observation count would be the count of whatever top-level enumeration that file uses, taken from the first of four arms to return non-zero and never summed across arms: (1) numbered `##`–`####` headings with required trailing punctuation, `grep -cE '^#{2,4} +[0-9]+[.):]'`; (2) top-level numbered/bulleted list items, `grep -cE '^[0-9]+\.|^[-*][[:space:]]'`; (3) an explicit per-observation marker the file itself uses, with the matching grep recorded beside the count; (4) `1`, reserved for a file with no enumeration of any kind. No arm was exercised here — there are no files.
  - Each observation is weighted in story-point units: **Major** `15` (explicit `[major]` marker, or the observation describes a broken/incorrect user-facing flow, a missing/client-only authorization gate, data loss/corruption/unprotected data, or an absent whole ported behaviour — the deciding phrase quoted beside the observation), **Trivial** `2` (explicit `[trivial]` marker), **Minor** `5` (the default for every observation without a Major/Trivial classification). No weights were assigned on this run.

## Status

- status: `pre-user-review` — written right after the branch (code) review with no user review yet (`issue_cost_total` `0` → `100%`). A later post-user-review invocation re-counts from scratch and overwrites this file.
- last_updated: `2026-09-22`

## Notes

This is a deliberately basic but points-weighted estimate of the agentic-workflow success rate. The headline rate is `(story_points_total - issue_cost_total) / story_points_total`: the denominator is the sum of the story-plan tasks' story-point complexity estimates (the scope the agent committed to, weighted by effort rather than raw task count), and the subtraction is the severity-weighted cost of user-review observations (defects found after the workflow finished, each costing Minor `5` by default, Major `15` on an explicit marker or a documented broken-flow / security / data-integrity / missing-behaviour classification, and Trivial `2` only on an explicit marker). The retained raw counts (`story_plan_tasks`, `user_review_issues`) and per-issue costs under `## Counts breakdown` let the metric be refined later (e.g., richer per-issue severity triage) without losing the raw data. `dispositioned_points` is `0` on this branch and no dispositioned unit was matched, so no story points were closed without a fix. The `100%` here reflects only that no user review has run yet — it is not evidence of a clean user review.
