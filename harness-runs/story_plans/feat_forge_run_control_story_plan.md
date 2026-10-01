# Story: Work a GitHub-side run from GitHub — comment commands, review rounds, draft pull requests and state labels

## Context

This branch completes the **forge coupling** `forge` was declared for (`docs/config.md` → `## 5. Key reference`, the `forge` row): *"an issue-label trigger, draft-pull-request output and comment-based park-and-ask"*. It is the last of three steps. `feat_remote_execution_github_actions` made a run execute and supervise itself in a GitHub Actions job (`docs/remote-execution.md` → `## 1. The lifecycle of a remote run`, `## 5. The seam, and what stays open`), and `feat_forge_run_triggers` made labelling an issue start one (`docs/github-issue-trigger.md`). After this branch, a maintainer who started a run from GitHub finishes it there: they answer a park, pause, resume or stop the run with a comment, start a user-review round with a review that requests changes, follow the run through lifecycle comments and state labels, and receive a draft pull request when it is ready for review. GitHub becomes a second entry point **beside** the local one, never instead of it: the one-time setup stays local, and a team member can work runs from GitHub with nothing installed, from their local setup, or both. The GitHub facts every task rests on are `docs/github-integration-research.md`'s (S3, S4, S5, S6, T1–T4, C1–C4), cited and not re-verified: an unattended run cannot fetch a web page.

**The design, decided once here so that no task re-decides it.**

- **Everything GitHub-side lives in `cli/templates/scripts/remote-run.sh`, as new verbs beside `trigger`.** `report` posts a lifecycle comment and sets the state label (Tasks 3, 4). `deliver` opens the draft pull request after a completed run and reports `completed` (Task 6). `control` is the comment and review adapter, the twin of `trigger` (Tasks 10–13). Each dispatch still goes through the verbs that already compose `harness-run.yml`'s inputs — `dispatch`, `pause`, `stop`, `review` — run as child processes, exactly as `trigger` runs `start`, so `verb_dispatch` stays the one producer of the input wire. No new `workflow_dispatch` input is added.
- **Every name has one owner, `cli/src/remote/githubActions.ts`** (Task 1), with byte-for-byte shell and YAML mirrors declared in their own headers: the workflow `harness-control.yml`, the command handle `@sdlc-harness`, the verbs `answer`, `pause`, `resume`, `stop` and `clear`, the hidden comment marker that opens `<!-- sdlc-harness`, the review state `changes_requested`, and the six state labels `sdlc-harness: running`, `sdlc-harness: parked`, `sdlc-harness: paused`, `sdlc-harness: done`, `sdlc-harness: failed` and `sdlc-harness: stopped`.
- **A command** is the handle as the first word of the comment's first line, matched case-insensitively, then a verb: `@sdlc-harness <verb> [args]` (decided by the maintainer, 2026-10-01). A comment carrying the marker is never a command, whoever wrote it. Every accepted command gets a reply comment naming the actor, the command and what was done. Every rejected one gets a reply giving the reason, except a comment the harness posted itself, which is ignored silently. An unknown verb gets a reply listing the five.
- **A command or review is acted on only when** the `forge`/`execution.target` gate holds and `HARNESS_REMOTE_STOP` is unset, and the actor passes the trigger's own check, factored into a shared function (Task 5): `ghost` refused, a non-`User` refused unless listed in `HARNESS_TRIGGER_ALLOWED_BOTS`, and a `User` must answer `admin` or `write` from the collaborator-permission API (T3). A pull request from a fork never triggers anything. `harness-control.yml`'s `if:` skips a fork's review, whose token is read-only (C2), and `control` refuses a fork's pull request on an `issue_comment`, which does carry secrets (C2). `pull_request_target` is never used.
- **Which branch a command acts on.** On a pull request, its head branch. On an issue, the branch named by the newest `started` marker the trigger job (`github-actions[bot]`) posted on that issue. **A pull request is the harness's when its head branch is in this repository, is unprotected, and its tip carries the flow-progress ledger `<state_dir>/flow_progress/<branch>_progress.md`**, whoever opened it and whether or not it is a draft (the *No opt-in step* decision). A review round additionally needs the story index `<state_dir>/story_plans/<branch>_story_plan.md`, because the round's statistics step reads it, and a review on a branch without it is refused with a reply.
- **A review with state `changes_requested`** (C1) on such a pull request becomes the next `<branch>_review[_<n>].md` round through `remote-run.sh review` (Task 9), which already places, commits as `chore: add user review for <branch>`, pushes and dispatches `engine: user_review` and computes the round with the anchored pattern of `/autonomous-sdlc-harness:branch-user-review` step 3. `approved` and `commented` reviews start nothing, and draft status plays no part. **The round carries** the review's body verbatim and every inline comment of the submitted review, plus the reviewer's own inline comments left since the previous round's commit, so comments left while a round is running reach the next one. Other people's comments are not collected, because only the submitting reviewer has vouched for them. Each comment is carried with its file, its line (or its original line when outdated), its commit and its `diff_hunk`, so `user-review-fix-plan-writer` can re-locate it (Task 20).
- **A run in flight.** The authority is GitHub's run list, which `review` and `fetch` already read (`remote_state`). The state labels are a view of it that the harness overwrites, never a second authority. A review, an answer, a resume or a clear arriving while a job of the branch is queued or running is **refused with a reply**, naming the state and saying to send it again once it finishes, so nothing is queued behind a run and lost to a pending-run cancellation. The local side keeps its own notice: `/autonomous-sdlc-harness:branch-user-review` already refuses with `remote-run.sh review`'s message.
- **A park over comments.** Each open `question_<n>.md` is posted whole as one comment, capped in bytes below GitHub's measured 262,144-byte limit (S6) with a pointer to the `harness-state` artifact when cut. An answer is `@sdlc-harness answer <n>`, with `<n>` optional when exactly one question is open; the answer text is the lines below the first one, written verbatim as untrusted task data. Each answer is sent as its own `resume: answer` dispatch with one entry. A park left partly answered is one the job already stops as parked, with the answer carried in its bundle, so the next answer completes the set. A payload over `REMOTE_INPUT_PAYLOAD_MAX` (S5) is refused with a reply naming the size and the limit. On a `park_loop` run, `answer` is refused and `@sdlc-harness clear` releases the hold, as `/autonomous-sdlc-harness:branch-resume` does locally.
- **Lifecycle comments** come from `report`, called by the watcher's job-mode `notify()` (Task 7) and by `remote-run.sh`'s own `notify()` in `continue` and `poll` (Task 8). `autonomous-notify.sh` is unchanged, and a chained `budget` continuation stays silent because job mode never notifies it. A comment goes to the run's recognised open pull request, else to the issue it started from, else nowhere. Each one names the next action as a GitHub action. Labels go on both the issue and the pull request, and each transition removes every other state label. The trigger sets the first one, `sdlc-harness: running`, in the step where it removes the trigger label (Task 5). Labels are created on first use.
- **The draft pull request** is opened by a step of `harness-run.yml`, `deliver`, after the branch is pushed, never by the flow. `push-branch.sh` still opens none, and the flow never merges. It opens only for a run that executes on GitHub with `forge` `github`; a locally executed run gets none, so nothing new reaches a local-only adopter. The token is `HARNESS_GIT_TOKEN` when that secret is set, so the adopter's CI runs on the pull request without an approval click (S3); otherwise the job's own token, which needs GitHub's *Allow GitHub Actions to create and approve pull requests* setting, off by default (S4, C3). A failed draft is retried once as a ready pull request, since drafts depend on the plan (C3). The body names the issue as a plain mention, `Started from #<n>`, not a closing keyword: the flow does not own the issue's lifecycle. The issue is read from the task prompt's provenance line on the branch; the pull request is looked up from the branch at post time.
- **The default trigger label becomes `sdlc-harness`** (decided by the maintainer, 2026-10-01; Task 2). `HARNESS_TRIGGER_LABEL` still overrides it. A repository wired by the previous release keeps `harness` until it re-renders `harness-trigger.yml` and the scripts with `init --force`: the new script also accepts the legacy `harness` whenever the workflow passes no label, which only the old workflow does, and the new workflow always passes one. `doctor --check-github` reads the label the committed workflow falls back to, checks that label exists, and notes a legacy fallback together with its upgrade route (Task 18).
- **A locally executed branch reviewed on GitHub.** A pull request a person opened for it is recognised, and its round runs through `harness-run.yml`, because a GitHub-started run always does (`review --allow-no-run`, Task 9). The local record keeps `execution: local` and is not touched, so its working copy falls behind `origin/<branch>` until the maintainer fast-forwards it. The docs state this (Task 25).
- **The Actions-tab Run workflow form stays documented as the fallback** (`docs/remote-execution.md` → `### Working a run from GitHub alone`, whose heading `plugin/commands/branch-resume.md` cites and which keeps its text).

**Shared files are edited in readiness order, each task only in the sections its own file names.** `cli/templates/scripts/remote-run.sh` is edited by Tasks 1–6 and 8–13. `cli/src/remote/githubActions.ts` is edited by Tasks 1, 2 and 18. `cli/test/workflow-templates.test.mjs` by Tasks 2, 14 and 15, and `cli/test/doctor.test.mjs` by Tasks 2, 17 and 18. `docs/remote-execution.md` by Tasks 27 and 28, and `docs/github-run-control.md` by Tasks 23, 24 and 25. No task rewrites a section an earlier one added; a later task that extends one names it under its own **Depends on:**.

**Top risks:** The likeliest failure is a comment or review acting for someone it should not, on a repository where anyone can comment and the job holds secrets. Tasks 10 and 13 drive every refusal arm — a fork, `ghost`, an unlisted bot, a `read` answer, a failed permission call, an unrecognised branch, and the harness's own marker — and assert that each one dispatches nothing. The second is the harness triggering itself, or a lost answer or review. Every harness comment carries the marker (Tasks 3, 5), and `harness-control.yml`'s `if:` excludes it before a runner starts (Task 15). Anything arriving while a job is in flight is refused with a reply rather than queued (Tasks 12, 13). The third is the label rename or a version skew breaking a repository that already works. Task 2 keeps the legacy label working for an un-re-rendered workflow, Task 14 makes the new `deliver` step `continue-on-error`, so an older script cannot fail a finished job, and Task 18 names the mismatch.

**Manual setup required:**

- **Gate 12 observation (xiv), run by hand after this branch is released.** Task 31 writes the procedure, and no implementing task depends on it. It runs against the standing scratch repository `firu-daniel/harness-gate12`, reset to its seed, with `forge` `github` and `execution.target` `github-actions` at the released version. The four workflows must be committed and pushed with the `workflow` scope, the label `sdlc-harness` created, one credential secret set, and *Allow GitHub Actions to create and approve pull requests* switched on (or `HARNESS_GIT_TOKEN` set). It is the only way acceptances 1–6 are observed against GitHub itself; every automated case drives a `gh` stub.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. Only the committing role flips a marker to `[x]`, as that task's commit lands: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. An implementer never changes a marker here, and never edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as the sub-step bullets inside a per-task file, are informational only; the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/feat_forge_run_control/task_<K>_plan.md`. The entries are ordered bottom-up by ship sequence in the configured layer order, `cli`, then `plugin`, then the catch-all `general`, which ships last.

1. [x] **Task 1** — Declare the run-control names and their shell mirrors _(layer: cli)_ _(points: 10)_
2. [x] **Task 2** — Make `sdlc-harness` the default trigger label, keeping `harness` working until a re-render _(layer: cli)_ _(points: 15)_
3. [x] **Task 3** — Add the forge-surface helpers and `remote-run.sh report` for lifecycle comments and state labels _(layer: cli)_ _(points: 20)_
4. [x] **Task 4** — Post a park's question files as comments from `report parked` _(layer: cli)_ _(points: 10)_
5. [x] **Task 5** — Mark the trigger's comments, set the first state label, and share the actor check _(layer: cli)_ _(points: 10)_
6. [x] **Task 6** — Add `remote-run.sh deliver`: the draft pull request and the `completed` report _(layer: cli)_ _(points: 20)_
7. [x] **Task 7** — Report every job-mode lifecycle event from the watcher _(layer: cli)_ _(points: 8)_
8. [x] **Task 8** — Report `remote-run.sh`'s own notifications and a stop on GitHub _(layer: cli)_ _(points: 12)_
9. [x] **Task 9** — Let `remote-run.sh review` take a GitHub-started round and report it _(layer: cli)_ _(points: 12)_
10. [x] **Task 10** — Add `remote-run.sh control` for comment commands, with `pause` and `stop` _(layer: cli)_ _(points: 20)_
11. [x] **Task 11** — Add the `resume` and `clear` comment commands _(layer: cli)_ _(points: 10)_
12. [x] **Task 12** — Add the `answer` comment command _(layer: cli)_ _(points: 15)_
13. [x] **Task 13** — Turn a review requesting changes into the next user-review round _(layer: cli)_ _(points: 20)_
14. [x] **Task 14** — Give the run and resume workflows the report permissions and the `deliver` step _(layer: cli)_ _(points: 10)_
15. [x] **Task 15** — Ship the `harness-control.yml` workflow template _(layer: cli)_ _(points: 15)_
16. [x] **Task 16** — Write the control workflow from `init` and print its GitHub steps _(layer: cli)_ _(points: 15)_
17. [x] **Task 17** — Grade the control workflow in `doctor`'s `forge` check _(layer: cli)_ _(points: 12)_
18. [x] **Task 18** — Ask GitHub about the control workflow, the pull-request setting and the effective trigger label _(layer: cli)_ _(points: 15)_
19. [x] **Task 19** — State the pull-request-review round in the `user_reviews/` template README _(layer: cli)_ _(points: 5)_
20. [x] **Task 20** — Teach the user-review fix-plan writer to re-locate a pull-request review comment _(layer: plugin)_ _(points: 8)_
21. [x] **Task 21** — Restate the forge coupling and the pull-request boundary in the plugin's flow documents _(layer: plugin)_ _(points: 12)_
22. [x] **Task 22** — Restate `forge` in the schema, `ARCHITECTURE.md` and the `docs/config.md` row _(layer: general)_ _(points: 10)_
23. [x] **Task 23** — Write `docs/github-run-control.md`: comment commands and review rounds _(layer: general)_ _(points: 20)_
24. [x] **Task 24** — Document parks over comments, the draft pull request, lifecycle comments and state labels _(layer: general)_ _(points: 20)_
25. [ ] **Task 25** — Document security, both sides, what is not verified, and the GitHub entry point _(layer: general)_ _(points: 20)_
26. [ ] **Task 26** — Bring `docs/github-issue-trigger.md` level with the new label and run control _(layer: general)_ _(points: 15)_
27. [ ] **Task 27** — Bring `docs/remote-execution.md` §1, §3 and §5 level with run control _(layer: general)_ _(points: 15)_
28. [ ] **Task 28** — Bring `docs/remote-execution.md` §7 and §11 level with run control _(layer: general)_ _(points: 12)_
29. [ ] **Task 29** — Document the new verbs, the control workflow and the doctor checks in `docs/cli.md` and `docs/watcher.md` _(layer: general)_ _(points: 12)_
30. [ ] **Task 30** — Open `README.md` and `llms.txt` with both entry points _(layer: general)_ _(points: 15)_
31. [ ] **Task 31** — Close the forge debt in `ROADMAP.md` and `docs/development.md`, and add Gate 12 observation (xiv) _(layer: general)_ _(points: 15)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"`forge`'s row states that the whole coupling is delivered, or names what is still missing."* Three further clauses are quoted from the prompt: *"No doc should read the drop as \"every team member needs a local install\", and no doc should say the team moves to GitHub after the setup either."*; *"With no `HARNESS_TRIGGER_LABEL` set, labelling an issue `sdlc-harness` starts a run. The docs state the upgrade path for a repository already using `harness`."*; and *"Whether the Actions-tab **Run workflow** route that branch documented stays documented as a fallback. It should."*

**Derivation entry A — durable text stating the forge coupling's status (command).** Run from the repository root, re-run verbatim:

```
git grep -n -i -E 'park-and-ask over|comment-based (park|clarification)|comment park-and-ask|draft.pull.request|feat_forge_run_control|forge coupling|still to come|trigger part|its (issue )?trigger landed' -- '*.md' 'schemas/*.json' ':!harness-runs' ':!examples' ':!docs/github-integration-research.md'
```

**Derivation entry B — durable text stating that no pull request is opened (command).** Run from the repository root, re-run verbatim:

```
git grep -n -i -E 'no pull request|opens no pull|pull request is opened|still a pushed branch|ends at a pushed branch|pull request out of band|never opens or pushes a pull request|or opens a pull request' -- '*.md' 'schemas/*.json' ':!harness-runs' ':!examples' ':!docs/github-integration-research.md'
```

**Derivation entry C — durable text spelling the default trigger label (command).** Run from the repository root, re-run verbatim:

```
git grep -n -E 'label (create|delete) harness|add-label harness|`harness` when unset|`harness` unless|default `harness`|\| `harness` \||label `harness`' -- '*.md' ':!harness-runs' ':!examples' ':!docs/github-integration-research.md'
```

**Derivation entry D — durable text stating the GitHub-only route (command).** Run from the repository root, re-run verbatim:

```
git grep -n -E 'from GitHub alone|Run workflow\*\* form' -- '*.md' ':!harness-runs' ':!examples' ':!docs/github-integration-research.md'
```

The three exclusions are each a record rather than a present-tense claim. `harness-runs/` is this repository's own run artifacts, which describe a run rather than the project (`.claude/context/conventions.md` → `## Documents of record`). `examples/` is a frozen capture. `docs/github-integration-research.md` is dated research whose answers are cited, never restated (its own `**Who reads this:**`).

**Derivation entry E — this plan's own durable-corpus targets that no command reaches (procedure).** **Artifact:** the per-task files under `harness-runs/task_plans/feat_forge_run_control/`. **Traversal:** each file in readiness order, then its `### Targets` list top to bottom, then the document sections its `**Work:**` bullets edit, in bullet order. **Decision rule:** a target is reached when it is durable corpus text — a `docs/` or root prose document, `llms.txt`, a plugin agent or flow document, an adopter-facing template README or a schema description — and no row from entries A–D already names that file and section.

**Derivation entry F — rows of the standing lessons ledger (procedure).** **First step, runnable:** `grep -n -E '^## |^- ' harness-runs/lessons.md`. **Artifact:** that standing ledger. **Traversal:** its topic headings in file order, then the one-line rules under each. **Decision rule:** a rule is reached when the surface it governs is among this plan's targets: an adopter-facing command or name in a document, an unattended retry, state in an expiring artifact, a branch-scoped command, an action on remote state, a temporary working copy, a measured figure, or a procedure that measures one, in a document of record; or the rule is one a per-task file cites as a constraint.

**Closure invariant:** every site any of entries A–F reaches appears as a row below. No site has a mirrored counterpart, so `Copy` is `—` throughout. A conventions-document site is `no-change` without exception, and is raised in the return's `## Corpus staleness`.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `.claude/context/conventions.md` → `## Not determined`, the bullet "What the configuration key `forge` means beyond the issue trigger is not settled" | — | A | `no-change` | A conventions document is never a task's target. This branch lands the two parts that bullet waits on, so it is raised as a `stale-rule` entry in `## Corpus staleness` |
| 2 | `ARCHITECTURE.md` → `## 7.`, the bullet "**No forge coupling beyond the issue trigger.**" | — | A | `change` | Task 22 |
| 3 | `ARCHITECTURE.md` → `## 8.`, the paragraph "**`forge` — the same pattern, declared missing one part and since completed.**" | — | A | `change` | Task 22 |
| 3a | `ARCHITECTURE.md` → `## 8.`, the paragraph opening "**Applied to the engine seam, that rule decides this release.**" ("the outcome `forge` had until its issue trigger landed") | — | A | `no-change` | A dated statement, still true |
| 3b | `ARCHITECTURE.md` → `## 8.`, the paragraph opening "**`design.source` — the same outcome, declared with the rule already written.**" ("as it was with `forge` until its issue trigger landed") | — | A | `no-change` | A dated statement, still true |
| 3c | `ARCHITECTURE.md` → `## 8.`, the paragraph opening "**This declaration has the shape the rule above refuses**", the sentence "For `forge` that outcome has since been paid for the key's trigger part" | — | A | `change` | Task 22: restated as paid for the whole coupling |
| 4 | `ROADMAP.md` → the *Cloud / CI execution* row, "**Still open:** starting and steering a run from pull requests and comments" | — | A, B | `change` | Task 31 |
| 5 | `docs/config.md` → `## 5. Key reference`, the `forge` row ("**Still waiting:**") | — | A, B | `change` | Task 22 |
| 6 | `docs/development.md` → `## 6.`, "The second was **the reader for the `forge` configuration key**" ("The debt that remains is the coupling's other two parts") | — | A, B | `change` | Task 31 |
| 6a | `docs/development.md` → `## 6.`, the paragraph opening "**A second key is now in the state `forge` was in before its trigger landed**" | — | A | `no-change` | A dated statement, still true |
| 7 | `docs/github-issue-trigger.md` → `## 8. What this does not do yet` ("Each belongs to `feat_forge_run_control`") | — | A | `change` | Task 26 |
| 8 | `docs/github-issue-trigger.md` → `## 8.`, the bullet "park-and-ask over issue or pull-request comments;" | — | A | `change` | Task 26 |
| 9 | `docs/github-issue-trigger.md` → `## 8.`, the bullet "draft-pull-request output when a run completes." | — | A | `change` | Task 26 |
| 10 | `docs/remote-execution.md` → `## 5.`, "**What stays open**: starting a run from a pull request or a comment" | — | A, D | `change` | Task 27 |
| 11 | `plugin/docs/AUTONOMOUS_FLOW.md` → `## Out of scope in this release`, "**Forge coupling is partial.**" | — | A, D | `change` | Task 21 |
| 12 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → "**\"What would you do differently, or what is next?\"**" ("a partial forge coupling") | — | A, D | `change` | Task 21 |
| 13 | `README.md` → `### The shape of the system`, "**Forge-agnostic, which means the last step is yours.**" | — | B | `change` | Task 30 |
| 14 | `docs/cli.md` → the `remote` check bullet, "A run ends at a pushed branch only when there is somewhere to push it" | — | B | `no-change` | It states when a push can land, which is unchanged; the draft pull request follows the push and does not change what the `remote` check grades |
| 15 | `docs/remote-execution.md` → `## 1.`, step "8. **Done.**" ("No pull request is opened (§5)") | — | B | `change` | Task 27 |
| 16 | `docs/remote-execution.md` → `## 5.`, "**\"Done\" is still a pushed branch.**" | — | B | `change` | Task 27 |
| 17 | `plugin/docs/AUTONOMOUS_FLOW.md` → the opening paragraph, "No entry point merges, pushes to a protected branch, or opens a pull request" | — | B | `change` | Task 21: the flow still opens none, and the sentence gains where the draft pull request comes from |
| 18 | `plugin/docs/AUTONOMOUS_FLOW.md` → `## Output guarantee`, "The operator does the final hands-on review and opens the pull request out of band" | — | B | `change` | Task 21 |
| 19 | `schemas/harness.config.schema.json` → `properties.forge.description` | — | B | `change` | Task 22 |
| 20 | `docs/cli.md` → `## 2.`, the paragraph on the closing report's GitHub steps ("`harness` unless the repository variable `HARNESS_TRIGGER_LABEL` names another") | — | C | `change` | Task 29 |
| 21 | `docs/development.md` → Gate 12 → **Round 5** ("The trigger label `harness` already existed from an earlier probe") | — | C | `no-change` | A dated record of what round 5 ran under CLI 0.5.0; the label it names was the default then |
| 22 | `docs/development.md` → Gate 12 observation (xiii)'s setup, the fenced `gh label create harness` | — | C | `change` | Task 31: the procedure a future round runs |
| 22a | `docs/development.md` → Gate 12 observation (xiii), the fenced `gh issue edit <number> … --add-label harness` | — | C | `change` | Task 31 |
| 22b | `docs/development.md` → Gate 12 → **Teardown.** ("delete the trigger label with `gh label delete harness`") | — | C, E (Task 31) | `change` | Task 31 |
| 23 | `docs/github-issue-trigger.md` → `## Turning it on, in short`, step 4's fenced `gh label create harness` | — | C | `change` | Task 26 |
| 24 | `docs/github-issue-trigger.md` → `## Turning it on, in short`, step "**5. Optionally, rename the label or admit bots.**" ("`harness` when unset") | — | C | `change` | Task 26 |
| 25 | `docs/remote-execution.md` → `### Every secret and variable`, the `HARNESS_TRIGGER_LABEL` row (default `harness`) | — | C | `change` | Task 28 |
| 26 | `docs/github-issue-trigger.md` → `## 5. Working the run`, "**Without one**, a run is worked from GitHub alone" | — | D | `change` | Task 26 |
| 27 | `docs/remote-execution.md` → `## 1.`, the table row for `/autonomous-sdlc-harness:branch-status` ("`status` answers from GitHub alone") | — | D | `no-change` | It describes `status` reading a run with no local record, which is unchanged |
| 28 | `docs/remote-execution.md` → `### Working a run from GitHub alone` (heading) | — | D | `no-change` | The heading is cited by `plugin/commands/branch-resume.md` step 6 and stays byte-identical; its body is row 29 |
| 29 | `docs/remote-execution.md` → `### Working a run from GitHub alone`, "A maintainer with no local setup … works any remote run from the **Run workflow** form" | — | D | `change` | Task 27: comment commands first, the form kept as the fallback |
| 30 | `docs/remote-execution.md` → `## 3.` → `### Notifications` ("For a remote run the same message also names the GitHub route") | — | D | `change` | Task 27 |
| 31 | `plugin/commands/branch-answer.md` → step 8, its sub-step 4 ("Run `bash <scripts_dir>/remote-run.sh dispatch …`") | — | D | `no-change` | The local relay is unchanged (acceptance 7); the match is its own `dispatch` line |
| 32 | `plugin/commands/branch-resume.md` → step 6, "(`docs/remote-execution.md` → `### Working a run from GitHub alone`)" | — | D | `no-change` | It cites the heading row 28 keeps byte-identical |
| 33 | `docs/github-run-control.md` (new) | — | E (Tasks 23–25) | `change` | Tasks 23, 24, 25 |
| 34 | `cli/templates/README.md` → the `github/` row | — | E (Task 16) | `change` | Task 16 |
| 35 | `cli/templates/state-dir/user_reviews/README.md` → its second and third paragraphs (who writes a round, and whether a drop commits it) | — | E (Task 19) | `change` | Task 19 |
| 36 | `plugin/agents/user-review-fix-plan-writer.md` → the reference-forms list (the "**File and line**" bullet), its `## Resolved values` lead, and a new `<scripts_dir>` row in that table | — | E (Task 20) | `change` | Task 20 |
| 37 | `plugin/docs/AUTONOMOUS_FLOW.md` → `## The wiring table`, the *Remote execution* row | — | E (Task 21) | `change` | Task 21 |
| 37a | `plugin/docs/AUTONOMOUS_FLOW.md` → `## Drop a user review (fix cycle)`, `## Answer a clarification (park-and-ask)` and `## Pause / resume a run` (one closing sentence each) | — | E (Task 21) | `change` | Task 21 |
| 38 | `ARCHITECTURE.md` → `## 8.`, the sentence "The corollary is `forge`'s" | — | E (Task 22) | `no-change` | It states the rule and its origin, both still true; this branch satisfies the rule |
| 39 | `docs/github-issue-trigger.md` → `## 1.`, step "6. **The comment and the label.**" ("The comment and the removal are the only writes the trigger makes to the issue") | — | E (Task 26) | `change` | Task 26 |
| 40 | `docs/github-issue-trigger.md` → `## 3. Who can start a run` and `## 7. What is not verified here` | — | E (Task 26) | `change` | Task 26: the shared actor check and the label rows |
| 40a | `docs/github-issue-trigger.md` → the `**Who reads this:**` paragraph; `## Turning it on, in short` steps 2, 3 and 6 and a new paragraph "**A repository already using `harness`.**"; `## 1.` step "2. **The label filter.**" | — | E (Task 26) | `change` | Task 26 |
| 40b | `docs/remote-execution.md` → the opening's cites-rather-than-restates paragraph | — | E (Task 27) | `change` | Task 27 |
| 41 | `docs/remote-execution.md` → `## 7. Turning it on`, step "**2. Write the two workflows.**" | — | E (Task 28) | `change` | Task 28 |
| 42 | `docs/remote-execution.md` → `### Every secret and variable`, the `HARNESS_GIT_TOKEN` and `HARNESS_TRIGGER_ALLOWED_BOTS` rows | — | E (Task 28) | `change` | Task 28 |
| 43 | `docs/remote-execution.md` → `### Upgrading`, "**It does not re-render `harness-trigger.yml`.**" | — | E (Task 28) | `change` | Task 28 |
| 44 | `docs/remote-execution.md` → `## 11. Security` | — | E (Task 28) | `change` | Task 28 |
| 45 | `docs/cli.md` → `## 3. The re-run contract` table and the `forge` / `remote-github` bullets of `## 7.` | — | E (Task 29) | `change` | Task 29 |
| 46 | `docs/watcher.md` → `## 1.` step "8. **One notification per lifecycle event**", and the scripts table's `remote-run.sh` row | — | E (Task 29) | `change` | Task 29 |
| 47 | `README.md` → the opening paragraph, and a new section after `### Adopting it in your own repository` | — | E (Task 30) | `change` | Task 30 |
| 48 | `README.md` → `## Where to read more` | — | E (Task 30) | `change` | Task 30 |
| 49 | `llms.txt` → the summary line and the docs list | — | E (Task 30) | `change` | Task 30 |
| 50 | `docs/development.md` → Gate 12's introduction ("Thirteen observations"), its observation list (a new (xiv)) and "What still owes a first recording" | — | E (Task 31) | `change` | Task 31 |
| 51 | `harness-runs/lessons.md` → *Adopter-facing documentation*, "Every command an adopter is meant to run sits in a fenced block" | — | F | `no-change` | A constraint Tasks 23–31 honour: every `gh`, `npx` and `@sdlc-harness` command a reader types sits in its own fenced block |
| 52 | `harness-runs/lessons.md` → *Adopter-facing documentation*, "Name an adopter-facing surface with the term adopters already arrive with" | — | F | `no-change` | A constraint: the prose says "comment command", "pull request", "review that requests changes" and "label", while wire identifiers (`harness-control.yml`, `HARNESS_TRIGGER_ALLOWED_BOTS`, `changes_requested`) keep their spelling |
| 53 | `harness-runs/lessons.md` → *Unattended control loops*, "Every automatic retry in an unattended path is bounded by a count or a deadline" | — | F | `no-change` | A constraint Task 3 (one label-create retry) and Task 6 (one ready-pull-request retry) honour |
| 54 | `harness-runs/lessons.md` → *Unattended control loops*, "State held only in an expiring store … must be reported plainly as expired" | — | F | `no-change` | A constraint Tasks 11 and 12 honour: an expired bundle is named in the reply, never treated as no park |
| 55 | `harness-runs/lessons.md` → *Remote and branch-scoped operations*, "A command scoped to one branch reads and writes that branch's state only" | — | F | `no-change` | A constraint Tasks 10–13 honour: `control` resolves exactly one branch and touches no other |
| 56 | `harness-runs/lessons.md` → *Remote and branch-scoped operations*, "Act on remote state where it lives" | — | F | `no-change` | A constraint: a GitHub review round is placed by the job on the branch itself through `review`, with no local relay |
| 57 | `harness-runs/lessons.md` → *Remote and branch-scoped operations*, "A script that creates a temporary working copy or branch removes it on every exit path" | — | F | `no-change` | A constraint Task 9 keeps: `review`'s cut copy is removed on every exit, from the job as from a local session |
| 58 | `harness-runs/lessons.md` → *Evidence and measurement*, "A wall-clock figure in a document of record is never one a run measured inside its own session" | — | F | `no-change` | A constraint Task 31 honours: Gate 12 observation (xiv) in `docs/development.md` is a hand-run procedure, and the task records no figure measured inside a session |
| 59 | `harness-runs/lessons.md` → *Evidence and measurement*, "A figure measured under a test stub or a fixture-sized corpus never justifies a design decision" | — | F | `no-change` | A constraint Tasks 25 (`## 8.`) and 31 honour: every automated case drives a `gh` stub, the stub-only behaviours are recorded as not verified, and the branch ships the real-shape gate step, observation (xiv) |
| 60 | `harness-runs/lessons.md` → *Evidence and measurement*, "A feature that ships as \"not yet measured\" ships the seam that will measure it" | — | F | `no-change` | A constraint Tasks 25 and 31 honour: the behaviours `docs/github-run-control.md` → `## 8.` records as not verified ship with the procedure that observes them, Gate 12 observation (xiv); no new configuration key or measurement switch is added |
