# Story: Rename the GitHub-facing surface to DevScene

## Context

This branch renames what an adopter sees on GitHub: the trigger and state labels, the comment-mention handle, the hidden comment marker, and the four workflow files with their `name:` values. It is the second of five rename branches after `chore_rename_to_devscene`. Backward compatibility is out of scope: no alias, no fallback, nothing that keeps the old names working. The two clarification answers of `harness-runs/clarifications/chore_devscene_github_surface/answer_2.md` are binding on every task: **Q1 (b)**, dated records and research documents are respelled too; **Q2 (b)**, the recorded 0.6.1 `if:` line in `UNPARSEABLE_CONTROL_IF_LINE` is respelled and the fixture's bytes change to match.

**The spelling table. Every task applies it; no task re-decides it.** It covers every spelling of an old name, escaped or not: inside a regex (`harness-run\.yml`), HTML-escaped (`&lt;!-- sdlc-harness`), URL-encoded (`sdlc-harness%3A%20running`), and in a boundary example (`foo@sdlc-harnessx` becomes `foo@dev-scenex`).

| Old text | New text |
|---|---|
| the trigger label `sdlc-harness` (the `HARNESS_TRIGGER_LABEL` default, `DEFAULT_TRIGGER_LABEL`) | `devscene` |
| the state-label prefix `sdlc-harness: ` and every `sdlc-harness: <state>` label | `devscene: ` and `devscene: <state>` |
| the comment handle `@sdlc-harness` (`COMMAND_HANDLE`) | `@dev-scene` |
| the hidden marker `<!-- sdlc-harness` (`COMMENT_MARKER`), including the review-round line `<!-- sdlc-harness round …` | `<!-- devscene`, `<!-- devscene round …` |
| `harness-trigger.yml`, `harness-run.yml`, `harness-control.yml`, `harness-resume.yml`, with any path prefix or `.bak` suffix | `devscene-trigger.yml`, `devscene-run.yml`, `devscene-control.yml`, `devscene-resume.yml` |
| the workflow `name:` values `harness-trigger`, `harness-run`, `harness-control`, `harness-resume`, and the same four bare names wherever they mean the workflow (a `gh workflow list` fixture, "a `harness-run` job") | `devscene-trigger`, `devscene-run`, `devscene-control`, `devscene-resume` |

**What keeps its current spelling, and why.**
- `sdlc-harness` as the default **`stateDir`**: `sdlc-harness/`, `stateDir: 'sdlc-harness'`, `--state-dir sdlc-harness`, the `.stateDir // "sdlc-harness"` jq default, `hc_config_dir … stateDir sdlc-harness`. A later branch renames it. The test for a line: does the literal name an issue label, or the run-artifact directory? Only the first changes.
- The `HARNESS_*` repository variables and secrets, `HARNESS_TRIGGER_LABEL` included (task prompt, *Out of scope*).
- `harness-read-mention`, the command name, and `MENTION_COMMAND_NAME` (task prompt, *Out of scope*).
- This repository's own `.github/workflows/` (task prompt, *Out of scope*).
- Names the table does not list: `LEGACY_TRIGGER_LABEL` (`'harness'`) and its doctor note; `TRIGGER_DISPATCH_EVENT_TYPE` (`harness-task`); the artifacts `harness-state` and `harness-poll-state`; the concurrency groups `harness-resume`, `harness-run-<branch>`, `harness-review-<branch>` and `harness-control-<id>`; the `run-name` titles `harness <action> <branch>`, `harness trigger …` and `harness control …`, which `scripts/lib/gate12-sandbox-round/plant.sh` matches by display title; the `gh label create` description *"Start a harness run from this issue"*; and the word "harness" in prose.
- The product's earlier name `autonomous-sdlc-harness`, wherever it survives.
- `harness-runs/`, which is history.
- **The 0.6.1 fixture.** `cli/test/fixtures/harness-control-0.6.1.yml` keeps its file name and every byte except its job-level `if:` line, which Task 5 respells (Q2 (b)). Its comment lines still carry the old handle, marker and state-label prefix, and its comments and `name:` line still carry the old workflow names. Those are the only old names left in the tree outside `harness-runs/` and the `stateDir` default. The run's Done summary lists them as the recorded-release exception the task prompt's *Done when* asks for.

**Dated records are respelled, and say so (Q1 (b)).** The Gate 12 rounds in `docs/development.md`, the *Verified in Gate 12 round N* sections, the research documents and every other dated passage take the spelling table like everything else. A record that silently claimed the new names were observed would be false, so each `docs/` document gets this sentence once, byte for byte, **when at least one line a task respells in it carries a date in `YYYY-MM-DD` form, a CLI version (`0.x.y`), or a Gate 12 round number**:

> *Records in this document taken before DevScene's GitHub-facing names changed — its trigger and state labels, its comment handle, its hidden comment marker and its workflow file names — have had those names respelled to the current ones; nothing else in them was changed.*

Place it as its own paragraph directly after the earlier rename's sentence (*"Measurements recorded in this document before the product was renamed DevScene …"*) where the document has one. Otherwise place it directly under the document's opening statement of what it is. It names no old name, so it does not reintroduce one. A provenance note pointing at a **git object** is never respelled into a path that did not exist at that commit. The two such notes, in `cli/src/generators/githubWorkflows.ts` and `scripts/check-rendered-workflows.mjs`, are reworded to name *"the control workflow template"* and the blob instead (Tasks 5 and 17).

**Mirror pairs.** Each name below is stated in several places by design. The task that owns each half restates the exact new literal:
- `cli/src/remote/githubActions.ts` (Task 1) is the owner of `WORKFLOW_RUN_FILE`, `WORKFLOW_RESUME_FILE`, `WORKFLOW_TRIGGER_FILE`, `WORKFLOW_CONTROL_FILE`, `COMMAND_HANDLE`, `COMMENT_MARKER`, `STATE_LABEL_PREFIX` and `DEFAULT_TRIGGER_LABEL`.
- It is mirrored by `cli/templates/scripts/remote-run.sh` (Task 3), by `cli/templates/scripts/lib/harness-run-lib.sh` → `HR_REMOTE_WORKFLOW_RUN_FILE` (Task 4), and by the four workflow templates (Task 2).
- The round line's regex `PIS_RE_ROUND_MARKER` in `cli/templates/scripts/prompt-injection-screen.sh` (Task 4) mirrors `remote-run.sh`'s `"$COMMENT_MARKER round collected_at="` line (Task 3).
- `doctor` and `init` build every message from the constants, so their texts change with Task 1.

**Test files are edited by the task that can run them green.** A suite is edited only after every producer it reads has landed, and each test file belongs to exactly one task. So the cli producers (Tasks 1–6) carry no suite edits. The exception is the fixture, which Task 5 owns because its bytes define the digest that task writes. The cli suites follow in Tasks 7–14. Six cli files read this repository's own `scripts/` tree: the four `gate12-sandbox-round-*` suites, `cli/test/helpers/gate12-round.mjs` and `cli/test/sandbox-probe-runner-workflow.test.mjs`. They belong to Task 19, which ships after the `general` script Tasks 16–18. That is the one place the readiness list leaves `cli` → `plugin` → `general` order.

**The self-adopted copies follow their templates byte for byte.** `scripts/remote-run.sh`, `scripts/lib/harness-run-lib.sh`, `scripts/prompt-injection-screen.sh`, `scripts/autonomous-watcher.sh` and `scripts/lib/run-analytics.jq` carry the same content as their `cli/templates/scripts/` counterparts today: `git ls-files -s` shows the same blob id for each pair. Three of them, `scripts/autonomous-watcher.sh`, `scripts/remote-run.sh` and `scripts/prompt-injection-screen.sh`, differ from their template in file mode only (the copy is `100755`, the template `100644`); `scripts/lib/harness-run-lib.sh` and `scripts/lib/run-analytics.jq` match their templates in mode too. That mode difference is the intended state — the copies are executable wrappers — so a content comparison never uses a tool that treats a mode change as a difference. Task 16 copies the respelled templates' content over them and keeps each copy's file mode. It also respells the two `.bak` rules in this repository's own `.gitignore`.

**Order.** Tasks 1–6 change the `cli` producers: the constants, the workflow templates, `remote-run.sh`, the other script templates, the workflow generator with the 0.6.1 fixture, then the rest of `cli/src` and `cli/README.md`. Tasks 7–14 respell the cli suites that read them. Task 15 is the plugin. Tasks 16–18 are this repository's own scripts: the self-adopted copies, the workflow gate and release and probe scripts, and the Gate 12 sandbox-round library. Task 19 is the cli suites that read those scripts. Tasks 20–24 are the root documents and `docs/`. The last of them also runs the closing check.

**Top risks:**
- **A mirror pair drifts.** For example, `remote-run.sh` keeps `'@sdlc-harness'` while `githubActions.ts` says `'@dev-scene'`. Then a comment command is silently ignored on GitHub, though every unit test that reads only one side passes. Each task that owns a half restates its partner's exact literal. `cli/test/remote-names.test.mjs` (Task 7) holds the shell and TypeScript copies together, and `cli/test/workflow-templates.test.mjs` (Task 7) holds the templates to the constants.
- **The 0.6.1 repair stops matching.** Task 5 changes the fixture's `if:` line, the `UNPARSEABLE_CONTROL_IF_LINE` constant and the `'0.6.1'` digest together, so the classifier, the fixture and the digest agree. `cli/test/trigger-workflow-init.test.mjs` (Task 7) recomputes the digest from the fixture. The respelled line must still carry `': '` inside the label literal, so the fixture still fails to parse and gate 14b still refuses it.
- **A `stateDir` default is respelled by mistake.** That would turn a later branch's rename into this one's. Every task applies the label-or-directory test in the *What keeps its current spelling* list above. Task 24 closes on a whole-tree grep whose invariant is that every surviving bare `sdlc-harness` names the run-artifact directory or the earlier product name.

**Manual setup required:**
- **Before merge:** create the free GitHub organisation `dev-scene` to hold the `@dev-scene` handle, as `sdlc-harness` holds the current one (task prompt, *The new names*). No task depends on it. Comment matching is a string match and works whether the account exists or not.
- **Before the next Gate 12 sandbox round:** in the sandbox repository, delete the four `harness-*.yml` workflows, re-run `init` with this branch's CLI so that `.github/workflows/` carries the four `devscene-*.yml` files, and create the `devscene` trigger label with the `gh label create` command `init`'s report prints. The round procedure Task 21 respells, and the round scripts Task 18 respells, look only for the new names (depends on Tasks 2, 18 and 21).

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. The committer flips each entry to `[x]` as that task's commit lands. **Only the committing role flips a marker.** In every flow that dispatches one, that role is the `committer` agent. In the supervised flow, which dispatches none, it is the orchestrator itself. An implementer never changes a marker here and never edits any other line of this section while a run is iterating this index. `[ ]` markers anywhere else, such as sub-step bullets inside per-task files, are informational only. They are never the iteration source, and the committer does not touch them.

Each entry maps 1:1 to `harness-runs/task_plans/chore_devscene_github_surface/task_<K>_plan.md`. Entries run in ship order. Task 19 sits among the `general` tasks for the reason `## Context` gives.

1. [x] **Task 1** — Respell the GitHub-surface constants in `cli/src/remote/githubActions.ts` _(layer: cli)_ _(points: 10)_
2. [x] **Task 2** — Rename the four workflow templates to `devscene-*.yml` and respell their contents _(layer: cli)_ _(points: 20)_
3. [x] **Task 3** — Respell the label, handle, marker and workflow names in the `remote-run.sh` template _(layer: cli)_ _(points: 20)_
4. [x] **Task 4** — Respell the run library, prompt-injection screen, watcher and run-analytics templates and `cli/templates/README.md` _(layer: cli)_ _(points: 10)_
5. [x] **Task 5** — Respell the workflow generator, its recorded 0.6.1 `if:` line and digest, and the 0.6.1 fixture's `if:` line _(layer: cli)_ _(points: 15)_
6. [ ] **Task 6** — Respell the workflow names in the rest of `cli/src` and in `cli/README.md` _(layer: cli)_ _(points: 15)_
7. [ ] **Task 7** — Respell the remote-names, workflow-template and trigger-workflow `init` suites _(layer: cli)_ _(points: 15)_
8. [ ] **Task 8** — Respell the `doctor` suite _(layer: cli)_ _(points: 20)_
9. [ ] **Task 9** — Respell the `init`, branch-naming, credential-scan and prompt-injection suites and the fixture helper's comment _(layer: cli)_ _(points: 10)_
10. [ ] **Task 10** — Respell the `remote-control` suite _(layer: cli)_ _(points: 20)_
11. [ ] **Task 11** — Respell the mention, needs-agent, close and review run-control suites _(layer: cli)_ _(points: 20)_
12. [ ] **Task 12** — Respell the `remote-run` and `remote-trigger` suites _(layer: cli)_ _(points: 20)_
13. [ ] **Task 13** — Respell the report, collect and deliver suites _(layer: cli)_ _(points: 15)_
14. [ ] **Task 14** — Respell the open, progress, review-payload and start suites and the three watcher remote suites _(layer: cli)_ _(points: 15)_
15. [ ] **Task 15** — Respell the marker and workflow names in the plugin's agents, flow document and instructions _(layer: plugin)_ _(points: 10)_
16. [ ] **Task 16** — Bring the self-adopted script copies to the respelled template bytes and respell the `.gitignore` `.bak` rules _(layer: general)_ _(points: 10)_
17. [ ] **Task 17** — Respell the rendered-workflows gate, `run-gates.sh`, `tag-release.sh` and the sandbox-probe runner files _(layer: general)_ _(points: 15)_
18. [ ] **Task 18** — Respell the Gate 12 sandbox-round library _(layer: general)_ _(points: 15)_
19. [ ] **Task 19** — Respell the Gate 12 sandbox-round suites, their helper and the sandbox-probe runner suite _(layer: cli)_ _(points: 10)_
20. [ ] **Task 20** — Respell `README.md` and `ARCHITECTURE.md` _(layer: general)_ _(points: 5)_
21. [ ] **Task 21** — Respell `docs/development.md`, the Gate 12 rounds and Gate 14 included _(layer: general)_ _(points: 20)_
22. [ ] **Task 22** — Respell `docs/github-run-control.md` and `docs/github-issue-trigger.md` _(layer: general)_ _(points: 20)_
23. [ ] **Task 23** — Respell `docs/remote-execution.md`, `docs/cli.md`, `docs/config.md` and `docs/watcher.md` _(layer: general)_ _(points: 20)_
24. [ ] **Task 24** — Respell the research documents and the sandbox records, and run the closing check _(layer: general)_ _(points: 20)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Rename the label, handle, marker and workflow file names everywhere they are generated, matched, documented or tested."* The *Done when* sharpens it: *"No generated workflow, script, `doctor` message or document names `sdlc-harness` as a label, handle or marker."* and *"No generated workflow, script, `doctor` message or document names a `harness-{trigger,run,control,resume}.yml` file, except recorded-release fixtures."*

`cli/src` and `cli/test` are application source and owe no register rows. Tasks 1, 5, 6 and 7–14 and 19 own them. The one exception is the fixture the task prompt names (row 66).

**Derivation entry D1 — handle, marker, state labels and workflow names (command).** Re-run verbatim from the checkout root:
`git grep -lE '@sdlc-harness|!-- ?sdlc-harness|sdlc-harness(: |%3A)|harness-(trigger|run|control|resume)([^-a-z]|$)' -- . ':!harness-runs' ':!cli/src' ':!cli/test'`

**Derivation entry D2 — bare `sdlc-harness`, the trigger-label candidates (command).** Re-run verbatim from the checkout root. It excludes the frozen capture `examples/notes-app/sdlc-harness/**` (`examples/notes-app/README.md` → *"The capture is frozen; the fixture is live"*), which no task may edit:
`git grep -lE 'sdlc-harness([^/]|$)' -- . ':!harness-runs' ':!cli/src' ':!cli/test' ':!examples/notes-app/sdlc-harness'`
Each file it lists gets a row. A file whose only bare hits name the `stateDir` default or carry the earlier product name `autonomous-sdlc-harness` is `no-change`.

**Derivation entry D3 — standing-artifact rows (procedure).** **First step, runnable:** `grep -nE '^## |^- |^_Written' harness-runs/lessons.md harness-runs/improvement_suggestions.md harness-runs/README.md`. **Artifact:** the standing files at the root of `harness-runs/`: the lessons ledger, the improvement-suggestions ledger and the tree's README. **Traversal:** each file in that order; within a file, its `## ` headings in file order, then the `- ` rule lines and the closing `_Written by …_` line under each. **Decision rule:** a line is reached when it carries one of the spelling table's old names, or when it constrains how a wire identifier or an adopter-facing command is written.

**Derivation entry D4 — the sites the task prompt names (procedure).** **First step, runnable:** `git grep -liE 'trigger label|state label|handle' -- plugin/commands`. **Artifact:** the task prompt's `## The goal` list, plus that command's output. **Traversal:** the goal's bullets in order, then the command's files in order. **Decision rule:** a named **file** is reached when D1 and D2 do not already give it a row and it is not under `cli/src`. A named **directory** contributes the files D1 and D2 list under it. Each `plugin/commands/` file the command lists is reached as one of *"the commands that tell the user which label or handle to use"*.

**Closure invariant:** every site each derivation entry reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `.gitignore` | this repository's render | D1 | `change` | Task 16 (the two workflow `.bak` rules) |
| 2 | `ARCHITECTURE.md` | — | D1, D2 | `change` | Task 20 |
| 3 | `README.md` | — | D2 (trigger label) | `change` | Task 20 |
| 4 | `cli/README.md` | — | D1 | `change` | Task 6 |
| 5 | `cli/templates/README.md` | template | D1 | `change` | Task 4 |
| 6 | `cli/templates/github/workflows/harness-control.yml` | template | D1, D2 | `change` | Task 2, renamed to `devscene-control.yml` |
| 7 | `cli/templates/github/workflows/harness-resume.yml` | template | D1, D2 | `change` | Task 2, renamed to `devscene-resume.yml`. Its D2 hit, the jq `stateDir` default, stays |
| 8 | `cli/templates/github/workflows/harness-run.yml` | template | D1 | `change` | Task 2, renamed to `devscene-run.yml` |
| 9 | `cli/templates/github/workflows/harness-trigger.yml` | template | D1, D2 | `change` | Task 2, renamed to `devscene-trigger.yml` |
| 10 | `cli/templates/scripts/autonomous-watcher.sh` | template | D1, D2 | `change` | Task 4. Its D2 hit (`"$d/sdlc-harness"`, a `stateDir`) stays |
| 11 | `cli/templates/scripts/lib/harness-run-lib.sh` | template | D1, D2 | `change` | Task 4. Its D2 hit (`hr_config_dir … stateDir "sdlc-harness"`) stays |
| 12 | `cli/templates/scripts/lib/run-analytics.jq` | template | D1 | `change` | Task 4 |
| 13 | `cli/templates/scripts/prompt-injection-screen.sh` | template | D1, D2 | `change` | Task 4 |
| 14 | `cli/templates/scripts/remote-run.sh` | template | D1, D2 | `change` | Task 3 |
| 15 | `docs/cli.md` | — | D1, D2 | `change` | Task 23 |
| 16 | `docs/config.md` | — | D1, D2 | `change` | Task 23. Its `stateDir` default row stays |
| 17 | `docs/copilot-foundry-research.md` | — | D1 | `change` | Task 24 |
| 18 | `docs/development.md` | — | D1, D2 | `change` | Task 21 |
| 19 | `docs/github-integration-research.md` | — | D1 | `change` | Task 24 |
| 20 | `docs/github-issue-trigger.md` | — | D1, D2 | `change` | Task 22 |
| 21 | `docs/github-run-control.md` | — | D1, D2 | `change` | Task 22 |
| 22 | `docs/rag-extraction-research/01-current-mechanism.md` | — | D1 | `change` | Task 24 |
| 23 | `docs/rag-extraction-research/07-extraction-plan.md` | — | D1 | `change` | Task 24 |
| 24 | `docs/rag-extraction-research/reviews/01-current-mechanism.md` | — | D1 | `change` | Task 24 |
| 25 | `docs/rag-extraction-research/reviews/07-extraction-plan.md` | — | D1 | `change` | Task 24 |
| 26 | `docs/remote-execution.md` | — | D1, D2 | `change` | Task 23 |
| 27 | `docs/sandbox-record.md` | — | D1 | `change` | Task 24 |
| 28 | `docs/sandbox-verification.md` | — | D1 | `change` | Task 24 |
| 29 | `docs/team-accounts-research.md` | — | D1 | `change` | Task 24 |
| 30 | `docs/watcher.md` | — | D1 | `change` | Task 23 |
| 31 | `docs/outer-loop-verification.md` | — | D2 | `no-change` | Every bare hit is `--state-dir sdlc-harness`, the run-artifact directory, which a later branch renames |
| 32 | `evals/plan-shape/scaffold.sh` | — | D2 | `no-change` | `state_dir="sdlc-harness"`, the `stateDir` default |
| 33 | `examples/notes-app/.claude/CLAUDE.md` | capture | D2 | `no-change` | Frozen capture, and its hits are `sdlc-harness`-as-`stateDir` and the earlier product name |
| 34 | `examples/notes-app/.claude/settings.autonomous.json` | worked example's render | D2 | `no-change` | Its hits are the `stateDir` path `/workspace/notes-app/sdlc-harness`, and it is under `.claude/**` |
| 35 | `examples/notes-app/README.md` | — | D2 | `no-change` | Its hit is the earlier product name `autonomous-sdlc-harness` in the historical-name line |
| 36 | `plugin/agents/prompt-injection-reviewer.md` | — | D1, D2 | `change` | Task 15 (`<!-- sdlc-harness round … -->`) |
| 37 | `plugin/agents/user-review-fix-plan-writer.md` | — | D1, D2 | `change` | Task 15 (`<!-- sdlc-harness round … -->`) |
| 38 | `plugin/docs/AUTONOMOUS_FLOW.md` | — | D1, D2 | `change` | Task 15 |
| 39 | `plugin/hooks/lib/harness-config-lib.sh` | — | D2 | `no-change` | `hc_config_dir … stateDir sdlc-harness`, the `stateDir` default |
| 40 | `plugin/instructions/autonomous_pause_and_ledger.md` | — | D1 | `change` | Task 15 |
| 41 | `plugin/instructions/main_repo_resolution.md` | — | D2 | `no-change` | *"default `sdlc-harness`"* for `stateDir` |
| 42 | `plugin/instructions/prompt_injection_screen.md` | — | D1 | `change` | Task 15 |
| 43 | `plugin/scripts/release-qa-user.sh` | — | D2 | `no-change` | `stateDir` default |
| 44 | `plugin/scripts/reserve-qa-user.sh` | — | D2 | `no-change` | `stateDir` default |
| 45 | `scripts/autonomous-watcher.sh` | adopted copy | D1, D2 | `change` | Task 16, content copy of row 10 |
| 46 | `scripts/check-rendered-workflows.mjs` | — | D1 | `change` | Task 17 |
| 47 | `scripts/lib/gate12-sandbox-round/default-branch.sh` | — | D1 | `change` | Task 18 |
| 48 | `scripts/lib/gate12-sandbox-round/grade-full-run.sh` | — | D1 | `change` | Task 18 |
| 49 | `scripts/lib/gate12-sandbox-round/grade-plant.sh` | — | D1 | `change` | Task 18 |
| 50 | `scripts/lib/gate12-sandbox-round/grade-state.sh` | — | D1 | `change` | Task 18 |
| 51 | `scripts/lib/gate12-sandbox-round/plant.sh` | — | D1 | `change` | Task 18 |
| 52 | `scripts/lib/gate12-sandbox-round/preflight.sh` | — | D1 | `change` | Task 18 |
| 53 | `scripts/lib/gate12-sandbox-round/runs.sh` | — | D1 | `change` | Task 18 |
| 54 | `scripts/lib/harness-run-lib.sh` | adopted copy | D1, D2 | `change` | Task 16, content copy of row 11 |
| 55 | `scripts/lib/run-analytics.jq` | adopted copy | D1 | `change` | Task 16, content copy of row 12 |
| 56 | `scripts/lib/sandbox-probe/job.sh` | — | D1 | `change` | Task 17 |
| 57 | `scripts/lib/sandbox-probe/preflight.sh` | — | D1 | `change` | Task 17 |
| 58 | `scripts/prompt-injection-screen.sh` | adopted copy | D1, D2 | `change` | Task 16, content copy of row 13 |
| 59 | `scripts/remote-run.sh` | adopted copy | D1, D2 | `change` | Task 16, content copy of row 14 |
| 60 | `scripts/run-gates.sh` | — | D1 | `change` | Task 17 (the gate 14b label) |
| 61 | `scripts/sandbox-probe-runner.yml` | — | D1 | `change` | Task 17 |
| 62 | `scripts/tag-release.sh` | — | D1 | `change` | Task 17 |
| 63 | `harness-runs/lessons.md` → *"Name an adopter-facing surface with the term adopters already arrive with … never the configuration key, tool name, check id or any other wire identifier."* | — | D3, constrains how a wire identifier is named | `no-change` | The rule stands. This branch renames the label, handle, marker and workflow files because the task prompt explicitly asks for it, with no alias because backward compatibility is out of scope. It renames no configuration key, tool name or check id: `HARNESS_*` and `harness-read-mention` are left to later branches |
| 64 | `harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block, one command per line …"* | — | D3, constrains how a command is written | `no-change` | The rule stands and binds Tasks 20–24. A respelled `gh label create devscene …` and any other respelled command stay in their fenced blocks, and no inline command is introduced |
| 65 | `plugin/commands/harness-read-mention.md` | — | D4, named by the goal | `no-change` | It carries none of the old names. The handle reaches its session as `comment.md`'s first line, `handle: <COMMAND_HANDLE>`, which `remote-run.sh` writes (Task 3). `plugin/instructions/mention_reading.md` → `## Resolved values` names `COMMAND_HANDLE` as its owner. *"The harness handle"* is prose, not the old literal |
| 66 | `cli/test/fixtures/harness-control-0.6.1.yml` | — | D4, named by the goal | `change` | Task 5. Only the job-level `if:` line changes (Q2 (b)). The file name and every other byte keep 0.6.1's text, and the Done summary lists them |
| 67 | `llms.txt` | — | D4, named by the goal | `no-change` | Carries none of the old names: neither D1 nor D2 lists it |
| 68 | `plugin/commands/README.txt` | — | D4, the command | `no-change` | *"a mention of the harness handle"* is prose, and it names no handle literal |
| 69 | `plugin/commands/branch-status.md` | — | D4, the command | `no-change` | Its hit is the verb "Handle", not a GitHub handle or label |
