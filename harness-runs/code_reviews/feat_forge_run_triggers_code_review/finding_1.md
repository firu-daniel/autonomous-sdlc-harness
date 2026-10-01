### 1. The GitHub route in job-side notifications omits `engine`, so following it resumes a user-review or docs run as a task run

> **Self-contained per-finding file** for the `feat_forge_run_triggers` code-review index (`harness-runs/code_reviews/feat_forge_run_triggers_code_review.md`). The implementer reads only this file. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_github_answer_route`, `hr_github_resume_route`): "Run workflow on %s with action run, branch `%s`"

**Callers:** `cli/templates/scripts/autonomous-watcher.sh`, five `notify` lines in job mode that append `$(hr_github_answer_route "$branch")`, `$(hr_github_answer_route "$branch" clear)` or `$(hr_github_resume_route "$branch")`. They are the `paused as you asked`, `no-progress resumes`, `answer with /autonomous-sdlc-harness:branch-answer`, `usage limit: the in-job wait passed` and `paused itself on API overload` details. `cli/templates/scripts/remote-run.sh` also has seven `notify paused` lines appending `$(hr_github_resume_route "$branch")` (or `"$b"`), in `continue_redispatch`, `continue_wait_poller`, `poll_branch` and `poll_recheck`.

**Problem.** These two producers print the GitHub route a remote-only maintainer follows from a push notification. The route names `action run`, `branch`, `resume` and `answers` (or `resume pause`), and never names `engine`. `harness-run.yml`'s `workflow_dispatch` input `engine` has `default: task` (`cli/templates/github/workflows/harness-run.yml` → `engine:` … `default: task`). A remote-only maintainer who fills the form exactly as the notification says therefore sends `engine: task` for every run. For a parked or paused `user_review` or `docs` run, that re-enters the wrong engine on the branch. Parity with the local route shows the gap: the watcher's own relay always passes the record's engine, and `docs/remote-execution.md` → `### Working a run from GitHub alone` says "`engine` the run's own". The notification is the only text such a maintainer sees, and it is the one place the engine is missing. The example detail quoted in `docs/remote-execution.md` → `### Notifications` ("answer with /autonomous-sdlc-harness:branch-answer <branch>; or from GitHub: …") has the same gap.

**Fix.**

- [ ] In `cli/templates/scripts/lib/harness-run-lib.sh`, change the two signatures to `hr_github_answer_route <branch> <engine> [park_loop_clear]` and `hr_github_resume_route <branch> <engine>`, and update their comment block to match. Build the engine clause once in each function:

  ```bash
  local engine="${2-}" eng
  if [ -n "$engine" ]; then
    eng="engine \`$engine\`"
  else
    eng="engine the run's own (the \`engine\` field of \`status.json\` in its \`$HR_REMOTE_STATE_ARTIFACT\` artifact)"
  fi
  ```

  (call `hr_remote_names_var` before building it, as both functions already do). In `hr_github_answer_route`, move the park-loop test to the third argument (`[ -n "${3-}" ] && clear=', park_loop_clear true'`). Print `branch \`%s\`, %s, resume answer%s …` with `"$eng"` as the new argument after the branch. In `hr_github_resume_route`, print `branch \`%s\`, %s and resume pause`.
- [ ] In `cli/templates/scripts/autonomous-watcher.sh`, pass `"$(registry_get "$branch" engine)"` as the second argument at all five call sites. `run_job` writes the record's `engine` (`registry_set "$branch" engine "$engine"`). The park-loop call becomes `hr_github_answer_route "$branch" "$(registry_get "$branch" engine)" clear`.
- [ ] In `cli/templates/scripts/remote-run.sh`, pass `"$engine_value"` in `continue_redispatch`'s `Re-dispatch failed` line and in `poll_branch`'s `could not re-dispatch $branch ($REDISPATCH_ERR) after $failures attempts` line (each function sets `engine_value` from the status file a few lines above). Pass `""` at the other five remote-run.sh call sites, which print the generic clause.
- [ ] In `docs/remote-execution.md` → `### Notifications`, change the quoted `parked` detail so it carries `` engine `<engine>`, `` after `` branch `<branch>`, ``.
- [ ] In `cli/test/watcher-remote-job.test.mjs`, add `assert.match(parked[0].detail, /engine `task`/)` beside the existing `/Run workflow on harness-run\.yml .*resume answer/` assertion in the `none: the launch line, the start and stop records, and the parked detail` case. That job runs the `task` engine. Then run that file alone: `npm test -- test/watcher-remote-job.test.mjs` from `cli/`. `cli/test/remote-run.test.mjs`'s `resume pause` assertion still matches unchanged. If you edit that file too, run it alone the same way.
