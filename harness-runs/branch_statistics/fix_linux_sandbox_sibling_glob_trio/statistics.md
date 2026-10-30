# Branch statistics: fix_linux_sandbox_sibling_glob_trio

## Summary

- `success_rate`: **`0%`**, the headline metric.
- `story_points_total`: `120`, the denominator (sum of every task's `_(points: <N>)_` story-point estimate in the story index's `## Phase 2 Readiness — Ordered Fix List`).
- `issue_cost_total`: `180`, the subtraction (sum of each user-review observation's severity weight, in story-point units).
- `story_plan_tasks`: `8`, the retained raw count of `## Phase 2 Readiness — Ordered Fix List` task entries.
- `user_review_issues`: `30`, the retained raw count of observations across all `fix_linux_sandbox_sibling_glob_trio_review*.md` user-review files.

Formula:

```
success_rate = round(clamp((story_points_total - issue_cost_total) / story_points_total, 0, 1) * 100, 1) percent
```

Worked example: `round(clamp((120 - 180) / 120, 0, 1) * 100, 1)` = `round(clamp(-0.5, 0, 1) * 100, 1)` = `0%` (clamped-at-zero rule).

Edge cases (the rate is always computed via the formula, then adjusted by these rules):

- **No issues**: when `issue_cost_total` is `0` (no user review yet, or a fully clean review) the rate is `100%`.
- **Clamped at zero**: when `issue_cost_total > story_points_total` (weighted defect load exceeds the planned story points), the raw value goes negative; the rate is **clamped to `0%`** rather than recorded as a negative number. The rate never exceeds `100%`.
- **No points**: when `story_points_total` is `0` the rate is recorded as `n/a` (cannot divide by zero). This is only reachable when the story index has **zero** task entries; a story index that has tasks but no `_(points: …)_` tags falls back to the legacy task-count denominator (see below), so it still produces a number.
- **No points tags (back-compat fallback)**: when the story index has task entries but **none** carry a `_(points: …)_` tag (an older branch predating story points), `story_points_total` falls back to `story_plan_tasks` (the legacy task-count denominator) and `## Notes` records that points were unavailable.

## Counts breakdown

Per-source raw numbers and per-issue costs are retained so the metric can be refined later without re-deriving them.

- **Story-index source**: `story_points_total`: `120`, `story_plan_tasks`: `8`
  - counted from `harness-runs/story_plans/fix_linux_sandbox_sibling_glob_trio_story_plan.md` (the `N. [x] **Task K** — … _(layer: …)_ _(points: <N>)_` entries under its `## Phase 2 Readiness — Ordered Fix List`, counting `[ ]` and `[x]` alike; all eight are `[x]`).
  - per-task points (`_(points: <N>)_` tag on each entry), summed:
    - Task 1: `15`
    - Task 2: `20`
    - Task 3: `15`
    - Task 4: `5`
    - Task 5: `15`
    - Task 6: `20`
    - Task 7: `20`
    - Task 8: `10`
    - **sum (`story_points_total`)**: `120`
  - `dispositioned_points`: `0`. No commit in `dev..HEAD` carries the `record disposition of ` record. The range was evaluated as `origin/dev..HEAD` because this checkout has no local `dev` ref. No task here was closed without a fix, and no unpointed unit was matched.
  - (Back-compat fallback not triggered: every entry carries a `_(points: …)_` tag.)
- **User-review source**: `user_review_issues`: `30`, `issue_cost_total`: `180` (per user-review file, then summed)
  - glob `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_review*.md` matched one file. No match contained `_fix_plan`, so none was dropped.
  - `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_review.md`: `30` observations → cost `180`. Counted by **arm 2, top-level list items**: `grep -cE '^[0-9]+\.|^[-*][[:space:]]' <file>` → `30`. Arm 1 (`grep -cE '^#{2,4} +[0-9]+[.):]' <file>`) returned `0`. Each observation's assigned weight is listed beside it, keyed by its line in the file:
    1. L9 **Container.** session environment → **Minor** `5`
    2. L10 **Versions.** tool versions → **Minor** `5`
    3. L11 **The checkout.** how the main checkout and local `dev` were set up → **Minor** `5`
    4. L12 **The sibling.** the shared sibling clone → **Minor** `5`
    5. L16 **The rendered per-run profile.** `denyWrite` / 18 `Edit` rules still naming the trio → **Minor** `5`
    6. L21 **AP1 — fail.** → **Major** `15`. Deciding phrase: "Sandboxed `git status` in the clone exits 128 in A and B: `fatal: failed to read <clone>/.git/commondir: Permission denied`". Git does not work in the run copy, so the user-facing run flow does not work end-to-end.
    7. L25 **AP2 — fail.** placeholders and leftover trio files. This is a reading, and the breakage it causes is counted under AP1/AP3 → **Minor** `5`
    8. L29 **AP3 — fail.** → **Major** `15`. Deciding phrase: "`hr_run_copy_check_var` exits 1 … `git status (clone)` exits 128". After the sweep, the run copy is refused and git is broken in it.
    9. L33 **AP4 — pass.** → **Minor** `5`
    10. L34 **AP5 — pass.** → **Minor** `5`
    11. L35 **AP6 — differs from its expectation.** the expectation needs rewriting → **Minor** `5`
    12. L45 **The profile.** (control) → **Minor** `5`
    13. L46 **How it was run.** (control) → **Minor** `5`
    14. L47 **The clone's `commondir` and `http-alternates`.** (control) → **Minor** `5`
    15. L48 **`git status` in the clone.** (control) → **Minor** `5`
    16. L49 **The clone's `config.worktree`.** (control) → **Minor** `5`
    17. L50 **The other entries.** (control) → **Minor** `5`
    18. L51 **Claude Code's built-in protected paths, new.** untracked clutter in the clone → **Minor** `5`
    19. L60 conclusion: `Edit(...)` deny rules are enforced in the bubblewrap sandbox → **Minor** `5`
    20. L61 conclusion: `config.worktree` is created at session start → **Minor** `5`
    21. L65 item 1, drop the run copy's own trio `Edit` rules on a bubblewrap host → **Minor** `5`
    22. L72 item 2, keep sibling run copies' `Edit` protection by exact path → **Minor** `5`. This guards against a risk that item 1's change would open, not a gap present on the branch.
    23. L78 item 3, the trust check accepts an empty `config.worktree` / `http-alternates` → **Major** `15`. Deciding phrase: "Without this, a Linux run copy is refused from its first session." A Linux run does not work end-to-end.
    24. L92 item 4, the built-in leftovers → **Minor** `5`
    25. L103 item 5, the check script reads what this round needs → **Minor** `5`
    26. L114 item 6, record both sessions → **Minor** `5`
    27. L139 constraint: no measured result invented → **Minor** `5`
    28. L140 constraint: macOS unchanged → **Minor** `5`
    29. L141 constraint: trust checks weakened only as item 3 states → **Minor** `5`
    30. L142 constraint: Bash 3.2 floor, typecheck and gates pass → **Minor** `5`
  - **total**: `30` observations → `issue_cost_total` `180` (3 Major × `15` = `45`, 27 Minor × `5` = `135`, 0 Trivial).
  - Each file's observation count is the count of whatever top-level enumeration that file uses. It comes from the first of four arms to return non-zero and is never summed across arms:
    1. numbered `##`–`####` headings with required trailing punctuation, `grep -cE '^#{2,4} +[0-9]+[.):]'`, which returned `0` here;
    2. top-level numbered/bulleted list items, `grep -cE '^[0-9]+\.|^[-*][[:space:]]'`, which returned `30` here, so arm 2 is this file's count;
    3. an explicit per-observation marker the file itself uses, with the matching grep recorded beside the count;
    4. `1`, reserved for a file with no enumeration of any kind.

    The arm and its grep are recorded beside the file's count above. Every observation the user wrote is counted and weighted, including any a later fix plan verifies as OK. The count measures what the user found, not what survived triage.
  - Each observation is weighted in story-point units:
    - **Major** `15`: an explicit `[major]` marker, or the observation describes a broken/incorrect user-facing flow, a missing/client-only authorization gate, data loss/corruption/unprotected data, or an absent whole ported behaviour. The deciding phrase is quoted beside the observation.
    - **Trivial** `2`: an explicit `[trivial]` marker.
    - **Minor** `5`: the default for every observation without a Major/Trivial classification.

## Status

- status: `post-user-review`. `pre-user-review` means this file was written right after the branch (code) review with no user review yet (`issue_cost_total` `0` → `100%`). `post-user-review` means it was re-written after user-review fixes, with the issues from the `fix_linux_sandbox_sibling_glob_trio_review*.md` files counted and weighted.
- last_updated: `2026-10-30`

## Notes

This is a deliberately basic but points-weighted estimate of the agentic-workflow success rate. The headline rate is `(story_points_total - issue_cost_total) / story_points_total`.

- **Denominator.** The sum of the story-plan tasks' story-point complexity estimates: the scope the agent committed to, weighted by effort rather than raw task count.
- **Subtraction.** The severity-weighted cost of user-review observations, meaning defects found after the workflow finished. Each costs Minor `5` by default. Major `15` applies on an explicit marker or a documented broken-flow / security / data-integrity / missing-behaviour classification, with the deciding phrase quoted in the breakdown. Trivial `2` applies only on an explicit marker.
- **Retained raw data.** The raw counts (`story_plan_tasks`, `user_review_issues`) and per-issue costs under `## Counts breakdown` let the metric be refined later (e.g., richer per-issue severity triage) without losing the raw data.
- **Dispositioned units.** A unit closed via the unit loop's dispositioned outcome keeps its points in the denominator. Here no unit was dispositioned.
- **Commit range.** The disposition scan used `origin/dev..HEAD` because the configured `defaultBranch` `dev` exists in this checkout only as the remote-tracking ref.
- **What arm 2 counted.** The user review is a measured-session report followed by a numbered change list. Arm 2 counts every un-indented list item, so its `30` includes:
  - the session-setup bullets (L9–L12, L45–L46);
  - the passing AP rows (L33–L34);
  - the measured conclusions (L60–L61);
  - the `## Constraints` bullets (L139–L142).

  These are counted alongside the six numbered change items and the failing AP rows. The rule is applied as written rather than improvised. For refinement only: had just the six numbered change items been counted, at their assigned weights (one Major `15`, five Minor `5`, cost `40`), the rate would be `66.7%`. That figure is not the recorded rate.
