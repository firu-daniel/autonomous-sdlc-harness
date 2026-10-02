### 1. Three files say a pull request's head never shapes the control job, but a review event runs the workflow file from the pull request's merge commit

**Severity:** Must Fix

**Sites:**
- `cli/templates/github/workflows/harness-control.yml`, the header paragraph `# FORK PULL REQUESTS.`, the sentences `A fork's review is skipped` / `by the prefilter: its token is read-only, so the job could not even reply.` and `so` / `nothing from a pull request's head is ever run here.`
- `docs/github-run-control.md` → `## 6. Who can act, and pull requests from forks`, the bullet "A review on a fork's pull request never runs: the workflow's `if:` skips it, and its token would be read-only anyway (C2)." and the paragraph opening "**Nothing from a pull request's head runs.**"
- `docs/remote-execution.md` → `## 11. Security`, the paragraph opening "**On a self-hosted runner** the code persists on your disk", the clause "The harness's own workflows cannot be started that way — they trigger only on … and, for `harness-control.yml`, `issue_comment` and `pull_request_review`, none of them a `pull_request` event —". Also the next paragraph, opening "**Pull requests from forks.**", the sentences "A fork's review never runs `harness-control.yml`: the workflow's `if:` skips it." and "and no step checks out or runs a pull request's head".

**Problem.** `harness-control.yml` listens to `pull_request_review`. The research this branch cites says how GitHub runs that event. `docs/github-integration-research.md` → C2 records: *"For a fork's PR, `pull_request_review` and `pull_request_review_comment` behave like `pull_request`: they run the workflow from the PR's merge commit"*. It also quotes GitHub: *"The `pull_request` event (along with `pull_request_review` and `pull_request_review_comment`) is unusual: it runs the workflow file from the **merge commit of the pull request**."* The Gate 12 measurement under the same C2 entry logged `ref=refs/pull/2/merge` for every review event.

So for a review event, the `harness-control.yml` that GitHub evaluates is the pull request's merge-commit copy. That covers its `if:`, its `runs-on:` and its steps, so a pull request's head can change all three. The three sites say otherwise:

- The `if:` filter that "skips a fork's review" is the fork's own copy. A fork that edits it is not skipped. The token stays read-only and no secret is passed, which is what C2 guarantees. The job still runs, though, and it runs on whatever `runs-on:` the fork wrote.
- `docs/remote-execution.md` → `## 11.` tells an adopter with a persistent self-hosted runner on a public repository that *"The harness's own workflows cannot be started that way"* and lists `pull_request_review` among the safe triggers. That is false for `pull_request_review`. A fork can change `runs-on:` in its copy of `harness-control.yml` to the adopter's runner label. Any GitHub user can then submit a *Comment* review on the fork's pull request, which raises the event, and the fork's job runs on that runner. Fork approval policies still apply (C2).
- "Nothing from a pull request's head runs" is true of `remote-run.sh`, because the checkout step pins the default branch. It is not true of the workflow definition. A same-repository head, for example a harness branch whose task edited `.github/workflows/harness-control.yml` under `HARNESS_GIT_TOKEN`, changes what its own review job runs with `contents: write`.

An adopter who reads `## 11.` and decides to keep a persistent self-hosted runner on a public repository has made exactly the wrong decision that section exists to prevent. Acceptance 6 requires the fork rule to be *"stated where an adopter will read it"*, so a wrong statement of that rule leaves the acceptance unmet.

**Fix.** This fix corrects the three statements. Whether to keep `pull_request_review` at all is a separate decision, raised as a question in the review's return and not decided here.

- [ ] `cli/templates/github/workflows/harness-control.yml`, `# FORK PULL REQUESTS.` paragraph. Replace the sentence `A fork's review is skipped by the prefilter: its token is read-only, so the job could not even reply.` with:
  ```
  # A `pull_request_review` job runs this file as the pull request's merge
  # commit carries it (docs/github-integration-research.md, C2), so the `if:`
  # that skips a fork's review is the fork's own copy: a fork that edits it is
  # not skipped, and can name any `runs-on:` label, a self-hosted runner's
  # included. Such a job gets a read-only token and no secret (C2), and fork
  # approval policies apply to it.
  ```
  Replace the closing clause, from `The checkout is always the default branch` to `nothing from a pull request's head is ever run here.`, with:
  ```
  # The checkout is always the default branch, never the pull request's merge
  # commit a `pull_request_review` job checks out by default, so the script that
  # decides is always the default branch's; what a pull request's head can change
  # is this file's own definition for its own review events.
  ```
  Keep every other header line as it is, `#` prefixes and wrapping included.
- [ ] `docs/github-run-control.md` → `## 6.`. Replace the bullet "A review on a fork's pull request never runs: the workflow's `if:` skips it, and its token would be read-only anyway (C2)." with: "A review on a fork's pull request runs `harness-control.yml` as the fork's merge commit carries it (C2). The shipped `if:` skips it, but a fork can edit that copy. Such a job gets a read-only token and no secret, so it can reply to nothing and dispatch nothing, but it does run, on any runner label the fork names ([`remote-execution.md`](remote-execution.md) → `## 11. Security`)." Replace the paragraph "**Nothing from a pull request's head runs.** …" with: "**The scripts are always the default branch's.** The control job checks out the default branch and runs that branch's `remote-run.sh`, never the pull request's. For a review event, though, the workflow file itself is the pull request's merge-commit copy (C2), so a head that edits `harness-control.yml` changes what its own review job runs. A round's fixes run later, in `harness-run.yml`, on the run's own branch, as every round does."
- [ ] `docs/remote-execution.md` → `## 11. Security`, the **On a self-hosted runner** paragraph. Replace the clause from "The harness's own workflows cannot be started that way" through "none of them a `pull_request` event — but any workflow can target the label." with: "`harness-control.yml` can be started that way: it listens to `pull_request_review`, which runs the workflow file as the pull request's merge commit has it, so a fork can rewrite its `runs-on:` ([`github-integration-research.md`](github-integration-research.md) → C2). The other harness workflows cannot: they trigger only on `workflow_dispatch`, which needs write access, `schedule`, and, for `harness-trigger.yml`, a labelled issue and `repository_dispatch`. Any workflow a fork adds can target the label too." Leave the rest of the paragraph, "What prevents it: …" onward, unchanged. In the **Pull requests from forks.** paragraph, replace "A fork's review never runs `harness-control.yml`: the workflow's `if:` skips it." with "The shipped `if:` of `harness-control.yml` skips a fork's review, but a fork's review runs the fork's copy of that file, so the `if:` is a saving rather than a guard; such a job has a read-only token and no secret." Replace "and no step checks out or runs a pull request's head" with "and no step checks out or runs a pull request's head, though a review event's workflow definition is the pull request's own".
- [ ] No test file is named here. If `cli/test/workflow-templates.test.mjs` asserts the header text replaced above, update that assertion and run that one file from `cli/` with `npm test -- test/workflow-templates.test.mjs`.

**Deviations from plan:** The `cli` dispatch landed only the `harness-control.yml` sub-step; the `docs/github-run-control.md` and `docs/remote-execution.md` sub-steps sit outside the `cli` path scope and were not edited. `cli/test/workflow-templates.test.mjs` asserts no header text, so it was not edited and not run (deferred to the Run gates phase). The `general` dispatch then landed the `docs/github-run-control.md` and `docs/remote-execution.md` sub-steps as worded.
