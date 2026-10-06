### 5. `collect`'s `not_started` push notification tells the operator to run `branch-resume` on a run it records as `failed`

**File:** `cli/templates/scripts/remote-run.sh` (`verb_collect`) — "Run $RESUME_HINT $branch to start it again; "

When the run's job never started, `collect` sends:

```bash
    notify not_started "$branch" \
      "$BS_DETAIL. Run $RESUME_HINT $branch to start it again; $(hr_github_resume_route "$branch" "${BS_ENGINE:-<task, user_review or docs: the one the run was started with>}")." \
      "$reason"
```

That push detail names `/autonomous-sdlc-harness:branch-resume` whatever `BS_STATE` is. When no older run carries a bundle and no engine was recovered, the state is `failed`, and `branch-resume` refuses a `failed` run (`plugin/commands/branch-resume.md` → step 6, "Any other state: report it and stop"). An operator who follows the notification's first instruction gets a refusal. The comment `forge_report` posts for the same event already tells the two cases apart: it offers `resume` only when the state is `paused` with an engine, and otherwise the **Run workflow** form.

**Fix:** offer the local command only when the state is `paused`; otherwise name the GitHub form alone.
- [ ] Add `route` and `way` to `verb_collect`'s `local` line.
- [ ] Replace the `notify not_started …` call with:

```bash
    route=$(hr_github_resume_route "$branch" "${BS_ENGINE:-<task, user_review or docs: the one the run was started with>}")
    if [ "$BS_STATE" = paused ]; then
      way="Run $RESUME_HINT $branch to start it again; $route."
    else
      way="Start it again ${route#or }."
    fi
    notify not_started "$branch" "$BS_DETAIL. $way" "$reason"
```

  (`${route#or }` turns "or from GitHub: Run workflow on …" into "from GitHub: Run workflow on …".)
- [ ] In `cli/test/remote-collect.test.mjs` → "a first run whose job never started, with no marker: one issue comment naming the Run workflow form, failed", assert that the `remote-run.sh: notified not_started for feat_x: …` line on stdout does not contain `/autonomous-sdlc-harness:branch-resume`. In "a first run whose job never started, with its issue's started marker: one issue comment naming resume, paused", assert that it does. Run `npm test --workspace cli -- test/remote-collect.test.mjs` from the repository root. That is the only test this fix runs.
