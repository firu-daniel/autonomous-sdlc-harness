### 1. Closing a run's pull request that has a merge conflict starts no `pull_request` job, so it stops nothing, but §5 says every close stops the run

> **Self-contained per-finding file** for the `fix_forge_run_control_gate12_findings` skeptic-review index (`harness-runs/skeptic_reviews/fix_forge_run_control_gate12_findings_skeptic_review.md`). The implementer reads only this file. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**Files:**
- `docs/github-run-control.md` → `## 5. Lifecycle comments and state labels`, the **Closed or deleted.** paragraph — "Deleting a branch whose pull request is open closes that pull request as well"
- `docs/github-run-control.md` → `## 8. What is not verified here`, the row "Deleting a pull request's head branch closes the pull request and raises a `pull_request` `closed` event"
- `cli/templates/github/workflows/harness-control.yml` (header, `# THE EVENTS.` block) — "#   pull_request, type `closed` only: a run's pull request was closed or"

**The problem.** This branch makes a closed pull request stop its run by listening to `pull_request: [closed]` in `harness-control.yml`. That listener is the only path. `control_close` in `cli/templates/scripts/remote-run.sh` acts only when GitHub starts the job. Nothing else, including the poller, the `continue` step or `report`, reacts to a pull request's state.

GitHub documents a limit on this event. *Events that trigger workflows* → `pull_request` says: "Workflows will not run on `pull_request` activity if the pull request has a merge conflict. The merge conflict must be resolved first." `pull_request_target` is the one event that runs regardless, and this repository rightly never uses it (§6). So the following is reachable:

- A run's branch is long-lived. Every user-review round adds commits to it, and so does any run whose pull request was opened by hand.
- Meanwhile the default branch moves on, and the pull request develops a conflict.
- A maintainer then closes the pull request unmerged to abandon the work.
- No `harness control` job starts. The run keeps running or stays parked or paused, keeps billing minutes and the credential, and keeps posting lifecycle comments on the closed item. That is the outcome item 5 of this branch exists to remove.
- The comments now go to the issue: `forge_pr_var` finds no open pull request.

A merge cannot happen with a conflict, so only the *closed unmerged* case is affected.

The documents say every close stops the run. `docs/github-run-control.md` → `## 5.` → **Closed or deleted.** opens: *"Closing the run's issue, closing or merging a pull request from its branch, or deleting the branch stops an unfinished run"*. `## 4.` repeats it: *"Closing the issue, closing or merging the pull request, or deleting the branch stops an unfinished run"*. The workflow header's `THE EVENTS` block says *"a run's pull request was closed or merged, which stops the run"*.

A maintainer who reads these closes a conflicting pull request, believes the run has stopped, and does not also comment `@sdlc-harness stop`. Commenting on the closed pull request would not work anyway, because `control_branch_from_pr` refuses every command there: *"pull request #<n> is CLOSED, not open"*.

The branch's own rule for unverified GitHub facts applies here: the task prompt's acceptance criteria say *"Every new behaviour that rests on an unverified GitHub fact gets a §8 row"*. The close-stop rests on GitHub starting a `pull_request` job for the close. §8 carries no row for that, and no row for its documented exception. No earlier review raised this. The code review's Finding 1 concerns the deletion-driven close, which does start a job.

**Fix.** Record the limit where a reader relies on the close-stop, and name the way on. Change nothing in the code. A job that GitHub never starts cannot be fixed from this repository without `pull_request_target`, which §6 rules out.

- [ ] In `docs/github-run-control.md` → `## 5. Lifecycle comments and state labels`, at the end of the **Closed or deleted.** paragraph (after *"…and the deletion's job does the stop."*), add:

  `GitHub starts no workflow for activity on a pull request that has a merge conflict, so closing a conflicting pull request stops nothing; stop that run with \`@sdlc-harness stop\` on its issue, or reopen the pull request and comment it there, or close the issue.`

- [ ] In `docs/github-run-control.md` → `## 8. What is not verified here`, add one row directly after the row whose first cell is *"Deleting a pull request's head branch closes the pull request and raises a `pull_request` `closed` event"*. Keep the table's column order (Behaviour | What rests on it | Source | If it is wrong):

  `| A pull request with a merge conflict starts no \`pull_request\` workflow, its \`closed\` activity included | The statement that closing a conflicting pull request stops nothing ([§5](#5-lifecycle-comments-and-state-labels), *Closed or deleted*) | GitHub's documented behaviour (*Events that trigger workflows* → \`pull_request\`: "Workflows will not run on \`pull_request\` activity if the pull request has a merge conflict"), not retrieved in [\`github-integration-research.md\`](github-integration-research.md) | Closing a conflicting pull request stops the run like any other close, and the advice to stop it another way is merely unneeded |`

- [ ] In `cli/templates/github/workflows/harness-control.yml`, header `# THE EVENTS.` block, replace the two lines

  ```
  #   pull_request, type `closed` only: a run's pull request was closed or
  #     merged, which stops the run.
  ```

  with

  ```
  #   pull_request, type `closed` only: a run's pull request was closed or
  #     merged, which stops the run. GitHub starts no workflow for activity on
  #     a pull request with a merge conflict, so closing a conflicting one
  #     stops nothing (docs/github-run-control.md, section 8).
  ```

  This file has no test that pins this header text byte for byte, so no test file changes and none is run for this fix. The full suite runs later, in the Run gates phase.
