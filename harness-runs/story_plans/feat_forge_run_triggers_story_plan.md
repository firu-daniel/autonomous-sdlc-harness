# Story: Start an autonomous run from a labelled GitHub issue

## Context

This branch adds the second entry point to the harness. Today a run starts only when a file lands in `<state_dir>/autonomous_inbox/` and the local watcher picks it up (`docs/watcher.md` → `## 1. The loop in one page`). After this branch, labelling a GitHub issue starts a task run with nothing on the maintainer's machine taking part. A GitHub-side workflow does what the watcher's inbox pass does for a remote drop: it cuts the branch from the default branch, places and commits the task prompt, pushes, and dispatches `harness-run.yml` with `action: run` and `engine: task`. From that dispatch on, the run is exactly the remote run `feat_remote_execution_github_actions` shipped (`docs/remote-execution.md` → `## 1. The lifecycle of a remote run`, `## 5. The seam, and what stays open`). It is the first of two steps: `feat_forge_run_control` follows, adding control from pull requests and comments. So this branch builds the seam that follow-up plugs into and nothing of the follow-up itself. The GitHub facts every task below rests on are `docs/github-integration-research.md`'s (S1, S3, T1–T6), cited and not re-verified: an unattended run cannot fetch a web page.

**The design, decided once here so that no task re-decides it.**

- **The adapter shape: event → (branch, task text) → placement → dispatch.** It lives in `cli/templates/scripts/remote-run.sh` as two new verbs. `trigger` is the event adapter: it reads `GITHUB_EVENT_NAME` and `GITHUB_EVENT_PATH` and handles an `issues` `labeled` event (Task 7) and a `repository_dispatch` event of type `harness-task` (Task 8). `start <branch> --prompt-file <file>` is the platform-neutral half: it does the placement and then the one existing producer of the run workflow's inputs, `dispatch` (Task 6). A Jira rule, or any later adapter, reaches `start` through `repository_dispatch` without touching it.
- **One placement implementation.** The branch cut stays in `create-worktree.sh`, which gains `--no-bootstrap` so a job that runs nothing in the copy does not install the adopter's dependencies (Task 5). The prompt's copy, its commit under `chore: add task prompt for <branch>` and the landed-push check move out of the watcher's inbox pass into `cli/templates/scripts/lib/harness-run-lib.sh` (Task 4). The watcher and `start` both call them, so nothing downstream of the placement knows where the task came from.
- **The trigger workflow** is `.github/workflows/harness-trigger.yml` (Task 12). `init` writes it only when `forge` is `github` **and** `execution.target` is `github-actions` (Task 13). A GitHub-triggered run always executes through `harness-run.yml`, because GitHub cannot reach the maintainer's machine; running one on the maintainer's own hardware is a self-hosted runner named in `HARNESS_RUNNER`. It listens to `issues` of type `labeled` only, never `opened`: labelling at creation raises `labeled` too (T1), so listening to both would start twice. Its job runs only for the trigger label, which the repository variable `HARNESS_TRIGGER_LABEL` names, defaulting to `harness`. The trigger removes that label once it has acted, on success or on refusal, so re-applying it is a deliberate act. The file carries no version pin and calls the scripts on the default branch, so it follows their re-run contract: create-if-absent, replaced by `init --force` after a `.bak`, and **not** re-rendered by `init --upgrade-workflows`. That is why no new managed `.gitignore` line is needed. The file declares no `concurrency` group, because a group keeps at most one pending run and cancels an earlier pending one, which would drop a trigger.
- **Who can start a run.** The labeller is `github.event.sender`. `ghost` is refused. An account whose `type` is not `User` is refused unless its login is listed in the repository variable `HARNESS_TRIGGER_ALLOWED_BOTS`, which is comma-separated and empty by default. A listed bot is authorised by that listing, because the permission API answers `none` or 404 for a bot (T3). For a `User`, `GET repos/{owner}/{repo}/collaborators/{login}/permission` must answer `permission` equal to `admin` or `write`. Any other answer, or no answer, is a refusal. These checks are restated from `anthropics/claude-code-action`'s two checks, without its `[bot]` shortcut (T4). A `repository_dispatch` has no labeller: the holder of the token that sent it is the authority, and GitHub requires Contents write for that token (T6).
- **The branch name** is derived deterministically in the run library (Task 3). The title is folded to ASCII lowercase under `LC_ALL=C`. Every run of characters outside `[a-z0-9]` becomes one `_`, and `_` is trimmed from both ends. The result is capped at 60 characters, with `_` trimmed again after the cut. An empty result falls back to `issue_<number>`, or to `task_<GITHUB_RUN_ID>` for a dispatch event. A taken name takes the lowest free suffix `_<n>` from `_2` up, up to `_99`; the first branch carries none. *Taken* means any of these:
  - a protected name;
  - a live branch on `origin`, compared case-insensitively;
  - a local branch;
  - under `<state_dir>` on `origin/<defaultBranch>`, a directory named exactly the name, or a file `<name>_task_prompt.md`, `<name>_story_plan.md` or `<name>_docs.md`;
  - a registry record, when a registry is named.

  A derived name must also route back to itself through the inbox patterns, which move into the library as their one owner (Task 2).
- **Feedback on the issue.** One comment names the branch and the run's URL, or the reason for a refusal. `autonomous-notify.sh` is unchanged. The comment and the label removal are the only writes the trigger makes to the issue. Lifecycle comments belong to `feat_forge_run_control`.
- **Local commands see a trigger-started run through `remote-run.sh adopt`** (Task 10). It reads one bounded listing of `harness run <branch>` runs (the `run-name` contract of `docs/remote-execution.md` → `## 5.`). For each branch that has no local record, is live on `origin` and is not protected, it creates the mirror with `create-worktree.sh --existing` and writes the record with `execution: github-actions`. `sync` then does the rest. The four commands that already sync run it first (Task 16). `/autonomous-sdlc-harness:branch-status` keeps its never-sync rule, so it runs only the read-only `adopt --list` (Task 17). The watcher's tick does not adopt: a tick-time adopt would spend a `gh` listing on every poll and create working copies nobody asked for. That contradicts `docs/remote-execution.md` → `## 1.`'s *"Nothing flows from GitHub to this machine unless the user asks"*.
- **A remote-only maintainer works the run from GitHub.** Every job-side notification that names a local slash command also names the GitHub route (Task 11): read the question from the run's `harness-state` artifact, then send **Run workflow** on `harness-run.yml` with `action: run` and `resume: answer` plus the answers JSON (or `resume: pause`).
- **`forge` gets its reader and its reporter.** Its readers are `init`, which writes the trigger workflow (Task 13), and the trigger itself, which re-reads the key at run time (Tasks 2 and 7). Its reporter is a new `doctor` check `forge` (Task 14), which names every state including *not set*. `--check-github` adds the trigger workflow and the label (Task 15). The coupling's other two parts, draft-pull-request output and comment-based park-and-ask, stay with `feat_forge_run_control`, and every document that states the key's status says so (Tasks 18, 19, 23).

Every GitHub name the trigger uses has one owner, `cli/src/remote/githubActions.ts` (Task 1). The shell and YAML mirrors declare themselves in their own headers, as `harness-run.yml` and `remote-run.sh` already do. Every test drives a `gh` stub through `HARNESS_GH_CLI` and reaches no network. The acceptance that needs a real repository, a run reaching "branch ready for review" with the maintainer's machine off, is Gate 12 observation (xiii), written by Task 24 and run by hand (**Manual setup required** below).

**Top risks:**

- **A refactor of the watcher's inbox pass changes a drop that works today** (acceptance 6). Tasks 2, 4 and 9 move code out of `autonomous-watcher.sh` into the library with every log line and exit path kept. Tasks 2 and 4 each add a case to `watcher-remote-dispatch.test.mjs` and then run that file, so the moved inbox path is exercised through the watcher rather than assumed; Task 9 adds a library case for the record it moves.
- **A trigger that starts a run for someone it should not.** Task 7's suite drives every refusal arm: `ghost`, an unlisted bot, a `read` or `triage` answer (`read` to the API), a failed permission call, a closed issue and `HARNESS_REMOTE_STOP`. It asserts that each one sends no `workflow run` and posts a comment naming the reason.
- **A new file the run job's own `init` would change.** The job fails on any tracked file its `init --plugin-root-entries` changes (`harness-run.yml` → `Generate the job's permission profile`). So Task 13 adds no managed `.gitignore` line and writes the trigger only where it is absent, and its suite asserts that a second `init` changes nothing.

**Manual setup required:**

- **Gate 12 observation (xiii), run by hand after this branch is released** (Task 24 writes the procedure; no implementing task depends on it). The run happens against the standing scratch repository `firu-daniel/harness-gate12`, reset to its seed. It needs `forge` set to `github` and `execution.target` set to `github-actions`, and `init` at the released version. The three workflows are committed and pushed to the default branch with the `workflow` scope, the label `harness` created, and one credential secret set. Then, with the local watcher stopped and the machine off, an issue is labelled. This is the only way acceptance 1's *"with the maintainer's machine switched off"* is observed. No test can spend a real repository, a runner or a credential.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. Only the committing role flips a marker to `[x]`, as that task's commit lands: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. An implementer never changes a marker here, and never edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as the sub-step bullets inside a per-task file, are informational only; the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/feat_forge_run_triggers/task_<K>_plan.md`. The entries are ordered bottom-up by ship sequence in the configured layer order, `cli`, then `plugin`, then the catch-all `general`, which ships last.

1. [x] **Task 1** — Declare the issue-trigger names and the `forgeTriggerApplies` predicate _(layer: cli)_ _(points: 10)_
2. [x] **Task 2** — Move the inbox filename routing into the run library, and add the library's `forge` reader _(layer: cli)_ _(points: 10)_
3. [x] **Task 3** — Derive a branch name from an issue title in the run library _(layer: cli)_ _(points: 15)_
4. [x] **Task 4** — Share the task-prompt placement between the watcher and a job _(layer: cli)_ _(points: 15)_
5. [x] **Task 5** — Let `create-worktree.sh` cut and push a branch without bootstrapping it _(layer: cli)_ _(points: 8)_
6. [x] **Task 6** — Add `remote-run.sh start`: place a task prompt on a new branch and dispatch it _(layer: cli)_ _(points: 15)_
7. [x] **Task 7** — Add `remote-run.sh trigger` for a labelled GitHub issue _(layer: cli)_ _(points: 20)_
8. [x] **Task 8** — Extend `remote-run.sh trigger` to a `repository_dispatch` event _(layer: cli)_ _(points: 8)_
9. [x] **Task 9** — Share a remote run's initial registry record between the watcher and the remote script _(layer: cli)_ _(points: 8)_
10. [x] **Task 10** — Add `remote-run.sh adopt` and `adopt --list` for runs started on GitHub _(layer: cli)_ _(points: 20)_
11. [x] **Task 11** — Name the GitHub route in every job-side notification that names a local command _(layer: cli)_ _(points: 12)_
12. [x] **Task 12** — Ship the `harness-trigger.yml` workflow template _(layer: cli)_ _(points: 15)_
13. [x] **Task 13** — Write the trigger workflow from `init` when `forge` is `github` and runs execute on GitHub Actions _(layer: cli)_ _(points: 20)_
14. [x] **Task 14** — Add the `doctor` check `forge`, the key's reporter _(layer: cli)_ _(points: 15)_
15. [x] **Task 15** — Ask GitHub about the trigger workflow and its label under `doctor --check-github` _(layer: cli)_ _(points: 10)_
16. [x] **Task 16** — Adopt runs started on GitHub before the four syncing commands sync _(layer: plugin)_ _(points: 10)_
17. [x] **Task 17** — Show runs not yet adopted in `/autonomous-sdlc-harness:branch-status` without syncing _(layer: plugin)_ _(points: 5)_
18. [x] **Task 18** — Restate the forge coupling's status in the plugin's flow documents _(layer: plugin)_ _(points: 8)_
19. [ ] **Task 19** — Restate `forge` in the schema and in `ARCHITECTURE.md` now that it has a reader and a reporter _(layer: general)_ _(points: 10)_
20. [ ] **Task 20** — Write `docs/github-issue-trigger.md`, the issue trigger's document of record _(layer: general)_ _(points: 20)_
21. [ ] **Task 21** — Bring `docs/remote-execution.md` level with the trigger, adopt and the GitHub-only route _(layer: general)_ _(points: 20)_
22. [ ] **Task 22** — Document the new verbs, the trigger workflow and the `forge` check in `docs/cli.md` and `docs/watcher.md` _(layer: general)_ _(points: 10)_
23. [ ] **Task 23** — Update the `forge` row, the roadmap debt, `ROADMAP.md` and `README.md` _(layer: general)_ _(points: 10)_
24. [ ] **Task 24** — Add Gate 12 observation (xiii): an issue label starts a run with the machine off _(layer: general)_ _(points: 8)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Whatever reads `forge` must also report it (`ARCHITECTURE.md` → `## 8. Declaring a seam before building it`), and the row must say which parts are still waiting."* A second clause is quoted from the prompt's *Trigger-started runs and the local commands*: *"a run started from an issue is visible to, and controllable by, the local commands (`/autonomous-sdlc-harness:branch-status`, `-answer`, `-resume`, `-pause`, `-user-review`), exactly like a remote run dropped locally"*.

**Derivation entry A — durable text that states the `forge` key's reader or the forge coupling's status (command).** Run from the repository root, re-run verbatim:

```
git grep -n -i -E 'forge (coupling|key|integration)|.forge. |forge-agnostic|trigger half|issue-label trigger' -- '*.md' 'schemas/*.json' ':!harness-runs' ':!examples'
```

**Derivation entry B — durable text that states what a local command does for a remote run's record (command).** Run from the repository root, re-run verbatim:

```
git grep -n -E 'remote-run\.sh.{0,3}(sync|status)' -- '*.md' ':!harness-runs' ':!examples'
```

**Derivation entry C — this plan's own durable-corpus targets that neither command reaches (procedure).** **Artifact:** the per-task files of this plan under `harness-runs/task_plans/feat_forge_run_triggers/`. **Traversal:** each file in readiness order, then its `### Targets` list top to bottom, then the document sections its `**Work:**` bullets edit, in bullet order. **Decision rule:** a target is reached when it is durable corpus text (a `docs/` or root prose document, a plugin command or flow document, an adopter-facing template README, or `llms.txt`) and no row from entry A or B already names that file and section.

**Derivation entry D — rows of the standing lessons ledger (procedure).** **First step, runnable:** `grep -n -E '^## |^- ' harness-runs/lessons.md`. **Artifact:** that standing ledger. **Traversal:** its topic headings in file order, then the one-line rules under each. **Decision rule:** a rule is reached when the surface it governs is among this plan's targets: adopter-facing commands in documents, an adopter-facing name, an unattended retry, or state held in an expiring artifact.

**Closure invariant:** every site any of entries A–D reaches appears as a row below. No site has a mirrored counterpart, so `Copy` is `—` throughout. A conventions-document site is `no-change` without exception, and is raised in the return's `## Corpus staleness`.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `.claude/context/conventions.md` → `## Not determined` ("What an implementer should do with the configuration keys `forge` and `design.source` is not settled") | — | A | `no-change` | A conventions document is never a task's target. This branch falsifies the `forge` half of the bullet, so it is raised as a `stale-rule` entry in `## Corpus staleness` |
| 2 | `ARCHITECTURE.md` → `## 7.`, the bullet "**No forge coupling.**" | — | A | `change` | Task 19 |
| 3 | `ARCHITECTURE.md` → `## 8.`, the paragraph "**`forge` — the same pattern missing one part.**" | — | A | `change` | Task 19 |
| 4 | `ARCHITECTURE.md` → `## 8.`, "The corollary is `forge`'s" | — | A | `no-change` | It states the rule and where it came from, and both still hold: the rule's origin is historical, and this branch satisfies the rule rather than contradicting it |
| 5 | `ARCHITECTURE.md` → `## 8.`, "what `qa.driver` has and `forge` does not" | — | A | `change` | Task 19 |
| 6 | `ARCHITECTURE.md` → `## 8.`, `design.source`'s "What is absent is the observer, exactly as with `forge`" | — | A | `change` | Task 19 |
| 7 | `ARCHITECTURE.md` → `## 8.`, "records against `forge` rather than `qa.driver`'s" | — | A | `change` | Task 19 |
| 8 | `README.md` → the bullet "**Forge-agnostic, which means the last step is yours.**" | — | A | `change` | Task 23 |
| 9 | `ROADMAP.md` → the *Cloud / CI execution* row, "**Still open:** the trigger half" | — | A | `change` | Task 23 |
| 10 | `docs/config.md` → `## 5. Key reference`, the `forge` row ("**Nothing reads this key in this release**") | — | A | `change` | Task 23 |
| 11 | `docs/development.md` → `## 6.`, row `10` ("reads this project's own `qa.driver` and `forge` precedents") | — | A | `no-change` | It records what item 10 shipped, as of that release; a shipped row is history, not a present-tense claim about `forge` |
| 12 | `docs/development.md` → `## 6.`, "The second was **the reader for the `forge` configuration key**" | — | A | `change` | Task 23 |
| 13 | `docs/development.md` → `## 6.`, "**A second key is now in that same state, and this release put it there.**" | — | A | `no-change` | It states `design.source`'s debt, which this branch does not touch. Its comparison to `forge` names the state that release found, and the paragraph in row 12 is what now records `forge`'s changed state |
| 14 | `docs/remote-execution.md` → `## 5.`, "**The `workflow_dispatch` inputs are the seam the trigger half plugs into.**" | — | A | `change` | Task 21 |
| 15 | `docs/remote-execution.md` → `## 5.`, "`forge` gains no reader here" | — | A | `change` | Task 21 |
| 16 | `docs/remote-execution.md` → `## 5.`, "**What stays open** is the trigger half" | — | A | `change` | Task 21 |
| 17 | `plugin/docs/AUTONOMOUS_FLOW.md` → "The harness is forge-agnostic in this release and applies none" | — | A | `change` | Task 18 |
| 18 | `plugin/docs/AUTONOMOUS_FLOW.md` → `## Out of scope in this release`, "**No forge coupling.**" | — | A | `change` | Task 18 |
| 19 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → "the configuration key for forge coupling is declared and has no reader yet" | — | A | `change` | Task 18 |
| 20 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → "no forge coupling — an opted-in run executes in a GitHub Actions job, but file drops still start and steer it" | — | A | `change` | Task 18 |
| 21 | `schemas/harness.config.schema.json` → `properties.forge.description` ("because nothing reads this key in this release") | — | A | `change` | Task 19 |
| 22 | `docs/development.md` → `## 5.`, Gate 12 observation (viii) ("**(viii) Stopping, then resuming.**"), its `remote-run.sh sync <branch>` command | — | B | `no-change` | A hand-run step on a locally dropped run. It stays true, since `sync` is unchanged |
| 23 | `docs/development.md` → `## 5.`, Gate 12 observation (xi) ("**(xi) A remote park answered and resumed.**"), its `remote-run.sh sync <branch>` command | — | B | `no-change` | As row 22 |
| 24 | `docs/remote-execution.md` → `## 1.`, step "3. **Dispatch.**" | — | B | `no-change` | The lifecycle of a locally dropped run, which is unchanged (acceptance 6). The trigger's lifecycle is Task 20's document |
| 25 | `docs/remote-execution.md` → `## 1.`, "**What each local command does for a remote run.**" | — | B | `change` | Task 21 |
| 26 | `docs/remote-execution.md` → `## 1.`, the table row for `/autonomous-sdlc-harness:branch-status` ("Runs `remote-run.sh status` once") | — | B | `change` | Task 21 |
| 27 | `docs/remote-execution.md` → `## 3.`, "**The local route.**" | — | B | `no-change` | It names `sync` into the mirror for the interactive-test phase, which an adopted run also has once adopted |
| 28 | `docs/remote-execution.md` → `## 4.`, "**Central state.**" | — | B | `no-change` | It states the bundle format and `sync`'s restore, which are unchanged |
| 29 | `docs/remote-execution.md` → `## 4.`, "`/autonomous-sdlc-harness:branch-status` shows the expired line" | — | B | `no-change` | The expired-bundle behaviour is unchanged |
| 30 | `docs/watcher.md` → `## 1.`, "3. **The guards, in one order.**" | — | B | `no-change` | The watcher's inbox guards are unchanged; the trigger never reaches the inbox |
| 31 | `docs/watcher.md` → `## 1.`, "7. **The session's exit is classified**" | — | B | `no-change` | Exit classification is unchanged |
| 32 | `plugin/commands/branch-answer.md` → step 2, "**Remote records sync first.**" | — | B | `change` | Task 16 |
| 33 | `plugin/commands/branch-answer.md` → the closing fence, "The only script it invokes is `<scripts_dir>/remote-run.sh sync`" | — | B | `change` | Task 16 |
| 34 | `plugin/commands/branch-pause.md` → the scope paragraph, "The only script it invokes is `<scripts_dir>/remote-run.sh sync`" | — | B | `change` | Task 16 |
| 35 | `plugin/commands/branch-pause.md` → step 2, "**Remote records sync first.**" | — | B | `change` | Task 16 |
| 36 | `plugin/commands/branch-resume.md` → the scope paragraph, "The only script it invokes is `<scripts_dir>/remote-run.sh sync`" | — | B | `change` | Task 16 |
| 37 | `plugin/commands/branch-resume.md` → step 2, "**Remote records sync first.**" | — | B | `change` | Task 16 |
| 38 | `plugin/commands/branch-status.md` → step 3, "**Remote record** — one carrying `execution: github-actions`" | — | B | `no-change` | An adopted record is an ordinary remote record, so this step stands. The not-yet-adopted listing is a new step Task 17 adds beside it |
| 39 | `plugin/commands/branch-status.md` → the closing fence, "This command is read-only" | — | B | `change` | Task 17 |
| 40 | `plugin/commands/branch-user-review.md` → step 2, "**Remote records sync first.**" | — | B | `change` | Task 16 |
| 41 | `plugin/commands/branch-user-review.md` → the closing fence, "The only script it invokes is `<scripts_dir>/remote-run.sh sync`" | — | B | `change` | Task 16 |
| 42 | `plugin/commands/branch-answer.md`, `branch-pause.md`, `branch-resume.md`, `branch-user-review.md` → each `## Resolved values` `<scripts_dir>` row ("its `sync` verb") | — | C (Task 16) | `change` | Task 16 |
| 43 | `plugin/commands/branch-status.md` → `## Resolved values`, the `<scripts_dir>` row ("its `status` verb … and never `sync`") | — | C (Task 17) | `change` | Task 17 |
| 44 | `docs/github-issue-trigger.md` (new) | — | C (Task 20) | `change` | Task 20 |
| 45 | `llms.txt` → the docs list | — | C (Task 20) | `change` | Task 20 |
| 46 | `docs/remote-execution.md` → `## 3.` → `### Notifications` | — | C (Task 21) | `change` | Task 21 |
| 47 | `docs/remote-execution.md` → `## 7.` → `### Every secret and variable`, and `### Upgrading` | — | C (Task 21) | `change` | Task 21 |
| 48 | `docs/remote-execution.md` → `## 8. Choosing a runner`, and `## 11. Security` | — | C (Task 21) | `change` | Task 21 |
| 49 | `docs/cli.md` → `## 2.`, `## 3. The re-run contract` and `## 7. \`doctor\`` | — | C (Task 22) | `change` | Task 22 |
| 50 | `docs/watcher.md` → the scripts table, rows `create-worktree.sh` and `remote-run.sh` | — | C (Task 22) | `change` | Task 22 |
| 51 | `README.md` → the docs list entry for `docs/remote-execution.md` | — | C (Task 23) | `change` | Task 23: a sibling entry for the new document |
| 52 | `docs/development.md` → `## 5.`, Gate 12's introduction ("Twelve observations") and its observation list | — | C (Task 24) | `change` | Task 24 |
| 53 | `cli/templates/README.md` → the `github/` row | — | C (Task 13) | `change` | Task 13 |
| 54 | `harness-runs/lessons.md` → *Adopter-facing documentation*, "Every command an adopter is meant to run sits in a fenced block" | — | D | `no-change` | A constraint Tasks 20 and 21 honour. The rule itself is not falsified |
| 55 | `harness-runs/lessons.md` → *Adopter-facing documentation*, "Name an adopter-facing surface with the term adopters already arrive with" | — | D | `no-change` | A constraint: the adopter-facing name is "the issue trigger" and the label `harness`, while wire identifiers (`forge`, `harness-trigger.yml`, the variables) keep their spelling |
| 56 | `harness-runs/lessons.md` → *Unattended control loops*, "Every automatic retry in an unattended path is bounded by a count or a deadline" | — | D | `no-change` | A constraint Task 7's run-URL lookup honours with a count bound and one stated fallback |
| 57 | `harness-runs/lessons.md` → *Unattended control loops*, "State held only in an expiring store … must be reported plainly as expired" | — | D | `no-change` | A constraint on the GitHub-only answer route, which reads the `harness-state` artifact. Tasks 20 and 21 state that an expired bundle cannot be answered there, as `docs/remote-execution.md` → `## 4.` already does |
| 58 | `plugin/docs/AUTONOMOUS_FLOW.md` → `## The wiring table`, the *Remote execution* row | — | C (Task 18) | `change` | Task 18: the third workflow and the `trigger` / `start` / `adopt` verbs |
| 59 | `plugin/docs/AUTONOMOUS_FLOW.md` → `## Drop a task prompt` | — | C (Task 18) | `change` | Task 18: one paragraph on the issue-started run |
| 60 | `plugin/commands/branch-status.md` → `## Steps` step 2 (*Selection*) | — | C (Task 17) | `change` | Task 17: the `adopt --list` bullet |
| 61 | `plugin/commands/branch-status.md` → `## Steps` step 6 (the parked-run pointer at `/autonomous-sdlc-harness:branch-answer`) | — | C (Task 17) | `change` | Task 17: the next action for a not-yet-adopted run |
| 62 | `docs/remote-execution.md` → the opening paragraph ("It cites rather than restates") | — | C (Task 21) | `change` | Task 21: adds `docs/github-issue-trigger.md` |
| 63 | `docs/remote-execution.md` → `## 7. Turning it on`, step "**2. Write the two workflows.**" | — | C (Task 21) | `change` | Task 21: the third-workflow sentence |
| 64 | `docs/development.md` → `## 5.`, Gate 12's "What still owes a first recording" sentence and its **Teardown.** paragraph | — | C (Task 24) | `change` | Task 24 |
