### Task 1 — Create `docs/github-integration-research.md` with its header, method section and the shared entries S1–S6

**Goal:** Create the research document with its who-reads paragraph, its `## How this was researched` section, and `## 1. Shared: GitHub Actions and tokens` holding the entries S1–S6, each in the entry shape the story index fixes, carrying exactly the verdicts, answers, evidence and consequences below.

**Where this task stops.** This task creates the file and writes headings 1, 2 and 4 of the story index's outline. It writes **no** `## Summary` (Task 6 inserts it after `## How this was researched`), no sections 2–6, and no placeholder for them: later tasks append their sections in outline order. The entry shape, and what a verdict grades, are the story index's.

**How this task's implementer reads the conventions.** Catch-all layer: read `.claude/context/conventions.md`. The rules that bind this file: `## Documents of record` → *"A measured fact states what was measured, the command and the exact message"*; `## What accompanies a new unit of each kind` → a prose document under `docs/` carries *"Its own statement of who reads it and what it owns"*; `## The testing bar` → the self-containment gate (*"nothing in this tree may name a location on the machine that wrote it"*).

### Targets

- `docs/github-integration-research.md` (new).

**Work:**

- [ ] Create the file. Its H1 is `# GitHub integration research`. The paragraph under it, in bold-lead form like `docs/remote-execution.md`'s opening (`**Who reads this:** …`), says: who reads it — the planners and reviewers of `feat_forge_run_triggers`, `feat_forge_run_control` and `feat_github_native_adoption`, and anyone checking a GitHub behaviour the remote path rests on; what it owns — the answers to those branches' open questions, each with its evidence, as of 2026-09-30; what it does not own — any design choice, which stays with those branches; and that an answer marked `verified` or `refuted` here is to be cited rather than re-verified, while one marked `unverified` stays open. Add one sentence saying it cites rather than restates `docs/remote-execution.md`, whose `### Verified in Gate 12 round 2` and `round 3` rows it does not repeat.
- [ ] Write `## How this was researched` from the *Method facts* block below: the dates, the three kinds of evidence, the environments with their versions, what a verdict grades (the story index's rule, in one sentence), and the statement that the Gate 12 run IDs, issue and PR numbers identify runs and objects that no longer exist once that repository is reset to its seed, so they identify the measurement rather than link to it.
- [ ] Write `## 1. Shared: GitHub Actions and tokens` and the entries S1, S2 and S3 from the finding blocks below, in the story index's entry shape.
- [ ] Write the entries S4, S5 and S6 from the finding blocks below.
- [ ] Re-read every quote in the file against this task file character for character, and grep the file for `/Users/`, `/private/`, `/tmp/` and `scratchpad` — none may appear.

### Method facts

- Research date: **2026-09-30**, every source retrieved that day. docs.github.com pages were read through the docs site's article-body endpoint `https://docs.github.com/api/article/body?pathname=<path>`, which serves the page's rendered text; the URL given with each quote is the page's own. Where a page's "Fine-grained access tokens" box is only in the rendered HTML (REST pages), the HTML page was read. Old docs paths redirect to new ones; the URL given is the current path.
- Three kinds of evidence: (1) a document fetched live, cited by URL, retrieval date, section heading and a verbatim quote; (2) a measurement run in the planning session; (3) an observation the maintainer made by hand (the prefilled-link check and the Codespaces session), recorded as they reported it and marked as such.
- Measurement environments:
  - **GitHub:** the private repository `firu-daniel/harness-gate12` on a personal account, created 2026-09-29T11:49:02Z, at its seed commit plus a probe commit that added five probe workflows (`probe-listen.yml`, which logs the event, its action, `sender` and whether a repository secret is present; `probe-token.yml`, which runs the `GITHUB_TOKEN` probes; `probe-disable.yml`; `probe-inputs-25.yml`; `probe-inputs-26.yml`). Jobs ran on `ubuntu-latest` (image `ubuntu-24.04`, version `20260828.587`, runner `2.337.0`). The maintainer's side used `gh version 2.100.0 (2026-09-03)` with an OAuth token whose scopes are `admin:public_key, gist, read:org, repo, write:ssh_signing_key` (no `workflow`), and `git version 2.50.1` over SSH.
  - **Claude Code:** `2.1.285 (Claude Code)` on macOS (Darwin 24.6.0), in a scratch git repository with one commit.
  - **Codespaces:** a codespace on `firu-daniel/harness-gate12`, default configuration (the repository has no `devcontainer.json`), default 2-core machine, 2026-09-30 10:31–10:45 UTC.
- The repository was reset to its seed after the measurements, so none of the run IDs, branches, issue #1 or PR #2 named in this document exist any more.

### Finding blocks

#### S1. Can `GITHUB_TOKEN` create or modify files under `.github/workflows/`, under any `permissions:` setting? What does a refused push print? Does a branch whose commits touch no workflow file push, when cut from a default branch that carries workflow files?

**Verdict:** `verified`

**Answer:** No `permissions:` setting lets `GITHUB_TOKEN` create or modify a workflow file. The `permissions` key has no `workflows` entry, `GITHUB_TOKEN` is a GitHub App installation token, and GitHub Apps need a separate "Workflows" permission for `.github/workflows`. Measured: under `permissions: write-all`, and under a job granting `contents`, `pull-requests`, `issues` and `actions` write, a push that modifies an existing workflow file or creates a new one is refused with `refusing to allow a GitHub App to create or update workflow … without \`workflows\` permission`, and the contents API refuses with HTTP 403. A branch cut from a default branch that carries five workflow files, whose commit touches no workflow file, pushes normally. The refusal string is GitHub's; docs.github.com does not quote it.

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
  - existing workflow modified → ` ! [remote rejected] HEAD -> probe/s1-modify-20260930T101152Z (refusing to allow a GitHub App to create or update workflow `.github/workflows/probe-listen.yml` without `workflows` permission)`, `exit=1`;
  - new `.github/workflows/probe-created.yml` → ` ! [remote rejected] HEAD -> probe/s1-create-20260930T101152Z (refusing to allow a GitHub App to create or update workflow `.github/workflows/probe-created.yml` without `workflows` permission)`, `exit=1`;
  - `gh api -X PUT repos/$REPO/contents/.github/workflows/probe-api.yml` → `{"message":"Resource not accessible by integration","documentation_url":"https://docs.github.com/rest/repos/contents#create-or-update-file-contents","status":"403"}`.

**Consequence:**
- `feat_forge_run_triggers`: its lead holds. A trigger job that cuts a branch from the default branch and commits only a task prompt pushes with `GITHUB_TOKEN`. The existing remote-run limit is confirmed: a run whose task edits a workflow file cannot push it without a workflows-capable `HARNESS_GIT_TOKEN`, and the push fails with the message above.
- `feat_github_native_adoption`: the open question it must settle first is settled — a setup or upgrade job running under `GITHUB_TOKEN` can never write `harness-run.yml`, `harness-resume.yml` or a trigger workflow, so the first workflow file always needs a person or a token with workflow permission (S2).

#### S2. Which tokens can write workflow files — a fine-grained PAT, a classic PAT, a GitHub App installation token, a Codespace's token? How does each expire, and how is each created?

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

#### S3. Which events raised with `GITHUB_TOKEN` start other workflows, and which do not — pushes, PR creation, comments, labels?

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

#### S4. The setting "Allow GitHub Actions to create and approve pull requests": its default for a new personal repository and a new organisation, where it is set, and whether a workflow can read it.

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

#### S5. `workflow_dispatch`: the limit on the number of inputs, and on the payload size (the code assumes 65,535 characters, `remote-run.sh` → `REMOTE_INPUT_PAYLOAD_MAX`).

**Verdict:** `verified`

**Answer:** At most 25 top-level inputs (raised from 10 on 2025-12-04); a workflow file declaring 26 is refused as unparsable at dispatch time and is listed by its path instead of its `name:`. The payload limit is 65,535 characters, counted over the whole inputs object serialised as compact JSON — keys, quotes and all inputs together — and counted in characters, not bytes. `remote-run.sh` → `dispatch` already measures `${#payload}` of that same compact object, so its check matches.

**Evidence:**
- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onworkflow_dispatchinputs — retrieved 2026-09-30 — `on.workflow_dispatch.inputs`: "The maximum number of top-level properties for `inputs` is 25 ." (the page renders the space before the period) and "The maximum payload for `inputs` is 65,535 characters."
- https://github.blog/changelog/2025-12-04-actions-workflow-dispatch-workflows-now-support-25-inputs/ — retrieved 2026-09-30: "You can now use up to 25 inputs on workflows triggered via the workflow_dispatch trigger. The previous limit was 10 which was challenging for the community."
- Measurement, Gate 12, 2026-09-30 10:04 UTC: `gh workflow list` listed the 26-input file as `.github/workflows/probe-inputs-26.yml` rather than by its `name:`. `gh workflow run probe-inputs-26.yml` → `could not create workflow dispatch event: HTTP 422: Invalid Argument - failed to parse workflow: you may only define up to 25 `inputs` for a `workflow_dispatch` event`. `gh workflow run probe-inputs-25.yml` → accepted.
- Measurement, Gate 12, 2026-09-30 10:05–10:25 UTC, `gh api -X POST repos/firu-daniel/harness-gate12/actions/workflows/probe-inputs-25.yml/dispatches -f ref=main -f "inputs[in1]=<value>"`, value `n` repetitions of one character:
  - `a` × 65,525 → accepted; `a` × 65,526 → `{"message":"inputs are too large.","documentation_url":"https://docs.github.com/rest/actions/workflows#create-a-workflow-dispatch-event","status":"422"}`. `{"in1":"…"}` adds 10 characters, so the accepted maximum is 65,535 characters of JSON.
  - two inputs of 40,000 `a` each → `inputs are too large.` (the limit is on the whole object).
  - `é` × 32,763 (65,536 bytes of JSON) → accepted; `é` × 65,525 (65,535 JSON characters, 131,060 bytes) → accepted; `é` × 65,526 → `inputs are too large.` (characters, not bytes).

**Consequence:**
- `feat_forge_run_control`: the 65,535-character limit it cites is right, and it applies to the whole inputs object, so a park answer posted as a comment and relayed as `answers` must fit together with the other inputs. The existing check in `remote-run.sh` is the one to reuse. A new `workflow_dispatch` input (the prompt's forge-reference candidate) takes one of the 25 slots; `harness-run.yml` declares 7 today (`docs/remote-execution.md` → `## 5.`).
- `feat_github_native_adoption`: a settings form built from `workflow_dispatch` inputs has at most 25 fields, and all its values together are capped at 65,535 characters.
- `docs/remote-execution.md` → `## 6.`'s row *"A `workflow_dispatch` inputs payload is limited to 65,535 characters"* is now measured. This branch does not edit that file; a later change can move the row.

#### S6. The maximum length of an issue or PR comment body.

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

**Verification:**

- The file exists, opens with `# GitHub integration research` and the who-reads paragraph, and holds `## How this was researched` then `## 1. Shared: GitHub Actions and tokens` with entries S1–S6, each with the four bold fields in the story index's order.
- Every quote matches this task file character for character.
- `grep -nE '/Users/|/private/|/tmp/|scratchpad' docs/github-integration-research.md` prints nothing.
- `git diff --stat` against the branch base lists only `docs/github-integration-research.md` among tracked files outside `harness-runs/`.
