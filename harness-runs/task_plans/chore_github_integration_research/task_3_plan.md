### Task 3 — Write the control entries C1–C4

**Goal:** Append `## 3. Control — feat_forge_run_control` to `docs/github-integration-research.md`, holding the entries C1–C4 in the story index's entry shape, carrying exactly the verdicts, answers, evidence and consequences below.

**Depends on:** Task 2, which appends `## 2. Triggers — feat_forge_run_triggers` with T3 (the collaborator-permission endpoint) and T4 (claude-code-action's checks). This task appends after section 2, cites T3, T4, S3 and S4 by ID where the entries below name them, and edits nothing earlier tasks wrote.

**How this task's implementer reads the conventions.** Catch-all layer: `.claude/context/conventions.md` → `## Documents of record` and the self-containment gate under `## The testing bar`.

### Targets

- `docs/github-integration-research.md` — append section 3.

**Work:**

- [ ] Append `## 3. Control — feat_forge_run_control` after section 2 and write C1 and C2 from the finding blocks below.
- [ ] Write C3 and C4.
- [ ] Re-read every quote and excerpt against this task file character for character; grep the file for `/Users/`, `/private/`, `/tmp/` and `scratchpad`.

### Finding blocks

#### C1. `pull_request_review` (`submitted`), `pull_request_review_comment` and `issue_comment` on a PR: which review states exist in the payload, and how to fetch every inline comment of one review with its file and line.

**Verdict:** `verified`

**Answer:** `pull_request_review` has the types `submitted`, `edited` and `dismissed`; `pull_request_review_comment` has `created`, `edited` and `deleted`; a comment in a PR's conversation arrives as `issue_comment`, told apart by `github.event.issue.pull_request`. Measured on `submitted`, `github.event.review.state` is lowercase: `commented`, `changes_requested` and `approved`. The REST API reports the same reviews in uppercase (`COMMENTED`, `CHANGES_REQUESTED`, `APPROVED`). The published webhook schema enumerates the state only for `dismissed` (`dismissed`, `approved`, `changes_requested`), so compare case-insensitively. Submitting a review with one inline comment raised both a `pull_request_review` and a `pull_request_review_comment` event. To fetch one review's inline comments with file **and line**, list the PR's review comments with `GET /repos/{owner}/{repo}/pulls/{pull_number}/comments` and keep those whose `pull_request_review_id` is the review's ID: measured, that endpoint returns `path`, `line`, `original_line` and `side`. The per-review endpoint `GET …/pulls/{pull_number}/reviews/{review_id}/comments` returns the "legacy" shape, with `path` and `position` but no `line`, `side` or `original_line` fields at all — although its documentation lists them.

**Evidence:**
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request_review — retrieved 2026-09-30 — `pull_request_review`: activity types `submitted`, `edited`, `dismissed`; "Running a workflow when a pull request is approved": "To run your workflow when a pull request has been approved, you can trigger your workflow with the `submitted` type of `pull_request_review` event, then check the review state with the `github.event.review.state` property." Example: `if: github.event.review.state == 'approved'`. Same page, `pull_request_review_comment`: activity types `created`, `edited`, `deleted`; "A pull request review comment is a comment on a pull request's diff." `issue_comment`: "The `issue_comment` event occurs for comments on both issues and pull requests. You can use the `github.event.issue.pull_request` property in a conditional to take different action depending on whether the triggering object was an issue or pull request."
- Webhook payload schema, https://docs.github.com/en/webhooks/webhook-events-and-payloads#pull_request_review — retrieved 2026-09-30 (payload JSON at `https://docs.github.com/api/webhooks/v1?category=pull_request_review&version=free-pro-team@latest`): for `dismissed`, `review.state` has the enum `["dismissed", "approved", "changes_requested"]`; for `submitted` and `edited`, `review.state` is a plain string with no enum.
- https://docs.github.com/en/graphql/reference/pulls#pullrequestreviewstate — retrieved 2026-09-30 — "PullRequestReviewState - enum": "`APPROVED`: A review allowing the pull request to merge." / "`CHANGES_REQUESTED`: A review blocking the pull request from merging." / "`COMMENTED`: An informational review." / "`DISMISSED`: A review that has been dismissed." / "`PENDING`: A review that has not yet been submitted."
- https://docs.github.com/en/rest/pulls/reviews#list-comments-for-a-pull-request-review — retrieved 2026-09-30 — "List comments for a pull request review": "Lists comments for a specific pull request review." Its response schema, "Array of `Legacy Review Comment`", lists `path`, `position`, `original_position`, `line`, `original_line`, `start_line`, `side` among others. Fine-grained permission: "Pull requests" read.
- Measurement, Gate 12, 2026-09-30 10:15 UTC, maintainer's `gh` on draft PR #2 (opened by `app/github-actions`, C3), `POST repos/firu-daniel/harness-gate12/pulls/2/reviews`:
  - `event` `COMMENT` with one inline comment (`path` `probe-c3.txt`, `line` 1, `side` `RIGHT`) → `{"id":5364824510,"state":"COMMENTED"}`;
  - `event` `REQUEST_CHANGES` → `{"id":5364824824,"state":"CHANGES_REQUESTED"}`;
  - `event` `APPROVE` → `{"id":5364824960,"state":"APPROVED"}`.
- Measurement, same time, `probe-listen.yml` runs, as logged:
  ```
  event=pull_request_review action=submitted actor=firu-daniel triggering_actor=firu-daniel sender=firu-daniel sender_type=User label= review_state=commented ref=refs/pull/2/merge secret_present=true
  event=pull_request_review_comment action=created actor=firu-daniel triggering_actor=firu-daniel sender=firu-daniel sender_type=User label= review_state= ref=refs/pull/2/merge secret_present=true
  event=pull_request_review action=submitted actor=firu-daniel triggering_actor=firu-daniel sender=firu-daniel sender_type=User label= review_state=changes_requested ref=refs/pull/2/merge secret_present=true
  event=pull_request_review action=submitted actor=firu-daniel triggering_actor=firu-daniel sender=firu-daniel sender_type=User label= review_state=approved ref=refs/pull/2/merge secret_present=true
  ```
- Measurement, same time: `gh api repos/firu-daniel/harness-gate12/pulls/2/reviews/5364824510/comments` → `{"body":"probe inline 1","line":null,"original_line":null,"path":"probe-c3.txt","position":1,"pull_request_review_id":5364824510,"side":null,"start_line":null}`, and the keys of that object were `_links, author_association, body, commit_id, created_at, diff_hunk, html_url, id, node_id, original_commit_id, original_position, path, position, pull_request_review_id, pull_request_url, reactions, updated_at, url, user` — no `line`, `original_line`, `side` or `start_line`. `gh api repos/firu-daniel/harness-gate12/pulls/2/comments` → `{"body":"probe inline 1","id":4143465032,"line":1,"original_line":1,"path":"probe-c3.txt","position":1,"pull_request_review_id":5364824510,"side":"RIGHT","start_line":null}`.

**Consequence:**
- `feat_forge_run_control`: "changes requested triggers" is testable as `github.event.review.state == 'changes_requested'` on `submitted`; "approve and a plain comment do not" are `approved` and `commented`. One submitted review with inline comments raises one `pull_request_review` event plus one `pull_request_review_comment` event per inline comment, so the round must be built on the review event only, or the round-per-review rule breaks. The round file's file-and-line list comes from `pulls/{n}/comments` filtered on the review's ID, not from the per-review endpoint.

#### C2. What `pull_request_review`, `pull_request_review_comment` and `issue_comment` get on a PR whose head is a fork. What `pull_request_target` changes, and GitHub's guidance on it.

**Verdict:** `verified`

**Answer:** For a fork's PR, `pull_request_review` and `pull_request_review_comment` behave like `pull_request`: they run the workflow from the PR's merge commit, get no secret other than `GITHUB_TOKEN`, and that token is read-only (a private repository's admin can opt in to sending write tokens or secrets). `issue_comment` runs the default branch's workflow with the repository's secrets, whoever comments, fork PR or not. `pull_request_target` runs the default branch's workflow with a read/write token and secrets, even from a public fork; GitHub calls running a fork's code there a "pwn request", and says any event that runs with secrets — `issue_comment` named — is exposed the same way if it fetches and runs fork code. GitHub also now applies a default policy blocking `pull_request_target` in public repositories, in evaluate mode, enforced on 2026-11-02 for affected repositories.

**Evidence:**
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request_review — retrieved 2026-09-30 — "Workflows in forked repositories": "With the exception of `GITHUB_TOKEN`, secrets are not passed to the runner when a workflow is triggered from a forked repository. The `GITHUB_TOKEN` has read-only permissions in pull requests from forked repositories." / "Pull request events for forked repositories": "For pull requests from a forked repository to the base repository, GitHub sends the `pull_request`, `issue_comment`, `pull_request_review_comment`, `pull_request_review`, and `pull_request_target` events to the base repository. No pull request events occur on the forked repository." `issue_comment` table: `GITHUB_SHA` "Last commit on default branch", `GITHUB_REF` "Default branch".
- https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target#risks-of-pull_request_target — retrieved 2026-09-30 — "Risks of `pull_request_target`": "The `pull_request` event (along with `pull_request_review` and `pull_request_review_comment`) is unusual: it runs the workflow file from the **merge commit of the pull request**. For a pull request opened from a fork, that commit is controlled by someone without write access to the base repository. To run untrusted workflow code safely, GitHub restricts these events to a read-only `GITHUB_TOKEN`, withholds access to other secrets, and applies fork approval policies to prevent compute abuse." / "This pattern is known as a "pwn request" and has been the root cause of multiple supply-chain compromises." / "Pwn requests are also not unique to `pull_request_target`. Any event that runs with secrets can introduce a pwn request if it checks out or downloads and executes untrusted code. For example, an `issue_comment` or `workflow_run` workflow that fetches and runs a fork's pull request code is vulnerable in the same way." "How the default policy works": "For public repositories that do not already have an applicable Actions event policy, GitHub adds a default policy that blocks workflows triggered by `pull_request_target`." / "On November 2, 2026, GitHub will enforce the default policy for affected repositories that were using the default `pull_request_target` policy before general availability."
- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions — retrieved 2026-09-30: "When a workflow is triggered by the `pull_request_target` event, the `GITHUB_TOKEN` is granted read/write repository permission, even when it is triggered from a public fork." "Changing the permissions in a forked repository": "You can use the `permissions` key to add and remove read permissions for forked repositories, but typically you can't grant write access. The exception to this behavior is where an admin user has selected the **Send write tokens to workflows from pull requests** option in the GitHub Actions settings."
- https://docs.github.com/en/actions/reference/security/secure-use — retrieved 2026-09-30: "Avoid using the `pull_request_target` workflow trigger if it's not necessary. For privilege separation between workflows, `workflow_run` is a better trigger. Only use these workflow triggers when the workflow actually needs the privileged context."
- https://securitylab.github.com/resources/github-actions-preventing-pwn-requests/ — retrieved 2026-09-30: "Workflows triggered via pull_request_target have write permission to the target repository. They also have access to target repository secrets. The same is true for workflows triggered on pull_request from a branch in the same repository, but not from external forks."
- Measurement (same-repository head only), Gate 12, 2026-09-30 10:15 UTC: every `pull_request_review` and `pull_request_review_comment` run on PR #2, whose head is a branch of the same repository, logged `secret_present=true` and `ref=refs/pull/2/merge` (C1's log). No fork PR was measured.

**Consequence:**
- `feat_forge_run_control`: its rule stands on documentation — a harness-created PR's review events carry secrets because its head is in the same repository; a fork's review events carry none, so a review-triggered round on a fork PR fails closed anyway, but `issue_comment` on a fork's PR runs with secrets and must itself refuse on the head repository (`github.event.issue.pull_request` → fetch the PR → compare `head.repo.full_name`). `pull_request_target` is excluded by the prompt already; the 2026-11-02 enforcement makes it unavailable on public repositories regardless.

#### C3. Can a `GITHUB_TOKEN` open a draft PR, and what does it need beyond S4?

**Verdict:** `verified`

**Answer:** Yes. With the S4 setting on, a job whose token has `contents: write` (to push the head branch) and `pull-requests: write` opened a draft PR with `gh pr create --draft`; the PR's author is `app/github-actions` and `isDraft` is true. With the setting off, the same step fails with `GitHub Actions is not permitted to create or approve pull requests`. Nothing else is needed. Drafts are a plan feature: GitHub's table gives private repositories drafts on GitHub Team and Enterprise Cloud, and gives Free and Pro drafts only in public repositories. The measured repository is private on a personal account and its draft PR was created; the account's plan could not be read with the measuring token (`gh api user` returned `"plan":null`), so which rule admitted it is not established. The PR's `pull_request` run waits for approval (S3).

**Evidence:**
- https://docs.github.com/en/rest/pulls/pulls#create-a-pull-request — retrieved 2026-09-30 — "Create a pull request": body parameter "**`draft`** (boolean) Indicates whether the pull request is a draft." / "Draft pull requests are available in public repositories with GitHub Free and GitHub Free for organizations, GitHub Pro, and legacy per-repository billing plans, and in public and private repositories with GitHub Team and GitHub Enterprise Cloud." / "The fine-grained token must have the following permission set: "Pull requests" repository permissions (write)".
- Measurement, Gate 12, 2026-09-30 10:12 UTC, run `36700965200`, setting off: the head branch pushed (` * [new branch]      HEAD -> probe/c3-draft-20260930T101242Z`), then `gh pr create -R "$REPO" --draft --base main --head "probe/c3-draft-20260930T101242Z" …` → `pull request create failed: GraphQL: GitHub Actions is not permitted to create or approve pull requests (createPullRequest)`, `exit=1`.
- Measurement, 2026-09-30 10:13 UTC, maintainer's `gh`: `gh api -X PUT repos/firu-daniel/harness-gate12/actions/permissions/workflow -f default_workflow_permissions=read -F can_approve_pull_request_reviews=true`; a read straight after still returned `"can_approve_pull_request_reviews":false`, and a read about a minute later returned `true`.
- Measurement, Gate 12, 2026-09-30 10:14 UTC, run `36701137549`, setting on: `https://github.com/firu-daniel/harness-gate12/pull/2`, `exit=0`; `gh pr list --json number,isDraft,author,headRefName` → `{"author":{"is_bot":true,"login":"app/github-actions"},"headRefName":"probe/c3-draft-20260930T101403Z","isDraft":true,"number":2}`.
- Not established: the measuring account's plan (`gh api user --jq '{plan, login}'` → `{"login":"firu-daniel","plan":null}`), and so whether a GitHub Free account's private repository refuses a draft PR as the table says.

**Consequence:**
- `feat_forge_run_control`: draft-PR output from a job needs only `pull-requests: write` plus the S4 setting. `doctor` can check the setting from the maintainer's side (S4), and a job that meets it off gets the message above, which the lifecycle comment can quote. A change to the setting may take about a minute to be read back. On a private repository whose owner's plan does not include drafts (per the table above), the draft step may need a fallback to a ready PR; that case was not measured.
- `feat_github_native_adoption`: a setup PR opened by a job has the same two requirements.

#### C4. Prior art for comment commands: the syntax `anthropics/claude-code-action` uses, and any convention that avoids a collision with it.

**Verdict:** `partly true` — each tool's syntax is verified; no general convention for avoiding collisions between comment bots was found.

**Answer:** claude-code-action reacts to `@claude` (its `trigger_phrase`) as a whole word anywhere in a comment, review, or new issue's title or body, matched case-insensitively by `(^|\s)@claude([\s.,!?;:]|$)`; it also offers a label trigger (default `claude`) and an assignee trigger. Prow uses slash commands anchored at the start of a line (`/lgtm`, `/hold`, `/hold cancel`, `/unhold`). `peter-evans/slash-command-dispatch` reads only a comment's first line, needs a leading `/`, turns the command into a `repository_dispatch` of type `<command>-command`, and gates on a `permission` input that defaults to write. GitHub Agentic Workflows (gh-aw) requires its command to be the first word of the comment "to avoid accidental triggers". The facts that matter for a collision: a comment containing `@claude` as a word anywhere triggers claude-code-action, and one that does not, does not.

**Evidence:**
- https://code.claude.com/docs/en/github-actions#interactive-and-automation-modes — retrieved 2026-09-30: "**Interactive mode**: when the workflow provides no `prompt` input, Claude waits for the trigger phrase, `@claude` by default, in an issue or pull request comment, in a pull request review, or in the body or title of a newly opened issue, then responds to that request." Troubleshooting: "Confirm the comment contains `@claude` as a complete word, not `/claude` or `@claude-bot`".
- https://github.com/anthropics/claude-code-action/blob/a8cb0db4d8c2baea0bf33aac6db34a3ce00b4014/src/github/validation/trigger.ts#L54-L57 — retrieved 2026-09-30:
  ```
  const regex = new RegExp(
    `(^|\\s)${escapeRegExp(triggerPhrase)}([\\s.,!?;:]|$)`,
    "i",
  );
  ```
- https://github.com/kubernetes-sigs/prow/blob/7626c76a396f367698b87f0650c8c5df14ae6c4e/pkg/plugins/hold/hold.go#L42-L43 — retrieved 2026-09-30:
  ```
  labelRe       = regexp.MustCompile(`(?mi)^/hold(\s.*)?$`)
  labelCancelRe = regexp.MustCompile(`(?mi)^/(remove-hold|hold\s+cancel|unhold)(\s.*)?$`)
  ```
  and `pkg/plugins/lgtm/lgtm.go#L50-L52`: `` LGTMRe = regexp.MustCompile(`(?mi)^/lgtm(?: no-issue)?\s*$`) ``.
- https://github.com/peter-evans/slash-command-dispatch/blob/23a9840d16de183eb75d8e37f100b96921f952ca/README.md — retrieved 2026-09-30: "The action runs in `issue_comment` event workflows and checks the first line of comments for slash commands." / "Slash commands must be placed in the first line of the comment to be interpreted as a command." / "The command must start with a `/`" / "Setting `write` as the required permission level means that any user with `write`, `maintain` or `admin` permission level will be able to execute commands." / "The `event-type-suffix` input defaults to `-command`."
- https://github.github.com/gh-aw/reference/command-triggers/ — retrieved 2026-09-30 — "Multiple Command Identifiers": "The compiler automatically creates issue/PR triggers (opened, edited, reopened), comment triggers (created, edited), and conditional execution for /command-name mentions. The command must be the first word of the comment or body text to avoid accidental triggers."
- Not established: a published convention for namespacing comment commands across bots (a web search found none).

**Consequence:**
- `feat_forge_run_control`: the facts constrain the syntax without choosing it — a harness command must not contain `@claude` as a word, and a first-line, first-word command is the established way to avoid firing on prose; a leading `/` alone collides with Prow- and slash-command-dispatch-style repositories and resembles a Claude Code slash command, which is what the prompt asks to avoid. The choice stays with that branch.

**Verification:**

- Section 3 follows section 2 and holds C1–C4 in the entry shape, in ID order.
- Every quote, log line and code excerpt matches this task file character for character.
- `grep -nE '/Users/|/private/|/tmp/|scratchpad' docs/github-integration-research.md` prints nothing.
