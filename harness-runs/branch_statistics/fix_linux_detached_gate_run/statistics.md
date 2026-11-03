# Branch statistics: fix_linux_detached_gate_run

## Summary

- `success_rate`: **`80.0%`** — headline metric.
- `story_points_total`: `300` — denominator (sum of every task's `_(points: <N>)_` story-point estimate in the story index's `## Phase 2 Readiness — Ordered Fix List`).
- `issue_cost_total`: `60` — subtraction (sum of each user-review observation's severity weight, in story-point units).
- `story_plan_tasks`: `18` — retained raw count of `## Phase 2 Readiness — Ordered Fix List` task entries.
- `user_review_issues`: `6` — retained raw count of observations across all `fix_linux_detached_gate_run_review*.md` user-review files.

Formula:

```
success_rate = round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1) percent
```

Worked example: `round(clamp((300 - 60) / 300, 0, 1) * 100, 1)` = `round(80.0, 1)` = `80.0%`.

Edge cases (the rate is always computed via the formula, then adjusted by these rules):

- **No issues** — when `issue_cost_total` is `0` (no user review yet, or a fully clean review) the rate is `100%`.
- **Clamped at zero** — when `issue_cost_total > story_points_total` (weighted defect load exceeds the planned story points), the raw value goes negative; the rate is **clamped to `0%`** rather than recorded as a negative number. The rate never exceeds `100%`.
- **No points** — when `story_points_total` is `0` the rate is recorded as `n/a` (cannot divide by zero). This is only reachable when the story index has **zero** task entries; a story index that has tasks but no `_(points: …)_` tags falls back to the legacy task-count denominator (see below), so it still produces a number.
- **No points tags (back-compat fallback)** — when the story index has task entries but **none** carry a `_(points: …)_` tag (an older branch predating story points), `story_points_total` falls back to `story_plan_tasks` (the legacy task-count denominator) and `## Notes` records that points were unavailable.

## Counts breakdown

Per-source raw numbers and per-issue costs are retained so the metric can be refined later without re-deriving them.

- **Story-index source** — `story_points_total`: `300`, `story_plan_tasks`: `18`
  - counted from `harness-runs/story_plans/fix_linux_detached_gate_run_story_plan.md` (the `N. [x] **Task K** — … _(layer: …)_ _(points: <N>)_` entries under its `## Phase 2 Readiness — Ordered Fix List`, counting `[ ]` and `[x]` alike; all 18 are `[x]`).
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
  - `dispositioned_points`: `0` — one commit in the branch range carries the `record disposition of ` record: `1cf9c423` (`Finding 3`, *"chore: Record disposition of Finding 3 — tool-layer guard refused the write to .claude/context/conventions.md …"*). `Finding 3` is a user-review fix-round unit, not a `**Task K**` entry of this story index, so it is listed here as **unpointed** and summed nowhere. No `**Task K**` entry was dispositioned. The range was read as `origin/dev..HEAD`: `harness.config.json` → `defaultBranch` is `dev`, which exists in this checkout only as the remote-tracking ref `origin/dev` (`dev..HEAD` is an unknown revision here).
  - Back-compat fallback: not fired — every entry carries a `_(points: …)_` tag.
- **User-review source** — `user_review_issues`: `6`, `issue_cost_total`: `60` (per user-review file, then summed). Glob `harness-runs/user_reviews/fix_linux_detached_gate_run_review*.md`, after dropping any `_fix_plan` match, gives two files.
  - `harness-runs/user_reviews/fix_linux_detached_gate_run_review.md`: `4` observations → cost `40`. Counted by **arm 3, an explicit per-observation marker**: each observation opens with a bold number, `**N. …**`. `grep -cE '^\*\*[0-9]+\.' <file>` → `4`. Arm 1 (`grep -cE '^#{2,4} +[0-9]+[.):]'`) and arm 2 (`grep -cE '^[0-9]+\.|^[-*][[:space:]]'`) both returned `0`.
    1. The gate launcher accepts the main checkout as its target in local mode → **Major** `15`. Deciding phrase: *"A session in a run copy can aim `launch-sandboxed-gates.sh` at the main checkout. The launcher treats that as job mode and gives the worker a writable main checkout"*. That is a missing authorization gate on privileged data: the main checkout the sandbox is meant to protect.
    2. The per-run profile path still comes from `XDG_STATE_HOME` / `HOME` → **Major** `15`. Deciding phrase: *"the launcher can read a crafted profile and lose the read-only protection inside the run copy"*. That is a missing authorization gate: an environment variable decides which protections apply.
    3. `.claude/context/conventions.md` → `## Shell assets` lists three main-checkout wrappers, not four → **Minor** `5`.
    4. Two Should Fix items from the plan review after Task 1 were never applied → **Minor** `5`.
  - `harness-runs/user_reviews/fix_linux_detached_gate_run_review_2.md`: `2` observations → cost `20`. Counted by **arm 3, an explicit per-observation marker** (`**N. …**`). `grep -cE '^\*\*[0-9]+\.' <file>` → `2`. Arm 1 and arm 2 both returned `0`.
    1. The probe's launcher legs never record the per-run profile in the registry → **Major** `15`. Deciding phrase: *"T3 (`legs-local.sh`) and the `gate-sandbox` leg would get the launcher's refusal and print `not run`"*. The probe's launcher flows do not work end to end.
    2. `scripts/launch-sandboxed-gates.sh` is committed `100644` → **Minor** `5`. It is labelled *"Nice to have"* but has no explicit leading `[trivial]` tag, so it takes the Minor default.
  - **total**: `6` observations → `issue_cost_total` `60`.
  - How each file's count is taken: it is the count of whatever top-level enumeration the file uses, from the first of four arms to return non-zero. Arms are never summed. The arms are:
    1. numbered `##`–`####` headings with required trailing punctuation, `grep -cE '^#{2,4} +[0-9]+[.):]'`. Here `0` for both files.
    2. top-level numbered or bulleted list items, `grep -cE '^[0-9]+\.|^[-*][[:space:]]'`. Here `0` for both files: a `**1.` line matches neither alternative.
    3. an explicit per-observation marker the file itself uses, here the bold number `grep -cE '^\*\*[0-9]+\.'`. It gives `4` and `2`.
    4. `1`, for a file with no enumeration of any kind.

    Every observation the user wrote is counted and weighted, including any a later fix plan dispositioned (review 1's item 3 was closed by disposition in `1cf9c423`).
  - Each observation is weighted in story-point units:
    - **Major** `15`: an explicit `[major]` marker, or the observation describes a broken or incorrect user-facing flow, a missing or client-only authorization gate, data loss, corruption or unprotected data, or an absent whole ported behaviour. The deciding phrase is quoted beside the observation.
    - **Trivial** `2`: an explicit `[trivial]` marker.
    - **Minor** `5`: the default for every observation without a Major or Trivial classification.

## Status

- status: `post-user-review`. `pre-user-review` means this file was written right after the branch (code) review, with no user review yet (`issue_cost_total` `0` → `100%`). `post-user-review` means it was rewritten after user-review fixes, with the issues from the `fix_linux_detached_gate_run_review*.md` files counted and weighted.
- last_updated: `2026-11-03`

## Notes

This is a deliberately basic but points-weighted estimate of the agentic-workflow success rate. The headline rate is `(story_points_total - issue_cost_total) / story_points_total`:

- **The denominator** is the sum of the story-plan tasks' story-point complexity estimates. That is the scope the agent committed to, weighted by effort rather than raw task count.
- **The subtraction** is the severity-weighted cost of user-review observations, the defects found after the workflow finished. Each costs Minor `5` by default. It costs Major `15` on an explicit marker or a documented broken-flow, security, data-integrity or missing-behaviour classification, with the deciding phrase quoted in the breakdown. It costs Trivial `2` only on an explicit marker.

The retained raw counts (`story_plan_tasks`, `user_review_issues`) and per-issue costs under `## Counts breakdown` let the metric be refined later, for example with richer per-issue severity triage, without losing the raw data.

0 story points closed without a fix (`Finding 3`, an unpointed user-review fix-round unit dispositioned in `1cf9c423`). The rate counts it as delivered.
