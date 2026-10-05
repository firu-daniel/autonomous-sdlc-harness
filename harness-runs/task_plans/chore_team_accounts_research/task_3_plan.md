### Task 3 — Write §3, GitHub's side (G1–G9), and §4, what other agents do (O1–O4)

**Goal:** Fill `## 3. GitHub's side` and `## 4. What other agents do` in `docs/team-accounts-research.md`. §3: which Actions secrets exist and that none is per user; how the triggering actor is named, including on a re-run; the four patterns that map an actor to their own credential, each with its security cost; who can read a secret by changing a workflow, and what `GITHUB_TOKEN` permissions and environment protection change about it; the organisation-level controls; and `HARNESS_GIT_TOKEN` as per-member fine-grained tokens against a GitHub App installation token. §4: how GitHub Copilot's cloud agent and the third-party agents on GitHub bill and attribute a session a team member starts, and how Claude Code on the web and Anthropic's Code Review attribute usage in a team. Every claim comes from `### Evidence` below.

**Depends on:** Task 1, which creates `docs/team-accounts-research.md`, its entry shape (`**Status:**`, `**Answer:**`, `**Inference:**`, `**Evidence:**`) and the placeholder headings `## 3. GitHub's side` and `## 4. What other agents do`, each carrying `_Written by a later task of this branch._`; this task replaces those two lines and touches no other section. Task 2 owns §2: cite `R6` for workload identity federation and `R7` for `claude-code-action`, never re-quote them; P2 and P4 are Task 1's.

**Where this task stops.** It records what GitHub and the agents' vendors document, and the inferences the evidence marks. The harness's own facts — which token dispatches `harness-run.yml`, on which ref, and what `authorise_actor` checks — are Task 4's §5, which reads them from this repository; G-entries may name a harness workflow only where `github-integration-research.md` or `remote-execution.md` already states the fact, cited by ID or section.

### Targets

- `docs/team-accounts-research.md` — `## 3. GitHub's side` and `## 4. What other agents do`.

**Work:**

- [ ] **§3, G1–G3.** **G1. Secret scopes, names and limits; no per-user Actions secret** (evidence the *GitHub Actions secrets* evidence 1.1–1.4: organisation, repository and environment scopes; Codespaces user secrets a separate store — the "not available to Actions" reading is **Inference**; names `[A-Za-z0-9_]`, case-insensitive, so a login with `-` cannot be a name component as is, which favours `actor_id`; the counts and the 48 KB size). **G2. `github.actor` against `github.triggering_actor`, and re-runs** (2.0: a re-run keeps `actor` and its privileges, so a credential chosen by `actor` lets member B's re-run spend member A's — **Inference**, with the evidence's two remedies). **G3. One environment per member, holding that member's secret** (2a: the `environment` name may be an expression over `github`; a missing environment is created empty and the secret reads as an empty string, so it does not fail closed; required reviewers, prevent-self-review, admin bypass, deployment branch rules, custom rules in preview, plan availability for private repositories; and the security cost the evidence states).
- [ ] **§3, G4–G6.** **G4. One secret per login, chosen by an expression** (2b: computed indexing of `secrets` is **Not documented** either way and needs a live test; secrets are unavailable in `if:`; redaction "is not guaranteed"). **G5. An external secret store through OIDC** (2c: the OIDC claims — `actor`, `actor_id`, `environment`, `event_name`, `job_workflow_ref`, `workflow_ref`, `ref`, and no `triggering_actor`; Vault's `bound_claims` on `actor`; AWS's documented limits on custom claims; cite `R6` as the Anthropic-side analogue). **G6. One self-hosted runner per member** (2d: labels are not access control; persistence; runner-group workflow restriction documented only for Enterprise Cloud; cite `remote-execution.md` → `## 11. Security` for the harness's existing warning).
- [ ] **§3, G7–G9.** **G7. Who can read a secret by changing a workflow** (3: "Any user with write access to your repository has read access to all secrets configured in your repository."; the events table for `workflow_dispatch`, `pull_request_review`, `issues`, `issue_comment`, `repository_dispatch` as the evidence gives it; the **Inference** that a writer runs an edited workflow by `workflow_dispatch --ref <branch>` or by a review on a same-repository pull request; deployment branch rules matched against `GITHUB_REF`; `permissions:` scoping only `GITHUB_TOKEN` — **Not documented** that it restricts secrets; fork pull requests getting no secret, citing `github-integration-research.md` → C2). **G8. Organisation-level controls** (4: secret visibility by repository, push rulesets restricting `.github/workflows/**`, CODEOWNERS gating merges only, required workflows). **G9. `HARNESS_GIT_TOKEN`: per-member fine-grained tokens against a GitHub App installation token** (the *GitHub tokens and Copilot* evidence Q1, 1a–1g: authorship — a PAT acts as its owner, an App token as `<app>[bot]`, commit attribution by the commit's email; "Pull request authors cannot approve their own pull requests"; **Not documented:** that an author cannot *request changes* on their own pull request — say plainly that `github-run-control.md` → `## 4. The draft pull request` and `## 8. What is not verified here` state that rule, that this research found no GitHub page stating it, and that it stays a live-test question; which tokens' pushes start workflows, citing `github-integration-research.md` → S3; the rate limits; organisation and enterprise PAT policies; minting an App token with `actions/create-github-app-token` and the one-hour expiry; GitHub's Terms on machine accounts, quoted).
- [ ] **§4, O1–O4.** **O1. GitHub Copilot cloud agent: billing and attribution for a session a team member starts** (Q2 2a–2c of the *GitHub tokens and Copilot* evidence: AI credits since June 1, 2026 and the legacy premium requests before them — say which is current and quote the legacy page as legacy; Business and Enterprise credits pooled per billing entity with per-user budgets; Actions minutes charged to the repository owner — the cloud-agent pages do not name the owner, so that link is **Inference**; automations billed to their creator; commits authored by Copilot with the requester as co-author; the requester cannot approve; the extra approval for an unattributed Copilot pull request; off by default on Business and Enterprise). **O2. Third-party agents on GitHub (Claude and Codex)** (2d: preview status, AI credits plus Actions minutes, the hidden `anthropic code agent` App; **Not documented:** who authors their pull requests). **O3. Claude Code on the web** and **O4. Anthropic's Code Review** (the *Claude Code on the web and Code Review* evidence Q4, 4.1–4.4: cloud sessions "always use your subscription credentials", plan availability, GitHub access through the user's own token behind a proxy, auto-fix replies under the user's name, **Not documented:** who authors a cloud session's pushes and pull requests, with the evidence's INFERENCE; Code Review's preview status, per-review cost and organisation-level billing as quoted, and what is not documented about attribution).
- [ ] Close §4 with a short **Inference** paragraph stating the contrast the maintainer asked about while planning, in the evidence's terms only: Copilot can charge the person who started a session because GitHub is both where the session is started and the AI provider, so it knows who assigned the task; a GitHub Actions job running `claude` reaches Anthropic with whatever credential the workflow holds, and Anthropic sees that credential, not the GitHub user (cite `R7`'s **Not documented** per-user model and `G1`). Name O3 as the Anthropic surface that is per person, and that it runs on Anthropic's machines rather than in the adopter's workflows.

**Verification:**

- Every quote, number, claim name and plan name in §3 and §4 appears in `### Evidence` below; grep each against this file.
- G9 states the request-changes rule as **Not documented**, naming the two `github-run-control.md` sections that assert it.
- O1 names AI credits as current and premium requests as legacy, with the date June 1, 2026 as the evidence gives it.
- No sentence in §3 or §4 recommends a pattern or describes a change to a harness file.
- `grep -nE '/Users/|/home/|/private/|/tmp/' docs/team-accounts-research.md` finds nothing. Then `bash scripts/test.sh`, run without a pipe, fails no gate that does not also fail on the branch's base commit: gate 6a (*no machine paths*) is red in this self-adopted checkout by design (`scripts/run-gates.sh` → the comment above gate 6e), so compare its hits, and no hit may name a file this branch wrote.
- **Deviations from plan:** the `bash scripts/test.sh` run in the last Verification bullet was not carried out by the implementer — deferred to the Run gates phase under `unit_loop_core.md` → `## The test-run rule`. The machine-path `grep` was run and found nothing, and `bash scripts/typecheck.sh` passed. The quote-against-evidence check rests on the implementer's reading of each quote against `### Evidence`, not on an automated grep of every quote.

### Evidence

The planning session's research for this task, recorded on 2026-10-02 in three parts: GitHub Actions secrets and per-member credentials (the *GitHub Actions secrets* evidence); GitHub tokens for the harness and Copilot cloud agent billing (the *GitHub tokens and Copilot* evidence); and Claude Code on the web and Code Review (the *Claude Code on the web and Code Review* evidence, its Q4 and its pages-checked list). Headings are demoted so they nest under this file; the text is otherwise unchanged. **INFERENCE** and **SILENT** lines are the researchers' labels and carry over as **Inference** and **Not documented**.

#### GitHub Actions secrets and per-member credentials: primary-source findings

All sources retrieved 2026-10-02 from docs.github.com. Text was pulled through the article-body endpoint (`https://docs.github.com/api/article/body?pathname=/en/<path>`); each finding cites the page's canonical URL, which was resolved by following redirects from the legacy paths. Quotes are verbatim. **INFERENCE** marks a conclusion that the docs do not state outright. **SILENT** marks a question the checked pages do not answer.

Context: a workflow runs Claude Code with `CLAUDE_CODE_OAUTH_TOKEN` / `ANTHROPIC_API_KEY`. It is triggered by `workflow_dispatch`, `issues` (labeled), `repository_dispatch`, `issue_comment` and `pull_request_review` (submitted). The goal is for each member's runs to use that member's own credential.

---

##### 1. Secret scopes, limits, naming

###### 1.1 Scopes: organization, repository, environment. No per-user Actions secrets

**F1.1a**: https://docs.github.com/en/actions/concepts/security/secrets ("Secrets", § About secrets)
> "Secrets allow you to store sensitive information in your organization, repository, or repository environments. Secrets are variables that you create to use in GitHub Actions workflows in an organization, repository, or repository environment."

This names exactly three Actions secret scopes: organization, repository and environment (plus enterprise in the naming rules, F1.3).

**F1.1b**: https://docs.github.com/en/actions/concepts/security/secrets (§ About secrets)
> "GitHub Actions can only read a secret if you explicitly include the secret in a workflow."

**F1.1c**: https://docs.github.com/en/actions/reference/security/secrets ("Secrets reference", § Naming your secrets)
> "If a secret with the same name exists at multiple levels, the secret at the lowest level takes precedence. For example, if an organization-level secret has the same name as a repository-level secret, then the repository-level secret takes precedence. Similarly, if an organization, repository, and environment all have a secret with the same name, the environment-level secret takes precedence."

**Per-user Actions secrets: SILENT, and none exist.** No checked page describes a user-scoped Actions secret. The only scopes listed are org, repo and environment (F1.1a). Pages checked: concepts/security/secrets, reference/security/secrets, how-tos/.../use-secrets, reference/workflows-and-actions/contexts (`secrets` context), reference/workflows-and-actions/deployments-and-environments. **INFERENCE**: GitHub has no per-user Actions secret store.

**F1.1d (Codespaces user secrets)**: https://docs.github.com/en/codespaces/managing-your-codespaces/managing-your-account-specific-secrets-for-github-codespaces ("Managing your account-specific secrets for GitHub Codespaces", § About secrets for GitHub Codespaces)
> "You can add development environment secrets to your personal account that you want to use in your codespaces."
> "You can choose which repositories should have access to each secret. Then, you can use the secret in any codespace you create for a repository that has access to the secret."

Same page, § Using secrets:
> "A development environment secret is exported as an environment variable into the user's terminal session."

This establishes that user-scoped secrets exist only for Codespaces, and they are delivered into a codespace's terminal session.

**Whether Codespaces user secrets reach Actions: SILENT.** The page does not say in so many words that they are unavailable to Actions. A docs.github.com search for that statement found nothing. **INFERENCE (strong)**: they are not available to Actions. The Actions `secrets` context is defined as secrets "available to a workflow run" (F1.1e), and the Actions scopes listed in F1.1a do not include user-level secrets.

**F1.1e**: https://docs.github.com/en/actions/reference/workflows-and-actions/contexts ("Contexts reference", § `secrets` context)
> "The `secrets` context contains the names and values of secrets that are available to a workflow run. The `secrets` context is not available for composite actions due to security reasons."

**F1.1f (Dependabot secrets)**: https://docs.github.com/en/code-security/dependabot/troubleshooting-dependabot/troubleshooting-dependabot-on-github-actions ("Troubleshooting Dependabot on GitHub Actions", § Accessing secrets)
> "When a Dependabot event triggers a workflow, the only secrets available to the workflow are Dependabot secrets. GitHub Actions secrets are **not available**."
> "Dependabot secrets are added to the `secrets` context and referenced using exactly the same syntax as secrets for GitHub Actions."

Dependabot secrets are a separate store, used only for Dependabot-triggered runs. They are not per-user.

**F1.1g**: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets ("Using secrets in GitHub Actions", § Using secrets in a workflow)
> "With the exception of `GITHUB_TOKEN`, secrets are not passed to the runner when a workflow is triggered from a forked repository."
> "Secrets are not available to workflows triggered by Dependabot events."

###### 1.2 Who can create secrets

**F1.2a**: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets (§ Creating secrets for a repository)
> "To create secrets or variables on GitHub for an organization repository, you must have `write` access. For a personal account repository, you must be a repository collaborator."

**F1.2b**: same page, § Creating secrets for an environment
> "To create secrets or variables for an environment in a personal account repository, you must be the repository owner. To create secrets or variables for an environment in an organization repository, you must have `admin` access."

**F1.2c**: same page, § Creating secrets for an organization
> "Organization-level secrets and variables are not accessible by private repositories for GitHub Free."

###### 1.3 Naming rules: hyphens are not allowed, so a raw GitHub login cannot be a secret-name component

**F1.3a**: https://docs.github.com/en/actions/reference/security/secrets (§ Naming your secrets)
> "The following rules apply to secret names:
> * Can only contain alphanumeric characters (`[a-z]`, `[A-Z]`, `[0-9]`) or underscores (`_`). Spaces are not allowed.
> * Must not start with the `GITHUB_` prefix.
> * Must not start with a number.
> * Are case insensitive when referenced. GitHub stores secret names as uppercase regardless of how they are entered.
> * Must be unique to the repository, organization, or enterprise where they are created."

**F1.3b (login character set)**: https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/iam-configuration-reference/username-considerations-for-external-authentication ("Username considerations for external authentication")
> "Usernames for user accounts on GitHub can only contain alphanumeric characters and dashes (`-`)."

**INFERENCE**: logins may contain `-`, and secret names may not. A name such as `CLAUDE_TOKEN_<login>` therefore needs the login mapped first, for example `-` to `_`, with case folded because names are stored uppercase. The mapping is not guaranteed injective: `a-b` and `a_b` cannot both be ordinary logins, but Enterprise Managed User logins carry an `_SHORTCODE` suffix, so `_` does occur in some logins. Keying on `github.actor_id`, which is numeric, avoids this. The name must still not start with a digit, so a prefix such as `CLAUDE_TOKEN_1234567` is needed.

###### 1.4 Limits and size

**F1.4a**: https://docs.github.com/en/actions/reference/security/secrets (§ Limits for secrets)
> "You can store up to 1,000 organization secrets, 100 repository secrets, and 100 environment secrets."
> "A workflow created in a repository can access the following number of secrets:
> * All 100 repository secrets.
> * If the repository is assigned access to more than 100 organization secrets, the workflow can only use the first 100 organization secrets (sorted alphabetically by secret name).
> * All 100 environment secrets."
> "Secrets are limited to 48 KB in size."

**F1.4b**: same page, § When GitHub Actions reads secrets
> "Organization and repository secrets are read when a workflow run is queued, and environment secrets are read when a job referencing the environment starts."

**INFERENCE**: per-login repository secrets cap the team at about 100 members per repository, minus any other repository secrets. Environment secrets are limited per environment, so one environment per member scales with the number of environments. **SILENT**: no environment-count limit was found on the pages checked, apart from the name length in F2a.3.

---

##### 2. Mapping the triggering actor to that member's credential

###### 2.0 `github.actor` and `github.triggering_actor`, and re-runs

**F2.0a**: https://docs.github.com/en/actions/reference/workflows-and-actions/contexts (§ `github` context)
> `github.actor`: "The username of the user that triggered the initial workflow run. If the workflow run is a re-run, this value may differ from `github.triggering_actor`. Any workflow re-runs will use the privileges of `github.actor`, even if the actor initiating the re-run (`github.triggering_actor`) has different privileges."
> `github.actor_id`: "The account ID of the person or app that triggered the initial workflow run. For example, `1234567`. Note that this is different from the actor username."
> `github.triggering_actor`: "The username of the user that initiated the workflow run. If the workflow run is a re-run, this value may differ from `github.actor`. Any workflow re-runs will use the privileges of `github.actor`, even if the actor initiating the re-run (`github.triggering_actor`) has different privileges."

**F2.0b**: https://docs.github.com/en/actions/how-tos/manage-workflow-runs/re-run-workflows-and-jobs ("Re-running workflows and jobs", intro)
> "Re-runs use the privileges of the actor who initially triggered the workflow, not the privileges of the actor who initiated the re-run. The workflow will also use the same `GITHUB_SHA` (commit SHA) and `GITHUB_REF` (git ref) of the original event that triggered the workflow run."
> "A workflow run can be re-run a maximum of 50 times."

**F2.0c**: https://docs.github.com/en/actions/reference/workflows-and-actions/variables ("Variables reference")
> `GITHUB_TRIGGERING_ACTOR`: "The username of the user that initiated the workflow run. If the workflow run is a re-run, this value may differ from `github.actor`. ..."

**INFERENCE (security-relevant)**: if the credential is selected by `github.actor`, member B can re-run member A's run, and that re-run spends A's credential because `actor` stays A. Selecting by `github.triggering_actor` follows whoever clicked re-run. A per-member design should either select on `triggering_actor`, or refuse to run when `triggering_actor != actor`, for example with a job-level `if:` (`jobs.<id>.if` can read the `github` context, per F2b.3).

###### 2a. One environment per member, holding that member's secret

**F2a.1 (environment name may be an expression)**: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax ("Workflow syntax for GitHub Actions", § `jobs.<job_id>.environment`)
> "The value of `name` can be an expression. Allowed expression contexts: `github`, `inputs`, `vars`, `needs`, `strategy`, and `matrix`."
> Example: `environment:\n  name: ${{ github.ref_name }}`

The contexts table in "Contexts reference" (§ Context availability) agrees: `jobs.<job_id>.environment` takes `github, needs, strategy, matrix, vars, inputs`. **INFERENCE**: `environment: { name: ${{ github.triggering_actor }} }` or `name: ${{ format('claude-{0}', github.actor) }}` is documented-legal. Environment names are case-insensitive (F2a.3), so login casing does not matter.

**F2a.2 (protection rules gate the job)**: same page, same §
> "All deployment protection rules must pass before a job referencing the environment is sent to a runner."
> "Set `deployment` to `false` to use an environment's secrets and variables without creating a deployment object." … "Setting `deployment: false` is not compatible with custom deployment protection rules."

**F2a.3 (create and name; a missing environment is auto-created with no rules)**: https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments ("Managing environments for deployment", § Creating an environment)
> "To configure an environment in a personal account repository, you must be the repository owner. To configure an environment in an organization repository, you must have `admin` access."
> "Environment names are not case sensitive. An environment name may not exceed 255 characters and must be unique within the repository."
> "Running a workflow that references an environment that does not exist will create an environment with the referenced name. ... Otherwise, the newly created environment will not have any protection rules or secrets configured. Anyone that can edit workflows in the repository can create environments via a workflow file, but only repository admins can configure the environment."

**INFERENCE**: a dynamic name for a login with no configured environment silently creates an empty environment. The job then runs with an empty secret, since F2b.4 says an unset secret evaluates to an empty string. It does not fail closed by itself, so the workflow should check that the secret is non-empty.

**F2a.4 (required reviewers, prevent self-review)**: https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments ("Deployments and environments", § Required reviewers)
> "Use required reviewers to require a specific person or team to approve workflow jobs that reference the environment. You can list up to six users or teams as reviewers. The reviewers must have at least read access to the repository. Only one of the required reviewers needs to approve the job for it to proceed."
> "You also have the option to prevent self-reviews for deployments to protected environments. If you enable this setting, users who initiate a deployment cannot approve the deployment job, even if they are a required reviewer."
> "If you are on a GitHub Free, GitHub Pro, or GitHub Team plan, required reviewers are only available for public repositories."

**F2a.5 (approval and admin bypass)**: https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/review-deployments ("Reviewing deployments")
> "To approve the job, click **Approve and deploy**. Once a job is approved (and any other deployment protection rules have passed), the job will proceed. At this point, the job can access any secrets stored in the environment."
> "If the targeted environment is configured to prevent self-approvals for deployments, you will not be able to approve a deployment from a workflow run you initiated."
> § Bypassing deployment protection rules: "You cannot bypass deployment protection rules if the environment has been configured to prevent admins from bypassing configured protection rules."

Also https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments (§ Allow administrators to bypass configured protection rules):
> "By default, administrators can bypass the protection rules and force deployments to specific environments."

**INFERENCE (who can approve)**: the up-to-6 listed users or teams, any one of whom is enough, plus admins unless bypass is disabled. With per-member environments, the natural setting is "required reviewer = that member" with prevent-self-review off. That turns every run into a manual approval by the member, which defeats unattended runs. Prevent-self-review would stop the member from approving their own run.

**F2a.6 (deployment branches and tags)**: same page, § Deployment branches and tags
> "**Selected branches and tags:** Only branches and tags that match your specified name patterns can deploy to the environment."
> "The deployment branch or tag rule is matched against the `GITHUB_REF` of the workflow run. ... Adding another branch rule for `refs/pull/*/merge` would also allow workflows triggered by `pull_request` events to deploy to the environment."
> "**Protected branches only:** Only branches with branch protection rules enabled can deploy to the environment. If no branch protection rules are defined for any branch in the repository, then all branches can deploy."
> "Deployment branches and tags are available for all public repositories. For users on GitHub Pro or GitHub Team plans, deployment branches and tags are also available for private repositories."

**F2a.7 (custom protection rules)**: same page, § Custom deployment protection rules
> "Custom deployment protection rules are currently in public preview and subject to change."
> "You can enable your own custom protection rules to gate deployments with third-party services."
> "Custom deployment protection rules are only available for public repositories for users on GitHub Free, GitHub Pro, and GitHub Team plans."
> § Deployment protection rules: "a maximum of 6 deployment protection rules can be enabled on any environment at the same time."

**INFERENCE**: a custom protection-rule GitHub App could auto-approve only when the run's actor matches the environment's owner. That would enforce the per-member binding server-side without manual approval. The docs do not describe this specific check.

**F2a.8 (environment secrets, plan availability, self-hosted caveat)**: same page, § Environment secrets
> "Secrets stored in an environment are only available to workflow jobs that reference the environment. If the environment requires approval, a job cannot access environment secrets until one of the required reviewers approves it."
> "Workflows that run on self-hosted runners are not run in an isolated container, even if they use environments. Environment secrets should be treated with the same level of security as repository and organization secrets."
> "If you are using GitHub Free, environment secrets are only available in public repositories. For access to environment secrets in private or internal repositories, you must use GitHub Pro, GitHub Team, or GitHub Enterprise."

**Security cost (INFERENCE)**: without a protection rule, any writer can set `environment: <other-member>` in a modified workflow and read that member's secret. Only required reviewers or a branch restriction (F3) close that. Required reviewers on private repositories need GitHub Enterprise.

###### 2b. One secret per login, selected by expression (`secrets[format('CLAUDE_TOKEN_{0}', github.actor)]`)

**F2b.1 (index syntax exists for contexts)**: https://docs.github.com/en/actions/reference/workflows-and-actions/contexts (§ Available contexts)
> "As part of an expression, you can access context information using one of two syntaxes.
> * Index syntax: `github['sha']`
> * Property dereference syntax: `github.sha`"
> "If you attempt to dereference a nonexistent property, it will evaluate to an empty string."

**F2b.2**: https://docs.github.com/en/actions/reference/workflows-and-actions/expressions ("Evaluate expressions in workflows and actions", § Operators): the table lists `` `[ ]` `` = "Index". § format:
> "`format( string, replaceValue0, replaceValue1, ..., replaceValueN)` Replaces values in the `string`, with the variable `replaceValueN`."

**Dynamic indexing of `secrets` (for example `secrets[format(...)]`): SILENT.** No checked page shows or forbids bracket indexing of `secrets` with a computed key. A full-text search of every fetched page for the literal `secrets[` found no hits. The `secrets` context is documented only as `secrets.<secret_name>` (§ `secrets` context). Pages checked: contexts, expressions, workflow-syntax, use-secrets, reference/security/secrets, concepts/security/secrets, secure-use. **INFERENCE**: the general index operator on contexts (F2b.1, F2b.2) suggests it evaluates, but this is not a documented guarantee and needs an empirical test. Two consequences hold either way. All repository and org secrets are already loaded at queue time (F1.4b). An unknown key returns an empty string (F2b.1, F2b.4), so the lookup does not fail closed.

**F2b.3 (where `secrets` may be used)**: same contexts page, § Context availability table. `secrets` is allowed in `env`, `jobs.<job_id>.env`, `jobs.<job_id>.steps.env`, `.steps.with`, `.steps.run` and `jobs.<job_id>.secrets.<secrets_id>`. It is **not** allowed in `jobs.<job_id>.if`, `jobs.<job_id>.steps.if`, `jobs.<job_id>.environment` or `runs-on`.

**F2b.4**: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets (§ Using secrets in a workflow)
> "Secrets cannot be directly referenced in `if:` conditionals. Instead, consider setting secrets as job-level environment variables, then referencing the environment variables to conditionally run steps in the job."
> "If a secret has not been set, the return value of an expression referencing the secret (such as `${{ secrets.SuperSecret }}` in the example) will be an empty string."

**F2b.5 (redaction is best-effort)**: https://docs.github.com/en/actions/concepts/security/secrets (§ Automatically redacted secrets)
> "GitHub Actions automatically redacts the contents of all GitHub secrets that are printed to workflow logs."
> "Because there are multiple ways a secret value can be transformed, this redaction is not guaranteed. Additionally, the runner can only redact secrets used within the current job."

And https://docs.github.com/en/actions/reference/security/secure-use ("Secure use reference", § Use secrets for sensitive information):
> "Redacting of secrets is performed by your workflow runners. This means a secret will only be redacted if it was used within a job and is accessible by the runner."
> "Structured data can cause secret redaction within logs to fail, because redaction largely relies on finding an exact match for the specific secret value."

And the contexts page, § `secrets` context:
> "If a secret is used in a workflow job, GitHub automatically redacts secrets printed to the log. You should avoid printing secrets to the log intentionally."

**Security cost (INFERENCE)**: this is the weakest pattern. Every member's token sits in one repository-scoped pool. Any writer who edits the workflow, on any branch reachable by `workflow_dispatch` or `pull_request_review` (F3), can reference `secrets.CLAUDE_TOKEN_OTHERMEMBER` directly. Redaction only hides printed values. Sending a value to a remote host, or transforming it, defeats redaction.

###### 2c. External secret store through OIDC (`id-token: write`)

**F2c.1 (permission)**: https://docs.github.com/en/actions/reference/security/oidc ("OpenID Connect reference", § Workflow permissions for the requesting the OIDC token)
> "The job or workflow must grant the `id-token: write` permission to allow GitHub's OIDC provider to create a JSON Web Token (JWT)"
> "Without `id-token: write`, the OIDC JWT ID token cannot be requested. This setting only enables fetching and setting the OIDC token; it does not grant write access to other resources."

**F2c.2 (claims)**: same page, § Custom claims provided by GitHub
> `actor`: "The personal account that initiated the workflow run."
> `actor_id`: "The ID of personal account that initiated the workflow run."
> `environment`: "The name of the environment used by the job. If the `environment` claim is included (also via `include_claim_keys`), an environment is required and must be provided."
> `event_name`: "The name of the event that triggered the workflow run. OIDC tokens requested for Dependabot update jobs use `dynamic` as the value."
> `job_workflow_ref`: "For jobs using a reusable workflow, the ref path to the reusable workflow."
> `repository`: "The repository from where the workflow is running."
> `workflow_ref`: "The ref path to the workflow. For example, `octocat/hello-world/.github/workflows/my-workflow.yml@refs/heads/my_branch`."
> `ref`: "*(Reference)* The git ref that triggered the workflow run."
> `runner_environment`: "The type of runner used by the job. Accepts the following values: `github-hosted` or `self-hosted`."

Full custom-claim list on that page: actor, actor_id, base_ref, check_run_id, environment, event_name, head_ref, job_workflow_ref, job_workflow_sha, ref, ref_type, repository_visibility, repository, repository_id, repository_owner, repository_owner_id, repo_property_*, run_id, run_number, run_attempt, runner_environment, workflow, workflow_ref, workflow_sha. The live discovery document at https://token.actions.githubusercontent.com/.well-known/openid-configuration (fetched 2026-10-02) lists `actor`, `actor_id`, `environment`, `job_workflow_ref`, `event_name`, `ref_protected`, `run_attempt` and others in `claims_supported`. There is **no `triggering_actor` claim**.

**F2c.3 (trust conditions; at least one is required)**: same page, § OIDC claims used to define trust conditions on cloud roles
> "Audience and subject claims are typically used in combination while setting conditions on the cloud role/resources to scope its access to the GitHub workflows."
> "There are also many additional claims supported in the OIDC token that can be used for setting these conditions."
> "To control how your cloud provider issues access tokens, you **must** define at least one condition, so that untrusted repositories can't request access tokens for your cloud resources."

**F2c.4 (customizing `sub`)**: same page, § Customizing the subject claims for an organization or repository
> "To help improve security, compliance, and standardization, you can customize the standard claims to suit your required access conditions."
> "To configure these settings on GitHub, admins use the REST API to specify a list of claims that must be included in the subject (`sub`) claim."

And https://docs.github.com/en/rest/actions/oidc: `include_claim_keys`: "Array of unique strings. Each claim key can only contain alphanumeric characters and underscores."

**Whether `actor` is allowed in `include_claim_keys`: SILENT.** The page's examples use repository_owner, repository_visibility, job_workflow_ref, repo, context, repository_id, repository_owner_id, environment and repo_property_*. **INFERENCE**: `actor` and `actor_id` are listed custom claims, so they are plausibly accepted.

**F2c.5 (Vault: conditions on arbitrary claims; `user_claim: actor`)**: https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-hashicorp-vault ("Configuring OpenID Connect in HashiCorp Vault", § Adding the identity provider to HashiCorp Vault)
> ```
> "role_type": "jwt",
> "user_claim": "actor",
> "bound_claims": {
>   "repository": "user-or-org-name/repo-name"
> },
> ```
> "To check arbitrary claims in the received JWT payload, the `bound_claims` parameter contains a set of claims and their required values."

**INFERENCE**: a Vault role per member with `bound_claims: {repository: ..., actor_id: "<id>"}`, or a templated policy keyed on `user_claim`, can release only that member's secret. This is the documented route to condition directly on actor.

**F2c.6 (AWS: subject-based, no custom claims)**: https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws ("Configuring OpenID Connect in Amazon Web Services")
> "Support for custom claims for OIDC is unavailable in AWS."
> "Edit the trust policy, adding the `sub` field to the validation conditions."

**INFERENCE**: in AWS, `actor` is reachable only by customizing `sub` to include it (F2c.4). This is undocumented for `actor`. Alternatively, `sub` can carry `environment:<member>` (F2c.7), which combines with pattern 2a.

**F2c.7 (environment in the default `sub`)**: https://docs.github.com/en/actions/reference/security/oidc (§ Filtering for a specific environment)
> "The subject claim includes the environment name when the job references an environment."
> "Syntax: `repo:ORG-NAME/REPO-NAME:environment:ENVIRONMENT-NAME`"

**F2c.8 (GCP and Azure)**: https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-google-cloud-platform: "2. Configure the mapping and add conditions." The Azure page (…/oidc-in-azure) only defers to the OIDC reference for conditions. **SILENT** on actor-specific conditions for both. The detail lives in each provider's own documentation, which is not a GitHub primary source.

**Security cost (INFERENCE)**: GitHub sets `actor` from the event, and workflow YAML cannot forge it. A writer who edits the workflow can therefore only obtain a token bound to their own actor, which is the strongest of the four patterns. Caveats:
- re-runs keep the original `actor` (F2.0b), so member B re-running A's run gets a token as A;
- any step in the job can read the fetched credential, so a modified workflow can still exfiltrate the actor's own credential;
- the store must also bind `repository` and ideally `workflow_ref` / `job_workflow_ref` / `ref`, so that the same member cannot use it from an arbitrary repository or branch;
- trigger events whose actor is not the member need thought. `issue_comment` and `issues` come from whoever commented or labeled, and `repository_dispatch` comes from the token owner who called the API. Not documented per event; **INFERENCE**.

###### 2d. One self-hosted runner per member, holding that member's login

**F2d.1 (routing)**: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax (§ `jobs.<job_id>.runs-on`)
> "You can target runners based on the labels assigned to them, or their group membership, or a combination of these."

The contexts table allows `runs-on` to use `github, needs, strategy, matrix, vars, inputs`, so `runs-on: [self-hosted, ${{ github.actor }}]` is documented-legal (**INFERENCE** from the table).

https://docs.github.com/en/actions/reference/runners/self-hosted-runners ("Self-hosted runners reference", § Routing precedence for self-hosted runners):
> "If GitHub doesn't find an online and idle runner that matches the job's `runs-on` labels and groups, then the job will remain queued until a runner comes online."
§ Ephemeral runners: "If a job is labeled for a certain type of runner, but none matching that type are available, the job does not immediately fail at the time of queueing. Instead, the job will remain queued until the 24 hour timeout period expires."

**F2d.2 (security)**: https://docs.github.com/en/actions/reference/security/secure-use (§ Hardening for self-hosted runners)
> "**Self-hosted** runners for GitHub do not have guarantees around running in ephemeral clean virtual machines, and can be persistently compromised by untrusted code in a workflow."
> "As a result, self-hosted runners should almost never be used for public repositories on GitHub, because any user can open pull requests against the repository and compromise the environment. Similarly, be cautious when using self-hosted runners on private or internal repositories, as anyone who can fork the repository and open a pull request (generally those with read access to the repository) are able to compromise the self-hosted runner environment, including gaining access to secrets and the `GITHUB_TOKEN` which, depending on its settings, can grant write access to the repository. Although workflows can control access to environment secrets by using environments and required reviews, these workflows are not run in an isolated environment and are still susceptible to the same risks when run on a self-hosted runner."
> "What sensitive information resides on the machine configured as a self-hosted runner? For example, private SSH keys, API access tokens, among others." … "you should always be mindful that any user capable of invoking workflows has access to this environment."
> "there is no way to guarantee that a self-hosted runner only runs one job. Some jobs will use secrets as command-line arguments which can be seen by another job running on the same runner, such as `ps x -w`."
> "When a self-hosted runner is defined at the organization or enterprise level, GitHub can schedule workflows from multiple repositories onto the same runner."

**F2d.3 (runner groups: repository access; workflow access on Enterprise Cloud)**: https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/manage-access ("Managing access to self-hosted runners using groups")
> "We recommend that you only use self-hosted runners with private repositories. This is because forks of your public repository can potentially run dangerous code on your self-hosted runner machine by creating a pull request that executes the code in a workflow."
> "You can configure a runner group to be accessible to a specific list of repositories, or to all repositories in the organization. By default, only private repositories can access runners in a runner group, but you can override this."

The Enterprise Cloud version, https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/manage-runners/self-hosted-runners/manage-access (§ Changing which workflows can access a runner group), adds:
> "You can configure a runner group to run either selected workflows or all workflows. For example, you might use this setting to protect secrets that are stored on runners or to standardize deployment workflows by restricting a runner group to run only a specific reusable workflow."
> "Enter a comma separated list of the workflows that can access the runner group. Use the full path, including the repository name and owner. Pin non-reusable workflows to a branch. Pin reusable workflows to a branch, tag, or full SHA."
> "Only jobs directly defined within the selected workflows will have access to the runner group."

https://docs.github.com/en/actions/concepts/runners/runner-groups: "To control access to runners at the organization level, organizations using the GitHub Team plan can use runner groups."

**Security cost (INFERENCE)**: labels are not an access control. Any workflow in a repository that can reach the runner or group can target that member's label, including one a writer modified (F3). That job then runs on the member's machine with the member's login on disk. Runner-group "Selected workflows" pinned to a branch (Enterprise Cloud) narrows this to a named workflow file at a named ref. Per-actor gating is not documented for runners. A job reaching member A's runner could be triggered by B.

---

##### 3. Who can read a secret by changing a workflow

**F3.1 (headline statement)**: https://docs.github.com/en/actions/reference/security/secure-use ("Secure use reference", § Use secrets for sensitive information → Principle of least privilege)
> "Any user with write access to your repository has read access to all secrets configured in your repository. Therefore, you should ensure that the credentials being used within workflows have the least privileges required."

**F3.2 (which workflow file version runs)**: https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows ("Workflows", § Triggering a workflow)
> "1. An event occurs on your repository. The event has an associated commit SHA and Git ref.
> 2. GitHub searches the `.github/workflows` directory in the root of your repository for workflow files that are present in the associated commit SHA or Git ref of the event.
> 3. A workflow run is triggered for any workflows that have `on:` values that match the triggering event. Some events also require the workflow file to be present on the default branch of the repository in order to run."
> "Each workflow run will use the version of the workflow that is present in the associated commit SHA or Git ref of the event."

**F3.3 (Events table rows)**: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows ("Events that trigger workflows")

| Event | `GITHUB_SHA` | `GITHUB_REF` | Note on the page |
|---|---|---|---|
| `issue_comment` | "Last commit on default branch" | "Default branch" | "This event will only trigger a workflow run if the workflow file exists on the default branch." |
| `issues` | "Last commit on default branch" | "Default branch" | same note |
| `pull_request_review` | "Last merge commit on the `GITHUB_REF` branch" | "PR merge branch `refs/pull/PULL_REQUEST_NUMBER/merge`" | (no default-branch note) |
| `repository_dispatch` | "Last commit on default branch" | "Default branch" | "This event will only trigger a workflow run if the workflow file exists on the default branch." |
| `workflow_dispatch` | "Last commit on the `GITHUB_REF` branch or tag" | "Branch or tag that received dispatch" | "This event will only trigger a workflow run if the workflow file exists on the default branch." |

`workflow_dispatch` § body:
> "On the GitHub UI, the "Run workflow" button will be present if the workflow file exists on the default branch. Once a workflow has run at least once, you can dispatch it against any branch or tag via the GitHub API or GitHub CLI."

https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow ("Manually running a workflow"):
> "Write access to the repository is required to perform these steps." … "To run a workflow on a branch other than the repository's default branch, use the `--ref` flag."

**INFERENCE (from F3.2 and F3.3)**:
- `issues`, `issue_comment` and `repository_dispatch` run the **default-branch** workflow file. A modified workflow must therefore be merged to the default branch before these triggers execute it. Branch protection, rulesets and CODEOWNERS on the default branch are the gate.
- `workflow_dispatch` runs the workflow file **as it exists on the dispatched ref**. The file must exist on the default branch for the event to be accepted. A writer can push a branch with a modified copy and dispatch it with `--ref`, so the modified YAML runs with repository and org secrets.
- `pull_request_review` runs the workflow from the **PR merge commit**, which is the PR head merged into base. A writer opening a same-repository PR that edits the workflow file has the edited version run when any review is submitted. Fork PRs receive no secrets (F3.4).

**F3.4 (fork PRs)**: same page, under `pull_request_review` § Workflows in forked repositories
> "With the exception of `GITHUB_TOKEN`, secrets are not passed to the runner when a workflow is triggered from a forked repository. The `GITHUB_TOKEN` has read-only permissions in pull requests from forked repositories."
> § Pull request events for forked repositories: "For pull requests from a forked repository to the base repository, GitHub sends the `pull_request`, `issue_comment`, `pull_request_review_comment`, `pull_request_review`, and `pull_request_target` events to the base repository."

**F3.5 (do environment rules stop a modified workflow on a non-default branch?)**: https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments (§ Deployment branches and tags, quoted in F2a.6)
> "The deployment branch or tag rule is matched against the `GITHUB_REF` of the workflow run."

https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments (§ Creating an environment, step 11):
> "workflow jobs that use this environment can only access these secrets after any configured rules (for example, required reviewers) pass."

**INFERENCE**:
- **Deployment branch rule = default branch only.** A `workflow_dispatch` on a feature branch has `GITHUB_REF = refs/heads/feature`, and a `pull_request_review` has `refs/pull/N/merge`. Neither matches, so the job referencing the environment cannot proceed and the environment secrets stay sealed. Default-branch-ref triggers (`issues`, `issue_comment`, `repository_dispatch`) match, but they run the default-branch file, which a writer cannot change without passing default-branch protection. The pattern therefore holds, and environment secrets are the documented way to keep secrets away from unmerged workflow edits. This is not stated as one sentence anywhere; it follows from "matched against `GITHUB_REF`" together with the events table.
- **Required reviewers** stop it too: the job waits for approval (F2a.4). With prevent-self-review, the attacker cannot approve their own run.
- **Repository and org secrets have no equivalent gate.** F1.4b says they are "read when a workflow run is queued".
- **Caveat**: "Protected branches only" lets every branch deploy when no branch protection exists (F2a.6). Admin bypass is on by default (F2a.5).
- **Caveat (self-hosted)**: F2a.8 and F2d.2 say environments give no isolation on self-hosted runners.

**F3.6 (`permissions:` changes only the GITHUB_TOKEN)**: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax (§ `permissions`)
> "You can use `permissions` to modify the default permissions granted to the `GITHUB_TOKEN`, adding or removing access as required, so that you only allow the minimum required access."
> "Owners of an organization can restrict write access for the `GITHUB_TOKEN` at the repository level."

https://docs.github.com/en/actions/tutorials/authenticate-with-github_token (§ Modifying the permissions for the `GITHUB_TOKEN`):
> "Use the `permissions` key in your workflow file to modify permissions for the `GITHUB_TOKEN` for an entire workflow or for individual jobs."

https://docs.github.com/en/actions/reference/security/oidc: `id-token: write` "only enables fetching and setting the OIDC token; it does not grant write access to other resources."

**Whether `permissions:` restricts access to `secrets.*`: SILENT, and nothing says it does.** **INFERENCE**: `permissions:` scopes only the `GITHUB_TOKEN` (and gates OIDC through `id-token`). It has no effect on whether a job can read repository, org or environment secrets. Because the workflow author sets `permissions:` in the YAML, a writer modifying the workflow can raise it, within the org or repository maximum set by owners.

**F3.7 (CODEOWNERS on workflows)**: https://docs.github.com/en/actions/reference/security/secure-use (§ Using `CODEOWNERS` to monitor changes)
> "You can use the `CODEOWNERS` feature to control how changes are made to your workflow files. For example, if all your workflow files are stored `.github/workflows`, you can add this directory to the code owners list, so that any proposed changes to these files will first require approval from a designated reviewer."

**INFERENCE**: CODEOWNERS gates **merging** into a protected branch. It does not stop a push to an unprotected branch, nor a `workflow_dispatch --ref` or `pull_request_review` run of that unmerged edit.

**F3.8 (third-party action compromise)**: same page, § Using third-party actions
> "a compromise of a single action within a workflow can be very significant, as that compromised action would have access to all secrets configured on your repository, and may be able to use the `GITHUB_TOKEN` to write to the repository."

---

##### 4. Organization-level controls

**F4.1 (org secret visibility)**: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets (§ Creating secrets for an organization)
> "When creating a secret or variable in an organization, you can use a policy to limit access by repository. For example, you can grant access to all repositories, or limit access to only private repositories or a specified list of repositories."
> "By default, the secret is only available to private repositories. To specify that the secret should be available to all repositories within the organization, use the `--visibility` or `-v` flag." (`gh secret set --org ORG_NAME SECRET_NAME --visibility all`; `--repos REPO-NAME-1, REPO-NAME-2` for selected)
> "Organization-level secrets and variables are not accessible by private repositories for GitHub Free."

**INFERENCE**: visibility is per repository only. There is no per-user or per-actor visibility.

**F4.2 (push rulesets can block workflow-file edits on every branch)**: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets ("About rulesets", § Push rulesets)
> "With push rulesets, you can block pushes to a private or internal repository and that repository's entire fork network based on file extensions, file path lengths, file and folder paths, and file sizes."
> "Push rules do not require any branch targeting because they apply to every push to the repository."

Same page, § About rulesets:
> "A ruleset is a named list of rules that applies to a repository or to multiple repositories in an organization for customers on GitHub Team and GitHub Enterprise plans."
> "When you create a ruleset, you can allow certain users to bypass the rules in the ruleset."
> "For organizations on the GitHub Enterprise plan, you can set up rulesets at the organization level to target multiple repositories in your organization."

https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets (§ Restrict file paths):
> "Prevent commits that include changes in specified file paths from being pushed to the repository. Limit is 200 entries and up to 200 characters in each entry."

**INFERENCE**: a push ruleset restricting `.github/workflows/**`, with a bypass list of trusted maintainers, stops ordinary writers from pushing **any** branch carrying a modified workflow. That closes the `workflow_dispatch --ref` and `pull_request_review` routes of F3.3. It applies only to private and internal repositories. Docs do not say whether a composite action or script that the workflow calls, living outside `.github/workflows`, would also need restricting. **INFERENCE**: it would, because those files run with the job's secrets.

**F4.3 (path-based required reviewers in branch rulesets)**: same page, § Require a pull request before merging → Required reviewers
> "Optionally, you can require review or approval from specific teams when a pull request changes certain files or directories. You can specify up to 15 different teams, and for each team you can require a certain number of approvals from team members."
> "This rule is not available on user-owned repositories as they do not contain teams."

**F4.4 (CODEOWNERS enforcement)**: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners ("About code owners")
> "The people you choose as code owners must have write permissions for the repository."
> "Repository owners can update branch protection rules to ensure that changed code is reviewed by the owners of the changed files. Edit your branch protection rule and enable the option "Require review from Code Owners"."

**F4.5 (required workflows through rulesets, Enterprise Cloud)**: https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets (§ Require workflows to pass before merging)
> "Ruleset workflows can be configured at the organization or enterprise level to require workflows to pass before merging pull requests."
> "When you add this rule to a ruleset, in your organization settings, you specify the source repository and the workflow you want to enforce."

**INFERENCE**: this enforces that a centrally owned workflow runs as a merge gate. It does not restrict who can edit workflows in the target repository.

**F4.6 (runner and GITHUB_TOKEN policies)**: https://docs.github.com/en/actions/reference/security/secure-use: "Organization owners can choose which repositories are allowed to create repository-level self-hosted runners." Workflow-syntax § `permissions`: "Owners of an organization can restrict write access for the `GITHUB_TOKEN` at the repository level." Runner-group "Selected workflows" (F2d.3) is the org control that binds runners to specific workflow files at specific refs.

---

##### Summary of answers

1. Actions secrets exist at org, repository and environment level only. There are no per-user Actions secrets; Codespaces user secrets are a separate store, and the docs do not say outright that they are unavailable to Actions (strong inference that they are). Names allow `[A-Za-z0-9_]` only, so hyphens are not allowed and must be mapped from logins. Names are case-insensitive and stored uppercase, must not start with `GITHUB_` or a digit, and values are limited to 48 KB. Limits: 100 repository, 100 per environment, 1,000 org (100 usable per workflow).
2. Use `triggering_actor`, not `actor`, or refuse runs where they differ: re-runs keep `actor` and its privileges. A dynamic `environment.name` from `github.*` is documented. Dynamic `secrets[...]` indexing is not documented. OIDC carries `actor`/`actor_id`, which Vault can bind through `bound_claims`/`user_claim`; AWS supports only `sub`. Self-hosted runner labels are not access control.
3. "Any user with write access to your repository has read access to all secrets configured in your repository." `workflow_dispatch` runs the YAML from any ref; `pull_request_review` runs it from the PR merge commit. `issues`, `issue_comment` and `repository_dispatch` use the default-branch file. Environment branch rules (matched against `GITHUB_REF`) and required reviewers keep environment secrets from unmerged edits; repository and org secrets have no such gate. `permissions:` affects only the `GITHUB_TOKEN`.
4. Org secret visibility can be all, private or selected repositories. Push rulesets with "Restrict file paths" on `.github/workflows/**` block workflow edits on every branch (private and internal repositories, Team or Enterprise plans). CODEOWNERS and path-based required reviewers gate merges. Required ruleset workflows (Enterprise Cloud) enforce a central workflow but do not restrict edits.

##### Pages fetched (all 200 unless noted)
- https://docs.github.com/en/actions/reference/security/secrets
- https://docs.github.com/en/actions/concepts/security/secrets
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
- https://docs.github.com/en/actions/reference/security/secure-use
- https://docs.github.com/en/actions/reference/workflows-and-actions/contexts
- https://docs.github.com/en/actions/reference/workflows-and-actions/expressions
- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- https://docs.github.com/en/actions/reference/workflows-and-actions/variables
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow
- https://docs.github.com/en/actions/how-tos/manage-workflow-runs/re-run-workflows-and-jobs
- https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow
- https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments
- https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments
- https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/review-deployments
- https://docs.github.com/en/actions/reference/security/oidc
- https://docs.github.com/en/actions/concepts/security/openid-connect
- https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-hashicorp-vault
- https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws
- https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-azure
- https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-google-cloud-platform
- https://docs.github.com/en/rest/actions/oidc
- https://token.actions.githubusercontent.com/.well-known/openid-configuration
- https://docs.github.com/en/actions/concepts/runners/self-hosted-runners
- https://docs.github.com/en/actions/reference/runners/self-hosted-runners
- https://docs.github.com/en/actions/concepts/runners/runner-groups
- https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/manage-access
- https://docs.github.com/en/enterprise-cloud@latest/actions/how-tos/manage-runners/self-hosted-runners/manage-access
- https://docs.github.com/en/actions/concepts/security/github_token
- https://docs.github.com/en/actions/tutorials/authenticate-with-github_token
- https://docs.github.com/en/actions/reference/limits
- https://docs.github.com/en/codespaces/managing-your-codespaces/managing-your-account-specific-secrets-for-github-codespaces
- https://docs.github.com/en/code-security/dependabot/troubleshooting-dependabot/troubleshooting-dependabot-on-github-actions
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- https://docs.github.com/en/enterprise-cloud@latest/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners
- https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/iam-configuration-reference/username-considerations-for-external-authentication

Failures: these paths returned 404 and were replaced by working URLs: `actions/how-tos/administer/manage-secrets`, `…/oidc-in-amazon-web-services` (the live path is `…/oidc-in-aws`), `actions/concepts/workflows-and-actions/about-triggers`, `…/events` and `actions/reference/workflows-and-actions/github_token`. No github.blog changelog was needed.

#### GitHub tokens for harness automation, and Copilot cloud agent billing and attribution

All sources were retrieved on 2026-10-02 from docs.github.com (rendered text taken from `https://docs.github.com/api/article/body?pathname=/en/<path>`; the URLs below are each page's canonical URL after redirects) and from github.blog/changelog. Quotes are verbatim. Anything marked **INFERENCE** is my reasoning and is not stated in a source. Anything marked **SILENT** means the pages listed did not answer the question.

> **Headline change since most secondary write-ups:** Copilot moved from **premium requests to usage-based billing in "GitHub AI Credits" on June 1, 2026**. The premium-request pages still exist, but GitHub now labels them "legacy" and says they apply only to Pro and Pro+ annual-plan holders. See Q2.

---

##### Q1. Per-member fine-grained PATs vs a GitHub App installation token

###### 1a. Who appears as the author of the PR and of the pushed commits

**F1.1: An App installation token acts as `<app>[bot]`; a user access token acts as the user**
- URL: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps
- Page / section: "Differences between GitHub Apps and OAuth apps" → comparison table (token identity rows)
- Quote: "An installation token identifies the app as a GitHub App bot account, such as @jenkins\[bot]." / "A user access token identifies the app as the user who signed into the app, such as @octocat."
- Establishes: a PR opened through the API with an installation token is authored by `<app-slug>[bot]`, not by any person.

**F1.2: Installation activity is attributed to the app**
- URL: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation
- Page / section: "Authenticating as a GitHub App installation" → intro
- Quote: "API requests made by an app installation are attributed to the app."
- URL: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/about-authentication-with-a-github-app
- Page / section: "About authentication with a GitHub App" → "Authentication as an app installation" / "Authentication on behalf of a user"
- Quotes: "Your app should authenticate as an app installation when you want to attribute app activity to the app." … "Your app should authenticate on behalf of a user when you want to attribute app activity to a user."
- Establishes: attribution follows the token type. An installation token gives bot attribution. A user access token issued by the same App attributes the action to the user, marked as done through the app.

**F1.3: A PAT acts as the person who owns it**
- URL: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
- Page / section: "Managing your personal access tokens" → "About personal access tokens"
- Quotes: "Personal access tokens are intended to access GitHub resources on behalf of yourself. To access resources on behalf of an organization, or for long-lived integrations, you should use a GitHub App." / "A token has the same capabilities to access resources and perform actions on those resources that the owner of the token has…" / "Both fine-grained personal access tokens and personal access tokens (classic) are tied to the user who generated them and will become inactive if the user loses access to the resource."
- URL: https://docs.github.com/en/get-started/learning-about-github/types-of-github-accounts
- Page / section: "Types of GitHub accounts" → "User accounts"
- Quote: "Any time you take any action on GitHub, such as creating an issue or reviewing a pull request, the action is attributed to your user account."
- Establishes: a PR opened with member X's PAT is authored by X.

**F1.4: Commit authorship comes from the commit's email, not from the token that pushed it**
- URL: https://docs.github.com/en/pull-requests/how-tos/commit-changes/troubleshooting-commits
- Page / section: "Troubleshooting commits" → "Commits are linked to the wrong user"
- Quote: "GitHub links a commit to a user by matching the email address in the commit header to an email address on a GitHub account."
- URL: https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address
- Page / section: "Setting your commit email address" → "Setting your commit email address in Git"
- Quote: "You can use the `git config` command to change the email address you associate with your Git commits."
- Establishes: whichever token does the push, the commit author shown on GitHub is the account that owns the `user.email` in the commit. **INFERENCE:** to make commits show as the App bot, the harness has to set git author/committer to the bot's identity (`<id>+<slug>[bot]@users.noreply.github.com`). The docs pages I checked do not give that address format, so it is unverified here.

**F1.5: Commits created through the API as an App are shown as Verified**
- URL: https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification
- Page / section: "About commit signature verification" → "Signature verification for bots"
- Quotes: "Organizations and GitHub Apps that require commit signing can use bots to sign commits. If a commit or tag has a bot signature that is cryptographically verifiable, GitHub marks the commit or tag as verified." / "Signature verification for bots will only work if the request is verified and authenticated as the GitHub App or bot and contains no custom author information, custom committer information, and no custom signature information, such as Commits API."
- Establishes: only commits created through the API, with no custom author, get the automatic bot signature. A plain `git push` of locally made commits does not.

###### 1b. A PR's author cannot approve their own PR

**F1.6: The rule as documented**
- URL: https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews (the old path `/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/approving-a-pull-request-with-required-reviews` redirects here)
- Page / section: "Approving a pull request with required reviews" → closing TIP block
- Quote: "Pull request authors cannot approve their own pull requests. You will also not be able to approve a pull request that was raised by GitHub Copilot if it was you who assigned Copilot to the issue to which the pull request relates."
- The same sentence appears at https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/reviewing-proposed-changes-in-a-pull-request (the TIP after "Submitting your review").

**F1.7: Request changes blocks merging only under a rule, and only the same reviewer can clear it**
- Same two pages, same TIP block
- Quote: "The **Request changes** option is purely informational and will not prevent merging unless a ruleset or classic branch protection rule is configured with the "require a pull request" option. If configured and a collaborator with `admin`, `owner`, or `write` access to the repository submits a review requesting changes, the pull request cannot be merged until the same collaborator submits another review approving the changes in the pull request."

**F1.8: The review decision types**
- URL: https://docs.github.com/en/pull-requests/reference/pull-request-reviews (the old "About pull request reviews" path redirects here)
- Page / section: "Pull request reviews" → "Review decision types"
- Quote (table): "Request changes | Flags feedback that the author should address before merging."

**SILENT: whether an author can "Request changes" on their own PR.** None of the pages I checked says it either way: the four PR-review pages above, and the REST "Pull request reviews" endpoint page (https://docs.github.com/en/rest/pulls/reviews, which lists only `APPROVE`, `REQUEST_CHANGES`, `COMMENT`). **INFERENCE, not from a source:** in practice GitHub's UI hides both Approve and Request changes on your own PR, and the API returns a 422 for either. This needs a live check. **The consequence for the harness:** if the PR is opened with member X's PAT, X cannot approve it and probably cannot submit a Request-changes review either. X could only start a fix round some other way, for example through a comment.

**F1.9: The "last pusher" rule also binds whoever's token pushed**
- URL: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- Page / section: "Available rules for rulesets" → "Require a pull request before merging" (optional settings)
- Quote: "Optionally, you can require an approval from someone other than the last person to push to a branch before a pull request can be merged."
- **INFERENCE:** if fix-round pushes are made with member X's PAT, X counts as "the last person to push" and cannot supply that approval. With an App token, the last pusher is the bot.

###### 1c. Do pushes and PRs trigger other workflows?

**F1.10: GITHUB_TOKEN events do not start new runs, except dispatches, and PR events, which wait for approval**
- URL: https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow
- Page / section: "Triggering a workflow" → "Triggering a workflow from a workflow"
- Quotes: "When you use the repository's `GITHUB_TOKEN` to perform tasks, events triggered by the `GITHUB_TOKEN` will not create a new workflow run, with the following exceptions:" / "`workflow_dispatch` and `repository_dispatch` events always create workflow runs." / "`pull_request` events with the `opened`, `synchronize`, or `reopened` activity types: when a workflow using `GITHUB_TOKEN` creates or updates a pull request, the resulting `pull_request` event creates workflow runs in an **approval-required** state. … a user with write access to the repository can start the runs by selecting **Approve workflows to run**. Other `pull_request` activity types (such as `labeled`, `edited`, or `closed`) do not create workflow runs." / "if a workflow run pushes code using the repository's `GITHUB_TOKEN`, a new workflow will not run even when the repository contains a workflow configured to run when `push` events occur."
- Quote (the alternative): "If you do want to trigger a workflow from within a workflow run, you can use a GitHub App installation access token or a personal access token instead of `GITHUB_TOKEN` to trigger events that require a token. Using one of these alternatives also lets `pull_request` workflows run automatically (without the approval prompt described above) when the pull request is created or updated by automation."
- Establishes: both an App installation token and a PAT trigger workflows normally. The `GITHUB_TOKEN` fallback leaves CI on the harness's PR waiting for a human "Approve workflows to run".

**F1.11: The same rule on the GITHUB_TOKEN concept page, plus what the token is**
- URL: https://docs.github.com/en/actions/concepts/security/github_token
- Page / section: "GITHUB_TOKEN" → "About the `GITHUB_TOKEN`" / "When `GITHUB_TOKEN` triggers workflow runs"
- Quotes: "The `GITHUB_TOKEN` secret is a GitHub App installation access token." / "If you need workflow runs from workflow-created pull requests to execute without requiring approval, use a GitHub App installation access token or a personal access token instead of `GITHUB_TOKEN` when creating or updating the pull request." / "Commits pushed by a GitHub Actions workflow that uses the `GITHUB_TOKEN` do not trigger a GitHub Pages build."

###### 1d. REST rate limits

All quotes in this subsection come from https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api ("Rate limits for the REST API").

**F1.12: PAT (5,000 per hour per user, shared across everything that acts as that user)**
- Section: "Primary rate limit for authenticated users"
- Quote: "All of these requests count towards your personal rate limit of 5,000 requests per hour. Requests made on your behalf by a GitHub App that is owned by a GitHub Enterprise Cloud organization have a higher rate limit of 15,000 requests per hour. … However, requests made by a higher-limit app reduce the remaining budget available for lower-limit authentication methods."

**F1.13: App installation (5,000 base, scaling to at most 12,500; 15,000 on GHEC)**
- Section: "Primary rate limit for GitHub App installations"
- Quote: "GitHub Apps authenticating with an installation access token use the installation's minimum rate limit of 5,000 requests per hour. If the installation is on a GitHub Enterprise Cloud organization, the installation has a rate limit of 15,000 requests per hour." / "For installations that are not on a GitHub Enterprise Cloud organization, the rate limit for the installation will scale with the number of users and repositories. Installations that have more than 20 repositories receive another 50 requests per hour for each repository. Installations that are on an organization that have more than 20 users receive another 50 requests per hour for each user. The rate limit cannot increase beyond 12,500 requests per hour."
- Note: the scaling cap is **12,500** for non-GHEC installations. 15,000 applies only to GHEC.

**F1.14: GITHUB_TOKEN (1,000 per hour per repository)**
- Section: "Primary rate limit for `GITHUB_TOKEN` in GitHub Actions"
- Quote: "The rate limit for `GITHUB_TOKEN` is 1,000 requests per hour per repository. For requests to resources that belong to a GitHub Enterprise Cloud account, the limit is 15,000 requests per hour per repository."

**F1.15: Secondary limits, including content creation**
- Section: "About secondary rate limits"
- Quotes: "*Create too much content on GitHub in a short amount of time.* In general, no more than 80 content-generating requests per minute and no more than 500 content-generating requests per hour are allowed. Some endpoints have lower content creation limits. Content creation limits include actions taken on the GitHub web interface as well as via the REST API and GraphQL API." / "No more than 100 concurrent requests are allowed." / "No more than 900 points per minute are allowed for REST API endpoints…" / "Most REST API `POST`, `PATCH`, `PUT`, or `DELETE` requests | 5" / "These secondary rate limits are subject to change without notice."
- Section: "Getting a higher rate limit"
- Quote: "If you are using a personal access token for automation in your organization, consider whether a GitHub App will work instead."
- The page at https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/rate-limits-for-github-apps only points to this one ("The rate limit for GitHub Apps depends on whether the app authenticates with a user access token or an installation access token.").

###### 1e. Organisation and enterprise policies on PATs

**F1.16: An org can restrict or allow PAT access, separately for each token type**
- URL: https://docs.github.com/en/organizations/managing-programmatic-access-to-your-organization/setting-a-personal-access-token-policy-for-your-organization
- Page / section: "Setting a personal access token policy for your organization" → "Restricting access by personal access tokens"
- Quotes: "**Restrict access via personal access tokens:** Personal access tokens (classic) or fine-grained personal access tokens cannot access resources owned by the organization. SSH keys created by personal access tokens will continue to work." / "By default, both Personal access tokens (classic) and fine-grained personal access tokens are enabled." / step 5: "Select either the **Fine-grained tokens** or **Tokens (classic)** tab to enforce this policy based on the token type."
- Establishes: an org can block classic PATs while still allowing fine-grained ones, and the reverse.

**F1.17: Maximum lifetime policy**
- Same page → "Enforcing a maximum lifetime policy for personal access tokens"
- Quotes: "Organization owners can set maximum lifetime allowances for both fine-grained personal access tokens and personal access tokens (classic) to control access to organization resources." / "For fine-grained personal access tokens, the default the maximum lifetime policy for organizations is set to expire within 366 days. Personal access tokens (classic) do not have an expiration requirement." / "When you set a policy, tokens with non-compliant lifetimes will be blocked from accessing your organization if the token belongs to a member of your organization. Setting this policy does not revoke or disable these tokens."

**F1.18: Approval policy for fine-grained PATs (on by default)**
- Same page → "Enforcing an approval policy for fine-grained personal access tokens"
- Quotes: "**Require administrator approval:** An organization owner must approve each fine-grained personal access token that can access the organization. Fine-grained personal access tokens created by organization owners will not need approval. This is the default value." / "Only fine-grained personal access tokens, not personal access tokens (classic), are subject to approval."
- **INFERENCE:** per-member fine-grained PATs mean one owner approval per member token, by default.

**F1.19: Fine-grained PAT expiry, a 50-token cap, and auto-removal after a year unused**
- URL: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
- Section: "Creating a fine-grained personal access token", step 7
- Quote: "Under **Expiration**, select an expiration for the token. Infinite lifetimes are allowed but may be blocked by a maximum lifetime policy set by your organization or enterprise owner."
- Section: pre-filling URL parameters table
- Quote: "`expires_in` | integer | `30` or `none` | Integer between 1 and 366, or `none` | Days until expiration or `none` for non-expiring. If not provided, the default is 30 days, or less if the target has a token lifetime policy set."
- Section: "Creating a fine-grained personal access token" (NOTE)
- Quote: "There is a limit of 50 fine-grained personal access tokens you can create. If you require more tokens or are building automations, consider using a GitHub App for better scalability and management."
- Section: "Personal access tokens (classic)"
- Quote: "As a security precaution, GitHub automatically removes personal access tokens that haven't been used in a year."
- Establishes: fine-grained PATs now allow a non-expiring setting. A finite expiry is at most 366 days. Org and enterprise policy can cap either.
- Fine-grained limitations that matter here: "Using fine-grained personal access token to contribute to repositories where the user is an outside or repository collaborator." and "…to access multiple organizations at once." Both are listed as gaps.

**F1.20: Enterprise policies override the org's**
- URL: https://docs.github.com/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-personal-access-tokens-in-your-enterprise
- Page / section: "Enforcing policies for personal access tokens in your enterprise" → "Restricting access by personal access tokens" / "Enforcing a maximum lifetime policy…" / "Enforcing an approval policy…"
- Quotes: "You can configure these restrictions for personal access tokens (classic) and fine-grained personal access tokens independently…" / "**Restrict access via personal access tokens:** Personal access tokens cannot access organizations owned by the enterprise. … Organizations cannot override this setting." / "Enterprise owners can set and remove maximum lifetime allowances … Organization owners within the enterprise can further restrict the lifetime policies for their organizations." / "**Require approval:** Enterprise owners can require that all organizations within the enterprise must approve each fine-grained personal access token…"

###### 1f. Minting an App installation token in a workflow

**F1.21: The documented procedure (client ID as a variable, private key as a secret, `actions/create-github-app-token@v3`)**
- URL: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/making-authenticated-api-requests-with-a-github-app-in-a-github-actions-workflow
- Page / section: "Making authenticated API requests with a GitHub App in a GitHub Actions workflow" → "Authenticating with a GitHub App"
- Quotes: "Store the client ID of your GitHub App as a GitHub Actions configuration variable. … The client ID is different from the app ID." / "Generate a private key for your app. Store the contents of the resulting file as a secret. (Store the entire contents of the file, including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`.)" / "Install the GitHub App on the right account and grant it permissions and access to any repositories that you want your workflow to access."
- Documented example:
  ```yaml
  - name: Generate a token
    id: generate-token
    uses: actions/create-github-app-token@v3
    with:
      client-id: ${{ vars.APP_CLIENT_ID }}
      private-key: ${{ secrets.APP_PRIVATE_KEY }}
  - name: Use the token
    env:
      GH_TOKEN: ${{ steps.generate-token.outputs.token }}
  ```
- Note: the triggering page (F1.10) still says "store the app ID and private key as secrets". That is older wording; the current example uses `client-id`.

**F1.22: Tokens last one hour**
- URL: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation
- Quote: "The installation access token will expire after 1 hour."
- **INFERENCE:** a harness session longer than an hour has to re-mint the token, or keep the private key available to do so.

**F1.23: Permissions the App needs (Contents, Pull requests, Workflows)**
- URL: https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app
- Quote: "If you want your app to use an installation or user access token to authenticate for HTTP-based Git access, you should request the "Contents" repository permission. If your app specifically needs to access or edit Actions files in the `.github/workflows` directory, request the "Workflows" repository permission."
- URL: https://docs.github.com/en/rest/authentication/permissions-required-for-github-apps
- Section "Repository permissions for "Pull requests"": "`POST /repos/{owner}/{repo}/pulls` | write | UAT, IAT"
- Section "Repository permissions for "Workflows"": lists `PUT /repos/{owner}/{repo}/contents/{path}`, `POST /repos/{owner}/{repo}/git/refs` and `PATCH /repos/{owner}/{repo}/git/refs/{ref}`, all write, as needing Workflows as an additional permission.
- Establishes: Contents read/write for push, Pull requests read/write to open PRs, and Workflows write if the harness may change `.github/workflows/**`. Metadata read is implicit.

**F1.24: GitHub recommends an App over a PAT for org automation**
- URL: https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/deciding-when-to-build-a-github-app
- Section: "Choosing between a GitHub App or a personal access token"
- Quotes: "If you want to access GitHub resources on behalf of a user or in an organization, or you anticipate a long-lived integration, we recommend building a GitHub App." / "Since a personal access token is associated with a user, your automation could break if the user no longer has access to the resources you need. A GitHub App installed on an organization is not dependent on a user. Additionally, unlike a user, a GitHub App does not consume a GitHub seat."
- Section: "GitHub Apps can act independently of or on behalf of a user"
- Quote: "GitHub Apps remain installed even when the person who initially installed the app leaves the organization."
- URL: https://docs.github.com/en/actions/tutorials/authenticate-with-github_token, section "Granting additional permissions"
- Quote: "If you need a token that requires permissions that aren't available in the `GITHUB_TOKEN`, create a GitHub App and generate an installation access token within your workflow. … Alternatively, you can create a personal access token, store it as a secret in your repository…"

###### 1g. Machine accounts and bot users

**F1.25: GitHub Terms of Service, "B. Account Terms" → "3. Account Requirements"**
- URL: https://docs.github.com/en/site-policy/github-terms/github-terms-of-service
- Quotes:
  - "You must be a human to create an Account. Accounts registered by "bots" or other automated methods are not permitted. We do permit machine accounts:"
  - "A machine account is an Account set up by an individual human who accepts the Terms on behalf of the Account, provides a valid email address, and is responsible for its actions. A machine account is used exclusively for performing automated tasks. Multiple users may direct the actions of a machine account, but the owner of the Account is ultimately responsible for the machine's actions. You may maintain no more than one free machine account in addition to your free Personal Account."
  - "One person or legal entity may maintain no more than one free Account (if you choose to control a machine account as well, that's fine, but it can only be used for running a machine)."
  - "Your login may only be used by one person — i.e., a single login may not be shared by multiple people."
- Short-version header: "…a human must create your Account; … and you may not have more than one free Account."

**F1.26: A machine user takes a seat; an App bot does not**
- URL: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps
- Section: "Machine vs. bot accounts"
- Quotes: "Machine user accounts are personal accounts that segregate automated systems using GitHub's user system, interacting with GitHub via PATs or OAuth app tokens." / "Bot accounts are specific to GitHub Apps and are built into every GitHub App." / "GitHub App bots do not consume a GitHub Enterprise seat." / "A machine user account consumes a GitHub Enterprise seat." / "Because a GitHub App bot is never granted a password, a customer can't sign into it directly."
- **INFERENCE:** a shared machine account's PAT would make the PR author the machine account. Every team member could then review it, but it costs a seat in a paid org and makes one human responsible under the ToS. "Multiple users may direct the actions of a machine account" explicitly allows a team to share one.

---

##### Q2. Copilot cloud agent (formerly "coding agent") and third-party agents

###### 2a. Billing: AI credits (current) vs premium requests (legacy)

**F2.1: Premium requests were replaced on June 1, 2026**
- URL: https://docs.github.com/en/copilot/reference/copilot-billing/request-based-billing-legacy/what-changed-with-billing
- Page / section: "What changed with Copilot billing (legacy)" → "What changed with Copilot billing?"
- Quotes: "> This article only applies to Copilot Pro and Copilot Pro+ subscribers on an existing annual plan who remained on legacy premium request-based billing after June 1, 2026." / "Before June 1, 2026, billing was premium request-based: each model interaction cost one **premium request unit** (PRU), and a **multiplier** was applied based on which model you used…" / "As of June 1, 2026, GitHub replaced request-based billing with usage-based billing, where the cost of an interaction depends on two things: the **model** and the **number of tokens consumed**."
- URL: https://github.blog/changelog/2026-06-01-updates-to-github-copilot-billing-and-plans/
- Title / section: "Updates to GitHub Copilot billing and plans" (June 1, 2026) → "Usage-based billing is active for all Copilot plans"
- Quote: "As of June 1, all Copilot plans bill based on GitHub AI Credits consumed. Each plan comes with monthly included usage."

**F2.2: The cloud agent uses Actions minutes plus AI credits**
- URL: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent
- Page / section: "About GitHub Copilot cloud agent" → "Copilot cloud agent usage costs"
- Quote: "Copilot cloud agent uses GitHub Actions minutes and AI credits. The AI credits consumed depend on the model used and the number of tokens processed during the session." / "Within your included GitHub Actions minutes and AI credits, you can use Copilot cloud agent without incurring additional costs."

**F2.3: Orgs and enterprises share a pooled credit allowance**
- URL: https://docs.github.com/en/copilot/concepts/billing-and-usage/organizations-and-enterprises/billing
- Page / section: "Usage-based billing for organizations and enterprises"
- Quotes: "GitHub AI Credits are the billing unit for Copilot usage in Copilot Business and Copilot Enterprise." / "1 AI credit = $0.01 USD" / "Copilot features that use AI models consume AI credits. This includes Copilot Chat, Copilot CLI, Copilot cloud agent, Copilot Spaces, Spark, and third-party coding agents." / table: "Copilot Business | 1,900" and "Copilot Enterprise | 3,900" (total AI credits per user per month) / "A user's included AI credits are pooled at the billing entity level. For example, an enterprise with 100 Copilot Business users gets a shared pool of 190,000 AI credits rather than 100 individual buckets." / "**Additional usage allowed**: Usage continues at published per-credit rates. The additional spend is charged to your organization or enterprise." / "Additional usage is **enabled by default** for organizations and enterprises." / "If you have set a user-level budget and a user exhausts it, that user's access to Copilot is halted, regardless of whether the organization's pool still has capacity."
- Establishes: on Business and Enterprise, a member's cloud-agent session draws on the org's or enterprise's pooled credits. Overage is charged to the org or enterprise. User-level budgets can cap each person.

**F2.4: Individual plans**
- URL: https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/billing
- Page / section: "Usage-based billing for individuals" → "GitHub AI Credits allowance by plan" / "What is billed in AI credits?"
- Quotes (table): "Copilot Pro | $10 USD | 1,000 | 500 | 1,500" / "Copilot Pro+ | $39 USD | 3,900 | 3,100 | 7,000" / "Copilot Max | $100 USD | 10,000 | 10,000 | 20,000". List of billed features: "Copilot cloud agent" … "Third-party coding agents".

**F2.5: Whose allowance is charged**
- URL: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-automations
- Section: "Billing"
- Quote: "Each time an automation runs, it starts a Copilot cloud agent session that uses GitHub Actions minutes and GitHub AI Credits. This usage is billed to the user who created the automation."
- Legacy page: https://docs.github.com/en/copilot/reference/copilot-billing/request-based-billing-legacy/github-copilot-premium-requests ("Overview of request-based billing (legacy)") → "Usage by Copilot cloud agent"
- Quotes: "**Premium requests** come from the monthly allowance associated with your Copilot license." / "Each cloud agent **session** consumes one premium request. A session begins when you: Prompt Copilot to undertake a task. Assign Copilot to an issue" / "**GitHub Actions minutes** come from your account’s monthly allowance of free minutes for GitHub-hosted runners."
- Legacy page: https://docs.github.com/en/copilot/reference/copilot-billing/request-based-billing-legacy/copilot-requests ("Requests in GitHub Copilot (legacy)")
- Quote: "Copilot cloud agent uses **one premium request** per session, multiplied by the model's rate. A session begins when you prompt Copilot to undertake a task. In addition, each real-time steering comment made during an active session uses **one premium request** per session, multiplied by the model's rate."
- Establishes: AI usage is charged against the license of the user who starts the session. On Business and Enterprise, that license draws on the org's pool (F2.3).
- Actions minutes: https://docs.github.com/en/billing/concepts/product-billing/github-actions — "Minutes usage is charged to the repository owner, not the person who triggered the workflow runs." / "Any costs of running the actions are billed to the repository owner." **INFERENCE:** the cloud agent's Actions minutes are therefore charged to the repository owner (the org), and are free on public repos with standard runners. The cloud-agent pages say "your account's" and do not name the owner explicitly.

**F2.6: Seats**
- URL: https://docs.github.com/en/billing/concepts/product-billing/github-copilot-licenses
- Quotes: "Copilot licenses are required for each user who uses Copilot." / "Copilot Business: $19 USD per user per month (billed monthly)." / "Organizations and enterprises are billed for the number of assigned seats at the end of each monthly billing cycle."
- URL: https://docs.github.com/en/copilot/reference/copilot-billing/seat-assignment
- Quote: "A **Copilot seat** is a license to use Copilot, assigned to a unique user account through a Copilot Business or a Copilot Enterprise plan."

###### 2b. Plan availability and enabling

**F2.7: Which plans include the agents**
- URL: https://docs.github.com/en/copilot/get-started/plans ("Plans for GitHub Copilot" → feature table "Agents")
- Table rows, with icon labels as rendered: "Copilot cloud agent | [Not included] (Free) | [Included] (Student) | [Included] (Pro) | [Included] (Pro+) | [Included] (Max)"; Business/Enterprise: "[Included] | [Included]". "Third-party Agents (public preview) | Not included (Free) | Not included (Student) | Included (Pro, Pro+, Max)"; Business/Enterprise: included.
- URL: https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent → "Making Copilot cloud agent available"
- Quote: "Copilot cloud agent is available for all paid Copilot plans. If you are a GitHub Copilot Business or GitHub Copilot Enterprise subscriber, an administrator must enable the relevant policy before you can use the agent."

**F2.8: Off by default for Business and Enterprise**
- URL: https://docs.github.com/en/copilot/concepts/enterprise/cloud-agent-access ("Managing access to GitHub Copilot cloud agent" → "Overview")
- Quotes: "If you are a GitHub Copilot Enterprise or GitHub Copilot Business subscriber, Copilot cloud agent is disabled by default and must be enabled by an administrator before it is available for use." / "If you are a Copilot Pro, Copilot Pro+, or Copilot Max subscriber, Copilot cloud agent is enabled by default."
- URL: https://docs.github.com/en/copilot/how-tos/administer-copilot/manage-for-organization/add-copilot-cloud-agent
- Quotes: "Copilot cloud agent and use of third-party MCP servers are disabled by default for organization members assigned a GitHub Copilot Enterprise or Copilot Business license by your organization." / "For the "Copilot cloud agent" policy, select "Enabled"." / "Once Copilot cloud agent is enabled for a repository, any user with access to Copilot cloud agent and write permission for the repository can delegate work to Copilot." / NOTE: "If your enterprise owner has selected a specific policy … you cannot override that setting at the organization level."

###### 2c. Attribution: PR author, commit author, co-author, who can approve

**F2.9: Commits and approval rules**
- URL: https://docs.github.com/en/copilot/concepts/security-governance-and-network-settings/risks-and-mitigations ("Risks and mitigations for GitHub Copilot cloud agent")
- Section "Administrators can lose sight of agents' work":
  - "Copilot cloud agent's commits are authored by Copilot, with the developer who assigned the issue or requested the change to the pull request marked as the co-author. This makes it easier to identify code generated by Copilot cloud agent and who started the task."
  - "Copilot cloud agent's commits are signed, so they appear as "Verified" on GitHub."
- Section "Copilot cloud agent can push code changes to your repository":
  - "**Requires human review before merging.** Draft pull requests created by Copilot cloud agent must be reviewed and merged by a human. Copilot cloud agent cannot mark its pull requests as "Ready for review" and cannot approve or merge a pull request."
  - "**Prevents the user who asked Copilot cloud agent to create a pull request from approving it.** This maintains the expected controls in the "Required approvals" rule and branch protection."
  - "**Requires an additional approval when a pull request isn't attributed to a person.** When Copilot cloud agent opens a pull request under its own app identity, one more approval is required before it can be merged, as long as the repository already requires at least one approval."
  - "**Restricts GitHub Actions workflow runs.** By default, workflows are not triggered until Copilot cloud agent's code is reviewed and a user with write access to the repository clicks the **Approve and run workflows** button."
  - "**Limits who can trigger the agent.** Only users with write access to the repository can trigger Copilot cloud agent to work."
- Section "Automations run without a person initiating each task": "**Work is attributed to the person who created the automation.** Pull requests opened and code pushed by an automation are attributed to the user who created the automation. As when that user creates a pull request themselves, they can't approve it…"

**F2.10: The requester's approval does not count**
- URL: https://docs.github.com/en/copilot/how-tos/copilot-on-github/use-copilot-agents/review-copilot-output ("Review output from Copilot")
- Quote: "If your repository requires pull request approvals, **your approval of a Copilot pull request won't count** toward the required number. Another reviewer must approve the pull request before it can be merged." / "To request changes from Copilot on its pull request, mention `@copilot` in a comment, or push commits directly to the branch."
- See also F1.6: "You will also not be able to approve a pull request that was raised by GitHub Copilot if it was you who assigned Copilot to the issue…"

**F2.11: The ruleset setting for unattributed Copilot PRs**
- URL: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets → "Additional approval for unattributed Copilot pull requests"
- Quotes: "**Require an additional approval for unattributed Copilot pull requests** is enabled by default, for both new and existing rulesets. When Copilot opens a pull request that isn't attributed to a person, the ruleset requires one more approval than the number you configured." / "That assumption doesn't hold when Copilot opens a pull request under its own app identity instead of on behalf of a person, for example when you prompt it from a shared context such as a group thread or channel."
- Establishes: Copilot is the PR's identity, and the PR is attributed to a person when one person started it. **INFERENCE:** GitHub treats "Copilot opened it for person X" as X's PR for approval purposes. That is the model a harness would mimic with a user-to-server token from an App.

**F2.12: The agent requests a review from the requester**
- URL: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-on-github
- Quote: "Copilot will start working on the task, raise a pull request, then request a review from you when it's finished."

###### 2d. Third-party agents (Claude, Codex) through Agent HQ

**F2.13: Docs page "About third-party coding agents"**
- URL: https://docs.github.com/en/copilot/concepts/agents/about-third-party-coding-agents
- Quotes: "> Third-party coding agents are currently in public preview." / "The following third-party agents are supported on GitHub: Anthropic Claude, OpenAI Codex" / "When the agent finishes, it will request a review from you…" / "Coding agents are subject to the same security protections, mitigations, and limitations as Copilot cloud agent."
- Section "Usage costs": "Coding agents consume **GitHub Actions minutes** and **AI credits**. Each agent session consumes AI credits based on the model used and the number of tokens processed."
- Section "Partner agents": "When enabling partner agents in your user or organization Copilot cloud agent settings, a GitHub App will be installed for the corresponding agent. **Allow Claude coding agent** will install `anthropic code agent`. **Allow Codex coding agent** will install `openai code agent`. Actions taken by these GitHub Apps will be visible in your audit log, but the GitHub Apps themselves will not be visible in your account's list of GitHub App installations."
- Section "Making coding agents available": Business and Enterprise subscribers enable them through the org or enterprise Copilot policies.
- URL: https://docs.github.com/en/copilot/concepts/agents/anthropic-claude
- Quote: "The Anthropic Claude coding agent uses the Claude Agent SDK and can be powered by your existing Copilot subscription." Models: "Claude Opus 4.7", "Claude Sonnet 4.6".
- Legacy billing (copilot-requests page): "While in preview, each prompt to a third-party coding agent uses **one premium request**, multiplied by the model's rate."

**F2.14: Changelog announcements**
- URL: https://github.blog/changelog/2026-02-04-claude-and-codex-are-now-available-in-public-preview-on-github/ ("Claude and Codex are now available in public preview on GitHub", Feb 4, 2026)
- Quote: "Claude by Anthropic and OpenAI Codex are now available as coding agents for Copilot Pro+ and Copilot Enterprise customers." / "No additional subscriptions are required. Access to Claude and Codex is included with your existing Copilot subscription. Each coding agent session consumes one premium request during public preview." / "Leave review comments or request changes by using @copilot, @claude, or @codex."
- URL: https://github.blog/changelog/2026-02-26-claude-and-codex-now-available-for-copilot-business-pro-users/ ("Claude and Codex now available for Copilot Business & Pro users", Feb 26, 2026)
- Quote: "Claude by Anthropic and OpenAI Codex are now available as coding agents for Copilot Business and Copilot Pro customers." / "Copilot Business: An admin must enable agents at both the enterprise and organization levels." / "All agent output appears as draft, reviewable artifacts within your existing pull request workflow."
- Note: the February "one premium request per session" pricing came before the June 1, 2026 switch to AI credits. The current docs page (F2.13) bills third-party agents in AI credits.

**SILENT: third-party agent PR and commit authorship.** The docs do not say whether a Claude or Codex PR is authored by `anthropic code agent[bot]` or by "Copilot", or who is listed as co-author. The only statement is that they share "the same security protections, mitigations, and limitations as Copilot cloud agent". **INFERENCE:** that includes "Prevents the user who asked … from approving it".

---

##### Pages checked

docs.github.com:
- pull-requests/reference/pull-request-reviews
- pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews
- pull-requests/how-tos/review-pull-requests/reviewing-proposed-changes-in-a-pull-request
- rest/pulls/reviews
- actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow
- actions/concepts/security/github_token
- actions/tutorials/authenticate-with-github_token
- rest/using-the-rest-api/rate-limits-for-the-rest-api
- apps/creating-github-apps/registering-a-github-app/rate-limits-for-github-apps
- organizations/managing-programmatic-access-to-your-organization/setting-a-personal-access-token-policy-for-your-organization
- enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-personal-access-tokens-in-your-enterprise
- authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
- apps/creating-github-apps/authenticating-with-a-github-app/making-authenticated-api-requests-with-a-github-app-in-a-github-actions-workflow
- apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation
- apps/creating-github-apps/authenticating-with-a-github-app/about-authentication-with-a-github-app
- apps/creating-github-apps/about-creating-github-apps/about-creating-github-apps
- apps/creating-github-apps/about-creating-github-apps/deciding-when-to-build-a-github-app
- apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app
- rest/authentication/permissions-required-for-github-apps
- apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps
- apps/using-github-apps/about-using-github-apps
- authentication/managing-commit-signature-verification/about-commit-signature-verification
- pull-requests/how-tos/commit-changes/troubleshooting-commits
- account-and-profile/how-tos/email-preferences/setting-your-commit-email-address
- get-started/learning-about-github/types-of-github-accounts
- get-started/learning-about-github/github-glossary
- site-policy/github-terms/github-terms-of-service
- repositories/…/managing-rulesets/available-rules-for-rulesets
- billing/concepts/product-billing/github-actions
- billing/concepts/product-billing/github-copilot-licenses
- billing/concepts/product-billing/github-copilot-billing
- copilot/concepts/agents/cloud-agent/about-cloud-agent
- copilot/concepts/agents/cloud-agent/about-automations
- copilot/concepts/agents/about-third-party-coding-agents
- copilot/concepts/agents/anthropic-claude
- copilot/concepts/agents/openai-codex
- copilot/concepts/billing-and-usage/organizations-and-enterprises/billing
- copilot/concepts/billing-and-usage/organizations-and-enterprises/seats-and-billing-cycles
- copilot/concepts/billing-and-usage/individuals/billing
- copilot/reference/copilot-billing (index)
- copilot/reference/copilot-billing/seat-assignment
- copilot/reference/copilot-billing/models-and-pricing
- copilot/reference/copilot-billing/request-based-billing-legacy (index, what-changed-with-billing, github-copilot-premium-requests, copilot-requests)
- copilot/get-started/plans
- copilot/how-tos/administer-copilot/manage-for-organization/add-copilot-cloud-agent
- copilot/concepts/enterprise/cloud-agent-access
- copilot/concepts/enterprise/agent-management
- copilot/how-tos/use-copilot-agents/cloud-agent/use-cloud-agent-on-github
- copilot/how-tos/copilot-on-github/use-copilot-agents/kick-off-a-task
- copilot/how-tos/copilot-on-github/use-copilot-agents/review-copilot-output
- copilot/concepts/security-governance-and-network-settings/risks-and-mitigations

github.blog:
- changelog/2026-06-01-updates-to-github-copilot-billing-and-plans
- changelog/2026-02-04-claude-and-codex-are-now-available-in-public-preview-on-github
- changelog/2026-02-26-claude-and-codex-now-available-for-copilot-business-pro-users

Not fetched, because they are outside the allowed source list: the README of `github.com/actions/create-github-app-token`, and the github.blog posts "Pick your agent" and "GitHub Copilot is moving to usage-based billing", which appeared only in search results.

#### Claude Code on the web and Code Review (from the Anthropic API and CI research pass)

##### Q4. Claude Code on the web, its GitHub integration, and Code Review

###### 4.1 Whose subscription and usage a cloud session uses

**F4.1a**: <https://code.claude.com/docs/en/claude-code-on-the-web>, "Use Claude Code in the cloud" (Note)
> "Cloud sessions are available on Pro, Max, and Team plans, and for Enterprise users with premium seats or Chat + Claude Code seats."

**F4.1b**: <https://code.claude.com/docs/en/iam>, section "Authentication precedence"
> "[Cloud sessions] always use your subscription credentials. If you set `ANTHROPIC_API_KEY` or `ANTHROPIC_AUTH_TOKEN` in the cloud environment, it doesn't override your subscription credentials."

**F4.1c**: <https://code.claude.com/docs/en/claude-code-on-the-web>, section "Limitations"
> "**Rate limits**: cloud sessions share rate limits with all other Claude and Claude Code usage within your account. Running multiple tasks in parallel consumes more rate limits proportionately. There is no separate compute charge for the cloud VM."

**F4.1d**: same page, section "From terminal to cloud" (Note)
> "`--cloud` requires an Anthropic account. It's not available when Claude Code is configured for Amazon Bedrock, Google Cloud's Agent Platform, or another third-party provider."

Establishes that a cloud session always bills to the **starting user's own** claude.ai subscription seat. It cannot run on the API, Bedrock or Vertex.

###### 4.2 How a cloud session connects to GitHub

**F4.2a**: <https://code.claude.com/docs/en/claude-code-on-the-web>, section "GitHub authentication options"
> "| **GitHub App** | Authorize the Claude GitHub App during [web onboarding] | Any public repository, and private repositories that the Claude GitHub App is installed on | ... |"
> "| **`/web-setup`** | Run `/web-setup` in your terminal to send your local `gh` CLI token to your Claude account | Any repository your `gh` token can access, whether or not the Claude GitHub App is installed | Individual developers who already use `gh` |"
> "In Anthropic-hosted environments, your GitHub credentials stay encrypted on Anthropic's servers and never enter a session's VM."

**F4.2b**: <https://code.claude.com/docs/en/web-quickstart>, connect-GitHub step
> "After you sign in, claude.ai/code prompts you to connect GitHub. Follow the prompt, and claude.ai/code sends you to GitHub's authorization page."
> "When you connect, Claude also links the GitHub accounts you own to your Claude organization, if they have the Claude GitHub App installed. On Team and Enterprise plans, admins see those accounts in the [connected GitHub accounts list]."

**F4.2c**: <https://code.claude.com/docs/en/web-quickstart>, section "Connect from your terminal"
> "When you run `/web-setup`, Claude Code reads the token that `gh auth token` prints, asks you to confirm, and sends the token to Anthropic. Anthropic stores it encrypted with your claude.ai account"

**F4.2d**: <https://code.claude.com/docs/en/cloud-environments>, section "GitHub proxy"
> "**Git credentials**: the git client inside the VM uses a scoped credential, which the proxy verifies and swaps for your actual GitHub token."

**F4.2e**: <https://code.claude.com/docs/en/claude-code-on-the-web>, section "GitHub authentication options"
> "Quick web setup is an organization setting that lets members connect GitHub with `/web-setup` ... On Team and Enterprise plans it's off by default, which hides `/web-setup`."

###### 4.3 Who authors a cloud session's PRs, commits and comments

**F4.3a**: <https://code.claude.com/docs/en/claude-code-on-the-web>, section "How Claude responds to PR activity" (auto-fix)
> "Claude may reply to review comment threads on GitHub as part of resolving them. These replies are posted using your GitHub account, so they appear under your username, but each reply is labeled as coming from Claude Code so reviewers know it was written by the agent and not by you directly."

**F4.3b**: <https://code.claude.com/docs/en/cloud-environments>, section "Link output back to the session"
> "Commits that Claude creates in a cloud session include a `Claude-Session: <url>` git trailer, and PR bodies include the session URL on its own line."

**F4.3c**: <https://code.claude.com/docs/en/web-quickstart>, step "Create a pull request"
> "When the diff looks right, select **Create PR** at the top of the diff view. You can open it as a full PR, a draft, or jump to GitHub's compose page with a generated title and description."

SILENT: the docs never state explicitly who is the GitHub author of a cloud session's pushes or its "Create PR" pull requests. Checked: `claude-code-on-the-web`, `web-quickstart`, `cloud-environments`.

INFERENCE: pushes and API calls go out with "your actual GitHub token" (F4.2d), and auto-fix replies "appear under your username" (F4.3a). Pushes and PRs from a cloud session therefore appear under the session owner's GitHub account, not under `claude[bot]`. The git commit author or committer metadata is not documented.

###### 4.4 Code Review (managed `@claude review`)

**F4.4a**: <https://code.claude.com/docs/en/code-review>, "Code Review" (Note)
> "Code Review is in research preview, available for [Team and Enterprise] subscriptions. It is not available for organizations with [Zero Data Retention] enabled."

**F4.4b**: same page, section "Set up Code Review"
> "You need the Owner or Primary Owner role in your Claude organization and permission to install GitHub Apps in your GitHub organization."
> "To review a pull request, Claude reads your repository contents through the app's read access, and posts comments and the [check run] through its write access to pull requests and checks."

**F4.4c**: same page, section "Manually trigger reviews"
> "`@claude review` | Starts a single review without subscribing the PR to future pushes"
> "You must have write, maintain, or admin permission on the repository"

**F4.4d**: same page, section "Pricing"
> "Code Review is billed based on token usage. Each review averages \$15-25 in cost, scaling with PR size, codebase complexity, and how many issues require verification. Code Review usage is billed separately through [usage credits] and does not count against your plan's included usage."
> "Costs appear on your Anthropic bill regardless of whether your organization uses Amazon Bedrock or Google Cloud's Agent Platform for other Claude Code features. To set a monthly spend cap for Code Review, go to claude.ai/admin-settings/usage and configure the limit for the Claude Code Review service."

**F4.4e**: same page, section "View usage"
> "Go to claude.ai/analytics/code-review to see Code Review activity across your organization."

The dashboard rows include "Cost weekly | Weekly spend on Code Review" and "Repository breakdown | Per-repo counts of PRs reviewed and comments resolved".

Establishes that Code Review bills to the organisation's usage credits, not to the commenter's seat. Reporting is per organisation and per repository.

SILENT: no page says whether Code Review cost is attributed to the PR author or to the person who commented `@claude review`. Checked: `code-review`, `costs`, `analytics`.

INFERENCE: comments are posted through the Claude GitHub App (F4.4b), so they appear as the App.

---

##### Pages checked

All fetched successfully (HTTP 200), with two exceptions noted below.

- **code.claude.com/docs/en:** `costs`, `analytics`, `iam`, `monitoring-usage`, `amazon-bedrock`, `google-vertex-ai`, `github-actions`, `github-actions-cloud-providers`, `claude-code-on-the-web`, `web-quickstart`, `cloud-environments`, `code-review`, `env-vars`, `settings`, `cli-reference`.
- **platform.claude.com/docs/en/manage-claude:** `workspaces`, `admin-api`, `authentication`, `usage-cost-api`, `claude-code-analytics-api`, `analytics-api`, `user-management`, `spend-limits-api`, `admin-api-keys`, `rate-limits-api`, `workload-identity-federation`, `wif-providers/github-actions`.
- **platform.claude.com/docs/en:** `api/rate-limits`, `api/overview`.
- **support.claude.com:** articles 10186004 (Console roles) and 11845131 (Claude Code with Team/Enterprise).
- **anthropics/claude-code-action:** `README.md`, `docs/setup.md`, `docs/security.md`, `docs/faq.md`, `docs/cloud-providers.md`, `docs/usage.md`, `docs/configuration.md`, plus source files `src/github/validation/permissions.ts`, `src/github/token.ts` and `src/create-prompt/index.ts`.
- **AWS:** `iam-principal-cost-allocation`, Bedrock `cost-mgmt-best-practices`, `cost-mgmt-request-metadata`, `cost-mgmt-faq`, `inference-profiles`, `inference-profiles-create`, IAM `id_roles_create_for-idp_oidc`, `id_session-tags`, and STS `API_AssumeRoleWithWebIdentity`.
- **Google Cloud:** Vertex `add-labels-to-api-calls`, IAM `workload-identity-federation-with-deployment-pipelines`.

Two pages returned 404:

- `platform.claude.com/docs/en/manage-claude/service-accounts`. Service accounts are covered inside `workload-identity-federation` and `authentication`.
- `platform.claude.com/docs/en/manage-claude/organization-roles` (and `members`). Roles are covered in `admin-api` and support article 10186004.
