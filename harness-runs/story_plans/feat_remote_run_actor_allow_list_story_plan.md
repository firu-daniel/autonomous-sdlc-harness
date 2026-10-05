# Story: Spend the repository's Claude credential only for the people the maintainer names

## Context

This branch adds an allow-list of the people who may act on a remote run on GitHub: start it, command it, answer it and review it. Every one of those actions spends whatever Claude credential the repository holds. When that credential is the maintainer's own subscription token, that is the maintainer's quota, which Anthropic's terms do not allow to be shared (`docs/team-accounts-research.md` → `## 5. Options for the harness` → *Option C*). The list is the repository variable **`HARNESS_RUN_ACTORS`**. It is checked in two places:

- **`remote-run.sh` → `authorise_actor`**, the one actor check the trigger, the comment commands, a close and a review round's collection already share.
- **A new gate step at the top of `harness-run.yml`'s `run` and `collect` jobs.** It screens `github.triggering_actor`, so the **Run workflow** form, `gh workflow run` and a re-run by someone not on the list launch nothing. Those three routes never reach `authorise_actor` today.

`doctor` names the effective list and warns about the risky set-ups. `init` states what an unset list means. The docs describe the list and the two credential set-ups: one person driving the repository, or several.

The cut is thirteen single-layer tasks, in bottom-up ship order:

- **`cli` tasks:**
  - Task 1: the variable's name and the list's semantics, as one TypeScript owner.
  - Tasks 2–3: `authorise_actor` and its four callers.
  - Tasks 4–5: the workflows.
  - Tasks 6–8: `doctor`.
  - Task 9: `init`'s report.
- **`general` tasks:**
  - Tasks 10–12: the adopter docs.
  - Task 13: the Gate 12 observation that measures what this branch infers.

No task touches `plugin/`. `plugin/docs/AUTONOMOUS_FLOW.md` already defers who may start a run to `remote-run.sh`'s `trigger` paragraph.

**The list's grammar — one rule, implemented three times.** It is implemented in `remote-run.sh` (Task 2), in the gate step's inline shell (Task 4) and in TypeScript (Task 1, read by `doctor` in Tasks 6–8). Every one of those tasks restates this rule and tests it against the same cases:

- **Parsing.** The value is split on `,`. Each entry is trimmed of surrounding whitespace, and empty entries are dropped.
- **Matching.** A login matches an entry case-insensitively, because GitHub logins are case-insensitive.
- **`*`.** An entry `*` anywhere in the list admits every collaborator with write access. That is today's behaviour, and it is the value a repository on a Claude API organisation's key sets.
- **No entries.** A list with no entries counts as unset: a variable that is unset, empty, only whitespace or only commas. An unset list admits the repository owner alone when the owner's type is `User`. Otherwise it admits nobody: the owner is an `Organization`, or its type cannot be read. That second case fails closed.
- **Where each check reads the owner:**
  - `remote-run.sh` reads it from the event file, at `.repository.owner.login` and `.repository.owner.type`.
  - The gate step reads `github.repository_owner` and `github.event.repository.owner.type`.
  - `doctor` reads `gh api repos/{owner}/{repo}` → `.owner`.

**Decisions this plan makes, each with its reason:**

- **In `authorise_actor`, the permission call comes before the list.** The order is: shape, then the bot list (unchanged), then `collaborators/<login>/permission` (still fail-closed), and then the list, as a new status `5`. Two reasons:
  - A non-writer's refusal keeps naming write access. Every existing refusal case and Gate 12 leg (xiii)(b) stay true.
  - The list refusal is reserved for the case the list exists for: a writer whom the maintainer has not named.
- **The gate is a step inside each of `run` and `collect`, never a job of its own.** **Re-run failed jobs** and **Re-run job** do not re-run an upstream job that succeeded. So a separate gate job would not see the re-runner's `triggering_actor`, which is G2's case. The `collect` job carries the same step because a re-run of `collect` alone would otherwise start a round under the re-runner.
- **`github-actions[bot]` passes the gate**, and nothing else does except a login the list admits. Every harness dispatch is made with `GITHUB_TOKEN` and names that bot. That was measured on 2026-10-05 for the trigger, the comment commands and `collect`'s next round. The `remote-run.sh continue` chain and the `harness-resume.yml` poller were not observed, so for them it is an inference. Task 13's Gate 12 observation confirms them, as the lessons ledger requires of a decision resting on an unmeasured figure. A writer who edits a workflow can also dispatch as that bot. That opens no new hole, because such a writer can already read the secret (G7). The residual-risk paragraph (Task 11) says so.
- **A `repository_dispatch` start is screened too.** The trigger's dispatch path calls no actor check today: *"the token holder is the authority, and refusals 3 to 6 do not apply"*. That leaves `gh api …/dispatches` as a start route for an unlisted writer, which the prompt's *"None of them should ever spend the owner's subscription"* rules out. So a dispatch whose `sender.type` is `User` must be admitted by the list. No permission call is made, since the token already needs Contents write. When the list is not `*`, a missing or empty `sender` is refused (fail closed). A non-`User` sender is unchanged.
- **A close is screened, a branch deletion is not.** `control_close` already sends an issue or pull-request close through `authorise_actor`, so a close by an unlisted writer is ignored, as a command would be. A deletion screens only bots today, and that stays. Deleting a branch already needs write access, the run is gone with the branch, and a stop spends no credential.
- **The poller is unchanged.** It only re-dispatches a run that was already paused by usage, and it names `github-actions[bot]`.

**Where the task prompt or the research document disagree with the repository, the repository wins.** Each disagreement and the fact this plan follows:

- **The upgrade route.** The prompt's item 9 and the research's §5 preamble say a template change reaches an adopter *"only through `init --upgrade-workflows`"*. That holds for `harness-run.yml` and `harness-resume.yml` only. `harness-trigger.yml`, `harness-control.yml` and `remote-run.sh` are re-rendered by `init --force`; see the `WHO WRITES IT` header of each of the two forge workflows and `docs/remote-execution.md` → `### Upgrading`. Tasks 8, 9 and 11 name both routes.
- **The prompt's item 6** says `doctor` *"reads secret and variable names only, never values, as today"*. `doctor` today reads variable **values** (`gh variable list --json name,value`): the runner label and the trigger label. It reads only the **names** of secrets. Naming the effective list needs the variable's value, so `doctor` keeps reading variable values and still reads secret names only.
- **The prompt's item 3** says the gate runs *"before any credential is read"*. The `run` job's job-level `env:` resolves `secrets.HARNESS_PUSH_URL` when the job starts, so that value is in the job before any step runs. The Claude credentials (`CLAUDE_CODE_OAUTH_TOKEN`, `ANTHROPIC_API_KEY`) and `HARNESS_GIT_TOKEN` are read only by steps, and the gate step comes before all of them. A notification URL spends no credential, so it stays where it is.
- **The research's facts.** The research says the `run` job *"is gated only by `if: inputs.action == 'run'`"*. It also carries `&& github.ref_name == inputs.branch`, the wrong-ref check. The research also counts three callers of `authorise_actor`. There are four: `control_close` is the fourth.

**The cross-task interfaces.** Each is defined by one task, and restated by every task that consumes it:

- **`cli/src/remote/githubActions.ts` (Task 1)** exports:
  - `RUN_ACTORS_VARIABLE = 'HARNESS_RUN_ACTORS'` and `RUN_ACTORS_EVERY_WRITER = '*'`.
  - `RepositoryOwner` and `RunActors`.
  - `effectiveRunActors(value, owner)`, `runActorAdmitted(actors, login)` and `carriesRunActors(text)`.
- **The workflow line** `HARNESS_RUN_ACTORS: ${{ vars.HARNESS_RUN_ACTORS }}`: Task 4 adds it to the `run` and `collect` jobs, and Task 5 to the trigger and control jobs.
- **`authorise_actor`'s status `5`, and its `AUTH_WHY` sentences**, are Task 2's.

**Top risks:**

- **The three copies of the grammar drift apart.** One admits `Alice` where another refuses it, or one treats an organisation's unset list as open. Task 1 states the rule once in TypeScript, and Tasks 2 and 4 restate it word for word and drive the same case table through the real shell.
- **The gate can be bypassed or can over-refuse.** A gate placed as its own job is bypassed by a partial re-run. A gate that refuses `github-actions[bot]` stops every chained continuation and every poller dispatch. Task 4 makes the gate the first step of both jobs, asserts the two bodies are byte-identical, and runs the bot case. Task 13's Gate 12 legs observe a continuation and a poller dispatch passing.
- **Existing adopters change behaviour without being told.** An unset list now means the owner only, and nobody at all in an organisation-owned repository. Every existing script test would also start refusing. Task 2 sets `*` in all five suites' environment builders in the same task that changes the meaning. Tasks 8, 9 and 11 tell an adopter what an old copy does and which route moves it on.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top-to-bottom, and each entry flips to `[x]` as that task's commit lands. **Only the committing role flips a marker.** That is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. An implementer never changes a marker here, and never edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as the sub-step bullets inside the per-task files, are informational only: they are never the iteration source, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/feat_remote_run_actor_allow_list/task_<K>_plan.md`. They are ordered bottom-up by ship sequence, with the catch-all layer (`general`, path `.`) last.

1. [ ] **Task 1** — Declare `HARNESS_RUN_ACTORS` and the list's semantics once in `cli/src/remote/githubActions.ts` _(layer: cli)_ _(points: 10)_
2. [ ] **Task 2** — Check the allow-list in `remote-run.sh` → `authorise_actor` and the trigger, a `repository_dispatch` sender included _(layer: cli)_ _(points: 20)_
3. [ ] **Task 3** — Name the allow-list in the control, close and collect refusals, and test each path against it _(layer: cli)_ _(points: 12)_
4. [ ] **Task 4** — Gate `harness-run.yml`'s `run` and `collect` jobs on `github.triggering_actor` _(layer: cli)_ _(points: 18)_
5. [ ] **Task 5** — Pass `HARNESS_RUN_ACTORS` into `harness-trigger.yml` and `harness-control.yml` _(layer: cli)_ _(points: 10)_
6. [ ] **Task 6** — `doctor --check-github` names the effective list and warns on `*` with a subscription token _(layer: cli)_ _(points: 18)_
7. [ ] **Task 7** — `doctor --check-github` warns when a subscription token is set and writers exist beyond the list _(layer: cli)_ _(points: 15)_
8. [ ] **Task 8** — `doctor` warns about a workflow copy written before the allow-list, naming what it does and the route _(layer: cli)_ _(points: 15)_
9. [ ] **Task 9** — `init` states what an unset `HARNESS_RUN_ACTORS` means, at first setup and on an upgrade _(layer: cli)_ _(points: 10)_
10. [ ] **Task 10** — Describe the allow-list in `docs/github-issue-trigger.md` and `docs/github-run-control.md` _(layer: general)_ _(points: 20)_
11. [ ] **Task 11** — Document the variable, the two credential set-ups, the residual risk and the upgrade in `docs/remote-execution.md` _(layer: general)_ _(points: 20)_
12. [ ] **Task 12** — Bring `docs/cli.md`'s `remote-execution`, `remote-github` and `forge` descriptions up to the new findings, and qualify `README.md`'s GitHub route _(layer: general)_ _(points: 12)_
13. [ ] **Task 13** — Add Gate 12 observation (xv) for the allow-list, and set the list in the run-control setup _(layer: general)_ _(points: 15)_

## Scope register

Several of this plan's targets are durable corpus text (`docs/`), so the corpus targets are enumerated here. The code targets (`cli/src`, `cli/templates`, `cli/test`) are not registered.

**Scope predicate**, quoted verbatim from the task prompt: *"`docs/github-run-control.md` → `## 6. Who can act, and pull requests from forks`, and `docs/github-issue-trigger.md` → `## 3. Who can start a run`: describe the list, its default and `*`."* — together with item 8's `docs/remote-execution.md` sites and item 9's *"Say in the docs … what an adopter's old workflow copy does until they upgrade."* Read as a property, the predicate covers every passage of the project's prose that states who may start, command, answer or review a run, or which credential set-up a repository uses.

**Derivation entry 1: who-may-act prose (command).** Re-run verbatim from the checkout root:
`git grep -n -e HARNESS_TRIGGER_ALLOWED_BOTS -e authorise_actor -e 'write access' -e 'admin. or .write' -e 'write. or .admin' -e 'write or admin' -e 'Who can start' -e 'Who can act' -e 'Run workflow' -e 'team member' -- docs README.md ARCHITECTURE.md cli/README.md plugin/README.md plugin/docs`

The `Run workflow` and `team member` patterns reach passages that state who may act in other words, most of them about the **Run workflow** form, which the run job's gate now screens. The command also reaches passages that state nothing about who may act; each of those is a `no-change` row with its reason.

**Derivation entry 2: the prompt's named sites (procedure).**
- **Artifact:** `harness-runs/task_prompts/feat_remote_run_actor_allow_list_task_prompt.md`.
- **Traversal:** `## The goal` items 8 and 9, in order, then each bullet under them.
- **Decision rule:** every document heading such a bullet names is a site. Item 9's *"Say in the docs"* reaches `docs/remote-execution.md` → `### Upgrading`, the section that states each re-render route.

**Derivation entry 3: owed by a lesson (procedure).**
- **First step, runnable:** `grep -n -e '^## ' -e '^- ' harness-runs/lessons.md`.
- **Artifact:** that ledger.
- **Traversal:** its topic headings in file order, then each rule under them.
- **Decision rule:** a rule reaches a site when a decision in this plan is the kind the rule governs. The site is the document the rule says must carry the evidence or the command.

**Closure invariant:** every site any of the three entries reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/github-issue-trigger.md` → `## Turning it on, in short`, step 5 (*"Optionally, rename the label or admit bots."*) | — | entry 1, `HARNESS_TRIGGER_ALLOWED_BOTS` | `change` | Task 10 |
| 2 | `docs/github-issue-trigger.md` → `## Turning it on, in short`, step 6 (*"Check the setup."*) | — | entry 1, `HARNESS_TRIGGER_ALLOWED_BOTS` | `change` | Task 10 |
| 3 | `docs/github-issue-trigger.md` → `## 1. What happens when an issue is labelled`, the refusal list (*"the labeller is a `User` whose repository permission is not"*) | — | entry 1, `HARNESS_TRIGGER_ALLOWED_BOTS`, `admin. or .write` | `change` | Task 10 |
| 4 | `docs/github-issue-trigger.md` → `## 3. Who can start a run` | — | entry 1, `Who can start`; entry 2, item 8 | `change` | Task 10 |
| 5 | `docs/github-issue-trigger.md` → `## 7. What is not verified here`, row *"The permission API answers `read` for a triage user"* | — | entry 1, `HARNESS_TRIGGER_ALLOWED_BOTS` | `no-change` | still true: the permission call still comes before the list, so a triage user is still refused by it |
| 6 | `docs/github-run-control.md` → `## The GitHub entry point`, the opening paragraph (*"anyone with write access can start and work runs"*) and setup list step 8 | — | entry 1, `with write access` | `change` | Task 10 |
| 7 | `docs/github-run-control.md` → `## The GitHub entry point`, *"2. What a team member with write access then does"* | — | entry 1, `with write access` | `change` | Task 10 |
| 8 | `docs/github-run-control.md` → `## 1. Commands in a comment`, *"Who and where."* | — | entry 1, `HARNESS_TRIGGER_ALLOWED_BOTS`, `admin. or .write` | `change` | Task 10 |
| 9 | `docs/github-run-control.md` → `## 4. The draft pull request` (*"Another reviewer with write access can still request changes"*, *"anyone with write access can request changes"*) | — | entry 1, `with write access` | `change` | Task 10 |
| 10 | `docs/github-run-control.md` → `## 6. Who can act, and pull requests from forks`, including *"Closing and deleting."* | — | entry 1, `Who can act`; entry 2, item 8 | `change` | Task 10 |
| 11 | `docs/remote-execution.md` → `## 3.` → `### The kill switch and stopping`, *"Closing or deleting stops a run too."* | — | entry 1, `HARNESS_TRIGGER_ALLOWED_BOTS` (it cites run-control §6) | `no-change` | it points at `github-run-control.md` §6 for *"Which actor counts"*, and Task 10 updates that section |
| 12 | `docs/remote-execution.md` → `## 7. Turning it on`, *"4. Set a credential secret."* | — | entry 2, item 8 | `change` | Task 11 |
| 13 | `docs/remote-execution.md` → `### Every secret and variable`, the `HARNESS_TRIGGER_ALLOWED_BOTS` row | — | entry 1, `HARNESS_TRIGGER_ALLOWED_BOTS`; entry 2, item 8 | `change` | Task 11 (the new `HARNESS_RUN_ACTORS` row goes beside it) |
| 14 | `docs/remote-execution.md` → `### Upgrading` | — | entry 2, item 9 | `change` | Task 11 |
| 15 | `docs/remote-execution.md` → `## 9. Credentials and billing` | — | entry 2, item 8 | `change` | Task 11 |
| 16 | `docs/remote-execution.md` → `## 11. Security`, the issue-trigger bullet (*"only a person with `write` or `admin` permission, or a listed bot"*) | — | entry 1, `write. or .admin` | `change` | Task 11 |
| 17 | `docs/remote-execution.md` → `## 11. Security`, *"Pull requests from forks."* | — | entry 1, `Who can act` (its link text cites run-control §6) | `no-change` | fork handling is unchanged by the list |
| 18 | `docs/remote-execution.md` → `## 6. What is not verified here` (a new row: the two unobserved dispatch identities, and `github.event.repository.owner.type` on a dispatch) | — | entry 3, *"A figure measured under a test stub … never justifies a design decision"* | `change` | Task 11 |
| 19 | `docs/cli.md` → the `doctor` checks bullet *"`remote-execution` and `remote-github` both pass where `execution.target` is `local` or absent"*, and the `forge` bullet after it | — | entry 1, `HARNESS_TRIGGER_ALLOWED_BOTS` | `change` | Task 12 |
| 20 | `docs/development.md` → Gate 12 observation (xiii), *"From another device, as a person with write access, open an issue and apply the trigger label"* | — | entry 1, `with write access` | `change` | Task 13 |
| 21 | `docs/development.md` → Gate 12 observation (xiii), leg (b), *"A labeller without write access."* | — | entry 1, `with write access` | `no-change` | its expected refusal (*"a refusal comment naming write access"*) still holds: the permission call comes before the list |
| 22 | `docs/development.md` → Gate 12 observation (xiv), *"Run every leg below from another device, as a person with write access"* | — | entry 1, `with write access` | `change` | Task 13 (the reviewing-account paragraph is row 38) |
| 23 | `docs/development.md` → Gate 12, a new observation (xv) after (xiv) | — | entry 3, the same lesson as row 18 | `change` | Task 13 |
| 24 | `docs/github-integration-research.md`, every hit (T1–T4, C2, S-series findings and their evidence lines) | — | entry 1, several patterns | `no-change` | a research record of what was measured and retrieved on its date, not a statement of current behaviour |
| 25 | `docs/team-accounts-research.md`, every hit (`## Summary`, G7, §5's repository facts and options, §7) | — | entry 1, several patterns | `no-change` | a research record; its §7 open bullet on the continuation and the poller is settled by Gate 12 (xv) when that round is run and recorded under the gate, not by editing the research |
| 26 | `README.md` → `### Working from GitHub`, *"a team member who uses only this route needs nothing local: no clone, no plugin and no `init`"* | — | entry 1, `team member` | `change` | Task 12 |
| 27 | `docs/github-issue-trigger.md` → `## Turning it on, in short`, step 4 (*"Creating a label needs write access (T1)."*) | — | entry 1, `write access` | `no-change` | it states who may create the label, not who may act on a run |
| 28 | `docs/github-issue-trigger.md` → `## 4. What the labeller vouches for` (*"may have been written by someone without write access"*) | — | entry 1, `write access` | `no-change` | it is about the issue's author, whose text becomes the task; who may apply the label is §3's (row 4) |
| 29 | `docs/github-issue-trigger.md` → `## 5. Working the run`, *"**Without one**, … the **Run workflow** form is still available"* | — | entry 1, `Run workflow` | `change` | Task 10 |
| 30 | `docs/github-issue-trigger.md` → `## 7. What is not verified here`, row *"A label an issue form adds at creation raises `labeled`, and with which `sender`"* | — | entry 1, `write access` | `no-change` | its fallback still holds: the permission check still refuses a sender without write access, before the list is read |
| 31 | `docs/github-run-control.md` → the `**Who reads this:**` line (*"a maintainer or team member who works runs from GitHub"*) | — | entry 1, `team member` | `no-change` | it names the document's readers, not who may act |
| 32 | `docs/github-run-control.md` → `## 7. Working a run from both sides`, *"**The Run workflow form stays the fallback.** A maintainer with no local setup can still work any remote run"* | — | entry 1, `Run workflow` | `change` | Task 10 |
| 33 | `docs/remote-execution.md` → `## 1.` → `### Working a run from GitHub alone`, its two opening paragraphs (*"a maintainer with no local setup … works a run"*, *"The fallback, which works with or without `forge`, is the **Run workflow** form"*) | — | entry 1, `Run workflow` | `change` | Task 11 |
| 34 | `docs/remote-execution.md` → `### Working a run from GitHub alone`, the *"Answering a park."* bullet (*"Then **Run workflow** with `action` `run`"*) | — | entry 1, `Run workflow` | `no-change` | a how-to step for the person the section's opening (row 33) already qualifies; the form's inputs are unchanged |
| 35 | `docs/remote-execution.md` → `## 3.` → `### Notifications`, the `parked` detail (*"then Run workflow on harness-run.yml from the branch"*) | — | entry 1, `Run workflow` | `no-change` | it quotes the job's notification text, which this branch does not change, addressed to the maintainer who receives the notification |
| 36 | `docs/remote-execution.md` → `## 8.` → `### Setting up a self-hosted runner` (*"write access to npm's global prefix"*) | — | entry 1, `write access` | `no-change` | filesystem write access on a runner, not repository permission |
| 37 | `docs/remote-execution.md` → `## 11. Security`, the self-hosted-runner bullet (*"write access, `schedule`, and …"*) | — | entry 1, `write access` | `no-change` | it states what persists on a runner and which events reach it, which the list does not change; the list's own bullet is Task 11's (row 16) |
| 38 | `docs/development.md` → Gate 12 observation (xiv), leg (e)'s reviewing-account paragraph (*"The reviewing account, which submits every review in legs (e) and (f), must have write access"*) | — | entry 1, `write access` | `change` | Task 13 |
| 39 | `docs/development.md` → Gate 12 observation (xiv), leg (c) (*"with no *Run workflow* recovery"*) | — | entry 1, `Run workflow` | `no-change` | it describes the run's own continuation, not an actor |
| 40 | `docs/development.md` → Gate 12 observation (xiv), leg (f) (*"A commenter without write access is not runnable on a scratch repository owned by a personal account"*) | — | entry 1, `write access` | `no-change` | still true: the permission check still runs before the list; a writer the list does not name is (xv) leg (d)'s (row 23) |
| 41 | `docs/development.md` → `## 5. Verifying a change`, the Gate 12 round records (e.g. *"Round 6 — 2026-10-02"*'s leg (a) result) | — | entry 1, `write access` | `no-change` | records of what past rounds observed, not statements of current behaviour |
| 42 | `docs/analyze.md` → `## 3. What it may write` (*"Any write under a repository's own `.claude/` tree"*) | — | entry 1, `write access` | `no-change` | the `.claude/` write wall for `/autonomous-sdlc-harness:harness-analyze`, unrelated to who may act on a run |
| 43 | `docs/guard-verification.md` → `### 2.4 Disclosed residuals, re-confirmed`, row a and *"The bound, stated as a claim a row can falsify"* | — | entry 1, `write access` | `no-change` | in-repository write access as a guard residual, unrelated to who may act on a run |
| 44 | `plugin/docs/AUTONOMOUS_FLOW.md` → the *"Forge coupling is GitHub-only."* bullet (*"the **Run workflow** form on GitHub stays as a fallback"*) | — | entry 1, `Run workflow` | `no-change` | it names the form as a fallback route without stating who may use it; who may is `docs/github-run-control.md` §6 and §7's (rows 10 and 32) |
