`chore_github_integration_research` answers the open questions of three later branches, `feat_forge_run_triggers`,
`feat_forge_run_control` and `feat_github_native_adoption`, and records the answers in **one research document**,
`docs/github-integration-research.md`. It implements nothing. No code, template, workflow, command, agent or
config changes. The document is the whole deliverable.

**Why this is its own branch.** Each of those three prompts tells its planner to re-verify its leads against the
live sources, and an unattended run cannot. No agent under `plugin/agents/` carries `WebFetch` or `WebSearch`, and
the unattended permission profile grants neither, nor `curl` or `gh`. That is why `docs/remote-execution.md` says
*"carried from the task prompt's research, not re-fetched"* six times. The three branches also share most of
their questions, so the research is done once here.

> ⚠️ **Run this branch supervised, not autonomously.** Plan it with `/autonomous-sdlc-harness:branch-start-plan`.
> In that flow the main session writes the plan itself, and a person approves each web call it makes.
> **Do all the research during planning.** The plan's per-task files must carry every finding with its source,
> retrieval date and quote. The implementer that `/autonomous-sdlc-harness:branch-implement-plan` dispatches has no
> web tools, and only turns the plan's findings into the document. A finding the planning session did not fetch
> or measure is recorded as **unverified**, never inferred.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

---

## The deliverable

`docs/github-integration-research.md`, with:

1. **One entry per question below**, keeping its ID (T1, C1, A1, ...), with:
   - **Verdict:** `verified`, `refuted`, `partly true` or `unverified`.
   - **Answer:** what is true, in a few sentences.
   - **Evidence:** for a document, its URL, the retrieval date and the sentence it rests on, quoted. For a
     measurement, the command run, where, when, on which version, and its output as printed.
   - **Consequence:** which of the three prompts it changes, and how.
2. **A summary table** at the top: ID, question, verdict, and the prompts affected.
3. **An options comparison for adoption** (A-questions): every route evaluated, with the number of actions an
   adopter performs from nothing to a first run, counting every click-through, paste, commit, secret, setting and
   merge, and what each route costs and requires.
4. **A section listing every lead in the three prompts that this research refutes**, so they can be corrected.

Research only the questions below plus anything they lead to directly. Do not design the three branches' features;
where a question asks for options, list them and their facts, and leave the choice to those branches.

## Questions

### Shared: GitHub Actions and tokens

- **S1.** Can `GITHUB_TOKEN` create or modify files under `.github/workflows/` with any `permissions:` setting?
  What error does a refused push print? Does creating a branch whose commits touch no workflow file work,
  including when that branch is cut from a default branch that carries workflow files?
- **S2.** Which tokens *can* write workflow files: a fine-grained PAT (*Workflows: write*), a classic PAT
  (`workflow` scope), a GitHub App installation token (*Workflows* permission), a Codespace's token? How does
  each expire, and how is each created?
- **S3.** Which events a `GITHUB_TOKEN` action raises start other workflows, and which do not (pushes, PR
  creation, comments, labels). `workflow_dispatch` and a push are already verified in
  `docs/remote-execution.md` → `### Verified in Gate 12 round 2` and `round 3`, so do not repeat those.
- **S4.** The repository and organisation setting *"Allow GitHub Actions to create and approve pull requests"*:
  its default for a new personal repository and a new organisation, where it is set, and whether a workflow can
  read it.
- **S5.** `workflow_dispatch`: the current limit on the number of inputs, and on the payload size (the code
  assumes 65,535 characters: `remote-run.sh` → `REMOTE_INPUT_PAYLOAD_MAX`).
- **S6.** The maximum length of an issue or PR comment body.

### Triggers (`feat_forge_run_triggers`)

- **T1.** The `issues` event's activity types. Which role is needed to apply a label: is *triage* enough? Who
  appears as `sender` on `labeled`?
- **T2.** Does an `issues` workflow get the repository's secrets and a write token when the issue was opened by
  someone without access?
- **T3.** The API for a user's permission on a repository (`collaborators/{user}/permission` or its successor),
  what it returns for an organisation member, an outside collaborator and a bot, and the token scope it needs.
- **T4.** What `anthropics/claude-code-action` checks before acting (write access, bot actors, allow-lists), and
  where it documents this.
- **T5.** Git's and GitHub's rules on branch names that matter for a derived slug: `git check-ref-format`, length
  limits, case sensitivity.
- **T6.** Jira Automation → GitHub `repository_dispatch`: whether it works as described, and what a Jira rule
  needs (token, payload shape). GitLab's equivalent route, in one paragraph.

### Control (`feat_forge_run_control`)

- **C1.** `pull_request_review` (`submitted`), `pull_request_review_comment` and `issue_comment` on a PR: which
  review states exist in the payload, and how to fetch every inline comment of one review with its file and
  line.
- **C2.** What each of those events gets on a PR whose head is **a fork**: secrets, token permissions. What
  `pull_request_target` changes, and GitHub's own guidance on it.
- **C3.** Whether a `GITHUB_TOKEN` can open a *draft* PR, and what it needs beyond S4.
- **C4.** Prior art for comment commands: the syntax `anthropics/claude-code-action` uses, and any convention
  that avoids a collision with it.

### Adoption (`feat_github_native_adoption`)

- **A1.** Reusable workflows against composite actions: secrets (`inherit`), `permissions`, `concurrency`,
  nesting depth, `schedule` in a called workflow, and whether a caller can be pinned by tag and bumped by
  Dependabot.
- **A2.** GitHub Marketplace: can a reusable workflow be listed, or only an action? What does a listing
  require?
- **A3.** Can a disabled workflow file (`gh workflow disable`) share a file with other triggers, or does
  disabling it disable every trigger in the file? This matters because the resume poller disables itself
  (`docs/remote-execution.md` → `### Resuming without the local watcher`).
- **A4.** GitHub's web editor: does `https://github.com/<owner>/<repo>/new/<branch>?filename=…&value=…` prefill a
  new file, and what is the length limit of `value`? What does a person click after that to commit?
- **A5.** Workflow templates (the organisation `.github` repository), template repositories, and any other way to
  put a workflow file into a repository without a local checkout.
- **A6.** GitHub Apps: what one needs hosted, the *Workflows* permission, and whether a thin app that only relays
  events into `workflow_dispatch` is possible without the harness holding anyone's credentials. What it would
  cost to host.
- **A7.** Copilot coding agent, GitHub's programme for third-party coding agents (including Anthropic's Claude),
  and Copilot Extensions' status: what each runs, who bills it, and whether any can run Claude Code with a custom
  plugin, permission profile and launch line.
- **A8.** The Claude GitHub App (`/install-github-app`, or its install page): what it installs, which
  permissions it holds (in particular *Workflows*), and which credentials it uses.
- **A9.** GitHub Codespaces:
  - Can an interactive `claude` session run in its terminal with the plugin enabled, and how does it sign in?
  - Can `claude setup-token` run there?
  - Can the Codespace's own token push `.github/workflows/*`?
  - What are the included quota and the cost of a one-hour session?
  - Can a README button open a Codespace on *another* repository, the adopter's?
- **A10.** Claude Code on the web (claude.ai/code): can a cloud session run `npx`, push a branch and open a PR in
  the adopter's repository? Which GitHub permissions does it hold? Do repository plugins load there?
- **A11.** A subscription user's credential: is there any route to `CLAUDE_CODE_OAUTH_TOKEN` without running the
  `claude` CLI on some machine (A9 may answer it)?
- **A12.** The `.claude/**` sensitive-path wall on the **current** Claude Code: is it still true that
  `--permission-mode acceptEdits` does not cover a write there, and that no `permissions.allow` entry grants it?
  `docs/analyze.md` → `## 3. What it may write` records the 2.1.237 measurement. Measure it the same way on
  today's version in a scratch repository, and record the command, the version and the result. Also check
  whether a write through `Bash` (a redirect or `cp`) into `.claude/` is subject to the same wall.

## Measurements

Some questions are best answered by trying them. S1, S2, A3, A4 and A12 especially. For anything that needs a
real GitHub repository, use the standing Gate 12 repository `firu-daniel/harness-gate12`: reset it to its seed
afterwards and never delete it. Record every measurement as the deliverable's *Evidence* rule says. A
measurement that was not run leaves its question `unverified`.

## Acceptance

1. `docs/github-integration-research.md` exists and has an entry for every question ID above, with a verdict.
2. Every `verified`, `refuted` or `partly true` entry has a source URL with its retrieval date and a quoted
   sentence, or a recorded measurement.
3. The adoption options comparison counts the adopter's actions for every route evaluated.
4. The refuted-leads section names each lead and the prompt it came from.
5. No file other than the research document, and the harness's own run artifacts, changes on the branch.
6. `bash scripts/run-gates.sh` prints no new failure.
