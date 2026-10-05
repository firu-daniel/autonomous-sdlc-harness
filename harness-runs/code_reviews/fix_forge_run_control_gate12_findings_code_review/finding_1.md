### 1. Deleting a run's branch while its pull request is open also fires a `pull_request: closed` job, which stops through the deleted ref and fails

**File:** `cli/templates/scripts/remote-run.sh` (`control_close`) — `pr_closed) what="closed pull request #$CONTROL_NUMBER"; stop_flags=(--pr "$CONTROL_NUMBER") ;;`

**The problem.** GitHub closes an open pull request when its head branch is deleted. So deleting the branch of a run that has an open pull request (every user-review round, and any run whose pull request a person opened by hand) raises **two** events at once, and `harness-control.yml` now listens to both: `delete` and `pull_request: closed`. Each gets its own `harness-control-<run_id>` concurrency group, so the two `control` jobs run in parallel.

- The `delete` job takes `CLOSE_KIND=deleted` and runs `stop <b> --branch-gone`. `verb_stop` sends the marker with `--ref` set to GitHub's default branch. This is the designed path.
- The `pull_request` job takes `CLOSE_KIND=pr_closed`, with `CLOSE_REF` the head ref, and runs `stop <b> --pr <n>` **without** `--branch-gone`. `verb_stop` keeps `marker_ref="$branch"`, so it runs `gh workflow run harness-run.yml --ref <deleted branch> -f action=stop …`. That fails because the ref no longer exists, and `gh_fail "stop marker for '$branch' failed, nothing cancelled"` exits 3. `control_close` then prints `::error::… the stop of \`<b>\` … failed` and exits `EXIT_GH`. The `harness-control` run goes red and GitHub sends a workflow-failure e-mail. That is the outcome item 2 of this branch exists to remove. If the `pull_request` job reads the state before the `delete` job's marker lands, it also races the `delete` job's cancel loop.

The same thing happens on a merge that the repository's *Automatically delete head branches* setting follows, whenever the branch is already gone by the time the `pull_request` job reaches `verb_stop`.

Nothing covers this case. `cli/test/remote-control-close.test.mjs` closes a pull request only while `feat_x` still exists on the fixture's `origin`. `docs/github-run-control.md` → `## 5. Lifecycle comments and state labels`, *Closed or deleted*, says a deletion is handled through the default-branch marker and does not mention the pull-request close that comes with it.

**Fix.** The `delete` event's job owns a deleted branch. A `pull_request` close whose head branch is already absent on `origin` is therefore ignored, with one line, like every other quiet case in `control_close`.

- [ ] In `control_close`, after `CONTROL_BRANCH="$b"` is set and before `control_state_var "$b"` is called, add:

```bash
  if [ "$CLOSE_KIND" = pr_closed ] || [ "$CLOSE_KIND" = pr_merged ]; then
    # GitHub closes a pull request whose head is deleted; the `delete` event's
    # own job stops that run from the default branch, so this one stays quiet.
    remote_branch_exists "$b"
    case $? in
      1) control_close_ignore "the branch \`$b\` of pull request #$CONTROL_NUMBER is gone from origin; the deletion's own job stops the run" ;;
      2) echo "remote-run.sh: control: whether \`$b\` exists on origin could not be checked ($REMOTE_BRANCH_ERR); proceeding" ;;
    esac
  fi
```

- [ ] In the header's `THE CLOSE.` paragraph, add a gate between gate 5 (`hr_branch_is_protected`) and the sentence `There is no ledger-at-tip check`: `6. on \`pull_request\`, the head branch absent on origin (\`remote_branch_exists\` answers 1): GitHub closed the pull request because the branch was deleted, and the \`delete\` event's job stops the run; an \`ls-remote\` that cannot answer is one line and proceeds`.
- [ ] In `docs/github-run-control.md` → `## 5. Lifecycle comments and state labels`, at the end of the *Closed or deleted* paragraph, add: `Deleting a branch whose pull request is open closes that pull request as well; that close is one line in its job's log, and the deletion's job does the stop.`
- [ ] In `docs/github-run-control.md` → `## 8. What is not verified here`, add a row in the table's existing column order: claim `Deleting a pull request's head branch closes the pull request and raises a \`pull_request\` \`closed\` event`; what rests on it `The quiet close of a pull request whose branch is gone ([§5](#5-lifecycle-comments-and-state-labels), *Closed or deleted*)`; source `GitHub's documented behaviour, not retrieved in [\`github-integration-research.md\`](github-integration-research.md)`; if it is false `No second job runs, and the deletion's job alone stops the run`.
- [ ] In `cli/test/remote-control-close.test.mjs`, add a case: build `closeFixture`, delete `feat_x` on its `origin` (`runGit(dir, ['push', '--quiet', '--no-verify', 'origin', '--delete', 'feat_x'])`), run `f.control('pull_request', prClosed())`, and assert with the file's existing `assertIgnored` helper against `/the branch `feat_x` of pull request #9 is gone from origin/`, which means no `workflow run`, no `run cancel`, no comment and no label write. Run that one file: `npm test -- test/remote-control-close.test.mjs` from `cli/`.
