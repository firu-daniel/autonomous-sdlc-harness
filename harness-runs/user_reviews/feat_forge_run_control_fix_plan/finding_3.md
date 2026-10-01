### 3. Reviews collected during a run never start the next round on their own

**File:** `cli/templates/github/workflows/harness-run.yml` (the `run` job's last steps) — "- name: Continue, wait or stop"

Also touched by this finding: `cli/templates/scripts/remote-run.sh`, which gets a new verb `collect` (its usage line, its header paragraph, the exit map, and the dispatch in the main `case`); `harness-run.yml`'s header; `cli/test/workflow-templates.test.mjs`; and a new suite, `cli/test/remote-collect.test.mjs`.

**Problem.** Nothing runs when a run finishes, apart from `deliver` (one `completed` comment, and a draft pull request when none exists) and `continue` (a chained re-dispatch, the poller, or nothing). Once Finding 1 accepts reviews during a run, something must start the next round from them when that run ends. Otherwise every collected review waits for someone to resubmit. The user's bound is that a reviewer waits at most for the run in flight.

**Is `concurrency: queue: max` usable instead?** Observation 3 cites a report that GitHub Actions added `concurrency: { queue: max }` on 2026-05-07, keeping up to 100 pending runs in order. This writer could not check that against GitHub's documentation, because no web retrieval was available in this session. The user asked for exactly that check before relying on it. So this fix uses the alternative the user named, a collection at the end of the run, and **nothing in it rests on `queue: max`**. `docs/github-run-control.md` §8 records the claim as unverified (Finding 4). Do not add a `queue:` key to any workflow on this branch.

**Fix.**

1. **A new verb, `remote-run.sh collect <branch> [--pr <n>] [--repo <root>]`.** It is job-side for its root and self-gated, like `report` and `deliver`: one line and exit 0 unless `forge_on`. It never fails its caller. Every outcome is one line and exit 0, except a usage error (1). In order:
   1. If `HARNESS_REMOTE_STOP` is set, print a line, start nothing, exit 0.
   2. If `remote_branch_stopped "$branch"` reports the branch stopped, print a line and exit 0. If the check fails, print a line and exit 0.
   3. Take the pull request from `--pr`, or from `forge_pr_var "$branch"`. With none, print "no open pull request; nothing to collect" and exit 0.
   4. Run Finding 1's settledness test. If the branch is in flight, for example because a newer run is listed or this run ended `parked` or on a budget chain, print a line naming the state and exit 0. That run's own end collects next time.
   5. Run Finding 2's collector. With no pending review requesting changes, print a line and exit 0. Inline comments alone start no round, as *Comment* starts none today; they ride along in the next round.
   6. Otherwise run `review <branch> --review-file <file> --allow-no-run --reviewers <logins> --source <pull request URL>` as a child. `review` places, pushes, dispatches `engine: user_review`, waits for the listing (Finding 1, item 3) and posts the `round` lifecycle comment.
   7. On a non-zero child exit, post exactly **one** comment on the pull request, through `forge_comment` with the `reply` marker. It reads "The reviews requesting changes collected during the run on `<branch>` could not start the next round: <last line>. They stay on the pull request; submit a review requesting changes to retry." Then exit 0. This is the ledger's "bounded retry, one notification" rule: there is no automatic retry.

   Add its usage line, its paragraph in the header (beside `report` and `deliver`), and its exit-map note ("always 0, 1 only on a usage error").

2. **A `collect` job in `harness-run.yml`**, after `run`:

   ```yaml
     collect:
       needs: run
       if: ${{ inputs.action == 'run' && !cancelled() }}
       runs-on: ${{ vars.HARNESS_RUNNER || 'ubuntu-latest' }}
       concurrency:
         group: harness-review-${{ inputs.branch }}
         cancel-in-progress: false
       env:
         GH_TOKEN: ${{ github.token }}
         HARNESS_REMOTE_SLUG: ${{ github.repository }}
         HARNESS_INPUT_BRANCH: ${{ inputs.branch }}
         HARNESS_REMOTE_STOP: ${{ vars.HARNESS_REMOTE_STOP }}
         HARNESS_TRIGGER_ALLOWED_BOTS: ${{ vars.HARNESS_TRIGGER_ALLOWED_BOTS }}
       steps:
         # check out the run's branch (fetch-depth 0), check for jq and gh,
         # read SCRIPTS_DIR from harness.config.json, set the git identity —
         # the same steps the `run` job takes, then:
         - name: Start the next round from collected reviews
           run: bash "$SCRIPTS_DIR/remote-run.sh" collect "$HARNESS_INPUT_BRANCH"
   ```

   It is a separate job, not a step of `run`, for two reasons. A step cannot hold a concurrency group, and this job must share `harness-review-<branch>` with `harness-control.yml`'s review jobs (Finding 1, item 4), so the collector and a review job never place a round at the same moment. Second, the settledness test reads "the `run` job is `completed`", which a step inside that job could never see. With `!cancelled()`, a failed `run` job still reaches `collect`, and the bundle decides whether the run ended (`completed` or `failed`) or only paused or parked. A cancelled or stopped run skips it.

   Add a header paragraph, `THE COLLECT JOB`, saying:
   - why it exists;
   - that its group name is a declared mirror of `harness-control.yml`'s;
   - that `RUN_JOB_NAME` in `remote-run.sh` mirrors the `run` job's key;
   - that it reads no secret.

3. **What this guarantees, and the residual.**
   - A review that `control` answered "collected" was submitted while the `run` job was still running, so it already exists when `collect` lists the reviews.
   - A review submitted after the `run` job completed reaches a `control` job that reads the branch as settled and places the round itself, serialized against `collect` by the shared group.
   - The residual depends on unverified GitHub behaviour: an artifact is listable before its run completes, and one concurrency group spans two workflows. Finding 4 records both as §8 rows.

**Tests.**

- **The new suite `cli/test/remote-collect.test.mjs`.** It reuses `remote-control-review.test.mjs`'s fixture and `gh` stub shape, extended for `actions/runs/<id>/jobs` and the reviews listing. Its header states the rule it enforces. Cases:
  - settled, with one pending review: one round commit and one `engine=user_review` dispatch;
  - settled, with nothing pending: nothing pushed and no dispatch;
  - a newer run listed: nothing;
  - a stop marker newer than the run: nothing;
  - `HARNESS_REMOTE_STOP` set: nothing;
  - no open pull request: nothing;
  - `review` failing placement: exactly one pull-request comment and exit 0.
- **`cli/test/workflow-templates.test.mjs`.** Add a case asserting that `harness-run.yml` carries the `collect` job with `needs: run`, `!cancelled()` in its `if:`, the group `harness-review-${{ inputs.branch }}` with `cancel-in-progress: false`, no `secrets.` reference, and a step that runs `remote-run.sh" collect`.
