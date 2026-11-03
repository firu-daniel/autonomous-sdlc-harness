# Branch statistics: fix_linux_detached_gate_run

## Summary

- `success_rate`: **`86.7%`** — headline metric.
- `story_points_total`: `300` — denominator (sum of every task's `_(points: <N>)_` story-point estimate in the story index's `## Phase 2 Readiness — Ordered Fix List`).
- `issue_cost_total`: `40` — subtraction (sum of each user-review observation's severity weight, in story-point units).
- `story_plan_tasks`: `18` — retained raw count of `## Phase 2 Readiness — Ordered Fix List` task entries.
- `user_review_issues`: `4` — retained raw count of observations across all `fix_linux_detached_gate_run_review*.md` user-review files.

Formula:

```
success_rate = round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1) percent
```

Worked example: `round(clamp((300 - 40) / 300, 0, 1) * 100, 1)` = `round(86.6666…, 1)` = `86.7%`.

Edge cases (the rate is always computed via the formula, then adjusted by these rules):

- **No issues** — when `issue_cost_total` is `0` (no user review yet, or a fully clean review) the rate is `100%`.
- **Clamped at zero** — when `issue_cost_total > story_points_total` (weighted defect load exceeds the planned story points), the raw value goes negative; the rate is **clamped to `0%`** rather than recorded as a negative number. The rate never exceeds `100%`.
- **No points** — when `story_points_total` is `0` the rate is recorded as `n/a` (cannot divide by zero). This is only reachable when the story index has **zero** task entries; a story index that has tasks but no `_(points: …)_` tags falls back to the legacy task-count denominator (see below), so it still produces a number.
- **No points tags (back-compat fallback)** — when the story index has task entries but **none** carry a `_(points: …)_` tag (an older branch predating story points), `story_points_total` falls back to `story_plan_tasks` (the legacy task-count denominator) and `## Notes` records that points were unavailable.

## Counts breakdown

Per-source raw numbers and per-issue costs are retained so the metric can be refined later without re-deriving them.

- **Story-index source** — `story_points_total`: `300`, `story_plan_tasks`: `18`
  - counted from `harness-runs/story_plans/fix_linux_detached_gate_run_story_plan.md` (the `N. [ ] **Task K** — … _(layer: …)_ _(points: <N>)_` entries under its `## Phase 2 Readiness — Ordered Fix List`, counting `[ ]` and `[x]` alike; all 18 are `[x]`). Raw count by the section-scoped `awk … | grep -cE '^[0-9]+\.\s*\[[ x]\]\s*\*\*Task'` → `18`; points sum by the section-scoped `awk … | grep -oE '_\(points: *[0-9]+\)_' | grep -oE '[0-9]+' | awk '{s+=$1} END{print s+0}'` → `300`.
  - per-task points (`_(points: <N>)_` tag on each entry), summed:
    - Task 1: `15`
    - Task 2: `20`
    - Task 3: `20`
    - Task 4: `20`
    - Task 5: `20`
    - Task 6: `10`
    - Task 7: `10`
    - Task 8: `15`
    - Task 9: `20`
    - Task 10: `15`
    - Task 11: `20`
    - Task 12: `10`
    - Task 13: `20`
    - Task 14: `20`
    - Task 15: `20`
    - Task 16: `20`
    - Task 17: `10`
    - Task 18: `15`
    - **sum (`story_points_total`)**: `300`
  - `dispositioned_points`: `0` — over `git log --format='%h %s%n%b' origin/dev..HEAD` (`defaultBranch` is `dev`; this checkout has no local `dev` ref, so `dev..HEAD` was unresolvable and the remote-tracking `origin/dev` was used as the range base), one commit carries the `record disposition of ` record: `1cf9c423` — unit token `Finding 3`. It is not a `**Task K**` entry of this story index (it is a user-review fix-round finding), so it is listed here as **unpointed** and summed nowhere.
  - (Back-compat: every entry carried a `_(points: …)_` tag, so the legacy task-count fallback did not fire.)
- **User-review source** — `user_review_issues`: `4`, `issue_cost_total`: `40` (per user-review file, then summed)
  - Glob `harness-runs/user_reviews/fix_linux_detached_gate_run_review*.md` matched one file; no match contained `_fix_plan`.
  - `fix_linux_detached_gate_run_review.md`: `4` observations → cost `40`. Counted by **arm 3, an explicit per-observation marker** — each observation opens with a bold number, `**N. …**` — `grep -cE '^\*\*[0-9]+\.' <file>` → `4`, arm 1 (`grep -cE '^#{2,4} +[0-9]+[.):]'`) and arm 2 (`grep -cE '^[0-9]+\.|^[-*][[:space:]]'`) having both returned `0`. Each observation's assigned weight beside it:
    1. the gate launcher accepts the main checkout as its target in local mode → **Major** `15` — *"A session in a run copy can aim `launch-sandboxed-gates.sh` at the main checkout. The launcher treats that as job mode and gives the worker a writable main checkout."* (a missing authorization gate: write access to the privileged main checkout is decided by nothing the session cannot control)
    2. the per-run profile path still comes from `XDG_STATE_HOME` / `HOME` → **Major** `15` — *"If they are changed, the launcher can read a crafted profile and lose the read-only protection inside the run copy."* (a client-only authorization gate: an environment variable the session controls decides which protections apply)
    3. `.claude/context/conventions.md` → `## Shell assets` lists three main-checkout wrappers, not four → **Minor** `5`
    4. two Should Fix items from the plan review after Task 1 were never applied → **Minor** `5`
  - **total**: `4` observations → `issue_cost_total` `40`
  - Each file's observation count is the count of whatever top-level enumeration that file uses, taken from the first of four arms to return non-zero and never summed across arms: (1) numbered `##`–`####` headings with required trailing punctuation, `grep -cE '^#{2,4} +[0-9]+[.):]'` — here `0`; (2) top-level numbered/bulleted list items, `grep -cE '^[0-9]+\.|^[-*][[:space:]]'` — here `0`; (3) an explicit per-observation marker the file itself uses, here `grep -cE '^\*\*[0-9]+\.'` — `4`, so arm 3 is this file's count; (4) `1`, reserved for a file with no enumeration of any kind. Every observation the user wrote is counted and weighted, including any a later fix plan verifies as OK — the count measures what the user found, not what survived triage.
  - Each observation is weighted in story-point units: **Major** `15` (explicit `[major]` marker, or the observation describes a broken/incorrect user-facing flow, a missing/client-only authorization gate, data loss/corruption/unprotected data, or an absent whole ported behaviour — the deciding phrase is quoted beside the observation), **Trivial** `2` (explicit `[trivial]` marker), **Minor** `5` (the default for every observation without a Major/Trivial classification).

**Why two took Major and two the Minor default.** No observation carries an explicit `[major]` or `[trivial]` marker. Observations 1 and 2 each describe, in the review's own words, a sandbox-boundary gate that a session can get past by means it controls: a writable main checkout, and a crafted profile that drops the read-only protection. That is the missing / client-only authorization gate condition. Observations 3 and 4 are documentation and plan-hygiene follow-ups, so they take the Minor default.

## Status

- status: `post-user-review` — `pre-user-review` means this file was written right after the branch (code) review with no user review yet (`issue_cost_total` `0` → `100%`); `post-user-review` means it was re-written after user-review fixes, with the issues from the `fix_linux_detached_gate_run_review*.md` files counted and weighted.
- last_updated: `2026-11-03`

## Notes

This is a deliberately basic but points-weighted estimate of the agentic-workflow success rate. The headline rate is `(story_points_total - issue_cost_total) / story_points_total`: the denominator is the sum of the story-plan tasks' story-point complexity estimates (the scope the agent committed to, weighted by effort rather than raw task count), and the subtraction is the severity-weighted cost of user-review observations (defects found after the workflow finished, each costing Minor `5` by default, Major `15` on an explicit marker or a documented broken-flow / security / data-integrity / missing-behaviour classification — with the deciding phrase quoted in the breakdown — and Trivial `2` only on an explicit marker). The retained raw counts (`story_plan_tasks`, `user_review_issues`) and per-issue costs under `## Counts breakdown` let the metric be refined later (e.g., richer per-issue severity triage) without losing the raw data. A unit closed via the unit loop's dispositioned outcome keeps its points in the denominator, so the rate counts them as delivered.

`0` story points closed without a fix (`Finding 3`, commit `1cf9c423`, an unpointed user-review fix-round unit) — the rate counts them as delivered.

The `dispositioned_points` range was read over `origin/dev..HEAD`, because the configured `defaultBranch` `dev` has no local ref in this checkout.
