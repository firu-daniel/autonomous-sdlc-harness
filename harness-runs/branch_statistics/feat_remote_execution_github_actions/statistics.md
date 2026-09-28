# Branch statistics: feat_remote_execution_github_actions

## Summary

- `success_rate`: **`89.5%`** — headline metric.
- `story_points_total`: `476` — denominator (sum of every task's `_(points: <N>)_` story-point estimate in the story index's `## Phase 2 Readiness — Ordered Fix List`).
- `issue_cost_total`: `50` — subtraction (sum of each user-review observation's severity weight, in story-point units).
- `story_plan_tasks`: `33` — retained raw count of `## Phase 2 Readiness — Ordered Fix List` task entries.
- `user_review_issues`: `4` — retained raw count of observations across all `feat_remote_execution_github_actions_review*.md` user-review files.

Formula:

```
success_rate = round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1) percent
```

Worked example: `round(clamp((476 - 50) / 476, 0, 1) * 100, 1)` = `round(89.4957…, 1)` = `89.5%`.

Edge cases (the rate is always computed via the formula, then adjusted by these rules):

- **No issues** — when `issue_cost_total` is `0` (no user review yet, or a fully clean review) the rate is `100%`.
- **Clamped at zero** — when `issue_cost_total > story_points_total` (weighted defect load exceeds the planned story points), the raw value goes negative; the rate is **clamped to `0%`** rather than recorded as a negative number. The rate never exceeds `100%`.
- **No points** — when `story_points_total` is `0` the rate is recorded as `n/a` (cannot divide by zero). This is only reachable when the story index has **zero** task entries; a story index that has tasks but no `_(points: …)_` tags falls back to the legacy task-count denominator (see below), so it still produces a number.
- **No points tags (back-compat fallback)** — when the story index has task entries but **none** carry a `_(points: …)_` tag, `story_points_total` falls back to `story_plan_tasks` (the legacy task-count denominator) and `## Notes` records that points were unavailable.

## Counts breakdown

Per-source raw numbers and per-issue costs are retained so the metric can be refined later without re-deriving them.

- **Story-index source** — `story_points_total`: `476`, `story_plan_tasks`: `33`
  - counted from `harness-runs/story_plans/feat_remote_execution_github_actions_story_plan.md` (the `N. [x] **Task K** — … _(layer: …)_ _(points: <N>)_` entries under its `## Phase 2 Readiness — Ordered Fix List`, counting `[ ]` and `[x]` alike; all 33 are `[x]`).
  - per-task points (`_(points: <N>)_` tag on each entry), summed:
    - Task 1: `12`
    - Task 2: `12`
    - Task 3: `14`
    - Task 4: `14`
    - Task 5: `20`
    - Task 6: `15`
    - Task 7: `14`
    - Task 8: `18`
    - Task 9: `20`
    - Task 10: `20`
    - Task 11: `20`
    - Task 12: `18`
    - Task 13: `5`
    - Task 14: `15`
    - Task 15: `20`
    - Task 16: `10`
    - Task 17: `18`
    - Task 18: `16`
    - Task 19: `18`
    - Task 20: `5`
    - Task 21: `10`
    - Task 22: `14`
    - Task 23: `14`
    - Task 24: `14`
    - Task 25: `8`
    - Task 26: `8`
    - Task 27: `16`
    - Task 28: `20`
    - Task 29: `18`
    - Task 30: `14`
    - Task 31: `14`
    - Task 32: `10`
    - Task 33: `12`
    - **sum (`story_points_total`)**: `476` (layer subtotals: `cli` Tasks 1–20 `304`, `plugin` Tasks 21–24 `52`, `general` Tasks 25–33 `120`)
  - `dispositioned_points`: `0` — no commit in `dev..HEAD` (`git log --format='%h %s%n%b' dev..HEAD`, `dev` being `harness.config.json` → `defaultBranch`) carries the `record disposition of ` record, so no unit here was closed without a fix; no tokens, pointed or unpointed.
  - Back-compat fallback did not fire: every entry carries a `_(points: …)_` tag.
- **User-review source** — `user_review_issues`: `4`, `issue_cost_total`: `50` (per user-review file, then summed)
  - glob `harness-runs/user_reviews/feat_remote_execution_github_actions_review*.md` matched one file; no `_fix_plan` path was in the match list.
  - `harness-runs/user_reviews/feat_remote_execution_github_actions_review.md`: `4` observations → cost `50`. Counted by **arm 2, top-level list items** — `grep -cE '^[0-9]+\.|^[-*][[:space:]]' <file>` → `4`, arm 1 (`grep -cE '^#{2,4} +[0-9]+[.):]' <file>`) having returned `0`. Each observation's assigned weight beside it:
    1. `remote-run.sh poll` can disable the resume poller while a job is enabling it → **Major** `15` — a user-facing flow (automatic resume of a usage-paused run) works incorrectly end-to-end: "stranding a usage-paused run" … "A has ended on `decision: wait-poller` with no poller left to resume it, and waits for a manual `/autonomous-sdlc-harness:branch-resume` although its `paused` notification promised an automatic resume at the reset".
    2. a failed re-dispatch by the resume poller is retried every tick with no bound and no notification → **Minor** `5` — the default: the dispatch failure itself originates outside the harness (workflow removed or disabled, `actions: write` withdrawn); the defect described is the missing bound and notification, not a broken harness flow.
    3. storage and artifact retention not covered; `harness-state` bundle retention unset → **Major** `15` — data loss: "The `harness-state` artifact is the only remote copy of a run's clarifications, park-loop count, auto-resume count and walker state" … "a resumed run silently loses its counts".
    4. the interactive-test (QA) phase has no remote path → **Major** `15` — a user-facing flow that does not work: "With `phases.qa: true`, a remote run would reach Phase E on a runner and most likely park there" … "every auth-gated test reports `blocked`".
  - **total**: `4` observations → `issue_cost_total` `50`
  - Each file's observation count is the count of whatever top-level enumeration that file uses, taken from the first of four arms to return non-zero and never summed across arms: (1) numbered `##`–`####` headings with required trailing punctuation, `grep -cE '^#{2,4} +[0-9]+[.):]'` — here `0`; (2) top-level numbered/bulleted list items, `grep -cE '^[0-9]+\.|^[-*][[:space:]]'` — here `4`, so arm 2 is this file's count; (3) an explicit per-observation marker the file itself uses, with the matching grep recorded beside the count; (4) `1`, reserved for a file with no enumeration of any kind. Every observation the user wrote is counted and weighted, including any a later fix plan verifies as OK.
  - Each observation is weighted in story-point units: **Major** `15` (explicit `[major]` marker, or the observation describes a broken/incorrect user-facing flow, a missing/client-only authorization gate, data loss/corruption/unprotected data, or an absent whole ported behaviour — the deciding phrase is quoted beside the observation), **Trivial** `2` (explicit `[trivial]` marker), **Minor** `5` (the default for every observation without a Major/Trivial classification). No observation carries an explicit `[major]` or `[trivial]` tag; the three Major calls rest on the quoted review text alone.

## Status

- status: `post-user-review` — `pre-user-review` means this file was written right after the branch (code) review with no user review yet (`issue_cost_total` `0` → `100%`); `post-user-review` means it was re-written after user-review fixes, with the issues from the `feat_remote_execution_github_actions_review*.md` files counted and weighted.
- last_updated: `2026-09-28`

## Notes

This is a deliberately basic but points-weighted estimate of the agentic-workflow success rate. The headline rate is `(story_points_total - issue_cost_total) / story_points_total`: the denominator is the sum of the story-plan tasks' story-point complexity estimates (the scope the agent committed to, weighted by effort rather than raw task count), and the subtraction is the severity-weighted cost of user-review observations (defects found after the workflow finished, each costing Minor `5` by default, Major `15` on an explicit marker or a documented broken-flow / security / data-integrity / missing-behaviour classification — with the deciding phrase quoted in the breakdown — and Trivial `2` only on an explicit marker). The retained raw counts (`story_plan_tasks`, `user_review_issues`) and per-issue costs under `## Counts breakdown` let the metric be refined later (e.g., richer per-issue severity triage) without losing the raw data. No unit on this branch was closed via the dispositioned outcome. The pre-user-review write used `main..HEAD` as its disposition range; this update uses the configured `defaultBranch`, `dev`, and it also found no disposition record.
