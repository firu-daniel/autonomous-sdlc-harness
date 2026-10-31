### 1. Gate 6a: home-directory path in `task_5_plan.md`

**Site:** `harness-runs/task_plans/fix_run_analytics_jq16/task_5_plan.md`. There are two lines to fix:
- the `**Render, as run.**` bullet under `**Deviations from plan:**`, which holds the substring ``to `/workspace`, account `daniel` to `adopter` `` (near line 64)
- the `**(c) Why no permission entry lifts it:**` bullet under `## Disposition`, which holds the substring ``Work/autonomous-sdlc-harness-*/**)`, which covers the target`` (near line 73)

**Failing test:** none — gate 6a no machine paths (`scripts/run-gates.sh` → `machine_path_hits`)

**Failure, from the log** (in these quotes the home directory is shown as `<home>`, and the long lines are shortened to the matching span with `…`):

```
  FAIL  6a no machine paths (printed output, which is the finding)
        ./harness-runs/task_plans/fix_run_analytics_jq16/task_5_plan.md:64:  - **Render, as run.** … then the three clauses longest path first (scratch root to `/workspace/notes-app`, its parent to `/workspace`, `<home>` to `/workspace`, account `daniel` to `adopter` with 0 hits). …
        ./harness-runs/task_plans/fix_run_analytics_jq16/task_5_plan.md:73:- **(c) Why no permission entry lifts it:** … allows `Edit(//<home>/Work/autonomous-sdlc-harness-*/**)`, which covers the target, and none of its `Edit` deny rules names it. …
```

**Diagnosis:** This is a branch regression with no earlier round to compare against. Task 5's implementer added these lines to its plan record in commit `af4a93cb` (`fix: Record disposition of Task 5 …`) and copied the machine's real home path into them twice:
- line 64 names the home path as the source of one of the render's substitution clauses
- line 73 quotes the main checkout's `Edit(//…)` allow rule as it appears in the rendered profile

Gate 6a runs `grep -rn "$HOME" .` over the tree. It excludes `test_run_logs` and `scratch` but not `task_plans`, so both lines are hits. The tree contains no other hit: a `grep -rlF` of the home path, with gate 6a's exclusions, lists only this file. The cross-layer rule `.claude/context/conventions.md` → `## The testing bar` (*"nothing in this tree may name a location on the machine that wrote it"*) applies to this committed run artifact.

The same bullets also name two system temp paths: the `git archive` copy location on line 64, and the temp copy in the `**Figures, as measured.**` bullet on line 66, both under the `/private/tmp/` root. Gate 6a does not match them, but they fall under the same convention.

**Fix:** Edit only `harness-runs/task_plans/fix_run_analytics_jq16/task_5_plan.md`, and change nothing except the machine-specific path spans:
- [ ] Line 64, `**Render, as run.**`: replace the home-path code span in the clause `` `<that path>` to `/workspace` `` with `` `<home>` `` (the clause becomes ``… its parent to `/workspace`, `<home>` to `/workspace`, account …``). Replace the system-temp code span after `copy at ` (the span ending `t5-kKKYZg/notes-app`) with `` `<tmp>/t5-kKKYZg/notes-app` ``.
- [ ] Line 66, `**Figures, as measured.**`: replace the system-temp code span inside `(a temp copy of both files (…))` (the span ending `t5m-PI6iSf`) with `` `<tmp>/t5m-PI6iSf` ``.
- [ ] Line 73, `**(c) …**`: in the quoted allow rule, replace the home-path prefix after `//` with `<home>`, so the rule reads `` `Edit(//<home>/Work/autonomous-sdlc-harness-*/**)` ``.
- [ ] Do not change any other text in the record: the refusal quote, the remedy script and the figures stay byte-identical. The `~/.local/state/…` mention on line 73 is already home-relative and stays as it is.

After the edit, a bare `grep -nF` of the home directory (from `printenv HOME`) over the file prints nothing, and so does a `grep -nF '/private/tmp/'` over it.
