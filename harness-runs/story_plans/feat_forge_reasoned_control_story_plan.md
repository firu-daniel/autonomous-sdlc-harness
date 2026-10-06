# Story: A mention of `@sdlc-harness` anywhere in a conversation comment is read by an agent

## Context

Today `remote-run.sh control` acts on an `issue_comment` only when the comment's first line opens with `@sdlc-harness` followed by one of the six verbs (`COMMAND_VERBS`: `answer`, `pause`, `resume`, `stop`, `clear`, `status`). Every other comment is ignored with one line, or refused as an unknown verb. This branch makes a mention of the handle **anywhere** in a newly created issue or pull-request conversation comment readable. Once the comment's author passes today's gates, it goes to a headless, read-only session whose first message is the plugin's mention-reading slash command. That session returns one structured decision from a closed set, and the script validates the decision before anything happens. The exact form `@sdlc-harness <verb> …` on the first line stays the cheap path, parsed in code with no session, exactly as today.

**The flow of a mention, in the order the script runs it.** Each step reuses what exists:

1. Intake classifies the comment. The exact form is the first word of the first line equal to `COMMAND_HANDLE` (compared lowercase), and the next word lowercased is one of `COMMAND_VERBS`. Otherwise, a body carrying the handle as a word anywhere is a mention. Otherwise the comment is ignored.
2. The existing gates run unchanged: `HARNESS_REMOTE_STOP`, `forge_on`, `rerun_actor_listed`, then `authorise_actor`.
3. The branch is resolved in code, before any session, by the existing `control_branch_from_pr` / `control_branch_from_issue` and `control_check_branch`. Their refusals stand word for word, so a mention on an item with no harness run gets today's refusal and starts no session.
4. The run's state is read (`control_state_var`).
5. If neither credential reaches the script, a fixed reply is posted and no session runs. If the pinned plugin carrying the mention command did not reach the job, or the agent binary is missing, a fixed reply is posted and no session runs.
6. Otherwise the script writes a context directory under `RUNNER_TEMP`, holding the comment, the run's state, the open question files and, later, the item, its recent conversation and a pull request's diff. It then runs the agent once.

**The session, its tools and its output.** The mention reader is a `plugin`-layer slash command, `plugin/commands/harness-read-mention.md`, which loads the instruction file `plugin/instructions/mention_reading.md`. The script runs it as `claude -p /autonomous-sdlc-harness:harness-read-mention --plugin-dir <pinned plugin> --add-dir <pinned plugin>/instructions …`. A command declares no `tools:`, so the read-only closure rests entirely on the session's `--tools Read,Grep,Glob` under `--restricted`. `--add-dir` exists only so that `Read` can open the instruction file. The session has no MCP server, no tool that invokes a slash command, no session persistence and no `GH_TOKEN` in its environment, and its working directory is the context directory, outside the checkout. Its only output is one JSON object: `action` ∈ `MENTION_ACTIONS` (`command`, `reply`, `clarify`, `fixes`, `none`), plus `verb`, `question`, `answer`, `text` and `reason` as the action needs.

**Only the script's existing verbs change state.** A `command` decision for `answer`, `pause`, `resume` or `status` (`MENTION_ACT_VERBS`) is carried out through the verb's own arm (`control_answer`, `control_pause`, `control_resume`, `control_status`), with every state check that arm already makes. The arm's reply opens by naming the exact form the mention was read as. A `command` for `stop` or `clear` (`MENTION_CONFIRM_VERBS`) is never carried out from a mention: the reply asks the commenter to type the command itself. `stop` is destructive, and on GitHub typing `clear` is already the confirmation `branch-resume` asks for. The other actions:

- `reply` and `clarify` post the agent's text, sanitised, under a fixed prefix and footer.
- `fixes` posts a reply whose text is the script's own: a review requesting changes starts a round, and the author who cannot request changes uses the local `/autonomous-sdlc-harness:branch-user-review`.
- `none` posts nothing and ends.

A decision outside the set is refused with a reply, exit 2. An agent that could not run, or that ended in error, gets a reply and exit 3. Neither is retried.

**The credential.** `harness-control.yml` passes `CLAUDE_CODE_OAUTH_TOKEN` / `ANTHROPIC_API_KEY` to its act step as `IN_OAUTH` / `IN_API`. Each is gated by an expression that yields the empty string unless the event is `issue_comment`, so the review, close and deletion paths never receive it. The script hands them only to the agent child. The design decision and its exposure are recorded in `docs/github-run-control.md` → `## 6.`, citing `docs/remote-execution.md` → `## 11. Security`.

**Where the mention reader lives, and how the control job reaches it.** The role, trust boundary, reading order and decision contract are prose an agent reads, so they belong to `plugin`, not to a file under `cli/templates/` (`.claude/context/conventions.md` → `### Where a new responsibility goes`; `.claude/context/cli.md` → `## What this layer owns, and what it is not`).

- **The asset kind.** A shipped script, not a flow, invokes the role, so it is a **slash command** (`.claude/context/plugin.md` → `## Where a new asset goes`, *"a slash command a user or the watcher invokes"*). It lands with the instruction file it loads (`## What accompanies a new unit of each kind`).
- **Not an agent definition.** `plugin/agents/` is for *"a role the flow dispatches as a sub-agent"*, and an agent definition needs *"the instruction or command that dispatches it"*. That is why architecture review 1 withdrew the earlier `plugin/agents/mention-reader.md` shape. No agent definition is added.

The control job reaches the plugin the way `harness-run.yml` does:

- **The pin.** A comment-only `Fetch the pinned plugin` step clones the marketplace repository at the release tag `autonomous-sdlc-harness--v<pin>`, where `<pin>` is the `HARNESS_CLI_VERSION` the repository's committed `harness-run.yml` carries. `harness-control.yml` itself still carries no pin (`cli/src/generators/githubWorkflows.ts` → choice 5), and `init --upgrade-workflows` keeps the one it reads current.
- **The version check.** The step checks the clone's `plugin.json` version against the pin.
- **The hand-off.** It exports the plugin's directory as `HARNESS_MENTION_PLUGIN_DIR`, which the script passes to `--plugin-dir` for the one session. It runs no `claude plugin install`, because `--restricted` ignores the user settings an install is recorded in.

This is the established contract coupling between the two halves: a shipped script launches a plugin slash command by name as a session's first message, exactly as `autonomous-watcher.sh` does, and nothing imports or sources across the boundary (`.claude/context/conventions.md` → `## The layers`). A pin older than this branch carries no mention command, and the mention gets the no-plugin reply.

**What is out of scope.** Review rounds, mentions inside reviews and inline comments, starting a run from a mention, and delivering a mention into a run in flight are all excluded by the task prompt's `## Out of scope`. A mention on a run in flight is answered with the run's state through the arms: an `answer` while a job runs is refused by `control_answer` exactly as the exact form is. The lessons-ledger rule *"Never refuse a person's input because a run is in flight…"* is honoured as far as that exclusion allows: the task prompt's third out-of-scope bullet, *"Delivering a mention into a run that is already in flight. It is answered with the run's state."*, is the authorising line. No local `/autonomous-sdlc-harness:branch-*` command changes.

**The tasks.** There are eleven single-layer tasks in bottom-up ship order: the `cli` tasks first, then the two `plugin` tasks, then the catch-all `general` last.

- Task 1 declares the names, the command's plugin-qualified name included.
- Task 2 builds the mention path up to a validated decision, running the plugin command and conservatively asking for confirmation of every `command`.
- Task 3 carries out the four act-verbs, sharing one backtick-fence rule with `round_collect`.
- Task 4 widens the agent's context.
- Task 5 wires the credential, the agent CLI and the pinned plugin into the workflow.
- Task 6 makes `doctor` and `init` say so.
- Task 7 writes the instruction file `plugin/instructions/mention_reading.md`.
- Task 8 writes the command `plugin/commands/harness-read-mention.md` that loads it.
- Tasks 9–11 write the documents of record.

Until Task 8 ships, a real job finds no `commands/harness-read-mention.md` in its plugin and answers every mention with the no-plugin reply. No release ships between the tasks of one branch, and every test before then drives an agent stub.

**Top risks:**

- **Hostile text steering the job outside the closed set.** The likeliest serious failure is a hostile comment, question file or diff doing so. Task 2 guards it with tool-level read-only confinement, a script-side validator that is the sole authority on the decision, reply sanitisation and a check that refuses any reply carrying a credential value. A command carries no allowlist, so the session flags are the whole closure; Task 7 states the trust boundary in the instruction file. Task 3 routes every state change through an existing arm and never carries out `stop` or `clear` from a mention. Task 10 states the argument of record.
- **Unmeasured agent-CLI behaviour on the runner's installed version.** That covers:
  - `--json-schema` in `--print` mode;
  - a `--plugin-dir` plugin's slash command expanding as the `-p` prompt under `--restricted`, with `${CLAUDE_PLUGIN_ROOT}` resolving and `--add-dir` opening the instruction file;
  - `--restricted`'s confinement.

  Task 2 makes the script's own validation authoritative and degrades every unknown into a reply plus exit 2 or 3, never an action. Task 10 records each such behaviour as unverified in `## 8.`, Task 11's Gate 12 leg is the first observation, and Task 5's fetch step names its own failure in the job log.
- **The credential reaching events that do not need it, or the exact-form path regressing.** Task 5 gates the secret per event and asserts it in `workflow-templates.test.mjs`. Task 2 keeps the exact-form classification first and the existing command suite green.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom, and only the committing role flips a marker to `[x]` as that task's commit lands. In every flow that dispatches one, that role is the `committer` agent. In the supervised flow, which dispatches none, it is the orchestrator itself. No implementer changes a marker here, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else, such as the sub-step bullets inside the per-task files, are informational progress markers only: they are never the iteration source, and the committer never touches them.

Each entry resolves 1:1 to a self-contained `harness-runs/task_plans/feat_forge_reasoned_control/task_<K>_plan.md`. They are ordered bottom-up by ship sequence, in the configured layer order `cli`, `plugin`, `general`, with the catch-all `general` last.

1. [x] **Task 1** — Declare the mention names in `githubActions.ts` and mirror them in `remote-run.sh` _(layer: cli)_ _(points: 10)_
2. [x] **Task 2** — Read a mention through a read-only agent and validate its decision against the closed set _(layer: cli)_ _(points: 20)_
3. [x] **Task 3** — Carry out a mention's `answer`, `pause`, `resume` and `status` through the existing verb arms _(layer: cli)_ _(points: 15)_
4. [x] **Task 4** — Give the mention agent the item, its recent conversation and the pull request's diff _(layer: cli)_ _(points: 10)_
5. [x] **Task 5** — Give `harness-control.yml`'s comment path the credential, the agent CLI and the pinned plugin _(layer: cli)_ _(points: 15)_
6. [x] **Task 6** — Report mentions in `doctor` and `init`, and warn on a control workflow that passes no credential _(layer: cli)_ _(points: 12)_
7. [ ] **Task 7** — Write the mention-reading instruction file `plugin/instructions/mention_reading.md` _(layer: plugin)_ _(points: 15)_
8. [ ] **Task 8** — Add the mention reader as the plugin slash command `harness-read-mention` _(layer: plugin)_ _(points: 13)_
9. [ ] **Task 9** — Document mentions in `docs/github-run-control.md` §1 and §3 _(layer: general)_ _(points: 15)_
10. [ ] **Task 10** — Record the credential decision, the injection boundary and the unverified behaviours in `docs/github-run-control.md` §6 and §8 _(layer: general)_ _(points: 15)_
11. [ ] **Task 11** — Bring the other documents of record in line with mentions _(layer: general)_ _(points: 14)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Today a comment acts only in the exact `@sdlc-harness <verb>` form."* That covers every durable corpus site that states how a comment is read, or that only the run job holds the credential. It also covers the corpus sites that enumerate the plugin's slash commands and instruction files, to which this branch adds one each (Tasks 7 and 8). Since architecture review 1 it adds no agent definition, so the agent-roster sites that iteration 0 listed (rows 31–34 and 49) are kept with their dispositions updated.

**Derivation entry D1 — corpus files stating the comment-command shape (command).** Re-run verbatim from the checkout root:

```
git grep -nE "first word of the first line|first line opens with|Never a command|is not the first word|comment commands?|a comment opening with" -- '*.md' '*.txt' ':!harness-runs/**' ':!examples/**' ':!.claude/**'
```

The exclusions are deliberate:

- `harness-runs/` is the record of past runs.
- `examples/` is a frozen capture (`.claude/context/conventions.md` → `## Documents of record`).
- `.claude/` holds the conventions documents. They are never a task's target, and are covered by rows 45–48 and 66 below.

**Derivation entry D2 — corpus files stating which job holds the credential (command).** Re-run verbatim:

```
git grep -nE "Only the run job holds|reads no (repository )?secret|references no secret|credential secrets never reach|holds? (a|no) (Claude )?credential|none holds a credential|\| \`(CLAUDE_CODE_OAUTH_TOKEN|ANTHROPIC_API_KEY)\` \| secret \|" -- '*.md' ':!harness-runs/**' ':!examples/**' ':!.claude/**'
```

**Derivation entry D3 — corpus files enumerating or counting the plugin's slash commands and instruction files (command).** Re-run verbatim:

```
git grep -nE "nineteen|twenty-seven|Not every command|plugin/commands/\*|slash-command definitions|\`?branch-\*\`? (slash )?commands|not a \`branch-\*\`" -- '*.md' '*.txt' ':!harness-runs/**' ':!examples/**' ':!.claude/**'
```

This replaces iteration 0's D3, which enumerated the plugin's agent definitions. That probe now reaches nothing this branch changes: no agent definition is added. The sites it reached keep their rows (31–34, 49). Review round 1 widened it with two alternatives, `` `?branch-\*`? (slash )?commands `` and `` not a `branch-\*` ``, which reach the sites that enumerate the plugin's commands as *"the `branch-*` commands plus `harness-analyze`"*; every alternative of the earlier D3 is kept.

**Derivation entry D4 — standing-artifact rows (procedure).**

- **First step, runnable:** `grep -nE '^## |^- \*\*' harness-runs/lessons.md`.
- **Artifact:** the lessons ledger `harness-runs/lessons.md`.
- **Traversal:** its `## ` topic headings in file order, then each one-line rule under each heading in order.
- **Decision rule:** a rule is reached when it governs how a person's input given on GitHub (a comment, a review, an answer) is accepted, refused, collected or kept.

**Closure invariant:** every site any of D1–D4 reaches appears as a row below. A re-run whose output holds a site absent from this table is a finding against the register. Rows 38–49 are sites the task prompt or this plan's own work names; no derivation reaches them. Rows 50–52 are sites the widened D1 and D2 reach (review round 0). Rows 53–55 and 66 are sites this plan's revised work names (architecture review 1). Rows 56–65 and 67 are the sites the revised D3 reaches. Rows 68–73 are the further sites D3's review-round-1 widening reaches.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `ARCHITECTURE.md` → `## 6`'s forge bullet (*"`@sdlc-harness` comment commands and a review requesting changes steer it"*) | — | D1, `comment commands` | `no-change` | Still true as written: a mention adds a reading and contradicts nothing it states |
| 2 | `ARCHITECTURE.md` → the `forge` paragraph (*"to obey comment commands and review rounds"*) | — | D1, `comment commands` | `no-change` | Same reason as row 1 |
| 3 | `README.md` (*"The setup, the comment commands, what still needs a local machine and the caveats are in"*) | — | D1, `comment commands` | `no-change` | A pointer to `docs/github-run-control.md`, whose §1 carries mentions after Task 9 |
| 4 | `README.md` → the documents list (*"the GitHub entry point, comment commands, review rounds"*) | — | D1, `comment commands` | `no-change` | Lists the document's topics, and comment commands remain one; §1 keeps its heading |
| 5 | `ROADMAP.md` → the *Cloud / CI execution* row (*"Run control has shipped: comment commands"*) | — | D1, `comment commands` | `no-change` | A shipped-status summary that stays true |
| 6 | `docs/cli.md` (*"a comment opening with `@sdlc-harness` and a verb steers the run"*) | — | D1, `a comment opening with` | `change` | Task 11 |
| 7 | `docs/config.md` → `## 5.` `forge` row (*"`@sdlc-harness` comment commands steer it"*) | — | D1, `comment commands` | `no-change` | Names what `forge` turns on, which stays true; mentions ride on the same workflow |
| 8 | `docs/development.md` → Gate 12 Round 8, item 5 (*"A comment command in a run's first minutes is refused"*) | — | D1, `comment command` | `no-change` | A dated gate record of what was observed; editing it falsifies the record |
| 9 | `docs/development.md` → `**(xiv) Run control from GitHub with the machine off.**` | — | D1, `comment commands` | `change` | Task 11 adds the mention leg |
| 10 | `docs/development.md` → `(xv)` leg `**(d) A comment command.**` | — | D1, `comment command` | `no-change` | Its subject is the allow-list on the exact command, which is unchanged |
| 11 | `docs/github-integration-research.md` → the C4 index row (*"Prior art for comment commands"*) | — | D1, `comment commands` | `no-change` | Research retrieved on its stated date; not re-verified or restated |
| 12 | `docs/github-integration-research.md` → `### C4.` heading | — | D1, `comment commands` | `no-change` | Same reason as row 11 |
| 13 | `docs/github-integration-research.md` → C4 (*"a published convention for namespacing comment commands across bots"*) | — | D1, `comment commands` | `no-change` | Same reason as row 11 |
| 14 | `docs/github-issue-trigger.md` (*"`authorise_actor`, now governs every comment command and review"*) | — | D1, `comment command` | `no-change` | Stays true: a mention passes the same `authorise_actor` before any session |
| 15 | `docs/github-run-control.md` → the `**Who reads this:**` line (*"It owns the design of record for comment commands"*) | — | D1, `comment commands` | `change` | Task 9 |
| 16 | `docs/github-run-control.md` → `## 1.` (*"A command is a new comment whose first line opens with `@sdlc-harness`"*) | — | D1, `first line opens with` | `change` | Task 9 |
| 17 | `docs/github-run-control.md` → `## 1.` `**Never a command:**` | — | D1, `Never a command` | `change` | Task 9 |
| 18 | `docs/github-run-control.md` → `## 1.` (*"`Let's @sdlc-harness pause` — the handle is not the first word"*) | — | D1, `is not the first word` | `change` | Task 9 |
| 19 | `docs/github-run-control.md` → `## 1.` (*"`> @sdlc-harness pause` — a quote is not the first word either"*) | — | D1, `is not the first word` | `change` | Task 9 |
| 20 | `docs/github-run-control.md` → `## 3.` *"A quote reply"* bullet (*"so it is never a command anyway (§1, *Never a command*)"*) | — | D1, `Never a command` | `change` | Task 9 |
| 21 | `docs/remote-execution.md` → `## 6.` poller row (*"the trigger, the comment commands and `collect`'s next round each named `github-actions[bot]`"*) | — | D1, `comment commands` | `no-change` | A measurement of who a dispatch names; a mention's dispatches go through the same arms |
| 22 | `docs/remote-execution.md` → `## 11.` *Who can spend the credential* (*"The comment commands, the issue trigger and a review round's collection check it in `remote-run.sh`"*) | — | D1, `comment commands` | `no-change` | Stays true: the mention path checks the list in `remote-run.sh` before any session. The task prompt asks `## 6.` of `github-run-control.md` to cite §11 rather than restate it (Task 10) |
| 23 | `plugin/docs/AUTONOMOUS_FLOW.md` → the remote-execution row (*"its `control` verb obeys a collaborator's `@sdlc-harness` comment commands"*) | — | D1, `comment commands` | `no-change` | Stays true. It names `docs/github-run-control.md` as the format of record, which carries mentions |
| 24 | `plugin/docs/AUTONOMOUS_FLOW.md` → *"Forge coupling is GitHub-only."* | — | D1, `comment commands` | `no-change` | Stays true; it lists what ships for GitHub only |
| 25 | `docs/github-issue-trigger.md` (*"The trigger job references no secret."*) | — | D2, `references no secret` | `no-change` | The trigger job is unchanged and still reads no secret |
| 26 | `docs/github-run-control.md` → `## 4.` (*"the trigger job, which reads no secret by design"*) | — | D2, `reads no secret` | `no-change` | About the trigger job, which is unchanged |
| 27 | `docs/remote-execution.md` → `### Every secret and variable`, the `CLAUDE_CODE_OAUTH_TOKEN` row | — | D2, the secret row | `change` | Task 11 |
| 28 | `docs/remote-execution.md` → `### Every secret and variable`, the `ANTHROPIC_API_KEY` row (*"as above"*) | — | D2, the secret row | `change` | Task 11 |
| 29 | `docs/remote-execution.md` → `## 11.` (*"The `trigger` job reads untrusted issue text only through its event file and the environment, and references no secret."*) | — | D2, `references no secret` | `no-change` | About the trigger job, which is unchanged |
| 30 | `docs/team-accounts-research.md` (*"Only the run job holds a Claude credential."*) | — | D2, `Only the run job holds` | `change` | Task 11 adds a dated pointer, without rewriting the research |
| 31 | `ARCHITECTURE.md` → the *Sub-agent declaration and dispatch* row (*"`plugin/agents/*.md` frontmatter (`name`, `description`, `tools`, `model: inherit`)"*) | — | iteration 0's D3, `plugin/agents/*` | `no-change` | Describes the declaration format and discovery rule; this branch adds no agent definition (architecture review 1) |
| 32 | `ARCHITECTURE.md` → *"Reachable by the agents granted it, and by nothing else in the tree."* | — | iteration 0's D3, `plugin/agents/*` | `no-change` | Enumerates the agents granted an `mcp__` tool; no agent is added, so the enumeration stays exact |
| 33 | `plugin/agents/README.txt` → *"This directory holds the harness's agent definitions:"* | — | iteration 0's D3, `agent definitions:` | `no-change` | No agent definition is added: the mention reader is a command (row 55) and its instruction file (row 53), so the roster stays exact |
| 34 | `plugin/agents/README.txt` → the same sentence's close, *"the committer, and the interactive-test (QA) agent"* | — | iteration 0's D3, `the committer, and the` | `no-change` | Same reason as row 33 |
| 35 | `harness-runs/lessons.md` → *Remote and branch-scoped operations*, *"Never refuse a person's input because a run is in flight…"* | — | D4, governs whether input is refused | `no-change` | Only the fix-plan writer appends to the ledger. Delivering a mention into a run in flight is excluded by the task prompt's `## Out of scope`, third bullet; the mention is answered with the run's state |
| 36 | `harness-runs/lessons.md` → *"A collector fired by one event gathers every pending item…"* | — | D4, governs collection | `no-change` | Review rounds are untouched (task prompt `## Out of scope`, first bullet) |
| 37 | `harness-runs/lessons.md` → *"Let an input's type or state decide only whether it triggers an action, never whether its text is kept…"* | — | D4, governs whether text is kept | `no-change` | Review rounds are untouched; a mention's comment stays on the item whatever is decided |
| 38 | `docs/github-run-control.md` → `## 6. Who can act, and pull requests from forks` | — | task prompt, *Constraints*, second bullet | `change` | Task 10 |
| 39 | `docs/github-run-control.md` → `## 8. What is not verified here` | — | task prompt, *Leads*, third bullet | `change` | Task 10 |
| 40 | `docs/github-run-control.md` → `## The GitHub entry point`, item 2 (*"answers, pauses, resumes or stops the run with `@sdlc-harness` comments"*) | — | this plan (Task 9's own section) | `change` | Task 9 |
| 41 | `docs/github-run-control.md` → `## 3.` *"Any plain comment"* bullet | — | this plan (same paragraph as row 20) | `change` | Task 9 |
| 42 | `docs/remote-execution.md` → `### Upgrading`, the *"An old `harness-trigger.yml` or `harness-control.yml`"* bullet | — | this plan (Task 5 changes the control workflow's contract) | `change` | Task 11 |
| 43 | `docs/cli.md` → the `forge` check paragraph (*"`forge` never fails, and it is the key's reporter"*) | — | this plan (Task 6 changes that check) | `change` | Task 11 |
| 44 | `plugin/agents/mention-reader.md` (iteration 0's new file) | — | this plan, iteration 0 | `no-change` | Not created. Withdrawn per architecture review 1, Must Fix 1, route (a): the asset is the command (row 55) and the instruction file it loads (row 53) |
| 45 | `.claude/context/conventions.md` → `### Where a new responsibility goes`, the row *"a contract an agent or a flow reads"* | — | this plan (the mention reader's home) | `no-change` | The plan follows it: the row's homes include `plugin/commands/` and `plugin/instructions/` (Tasks 7–8). Nothing to raise |
| 46 | `.claude/context/cli.md` → `## How a module in this layer is written` (*"Judgement-dependent work … is deliberately absent from this layer"*) | — | this plan (Task 2 starts the session from a template script) | `no-change` | The judgement is the plugin's command and instruction (Tasks 7–8). The script only launches the command by name as a session's first message, exactly as `autonomous-watcher.sh` launches the plugin's commands. Nothing to raise |
| 47 | `.claude/context/plugin.md` → `## Wires: dispatch in, return out` (*"A return is a fenced block of `key: value` lines, and the discriminator is the literal rather than the prose"*) | — | this plan (the decision is a structured-output JSON object) | `no-change` | A conventions document is never a task's target. Task 7's `## Output contract` states which halves of the section the return answers to: byte-stable field names, and `action` as the literal discriminator. It also states why the `key: value` fence is not the carrier: a script reads the session's `--json-schema` output, and multi-line `answer` / `text` cannot ride one line. That the section names no structured-output return is also raised as a `stale-rule` recommendation in `## Corpus staleness`, so that a supervised edit can state the case; the plan does not rest on that note |
| 48 | `.claude/context/plugin.md` → `## Where a new asset goes`, the row *"a slash command a user or the watcher invokes"*, and `## What accompanies a new unit of each kind`, the slash-command row | — | this plan (Task 8 adds a script-invoked command) | `no-change` | The plan follows both rows. The asset is a slash command invoked by a shipped script, as the watcher invokes the plugin's commands. It lands with `description:`, no `argument-hint:` (it takes no argument), `## Resolved values`, `## Steps` and the instruction file it loads (Task 7). No agent definition is added, so `.claude/context/conventions.md`'s agent-definition row, *"the instruction or command that dispatches it"*, does not arise. Nothing to raise |
| 49 | `plugin/agents/README.txt` → *The docs-retrieval grant — one roster, one wire*, the excluded set (*"as are `docs-reviewer`, `statistics-plan-writer` …"*) | — | this plan, iteration 0 | `no-change` | No agent is added, so the excluded set stays exact |
| 50 | `llms.txt` → the `docs/github-run-control.md` entry (*"working a run from GitHub: comment commands, review rounds, the draft pull request, …"*) | — | D1, `comment commands` | `no-change` | Same reason as row 4: it lists the document's topics, and comment commands remain one |
| 51 | `docs/team-accounts-research.md` → `### Option B`, `**What would change.**` (*"`harness-trigger.yml`, `harness-control.yml`, `harness-resume.yml` and `authorise_actor`: no change, since none holds a credential."*) | — | D2, `none holds a credential` | `change` | Task 11 adds a dated pointer after the bullet, as row 30 gets, without rewriting the research |
| 52 | `docs/remote-execution.md` → `## 9.`, *"The harness is never in the money path."* (*"it never holds a credential outside the adopter's own repository secrets"*) | — | D2, `holds a credential` | `no-change` | Stays true: the control job's act step reads the adopter's own repository secrets, and the harness holds nothing outside them |
| 53 | `plugin/instructions/mention_reading.md` (new) | — | this plan (architecture review 1) | `change` | Task 7 |
| 54 | `plugin/instructions/README.md` → the opening paragraph's *"the orchestration instructions the `branch-*` commands and the orchestrating agents load"* | — | this plan (Task 7 adds a file a `harness-*` command loads) | `change` | Task 7 (same paragraph as row 65) |
| 55 | `plugin/commands/harness-read-mention.md` (new) | — | this plan (architecture review 1) | `change` | Task 8 |
| 56 | `ARCHITECTURE.md` → *"`plugin/commands/*.md` — the flow-command definitions. Their engine coupling is §5's first-message row"* | — | D3, `plugin/commands/*` | `no-change` | It disposes of the directory as a token-packaging site; the new command carries the same `${CLAUDE_PLUGIN_ROOT}` form and is launched as a first message too, so the disposition stays true |
| 57 | `docs/development.md` → `## 6.` roadmap row 5 (*"The nineteen `branch-*` slash commands"*) | — | D3, `nineteen` | `no-change` | A dated record of what item 5 shipped; the `branch-*` count is unchanged, since the new command is a `harness-*` one |
| 58 | `docs/typecheck-key-decision.md` (*"the nine `plugin/commands/*.md` files carrying the generic … instruction"*) | — | D3, `plugin/commands/*` | `no-change` | A decision record bounding the commands that carry the `commands.*` wrapper instruction; the new command carries none, so the bounded set is unchanged |
| 59 | `docs/typecheck-key-decision.md` → *"The bounded set is closed."* | — | D3, `plugin/commands/*` | `no-change` | Same reason as row 58 |
| 60 | `plugin/commands/README.txt` → *"This directory holds the harness's slash-command definitions — the `branch-*` entry points …"* | — | D3, `slash-command definitions` | `change` | Task 8, only as far as the sentence must stay true |
| 61 | `plugin/commands/README.txt` → *"landed the nineteen `branch-*` commands beside this file"* | — | D3, `nineteen` | `no-change` | The `branch-*` count is unchanged |
| 62 | `plugin/commands/README.txt` → *"Not every command here is a `branch-*` one: item 15 added `/autonomous-sdlc-harness:harness-analyze`"* | — | D3, `Not every command` | `change` | Task 8 adds the `harness-read-mention` sentence |
| 63 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → row *2. Entry-point commands* (*"nineteen `branch-*` commands … beside `/autonomous-sdlc-harness:harness-analyze`"*) | — | D3, `nineteen` | `change` | Task 8 |
| 64 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → row *3. Instruction cores and their forks* (*"twenty-seven instruction files"*) | — | D3, `twenty-seven` | `change` | Task 8 |
| 65 | `plugin/instructions/README.md` → *"Roadmap item 3 landed twenty-four of the twenty-seven instruction files beside this README"* | — | D3, `twenty-seven` | `change` | Task 7 |
| 66 | `.claude/context/plugin.md` → `## Frontmatter` (*"A command carries `description:` … it declares no `tools:` and no `model:`"*) | — | this plan (Task 8's command, and Task 2's session flags) | `no-change` | The plan follows it. The command declares neither, and the read-only closure and the model rest on the session's `--tools Read,Grep,Glob`, `--restricted` and `--model` (Task 2), as Tasks 2, 8 and 10 state. Nothing to raise |
| 67 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → the counts paragraph under the table (*"Those three counts are of `.md` files … not one of the twenty-seven"*) | — | D3, `twenty-seven` | `change` | Task 8 re-derives each count from `ls` |
| 68 | `plugin/README.md` → the opening paragraph (*"the agent definitions, the `branch-*` slash commands and the `/autonomous-sdlc-harness:harness-analyze` setup command, the tool-guard hooks …"*) | — | D3, `` `branch-*` slash commands `` | `change` | Task 8: an exhaustive list of what the plugin carries, which must name the new command |
| 69 | `plugin/README.md` → the *"Roadmap items 3–5 filled the asset directories"* paragraph (*"Item 15 added `/autonomous-sdlc-harness:harness-analyze` to `commands/`, the one command there that is not a `branch-*` entry point"*) | — | D3, `` not a `branch-*` `` | `change` | Task 8: false once `harness-read-mention.md` lands |
| 70 | `README.md` → *"**The plugin carries the process assets a run executes.**"* (*"the `branch-*` slash commands, the `/autonomous-sdlc-harness:harness-analyze` setup command, …"*) | — | D3, `` `branch-*` slash commands `` | `change` | Task 11: an exhaustive list of the plugin's assets, which must name the new command |
| 71 | `README.md` → the Mermaid diagram's `plugin/` node (*"agents · branch-* commands · /autonomous-sdlc-harness:harness-analyze"*) | — | D3, `branch-* commands` | `change` | Task 11: the same enumeration in diagram form |
| 72 | `llms.txt` → the `plugin/` entry (*"namely agents, `branch-*` commands, `/autonomous-sdlc-harness:harness-analyze`, guard hooks, instructions and samples"*) | — | D3, `` `branch-*` commands `` | `change` | Task 11: the same enumeration, read by language-model crawlers |
| 73 | `plugin/docs/README.md` → the *"Both are **process assets**"* paragraph (*"the `branch-*` commands cite `${CLAUDE_PLUGIN_ROOT}/docs/AUTONOMOUS_FLOW.md` by path"*) | — | D3, `` `branch-*` commands `` | `no-change` | Stays true: it names the commands that cite the flow document, and `harness-read-mention.md` cites only `${CLAUDE_PLUGIN_ROOT}/instructions/mention_reading.md` (Task 8), never `AUTONOMOUS_FLOW.md`. Its *"alongside the agents, slash commands, hooks, …"* names the kind, not the members |
