## Plan-review Should Fix items stayed open through three rounds and were dropped at the PASS
- **category:** agent-contract
- **evidence:** `harness-runs/task_plan_reviews/fix_sandbox_probe_linux_recipe_gaps/review_0.md` and `review_1.md` carried Should Fix items. The `task-plan-writer`'s two revision returns each said the revision rules apply Must Fix items only, so it left the Should Fix items unapplied (iteration 1: "I did not apply the three Should Fix items"; iteration 2: "I left the 4 Should Fix and 1 Nice to Have alone"). The iteration-2 `task-plan-reviewer` return (`verdict: PASS`, no file written) said: "Four Should Fix items from iteration 1 are still open. None is fixed, and none is listed under `## Rejected findings`. A PASS returns no findings file, so these reach nobody else unless you pass them on."
- **cost this run:** 4 Should Fix and 1 Nice to Have plan findings were never applied, rejected or carried to implementation. One of them (Task 2's copy-out step does not say which evidence directories to copy) is in the same area as the Phase C2 skeptic Must Fix later fixed in `fb33ecac`.

## A `git log dev..HEAD` read failed in the run copy, which has no local `dev` branch
- **category:** tooling-gap
- **evidence:** The `statistics-plan-writer` return (Phase D) said: "`git log dev..HEAD` failed because this checkout has no local `dev` branch ("unknown revision"), so I read the commits over `origin/dev..HEAD` instead." The Phase B `branch-reviewer` return said: "This run copy has no local `dev` branch, so I reviewed the diff against `origin/dev`."
- **cost this run:** none measured; both agents fell back to `origin/dev` on their own.

## architecture-reviewer produced no finding in any of its 4 dispatches this run
- **category:** optimization
- **evidence:** 3 plan-review dispatches (plan iterations 0–2) and 1 implemented-branch dispatch (Phase A2) each returned `verdict: PASS` and wrote no file; `harness-runs/architecture_reviews/fix_sandbox_probe_linux_recipe_gaps/` and `harness-runs/architecture_branch_reviews/fix_sandbox_probe_linux_recipe_gaps_arch_review.md` do not exist. The branch diff touched one `cli/test` file, one `cli/test/fixtures` file and two `docs/` files.
- **cost this run:** 4 dispatches of the 27 this session made.
