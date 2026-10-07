`feat_forge_reasoned_control` lets an agent read a mention of the harness's handle **anywhere** in an issue or pull-request conversation comment and decide what was asked. Today a comment acts only in the exact `@sdlc-harness <verb>` form.

**This comes after `feat_forge_run_control`**, which shipped the comment commands (`status` among them), the review rounds, the cumulative round collector, the `collect` job, the settledness test and the draft pull request opened at the run's start. Before planning, read:

- `docs/github-run-control.md` in full;
- `cli/src/remote/githubActions.ts` (`COMMAND_HANDLE`, `COMMAND_VERBS`, `COMMENT_MARKER`);
- `cli/templates/github/workflows/harness-control.yml`;
- in `cli/templates/scripts/remote-run.sh`: `verb_control`, `control_comment_intake`, `control_branch_from_pr`, `control_branch_from_issue`, `control_check_branch`, `control_status`, `control_answer` and `authorise_actor`.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

> **Everything under "Leads" is research, not a decision.** The planner and the reviewers must agree on the design themselves.

---

## Why

Today a comment acts only when its first line opens with `@sdlc-harness` followed by one of six verbs (`answer`, `pause`, `resume`, `stop`, `clear`, `status`). That is rigid. People write to an agent the way they write to a colleague:

- *"The session parked. @sdlc-harness check the question and let me know"*
- *"I am not sure the planning is going as expected. Let's pause the run so I can take a better look before it proceeds. @sdlc-harness"*
- *"@sdlc-harness it hit the plan loop cap. If the question has an option to give it more rounds, give it three more"*

A local Claude session already handles this kind of free text well. *"what is the status on this branch"* loads the status skill. *"headless session parked. I think it hit the plan loop cap. If it did and the question it dropped has an option to give it more rounds, give it three more"* finds the park, reads the question and writes the answer file. The same reasoning should be available on GitHub.

## The goal

1. **A mention anywhere in a conversation comment is read.** A comment on an issue or a pull request (`issue_comment`, the event `harness-control.yml` already listens to) can mention `@sdlc-harness` anywhere in its text. If it comes from an authorised actor (the existing `authorise_actor` check, unchanged), it is handed to an agent with its context: the comment, the issue or pull request it belongs to, the run's state and any open question files.
2. **The branch is resolved first, in code.** Today's `control_branch_from_pr` and `control_branch_from_issue` run before any session. A mention on an item with no harness run gets today's refusal (for example *"is not a harness branch"*, or *"no harness run was started from this issue"*) and starts no session.
3. **The agent decides; the existing verbs act.** The agent returns a structured decision, and the script validates it. The decision comes from a closed set:
   - one of the existing verbs with its arguments, for example `answer` with question number and text, or `status`;
   - a reply with information, such as an explanation of an open question or a summary of what the run is doing;
   - a request that the commenter clarify;
   - no action and no reply, for a mention not addressed to the harness (*"thanks @sdlc-harness"*), which must end quickly.

   Only the script's existing verbs change state. The agent gets read-only tools, with no push, no shell and no workflow dispatch. A request for fixes (*"@sdlc-harness fix this"*) does not start a round. It gets a reply saying that a review requesting changes starts one (`docs/github-run-control.md` → `## 2. A review that requests changes starts a round`), and naming the local `/autonomous-sdlc-harness:branch-user-review` for an author who cannot request changes on their own pull request (`## 4. The draft pull request`).
4. **When unsure, ask.** An ambiguous request, or a destructive one such as `stop`, gets a reply that confirms or asks, not an action.
5. **The exact form stays a cheap path.** A comment whose first line is exactly `@sdlc-harness <verb> …` keeps being parsed in code with no session, as today.
6. **Replies land where the mention was**, as a comment on the same issue or pull request.

## Constraints

- **Prompt injection is the main risk.** Comment text, the diff, file contents and question files are all untrusted input to the agent. The boundary is the decision schema, the read-only tool set and the script-side validation. The design must state why a hostile comment, or hostile text in the code under review, cannot make the job do anything outside the closed set.
- **A credential in the control job.** `harness-control.yml` reads no secret today. Running an agent needs `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY` in that job. Record the decision and its exposure in `docs/github-run-control.md` → `## 6. Who can act, and pull requests from forks`, citing `docs/remote-execution.md` → `## 11. Security` rather than restating it. The exposure today:
  - every actor already needs write access, and the `HARNESS_RUN_ACTORS` allow-list must also admit them;
  - a comment on a fork's pull request is already refused (`control_branch_from_pr`).

  Also state which events can reach the secret. Only `issue_comment` needs it, so the review, close and deletion paths should not get it. A `pull_request_review` job runs the workflow file from the pull request's merge commit.
- **Concurrency.** A comment job keeps its own run-id group (`harness-control-<run id>`), which never waits and is never replaced. Nothing in this task places a review round, so `harness-review-<branch>` is unchanged.

## Leads (re-verify every one)

- GitHub Copilot's cloud agent acts on `@copilot` mentioned in a pull-request comment by a user with write access, and treats a submitted review as one unit of feedback (docs.github.com, "Using Copilot cloud agent on GitHub" and "Get the best results"). Its handling of input that arrives mid-session is not documented.
- `anthropics/claude-code-action` triggers on `issue_comment`, `pull_request_review_comment` and `pull_request_review` events gated on `@claude` in the body, and reads every review with its body and inline comments. Its example workflow has no concurrency group, and it never rebases.
- Claude Code 2.1.292 lists `--json-schema <schema>` ("JSON Schema for structured output"), `--output-format`, `--allowedTools`, `--disallowedTools`, `--model` and `--max-budget-usd` in `claude --help`. Check how `--json-schema` behaves in `--print` mode, and what happens when the output fails the schema, before designing the decision schema around it.

## Out of scope

- **Review rounds stay as they are.** A submitted review whose state is `changes_requested` starts a round. *Approve* and *Comment* reviews start none, and their summaries ride along. Mentions inside a review's summary or its inline comments are not read either. Making rounds opt-in by mention would need two things this task leaves out:
  - listening again to `pull_request_review_comment`, which `harness-control.yml` deliberately never does, because one review raises one such event per inline comment (C1);
  - per-comment deduplication.

  That is a later task, together with what the author of a pull request opened with their own `HARNESS_GIT_TOKEN` can do about not being able to request changes.
- **Starting a run from a mention**, on an issue without the trigger label or on a pull request opened by hand. A start keeps one gesture, the trigger label on an issue (`docs/github-issue-trigger.md` → `## 4. What the labeller vouches for`). A mention can arrive at any point, including on a branch that already holds committed work, and choosing between a fresh plan, a resume and a round from free text belongs to no verb in the closed set. Goal 2 answers such a mention with today's refusal.
- Delivering a mention into a run that is already in flight. It is answered with the run's state.
- Any change to the local `/autonomous-sdlc-harness:branch-*` commands.
