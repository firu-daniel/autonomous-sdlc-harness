# Branch statistics: fix_linux_sandbox_deny_placeholders

## Summary

- `success_rate`: **`75.5%`** — headline metric.
- `story_points_total`: `163` — denominator (sum of every task's `_(points: <N>)_` story-point estimate in the story index's `## Phase 2 Readiness — Ordered Fix List`).
- `issue_cost_total`: `40` — subtraction (sum of each user-review observation's severity weight, in story-point units).
- `story_plan_tasks`: `11` — retained raw count of `## Phase 2 Readiness — Ordered Fix List` task entries.
- `user_review_issues`: `6` — retained raw count of observations across all `fix_linux_sandbox_deny_placeholders_review*.md` user-review files.

Formula:

```
success_rate = round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1) percent
```

Worked example: `round(clamp((163 - 40) / 163, 0, 1) * 100, 1)` = `round(75.4601…, 1)` = `75.5%`.

Edge cases (the rate is always computed via the formula, then adjusted by these rules):

- **No issues** — when `issue_cost_total` is `0` (no user review yet, or a fully clean review) the rate is `100%`.
- **Clamped at zero** — when `issue_cost_total > story_points_total` (weighted defect load exceeds the planned story points), the raw value goes negative; the rate is **clamped to `0%`** rather than recorded as a negative number. The rate never exceeds `100%`.
- **No points** — when `story_points_total` is `0` the rate is recorded as `n/a` (cannot divide by zero). This is only reachable when the story index has **zero** task entries; a story index that has tasks but no `_(points: …)_` tags falls back to the legacy task-count denominator (see below), so it still produces a number.
- **No points tags (back-compat fallback)** — when the story index has task entries but **none** carry a `_(points: …)_` tag (an older branch predating story points), `story_points_total` falls back to `story_plan_tasks` (the legacy task-count denominator) and `## Notes` records that points were unavailable.

## Counts breakdown

Per-source raw numbers and per-issue costs are retained so the metric can be refined later without re-deriving them.

- **Story-index source** — `story_points_total`: `163`, `story_plan_tasks`: `11`
  - counted from `harness-runs/story_plans/fix_linux_sandbox_deny_placeholders_story_plan.md` (the `N. [x] **Task K** — … _(layer: …)_ _(points: <N>)_` entries under its `## Phase 2 Readiness — Ordered Fix List`, counting `[ ]` and `[x]` alike; all 11 are `[x]`).
  - per-task points (`_(points: <N>)_` tag on each entry), summed:
    - Task 1: `15`
    - Task 2: `20`
    - Task 3: `10`
    - Task 4: `20`
    - Task 11: `20`
    - Task 5: `5`
    - Task 6: `15`
    - Task 7: `10`
    - Task 8: `20`
    - Task 9: `20`
    - Task 10: `8`
    - **sum (`story_points_total`)**: `163`
  - `dispositioned_points`: `8` — from `git log --format='%h %s%n%b' origin/dev..HEAD` (the configured `defaultBranch` `dev` has no local ref in this checkout, so its remote-tracking ref `origin/dev` was used), lines carrying `record disposition of `:
    - `Task 10` — `9f6fcef3` — `8` points (entry of this story index, kept in the denominator).
    - `Finding 2` — `acf9bd90` — unpointed (a code-review fix-round unit, not an entry of this story index; summed nowhere).
  - (Back-compat: not triggered — every entry carries a `_(points: …)_` tag.)
- **User-review source** — `user_review_issues`: `6`, `issue_cost_total`: `40` (per user-review file, then summed)
  - Glob `harness-runs/user_reviews/fix_linux_sandbox_deny_placeholders_review*.md`, `_fix_plan` matches dropped, matched one file.
  - `harness-runs/user_reviews/fix_linux_sandbox_deny_placeholders_review.md`: `6` observations → cost `40`. Counted by **arm 2, top-level list items** — `grep -cE '^[0-9]+\.|^[-*][[:space:]]' <file>` → `6`, arm 1 (`grep -cE '^#{2,4} +[0-9]+[.):]' <file>`) having returned `0`. The six matches are the numbered item `1.` (line 1) and the five un-indented `- ` bullets (lines 4–8). Each observation's assigned weight beside it:
    1. job mode is left out of the placeholder recovery → **Major** `15` — deciding phrase: *"the leftover `<scriptsDir>/.git` makes `commit-on-branch.sh` in the resumed session and the job's post-session `push-branch.sh` refuse for the rest of that job. That means the fix does not reach remote CI jobs"* (a flow that does not work end-to-end after a job-mode stall kill).
    2. write the job's manifest under `$RUNNER_TEMP` → **Minor** `5`
    3. run the sweep in the job-mode stall watchdog's KILL tier, and consider the session start / `push-branch.sh` step → **Minor** `5`
    4. check whether the launch check applies in job mode → **Minor** `5`
    5. add a job-mode case to `watcher-placeholder-host.test.mjs` → **Minor** `5`
    6. rewrite Task 9's **Job mode** item in `docs/cli.md` §6 and the story index's `## Context` bullet → **Minor** `5`
  - **total**: `6` observations → `issue_cost_total` `40`
  - Each file's observation count is the count of whatever top-level enumeration that file uses, taken from the first of four arms to return non-zero and never summed across arms: (1) numbered `##`–`####` headings with required trailing punctuation, `grep -cE '^#{2,4} +[0-9]+[.):]'` — here `0`; (2) top-level numbered/bulleted list items, `grep -cE '^[0-9]+\.|^[-*][[:space:]]'` — here `6`, so arm 2 is this file's count; (3) an explicit per-observation marker the file itself uses, with the matching grep recorded beside the count; (4) `1`, reserved for a file with no enumeration of any kind. Every observation the user wrote is counted and weighted, including any a later fix plan verifies as OK — the count measures what the user found, not what survived triage.
  - Each observation is weighted in story-point units: **Major** `15` (explicit `[major]` marker, or the observation describes a broken/incorrect user-facing flow, a missing/client-only authorization gate, data loss/corruption/unprotected data, or an absent whole ported behaviour — the deciding phrase is quoted beside the observation), **Trivial** `2` (explicit `[trivial]` marker), **Minor** `5` (the default for every observation without a Major/Trivial classification).

## Status

- status: `post-user-review` — `pre-user-review` means this file was written right after the branch (code) review with no user review yet (`issue_cost_total` `0` → `100%`); `post-user-review` means it was re-written after user-review fixes, with the issues from the `fix_linux_sandbox_deny_placeholders_review*.md` files counted and weighted.
- last_updated: `2026-10-30`

## Notes

This is a deliberately basic but points-weighted estimate of the agentic-workflow success rate. The headline rate is `(story_points_total - issue_cost_total) / story_points_total`: the denominator is the sum of the story-plan tasks' story-point complexity estimates (the scope the agent committed to, weighted by effort rather than raw task count), and the subtraction is the severity-weighted cost of user-review observations (defects found after the workflow finished, each costing Minor `5` by default, Major `15` on an explicit marker or a documented broken-flow / security / data-integrity / missing-behaviour classification — with the deciding phrase quoted in the breakdown — and Trivial `2` only on an explicit marker). The retained raw counts (`story_plan_tasks`, `user_review_issues`) and per-issue costs under `## Counts breakdown` let the metric be refined later (e.g., richer per-issue severity triage) without losing the raw data. A unit closed via the unit loop's dispositioned outcome keeps its points in the denominator: `8` story points closed without a fix (`Task 10`; plus unpointed `Finding 2`) — the rate counts them as delivered.

The commit range was taken over `origin/dev..HEAD` because the configured `defaultBranch` (`dev`) has no local branch in this checkout.

The review file has one numbered observation followed by five un-indented bullets, which the reviewer introduced as *"Suggestions for the fix plan to verify against the code, not constraints"*. Arm 2's grep counts all six as top-level items, and the count follows the grep so that it can be re-derived. If only the numbered observation were counted, the figures would be `user_review_issues` `1`, `issue_cost_total` `15` and a rate of `round((163 - 15) / 163 * 100, 1)` = `90.8%`.
