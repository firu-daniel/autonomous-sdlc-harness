# GitHub integration research

**Who reads this:** the planners and reviewers of `feat_forge_run_triggers`, `feat_forge_run_control` and `feat_github_native_adoption`, and anyone checking a GitHub behaviour the remote path rests on. It owns the answers to those branches' open questions, each with its evidence, as of 2026-09-30. It does not own any design choice: every choice stays with those branches. An answer marked `verified` or `refuted` here is to be cited rather than re-verified; one marked `unverified` stays open.

It cites rather than restates [`remote-execution.md`](remote-execution.md), whose `### Verified in Gate 12 round 2` and `round 3` rows it does not repeat.

---

## How this was researched

**Date.** All research was done on **2026-09-30**, and every source was retrieved that day. docs.github.com pages were read through the docs site's article-body endpoint `https://docs.github.com/api/article/body?pathname=<path>`, which serves the page's rendered text; the URL given with each quote is the page's own. Where a page's "Fine-grained access tokens" box is only in the rendered HTML (REST pages), the HTML page was read. Old docs paths redirect to new ones; the URL given is the current path.

**Three kinds of evidence.**

1. A document fetched live, cited by URL, retrieval date, section heading and a verbatim quote.
2. A measurement run in the planning session.
3. An observation the maintainer made by hand (the prefilled-link check and the Codespaces session), recorded as they reported it and marked as such.

**Measurement environments.**

- **GitHub:** the private repository `firu-daniel/harness-gate12` on a personal account, created 2026-09-29T11:49:02Z, at its seed commit plus a probe commit that added five probe workflows (`probe-listen.yml`, which logs the event, its action, `sender` and whether a repository secret is present; `probe-token.yml`, which runs the `GITHUB_TOKEN` probes; `probe-disable.yml`; `probe-inputs-25.yml`; `probe-inputs-26.yml`). Jobs ran on `ubuntu-latest` (image `ubuntu-24.04`, version `20260828.587`, runner `2.337.0`). The maintainer's side used `gh version 2.100.0 (2026-09-03)` with an OAuth token whose scopes are `admin:public_key, gist, read:org, repo, write:ssh_signing_key` (no `workflow`), and `git version 2.50.1` over SSH.
- **Claude Code:** `2.1.285 (Claude Code)` on macOS (Darwin 24.6.0), in a scratch git repository with one commit.
- **Codespaces:** a codespace on `firu-daniel/harness-gate12`, default configuration (the repository has no `devcontainer.json`), default 2-core machine, 2026-09-30 10:31–10:45 UTC.

**What a verdict grades.** A verdict grades the question's lead where the question carries one (the belief the task prompt or the later prompts state) and otherwise the answer given; where an answer has a verified part and an unverified part, the verdict is `partly true` and the Answer names which part is which.

**Run IDs and object numbers identify the measurement; they are not links.** `firu-daniel/harness-gate12` was reset to its seed after the measurements, so none of the Gate 12 run IDs, branches, issue #1 or PR #2 named in this document exist any more. They identify which measurement produced a result, not a place a reader can follow.

---

## Summary

The last column abbreviates the three prompts: *triggers* is `feat_forge_run_triggers`, *control* is `feat_forge_run_control`, and *adoption* is `feat_github_native_adoption`.

| ID | Question | Verdict | Prompts affected |
|---|---|---|---|
| [S1](#s1-can-github_token-create-or-modify-files-under-githubworkflows-under-any-permissions-setting-what-does-a-refused-push-print-does-a-branch-whose-commits-touch-no-workflow-file-push-when-cut-from-a-default-branch-that-carries-workflow-files) | Can `GITHUB_TOKEN` write `.github/workflows/*`? | `verified` | triggers, adoption |
| [S2](#s2-which-tokens-can-write-workflow-files--a-fine-grained-pat-a-classic-pat-a-github-app-installation-token-a-codespaces-token-how-does-each-expire-and-how-is-each-created) | Which tokens can write workflow files, and how they expire | `partly true` | control, adoption |
| [S3](#s3-which-events-raised-with-github_token-start-other-workflows-and-which-do-not--pushes-pr-creation-comments-labels) | Which `GITHUB_TOKEN` events start other workflows | `partly true` | triggers, control, adoption |
| [S4](#s4-the-setting-allow-github-actions-to-create-and-approve-pull-requests-its-default-for-a-new-personal-repository-and-a-new-organisation-where-it-is-set-and-whether-a-workflow-can-read-it) | The "create and approve pull requests" setting | `verified` | control, adoption |
| [S5](#s5-workflow_dispatch-the-limit-on-the-number-of-inputs-and-on-the-payload-size-the-code-assumes-65535-characters-remote-runsh--remote_input_payload_max) | `workflow_dispatch` input count and payload limits | `verified` | control, adoption |
| [S6](#s6-the-maximum-length-of-an-issue-or-pr-comment-body) | Maximum comment body length | `verified` | control |
| [T1](#t1-the-issues-events-activity-types-which-role-is-needed-to-apply-a-label--is-triage-enough-who-appears-as-sender-on-labeled) | `issues` types, the role to label, `sender` on `labeled` | `verified` | triggers |
| [T2](#t2-does-an-issues-workflow-get-the-repositorys-secrets-and-a-write-token-when-the-issue-was-opened-by-someone-without-access) | Secrets and a write token for an `issues` workflow | `partly true` | triggers |
| [T3](#t3-the-api-for-a-users-permission-on-a-repository-what-it-returns-for-an-organisation-member-an-outside-collaborator-and-a-bot-and-the-token-permission-it-needs) | The collaborator-permission API | `partly true` | triggers, control |
| [T4](#t4-what-anthropicsclaude-code-action-checks-before-acting-and-where-it-documents-it) | What `anthropics/claude-code-action` checks | `verified` | triggers, control |
| [T5](#t5-gits-and-githubs-rules-on-branch-names-that-matter-for-a-derived-slug-git-check-ref-format-length-limits-case-sensitivity) | Branch-name rules for a derived slug | `partly true` | triggers |
| [T6](#t6-jira-automation--github-repository_dispatch-whether-it-works-as-described-and-what-a-jira-rule-needs-gitlabs-equivalent-route) | Jira → `repository_dispatch`; GitLab | `partly true` | triggers |
| [C1](#c1-pull_request_review-submitted-pull_request_review_comment-and-issue_comment-on-a-pr-which-review-states-exist-in-the-payload-and-how-to-fetch-every-inline-comment-of-one-review-with-its-file-and-line) | Review events, states, and a review's inline comments | `verified` | control |
| [C2](#c2-what-pull_request_review-pull_request_review_comment-and-issue_comment-get-on-a-pr-whose-head-is-a-fork-what-pull_request_target-changes-and-githubs-guidance-on-it) | Fork PRs, and `pull_request_target` | `verified` | control |
| [C3](#c3-can-a-github_token-open-a-draft-pr-and-what-does-it-need-beyond-s4) | A draft PR from `GITHUB_TOKEN` | `verified` | control, adoption |
| [C4](#c4-prior-art-for-comment-commands-the-syntax-anthropicsclaude-code-action-uses-and-any-convention-that-avoids-a-collision-with-it) | Prior art for comment commands | `partly true` | control |
| [A1](#a1-reusable-workflows-against-composite-actions-secrets-permissions-concurrency-nesting-schedule-in-a-called-workflow-pinning-and-dependabot) | Reusable workflows against composite actions | `partly true` | adoption |
| [A2](#a2-github-marketplace-can-a-reusable-workflow-be-listed-or-only-an-action) | Marketplace listing | `partly true` | adoption |
| [A3](#a3-does-disabling-a-workflow-file-disable-every-trigger-in-it) | Disabling one trigger of a multi-trigger workflow | `verified` | adoption |
| [A4](#a4-does-githubs-newbranchfilenamevalue-link-prefill-a-new-file-and-up-to-what-length) | The prefilled new-file link | `partly true` | adoption |
| [A5](#a5-workflow-templates-template-repositories-and-other-ways-to-add-a-workflow-without-a-checkout) | Workflow templates and other no-checkout routes | `partly true` | adoption |
| [A6](#a6-github-apps-what-one-needs-hosted-the-workflows-permission-a-thin-relay-and-hosting-cost) | GitHub Apps, a thin relay, hosting cost | `verified` | adoption |
| [A7](#a7-copilot-cloud-agent-third-party-coding-agents-on-github-copilot-extensions) | Copilot agents and Copilot Extensions | `partly true` | adoption |
| [A8](#a8-the-claude-github-app-what-it-installs-its-permissions-its-credentials) | The Claude GitHub App | `partly true` | adoption |
| [A9](#a9-github-codespaces-claude-with-the-plugin-sign-in-setup-token-pushing-workflow-files-cost-a-readme-button) | GitHub Codespaces | `partly true` | adoption |
| [A10](#a10-claude-code-on-the-web-claudeaicode) | Claude Code on the web | `unverified` | adoption |
| [A11](#a11-a-subscription-token-without-running-the-claude-cli-anywhere) | A subscription token without the CLI | `verified` | adoption |
| [A12](#a12-the-claude-sensitive-path-wall-on-the-current-claude-code-including-bash-writes) | The `.claude/**` wall on the current Claude Code | `verified` | adoption |

---

## 1. Shared: GitHub Actions and tokens

### S1. Can `GITHUB_TOKEN` create or modify files under `.github/workflows/`, under any `permissions:` setting? What does a refused push print? Does a branch whose commits touch no workflow file push, when cut from a default branch that carries workflow files?

**Verdict:** `verified`

**Answer:** No `permissions:` setting lets `GITHUB_TOKEN` create or modify a workflow file. The `permissions` key has no `workflows` entry, `GITHUB_TOKEN` is a GitHub App installation token, and GitHub Apps need a separate "Workflows" permission for `.github/workflows`. Measured: under `permissions: write-all`, and under a job granting `contents`, `pull-requests`, `issues` and `actions` write, a push that modifies an existing workflow file or creates a new one is refused with ``refusing to allow a GitHub App to create or update workflow … without `workflows` permission``, and the contents API refuses with HTTP 403. A branch cut from a default branch that carries five workflow files, whose commit touches no workflow file, pushes normally. The refusal string is GitHub's; docs.github.com does not quote it.

**Evidence:**
- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions — retrieved 2026-09-30 — "Workflow syntax for GitHub Actions" › `permissions`: "For each of the available permissions, shown in the table below, you can assign one of the access levels: `read` (if applicable), `write`, or `none`. `write` includes `read`. If you specify the access for any of these permissions, all of those that are not specified are set to `none`." The table's rows are `actions`, `artifact-metadata`, `attestations`, `checks`, `code-quality`, `contents`, `deployments`, `discussions`, `id-token`, `issues`, `packages`, `pages`, `pull-requests`, `security-events`, `statuses` and `vulnerability-alerts`; there is no `workflows` row.
- https://docs.github.com/en/actions/concepts/security/github_token — retrieved 2026-09-30 — "About the `GITHUB_TOKEN`": "When you enable GitHub Actions, GitHub installs a GitHub App on your repository. The `GITHUB_TOKEN` secret is a GitHub App installation access token."
- https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app#choosing-permissions-for-git-access — retrieved 2026-09-30 — "Choosing permissions for Git access": "If your app specifically needs to access or edit Actions files in the `.github/workflows` directory, request the "Workflows" repository permission."
- https://docs.github.com/en/actions/tutorials/authenticate-with-github_token#granting-additional-permissions — retrieved 2026-09-30 — "Granting additional permissions": "If you need a token that requires permissions that aren't available in the `GITHUB_TOKEN`, create a GitHub App and generate an installation access token within your workflow."
- https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#create-or-update-file-contents — retrieved 2026-09-30 — "Create or update file contents": "OAuth app tokens and personal access tokens (classic) need the repo scope to use this endpoint. The workflow scope is also required in order to modify files in the .github/workflows directory."
- Measurement, Gate 12, 2026-09-30 10:04 UTC, run `36700124002`, job with `permissions: write-all`: branch from `main`, one line appended to `.github/workflows/probe-listen.yml`, `git push origin HEAD`:
  ```
   ! [remote rejected] HEAD -> probe/s1-writeall-20260930T100421Z (refusing to allow a GitHub App to create or update workflow `.github/workflows/probe-listen.yml` without `workflows` permission)
  error: failed to push some refs to 'https://github.com/firu-daniel/harness-gate12'
  ```
- Measurement, Gate 12, 2026-09-30 10:11 UTC, run `36700909660`, job permissions `contents: write`, `pull-requests: write`, `issues: write`, `actions: write`; every branch cut from `origin/main`, which carried five workflow files:
  - no workflow file touched (one new `probe-note.txt`), `git push origin HEAD` → ` * [new branch]      HEAD -> probe/s1-noworkflow-20260930T101152Z`, `exit=0`;
  - existing workflow modified → ``  ! [remote rejected] HEAD -> probe/s1-modify-20260930T101152Z (refusing to allow a GitHub App to create or update workflow `.github/workflows/probe-listen.yml` without `workflows` permission) ``, `exit=1`;
  - new `.github/workflows/probe-created.yml` → ``  ! [remote rejected] HEAD -> probe/s1-create-20260930T101152Z (refusing to allow a GitHub App to create or update workflow `.github/workflows/probe-created.yml` without `workflows` permission) ``, `exit=1`;
  - `gh api -X PUT repos/$REPO/contents/.github/workflows/probe-api.yml` → `{"message":"Resource not accessible by integration","documentation_url":"https://docs.github.com/rest/repos/contents#create-or-update-file-contents","status":"403"}`.

**Consequence:**
- `feat_forge_run_triggers`: its lead holds. A trigger job that cuts a branch from the default branch and commits only a task prompt pushes with `GITHUB_TOKEN`. The existing remote-run limit is confirmed: a run whose task edits a workflow file cannot push it without a workflows-capable `HARNESS_GIT_TOKEN`, and the push fails with the message above.
- `feat_github_native_adoption`: the open question it must settle first is settled — a setup or upgrade job running under `GITHUB_TOKEN` can never write `harness-run.yml`, `harness-resume.yml` or a trigger workflow, so the first workflow file always needs a person or a token with workflow permission (S2).

### S2. Which tokens can write workflow files — a fine-grained PAT, a classic PAT, a GitHub App installation token, a Codespace's token? How does each expire, and how is each created?

**Verdict:** `partly true` — every one of the four can write workflow files, but the lead that a PAT "expires" does not hold for every PAT: a fine-grained PAT may be created without an expiry unless an organisation policy forbids it, and a classic PAT's expiry is optional.

**Answer:**
- **Fine-grained PAT:** created under Settings › Developer settings › Personal access tokens › Fine-grained tokens, with the repository permission "Workflows", whose only level is write. Expiry is chosen per token and may be infinite, unless an organisation or enterprise maximum-lifetime policy blocks that; the organisation default policy is 366 days.
- **Classic PAT:** created under Developer settings › Tokens (classic), with the `workflow` scope. Expiry is optional; GitHub removes a classic PAT unused for a year.
- **GitHub App installation token:** minted by the app (a JWT, then `POST /app/installations/{installation_id}/access_tokens`) with the "Workflows" permission; it expires after 1 hour.
- **Codespace's token:** issued automatically when the codespace is created or restarted, with an automatic expiry whose length docs do not state. Measured: with the default configuration, no `devcontainer.json` and no extra permission requested, it pushed a commit modifying `.github/workflows/probe-listen.yml`. `devcontainer.json` can also request `workflows - write` for other repositories of the same owner.

**Evidence:**
- https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token — retrieved 2026-09-30 — "Creating a fine-grained personal access token", step 7: "Under **Expiration**, select an expiration for the token. Infinite lifetimes are allowed but may be blocked by a maximum lifetime policy set by your organization or enterprise owner." Same page, "Pre-filling fine-grained personal access token details using URL parameters", repository permissions table row: "`workflows` | Workflows | `write`".
- https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/setting-a-personal-access-token-policy-for-your-organization#enforcing-a-maximum-lifetime-policy-for-personal-access-tokens — retrieved 2026-09-30 — "Enforcing a maximum lifetime policy for personal access tokens": "For fine-grained personal access tokens, the default the maximum lifetime policy for organizations is set to expire within 366 days. Personal access tokens (classic) do not have an expiration requirement."
- https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens — retrieved 2026-09-30 — "Creating a personal access token (classic)", step 7: "To give your token an expiration, select **Expiration**, then choose a default option or click **Custom** to enter a date." Section "Personal access tokens (classic)": "As a security precaution, GitHub automatically removes personal access tokens that haven't been used in a year. To provide additional security, we highly recommend adding an expiration to your personal access tokens."
- https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps#available-scopes — retrieved 2026-09-30 — "Available scopes", row `workflow`: "Grants the ability to add and update GitHub Actions workflow files. Workflow files can be committed without this scope if the same file (with both the same path and contents) exists on another branch in the same repository."
- https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app — retrieved 2026-09-30: "The response will include an installation access token, the time that the token expires, the permissions that the token has, and the repositories that the token can access, if applicable. The installation access token will expire after 1 hour."
- https://docs.github.com/en/codespaces/reference/security-in-github-codespaces#authentication — retrieved 2026-09-30 — "Authentication": "Every time a codespace is created or restarted, it's assigned a new GitHub token with an automatic expiry period. This period allows you to work in the codespace without needing to reauthenticate during a typical working day, but reduces the chance that you will leave a connection open when you stop using the codespace." and "**If you have write access to the repository:** The token will be scoped for read/write access to the repository."
- https://docs.github.com/en/codespaces/managing-your-codespaces/managing-repository-access-for-your-codespaces#setting-additional-repository-permissions — retrieved 2026-09-30 — "Setting additional repository permissions": the grantable list ends with "`workflows` - write"; "You can only reference repositories that belong to the same personal account or organization as the repository you are currently working in."
- Observation by the maintainer, Gate 12 codespace, 2026-09-30 10:32 UTC: `gh auth status` printed `✓ Logged in to github.com account firu-daniel (GITHUB_TOKEN)` and `Git operations protocol: https`. Then `git switch -c probe/a9-workflow && echo '# a9' >> .github/workflows/probe-listen.yml && git commit -qam 'probe: a9 codespace workflow push' && git push origin HEAD` printed ` * [new branch]      HEAD -> probe/a9-workflow` and `exit=0`. Checked from outside with `gh api repos/firu-daniel/harness-gate12/commits/probe/a9-workflow`: commit `91a9e70`, files `.github/workflows/probe-listen.yml` and `package-lock.json` (the lockfile was changed by the codespace's own setup, not by the probe).
- Not established: the preset expiry choices offered for a classic PAT (the docs page does not list them), and the length of a codespace token's automatic expiry.

**Consequence:**
- `feat_github_native_adoption`: candidate (a)'s cost is one more secret, and the token's lifetime is the adopter's choice rather than a forced expiry. Candidate (c)'s token lives an hour and is minted by whoever holds the app's private key (A6). Candidate (d) is confirmed for Codespaces: the codespace's own token pushes workflow files with no extra configuration (A9).
- `feat_forge_run_control`: `HARNESS_GIT_TOKEN`, if it is to open PRs or push workflow edits, is a fine-grained PAT with Contents, Pull requests and (for workflow files) Workflows write, or a classic PAT with `repo` and `workflow`.

### S3. Which events raised with `GITHUB_TOKEN` start other workflows, and which do not — pushes, PR creation, comments, labels?

**Verdict:** `partly true` — pushes, comments, labels and branch creation raised with `GITHUB_TOKEN` start nothing, but PR creation now does: since 2026-06-11 a PR opened with `GITHUB_TOKEN` creates `pull_request` runs that wait for approval.

**Answer:** An event raised with `GITHUB_TOKEN` creates no workflow run, with two exceptions. `workflow_dispatch` and `repository_dispatch` always create runs. A `pull_request` event of type `opened`, `synchronize` or `reopened` caused by a PR that `GITHUB_TOKEN` created or updated creates runs in an approval-required state: a person with write access must select **Approve workflows to run**. Other `pull_request` types (`labeled`, `edited`, `closed`) create none. Measured: a comment, a label, four branch creations and their pushes, all with `GITHUB_TOKEN`, started nothing; a draft PR opened with `GITHUB_TOKEN` created a `pull_request` run whose conclusion was `action_required`. `workflow_dispatch` and a push are already verified in `docs/remote-execution.md` → `### Verified in Gate 12 round 2` and `round 3` and are not repeated.

**Evidence:**
- https://docs.github.com/en/actions/concepts/security/github_token#when-github_token-triggers-workflow-runs — retrieved 2026-09-30 — "When `GITHUB_TOKEN` triggers workflow runs": "When you use the repository's `GITHUB_TOKEN` to perform tasks, events triggered by the `GITHUB_TOKEN` will not create a new workflow run, with the following exceptions:"; "`workflow_dispatch` and `repository_dispatch` events always create workflow runs."; "`pull_request` events with the `opened`, `synchronize`, or `reopened` activity types: when a workflow using `GITHUB_TOKEN` creates or updates a pull request, the resulting `pull_request` event creates workflow runs in an **approval-required** state. The pull request displays a banner in the merge box, and a user with write access to the repository can start the runs by selecting **Approve workflows to run**. Other `pull_request` activity types (such as `labeled`, `edited`, or `closed`) do not create workflow runs."; note: "If you need workflow runs from workflow-created pull requests to execute without requiring approval, use a GitHub App installation access token or a personal access token instead of `GITHUB_TOKEN` when creating or updating the pull request."
- https://github.blog/changelog/2026-06-11-bot-created-pull-requests-can-run-workflows-if-approved/ — retrieved 2026-09-30 — "Bot-created pull requests can run workflows if approved": "Pull requests created by the github-actions[bot] are now able to run your CI/CD workflows with user approval." and "Previously, pull requests generated by github-actions[bot] were not able to run CI/CD workflows, allowing pull requests to be accidentally merged without having gone through CI."
- Measurement, Gate 12, 2026-09-30 10:12 UTC, run `36700960875` (`GITHUB_TOKEN`, job permissions as in S1): `gh issue comment 1` printed the comment URL and `exit=0`; `gh issue edit 1 --add-label documentation` printed `exit=0`; a new branch `probe/s3-push-20260930T101220Z` pushed with ` * [new branch]`. The listener `probe-listen.yml` listens to `issues` (`opened`, `labeled`), `issue_comment` (`created`), `create`, `push` on `probe/**`, `pull_request` (`opened`, `labeled`), `pull_request_review` and `pull_request_review_comment`. The runs list (`gh api repos/firu-daniel/harness-gate12/actions/runs`) held no listener run for that comment, that label, or any of the four `probe/*` branches the `GITHUB_TOKEN` jobs of S1, S3 and C3 created and pushed. The listener runs that did appear were each raised by the maintainer: the issue's `opened` and `labeled` events, and the `create` of a branch pushed over SSH.
- Measurement, Gate 12, 2026-09-30 10:14 UTC: the draft PR #2, opened with `GITHUB_TOKEN` (C3), created listener run `36701163631` with event `pull_request`, actor `github-actions[bot]`, status `completed` and conclusion `action_required`.

**Consequence:**
- `feat_forge_run_control`: the lead *"A PR opened, or a push made, with `GITHUB_TOKEN` starts no other workflow, so the adopter's CI does not run on the draft PR"* is out of date for the PR. A draft PR opened with `GITHUB_TOKEN` gets CI runs that wait for a person to approve them; a PR opened with `HARNESS_GIT_TOKEN` (a PAT or app token) gets them without approval. The push part holds. Lifecycle and park comments the harness posts with `GITHUB_TOKEN` will never re-trigger its own `issue_comment` workflow, which answers part of "never triggers itself"; a comment posted with `HARNESS_GIT_TOKEN` would trigger it and needs the self-filter the prompt asks for.
- `feat_forge_run_triggers`: the trigger job's comment on the issue, and its branch push, start no other workflow; its `workflow_dispatch` of `harness-run.yml` does.
- `feat_github_native_adoption`: a setup PR opened with `GITHUB_TOKEN` shows the adopter an **Approve workflows to run** banner for their CI.

### S4. The setting "Allow GitHub Actions to create and approve pull requests": its default for a new personal repository and a new organisation, where it is set, and whether a workflow can read it.

**Verdict:** `verified`

**Answer:** Off by default for a new repository on a personal account and for a new organisation; a new repository in an organisation inherits the organisation's value. It is set under Settings › Actions › General › "Workflow permissions", on the repository or on the organisation. A workflow cannot read it: the REST endpoint that returns it (`can_approve_pull_request_reviews`) needs the "Administration" permission, which `GITHUB_TOKEN` has no key for, and a measured read with `GITHUB_TOKEN` returned HTTP 403. Whether an organisation's "off" locks the repository toggle is not stated for this setting (the docs state such a lock only for the default token permissions).

**Evidence:**
- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#preventing-github-actions-from-creating-or-approving-pull-requests — retrieved 2026-09-30 — "Preventing GitHub Actions from creating or approving pull requests": "By default, when you create a new repository in your personal account, workflows are not allowed to create or approve pull requests. If you create a new repository in an organization, the setting is inherited from what is configured in the organization settings." Step 4: "Under "Workflow permissions", use the **Allow GitHub Actions to create and approve pull requests** setting to configure whether `GITHUB_TOKEN` can create and approve pull requests."
- https://docs.github.com/en/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization#preventing-github-actions-from-creating-or-approving-pull-requests — retrieved 2026-09-30: "By default, when you create a new organization, workflows are not allowed to create or approve pull requests."
- https://docs.github.com/en/rest/actions/permissions?apiVersion=2022-11-28#get-default-workflow-permissions-for-a-repository — retrieved 2026-09-30 — "Get default workflow permissions for a repository": "Gets the default workflow permissions granted to the GITHUB_TOKEN when running workflows in a repository, as well as if GitHub Actions can submit approving pull request reviews." and "The fine-grained token must have the following permission set: "Administration" repository permissions (read)".
- https://github.blog/changelog/2022-05-03-github-actions-prevent-github-actions-from-creating-and-approving-pull-requests/ — retrieved 2026-09-30: "To further reduce the risk of a user using Actions to merge a change into a protected branch that was not reviewed by another person, the organization setting to disallow Actions from approving pull requests, which was introduced in January 2022, has been extended to also limit Actions from creating pull requests."
- Measurement, 2026-09-30 ~09:55 UTC, maintainer's `gh`: `gh api repos/firu-daniel/harness-gate12/actions/permissions/workflow` on the repository created 2026-09-29 and never changed → `{"default_workflow_permissions":"read","can_approve_pull_request_reviews":false}`.
- Measurement, Gate 12, 2026-09-30 10:04 UTC, run `36700128521`, `GITHUB_TOKEN` with `actions: write`: `gh api "repos/$REPO/actions/permissions/workflow"` → `{"message":"Resource not accessible by integration","documentation_url":"https://docs.github.com/rest/actions/permissions#get-default-workflow-permissions-for-a-repository","status":"403"}`.

**Consequence:**
- `feat_forge_run_control` and `feat_github_native_adoption`: the adopter must switch the setting on (one setting action, S4's path) before a job can open a draft or setup PR with `GITHUB_TOKEN`; without it the PR step fails with the C3 message. The job cannot pre-check it with its own token, so `doctor` checks it from a person's `gh` (which reads it with `repo` scope, as measured) or the job reports the C3 error when it happens.

### S5. `workflow_dispatch`: the limit on the number of inputs, and on the payload size (the code assumes 65,535 characters, `remote-run.sh` → `REMOTE_INPUT_PAYLOAD_MAX`).

**Verdict:** `verified`

**Answer:** At most 25 top-level inputs (raised from 10 on 2025-12-04); a workflow file declaring 26 is refused as unparsable at dispatch time and is listed by its path instead of its `name:`. The payload limit is 65,535 characters, counted over the whole inputs object serialised as compact JSON — keys, quotes and all inputs together — and counted in characters, not bytes. `remote-run.sh` → `dispatch` already measures `${#payload}` of that same compact object, so its check matches.

**Evidence:**
- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onworkflow_dispatchinputs — retrieved 2026-09-30 — `on.workflow_dispatch.inputs`: "The maximum number of top-level properties for `inputs` is 25 ." (the page renders the space before the period) and "The maximum payload for `inputs` is 65,535 characters."
- https://github.blog/changelog/2025-12-04-actions-workflow-dispatch-workflows-now-support-25-inputs/ — retrieved 2026-09-30: "You can now use up to 25 inputs on workflows triggered via the workflow_dispatch trigger. The previous limit was 10 which was challenging for the community."
- Measurement, Gate 12, 2026-09-30 10:04 UTC: `gh workflow list` listed the 26-input file as `.github/workflows/probe-inputs-26.yml` rather than by its `name:`. `gh workflow run probe-inputs-26.yml` → ``could not create workflow dispatch event: HTTP 422: Invalid Argument - failed to parse workflow: you may only define up to 25 `inputs` for a `workflow_dispatch` event``. `gh workflow run probe-inputs-25.yml` → accepted.
- Measurement, Gate 12, 2026-09-30 10:05–10:25 UTC, `gh api -X POST repos/firu-daniel/harness-gate12/actions/workflows/probe-inputs-25.yml/dispatches -f ref=main -f "inputs[in1]=<value>"`, value `n` repetitions of one character:
  - `a` × 65,525 → accepted; `a` × 65,526 → `{"message":"inputs are too large.","documentation_url":"https://docs.github.com/rest/actions/workflows#create-a-workflow-dispatch-event","status":"422"}`. `{"in1":"…"}` adds 10 characters, so the accepted maximum is 65,535 characters of JSON.
  - two inputs of 40,000 `a` each → `inputs are too large.` (the limit is on the whole object).
  - `é` × 32,763 (65,536 bytes of JSON) → accepted; `é` × 65,525 (65,535 JSON characters, 131,060 bytes) → accepted; `é` × 65,526 → `inputs are too large.` (characters, not bytes).

**Consequence:**
- `feat_forge_run_control`: the 65,535-character limit it cites is right, and it applies to the whole inputs object, so a park answer posted as a comment and relayed as `answers` must fit together with the other inputs. The existing check in `remote-run.sh` is the one to reuse. A new `workflow_dispatch` input (the prompt's forge-reference candidate) takes one of the 25 slots; `harness-run.yml` declares 7 today (`docs/remote-execution.md` → `## 5.`).
- `feat_github_native_adoption`: a settings form built from `workflow_dispatch` inputs has at most 25 fields, and all its values together are capped at 65,535 characters.
- `docs/remote-execution.md` → `## 6.`'s row *"A `workflow_dispatch` inputs payload is limited to 65,535 characters"* is now measured. This branch does not edit that file; a later change can move the row.

### S6. The maximum length of an issue or PR comment body.

**Verdict:** `verified` for an issue comment created through the REST API; a PR review comment and a PR conversation comment were not measured separately.

**Answer:** 262,144 bytes of UTF-8. The refusal text still says `maximum is 65536 characters`, which is the same cap expressed as 65,536 four-byte characters, but a body of plain ASCII is accepted up to 262,144 characters. docs.github.com states no limit on its REST pages.

**Evidence:**
- https://docs.github.com/en/rest/issues/comments?apiVersion=2022-11-28 and https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28 — retrieved 2026-09-30 — neither page states a body-length limit (a text search for "65536", "65,536", "maximum length" and "too long" found nothing).
- Measurement, Gate 12, 2026-09-30 10:19–10:23 UTC, maintainer's `gh`, `POST repos/firu-daniel/harness-gate12/issues/1/comments` with a JSON body of `n` repetitions of one character:
  - `a` × 65,536, 65,537, 131,072 and 262,144 → each posted; the 262,144 one read back with `.body|length` = `262144`.
  - `a` × 262,145 and × 1,048,576 → refused:
    ```
    {"message":"Validation Failed","errors":[{"resource":"IssueComment","code":"unprocessable","field":"data","message":"Body is too long (maximum is 65536 characters)"}],"documentation_url":"https://docs.github.com/rest/issues/comments#create-an-issue-c
    ```
    (the output was cut at that point by the measuring command, not by GitHub).
  - `é` × 131,072 (262,144 bytes) → posted, `len=131072`; `é` × 131,073 (262,146 bytes) → refused with the same message.

**Consequence:**
- `feat_forge_run_control`: a park post carries a whole `question_<n>.md` as one comment; it fits unless the file exceeds 262,144 bytes. Plan against bytes, not characters, and do not trust the error text's number.

## 2. Triggers — feat_forge_run_triggers

### T1. The `issues` event's activity types. Which role is needed to apply a label — is triage enough? Who appears as `sender` on `labeled`?

**Verdict:** `verified`

**Answer:** `issues` has 20 activity types, runs the workflow on the default branch, and fires on all types unless `types:` narrows it. In an organisation repository, applying and dismissing labels is granted to Triage and above, not to Read; creating, editing or deleting labels needs Write. So triage is enough to apply a label. On `labeled`, `sender` is the account that applied the label: measured, the labeller appeared as `sender`, `github.actor` and `github.triggering_actor`. GitHub warns that `sender` can be the `ghost` placeholder when it cannot resolve a user, and that security logic must allow for it.

**Evidence:**
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#issues — retrieved 2026-09-30 — `issues`, activity types: `opened`, `edited`, `deleted`, `transferred`, `pinned`, `unpinned`, `closed`, `reopened`, `assigned`, `unassigned`, `labeled`, `unlabeled`, `locked`, `unlocked`, `milestoned`, `demilestoned`, `typed`, `untyped`, `field_added`, `field_removed`; `GITHUB_SHA` "Last commit on default branch", `GITHUB_REF` "Default branch". Notes: "By default, all activity types trigger workflows that run on this event." and "This event will only trigger a workflow run if the workflow file exists on the default branch."
- https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization#permissions-for-each-role — retrieved 2026-09-30 — "Permissions for each role" table (Read | Triage | Write | Maintain | Admin): row "Apply/dismiss labels": ✗ | ✓ | ✓ | ✓ | ✓; row "Create, edit, delete labels": ✗ | ✗ | ✓ | ✓ | ✓. Section "Repository roles for organizations": "**Triage:** Recommended for contributors who need to proactively manage issues, discussions, and pull requests without write access".
- https://docs.github.com/en/webhooks/webhook-events-and-payloads — retrieved 2026-09-30 — "The `sender` property": "Most webhook payloads include a `sender` property identifying the user who triggered the event. Sometimes GitHub can't resolve a specific user, for example when an event comes from an internal process rather than a person, or when the triggering action has no associated user." and "In these cases, `sender` is populated with the `ghost` user, a placeholder account whose `login` is `ghost` and whose `id` isn't tied to a real, current user. Don't assume `sender` always identifies the person who caused an event, and account for the `ghost` user in any security or business logic that relies on it."
- Measurement, Gate 12, 2026-09-30 10:04 UTC: the maintainer labelled issue #1 `question` with `gh issue edit 1 --add-label question`; the `probe-listen.yml` run logged:
  ```
  event=issues action=labeled actor=firu-daniel triggering_actor=firu-daniel sender=firu-daniel sender_type=User label=question review_state= ref=refs/heads/main secret_present=true
  ```
- Observation by the maintainer, measured by the planning session, Gate 12, 2026-09-30 11:43 UTC: the maintainer created issue #3 in the web UI with the label `harness` set at creation. `gh api repos/firu-daniel/harness-gate12/issues/3/events` shows `{"actor":"firu-daniel","created_at":"2026-09-30T11:43:01Z","label":"harness"}` for the `labeled` event, and the issue's `createdAt` is `2026-09-30T11:43:00Z`. Two `probe-listen.yml` runs followed, `36710247909` and `36710247923`, logging:
  ```
  event=issues action=opened actor=firu-daniel triggering_actor=firu-daniel sender=firu-daniel sender_type=User label= review_state= ref=refs/heads/main secret_present=true
  event=issues action=labeled actor=firu-daniel triggering_actor=firu-daniel sender=firu-daniel sender_type=User label=harness review_state= ref=refs/heads/main secret_present=true
  ```
  A label set while the issue is being created raises `labeled` too, as a separate event, and its `sender` is the creator. The same run's payload carries the issue's `title` and `body` (`gh issue view 3 --json title,body,labels` → `"title":"Test research issue title"`, `"body":"Test research issue body"`, label `harness`).
- Not established: whether a label an issue form adds at creation (`labels:` in the form) raises `labeled`, and with which `sender`. The form syntax page says only: "Labels that will automatically be added to issues created with this template." (https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms#top-level-syntax, retrieved 2026-09-30). The triage role was not measured, because the measurement had no second account.

**Consequence:**
- `feat_forge_run_triggers`: its lead holds — a triage user can apply the trigger label, so the trigger must check the labeller's permission itself (T3). The labeller to check is `github.event.sender.login` (equal to `github.actor` on `labeled`); treat `ghost` as unauthorised. If the trigger label is one an issue form adds automatically, a read-only author can cause the event, which the plan must rule out or check. An issue created with the trigger label already set raises both `opened` and `labeled`, so a workflow listening to both would start twice; listening to `labeled` alone covers labelling at creation and labelling later. The run needs no API call to read the three fields: `github.event.issue.title`, `github.event.issue.body` and `github.event.label.name` are in the event payload, and reaching a shell through `env:` keeps them data (`docs/remote-execution.md` → `## 11. Security`, *Workflow inputs never become shell source*).

### T2. Does an `issues` workflow get the repository's secrets and a write token when the issue was opened by someone without access?

**Verdict:** `partly true` — it gets the secrets, whoever opened the issue, but it gets a write token only if the repository default or the workflow's `permissions:` grants write.

**Answer:** The documented restrictions on secrets and on write tokens apply to pull-request events from forks; `issues` runs the default branch's workflow and is not one of them. GitHub Security Lab names `issues` among the events that do not get the `pull_request` restrictions. So an `issues` workflow runs with the repository's secrets, whoever opened or labelled the issue. Its `GITHUB_TOKEN` follows the normal calculation: the default (read-only `contents` and `packages` for a new personal repository) adjusted by `permissions:`. Measured: a repository secret was present in `issues` runs; the actor in those runs was the admin, since no account without access was available, so the no-access case rests on the documentation.

**Evidence:**
- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#how-permissions-are-calculated-for-a-workflow-job — retrieved 2026-09-30 — "How permissions are calculated for a workflow job": "The permissions for the `GITHUB_TOKEN` are initially set to the default setting for the enterprise, organization, or repository. If the default is set to the restricted permissions at any of these levels then this will apply to the relevant repositories. For example, if you choose the restricted default at the organization level then all repositories in that organization will use the restricted permissions as the default. The permissions are then adjusted based on any configuration within the workflow file, first at the workflow level and then at the job level. Finally, if the workflow was triggered by a pull request event other than `pull_request_target` from a forked repository, and the **Send write tokens to workflows from pull requests** setting is not selected, the permissions are adjusted to change any write permissions to read only."
- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#configuring-the-default-github_token-permissions — retrieved 2026-09-30: "By default, when you create a new repository in your personal account, `GITHUB_TOKEN` only has read access for the `contents` and `packages` scopes. If you create a new repository in an organization, the setting is inherited from what is configured in the organization settings."
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets — retrieved 2026-09-30, note: "With the exception of `GITHUB_TOKEN`, secrets are not passed to the runner when a workflow is triggered from a forked repository."
- https://securitylab.github.com/resources/github-actions-untrusted-input/ — retrieved 2026-09-30 — "Exploitability and impact": "Workflows triggered via the pull_request event have read-only permissions and no access to secrets. However, these permissions differ between the various event triggers such as issue_comment, issues and push. An attacker could try to steal the repository secrets or even the repository write access token."
- Measurement, Gate 12, 2026-09-30 10:03–10:04 UTC: the `probe-listen.yml` runs for issue #1's `opened` and `labeled` events logged `secret_present=true` (the expression `secrets.CLAUDE_CODE_OAUTH_TOKEN != ''`), with `sender=firu-daniel`, the repository's admin.
- Not established: a docs.github.com sentence that says in one line that `issues` workflows receive repository secrets, and a measurement with an opener who has no access.

**Consequence:**
- `feat_forge_run_triggers`: the lead's security conclusion holds — `opened` must never start a run without the same permission check as `labeled`, because the job holds the credential secrets whoever wrote the issue. Its job must declare `contents: write` (and `actions: write` to dispatch, `issues: write` to comment) explicitly; it cannot rely on the default.

### T3. The API for a user's permission on a repository: what it returns for an organisation member, an outside collaborator and a bot, and the token permission it needs.

**Verdict:** `partly true` — the endpoint, its fields, the permission it needs, and its answers for a bot and a non-collaborator are verified; its answers for an organisation member and an outside collaborator were not measured and are documented only in general terms.

**Answer:** `GET /repos/{owner}/{repo}/collaborators/{username}/permission` has no successor. It returns `permission` (the legacy base role: `admin`, `write`, `read` or `none`, with maintain mapped to write and triage mapped to read) and `role_name` (the actual role, custom roles included), computed as the highest role across repository, team, organisation and enterprise grants. Fine-grained tokens need "Metadata" read, and the endpoint accepts installation tokens, which `GITHUB_TOKEN` is. Measured with a workflow's `GITHUB_TOKEN`: the owner → `admin`; `github-actions[bot]` → `none` with `role_name` empty and user `type` `Bot`; a user who is not a collaborator → `none`. A check for write access must therefore read `permission` ∈ {`admin`, `write`} — which admits maintain and rejects triage — or `role_name` when triage or custom roles matter.

**Evidence:**
- https://docs.github.com/en/rest/collaborators/collaborators#get-repository-permissions-for-a-user — retrieved 2026-09-30 — "Get repository permissions for a user": "Checks the repository permission and role of a collaborator." / "The permission attribute provides the legacy base roles of admin, write, read, and none, where the maintain role is mapped to write and the triage role is mapped to read." / "The role_name attribute provides the name of the assigned role, including custom roles. The permission can also be used to determine which base level of access the collaborator has to the repository." / "The calculated permissions are the highest role assigned to the collaborator after considering all sources of grants, including: repo, teams, organization, and enterprise." / "There is presently not a way to differentiate between an organization level grant and a repository level grant from this endpoint response." Box: "The fine-grained token must have the following permission set: "Metadata" repository permissions (read)"; token types listed: GitHub App user access tokens, GitHub App installation access tokens, fine-grained personal access tokens.
- https://docs.github.com/en/rest/collaborators/collaborators#list-repository-collaborators — retrieved 2026-09-30: "For organization-owned repositories, the list of collaborators includes outside collaborators, organization members that are direct collaborators, organization members with access through team memberships, organization members with access through default organization permissions, and organization owners."
- Measurement, Gate 12, 2026-09-30 10:04 UTC, run `36700134017`, `GITHUB_TOKEN` (job permissions `contents`, `pull-requests`, `issues`, `actions` write), `gh api "repos/$REPO/collaborators/<user>/permission"`, exit 0 for each:
  - `firu-daniel` → `"permission":"admin"`, `"role_name":"admin"`, `"permissions":{"admin":true,"maintain":true,"push":true,"triage":true,"pull":true}`;
  - `github-actions[bot]` → `"permission":"none"`, `"role_name":""`, user `"type":"Bot"`;
  - `octocat` (not a collaborator) → `"permission":"none"`, `"role_name":""`, user `"type":"User"`.
- Third-party code, not GitHub documentation: `anthropics/claude-code-action` at commit `a8cb0db4d8c2baea0bf33aac6db34a3ce00b4014`, `src/github/validation/permissions.ts` lines 141–144 — "// Handle 404 errors for non-user actors (e.g. GitHub Apps like Copilot / // whose GITHUB_ACTOR doesn't end with [bot]). / // The collaborator permission API only works for user accounts." (https://github.com/anthropics/claude-code-action/blob/a8cb0db4d8c2baea0bf33aac6db34a3ce00b4014/src/github/validation/permissions.ts#L141-L144, retrieved 2026-09-30).

**Consequence:**
- `feat_forge_run_triggers` and `feat_forge_run_control`: the permission check runs inside the trigger job with its own `GITHUB_TOKEN` — no extra secret. "At least write" is `permission` equal to `write` or `admin`. A bot is not rejected by this call alone for every bot kind: `github-actions[bot]` returns `none`, but claude-code-action's code records a 404 for app actors whose login has no `[bot]` suffix, so the trigger should treat a non-200 response as a refusal and reject `type: Bot` separately unless the bot is listed.

### T4. What `anthropics/claude-code-action` checks before acting, and where it documents it.

**Verdict:** `verified`, with one difference between its documentation and its code.

**Answer:** Two checks. **Write access:** on issue, PR, comment and review events (and `workflow_run`), it calls the collaborator-permission endpoint (T3) for `GITHUB_ACTOR` and passes only `admin` or `write`, so triage fails and maintain passes. `allowed_non_write_users` bypasses it only when the workflow passes its own `github_token`. **Human actor:** on every event it rejects an account whose type is not `User` unless it is listed in `allowed_bots` (empty by default). The documentation says the check is on "the triggering user"; the code checks `GITHUB_ACTOR`, and any actor whose login ends in `[bot]` passes the write check outright and is stopped by the human-actor check instead. It documents this at code.claude.com → *Who can trigger runs* and in the action's `docs/security.md` → *Access Control*.

**Evidence:**
- https://code.claude.com/docs/en/github-actions#who-can-trigger-runs — retrieved 2026-09-30 — "Who can trigger runs": "In both modes, the Claude Code GitHub Action runs two checks on the triggering actor before Claude starts, and the run fails when either check rejects it:" / "**Write access**: on issue and pull request events, the triggering user must have write access to the repository. To allow specific users without write access, set `allowed_non_write_users` and pass your own `github_token` input. Events that no user authors, such as a `schedule` trigger, skip this check." / "**Human actor**: on every event, the Claude Code GitHub Action rejects a bot actor unless you list it in `allowed_bots`, which keeps bots from triggering Claude in a loop. This check also applies to scheduled runs, which GitHub attributes to a repository user, usually the one who last changed the workflow's `cron` schedule. If that user is a bot, list it in `allowed_bots`."
- https://github.com/anthropics/claude-code-action/blob/a8cb0db4d8c2baea0bf33aac6db34a3ce00b4014/docs/security.md#access-control — retrieved 2026-09-30 — "Access Control": "**Repository Access**: The action can only be triggered by users with write access to the repository. This is checked for issue, pull request, comment, and review events, and for `workflow_run` events, where both the workflow actor and the actor that started the upstream run are checked. `workflow_dispatch`, `repository_dispatch`, and `schedule` events are not checked separately — GitHub itself requires write access to dispatch a workflow, and scheduled runs have no external actor." / "**Bot User Control**: By default, GitHub Apps and bots cannot trigger this action for security reasons. Use the `allowed_bots` parameter to enable specific bots or all bots" / "**⚠️ Allowed bots are not checked for repository permissions.** A bot that matches an entry does **not** need to be installed on your repository or have write access."
- `src/github/validation/permissions.ts` at the same commit, lines 89–139 (https://github.com/anthropics/claude-code-action/blob/a8cb0db4d8c2baea0bf33aac6db34a3ce00b4014/src/github/validation/permissions.ts#L89-L139), excerpts:
  ```
  if (allowedNonWriteUsers && githubTokenProvided) {
  ...
  if (actor.endsWith("[bot]")) {
    core.info(`Actor is a GitHub App: ${actor}`);
    return true;
  }
  ...
  const response = await octokit.repos.getCollaboratorPermissionLevel({
  ...
  if (permissionLevel === "admin" || permissionLevel === "write") {
  ```
- `src/github/validation/actor.ts` at the same commit, lines 68–82 (https://github.com/anthropics/claude-code-action/blob/a8cb0db4d8c2baea0bf33aac6db34a3ce00b4014/src/github/validation/actor.ts#L68-L82), excerpt: `` `Workflow initiated by non-human actor: ${botName} (type: ${actorType}). Add bot to allowed_bots list or use '*' to allow all bots.` ``
- `action.yml` at the same commit, lines 8–39: `trigger_phrase` default `"@claude"`, `label_trigger` default `"claude"`, `assignee_trigger` no default, `allowed_bots` default `""` ("Comma-separated list of allowed bot usernames, or '*' to allow all bots. Empty string (default) allows no bots."), `allowed_non_write_users` ("Only works when github_token input is provided.").

**Consequence:**
- `feat_forge_run_triggers` (the prompt's *Decide whether to reuse them or restate them*): the action's checks are not reusable as a library, because the harness does not run the action (`docs/remote-execution.md` → `## 2.`); they are restatable in a few lines — write means `admin` or `write` from T3; a non-`User` account is refused unless listed. The action's own `[bot]` shortcut is a behaviour not to copy: the harness should check the labeller's type and permission both.

### T5. Git's and GitHub's rules on branch names that matter for a derived slug: `git check-ref-format`, length limits, case sensitivity.

**Verdict:** `partly true` — git's naming rules and its case problem are verified; no GitHub-documented length limit or case rule was found.

**Answer:** A slug of lowercase letters, digits and single `_` (the prompt's rule) passes every `git check-ref-format` rule; the rules bite only on characters the slug removes (space, `~`, `^`, `:`, `?`, `*`, `[`, `\`, control characters, `..`, `@{`) and on a leading `-` for a branch. git states no length limit. Two refs that differ only in case cannot coexist under the default "files" ref backend on a case-insensitive filesystem (macOS, Windows); a lowercase-only slug avoids that. GitHub documents no branch-name length limit or case rule; the only figure found, "255 (244 really after refs/heads)", is from a third-party issue, not from GitHub.

**Evidence:**
- https://git-scm.com/docs/git-check-ref-format#_description — retrieved 2026-09-30 (page "last updated in 2.52.0") — "DESCRIPTION": "They can include slash / for hierarchical (directory) grouping, but no slash-separated component can begin with a dot . or end with the sequence .lock." / "They cannot have two consecutive dots .. anywhere." / "They cannot have ASCII control characters (i.e. bytes whose values are lower than \040, or \177 DEL), space, tilde ~, caret ^, or colon : anywhere." / "They cannot have question-mark ?, asterisk *, or open bracket [ anywhere. See the --refspec-pattern option below for an exception to this rule." / "They cannot begin or end with a slash / or contain multiple consecutive slashes (see the --normalize option below for an exception to this rule)." / "They cannot end with a dot .." / "They cannot contain a sequence @{." / "They cannot be the single character @." / "They cannot contain a \." / "The rule git check-ref-format --branch $name implements may be stricter than what git check-ref-format refs/heads/$name says (e.g. a dash may appear at the beginning of a ref component, but it is explicitly forbidden at the beginning of a branch name)." (Whitespace collapsed from the page's line-wrapped HTML.)
- https://git-scm.com/docs/BreakingChanges — retrieved 2026-09-30 (page "last updated in 2.55.0") — "Changes": "It is impossible to store two references that only differ in casing on case-insensitive filesystems with the "files" format. This issue is common on Windows and macOS platforms. As the "reftable" backend does not use filesystem paths to encode reference names this problem goes away."
- https://docs.github.com/en/rest/git/refs#create-a-reference — retrieved 2026-09-30 — body parameter `ref`: "The name of the fully qualified reference (ie: refs/heads/master). If it doesn't start with 'refs' and have at least two slashes, it will be rejected."
- Third-party, not GitHub documentation: https://github.com/dependabot/dependabot-core/issues/5761 — retrieved 2026-09-30: "According to the reporter, the limit for GitHub branch names is 255 (244 really after refs/heads)."
- Not established: a GitHub-documented ref length limit or case rule (searched: the managing-branches page, the branches page, rulesets' available rules, REST git/refs), and a primary source for a filesystem's per-component limit.

**Consequence:**
- `feat_forge_run_triggers`: the slug rule is safe against git's rules as written. The length cap is the plan's to choose without a GitHub number to lean on; since the branch name also becomes a directory name, a cap well under 255 bytes is the conservative reading. The lowercase rule also closes the macOS/Windows case collision, which the index-suffix check alone would not see (`Version_bump` and `version_bump` are one directory there).

### T6. Jira Automation → GitHub `repository_dispatch`: whether it works as described and what a Jira rule needs; GitLab's equivalent route.

**Verdict:** `partly true` — the GitHub side is verified from its documentation; the Jira side is documented only in parts and was not tried; the GitLab lead is verified.

**Answer:** GitHub's `POST /repos/{owner}/{repo}/dispatches` takes `event_type` (at most 100 characters) and an optional `client_payload` (at most 10 top-level properties, under 64 KB). A fine-grained or app token needs "Contents" write; a classic PAT needs `repo`. The workflow runs only from the default branch. Jira Cloud Automation's **Send web request** action sends an outgoing request with a custom-format body and values that can be hidden, to a small set of ports including 443; its Cloud page does not list the method and header fields, which an Atlassian Data Center article shows (an `Authorization: Bearer <token>` header, a chosen method, a custom body). So a Jira rule needs the GitHub token as a hidden header value and a JSON body with `event_type` and `client_payload`; that the whole chain works was not tested. GitLab has no pipeline source for an issue or a label: its trigger tokens start a branch or tag pipeline through the API, and its documented webhook form covers push and tag events, so reacting to a GitLab issue label needs a relay that receives the issue webhook and calls the trigger API.

**Evidence:**
- https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event — retrieved 2026-09-30 — "Create a repository dispatch event": "You can use this endpoint to trigger a webhook event called repository_dispatch when you want activity that happens outside of GitHub to trigger a GitHub Actions workflow or GitHub App webhook. You must configure your GitHub Actions workflow or GitHub App to run when the repository_dispatch event occurs." / "OAuth app tokens and personal access tokens (classic) need the repo scope to use this endpoint." / "**`event_type`** (string) (required) A custom webhook event name. Must be 100 characters or fewer." / "**`client_payload`** (object) JSON payload with extra information about the webhook event that your action or workflow may use. The maximum number of top-level properties is 10. The total size of the JSON payload must be less than 64KB." / box: "The fine-grained token must have the following permission set: "Contents" repository permissions (write)".
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#repository_dispatch — retrieved 2026-09-30: "This event will only trigger a workflow run if the workflow file exists on the default branch."
- https://support.atlassian.com/cloud-automation/docs/jira-automation-actions/ — retrieved 2026-09-30 — "Send web request": "Sends an outgoing web request to notify another system when a flow is run. You can set this action to return response data that can then be used in a subsequent action." / "Data formats": "Custom format - Select this option to enter your own data format." / "Hidden values": "When configuring your web request, you can also Hide certain values, making them more secure. If a value is marked as hidden and the flow is saved, the value will be replaced by asterisks (i.e., *****)." / "Other things to note": "Permitted ports: Note that the only permitted ports for urls from the Send web request action are 80, 8080, 443, 6017, 8443, 8444, 7990, 8090, 8085, 8060, 8900, 9900."
- https://support.atlassian.com/automation/kb/how-to-extend-automation-for-jira-with-rest-api-calls/ — retrieved 2026-09-30 (labelled "Data Center only", "Updated on September 25, 2025") — "Solution": "2. Create your rule and add the Send web request action." / "b. On the Headers field, add the name as Authorization and the value as Bearer <Personal Access Token>" / "c. Select the method as PUT" / "d. Set the webhook body as Custom data".
- https://docs.gitlab.com/ci/triggers/ — retrieved 2026-09-30 — "Create a pipeline trigger token": "You can trigger a pipeline for a branch or tag by generating a pipeline trigger token and using it to authenticate an API call. The token impersonates a user's project access and permissions." / "Use a webhook": "To trigger a pipeline from another project's webhook, use a webhook URL like the following for push and tag events:".
- https://docs.gitlab.com/ci/jobs/job_rules/ — retrieved 2026-09-30 — "`CI_PIPELINE_SOURCE` predefined variable": the values listed are `api`, `chat`, `external`, `external_pull_request_event`, `merge_request_event`, `ondemand_dast_scan`, `ondemand_dast_validation`, `parent_pipeline`, `pipeline`, `push`, `schedule`, `security_orchestration_policy`, `trigger`, `web`, `webide` — none for an issue or a label.

**Consequence:**
- `feat_forge_run_triggers`: leaving Jira as a documented path is supported by the facts, with two cautions for that doc: the Jira rule holds a GitHub token with Contents write (a secret outside GitHub), and the trigger workflow reached through `repository_dispatch` has no labeller to check — the token holder is the authority. `client_payload`'s 10-property and 64 KB limits bound what a Jira rule can carry (a task text over 64 KB does not fit). The GitLab paragraph can state that a relay is needed.

## 3. Control — feat_forge_run_control

### C1. `pull_request_review` (`submitted`), `pull_request_review_comment` and `issue_comment` on a PR: which review states exist in the payload, and how to fetch every inline comment of one review with its file and line.

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

### C2. What `pull_request_review`, `pull_request_review_comment` and `issue_comment` get on a PR whose head is a fork. What `pull_request_target` changes, and GitHub's guidance on it.

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

### C3. Can a `GITHUB_TOKEN` open a draft PR, and what does it need beyond S4?

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

### C4. Prior art for comment commands: the syntax `anthropics/claude-code-action` uses, and any convention that avoids a collision with it.

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

## 4. Adoption — feat_github_native_adoption (dropped)

`feat_github_native_adoption` — adopting and running the harness from GitHub alone, with nothing installed locally — was dropped by the maintainer on 2026-09-30, during the planning of this research. The findings below are why: every GitHub-only route needs a codespace (A9) as soon as a subscription credential (A11) or the supervised analysis (A12) is involved. A codespace setup session costs more of the adopter's actions than the local install (§ 5), for an adopter who has a machine. The entries are kept as a brief record, so that the question does not have to be researched again if it returns.

### A1. Reusable workflows against composite actions: secrets, `permissions`, `concurrency`, nesting, `schedule` in a called workflow, pinning and Dependabot.

**Verdict:** `partly true` — all documented except whether a called workflow's own `schedule` trigger runs.

**Answer:** `secrets: inherit` works only within one organisation or enterprise, so a caller under another owner passes each secret by name. A called workflow can only lower the caller's permissions. Workflows nest ten levels deep. A composite action cannot read `secrets` at all. A caller can pin `@v1`, and Dependabot updates reusable-workflow references.

**Evidence:**
- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idsecretsinherit — retrieved 2026-09-30: "The `inherit` keyword can be used to pass secrets across repositories within the same organization, or across organizations within the same enterprise."
- https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations#limitations-of-reusable-workflows — retrieved 2026-09-30: "The `GITHUB_TOKEN` permissions passed from the caller workflow can be only downgraded (not elevated) by the called workflow."
- https://docs.github.com/en/code-security/dependabot/working-with-dependabot/keeping-your-actions-up-to-date-with-dependabot — retrieved 2026-09-30: "When you enable Dependabot version updates for GitHub Actions, Dependabot will help ensure that references to actions in a repository's *workflow.yml* file and reusable workflows used inside workflows are kept up to date."

**Consequence:** none now; it would shape thin callers if the idea returns.

### A2. GitHub Marketplace: can a reusable workflow be listed, or only an action?

**Verdict:** `partly true` — only an action (or an app) can be listed, not a reusable workflow.

**Answer:** A reusable workflow cannot be published to the Marketplace. An action, including a composite action, can be listed from a public repository with one root `action.yml`. A listing installs nothing into the adopter's repository.

**Evidence:**
- https://docs.github.com/en/actions/concepts/workflows-and-actions/reusing-workflow-configurations#key-differences-between-reusable-workflows-and-composite-actions — retrieved 2026-09-30, table row (reusable | composite): "Cannot be published to the marketplace | Can be published to the marketplace".

**Consequence:** none now.

### A3. Does disabling a workflow file disable every trigger in it?

**Verdict:** `verified`

**Answer:** Yes. Once `probe-disable.yml` was disabled, its `workflow_dispatch` was refused and neither a label nor a matching push started it. Re-enabled, the label started it again. So the resume poller, which disables itself, must stay a file of its own, as `harness-resume.yml` already is.

**Evidence:**
- Measurement, Gate 12, 2026-09-30 10:17 UTC, maintainer's `gh`: `gh workflow disable probe-disable.yml` → state `disabled_manually`. `gh workflow run probe-disable.yml` → `could not create workflow dispatch event: HTTP 422: Cannot trigger a 'workflow_dispatch' on a disabled workflow`. A label at 10:17:17Z and a push of `probe-a3/one` at 10:17:20Z each started the listener but not `probe disable`. After `gh workflow enable`, a label at 10:17:32Z started `probe disable` at 10:17:33Z.
- https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows — retrieved 2026-09-30: "Disabling a workflow allows you to stop a workflow from being triggered without having to delete the file from the repo."

**Consequence:** none now; the existing poller already has its own file.

### A4. Does GitHub's `…/new/<branch>?filename=…&value=…` link prefill a new file, and up to what length?

**Verdict:** `partly true` — it prefills, but only while the URL stays under roughly 7–9.5 KB.

**Answer:** Observed by the maintainer: values up to 6,000 characters (URL 7,151) prefilled. From 8,000 (URL 9,499), GitHub showed `Whoa there! Your request URL is too long.` Today's `harness-run.yml` template (URL 40,224) does not fit. Committing takes two clicks.

**Evidence:**
- Observation by the maintainer, 2026-09-30 ~10:10 UTC, links to `https://github.com/firu-daniel/harness-gate12/new/main?filename=.github%2Fworkflows%2Fprobe-a4.yml&value=<URL-encoded text>`: value 120 / 2,000 / 4,000 / 6,000 characters (URL 267 / 2,467 / 4,815 / 7,151) → the editor opened with filename and content filled. Value 8,000 and above (URL 9,499 and above), and the 24,207-character `harness-run.yml` template (URL 40,224) → `Whoa there! Your request URL is too long.` Committing the 120-character file: **Commit changes…**, then **Commit changes** in the dialog.

**Consequence:** none now.

### A5. Workflow templates, template repositories, and other ways to add a workflow without a checkout.

**Verdict:** `partly true` — workflow templates are documented only for organisations, and template repositories help only a repository created from them.

**Answer:** Workflow templates live in an organisation's `.github` repository and appear only in that organisation's **New workflow** picker. A template repository copies its files into a new repository. For an existing repository, what remains is the web editor (A4), a token with workflow permission (S2), or a codespace (A9).

**Evidence:**
- https://docs.github.com/en/actions/how-tos/reuse-automations/create-workflow-templates — retrieved 2026-09-30: "If it doesn't already exist, create a new  repository named `.github` in your organization." (the double space is the page's)
- https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-template-repository — retrieved 2026-09-30: "After you make your repository a template, anyone with access to the repository can generate a new repository with the same directory structure and files as your default branch."

**Consequence:** none now.

### A6. GitHub Apps: what one needs hosted, the *Workflows* permission, a thin relay, and hosting cost.

**Verdict:** `verified`, except the permission's UI wording.

**Answer:** Receiving webhooks needs a server, and minting installation tokens needs the app's private key. A relay app hosted by the harness could dispatch runs without holding any adopter's credential, but it would hold a key that reaches every installation. Hosting starts at $0 on Cloudflare Workers Free, capped at 10 ms CPU per request, or $4 a month for a droplet. The adopter's own workflows already receive issue, comment and review events without an app.

**Evidence:**
- https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/best-practices-for-creating-a-github-app — retrieved 2026-09-30: "The private key for your GitHub App grants access to every account that the app is installed on. It **must** be stored securely and never shared broadly."
- https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app — retrieved 2026-09-30: "If your app specifically needs to access or edit Actions files in the `.github/workflows` directory, request the "Workflows" repository permission."
- https://developers.cloudflare.com/workers/platform/pricing/ — retrieved 2026-09-30, Workers Free row: "100,000 per day | No charge for duration | 10 milliseconds of CPU time per invocation".

**Consequence:** none now. Triggers and control need no app, because workflows receive the events directly (T1, C1).

### A7. Copilot cloud agent, third-party coding agents on GitHub, Copilot Extensions.

**Verdict:** `partly true` — none documents a way to run this harness, and two details of the lead are dated.

**Answer:** All three run the vendor's agent under Copilot billing, now AI credits plus Actions minutes. None documents a custom plugin, permission profile or launch line. The third-party Claude agent "uses the Claude Agent SDK". Copilot Extensions were disabled on 2025-11-10.

**Evidence:**
- https://docs.github.com/en/copilot/concepts/agents/anthropic-claude — retrieved 2026-09-30: "The Anthropic Claude coding agent uses the Claude Agent SDK and can be powered by your existing Copilot subscription."
- https://github.blog/changelog/2025-09-24-deprecate-github-copilot-extensions-github-apps/ — retrieved 2026-09-30: "November 10, 2025: Full sunset—all Copilot Extensions disabled".

**Consequence:** none.

### A8. The Claude GitHub App: what it installs, its permissions, its credentials.

**Verdict:** `partly true` — the app itself installs nothing, but whether it holds *Workflows* write is stated both ways by Anthropic.

**Answer:** `/install-github-app` runs in the local CLI. It installs the app, saves `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` as a secret, and pushes a branch with `claude.yml` for a PR. On *Workflows*, code.claude.com lists "Read and write", while the action's FAQ says it has no workflow write access.

**Evidence:**
- https://code.claude.com/docs/en/github-actions#quick-setup — retrieved 2026-09-30: "Claude Code then pushes a branch with the workflow files you select, already set to use that secret, and opens GitHub in your browser with a pull request ready to create."
- https://code.claude.com/docs/en/github-actions#github-app-permissions — retrieved 2026-09-30, table row: "| Workflows | Read and write |".
- https://github.com/anthropics/claude-code-action/blob/main/docs/faq.md — retrieved 2026-09-30: "The GitHub App for Claude doesn't have workflow write access for security reasons."

**Consequence:** none.

### A9. GitHub Codespaces: `claude` with the plugin, sign-in, `setup-token`, pushing workflow files, cost, a README button.

**Verdict:** `partly true` — all of it works, except that a README button cannot target the adopter's repository.

**Answer:** Observed by the maintainer:
- **Create:** a default codespace on Gate 12 took about 1 minute and 4 clicks.
- **Plugin:** the plugin installed at user scope, and `/autonomous-sdlc-harness:branch-status` ran.
- **Sign-in:** `claude` signed in by copying a URL into the browser and pasting back a code. `claude setup-token` used the same flow and succeeded.
- **Workflow files:** the codespace's token pushed a workflow-file change (S2).
- **Cost:** a 2-core machine is $0.18 an hour past the included 120 hours (Free).
- **Link:** a `codespaces.new/OWNER/REPO` link opens the repository it names.

**Evidence:**
- Observation by the maintainer, Gate 12 codespace, 2026-09-30 10:31–10:45 UTC: plugin install exit 0. Sign-in ended with `Login successful. Press Enter to continue…`. `claude setup-token` printed `✓ Long-lived authentication token created successfully!`. Commit `91a9e70`, changing `.github/workflows/probe-listen.yml`, was pushed by the codespace's `GITHUB_TOKEN` (S2).
- https://docs.github.com/en/billing/concepts/product-billing/github-codespaces — retrieved 2026-09-30, table row: "Codespaces compute | 2 core | 1 hour | 2 | $0.18".
- https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/setting-up-your-repository/facilitating-quick-creation-and-resumption-of-codespaces — retrieved 2026-09-30: "Create a codespace for the default branch of the repository: `https://codespaces.new/OWNER/REPO-NAME`".

**Consequence:** none now; it was judged not worth it against the local install, which it would merely relocate.

### A10. Claude Code on the web (claude.ai/code).

**Verdict:** `unverified` — not researched, by the maintainer's decision.

**Answer:** The maintainer dropped this option on 2026-09-30, before any research, so as not to add a new entry point beyond GitHub.

**Evidence:**
- Maintainer's decision, planning session of this branch, 2026-09-30: "If A10 requires using `claude.ai/code`, we drop this option. We don't want to introduce a new entry point. We already have GitHub for some actions. Let's limit it to GitHub."

**Consequence:** none.

### A11. A subscription token without running the `claude` CLI anywhere.

**Verdict:** `verified` — no such route exists.

**Answer:** `claude setup-token` and `/install-github-app` are the only documented ways to mint a subscription token, and both run in the CLI. Anthropic forbids third parties from intermediating Claude.ai sign-in. A codespace can serve as the machine (A9). An API key needs no CLI.

**Evidence:**
- https://code.claude.com/docs/en/legal-and-compliance — retrieved 2026-09-30: "Moreover, developers may not collect, store, or intermediate Claude.ai credentials or session tokens — sign-in to a Claude account must complete through Anthropic's own flow."
- https://code.claude.com/docs/en/github-actions#manual-setup — retrieved 2026-09-30: "Generate one by running `claude setup-token` locally."

**Consequence:** none now. `docs/remote-execution.md` → `## 7. Turning it on`, step **4. Set a credential secret.**, already asks for `claude setup-token`.

### A12. The `.claude/**` sensitive-path wall on the current Claude Code, including Bash writes.

**Verdict:** `verified`

**Answer:** The wall is unchanged on 2.1.285. Under `claude -p … --permission-mode acceptEdits`, even with `Write(.claude/**)`, `Bash(printf:*)` and `Bash(cp:*)` allowed through `--settings`, three writes into `.claude/` were each refused as "a sensitive file": a `Write`, a `printf >` redirect and a `cp`. Each run exited 0 with nothing written. The same writes into `docs/` succeeded. Under `--dangerously-skip-permissions`, all three `.claude/` writes succeeded.

**Evidence:**
- Measurement, 2026-09-30 09:59–10:00 UTC, macOS (Darwin 24.6.0), `2.1.285 (Claude Code)`, model `haiku`, in a scratch git repository. The command, one step per invocation: `claude -p "<step>" --model haiku --output-format json --permission-mode acceptEdits --settings <profile>`. The profile allowed `Write(.claude/**)`, `Edit(.claude/**)`, `Bash(cp:*)` and `Bash(printf:*)`. The `Write`, `printf three > .claude/probe-bash.md` and `cp README.md .claude/probe-cp.md` steps each exited 0 with one `permission_denials` entry and wrote nothing. The Write result read `Claude requested permissions to edit <repo>/.claude/probe-write.md which is a sensitive file.` The three control writes into `docs/` exited 0 with `permission_denials: []`. With `--dangerously-skip-permissions`, all three `.claude/` writes succeeded.
- https://code.claude.com/docs/en/permission-modes#protected-paths — retrieved 2026-09-30: "`permissions.allow` rules in settings files do not pre-approve protected-path writes. The safety check runs before Claude Code evaluates allow rules from settings, so an entry such as `Edit(.claude/**)` in `~/.claude/settings.json` or `.claude/settings.json` does not change the per-mode outcome in the table above."

**Consequence:** none for the other two branches. `docs/analyze.md` → `## 3. What it may write` records the same wall on 2.1.237; this measurement extends it to 2.1.285 and to Bash. This branch does not edit that file.

## 5. Adoption routes compared

The count uses the unit `feat_github_native_adoption` set, from a repository with no harness file to a first run started by labelling an issue. One action is each click-through the adopter must choose, each paste or typed command, each commit, each secret, each setting and each merge. Navigating a form already counted is not counted again, and optional steps are left out. Counts are for an adopter with an Anthropic Console API key. A subscription token adds a codespace detour on every GitHub-side route (A11): create the codespace, install, `claude setup-token`, paste the URL, paste the code, then delete it. The detour replaces the route's *API key* action, so it adds 5 actions net, or 2 on R2, where the codespace is already open and the detour is only `claude setup-token`, the URL and the code.

| Route | Actions, in order | Count | Hosts anything? | Rests on |
|---|---|---|---|---|
| R1 Local install (today) | plugin marketplace add, plugin install, `init`, `config set execution.target`, `git add`, commit, `gh auth refresh -s workflow`, push, API key, secret, label an issue | 11 | no | `README.md`; [`remote-execution.md`](remote-execution.md) → `## 7. Turning it on` |
| R2 Codespace setup | create codespace, install Claude Code, plugin commands, sign-in URL, sign-in code, `init` + `config set`, commit, push, open PR, merge, API key, secret, delete codespace, label an issue | 14 | no | A9, S2 |
| R3 Prefilled thin callers + setup job | open link 1, commit, open link 2 (the poller needs its own file, A3), commit, API key, secret, PR setting (S4), **Run workflow** on setup, merge its PR, label an issue | 10 | no | A1, A3, A4, S1, S4 |
| R4 Workflow-scoped PAT + setup job | open link, commit, create fine-grained PAT, `HARNESS_GIT_TOKEN` secret, API key, secret, **Run workflow** on setup, merge its PR, label an issue | 9 | no | S1, S2, A4 |
| R5 Harness-hosted GitHub App | open install link, install, merge the app's setup PR, API key, secret, label an issue | 6 | yes: a server and a private key for every installation | A6 |
| R6 Adopter-registered GitHub App | register app, generate key, install, key secret, client-ID variable, open link, commit, API key, secret, **Run workflow** on setup, merge, label an issue | 12 | no | A6 |
| R7 Claude GitHub App | not applicable: installs `claude.yml`, not the harness | — | — | A8 |
| R8 Marketplace listing | not a route: a listing installs nothing; as R3 or R4 | — | — | A2 |
| R9 Workflow templates / template repository | not applicable to an existing repository of another owner | — | — | A5 |
| R10 Copilot agents; Claude Code on the web | not evaluated further: vendor agents (A7); dropped by decision (A10) | — | — | A7, A10 |

No GitHub-only route covers the supervised analysis (A12) or a subscription credential (A11) without a codespace, and a codespace setup (R2) costs more actions than the local install (R1). That is the finding `feat_github_native_adoption` was dropped on.

## 6. Leads this research refutes

A lead is listed here when its entry's evidence shows it wrong, wholly or in part; a lead that holds is not listed. The `feat_github_native_adoption` items are kept although that branch was dropped on 2026-09-30, so that its prompt is not revived with them.

1. **`feat_forge_run_control`**, *Leads* › *Opening PRs from a job*: *"A PR opened, or a push made, with `GITHUB_TOKEN` starts no other workflow, so the adopter's CI does not run on the draft PR."* True of the push. Since 2026-06-11 a PR opened with `GITHUB_TOKEN` creates `pull_request` runs that wait for a person with write access to approve them, measured as `action_required` ([S3](#s3-which-events-raised-with-github_token-start-other-workflows-and-which-do-not--pushes-pr-creation-comments-labels)).
2. **`feat_github_native_adoption`**, *Leads* › *Opening pull requests from a job*: *"Pushes and PRs made with `GITHUB_TOKEN` start no other workflow."* The same correction ([S3](#s3-which-events-raised-with-github_token-start-other-workflows-and-which-do-not--pushes-pr-creation-comments-labels)).
3. **`feat_github_native_adoption`**, *Leads* › *Workflow files and `GITHUB_TOKEN`*, candidate (a): *"It costs the adopter one more secret, and it expires"*. A fine-grained PAT may be created with no expiry unless an organisation policy caps it (the organisation default is 366 days), and a classic PAT's expiry is optional ([S2](#s2-which-tokens-can-write-workflow-files--a-fine-grained-pat-a-classic-pat-a-github-app-installation-token-a-codespaces-token-how-does-each-expire-and-how-is-each-created)).
4. **`feat_github_native_adoption`**, *Options to evaluate*: *"A reusable workflow or composite action published on the GitHub Actions Marketplace."* A reusable workflow cannot be published to the Marketplace; only an action (a composite action included) or an app can ([A2](#a2-github-marketplace-can-a-reusable-workflow-be-listed-or-only-an-action)).
5. **`feat_github_native_adoption`**, *Options to evaluate* › *A browser-hosted development environment: GitHub Codespaces*: *"A button in the harness README, or a `devcontainer.json` the setup adds, opens a Codespace on the adopter's repository."* A `codespaces.new` link opens the repository it names, so a button in the harness README opens the harness repository, not the adopter's. A `devcontainer.json` in the adopter's own repository is unaffected ([A9](#a9-github-codespaces-claude-with-the-plugin-sign-in-setup-token-pushing-workflow-files-cost-a-readme-button)).
6. **`feat_github_native_adoption`**, *Options to evaluate* › *A prefilled new-file link*: *"so adding the file is one click plus a commit"*. It holds only for a small file. From a URL of about 9.5 KB, GitHub returns `Whoa there! Your request URL is too long.`, which rules out today's 24 KB `harness-run.yml`. The commit is two clicks ([A4](#a4-does-githubs-newbranchfilenamevalue-link-prefill-a-new-file-and-up-to-what-length)).
7. **`feat_github_native_adoption`**, *Options to evaluate* › *Copilot and GitHub's agent integrations*: *"Copilot Extensions, which as far as is known are being retired in favour of MCP"*. They are already retired: disabled on 2025-11-10 ([A7](#a7-copilot-cloud-agent-third-party-coding-agents-on-github-copilot-extensions)).
8. **`feat_github_native_adoption`**, *Leads* › *Workflow files and `GITHUB_TOKEN`*, candidate (c): *"a GitHub App's installation token with the _Workflows_ permission, whether an app of the harness's own or Anthropic's Claude app"*. Anthropic's app is not a candidate. Its installation token can be minted only with Anthropic's private key, and its *Workflows* permission is stated both ways by Anthropic's own sources ([A6](#a6-github-apps-what-one-needs-hosted-the-workflows-permission-a-thin-relay-and-hosting-cost), [A8](#a8-the-claude-github-app-what-it-installs-its-permissions-its-credentials)).

### Removed by decision, not refuted

- **A10**, the *Claude Code on the web (claude.ai/code)* option of `feat_github_native_adoption`. The maintainer dropped it on 2026-09-30 so that adoption uses GitHub's own surfaces ([A10](#a10-claude-code-on-the-web-claudeaicode)).
