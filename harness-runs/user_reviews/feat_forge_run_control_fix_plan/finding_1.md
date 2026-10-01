### 1. A review requesting changes is refused while a run is in flight, and the reviewer is told to resubmit

**File:** `cli/templates/scripts/remote-run.sh` (`control_review`) — "A round is in progress; submit your review again once it completes."

Also touched by this finding: `cli/templates/scripts/remote-run.sh` (`verb_review`) — "# A run in flight takes no review"; `verb_review`'s tail after `verb_dispatch`; `forge_report`'s `stopped` text — "A review that requests changes starts a round only once a run of the branch has completed or failed."; the header's exit map ("or a run in flight (its paragraph)") and its `review` / `control` paragraphs; `cli/templates/github/workflows/harness-control.yml` — "# NO CONCURRENCY GROUP."; `cli/test/remote-control-review.test.mjs` — "a review while the newest run is in progress is refused naming the round in flight; origin unchanged"; `cli/test/workflow-templates.test.mjs` — "control references no secret and declares no concurrency group".

**Problem.** `control_review` hands every review to a `review` child. `verb_review` refuses with exit 2 whenever `remote_state` reports anything but `completed` or `failed`: `running`, `parked`, `park_loop`, or `paused`, the stopped and expired cases included. `control_review` then posts a refusal: "A round is in progress; submit your review again once it completes." or "Submit the review again once that is fixed." Each reviewer must notice when a run ends, which is often hours later, and resubmit by hand. The user wants such a review accepted at once, acknowledged on the pull request, and carried into the next round with nothing lost.

There is a second defect in the same path. `harness-control.yml` deliberately has no concurrency group, so two control jobs for two simultaneous reviews run side by side. Both see the branch as settled, both build round `<n>`, and the loser's push fails (`review` exit 4, "placing the round failed … Submit the review again to retry").

**Fix.**

1. **One settledness test, shared by `review`, `control` and `collect` (Finding 3).** Add a function, for example `branch_settled_var`. It sets the derived state, the newest run's id and URL, and `SETTLED=1|0`. Use `list_runs` and `titled_runs "harness run $branch"`:
   - **No run listed**: settled when `--allow-no-run` applies, as today.
   - **The newest run's `status` is `completed`**: `remote_state` as today, settled only for `completed` or `failed`.
   - **The newest run's `status` is not `completed`**: read its jobs with `gh_call api "repos/{owner}/{repo}/actions/runs/<id>/jobs"`. While no job named `run` exists (queued), or that job is not `completed`, the branch is in flight with state `running`. Once that job is `completed`, read the run's state bundle as `remote_state`'s case 3 does. The bundle's `status` decides: `completed` or `failed` is settled; anything else (`paused` from a budget chain, `parked`, `park_loop`, `running`-read-as-killed) is in flight. The run is "not completed" at that point only because the `collect` job of Finding 3 is still pending or running.
   - Declare the job name as a constant, `RUN_JOB_NAME='run'`, mirrored in `harness-run.yml`'s header (the `run` job has no `name:` key, so GitHub names it by its key).
   - Replace `verb_review`'s `list_runs` / `remote_state ""` / `case "$RS_STATE"` block with this test. The refusal texts and exit 2 stay for an unsettled branch, because the **local** `/autonomous-sdlc-harness:branch-user-review` route still refuses. Its review file exists only on the user's machine and cannot be collected.

2. **`control_review` never refuses a review because a run is in flight.** After `control_review_story`, run the settledness test.
   - **In flight**: grep the round files' marker lines on origin's tip (Finding 2) for the event's review id.
     - If one records it, reply `@<login>: your review is part of round <n>, which is <state> on \`<branch>\`.`
     - Otherwise reply `@<login>: your review was collected. \`<branch>\` is <state>; when that run finishes, the next user-review round starts by itself from every review requesting changes and every inline comment left since the previous round, yours included. Nothing needs to be submitted again.` Append the state's way on, where it has one: `parked` names `@sdlc-harness answer <n>`, `park_loop` names `@sdlc-harness clear`, a non-usage `paused` (stopped, killed or expired included) names `@sdlc-harness resume`, and a `usage` pause says it resumes by itself after the reset.
     - Both replies go through `control_reply "$EXIT_OK" …`, never `control_refuse`, and nothing is pushed or dispatched.
   - **Settled**: build the round with Finding 2's collector.
     - If no review requesting changes is pending (every one, the event's included, is already recorded), reply that the review is part of round `<n>` and exit 0.
     - Otherwise run the `review` child with `--allow-no-run --reviewers <logins> --source <pull request URL>`. Keep today's 0/3/4 mappings.
     - Exit 2 from `review` now means the branch became unsettled between the two reads. Answer it with the in-flight "collected" reply rather than a refusal.
     - Delete the `*" is running on GitHub"*` special case and every "submit your review again" way on in this function. A placement failure keeps its reply, and its way on becomes "The reviews stay on the pull request and are collected by the next round; submit any review requesting changes to retry now."

3. **`review` holds the line until its dispatch is visible.** After `verb_dispatch`, wait until a `harness run <branch>` run whose `headSha` equals the commit just pushed is listed. Reuse `trigger_run_url`'s bounded loop (`TRIGGER_RUN_LOOKUP_TRIES` tries, `HARNESS_TRIGGER_LOOKUP_SECS` apart), factored so `review` can call it with the pushed SHA. On timeout, print one `::warning::` line and keep exit 0. Without this wait, the next serialized job can read the branch as settled before GitHub lists the new run, and place a second round whose dispatch cancels the first one's pending run in `harness-run.yml`'s concurrency group.

4. **Serialize review jobs per branch, never comment jobs.** In `harness-control.yml`'s `control` job, add:

   ```yaml
       concurrency:
         group: ${{ github.event_name == 'pull_request_review' && format('harness-review-{0}', github.event.pull_request.head.ref) || format('harness-control-{0}', github.run_id) }}
         cancel-in-progress: false
   ```

   Keep the space after every `${{`, as the header's rule requires. Replace the `# NO CONCURRENCY GROUP.` paragraph with the argument for this group:
   - a comment job gets a group of its own, so a command is never dropped;
   - review jobs on one head branch run one at a time, so two simultaneous reviews give one round, not two racing pushes;
   - a pending review job replaced by a newer one loses nothing, because every job in the group collects cumulatively (Finding 2) and the round's comment names every reviewer it took;
   - the group name `harness-review-<branch>` is shared with `harness-run.yml`'s `collect` job (Finding 3), and both headers declare it as a mirror.

5. **The `stopped` lifecycle text.** In `forge_report`, change "A review that requests changes starts a round only once a run of the branch has completed or failed." to "A review that requests changes is collected now, and its round starts once the resumed run finishes."

6. **Header.** Update the exit map's `review` refusal clause, the `review` paragraph (the settledness test replaces "by `remote_state`, is anything but `completed` or `failed`", and the post-dispatch wait), and the `control` paragraph's `review` outcome mapping. The module's header must state what the code now does.

**Tests.**

- In `cli/test/remote-control-review.test.mjs`, turn `a review while the newest run is in progress is refused naming the round in flight; origin unchanged` into the accepted case. It asserts exit 0, one reply containing `was collected`, no `workflow run` dispatch, and origin's tip unchanged.
- Add a case where the event's review id is already recorded in a round while the branch is in flight. It replies `part of round`.
- Add a case where the newest run is `in_progress`, its `run` job is `completed`, and its bundle says `completed`, so the round is placed. The stub needs the `actions/runs/<id>/jobs` answer.
- Add a case where the post-dispatch lookup finds the run by `headSha`.
- In `cli/test/workflow-templates.test.mjs`, rewrite `control references no secret and declares no concurrency group`. It asserts that there is still no secret, and that the `concurrency` group is `harness-review-` plus the head ref for a review and per-run for a comment, with `cancel-in-progress: false`. Update that file's header sentence ("no `concurrency:` key") to match.
