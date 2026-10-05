`chore_team_accounts_research` researches how a **team** uses the harness on GitHub with each member on their own Claude account and usage, and writes the findings as one research document. **It changes no code, no workflow and no template.** Its only output is `docs/team-accounts-research.md`, and any link to it the docs index needs.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

> **This branch needs web research, and an unattended run has none.** Plan it with the supervised `/autonomous-sdlc-harness:branch-start-plan`, where the session can fetch sources, and carry every finding with its source URL and retrieval date into the plan files, so the implementer only writes them up. Everything under "Questions" is to be answered from primary sources (Anthropic's and GitHub's own documentation, terms and help-centre articles). Mark anything inferred as inferred, and say plainly where a source is silent.

---

## Why

Remote execution today is built for one personal account. A run on GitHub authenticates Claude with one repository secret, `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY` (`cli/templates/github/workflows/harness-run.yml`). `HARNESS_GIT_TOKEN` is one personal access token, which also makes its owner the author of every draft pull request. In a team, any collaborator with write access who labels an issue, comments a command or submits a review then spends the maintainer's Claude subscription or API usage. That is wrong for the team, and sharing one person's subscription credentials with others may break Anthropic's terms. Each member should use their own account and their own subscription or API usage.

## Questions

1. **Anthropic's plans and their terms.**
   - What Claude Pro, Max, Team and Enterprise give for Claude Code: seats, per-member usage, admin controls, and whether a Team or Enterprise seat can authenticate Claude Code non-interactively (`claude setup-token` and `CLAUDE_CODE_OAUTH_TOKEN`).
   - What Anthropic's consumer and commercial terms, and its usage policy, say about sharing one account's credentials, or one subscription's OAuth token, with other people or automation. Quote the clauses.
   - The API route: a Console organisation, workspaces, per-member or per-workspace API keys, spend limits, and how usage is attributed. The same for Claude Code through Amazon Bedrock and Google Vertex AI.
   - What Anthropic documents for CI use of Claude Code, including `anthropics/claude-code-action` and its GitHub app: which credential it expects, and whether it has any per-user model.
2. **GitHub's side.**
   - Actions has repository, environment and organisation secrets, but no per-user secrets. What patterns map the triggering actor to their own credential: environment secrets with deployment protection, a secret named per login and selected by `github.actor`, an external secret store, or a self-hosted runner per member holding that member's login. Give the security cost of each.
   - Who can read a secret through a workflow change, given that a `pull_request_review` job runs the workflow file from the pull request's merge commit, and what `GITHUB_TOKEN` permissions and environment protection rules change about that.
   - `HARNESS_GIT_TOKEN`: per-member fine-grained personal access tokens versus a GitHub App installation token. Pull-request authorship, and who can then review or approve (GitHub never lets a pull request's author approve or request changes on it), rate limits, and organisation policies on personal access tokens.
3. **What other agents do.** How GitHub Copilot's cloud agent bills and attributes a session started by a team member (premium requests, per-seat), and how Claude Code's own cloud or GitHub integrations attribute usage in a team.
4. **Options for the harness.** From 1–3, describe two or three viable models, for example:
   - each member runs remote work under their own credential, selected by who triggered it;
   - a team or enterprise API organisation with a shared, metered key that the terms allow;
   - members run locally, with only the maintainer's account used for unattended GitHub work.

   For each, give its compliance with the terms, its setup per member, the security exposure, and what would have to change in `harness-run.yml`, `harness-control.yml`, `harness-trigger.yml`, `remote-run.sh`'s `authorise_actor`, `doctor` and the docs. Describe the changes only; do not make them. End with a recommendation and the open questions only a maintainer or Anthropic can answer.

## The document

`docs/team-accounts-research.md` follows the shape of `docs/github-integration-research.md`: findings with source URLs and retrieval dates, documented facts separated from inference, then the options and the recommendation. Link it wherever `docs/` indexes its documents. `docs/remote-execution.md` and `docs/github-run-control.md` get at most one sentence each pointing at it from where they describe the credentials.

## Out of scope

- Any code, workflow, template or configuration change.
- Billing or legal advice beyond quoting and summarising the published terms.
