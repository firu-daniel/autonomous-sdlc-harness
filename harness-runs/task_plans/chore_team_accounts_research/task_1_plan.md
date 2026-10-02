### Task 1 — Create `docs/team-accounts-research.md` with its reader statement and method, and write §1, Anthropic's plans, Claude Code sign-in and the terms (P1–P5)

**Goal:** Create the research document, give it the opening a document under `docs/` owes — who reads it and what it owns — and the method section, and write its first findings section: what each Claude plan gives for Claude Code, whether a seat can sign Claude Code in non-interactively, which terms govern which plan, what those terms say about sharing a credential with people or automation, and what happens to one subscription's limits when teammates use it. Every claim comes from `### Evidence` below; nothing is fetched.

**Where this task stops.** It writes the document's head and §1 only. It leaves, in this order and as headings with no body, the placeholders the later tasks fill: `## Summary` (Task 4), `## 2. The Claude API, cloud providers and CI` (Task 2), `## 3. GitHub's side` (Task 3), `## 4. What other agents do` (Task 3), `## 5. Options for the harness` (Task 4), `## 6. Recommendation` (Task 4), `## 7. Open questions` (Task 4). Each placeholder carries the single line `_Written by a later task of this branch._`, which the owning task replaces. It writes no option, recommendation or link: those are Tasks 4 and 5.

**How this task's implementer reads the conventions.** This is the catch-all layer, and the document describes the GitHub execution path of the `cli` layer's templates, so read `.claude/context/conventions.md` (in particular `## Documents of record` and the `What accompanies a new unit of each kind` row for *"A prose document under `docs/`"*) and skim `.claude/context/cli.md` → `## What this layer owns, and what it is not`, so that the document names templates by their repository paths (`cli/templates/github/workflows/harness-run.yml`, `cli/templates/scripts/remote-run.sh`).

### Targets

- `docs/team-accounts-research.md` (new) — the head, the placeholders, and §1.

**Work:**

- [ ] **The head.** `# Team accounts research`, then a `**Who reads this:**` paragraph in the voice of `docs/github-integration-research.md`'s: the maintainer deciding how a team runs the harness on GitHub, and the planner of any branch that changes the credentials `harness-run.yml` reads; it owns the findings below with their evidence as of 2026-10-02, the options and a recommendation, and owns no design choice — any change it describes is a later branch's. Then a sentence that it cites rather than restates `remote-execution.md` (`## 9. Credentials and billing`) and `github-integration-research.md` (whose IDs S1–A13 it may cite). Then a `## How this was researched` section: every source retrieved **2026-10-02** in a supervised planning session; primary sources only (Anthropic's docs, terms and support articles; GitHub's docs and changelog; the `anthropics/claude-code-action` repository at `main`, commit `97c53473391bff1901034d4b454b5bac7ab7a029`, committed 2026-10-01; AWS and Google Cloud docs); quotes are verbatim, Markdown link syntax stripped; the three labels — documented (a source states it), **Inference** (this document's conclusion, which no single source states), and **Not documented** (no page checked states it, with the pages checked named); no measurement was run, so nothing here is `verified` in the sense `github-integration-research.md` uses. State the **geo caveat** there once: `anthropic.com/legal/consumer-terms` served only the EEA/Switzerland version (Anthropic Ireland, Limited, effective October 8, 2025), so the Consumer Terms quotes are that version's, and the rest-of-world text is §7's open question. Then a `## Status labels` line defining `documented` / `partly documented` / `not documented` as the **Status** values an entry carries.
- [ ] **The placeholders**, exactly as **Where this task stops** lists them.
- [ ] **§1 `## 1. Anthropic's plans, Claude Code sign-in and the terms`**, five entries, each `### P<n>. <question>` then `**Status:**`, `**Answer:**` (documented facts only), `**Inference:**` (only where the evidence carries an INFERENCE line; omit the paragraph otherwise), `**Evidence:**` (bullets: URL — retrieved 2026-10-02 — page title › section: "verbatim quote"):
  - **P1. What Pro, Max, Team and Enterprise give for Claude Code: seats, per-member usage, admin controls, price.** From evidence Q1. Must carry: Claude Code included on every plan named, Team Standard seats included; Team limits per member and not pooled ("If one team member reaches their seat's included usage limit, it does not affect the limits of other team members"); the admin controls the evidence names (usage credits at API rates, organisation and per-member spend caps, server-managed settings, analytics); and the **Enterprise conflict** — the support article's pooled organisation balance at API rates with no per-seat allowance against the Claude Code costs page's "per-seat allowance" — stated as a conflict between two Anthropic pages, both quoted, neither preferred. Prices only as quoted from the pricing page or the support articles.
  - **P2. Can a Team or Enterprise seat sign Claude Code in non-interactively (`claude setup-token`, `CLAUDE_CODE_OAUTH_TOKEN`)?** From evidence Q2. Must carry: a one-year, inference-only token, for Pro, Max, Team and Enterprise; tied to "the subscription of the person who ran `claude setup-token`" (github-actions doc); deleting a repository secret leaves the credential valid ("If you delete a secret, the credential it held stays valid."); `forceLoginOrgUUID` not enforced by `setup-token`; **Not documented:** revocation of such a token, and whether an admin can see or revoke a member's tokens (pages checked as the evidence lists).
  - **P3. Which terms govern which plan.** From evidence 3.1 and the preambles in 3.3 and 3.4: Consumer Terms for Free, Pro and Max; Commercial Terms for Team, Enterprise and the API; Service Specific Terms § A for Claude for Work.
  - **P4. What the terms say about sharing one account's credentials, or one subscription's OAuth token, with other people or with automation.** From evidence 3.2–3.7. **Quote the clauses**, each with its section: Consumer Terms § 2 ("You may not share your Account login information, Anthropic API key, or Account credentials with anyone else or make your Account available to anyone else.") and § 3's automated-access item; the legal-and-compliance page's "OAuth authentication is intended exclusively for purchasers…", its developers paragraph, and its carve-out for API keys used "by the customer's own authorized users — provided the resulting usage is billed to the key owner", with the evidence's reading that the carve-out does not extend to subscription tokens (it covers "an end user … with their own Claude subscription"); the login support article's "Subscription plans can only be used by subscribers", which names all five plans; the Cowork article's "Shared logins aren't supported."; Commercial Terms § D.4 and § D.5, and **Not documented:** no credential-sharing clause in the Commercial Terms and none in the Usage Policy. Keep the evidence's INFERENCE on § 3 (the Claude Code docs read as the explicit permission for `setup-token` in CI, bounded by § 2) labelled **Inference**. Carry the geo caveat on every Consumer Terms quote.
  - **P5. What happens to one person's subscription limits when teammates use it.** From evidence Q4: all surfaces share one limit; 5-hour and weekly windows; Pro and Max limits "assume ordinary, individual usage"; Team per member; API organisation rate limits are organisation-level for contrast. The evidence's closing INFERENCE paragraph is **Inference**. Also carry 3.7's Agent SDK article: the separate credit for `claude -p`, the Agent SDK and GitHub Actions is **paused** ("For now, nothing has changed"), and its preserved text says credits are per user and that "Teams running shared production automation should use Claude Platform with an API key" — quoted as text the page marks as not in effect.
- [ ] Where a P-entry bears on a statement in `docs/remote-execution.md` → `## 9. Credentials and billing` (its "**The terms.**" and "**A paused billing change**" paragraphs, retrieved there 2026-09-24), say in that entry whether the 2026-10-02 evidence agrees with it, citing the paragraph by its bold opening. Do not edit `remote-execution.md` here.

**Verification:**

- Every quoted string in §1 appears verbatim in `### Evidence` below; every number (a price, a seat count, a limit, a validity period) appears there too. Grep each one against this file.
- Every sentence the evidence marks INFERENCE sits in an **Inference** paragraph, and every SILENT point is stated as **Not documented** with the pages checked.
- Every Consumer Terms quote carries the EEA/Switzerland caveat, or §1 states once, before P4, that all Consumer Terms quotes are that version's.
- The document opens with its reader statement (`conventions.md` → the `docs/` row of the accompaniment table), and the seven placeholders stand in the order **Where this task stops** gives.
- `grep -nE '/Users/|/home/|/private/|/tmp/' docs/team-accounts-research.md` finds nothing. Then `bash scripts/test.sh`, run without a pipe, fails no gate that does not also fail on the branch's base commit: gate 6a (*no machine paths*) is red in this self-adopted checkout by design (`scripts/run-gates.sh` → the comment above gate 6e), so compare its hits, and no hit may name a file this branch wrote.

### Evidence

The planning session's research for this task, as recorded on 2026-10-02 from the sources named in each entry. Headings are demoted so they nest under this file; the text is otherwise unchanged. **INFERENCE** and **SILENT** lines are the researcher's labels and carry over to the document as **Inference** and **Not documented**.

#### Anthropic plans, Claude Code authentication and terms — primary-source evidence

All sources retrieved 2026-10-02. Every quote below is verbatim from the page named (whitespace normalised; Markdown link syntax stripped). Lines marked **INFERENCE** are mine, not the source's. Lines marked **SILENT** record that no page checked states the point.

Method note: pages were fetched both with WebFetch and with `curl` + HTML-to-text so quotes could be checked against the raw page text, not a model summary.

**Geo caveat (important):** `https://www.anthropic.com/legal/consumer-terms` and `https://www.anthropic.com/legal/terms` were both served from this network location as the **EEA/Switzerland version** (contracting party Anthropic Ireland, Limited; "Effective October 8, 2025"). The page appears to be geo-selected; no version for the rest of the world (Anthropic, PBC) could be retrieved. A web-search snippet for `anthropic.com/legal/terms` reproduces the same automated-access clause with Anthropic, PBC as the party, but I could not load that page text, so it is **not** quoted as evidence here. Archive versions retrieved (`/legal/archive/00a33a87-…` = UK version eff. June 13, 2024; `/legal/archive/37ebfa9a-…` = EEA eff. May 13, 2024; `/legal/archive/1c3ea439-…` = EEA eff. May 1, 2025) are superseded and are not used.

---

##### Q1. What each plan gives for Claude Code: seats, per-member limits, admin controls, price

###### 1.1 Pricing page — claude.com/pricing

URL: https://claude.com/pricing — page "Pricing", Individual and Team & Enterprise tabs.

- Pro: "$17 Per month with annual subscription discount ($200 billed up front). $20 if billed monthly." Feature list includes "More usage*" and "Claude Code".
  → Pro is $20/month (or $200/year) and includes Claude Code.
- Max: "From $100 Per month" … "Everything in Pro, plus: Choose 5x or 20x more usage than Pro*".
  → Max comes in a 5x and a 20x tier, from $100/month.
- Footnote under both tabs: "Usage limits apply. Prices shown don’t include applicable tax. Price and plans are subject to change at Anthropic's discretion."
- Team: "For teams of 2 to 150" … "Standard seat — All Claude features, plus more usage than Pro* — $20 Per seat / month if billed annually. $25 if billed monthly." … "Premium seat — 5x more usage than standard seats* — $100 Per seat / month if billed annually. $125 if billed monthly." Shared list: "Claude Code and Claude Cowork", "Central billing and administration", "Single sign-on (SSO)", "Mix and match seat types".
  → Team has 2–150 seats. Both seat types list Claude Code. A Premium seat gives 5x a Standard seat.
- Enterprise: "Seat price + usage at API rates" / "US$20/seat/month, billed annually. Usage cost scales with model and task." / "All Team plan features, plus: Admins set user and org spend limits", "Role-based access with fine grained permissioning", "System for Cross-domain Identity Management (SCIM)", "Audit logs", "Compliance API for observability and monitoring".
  → An Enterprise seat costs $20/month, and every token is billed on top at API rates.
- Team & Enterprise comparison table: "Claude Code — Yes Yes Yes"; "Usage analytics — Yes Yes Yes"; "Extra usage — Yes n/a n/a"; "User and organizational level spend controls — Yes Yes Yes".
  → Team, self-serve Enterprise and sales-assisted Enterprise all include Claude Code, usage analytics and spend controls. Only Team has "extra usage"; on Enterprise, usage is metered anyway.

###### 1.2 Max plan — support article

URL: https://support.claude.com/en/articles/11049741-what-is-the-max-plan — "What is the Max plan?"

- "This article is about paid Max plans for individual consumers."
- § "Pricing tiers": "Max 5x: $100 per month" / "Max 20x: $200 per month". § "Billing information": "The Max plan is currently available as a monthly subscription only."
- § "Does the Max plan have any usage limits?": "Max 5x includes five times the Pro plan's per-session usage allowance. … Max 20x includes 20 times the Pro plan's per-session usage allowance. … Your session-based usage limit will reset every five hours. Max plans also have a weekly usage limit that applies across all models. The weekly limit resets at a fixed time each week that is assigned to your account."
- Same section: "In addition, to manage capacity and ensure fair access to all users, we may limit your usage in other ways, such as weekly and monthly caps or model and feature usage, at our discretion."
- § Key benefits: "Access to Claude Code: Use Claude Code for your terminal-based coding workflows with one unified subscription."
  → Max is an individual plan at $100 or $200 a month. Usage has a 5-hour session window, a weekly cap and possible discretionary caps.

###### 1.3 Pro plan — support article

URL: https://support.claude.com/en/articles/8325606-what-is-the-pro-plan — "What is the Pro plan?"

- "This article is about paid Pro plans for individual consumers."
- § Key benefits: "Claude Code access".
- § "How much does the Pro plan cost?": "The Pro plan is available for $20 per month (US)".
- § "Does the Pro plan have any usage limits?": "Your session-based usage limit will reset every five hours. Pro plans also have a weekly usage limit that applies across all models."
- Note: "The Pro plan does not include API usage through the Claude Console."
- § "How do I increase my Pro plan usage limits?": "Pro subscribers can also enable usage credits to continue working with Claude beyond the plan’s included usage limits."

###### 1.4 Team plan — support article

URL: https://support.claude.com/en/articles/9266767-what-is-the-team-plan — "What is the Team plan?"

- § "What’s included in the Team plan?" (Standard seats): "Spend controls: Set spending caps at organization and individual user levels." … "Everything in Pro, including: … Access to Claude Code to delegate coding tasks from concept to completion directly from your terminal."
  → A Standard seat includes Claude Code, and spend caps can be set for the organization and for each user.
- § "Premium seats for Team plans": "In addition to all features of Standard seats listed above, Premium seats offer significantly more usage than Standard seats."
- § "How much does the Team plan cost?": "Team plans require a minimum of two members." Standard: "$25 per member per month, billed monthly" / "$20 per member per month, billed annually". Premium: "$125 per member per month, billed monthly" / "$100 per member per month, billed annually". "Team plans support up to 150 seats."
- § "Do Team plans have any usage limits?": "Standard seats: Team plan Standard seats include 1.25x the Pro plan's per-session usage allowance and have a weekly usage limit that applies across all models." / "Premium seats: Team plan Premium seats include 6.25x the Pro plan's per-session usage allowance and have a weekly usage limit that applies across all models."
- § "Do usage limits apply across the team or to individual members?": "Usage limits on Team plans are per-member, rather than applied to the team as a whole. This means: Each team member has their own set of usage limits. If one team member reaches their seat's included usage limit, it does not affect the limits of other team members."
  → **Team usage is per seat, not pooled.**
- § "How do I increase my Team plan usage limits?": "Your Team plan organization can enable usage credits to allow team members on all seat types to continue working with Claude, Cowork, and Claude Code after reaching their included usage limits."

###### 1.5 Claude Code with Team / Enterprise — support article

URL: https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan — "Use Claude Code with your Team or Enterprise plan"

- § "What is Claude Code?": "Claude Code is included with every Team plan seat. Premium seats offer more usage for team members with heavier workloads. For Enterprise plans, Claude Code is included with the single Enterprise seat on new and self-serve plans. On older Enterprise plans, Claude Code is available on Chat + Claude Code seats (usage-based billing) and Premium seats (seat-based billing)."
  → **Claude Code is included in Team Standard seats, not only Premium.** A Premium seat only adds usage.
- § "Step 3: Authenticate with the Team or Enterprise account": "Select “Claude account with subscription” to be routed to an OAuth prompt. Select your Team or Enterprise plan and click “Authorize.”"
- § "Use Claude Code in your IDE": "IDE usage is limited and billed the same way as terminal usage on your plan."
- § "What happens when you hit usage limits": "If your organization is on a usage-based Enterprise plan (including self-serve Enterprise), there are no per-seat usage limits—usage is based on consumption and billed at API rates."

###### 1.6 Team seat management — support article

URL: https://support.claude.com/en/articles/12004354-purchase-and-manage-seats-on-team-plans — "Purchase and manage seats on Team plans"

- § "Understanding seat types": "Standard — Base features, usage limits, and Claude Code access" / "Premium — Everything in Standard, plus higher usage limits".
- Same section: "Your plan has a total seat allocation (e.g., 30 Standard seats and 10 Premium seats). Within that allocation, you can assign and reassign users to different seat types as needed."
- Permissions note: "Only Owners and Primary Owners can purchase seats and access Organization settings > Billing. Admins and above can reassign seat types for members in Organization settings > Members."
- **INFERENCE:** seats are assigned to named members ("assign and reassign users"). The article does not use the words "one person per seat".

###### 1.7 Usage credits and spend caps (Team / seat-based Enterprise) — support article

URL: https://support.claude.com/en/articles/12005970-manage-usage-credits-for-team-and-seat-based-enterprise-plans — "Manage usage credits for Team and seat-based Enterprise plans"

- § "What are usage credits?": "Usage credits allow Team and seat-based Enterprise plan members on Standard and Premium seats to continue working with Claude, Cowork, and Claude Code after reaching their included usage limits."
- § "How usage credits work": "After an organization Owner or Primary Owner configures your account for usage credits, you'll start using them as soon as you reach your seat's usage limit. Your subsequent usage will be billed at standard API pricing rates as you continue working." / "For Team plans: Owners can pre-purchase usage credits that they can control using spend limits."
- § "Spend limits": "Owners can set a monthly spend limit on the entire organization's usage credits."
- § "User-level spend limits": "Owners and Primary Owners can also set individual monthly spend limits for each member … Once a user reaches their defined spend limit, this will automatically pause their usage credits until the end of the month." / "the Spend limits by user section has a MTD Spend column".
- § FAQ "Can usage credits be disabled completely?": "Yes, Owners and Primary Owners can choose to disable usage credits entirely, which means that members of the organization will be unable to continue working once they reach their usage limits and will need to wait for them to reset."
  → On Team, overage is opt-in and billed at API rates. Owners can cap it per organization and per member, and turn it off entirely.

###### 1.8 Usage credits for Pro / Max — support article

URL: https://support.claude.com/en/articles/12429409-manage-usage-credits-for-paid-claude-plans — "Manage usage credits for paid Claude plans"

- "Usage credits allow individuals subscribed to paid Claude plans (Pro, Max 5x, and Max 20x) to continue using Claude seamlessly after reaching their included usage limits. … you can switch to consumption-based pricing at standard API rates".
- § "Set spend limits": "Monthly spending cap: Set a maximum amount you're willing to spend on usage credits each month."

###### 1.9 Enterprise billing — support articles

URL: https://support.claude.com/en/articles/11526368-how-am-i-billed-for-my-enterprise-plan — "How am I billed for my Enterprise plan?"

- § "Seat fees": "The seat fee gives each person access to Claude on web, desktop, and mobile, plus Claude Code and Cowork, but doesn't include any usage. Every token your team consumes is billed separately at standard API rates."
- § "How usage works across your team": "Enterprise seats don't come with an individual token allowance. All usage across your organization is billed together at API rates, regardless of who consumed it."
- § Self-serve Enterprise: "Everyone's usage draws from the same credit balance. One person's heavy usage depletes credits faster for everyone, so monitoring and spend limits matter here."
- § Sales-assisted Enterprise: "There's no balance to deplete. Everyone's usage is metered and added to the same monthly invoice."
- § "Spend limits": "Organization level: Maximum spend for all usage across your organization." / "Individual level: Maximum spend for a specific user." / "These limits work hierarchically, so a user cannot exceed their individual limit or the organization limit, whichever is lower."
  → **Current Enterprise usage is pooled and metered**: there is no per-seat allowance, only per-user and per-organization dollar caps.

URL: https://support.claude.com/en/articles/13393991-purchase-and-manage-seats-on-enterprise-plans — "Purchase and manage seats on Enterprise plans"

- § "Your seat type": "Usage-based Enterprise plans use a single seat type: the Enterprise seat, priced per user per month (billed annually). This seat includes access to Claude on web, desktop, and mobile, as well as Claude Code." / "Enterprise plans require a minimum of 20 seats."

###### 1.10 Claude Code docs — costs, analytics, managed settings

URL: https://code.claude.com/docs/en/costs — "Manage costs effectively", § "Manage costs for your organization"

- "On Teams and Enterprise plans, usage draws from each member's seat allowance. On the Console and on cloud providers, usage is billed per token to your organization. If your organization mixes sign-in methods, each developer is metered according to the one they authenticated with."
- § "Claude for Teams and Enterprise": "On Claude for Teams and Enterprise plans, each member's Claude Code usage draws from a per-seat allowance that resets on a rolling five-hour window and a weekly window. The allowance is shared with Claude chat and Cowork, and its size depends on the member's seat tier (Standard or Premium). Your controls live in the claude.ai admin console, not the Claude Console."
- Same section: "See spend: the spend report in org analytics shows estimated spend per user and per model, with CSV export, updated daily. … Usage inside the seat allowance isn't metered in dollars." / "See adoption: the analytics dashboard shows daily active users, sessions, and contribution metrics" / "Cap spend: the seat allowance is the default ceiling. To let members continue past it, turn on usage credits and set spend limits at the organization, group, or individual member level." / "Pull per-user numbers: on the Enterprise plan, the Enterprise Analytics API returns per-user usage and cost reports".
- **Discrepancy to note:** this docs paragraph describes "a per-seat allowance" for "Teams and Enterprise". The Enterprise billing support article (1.9) says current usage-based Enterprise seats have no individual allowance. **INFERENCE:** the docs paragraph fits Team and legacy seat-based Enterprise. For current Enterprise the support article is the more specific source.

URL: https://code.claude.com/docs/en/server-managed-settings — "Configure server-managed settings"

- Note: "Server-managed settings are available for Claude for Teams and Claude for Enterprise customers."
- § Requirements: "The Owner or Primary Owner role in your Claude organization, to view and edit the configuration".
- § "Platform availability": "Delivery also requires the session to authenticate with one of these credentials: A Team or Enterprise OAuth login / An OAuth token supplied through `CLAUDE_CODE_OAUTH_TOKEN` / A directly configured API key …"
  → Managed settings are a Team and Enterprise feature, and they also reach sessions that run on a `setup-token` token.

URL: https://code.claude.com/docs/en/authentication — § "Claude for Teams or Enterprise"

- "Claude for Teams: self-service plan with collaboration features, admin tools, SSO, billing management, and server-managed settings for organization-wide Claude Code configuration. Best for smaller teams." / "Claude for Enterprise: adds domain capture, role-based permissions, and the compliance API."
- § "Restrict login to your organization": admins can set `forceLoginMethod` / `forceLoginOrgUUID` in managed settings "To require that developers' claude.ai logins belong to a specific Anthropic organization".

---

##### Q2. Non-interactive authentication: `claude setup-token` and `CLAUDE_CODE_OAUTH_TOKEN`

###### 2.1 Authentication doc

URL: https://code.claude.com/docs/en/authentication (https://code.claude.com/docs/en/iam serves the same content) — "Authentication"

- § "Generate a long-lived token": "For CI pipelines, scripts, or other environments where interactive browser login isn't available, generate a one-year OAuth token with `claude setup-token`".
  → **Validity: one year.**
- Same section: "The command opens the same browser authorization flow as `/login`, and the token prints to the terminal after you approve access in the browser. It does not save the token anywhere; copy it and set it as the `CLAUDE_CODE_OAUTH_TOKEN` environment variable wherever you want to authenticate".
- Same section: "This token authenticates with your Claude subscription and requires a Pro, Max, Team, or Enterprise plan. It can only make model requests, so it can't establish Remote Control sessions or fetch claude.ai connectors. MCP servers you configure locally still work."
  → **Supported plans: Pro, Max, Team, Enterprise** (Free is not listed). The token is inference-only.
- Same section: "Bare mode does not read `CLAUDE_CODE_OAUTH_TOKEN`. If your script passes `--bare`, authenticate with `ANTHROPIC_API_KEY` or an `apiKeyHelper` instead."
- § "Authentication precedence", item 5: "`CLAUDE_CODE_OAUTH_TOKEN` environment variable. A long-lived OAuth token generated by `claude setup-token`. Use this for CI pipelines and scripts where browser login isn't available."
- Item 7: "Subscription OAuth credentials from `/login`. This is the default for Claude Pro, Max, Team, and Enterprise users."
- § "Restrict login to your organization": "`claude setup-token` and `/install-github-app`: enforce only `forceLoginMethod`, so they can mint a token in a different organization".
  → An org's `forceLoginOrgUUID` does not stop a member from minting a `setup-token` token against another organization.

###### 2.2 CLI reference

URL: https://code.claude.com/docs/en/cli-reference — "CLI reference", § "CLI commands"

- "`claude setup-token` | Generate a long-lived OAuth token for CI and scripts. Prints the token to the terminal without saving it. Requires a Claude subscription."
- "`claude auth status` | … The JSON's `authMethod` field is one of `none`, `claude.ai`, `oauth_token`, `api_key`, `api_key_helper`, or `third_party`".

###### 2.3 Environment variables reference

URL: https://code.claude.com/docs/en/env-vars — `CLAUDE_CODE_OAUTH_TOKEN` row

- "OAuth access token for claude.ai authentication. Alternative to `/login` for SDK and automated environments. Takes precedence over keychain-stored credentials. Generate one with `claude setup-token`. Unless you run `/login`, Claude Code uses the token you set for the whole session. To replace an expired token, generate a new one and restart".

###### 2.4 GitHub Actions doc — the token is tied to one person's subscription

URL: https://code.claude.com/docs/en/github-actions — "Claude Code GitHub Actions"

- § "Manual setup", step "Add an authentication secret": "`CLAUDE_CODE_OAUTH_TOKEN`: an OAuth token that authenticates with your Claude subscription, available on Pro, Max, Team, and Enterprise plans. Generate one by running `claude setup-token` locally."
- § "Set up for an organization": "For a secret shared across repositories, authenticate with an API key from the Claude Console rather than an OAuth token, since an OAuth token is tied to the subscription of the person who ran `claude setup-token`."
  → **The token is tied to one user**: it draws on the subscription of whoever minted it. Anthropic steers shared, org-wide use to a Console API key.
- § "Uninstall": "If you delete a secret, the credential it held stays valid."
- § "Manage costs": "If you authenticate with an OAuth token, runs use your Claude subscription instead of API billing."

###### 2.5 Other docs pages (from https://code.claude.com/docs/llms-full.txt)

- https://code.claude.com/docs/en/self-hosted-environments-testing, § "Authenticate from CI" → "Ephemeral CI runners": "There is no long-lived CI token for this today. The scope that grants cloud-session control, `user:sessions:claude_code`, is capped server-side at 30 days, so `claude setup-token`, which mints a one-year inference-only token, doesn't cover it."
  → Confirms the one-year, inference-only scope. A normal `/login` refresh grant on a host is capped at 30 days ("the underlying refresh-token grant is capped at 30 days from the initial login").

###### 2.6 What the sources are silent on

- **SILENT:** no page checked says how to **revoke** a `setup-token` token, or whether a Team/Enterprise admin can see or revoke a member's tokens. Pages checked: authentication, cli-reference, env-vars, github-actions, server-managed-settings, costs, and a full-text search of `llms-full.txt` for "revoke".
- **SILENT:** no page says whether usage through a `setup-token` token counts differently from interactive usage. **INFERENCE** from 2.1 ("authenticates with your Claude subscription") and 4.4: it draws on the same per-seat/per-account limits as the minting user's interactive use.
- **SILENT:** no page explicitly says a Team seat holder's token must not be given to another person. That prohibition comes from the terms and the legal-and-compliance page (Q3).

---

##### Q3. What the terms say about sharing credentials, tokens, automation and third-party use

###### 3.1 Which terms govern which plan

URL: https://code.claude.com/docs/en/legal-and-compliance — "Legal and compliance", § "Legal agreements" → "License"

- "Your use of Claude Code is subject to: Commercial Terms of Service - for Team, Enterprise, and Claude API users / Consumer Terms of Service - for Free, Pro, and Max users"
  → **Team and Enterprise fall under the Commercial Terms. Free, Pro and Max fall under the Consumer Terms.**

URL: https://www.anthropic.com/legal/service-specific-terms — "Service Specific Terms", "Effective August 31, 2026"

- Preamble: "These Service Specific Terms … form part of the agreement you or the organization … have with Anthropic for such Services that links to or otherwise references these Service Specific Terms, such as the Commercial Terms of Service".
- § "A. Claude for Work (Team Plan; Enterprise Plan)": "Customer must inform its Users that (i) they are accessing an administered service offering that enables Customer’s access to and control over data submitted to the Services by Customer and its Users, and (ii) use of the Services is subject to Anthropic’s policies, including the Privacy Policy and Usage Policy."
  → Team and Enterprise ("Claude for Work") are commercial services with supplemental terms. Nothing in these terms addresses credential sharing.

###### 3.2 Claude Code legal-and-compliance page — the most specific clauses

URL: https://code.claude.com/docs/en/legal-and-compliance

- § "Usage policy" → "Acceptable use": "Claude Code usage is subject to the Anthropic Usage Policy. Advertised usage limits for Pro and Max plans assume ordinary, individual usage of Claude Code and the Agent SDK."
  → Pro and Max limits assume one person's ordinary use.
- § "Authentication and credential use": "**OAuth authentication** is intended exclusively for purchasers of Claude Free, Pro, Max, Team, and Enterprise subscription plans and is designed to support ordinary use of Claude Code and other native Anthropic applications."
  → Subscription OAuth, which includes `setup-token` tokens, is only for the people who bought the plan, and only for ordinary use of Anthropic's own apps.
- Same section: "**Developers** building products or services that interact with Claude's capabilities, including those using the Agent SDK, should use API key authentication through Claude Console or a supported cloud provider. Anthropic does not permit third-party developers to offer Claude.ai login into their own applications, or to route requests through Free, Pro, or Max plan credentials on behalf of their users. Moreover, developers may not collect, store, or intermediate Claude.ai credentials or session tokens — sign-in to a Claude account must complete through Anthropic's own flow."
  → Products, including Agent SDK products, must use API keys. Routing other people's work through consumer-plan credentials, or collecting Claude.ai tokens, is prohibited.
- Same section: "This does not restrict how customers provision and manage their own API keys or third-party inference provider credentials — for example, configuring an API key in a development environment, secrets manager, or machine image for use by the customer's own authorized users — provided the resulting usage is billed to the key owner under their agreement with Anthropic … Nor does it prevent an end user from signing in to the unmodified Claude Code binary with their own Claude subscription".
  → Sharing **API keys** among a customer's own authorized users is expressly allowed. The carve-out does **not** extend to subscription OAuth tokens: for those it covers only "an end user … with their own Claude subscription".
- Same section: "Anthropic reserves the right to take measures to enforce these restrictions and may do so without prior notice."
- § "Can customers offer Claude Code in their products?": "Customers may not pay for, resell, or intermediate Claude usage on their end users' behalf. Each end user must authenticate with their own Anthropic API key, Claude subscription plan credentials, or 3P inference provider credential".

###### 3.3 Consumer Terms of Service (Free, Pro, Max)

URL: https://www.anthropic.com/legal/consumer-terms — "Consumer Terms of Service", "Effective October 8, 2025" (**EEA/Switzerland version as served; see geo caveat at top**)

- Scope preamble: "These Terms apply to you if you are a consumer who is resident in the European Economic Area or Switzerland." / "set out the agreement between you and Anthropic Ireland, Limited (“Anthropic”) to use Claude.ai, Claude Pro, and other products and services that we may offer for individuals".
- Preamble: "Please note: Our Commercial Terms of Service govern your use of any Anthropic API key, the Anthropic Console, or any other Anthropic offerings that reference the Commercial Terms of Service. For clarity, this does not include Claude.ai or Claude Pro use for individuals or entities."
- **§ 2 "Account creation and access"**: "You may not share your Account login information, Anthropic API key, or Account credentials with anyone else or make your Account available to anyone else. You are responsible for all activity occurring under your Account and agree to notify us immediately if you become aware of any unauthorized access to your Account".
  → **Consumer accounts (Pro/Max) must not be shared. This covers login, credentials and "make your Account available"**, so it reaches a teammate using your token.
- § 2, "Business Domains": "If you use an email address owned by your employer or another organization, your Account may be linked to the organization’s enterprise account with us and the organization’s administrator may be able to monitor and control the Account".
- **§ 3 "Use of our Services"**, lead-in: "You may not access or use, or help another person to access or use, our Services in the following ways:" — item: "Except when you are accessing our Services via an Anthropic API Key or where we otherwise explicitly permit it, to access the Services through automated or non-human means, whether through a bot, script, or otherwise."
  → Automated or scripted access to consumer services is prohibited unless it uses an API key or Anthropic explicitly permits it.
  **INFERENCE:** the Claude Code docs, which document `claude setup-token` "for CI pipelines and scripts" on Pro/Max, read as such an explicit permission for that one tool. That permission is still bounded by § 2 (no sharing) and by the "ordinary, individual usage" language in 3.2.
- § 3, same list: "To develop any products or services that compete with our Services, including … or resell the Services."
- § 3 closing: "You also must not abuse, harm, interfere with, or disrupt our Services, including … bypassing any of our systems or protective measures."
- **§ 4, "Limitations"**: "Different types of Service (including paid-for Services under a Subscription) may have technical restrictions associated with them, for example, the number of Inputs you may submit to the Service or the number of Outputs you may receive within a certain period of time (“Technical Limitation”)."
- § 11, "Non-commercial use only": "You agree that you will not use our Services for any commercial or business purposes and we and our Providers have no liability to you for any loss of profit, loss of business, business interruption, or loss of business opportunity." (This sits in the EEA liability section. It is quoted for context, not established as a ban on business use worldwide.)

###### 3.4 Commercial Terms of Service (Team, Enterprise, API)

URL: https://www.anthropic.com/legal/commercial-terms — "Commercial Terms of Service", "Effective June 17, 2025"

- Preamble: "These Commercial Terms of Service (“Terms”) are an agreement between Anthropic and you or the organization, company, or other entity that you represent (“Customer”). … They govern Customer’s use of Anthropic API keys and any other Anthropic offerings that references these Terms".
- Preamble: "Services under these Terms are not for consumer use. Our consumer offerings (e.g., Claude.ai) are governed by our Consumer Terms of Service instead."
- **§ A.1 "Overview"**: "Subject to these Terms, Anthropic gives Customer permission to use the Services, including to power products and services Customer makes available to its own customers and end users (“Users”)."
- **§ D.2 "Policies and Service Terms"**: "Customer and its Users may only use the Services in compliance with these Terms, including (a) the Usage Policy … (b) our policy on the countries and regions Anthropic currently supports … and (c) our Service Specific Terms".
- **§ D.4 "Use Restrictions"**: "Customer may not and must not attempt to (a) access the Services to build a competing product or service, including to train competing AI models or resell the Services except as expressly approved by Anthropic; (b) reverse engineer or duplicate the Services; or (c) support any third party’s attempt at any of the conduct restricted in this sentence."
- **§ D.5 "Service Account"**: "Customer is responsible for all activity under its account."
  → **SILENT:** the Commercial Terms contain **no** clause on sharing credentials or logins between individuals, and no automated-access ban. For Team and Enterprise, the operative restrictions on OAuth tokens come from the Claude Code legal-and-compliance page (3.2: "intended exclusively for purchasers … ordinary use") and from the per-member seat model (Q1).

###### 3.5 Usage Policy (AUP)

URL: https://www.anthropic.com/legal/aup — "Usage Policy", "Effective September 15, 2025"

- Scope: "Our Usage Policy … applies to anyone who can submit inputs to Anthropic’s products and/or services, including via any authorized resellers or passthrough access, all of whom we refer to as “users.”"
- § "Do Not Abuse our Platform" — "This includes using our products or services to:" … "Coordinate malicious activity across multiple accounts to avoid detection or circumvent product guardrails …" / "Utilize automation in account creation or to engage in spammy behavior" / "Circumvent a ban through the use of a different account, such as the creation of a new account, use of an existing account, or providing access to a person or entity that was previously banned" / "Access or facilitate account or API access to Claude to persons, entities, or users in violation of our Supported Regions Policy".
- § "Do Not Engage in Fraudulent, Abusive, or Predatory Practices": "Engage in actions or behaviors that circumvent the guardrails or terms of other platforms or services".
  → **SILENT:** the AUP has no general clause on account sharing, usage-limit circumvention or ordinary automation. Its account clauses target bans, multi-account abuse and unsupported regions.

###### 3.6 Support articles on account sharing and subscription credentials

URL: https://support.claude.com/en/articles/13189465-logging-in-to-your-claude-account — "Logging in to your Claude account"

- § "Authenticating to subscription plans": "Claude offers subscription plans (Free, Pro, Max, Team, Enterprise) that let subscribers authenticate using OAuth tokens or other methods. Subscription plans can only be used by subscribers, and the usage included in these plans is designed to support ordinary use of native Anthropic applications, including the Claude web, desktop, and mobile applications and Claude Code."
  → **This applies to all five plans, Team and Enterprise included: "Subscription plans can only be used by subscribers."**
- Same section: "The preferred way to access Anthropic services using third-party software, tools, or services (“third-party tools”), including open-source projects, is through API key authentication through Claude Console or a supported cloud provider. Anthropic may at its discretion allow paid subscribers who have enabled usage credits to use certain third-party tools to access Anthropic services included in paid subscription plans, but reserves the right to draw use of such third-party tools from usage credits rather than subscription limits. … Use of third-party tools that misrepresent their identity to Anthropic’s servers, attempt to route third-party traffic against subscription limits, or otherwise violate applicable terms or policies is prohibited and such use may be enforced against."
- § "Developers": "If you’re building a product, application, or tool for others, use API key authentication through Claude Console or a supported cloud provider."

URL: https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile — "Use Claude Cowork on web, desktop, and mobile", § "If you want tasks to run on your computer"

- "If you use Claude at work and at home and want them separate, use a separate account for each. Shared logins aren't supported."
  → This is the only support-page sentence found that states "Shared logins aren't supported".

- **SILENT:** no support article titled "Can I share my account" was found. Searched support.claude.com for "share my Claude account" and "Shared logins are not supported". Checked https://support.claude.com/en/articles/13133750-manage-members-on-team-and-enterprise-plans (no statement on shared logins) and https://support.claude.com/en/articles/9267247-get-started-with-the-team-plan (only "Data isn't shared between separate accounts").

###### 3.7 Agent SDK and subscription credentials

URL: https://code.claude.com/docs/en/agent-sdk/overview — "Agent SDK overview", § "Get started" (Note)

- "Unless previously approved, Anthropic does not allow third party developers to offer claude.ai login or rate limits for their products, including agents built on the Claude Agent SDK. Use the API key authentication methods described in the Quickstart instead."

URL: https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan — "Use the Claude Agent SDK with your Claude plan"

- Banner: "Update June 15: We're pausing the changes to Claude Agent SDK usage described below. For now, nothing has changed: Claude Agent SDK, claude -p, and third-party app usage still draw from your subscription's usage limits."
  → As of retrieval, Agent SDK, `claude -p` and third-party app usage on a subscription count against that subscription's normal limits. The planned separate credit is paused.
- Preserved (not in effect) text, § "How the credit works": "Per-user, not pooled. Credits belong to individual accounts. They can’t be shared or pooled across teammates." § "For Team and Enterprise admins": "Credits are per-user. Each eligible user on your team claims their own credit. Credits can’t be pooled, transferred, or shared across the organization." / "Production automation at scale. The Agent SDK monthly credit is sized for individual experimentation and automation. Teams running shared production automation should use Claude Platform with an API key for predictable pay-as-you-go billing."
  → This text is marked as no longer taking effect. It still shows Anthropic's stated intent: subscription-based automation is per user, and shared team automation belongs on an API key.

---

##### Q4. Rate limits and weekly limits, and teammates consuming one person's subscription

- Usage is shared across surfaces. https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work, § "What are usage limits?": "Note that your usage of all different Claude product surfaces (claude.ai, Claude Code, Claude Desktop) counts towards the same usage limit."
- https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan, § "What happens when you hit usage limits": "Both Pro and Max plans offer usage limits that are shared across Claude and Claude Code, meaning all activity in both tools counts against the same usage limits."
- Windows: 5-hour session plus weekly. See 1.2 (Max), 1.3 (Pro) and 1.4 (Team: "weekly limits reset at a fixed time each week that is assigned to your account").
- Discretionary caps on Pro and Max (1.2 and 1.3): "to manage capacity and ensure fair access to all users, we may limit your usage in other ways, such as weekly and monthly caps or model and feature usage, at our discretion."
- Team limits are per member, not pooled (1.4): "If one team member reaches their seat's included usage limit, it does not affect the limits of other team members."
- Docs, https://code.claude.com/docs/en/costs § "When a developer asks about a limit": "\"You've hit your session limit\" or \"You've hit your weekly limit\": a seat-based usage window on a subscription plan, shared across all models, so the developer can't restore access by switching models with `/model`."
- Docs, legal-and-compliance (3.2): "Advertised usage limits for Pro and Max plans assume ordinary, individual usage of Claude Code and the Agent SDK."
- For contrast, API org rate limits are pooled. https://code.claude.com/docs/en/costs § "Claude Console" → "Rate limit recommendations": "These rate limits apply at the organization level, not per individual user, which means individual users can temporarily consume more than their calculated share when others aren't actively using the service." That section gives per-user TPM/RPM guidance by team size, e.g. "1-5 users | 200k-300k | 5-7".

**INFERENCE (combining the above):** if teammates run Claude Code on one person's subscription token (Pro, Max or a Team seat), every request draws down that **one account's** 5-hour and weekly windows. Usage is metered per account or seat, and all surfaces share the same limit. So the teammates and the owner exhaust a single allowance together. On Team, the other seats' allowances are untouched and cannot be borrowed: no pooling exists except usage credits, which are billed at API rates and charged to the token owner's member limits. Separately, the terms forbid it on consumer plans (§ 2 "make your Account available to anyone else"). For all plans, the docs and support pages say subscription OAuth is "intended exclusively for purchasers", that "Subscription plans can only be used by subscribers", and that an OAuth token "is tied to the subscription of the person who ran `claude setup-token`".

---

##### URLs fetched (all retrieved 2026-10-02)

Loaded successfully:
- https://code.claude.com/docs/en/authentication
- https://code.claude.com/docs/en/iam (same content as authentication)
- https://code.claude.com/docs/en/legal-and-compliance
- https://code.claude.com/docs/en/cli-reference
- https://code.claude.com/docs/en/github-actions
- https://code.claude.com/docs/en/costs
- https://code.claude.com/docs/en/analytics
- https://code.claude.com/docs/en/server-managed-settings
- https://code.claude.com/docs/en/settings
- https://code.claude.com/docs/en/env-vars
- https://code.claude.com/docs/en/headless
- https://code.claude.com/docs/en/agent-sdk/overview
- https://code.claude.com/docs/en/monitoring-usage
- https://code.claude.com/docs/llms-full.txt (full-text search; source of the self-hosted-environments-testing quote)
- https://www.anthropic.com/legal/consumer-terms (EEA version served)
- https://www.anthropic.com/legal/terms (EEA version served)
- https://www.anthropic.com/legal/commercial-terms
- https://www.anthropic.com/legal/service-specific-terms
- https://www.anthropic.com/legal/aup
- https://www.anthropic.com/legal/archive/00a33a87-61a2-477f-b953-9f352a02bb46, …/37ebfa9a-fefd-4ef3-9ea0-a456ef8ae0ac, …/1c3ea439-f9b9-435d-9180-3148ab923fbe (superseded; not relied on)
- https://claude.com/pricing
- https://support.claude.com/en/articles/9266767-what-is-the-team-plan
- https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan
- https://support.claude.com/en/articles/12005970-manage-usage-credits-for-team-and-seat-based-enterprise-plans
- https://support.claude.com/en/articles/12004354-purchase-and-manage-seats-on-team-plans
- https://support.claude.com/en/articles/13133750-manage-members-on-team-and-enterprise-plans
- https://support.claude.com/en/articles/9267247-get-started-with-the-team-plan
- https://support.claude.com/en/articles/13393991-purchase-and-manage-seats-on-enterprise-plans
- https://support.claude.com/en/articles/11526368-how-am-i-billed-for-my-enterprise-plan
- https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile
- https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan
- https://support.claude.com/en/articles/11049741-what-is-the-max-plan
- https://support.claude.com/en/articles/8325606-what-is-the-pro-plan
- https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan
- https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work
- https://support.claude.com/en/articles/9797557-usage-limit-best-practices
- https://support.claude.com/en/articles/12429409-manage-usage-credits-for-paid-claude-plans
- https://support.claude.com/en/articles/13189465-logging-in-to-your-claude-account

Failed or partial:
- https://support.claude.com/en/articles/8987223-can-i-have-a-claude-account-and-a-console-account: returned a near-empty body (198 chars of text); not used.
- The rest-of-world (Anthropic, PBC) Consumer Terms: not retrievable from this location; geo-served EEA version only.
