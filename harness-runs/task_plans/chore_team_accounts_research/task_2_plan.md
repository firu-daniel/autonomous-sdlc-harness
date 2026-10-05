### Task 2 — Write §2, the Claude API organisation, Bedrock and Vertex, workload identity federation and `claude-code-action` (R1–R7)

**Goal:** Fill `## 2. The Claude API, cloud providers and CI` in `docs/team-accounts-research.md`: how a team uses Claude through a Console organisation (roles, workspaces, key types, spend and rate limits, how usage is attributed), the same for Claude Code through Amazon Bedrock and Google Vertex AI, workload identity federation from GitHub Actions to the Claude API and the stock `claude` CLI's support for it, and what Anthropic documents for CI — `anthropics/claude-code-action` and the Claude GitHub App. Every claim comes from `### Evidence` below.

**Depends on:** Task 1, which creates `docs/team-accounts-research.md` with its method section, its `**Status:**` / `**Answer:**` / `**Inference:**` / `**Evidence:**` entry shape, and the placeholder heading `## 2. The Claude API, cloud providers and CI` carrying the line `_Written by a later task of this branch._`. This task replaces that line with §2's body and touches no other section. P4 (the terms, including the legal page's API-key carve-out) is Task 1's: cite it as `P4` rather than re-quoting it.

**Where this task stops.** It records what the sources say about each route. Whether the harness should use a route, and what would change in `harness-run.yml` to do so, is Task 4's §5: write no option and no recommendation here, but write each entry so that §5 can cite it — in particular R2 (who owns a key and who may use it), R4 (what usage is attributable to whom) and R6 (what federation needs from a workflow job).

### Targets

- `docs/team-accounts-research.md` — `## 2. The Claude API, cloud providers and CI`.

**Work:**

- [ ] **R1. A Console organisation: roles, members and workspaces, and the auto-created Claude Code workspace.** From evidence 1.1, 1.2 and 1.8 (the Console route in the iam / authentication doc: the **Claude Code** and **Developer** roles).
- [ ] **R2. Who owns a Console API key, and who may use it.** From evidence 1.3: the three key types (personal, service account, legacy workspace key) and what retires each; Anthropic's guidance "For shared or automated workloads (CI, production services), have an organization admin create a service account"; the Admin API's `principal` per key. Cite P4's carve-out for keys used by "the customer's own authorized users". **R3. Spend and rate limits** from evidence 1.4: workspace limits below the organisation's, the Claude Code workspace checked separately, the Spend Limits API Enterprise-only. **R4. How usage is attributed** from evidence 1.5–1.9: Usage API by key and workspace, Cost API by workspace and description only, no user dimension; the Claude Code Analytics API per user by email or key name, excluding Bedrock, Vertex and Foundry; OpenTelemetry's user attributes only for an Anthropic-account sign-in; the evidence's INFERENCE on per-user attribution through personal keys kept as **Inference**.
- [ ] **R5. Claude Code through Amazon Bedrock and Google Vertex AI: credentials, per-user attribution, and GitHub Actions OIDC.** From evidence Q2. Keep apart what Anthropic's Claude Code pages say (credentials, nothing on per-user attribution) from what AWS and Google say (CUR 2.0 `line_item_iam_principal`, tagged application inference profiles; Vertex per-call labels on pay-as-you-go), and carry the INFERENCE that a GitHub OIDC trust maps a repository or branch to one role or service account, not to a person.
- [ ] **R6. Workload identity federation from GitHub Actions to the Claude API, and the `claude` CLI.** From evidence W1–W12 and Q3's F3.1c–F3.1e. Must carry: the exchange of GitHub's OIDC token for a short-lived Anthropic token through a Console service account, with no stored secret (W1); `id-token: write` (W2); GitHub's token lasting about five minutes and the need to refresh the token file for a job longer than the Anthropic token's lifetime (W3), which is 60 to 86,400 seconds, default 3,600 (W6); the rule's matchers — `subject_prefix`, exact top-level `claims`, a CEL `condition`, AND semantics (W5) — and the `sub` forms (W1) with the fork warning (W4); the `workspace_id` "whose quota, billing, and rate limits apply" (W6); the opaque `401` (W8). Then the **CLI**: Claude Code lists WIF among its supported authentication types (W9), reads the federation variables (W11), and ranks them **below** `ANTHROPIC_API_KEY` and `CLAUDE_CODE_OAUTH_TOKEN` (W10), so a job using federation leaves both unset, and an exported empty string still occupies its slot (W7). The **Inference** that a rule can be bound to one GitHub login through `"claims": {"actor": "<login>"}` stays labelled as untested.
- [ ] **R7. CI use of Claude Code: `anthropics/claude-code-action` and the Claude GitHub App.** From evidence Q3: the credentials it accepts (F3.1a–b); **Not documented:** any per-user credential model (F3.2a, pages checked as listed), with the INFERENCE that a workflow's usage bills to its one credential; the actor check — `admin` or `write` from the collaborator-permission API, bots refused unless in `allowed_bots` (F3.3) — noting that `remote-run.sh`'s `authorise_actor` makes the same check (cite `github-integration-research.md` → T4 rather than re-arguing it); the App's permissions, `claude[bot]` authorship, the source-only `Co-authored-by` trailer (marked as read from source, not documented), and the default flow where the human opens the pull request (F3.4); `/install-github-app` saving the installing admin's own credential as the repository secret (F3.5) with its INFERENCE kept as such.

**Verification:**

- Every quote, number and claim name in §2 appears in `### Evidence` below; grep each one against this file.
- A statement read from `claude-code-action`'s source rather than its documents says so, as the evidence does for F3.3d, F3.4d and F3.4g.
- R6 states the credential precedence (`ANTHROPIC_API_KEY` above `CLAUDE_CODE_OAUTH_TOKEN` above federation) in the words of W10, and the `actor`-bound rule as **Inference**.
- No sentence in §2 recommends a route or describes a harness change.
- `grep -nE '/Users/|/home/|/private/|/tmp/' docs/team-accounts-research.md` finds nothing. Then `bash scripts/test.sh`, run without a pipe, fails no gate that does not also fail on the branch's base commit: gate 6a (*no machine paths*) is red in this self-adopted checkout by design (`scripts/run-gates.sh` → the comment above gate 6e), so compare its hits, and no hit may name a file this branch wrote.
- **Deviations from plan:**
  - The `bash scripts/test.sh` step is deferred to the Run gates phase (`unit_loop_core.md` → `## The test-run rule`); the machine-path grep was run and found nothing.
  - R2, R3 and R4 are written as three separate entries rather than one bullet's worth, so each can be cited by ID.
  - R1 records, without resolving, that the workspaces page ("Claude Code mints a per-user API key in this workspace at sign-in") and the authentication page ("It creates no API key", for the recommended Console sign-in) differ.
  - The quote check grepped every quoted string in §2 against `### Evidence` by script; the only strings not found verbatim are P4's carve-out (Task 1's evidence, cited as P4), the key-type table rows joined across the evidence's line break, and two splits on embedded quote marks inside code spans.

### Evidence

The planning session's research for this task, recorded on 2026-10-02. The first part (Q1–Q3) comes from a research pass over Anthropic's platform and Claude Code docs, AWS and Google Cloud docs and the `claude-code-action` repository; the second (W1–W12) was fetched in the planning session itself. Headings are demoted so they nest under this file; the text is otherwise unchanged. **INFERENCE** and **SILENT** lines are the researcher's labels and carry over as **Inference** and **Not documented**.

#### Team accounts research: Claude API, cloud providers, CI, and Claude Code cloud

All sources were retrieved on 2026-10-02. Anthropic pages were fetched as raw Markdown (`<page>.md`), and AWS, Google Cloud and support.claude.com pages as HTML converted to text, so the quotes below are verbatim from the page body. Repository files come from `anthropics/claude-code-action` at `main`, commit `97c53473391bff1901034d4b454b5bac7ab7a029` (committed 2026-10-01).

How to read the labels:

- **INFERENCE** marks a conclusion I drew that no single source states.
- **SILENT** means none of the pages I checked addresses the point. Each SILENT note lists the pages checked.

---

##### Q1. The Claude API route for a team (Console organisation, workspaces, keys, limits, usage attribution)

###### 1.1 Organisation roles (Console)

**F1.1a**: <https://platform.claude.com/docs/en/manage-claude/admin-api>, "Admin API", section "Organization roles and permissions"
> "There are five organization-level roles. ... | user | Can use playground | | claude\_code\_user | Can use playground and [Claude Code] | | developer | Can use playground and manage API keys | | billing | Can use playground and manage billing details | | admin | Can do all of the preceding, plus manage users |"
> "Organization owners and primary owners have all admin permissions and can also manage admins."

Establishes that Console organisations have five API-assignable roles, one of which (`claude_code_user`) is specific to Claude Code.

**F1.1b**: <https://support.claude.com/en/articles/10186004-api-console-roles-and-permissions>, "API Console roles and permissions" (intro and "Role types and permissions")
> "The Claude Console uses a role-based access system with six distinct roles: User, Claude Code User, Limited Developer, Developer, Billing, and Admin."
> "Claude Code User — Can use the playground and Claude Code / Can access Claude Code workspace in your org"
> "Billing — ... Cannot access Claude Code workspace in your org"
> "Organization-level roles serve as a baseline, while Workspace roles can grant additional permissions."

Establishes that the support article lists six roles, adding Limited Developer to the Admin API's five.

**F1.1c**: <https://code.claude.com/docs/en/iam>, "Authentication", section "Claude Console authentication"
> "Bulk invite users from within the Console: Settings -> Members -> Invite" ... "When inviting users, assign one of: **Claude Code** role: users can only create Claude Code API keys / **Developer** role: users can create any kind of API key"

Establishes the onboarding path for Claude Code users in a Console organisation: invite each user and give them the Claude Code or Developer role.

###### 1.2 Workspaces, and the auto-created "Claude Code" workspace

**F1.2a**: <https://platform.claude.com/docs/en/manage-claude/workspaces>, "Workspaces", section "How workspaces work"
> "Every organization has a **Default Workspace** that cannot be renamed, archived, or deleted. When you create additional workspaces, you can assign members, service accounts, API keys, and resource limits to each one."
> "**Maximum 100 workspaces** per organization by default"

**F1.2b**: same page, section "Claude Code workspace"
> "When a member of your organization first signs in to [Claude Code] with their Claude Console account, Anthropic automatically creates a **Claude Code** workspace in the organization and adds that member to it."
> "* Claude Code mints a per-user API key in this workspace at sign-in. You cannot create keys in it manually from the Console.
> * A Claude Code key stops working if its owner is removed from the workspace or organization, unlike a workspace key.
> * Claude Code usage is rate-limited separately, and admins can cap its share of the organization's limits under Settings > Workspaces.
> * It is the only workspace that supports per-user monthly spend limits."

Establishes that, on the Console route, interactive Claude Code use runs on a **per-user key that is owned by the member**, inside a dedicated workspace. That workspace is the only one with per-user monthly spend limits.

**F1.2c**: same page, section "Workspace roles and permissions"
> "| Workspace User | Use playground only | | Workspace Limited Developer | Create and manage API keys, use the API. Cannot access session tracing views or download files. | | Workspace Developer | Create and manage API keys, use the API | | Workspace Admin | Full control over workspace settings and members | | Workspace Billing | View workspace billing information (inherited from organization billing role) |"
> "**Organization admins** automatically receive Workspace Admin access to all workspaces ... **Organization users and developers** must be explicitly added to each workspace"

###### 1.3 API keys: who owns a key

**F1.3a**: <https://platform.claude.com/docs/en/manage-claude/authentication>, "Authentication", section "Key types"
> "| **Personal key** | You, the user, with your roles and permissions | Either a single workspace or the workspaces where your role allows API use, chosen when the key is created | You lose access to the organization or, for a single-workspace key, to that workspace. Personal keys are archived when you are removed from the organization. ... |
> | **Service account key** | A service account | Either a single workspace or anything the service account has access to ... | The service account is archived or, for a single-workspace key, is removed from that workspace |
> | **Workspace key** (legacy) | No one: it belongs to the workspace it was created in | That workspace | It expires, is disabled or deleted, or its workspace is archived, regardless of whether its creator leaves the organization |"

Establishes three ownership models: per user (personal key), per non-human identity (service account key), and per workspace (legacy key with no owner).

**F1.3b**: same page, same section
> "Use a personal key for your own development and scripts. A shared personal key acts as one person and breaks when they leave. For shared or automated workloads (CI, production services), have an organization admin create a service account so the workload has its own identity."
> "Workspace API keys still work but should be considered legacy; identity-backed keys or [Workload Identity Federation] are preferred."

Establishes Anthropic's guidance: CI should use a service account key, or WIF, and not a person's key.

**F1.3c**: same page, section "Create and use a key"
> "Set **Linked account** to yourself for a personal key, or to a service account for a key shared across multiple users. You can also scope the key to a specific workspace"

**F1.3d**: <https://platform.claude.com/docs/en/manage-claude/admin-api>, section "API keys"
> "For a personal key, `principal` is `{"type": "user_actor", "user_id": "user_..."}`; for a service account key, `{"type": "service_account_actor", "service_account_id": "svac_..."}`; and for a workspace key, `null`."

Establishes that the Admin API exposes each key's owning principal, so a key can be mapped to a user programmatically.

**F1.3e**: <https://platform.claude.com/docs/en/manage-claude/workspaces>, section "API keys and resource scoping"
> "Every request runs in exactly one workspace and can only access resources within that workspace."
> "A **personal key** or **service account key** acts as its user or service account. A single-workspace key always runs in the workspace chosen when it was created. A multi-workspace key runs in the workspace named by each request's `anthropic-workspace-id` header."

###### 1.4 Workspace spend limits and rate limits

**F1.4a**: <https://platform.claude.com/docs/en/manage-claude/workspaces>, section "Workspace limits"
> "You can set workspace limits lower than (but not higher than) your organization's limits: * **Spend limits:** Cap monthly spending for a workspace. ... * **Rate limits:** Limit requests per minute, input tokens per minute, or output tokens per minute."
> "You cannot set limits on the Default Workspace / If not set, workspace limits match the organization's limits / Organization-wide limits always apply, even if workspace limits add up to more"

**F1.4b**: <https://platform.claude.com/docs/en/api/rate-limits>, "Rate limits" (intro and spend-limit paragraph)
> "The API enforces service-configured limits at the organization level, but you may also set user-configurable limits for your organization's workspaces."
> "Limits on the [Claude Code workspace] are checked separately: Claude Code requests over that workspace's limit can instead receive a 429 that carries a `retry-after` header."

**F1.4c**: <https://platform.claude.com/docs/en/manage-claude/spend-limits-api>, "Spend Limits API"
> "The Spend Limits API is available to Claude Enterprise organizations only. It is not available to Claude Platform (Claude Console) organizations."

Establishes that per-user spend limits through the API are an Enterprise (claude.ai) feature. For Console organisations, the per-user monthly limit exists only on the Claude Code workspace (F1.2b) and is set in the Console UI.

###### 1.5 How usage and cost are attributed

**F1.5a**: <https://platform.claude.com/docs/en/manage-claude/usage-cost-api>, "Usage and Cost API", section "Usage API → Key concepts"
> "**Filtering & grouping:** Filter by API key, workspace, model, service tier, context window, [data residency], or speed (beta), and group results by these dimensions"

**F1.5b**: same page, section "Cost API → Key concepts"
> "**Grouping:** Group costs by workspace or description for detailed breakdowns."

Establishes the attribution dimensions. Usage can be broken down by API key and by workspace. Dollar cost can be broken down by workspace and description only, not by key.

**F1.5c**: same page, FAQ
> "API usage from playground in the Claude Console ... is not associated with an API key, so `api_key_id` will be `null` even when grouping by that dimension."
> "Usage and costs attributed to the default workspace have a `null` value for `workspace_id`."
> "**How do I get per-user cost breakdowns for Claude Code?** Use the [Claude Code Analytics API], which provides per-user estimated costs and productivity metrics without the performance limitations of breaking down costs by many API keys. For general API usage with many keys, use the [Usage API] to track token consumption as a cost proxy."

Establishes that the Usage and Cost API has no "user" dimension. Anthropic points to the Claude Code Analytics API for per-user Claude Code cost.

INFERENCE: for non-Claude-Code API traffic, per-user attribution is achievable only indirectly. Give each user a personal key, group usage by `api_key_id`, then map each key to its `principal.user_id` (F1.3d). Even then, the Cost API cannot group by key, so dollars per user must be estimated from tokens.

**F1.5d**: same page, the Check box
> "These endpoints are part of the Admin API. You can access them using an [Admin API key], an OAuth token with the `org:admin` scope, or a personal or service account key that isn't scoped to a workspace; workspace API keys don't work."

**F1.5e**: <https://platform.claude.com/docs/en/manage-claude/claude-code-analytics-api>, "Claude Code Analytics API", sections "Key concepts" and "Dimensions"
> "**User-level data:** Each record represents one user's activity for the specified day"
> "**actor:** The user or API key that performed the Claude Code actions (either `user_actor` with `email_address` or `api_actor` with `api_key_name`)"
> "**estimated\_cost.amount:** Estimated cost in cents USD for this model"

**F1.5f**: same page, FAQ
> "This API only tracks Claude Code usage on the Claude API. Usage through [Claude in Amazon Bedrock], [Claude in Microsoft Foundry], [Claude on Google Cloud], or [Claude Platform on AWS] is not included."

Establishes per-user, per-day Claude Code cost for Console-billed use. A user is identified by email when they sign in with OAuth, and by key name when they use an API key. Cloud-provider traffic is excluded.

**F1.5g**: <https://platform.claude.com/docs/en/manage-claude/workspaces>, section "Identify the workspace behind an API response"
> "Claude API responses include an `anthropic-workspace-id` header ... Its value is the `wrkspc_`-prefixed ID of the workspace that the request's API key or access token resolved to"

###### 1.6 Claude Code docs on team cost management

**F1.6a**: <https://code.claude.com/docs/en/costs>, "Manage costs effectively", section "Manage costs for your organization"
> "On Teams and Enterprise plans, usage draws from each member's seat allowance. On the Console and on cloud providers, usage is billed per token to your organization. If your organization mixes sign-in methods, each developer is metered according to the one they authenticated with."
> "| [Claude Console (API)] | [Console usage page] | Workspace spend limits | [Console dashboard], [Claude Code Analytics API] |"
> "| [Amazon Bedrock, Google Cloud's Agent Platform, or Microsoft Foundry] | Your cloud billing console | Your cloud's budget controls | [OpenTelemetry] or an [LLM gateway] |"
> "[OpenTelemetry export] works on every setup and is the only option that streams per-user token and cost metrics into your own observability stack in near real time."

**F1.6b**: same page, section "Claude Console" (Note)
> "When you first authenticate Claude Code with your Claude Console account, a workspace called "Claude Code" is automatically created for you. This workspace provides centralized cost tracking and management for all Claude Code usage in your organization. You cannot create API keys for this workspace; it is exclusively for Claude Code authentication and usage."
> "For organizations with custom rate limits, Claude Code traffic in this workspace counts toward your organization's overall API rate limits. You can set a [workspace rate limit] on this workspace's Limits page in the Claude Console to cap Claude Code's share and protect other production workloads."

**F1.6c**: same page, section "Rate limit recommendations"
> "| 1-5 users | 200k-300k | 5-7 | | 5-20 users | 100k-150k | 2.5-3.5 | | 20-50 users | 50k-75k | 1.25-1.75 | | 50-100 users | 25k-35k | 0.62-0.87 | | 100-500 users | 15k-20k | 0.37-0.47 | | 500+ users | 10k-15k | 0.25-0.35 |"
> "These rate limits apply at the organization level, not per individual user, which means individual users can temporarily consume more than their calculated share when others aren't actively using the service."

Columns are team size, TPM per user, and RPM per user. Establishes that the recommended per-user TPM/RPM figures are for sizing the organisation's limit, not caps enforced on each user.

**F1.6d**: same page, section "Claude for Teams and Enterprise"
> "On Claude for Teams and Enterprise plans, each member's Claude Code usage draws from a per-seat allowance that resets on a rolling five-hour window and a weekly window. The allowance is shared with Claude chat and Cowork ... Your controls live in the claude.ai admin console, not the Claude Console."
> "**Cap spend**: the seat allowance is the default ceiling. To let members continue past it, turn on [usage credits] and set spend limits at the organization, group, or individual member level."

**F1.6e**: same page, section "Cloud providers"
> "On Amazon Bedrock, Google Cloud's Agent Platform, and Microsoft Foundry, Claude Code is billed per token to your cloud account, and spend controls live in your cloud provider's billing console. Claude Code does not send metrics from your cloud back to Anthropic, so the [analytics dashboards] and the Claude Code Analytics API do not cover this usage."

###### 1.7 Analytics dashboards

**F1.7a**: <https://code.claude.com/docs/en/analytics>, "Track team usage with analytics", plan table
> "| Claude for Teams / Enterprise | claude.ai/analytics/claude-code | Usage metrics, contribution metrics with GitHub integration, leaderboard, data export | ... | API (Claude Console) | platform.claude.com/claude-code | Usage metrics, spend tracking, team insights |"

**F1.7b**: same page, section "Access analytics for API customers"
> "You need the UsageView permission to access the dashboard, which is granted to Developer, Billing, Admin, Owner, and Primary Owner roles."
> "Contribution metrics with GitHub integration are not currently available for API customers."
> "**Members**: all users who have authenticated to Claude Code. API key users display by key identifier, OAuth users display by email address."

**F1.7c**: same page, section "Enable contribution metrics"
> "Contribution metrics are in public beta and available on Claude for Teams and Claude for Enterprise plans. These metrics only cover users within your claude.ai organization. Usage through the Claude Console API or third-party integrations is not included."
> "A GitHub admin installs the Claude GitHub app on your organization's GitHub account at github.com/apps/claude."

###### 1.8 Authentication methods for teams (iam)

**F1.8a**: <https://code.claude.com/docs/en/iam>, "Authentication", section "Set up team authentication"
> "* [Claude for Teams or Enterprise], recommended for most teams * [Claude Console] * [Claude apps gateway], a self-hosted gateway that signs developers in with your IdP and routes inference to the cloud provider you configure * [Amazon Bedrock] * [Google Cloud's Agent Platform] * [Microsoft Foundry]"

**F1.8b**: same page, section "Sign in without an API key"
> "**Sign in with your Console account**, labeled `(recommended)`: Claude Code keeps the OAuth token from that sign-in and stores it as an [Anthropic profile]. It creates no API key / **Create an API key**, labeled `(legacy)`: Claude Code creates a Console API key for you"

**F1.8c**: same page, section "Authentication precedence"
> "1. Cloud provider credentials, when `CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_VERTEX`, or `CLAUDE_CODE_USE_FOUNDRY` is set. ... 2. `ANTHROPIC_AUTH_TOKEN` ... 3. `ANTHROPIC_API_KEY` ... 4. [`apiKeyHelper`] script output ... 5. `CLAUDE_CODE_OAUTH_TOKEN` ... 6. Anthropic profile and federation credentials ... 7. Subscription OAuth credentials from `/login`."

**F1.8d**: same page, section "Generate a long-lived token"
> "For CI pipelines, scripts, or other environments where interactive browser login isn't available, generate a one-year OAuth token with `claude setup-token`"
> "This token authenticates with your Claude subscription and requires a Pro, Max, Team, or Enterprise plan."

**F1.8e**: same page, section "Restrict login to your organization"
> "**`claude setup-token` and `/install-github-app`**: enforce only `forceLoginMethod`, so they can mint a token in a different organization"

Establishes that the subscription OAuth token used for CI belongs to the person who generated it, and that `forceLoginOrgUUID` does not constrain that person's choice of organisation.

**F1.8f**: same page, section "Anthropic profiles and federation credentials"
> "| Federation variables | `ANTHROPIC_FEDERATION_RULE_ID` and `ANTHROPIC_ORGANIZATION_ID`, both set | Above |"

Establishes that the Claude Code CLI itself can authenticate with WIF.

###### 1.9 OpenTelemetry user attribution (monitoring-usage)

**F1.9a**: <https://code.claude.com/docs/en/monitoring-usage>, "Monitoring", section "Standard attributes"
> "| `organization.id` | Organization UUID (when authenticated) | Always included when available |"
> "| `user.account_uuid` | Account UUID (when authenticated) | `OTEL_METRICS_INCLUDE_ACCOUNT_UUID` (default: true) |"
> "| `user.account_id` | Account ID in tagged format matching Anthropic admin APIs (when authenticated), such as `user_01BWBeN28...` | ... |"
> "| `user.id` | Random anonymous identifier generated on first run and persisted in `~/.claude.json`. It contains no personal information and is not derived from your Claude account. ... | Always included |"
> "| `user.email` | User email address, from your sign-in or, in a [cloud session], from the session's own credentials | Always included when available |"

**F1.9b**: same page, section "Multi-team organization support"
> "Organizations with multiple teams or departments can add custom attributes to distinguish between different groups using the `OTEL_RESOURCE_ATTRIBUTES` environment variable"
> "* Filter metrics by team or department * Track costs per cost center * Create team-specific dashboards"

**F1.9c**: same page, section "Cost monitoring" (Note)
> "Cost metrics are approximations. For official billing data, refer to your API provider (Claude Console, Amazon Bedrock, or Google Cloud's Agent Platform)."

**F1.9d**: same page, section "Administrator configuration"
> "Claude Code ignores the [OpenTelemetry exporter variables] in a repository's `.claude/settings.json` and `.claude/settings.local.json`, so a repository can't use them to turn telemetry on, choose where it goes, or capture content."

Establishes the limits of OTel attribution. `user.email` and `user.account_id` exist only when the user signs in to an Anthropic account. On Bedrock or Vertex, only the anonymous `user.id` and any custom `OTEL_RESOURCE_ATTRIBUTES` are available. Configuration must come from managed settings or user settings, not from the repository.

INFERENCE: the documentation does not explicitly say that `user.email` is absent on Bedrock or Vertex. That follows from the "(when authenticated)" and "when available" qualifiers.

---

##### Q2. Claude Code via Amazon Bedrock and Google Vertex AI

###### 2.1 Bedrock credentials (Claude Code docs)

**F2.1a**: <https://code.claude.com/docs/en/amazon-bedrock>, "Claude Code on Amazon Bedrock", section "2. Configure AWS credentials"
> "Claude Code uses the default AWS SDK credential chain."

The options listed are "Option A: AWS CLI configuration", "Option B: Environment variables (access key)", "Option C: Environment variables (SSO profile)", "Option D: AWS Management Console credentials" and "Option E: Amazon Bedrock API keys".

**F2.1b**: same page, section "Advanced credential configuration"
> "**`awsAuthRefresh`**: runs only when Claude Code detects that your AWS credentials are expired ... **`awsCredentialExport`**: runs at session start and on each credential reload"

**F2.1c**: same page, section "IAM configuration" (Note)
> "Create a dedicated AWS account for Claude Code to simplify cost tracking and access control."

**F2.1d**: same page, section "Map each model version to an inference profile"
> "If your organization needs to expose several versions of the same family in the `/model` picker, each routed to its own application inference profile ARN, use the `modelOverrides` setting"

SILENT: the Claude Code Bedrock page says nothing about per-user cost attribution, IAM-principal cost allocation, or cost allocation tags beyond the dedicated-account note. Checked: `amazon-bedrock`, `costs`, `iam`, `monitoring-usage`.

###### 2.2 Bedrock per-user attribution (AWS docs)

**F2.2a**: <https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/iam-principal-cost-allocation.html>, "Using IAM principal for cost allocation", section "How IAM principal based cost allocation works"
> "When you enable IAM principal data in CUR 2.0, AWS automatically records the caller identity (IAM principal ARN) for each Bedrock API call in the line_item_iam_principal column. When you additionally apply tags to IAM principals (users or roles), those tags are automatically captured with associated costs and token usage."

**F2.2b**: same page, section "New CUR 2.0 column"
> "The line_item_iam_principal column contains the AWS IAM ARN of the principal making Bedrock requests. Format examples: arn:aws:iam::123456789012:user/userID_A arn:aws:iam::123456789012:role/application-role arn:aws:sts::123456789012:assumed-role/application-role/session-name"

**F2.2c**: same page, section "Step 3: Enable IAM principal data in CUR 2.0"
> "Under Additional export content, select Include caller identity (IAM principal) allocation data."

The tag-activation steps on the same page also say: "For Amazon Bedrock, tags only appear for activation after the IAM principal with the tags has made at least one API call."

**F2.2d**: <https://docs.aws.amazon.com/bedrock/latest/userguide/cost-mgmt-best-practices.html>, "Best practices for cost attribution", section "Choose the right mechanism for the question you are answering"
> "Per-user or per-team dollars on your bill. Use IAM principal attribution. The caller identity is captured automatically on every Amazon Bedrock inference call on the bedrock-runtime and bedrock-mantle endpoints, and you can layer on principal or session tags for team, department, or cost center."
> "Per-application or per-workload dollars. Use Application inference profiles on bedrock-runtime, or Projects and Workspaces on bedrock-mantle."

**F2.2e**: same page, section "Enforce tagging in a shared layer, not on every developer"
> "Cache assumed-role credentials when re-assuming per user. If your gateway re-assumes a Amazon Bedrock role per user or tenant to vary identity in billing, cache the resulting credentials for the session lifetime."

**F2.2f**: same page, section "Treat tag values as log content"
> "If you need to attribute by user, use a stable internal identifier (for example, a hashed user ID) rather than an email address."

**F2.2g**: <https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles.html>, "Set up a model invocation resource using inference profiles"
> "Use tags to monitor costs – Attach tags to an application inference profile to track costs when you submit on-demand model invocation requests."
> "Application inference profiles – Inference profiles that a user creates to track costs and model usage."

**F2.2h**: <https://docs.aws.amazon.com/bedrock/latest/userguide/cost-mgmt-request-metadata.html>, "Per-request metadata tagging"
> "Request metadata lets you attach key-value tags to individual Amazon Bedrock inference calls on the bedrock-runtime endpoint. The tags are recorded with the request in your model invocation logs."
> "Request metadata is not supported on the bedrock-mantle endpoint."

**F2.2i**: <https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html>, "AssumeRoleWithWebIdentity", Request Parameters → RoleSessionName
> "Typically, you pass the name or identifier that is associated with the user who is using your application. That way, the temporary security credentials that your application will use are associated with that user. This session name is included as part of the ARN and assumed role ID in the AssumedRoleUser response element."

INFERENCE: two attribution routes follow from F2.2b and F2.2i.

- **Interactive use.** Per-developer IAM Identity Center or SSO roles give each person a distinct `assumed-role/.../session-name` principal in CUR 2.0.
- **CI.** All runs share one role. Per-run or per-actor attribution in CUR would depend on the role session name being set per actor (for example the GitHub actor), but neither the claude-code-action docs nor the AWS docs describe doing that for GitHub Actions. By default, all CI usage attributes to the one CI role.

###### 2.3 Vertex AI credentials and attribution

**F2.3a**: <https://code.claude.com/docs/en/google-vertex-ai>, "Claude Code on Google Cloud's Agent Platform", section "3. Configure GCP credentials"
> "Claude Code uses standard Google Cloud authentication."
> "Claude Code supports [X.509 certificate-based Workload Identity Federation] through the same Application Default Credentials chain."
> "Claude Code addresses Google Cloud's Agent Platform requests to the project in `ANTHROPIC_VERTEX_PROJECT_ID`"

**F2.3b**: same page, section "IAM configuration"
> "Assign the `roles/aiplatform.user` role" ... "Create a dedicated GCP project for Claude Code to simplify cost tracking and access control."

**F2.3c**: <https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/add-labels-to-api-calls>, "Custom metadata labels", sections "What are labels?" and "Partner models"
> "Information about labels is forwarded to the billing system that lets you break down your billed charges by label."
> "Partner models support labels on the following API methods. rawPredict streamRawPredict The following partner models support labels. Anthropic Mistral AI"
> "Labels are only forwarded to Cloud Billing when the request uses the PayGo consumption option. Requests using the Provisioned Throughput consumption option will silently ignore labels sent in the request."
> "Each API call can have up to 64 labels for Google models and up to 32 labels for partner models."

The partner-model REST example on the same page passes labels in an `X-Vertex-AI-Labels` header (base64-encoded).

**F2.3d**: <https://code.claude.com/docs/en/env-vars>, `ANTHROPIC_CUSTOM_HEADERS`
> "Custom headers to add to requests (`Name: Value` format, newline-separated for multiple headers)."

INFERENCE, unverified: setting `ANTHROPIC_CUSTOM_HEADERS` to an `X-Vertex-AI-Labels: <base64>` header might give per-user or per-team labels on Claude Code's Vertex calls. Neither Anthropic nor Google documents this combination.

SILENT: Claude Code's Vertex page does not mention labels or per-user billing attribution. Checked: `google-vertex-ai`, `costs`, `env-vars`, `monitoring-usage`.

There is no Vertex equivalent of Bedrock's caller-identity CUR column in the pages I checked. Google's per-principal visibility is through Cloud Audit Logs, which I did not fetch, so I make no claim about it.

###### 2.4 GitHub Actions authentication to Bedrock and Vertex (OIDC)

**F2.4a**: <https://code.claude.com/docs/en/github-actions-cloud-providers>, "Use Claude Code GitHub Actions with cloud providers", intro
> "To route inference through your own cloud account instead, set the Claude Code GitHub Action's provider input and configure your cloud to trust the workflow's OpenID Connect (OIDC) token. The workflow authenticates with that token, so you store no long-lived cloud credential in your repository."

**F2.4b**: same page, AWS tab
> "Add a GitHub OIDC identity provider with provider URL `https://token.actions.githubusercontent.com` and audience `sts.amazonaws.com` / Create an IAM role trusted by that provider as a web identity, and attach the scoped invocation policy ... / Limit the role's trust policy to your repository with a subject condition such as `repo:your-org/your-repo:*`."

**F2.4c**: same page, Google Cloud tab
> "Create a Workload Identity Pool with a GitHub OIDC provider whose issuer is `https://token.actions.githubusercontent.com`, and add an attribute condition that limits the pool to your repository / Create a dedicated service account with only the `Vertex AI User` role, which is `roles/aiplatform.user`, and allow the pool to impersonate it"

**F2.4d**: same page, step 1 (GitHub identity)
> "The Claude Code GitHub Action pushes commits and posts comments through a GitHub identity. ... With a cloud provider, you choose the identity yourself: * **Official Claude GitHub App** ... * **Custom GitHub App** ... * **GitHub's automatic `GITHUB_TOKEN`**: no app to create or install, but GitHub doesn't trigger your CI workflows on commits made with it"

**F2.4e**: same page, Warning on public repositories
> "The credential steps run before the Claude Code GitHub Action checks the commenter's write access, so the action rejects unauthorized users only after the workflow has generated an App token and signed in to your cloud provider"

**F2.4f**: <https://github.com/anthropics/claude-code-action/blob/main/docs/cloud-providers.md>, "Cloud Providers"
> "Bedrock, Vertex, and Microsoft Foundry use OIDC authentication exclusively"

**F2.4g**: <https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html>, section "Configuring a role for GitHub OIDC identity provider"
> "When you include a condition statement in the trust policy, you can limit the role to a specific GitHub organization, repository, or branch. You can use the condition key token.actions.githubusercontent.com:sub with string condition operators to limit access."

**F2.4h**: <https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines>, "Configure Workload Identity Federation with deployment pipelines", GitHub Actions attribute mapping
> "At minimum, you should map google.subject to assertion.sub, which corresponds to the GitHub Actions OIDC token subject"

INFERENCE: in every OIDC setup above, the cloud identity is per repository, branch or environment (the `sub` claim). It is never per human. All CI usage in a repository bills to one IAM role or one GCP service account.

---

##### Q3. CI use of Claude Code (claude-code-action)

###### 3.1 Credentials the action accepts

**F3.1a**: <https://github.com/anthropics/claude-code-action/blob/main/docs/usage.md>, "Inputs" table
> "| `anthropic_api_key` | Anthropic API key (required for direct API, not needed for Bedrock/Vertex) |"
> "| `claude_code_oauth_token` | Claude Code OAuth token (alternative to anthropic_api_key) |"
> "| `anthropic_federation_rule_id` | Workload identity federation rule ID (`fdrl_...`). With `anthropic_organization_id`, authenticates via the workflow's GitHub OIDC token instead of a static API key."
> "| `anthropic_service_account_id` | Service account ID (`svac_...`) the federated token acts as (optional) |"
> "| `use_bedrock` | Use Amazon Bedrock with OIDC authentication instead of direct Anthropic API | ... | `use_vertex` | Use Google Vertex AI with OIDC authentication instead of direct Anthropic API |"

**F3.1b**: <https://github.com/anthropics/claude-code-action/blob/main/README.md>, intro
> "It supports multiple authentication methods including Anthropic direct API (API key or workload identity federation), Amazon Bedrock, Google Vertex AI, and Microsoft Foundry."

**F3.1c**: <https://github.com/anthropics/claude-code-action/blob/main/docs/setup.md>, "Setup Guide", section "Workload Identity Federation"
> "Workload Identity Federation (WIF) lets the action authenticate to the Claude API by exchanging the workflow's GitHub Actions OIDC token for a short-lived Anthropic access token — no `ANTHROPIC_API_KEY` secret to create, store, or rotate."
> "**Create a service account** (Settings → Service accounts) and add it to the workspace it should act in."
> "Do not set `anthropic_api_key` or `claude_code_oauth_token` alongside the federation inputs — a static credential takes precedence and federation will not be used."
> "Inline comment classification (`classify_inline_comments`) currently requires `anthropic_api_key`; with federation it is skipped"

**F3.1d**: <https://platform.claude.com/docs/en/manage-claude/wif-providers/github-actions>, "Use WIF with GitHub Actions"
> "The token's `sub` claim encodes the repository and trigger context. For a push to a branch it has the form `repo:<owner>/<repo>:ref:refs/heads/<branch>`. Pull-request runs use `repo:<owner>/<repo>:pull_request`"
> "A `subject_prefix` of `repo:your-org/*` alone matches every repository in your organization, and without a `ref` constraint it also matches `pull_request` runs triggered from forks."

**F3.1e**: <https://code.claude.com/docs/en/github-actions>, "Claude Code GitHub Actions", section "Set up for an organization"
> "For a secret shared across repositories, authenticate with an API key from the [Claude Console] rather than an OAuth token, since an OAuth token is tied to the subscription of the person who ran `claude setup-token`."
> "To avoid storing a long-lived secret entirely, authenticate through workload identity federation, where the Claude Code GitHub Action exchanges the workflow's GitHub OpenID Connect (OIDC) token for Claude API access through a Claude Console service account."

**F3.1f**: same page, section "Manage costs"
> "If you authenticate with an OAuth token, runs use your Claude subscription instead of API billing."

###### 3.2 Is there a per-user credential model?

**F3.2a**: <https://code.claude.com/docs/en/github-actions>, section "Set up for an organization"
> "Store the authentication secret as an organization-level Actions secret so each repository doesn't need its own copy"

SILENT: no source describes any per-user credential model, meaning a model where the human who triggered `@claude` has the run billed to their own subscription or key. Checked: code.claude.com `github-actions`, `github-actions-cloud-providers`, `iam`, `costs`; and in claude-code-action `README.md`, `docs/setup.md`, `docs/usage.md`, `docs/security.md`, `docs/faq.md`, `docs/cloud-providers.md`, `docs/configuration.md`.

Every documented credential is a single workflow-level value: one API key, one OAuth token, one federation rule acting as one service account, or one cloud OIDC role or service account.

INFERENCE: all of a workflow's model usage bills to the one credential configured in it. On the Anthropic API, the Usage API therefore sees one `api_key_id` or one service account per workflow. With an OAuth token, all usage consumes the one subscriber's allowance.

INFERENCE: a workflow author could, in principle, choose a credential based on `github.actor`, for example a per-user secret. No source documents this pattern.

###### 3.3 Write-permission check on the triggering actor

**F3.3a**: <https://github.com/anthropics/claude-code-action/blob/main/docs/security.md>, "Security", section "Access Control"
> "**Repository Access**: The action can only be triggered by users with write access to the repository. This is checked for issue, pull request, comment, and review events, and for `workflow_run` events, where both the workflow actor and the actor that started the upstream run are checked. `workflow_dispatch`, `repository_dispatch`, and `schedule` events are not checked separately — GitHub itself requires write access to dispatch a workflow, and scheduled runs have no external actor."
> "**Bot User Control**: By default, GitHub Apps and bots cannot trigger this action for security reasons. Use the `allowed_bots` parameter to enable specific bots or all bots"

**F3.3b**: same file, same section
> "The `allowed_non_write_users` parameter allows bypassing the write permission requirement. ... Only works when `github_token` is provided as input (not with GitHub App authentication)"

**F3.3c**: <https://code.claude.com/docs/en/github-actions>, section "Who can trigger runs"
> "**Write access**: on issue and pull request events, the triggering user must have write access to the repository." ... "**Human actor**: on every event, the Claude Code GitHub Action rejects a bot actor unless you list it in `allowed_bots`"

**F3.3d**: source code at <https://github.com/anthropics/claude-code-action/blob/main/src/github/validation/permissions.ts> (repository source, not documentation)
> `const response = await octokit.repos.getCollaboratorPermissionLevel({ owner: repository.owner, repo: repository.repo, username: actor, });` ... `if (permissionLevel === "admin" || permissionLevel === "write") {`

Establishes the mechanism: the action calls GitHub's collaborator-permission endpoint for the actor and accepts `admin` or `write`. This check gates who may trigger a run. It plays no part in billing.

###### 3.4 The Claude GitHub App: purpose, permissions, authorship

**F3.4a**: <https://code.claude.com/docs/en/github-actions>, section "GitHub App permissions"
> "The [Claude GitHub App] is shared by every Claude feature that integrates with GitHub, including the Claude Code GitHub Action, [Code Review], and [auto-fix for pull requests] in cloud sessions."
> "| Actions | Read and write | | Checks | Read and write | | Contents | Read and write | | Discussions | Read and write | | Issues | Read and write | | Members | Read | | Metadata | Read | | Pull requests | Read and write | | Repository hooks | Read and write | | Statuses | Read | | Workflows | Read and write |"
> "When you install the app, you accept its full permission set. GitHub doesn't let you accept a subset. ... A custom app covers only the Claude Code GitHub Action. Code Review and web auto-fix still require the official app."

**F3.4b**: <https://github.com/anthropics/claude-code-action/blob/main/docs/security.md>, section "GitHub App Permissions"
> "**Contents** (Read & Write) ... **Pull Requests** (Read & Write) ... **Issues** (Read & Write)"

The same section lists "Permissions for Future Features" as Discussions, Actions (Read), Checks (Read) and Workflows. This repository document is older than and narrower than the code.claude.com table in F3.4a.

**F3.4c**: same file, section "Access Control"
> "**Token Permissions**: The GitHub app receives only a short-lived token scoped specifically to the repository it's operating in"

**F3.4d**: source code at <https://github.com/anthropics/claude-code-action/blob/main/src/github/token.ts> (repository source)
> `const oidcToken = await core.getIDToken("claude-code-github-action");` ... `"https://api.anthropic.com/api/github/github-app-token-exchange",`

Establishes that the default path exchanges the workflow's GitHub OIDC token at Anthropic for a Claude-App installation token. That is why `id-token: write` is required even with an API key.

**F3.4e**: <https://github.com/anthropics/claude-code-action/blob/main/docs/faq.md>, "Why aren't comments posted as claude[bot]?"
> "Comments appear as claude[bot] when the action uses its built-in authentication. However, if you provide a `github_token` in your workflow, the action will use that token's authentication instead, causing comments to appear under a different username."

**F3.4f**: <https://github.com/anthropics/claude-code-action/blob/main/docs/usage.md>, inputs table
> "| `bot_id` | GitHub user ID to use for git operations (defaults to Claude's bot ID). ... | `41898282` |"
> "| `bot_name` | GitHub username to use for git operations (defaults to Claude's bot name). ... | `claude[bot]` |"

Establishes that commits and comments are authored by `claude[bot]` by default, or by the identity behind a custom `github_token`.

**F3.4g**: source code at <https://github.com/anthropics/claude-code-action/blob/main/src/create-prompt/index.ts> (repository source)
> `? \`Co-authored-by: ${triggerName} <${triggerEmail}>\`` ... `- When committing and the trigger user is not "Unknown", include a Co-authored-by trailer:`

Establishes that the action instructs Claude to add a `Co-authored-by:` trailer naming the triggering GitHub user. This is the only per-human attribution in the action, and it lives in git history, not billing. The documentation is SILENT on it; I found it only in source.

**F3.4h**: <https://github.com/anthropics/claude-code-action/blob/main/docs/security.md>, section "Pull Request Creation"
> "In its default configuration, **Claude does not create pull requests automatically** when responding to `@claude` mentions. ... Claude commits code changes to a new branch / Claude provides a **link to the GitHub PR creation page** in its response / **The user must click the link and create the PR themselves**"

INFERENCE: in the default `@claude` flow, the PR author is the human who clicks the link, and the branch commits are by `claude[bot]`.

**F3.4i**: same file, section "Commit Signing"
> "Commits will show as verified and attributed to the GitHub account that owns the signing key."

This applies to the `ssh_signing_key` option.

###### 3.5 `/install-github-app`

**F3.5a**: <https://code.claude.com/docs/en/github-actions>, section "Quick setup"
> "Open `claude` in the repository you want to connect, run `/install-github-app`, and follow the prompts. Claude Code installs the Claude GitHub App, then sets up an authentication secret for the workflows: * If Claude Code already has an API key, it reuses that key ... * Otherwise, choose between creating a long-lived token with your Claude subscription and pasting in an API key"
> "Claude Code saves the credential as a repository secret, named `ANTHROPIC_API_KEY` for an API key or `CLAUDE_CODE_OAUTH_TOKEN` for a subscription token."
> "For either path, you need admin access to the repository."
> "Quick setup works with the Claude API and Claude subscriptions. If you use Amazon Bedrock, Google Cloud's Agent Platform, or Microsoft Foundry, see [Use Claude Code GitHub Actions with cloud providers]"

**F3.5b**: <https://github.com/anthropics/claude-code-action/blob/main/README.md>, "Quickstart"
> "You must be a repository admin to install the GitHub app and add secrets / This quickstart method is only available for direct Anthropic API users."

INFERENCE: `/install-github-app` stores the running user's own credential as a repository secret. That is either their reused API key, which may be a personal key, or their subscription token. From then on, every collaborator's `@claude` run bills to that one person or key (F3.1e, F1.8e).

---


##### Workload Identity Federation (WIF): GitHub Actions to the Claude API, and the Claude Code CLI

All retrieved 2026-10-02, in the planning session itself (WebFetch).

**W1**: https://platform.claude.com/docs/en/manage-claude/wif-providers/github-actions, "Use WIF with GitHub Actions", intro
> "With Workload Identity Federation, your workflow exchanges that token for a short-lived Anthropic access token, so your CI jobs can call the Claude API without an `ANTHROPIC_API_KEY` secret stored in your repository."
> "The token's `sub` claim encodes the repository and trigger context. For a push to a branch it has the form `repo:<owner>/<repo>:ref:refs/heads/<branch>`. Pull-request runs use `repo:<owner>/<repo>:pull_request`, and environment-gated deployments use `repo:<owner>/<repo>:environment:<name>`. Your federation rule matches against this claim (and others, such as `repository_owner` and `ref`) to decide which workflow runs are allowed to authenticate."

The page's sample decoded token lists the claims `iss`, `sub`, `aud`, `repository`, `repository_owner`, `ref`, `sha`, `workflow`, `actor`, `event_name`.

**W2**: same page, § "Configure your workflow"
> "GitHub only issues an identity token to jobs that explicitly request it. Add the `id-token: write` permission at the workflow or job level"

**W3**: same page, § "Acquire and use a token"
> "Each GitHub-issued identity token expires roughly five minutes after issuance. The token-request endpoint (`ACTIONS_ID_TOKEN_REQUEST_URL`) stays valid for the entire job, so you can fetch a fresh token at any point. The SDK exchanges the token on first use and caches the resulting Anthropic access token. For jobs that run longer than the Anthropic token's lifetime, the SDK re-reads `ANTHROPIC_IDENTITY_TOKEN_FILE` on each refresh, so re-run the fetch step periodically (or wrap it in a background loop) to keep the file current."

**W4**: same page, § "Restrict which workflows can authenticate" (Warning)
> "A `subject_prefix` of `repo:your-org/*` alone matches every repository in your organization, and without a `ref` constraint it also matches `pull_request` runs triggered from forks. Anyone who can open a pull request against a matching repository could obtain a federated Anthropic token."
> "**Pin to a protected branch:** Add `"ref": "refs/heads/main"` (or your release branch) under `claims` so pull-request runs and feature branches do not match."
> "**Pin to a deployment environment:** For deploy jobs, match `subject_prefix: "repo:your-org/your-repo:environment:production"` and gate that environment with required reviewers in GitHub."

**W5**: https://platform.claude.com/docs/en/manage-claude/wif-reference, "WIF reference", § "Rule matching semantics"
> "All populated fields are evaluated with AND semantics: the JWT must satisfy every populated matcher."
> "`claims` | map<string, string> | Each key is a top-level claim name and each value is the required exact string value. For nested, numeric, boolean, or complex claims like lists and maps, use `condition` with a CEL expression instead."
> "`condition` | string (CEL) | A CEL expression that must evaluate to `true`."
> (§ "CEL evaluation environment") "`claims` | map | The full decoded JWT claim set."

INFERENCE: since `actor` is a top-level claim of GitHub's token (W1) and `claims` takes any top-level claim name, a rule can be bound to one GitHub login (`"claims": {"actor": "<login>"}`), which GitHub signs and a writer cannot forge. Not tested in this research.

**W6**: same page, § "Validation rules" → "Resource fields"
> "`workspace_id` | … The workspace (`wrkspc_...`) whose quota, billing, and rate limits apply to tokens minted under this rule."
> "`token_lifetime_seconds` | Integer between `60` and `86400` (1 minute to 24 hours). Default `3600`."

**W7**: same page, § "Environment variables"
> "The direct environment-variable federation path activates only when `ANTHROPIC_FEDERATION_RULE_ID`, `ANTHROPIC_ORGANIZATION_ID`, `ANTHROPIC_SERVICE_ACCOUNT_ID`, and one of `ANTHROPIC_IDENTITY_TOKEN_FILE` or `ANTHROPIC_IDENTITY_TOKEN` are all set."
> (Warning) "A variable that is set to an empty string still occupies its slot in the credential precedence chain. If `ANTHROPIC_API_KEY=""` is exported, the SDK selects the API-key path with an empty key rather than falling through to federation. Unset unused credential variables rather than blanking them."

**W8**: same page, § "Errors" → "Token exchange errors"
> "Every assertion denial returns the same opaque `401` `authentication_error` with the fixed message `Authentication failed`, regardless of which check failed … The deny reason is recorded on the attempt's entry in the authentication history"

**W9**: https://code.claude.com/docs/en/authentication, "Authentication", § "Credential management"
> "**Supported authentication types**: claude.ai credentials, Claude API credentials, Microsoft Foundry Auth, Bedrock Auth, Vertex Auth, Anthropic profile and Workload Identity Federation credentials, and Claude apps gateway session tokens."

**W10**: same page, § "Authentication precedence" (items 3, 5, 6)
> "3. `ANTHROPIC_API_KEY` environment variable. … In non-interactive mode (`-p`), the key is always used when present."
> "5. `CLAUDE_CODE_OAUTH_TOKEN` environment variable. A long-lived OAuth token generated by `claude setup-token`. Use this for CI pipelines and scripts where browser login isn't available."
> "6. Anthropic profile and federation credentials, the credentials that the `ant` CLI and Workload Identity Federation use."

**W11**: same page, § "Anthropic profiles and federation credentials"
> "| Federation variables | `ANTHROPIC_FEDERATION_RULE_ID` and `ANTHROPIC_ORGANIZATION_ID`, both set | Above |"
> "For the federation variables, Claude Code also reads the other variables in the WIF reference, such as `ANTHROPIC_IDENTITY_TOKEN_FILE`, when it exchanges your identity token."
> "Claude Code doesn't read profiles or federation variables in bare mode, in Claude Desktop, or in cloud sessions."

Establishes: the stock `claude` CLI (not only `anthropics/claude-code-action`) authenticates through WIF from environment variables, ranked below `ANTHROPIC_API_KEY` and `CLAUDE_CODE_OAUTH_TOKEN`, so a job using federation must leave both of those unset (W7, W10).

**W12**: same page, § "Authentication precedence"
> "Cloud sessions always use your subscription credentials. If you set `ANTHROPIC_API_KEY` or `ANTHROPIC_AUTH_TOKEN` in the cloud environment, it doesn't override your subscription credentials."
