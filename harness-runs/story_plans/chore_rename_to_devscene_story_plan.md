# Story: Rename the product from `autonomous-sdlc-harness` to DevScene

## Context

This branch renames the product to **DevScene**. That covers the plugin, the marketplace, the npm package and its `bin`, every name derived from them, every plugin-qualified command and agent reference, every `firu-daniel/autonomous-sdlc-harness` URL and every prose title. It is the first of five rename branches. Everything else that still says "harness" without the full product name is out of scope and stays as it is: the `sdlc-harness` label and `@sdlc-harness` handle, the `harness-*.yml` workflow file names, `HARNESS_*` variable names, the `harness.config.json` file name, `harness-scripts/`, the `sdlc-harness/` default state directory, the `harness-analyze` command name and the `harness-docs` retrieval server. Backward compatibility is also out of scope: no alias, no `renames` map in `marketplace.json`, no fallback to the old name. Publishing to npm, renaming the GitHub repository and deprecating the old npm package are the maintainer's.

**The spelling table. Every task applies it; no task re-decides it.**

| Old text | New text | Where |
|---|---|---|
| `autonomous-sdlc-harness` used as a machine name: the plugin `name`, the marketplace `name`, the npm `name` and `bin`, `npx …`, a `/…:<command>` or `…:<agent>` qualifier, a path segment, an XDG directory, a cache or state path, a notification group | `devscene` | everywhere |
| `autonomous-sdlc-harness@autonomous-sdlc-harness` (the `enabledPlugins` key, `claude plugin install …`) | `devscene@devscene` | everywhere |
| `com.autonomous-sdlc-harness.watcher` (the launchd label prefix) | `com.devscene.watcher` | everywhere |
| `autonomous-sdlc-harness-workspace` (the private workspace root) | `devscene-workspace` | root `package.json`, `package-lock.json` |
| `autonomous-sdlc-harness-placeholders` (the `$RUNNER_TEMP` manifest directory) | `devscene-placeholders` | everywhere |
| `autonomous-sdlc-harness--v<version>` (the release tag) and the tag message `autonomous-sdlc-harness <version>` | `devscene--v<version>` and `devscene <version>` | everywhere |
| `firu-daniel/autonomous-sdlc-harness` (any URL or marketplace `repo` slug) | `firu-daniel/devscene` | everywhere |
| `# >>> autonomous-sdlc-harness (managed block: …) >>>` (the managed `.gitignore` block header) | `# >>> devscene (managed block: …) >>>`, the rest of the line byte-identical | `cli/src/generators/repoRoot.ts`, `.gitignore`, `examples/notes-app/.gitignore`, `scripts/publish-main.sh`, the test that pins it |
| the product named in prose or as a title: a heading, `NOTICE` line 1, the subject of a sentence that is not inside backticks, a command or a path | `DevScene` | everywhere |

- **The category noun stays.** A description reads "DevScene, an autonomous SDLC harness for Claude Code". Never delete the word "harness" from prose, and never rename an identifier that carries "harness" without the full product name.
- **`cli/src/core/pluginIdentity.ts` → `PLUGIN_NAME` is the single source for the generated files** (`enabledPlugins` key, the task-offer template's `{{pluginName}}`, `ANALYZE_COMMAND`, `USER_REVIEW_COMMAND`, `MENTION_COMMAND`). Prose quotes the name literally, so prose changes by hand.
- **Measured records.** Some text records a measurement: a command that was run, its verbatim output, a path or version observed on a stated date. The task prompt's done-when admits no surviving literal there, so the name is respelled to the new one. But a record that silently claims `devscene` was measured would be false. So each **document under `docs/`** whose measured text a task respells gains this sentence once, placed directly under its opening statement of what it is: *"Measurements recorded in this document before the product was renamed DevScene were taken under its earlier name; the name in their quoted commands, paths and messages has been respelled to `devscene`, and nothing else in them was changed."* A **source comment** that records a measurement (the watcher's `# THE SPELLING OF THESE THREE IS MEASURED, NOT ASSUMED.` block, `cli/src/commands/init.ts`'s `Headless first-message leg, re-measured:` paragraph) gains the parenthesis *"(Taken under the product's earlier name; only the name is respelled here.)"* at the end of the sentence that names the version measured. Nothing else in a record changes: no version, date, run id, count or other wording.
- **What keeps the old name, and why.** (1) `cli/test/fixtures/harness-control-0.6.1.yml`, which records the bytes of the 0.6.1 release and is read by `cli/test/trigger-workflow-init.test.mjs`. (2) The frozen capture in `examples/notes-app/`: `sdlc-harness/**` and the prose of `.claude/CLAUDE.md` and `.claude/context/*.md` (`examples/notes-app/README.md` → *"The capture is frozen; the fixture is live"*). (3) The one historical-name line Task 27 adds to `examples/notes-app/README.md`. (4) Everything under `harness-runs/`, which is history. Everything else changes.
- **`.claude/**` is written by the maintainer, never by a task.** The tool layer refuses an agent's write under `.claude/**` ahead of any permission entry, and an attempted write there can park the run. This holds for this repository's `.claude/` and for `examples/notes-app/.claude/`. So Task 27 and Task 28 each record an exact paste in their own per-task file, under `## Paste record`, and the maintainer applies it (**Manual setup required** below). The two conventions documents that carry the old name, `.claude/context/conventions.md` and `.claude/context/cli.md`, are no task's target at all. They are raised as `stale-rule` corpus staleness for a hand edit.
- **Test files are edited by the task that can run them green.** A test that pins a name is edited only after every producer it pins has landed, and each test file belongs to exactly one task. So the cli producer tasks (1–6) carry no test edits except Task 4, whose two workflow suites pin only the workflow templates it edits and the constants Task 1 owns. The four test tasks (7–10) follow. **The shared rule: a cli suite that reads a root-level producer ships after that producer.** Three suites read files at this repository's root rather than only templates and `cli/src`:
  - `cli/test/init.test.mjs` reads this workspace's `plugin/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` (its rendered-offer case, `pluginKey()`, and the shipped-manifests owner case). Their producers are Task 11 (`plugin`) and Task 14 (`general`), so before those land, `PLUGIN_KEY` renders `devscene@devscene` while the manifests still say the old name, and the suite cannot pass.
  - `cli/test/gate12-sandbox-round-plant.test.mjs` reads `scripts/lib/gate12-sandbox-round/plants.sh` (Task 16).
  - `cli/test/sandbox-probe-job-launch.test.mjs` sources `scripts/lib/harness-run-lib.sh` (Task 17).

  So all three belong to one cli task, Task 18, which ships right after Task 17 rather than with the other cli tasks. `cli/test/helpers/fixture.mjs` stays with Task 7, because Tasks 8–10 import it. That is the one place the readiness list leaves the `cli` → `plugin` → `general` order, and it does so because the dependency points from the `plugin` and catch-all layers into `cli/test/`.
- **The self-adopted copies follow their templates byte for byte, except the rendered ones.** `scripts/{autonomous-notify.sh, autonomous-watcher.sh, cleanup-merged-worktrees.sh, create-worktree.sh, docs-search-server.sh, flow-walker.sh, lib/harness-run-lib.sh, prompt-injection-screen.sh, remote-run.sh, restart-watcher.sh}` are byte-identical to their `cli/templates/` counterparts today (`git diff --no-index --stat cli/templates/scripts scripts` lists each as `0`). Task 17 copies the renamed templates over them, rather than editing each by hand. `scripts/test.sh`, `scripts/typecheck.sh` and `githooks/pre-push` are **rendered** copies and are never copied over: `githooks/pre-push` carries the rendered `main|dev)` arm in place of the template's `{{protectedBranchesCase}})` and a hand-added `publish)` refusal, in mode `100755`. Task 17 changes only their line-2 header.
- **`harness.config.json` → `projectName` becomes `devscene`.** It is the stem of run-copy directory names and of the permission profile's sibling glob, and the watcher reads it from the main checkout, so this run is unaffected. The guard library's `hc_project_name` (`plugin/hooks/lib/harness-config-lib.sh`) reads it from the run copy at run time, so after Task 14 its sibling-worktree arms match `<work_root>/devscene-*`. That is harmless for Tasks 15–28: each of them works only inside the run copy's own root, which the root arms match whatever `projectName` says. Task 14's file gives the detail. After merge the maintainer regenerates the machine-local profile (**Manual setup required**).

**Order.** Tasks 1–6 change the `cli` producers: identity constants, the rest of `cli/src`, the non-script templates, the workflow templates with their two suites, then the script templates in two halves. Tasks 7–10 respell the `cli/test` suites that pin them. Tasks 11–13 are `plugin`. Tasks 14–17 are the root manifests, the release tooling, the probe and gate scripts, and the self-adopted mirrors. Task 18 is the cli suites that read root-level producers: `init.test.mjs`, which reads the plugin and marketplace manifests (Tasks 11 and 14), and the two suites that read the probe scripts and mirrors (Tasks 16 and 17). Tasks 19–26 are the root documents, `llms.txt` with its gate, schemas, evals, the Python service and `docs/`. Tasks 27–28 are the worked example and this repository's own `.claude/` paste records.

**Top risks:**
- **A mirror pair drifts.** Several names are stated twice by design: `MACHINE_DIR_NAME` and the shell `hr_cache_dir` / `hr_config_dir` / `hr_state_dir`; `KEEP_AWAKE_WHO` and `HR_KEEP_AWAKE_WHO`; `RUNTIME_CLI_RELATIVE` and `docs-search-server.sh`'s entry path; `MENTION_COMMAND` in TypeScript and `remote-run.sh`; the `.gitignore` block header and `publish-main.sh`'s strip pattern; the release-tag shape in `tag-release.sh`, `release-npm.yml` and the two workflow templates. Each half of a pair is named in its owning task together with its partner, and the suites that hold the pairs together run in Tasks 4, 7, 9 and 10.
- **A measured record is falsified.** Respelling a recorded command or message without saying so would make `docs/` claim `devscene` was measured. Every docs task applies the measured-records rule above and adds the disclosure sentence exactly once per document it touches that way.
- **The done-when grep cannot reach zero inside this run.** `.claude/**` is the maintainer's to edit, so `git grep -n 'autonomous-sdlc-harness' -- . ':!harness-runs'` still lists `.claude/` hits until the pastes from Tasks 27 and 28 and the two conventions-document hand edits (`## Corpus staleness`) land. Task 28's file records the exact remaining set and its reason, so the closing report can list every hit.

**Manual setup required:**
- **Before merge:** apply Task 27's `## Paste record` to `examples/notes-app/.claude/` (depends on Task 27).
- **Before merge:** apply Task 28's `## Paste record` to this repository's `.claude/CLAUDE.md`, `.claude/harness-task-offer.md` and `.claude/push-notify.env.example`, and hand-edit `.claude/context/conventions.md` and `.claude/context/cli.md` with the two exact line replacements in this index's `## Corpus staleness` section, at its end (depends on Task 28).
- **At merge, together:** rename the GitHub repository to `firu-daniel/devscene`; then apply Task 28's `.claude/settings.json` paste, remove the old plugin, and install the new one with `claude plugin marketplace add firu-daniel/devscene` and `claude plugin install devscene@devscene`. The settings change and the plugin reinstall go together: a session reading the new `enabledPlugins` key before the plugin is installed under that name loads no plugin (depends on Tasks 11, 14 and 28).
- **Before the first post-merge run on this machine:** stop the old watcher daemon with the old CLI's `daemon stop`, while its `com.autonomous-sdlc-harness.watcher.<slug>` label is still the one installed; move `~/.config/autonomous-sdlc-harness/push.env` and `watcher.env` to `~/.config/devscene/`; then run `npx devscene daemon install`. The new CLI reads only the `devscene` machine directories and labels (depends on Tasks 1, 5 and 6).
- **After merge:** move `.claude/settings.autonomous.json` aside and run `npx devscene init` once in the main checkout. The profile is written create-if-absent, so a fresh one is what carries the `devscene-*` sibling glob for the new `projectName` (depends on Task 14).
- **First release:** configure npm trusted publishing for the new `devscene` package name (the release workflow publishes over OIDC), then publish the `devscene` npm package and tag `devscene--v<version>` with `scripts/tag-release.sh`. A remote run fetches the plugin from that tag, so remote runs fail until it exists. Deprecate the old npm package (depends on Task 15).

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. The committer flips each entry to `[x]` as that task's commit lands. **Only the committing role flips a marker.** In every flow that dispatches one, that role is the `committer` agent. In the supervised flow, which dispatches none, it is the orchestrator itself. An implementer never changes a marker here and never edits any other line of this section while a run is iterating this index. `[ ]` markers anywhere else, such as sub-step bullets inside per-task files, are informational only. They are never the iteration source, and the committer does not touch them.

Each entry maps 1:1 to `harness-runs/task_plans/chore_rename_to_devscene/task_<K>_plan.md`. Entries run in ship order. Task 18 sits among the `general` tasks for the reason `## Context` gives.

1. [x] **Task 1** — Rename the identity constants and the package manifest: `PLUGIN_NAME`, `MARKETPLACE_NAME`, `MACHINE_DIR_NAME`, the launchd label, `KEEP_AWAKE_WHO`, `RUNTIME_CLI_RELATIVE`, the `.gitignore` block header, `cli/package.json` and `cli/NOTICE` _(layer: cli)_ _(points: 15)_
2. [x] **Task 2** — Respell every remaining `cli/src` string and comment _(layer: cli)_ _(points: 20)_
3. [x] **Task 3** — Respell the non-script templates, the daemon unit templates and `cli/README.md` _(layer: cli)_ _(points: 15)_
4. [x] **Task 4** — Respell the four workflow templates and the two suites that pin them _(layer: cli)_ _(points: 20)_
5. [x] **Task 5** — Respell the watcher, `remote-run.sh`, the notifier and `restart-watcher.sh` templates _(layer: cli)_ _(points: 20)_
6. [x] **Task 6** — Respell the shared run library and the remaining script templates _(layer: cli)_ _(points: 15)_
7. [x] **Task 7** — Respell the `daemon`, stack-preset and retrieval suites and the shared fixture helper _(layer: cli)_ _(points: 15)_
8. [x] **Task 8** — Respell the `doctor` suite _(layer: cli)_ _(points: 20)_
9. [x] **Task 9** — Respell the suites that pin the shell library's machine paths and the script templates _(layer: cli)_ _(points: 15)_
10. [x] **Task 10** — Respell the watcher, remote and prompt-injection suites _(layer: cli)_ _(points: 20)_
11. [x] **Task 11** — Rename the plugin manifest, add `displayName`, and respell the plugin README, agents, flow whiteboard and samples _(layer: plugin)_ _(points: 15)_
12. [ ] **Task 12** — Respell every command reference under `plugin/commands/` _(layer: plugin)_ _(points: 15)_
13. [ ] **Task 13** — Respell every command reference under `plugin/instructions/` _(layer: plugin)_ _(points: 15)_
14. [ ] **Task 14** — Rename the marketplace manifest, the workspace root and the root identity files _(layer: general)_ _(points: 10)_
15. [ ] **Task 15** — Rename the release tooling: the npm release workflow, `release.sh`, `publish-main.sh` and `tag-release.sh` _(layer: general)_ _(points: 10)_
16. [ ] **Task 16** — Respell the sandbox-probe and gate-12 scripts, the command-spelling gate and `run-gates.sh` _(layer: general)_ _(points: 15)_
17. [ ] **Task 17** — Bring this repository's self-adopted script and hook copies to the renamed template bytes _(layer: general)_ _(points: 10)_
18. [ ] **Task 18** — Respell the three cli suites that read this repository's own root-level files: `init`, the gate-12 plant and the sandbox-probe job launch _(layer: cli)_ _(points: 18)_
19. [ ] **Task 19** — Retitle and relink `llms.txt` and move its gate to the new title and URL _(layer: general)_ _(points: 15)_
20. [ ] **Task 20** — Retitle and respell `README.md`, `ARCHITECTURE.md` and `ROADMAP.md` _(layer: general)_ _(points: 15)_
21. [ ] **Task 21** — Respell `schemas/`, `evals/` and the Python docs-retrieval service _(layer: general)_ _(points: 15)_
22. [ ] **Task 22** — Respell `docs/development.md`, the gate contracts included _(layer: general)_ _(points: 20)_
23. [ ] **Task 23** — Respell the CLI, analyze, config, watcher and outer-loop reference documents _(layer: general)_ _(points: 20)_
24. [ ] **Task 24** — Respell the remote-execution and GitHub run-control documents _(layer: general)_ _(points: 20)_
25. [ ] **Task 25** — Respell the sandbox records and the orchestrator cost measurement _(layer: general)_ _(points: 15)_
26. [ ] **Task 26** — Respell the retrieval documents and the research directories _(layer: general)_ _(points: 20)_
27. [ ] **Task 27** — Mark the example's capture as historical, respell its live files, and record the example `.claude/` paste _(layer: general)_ _(points: 15)_
28. [ ] **Task 28** — Record this repository's `.claude/` paste and the remaining-hit report _(layer: general)_ _(points: 8)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"**Replace every `autonomous-sdlc-harness` literal** in what ships or documents the product: `plugin/`, `cli/` (sources, templates, scripts, README), `schemas/`, `docs/`, `examples/`, the root documents, `llms.txt`, `funding.json`, `package.json` and the `.claude-plugin/` manifests."* The done-when sharpens it: *"`git grep -n 'autonomous-sdlc-harness' -- . ':!harness-runs'` returns only: the captured example artifacts; recorded-release fixtures; the one historical-name line in the example README."*

**Derivation entry D1 — durable corpus files (command).** Re-run verbatim from the checkout root. It is the done-when's own search, minus `cli/src` and `cli/test`, which are application source and owe no register rows (Tasks 1, 2, 4, 7–10 and 18 own them):
`git grep -l -F 'autonomous-sdlc-harness' -- . ':!harness-runs' ':!cli/src' ':!cli/test'`

**Derivation entry D2 — standing-artifact rows (procedure).** **First step, runnable:** `grep -nE '^## |^- |^_Written' harness-runs/lessons.md harness-runs/improvement_suggestions.md harness-runs/README.md`. **Artifact:** the standing files at the root of `harness-runs/`: the lessons ledger, the improvement-suggestions ledger and the tree's README. **Traversal:** each file in that order; within a file, its `## ` headings in file order, then the `- ` rule lines and the closing `_Written by …_` line under each. **Decision rule:** a line is reached when it carries `autonomous-sdlc-harness`, or when it constrains how a product name, a command or a wire identifier is written.

**Closure invariant:** every site either entry reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `.claude-plugin/marketplace.json` | — | D1 | `change` | Task 14 |
| 2 | `.claude/CLAUDE.md` | this repository's render | D1 | `no-change` | The tool layer refuses an agent's write under `.claude/**`. Task 28 records the paste; the maintainer applies it |
| 3 | `.claude/context/cli.md` | — | D1 | `no-change` | A conventions document is never a task target. Its "npm package `autonomous-sdlc-harness`" line is raised as a `stale-rule` entry in this index's `## Corpus staleness` section, with the exact replacement line |
| 4 | `.claude/context/conventions.md` | — | D1 | `no-change` | As row 3, for its `## The layers` table row |
| 5 | `.claude/harness-task-offer.md` | this repository's render | D1 | `no-change` | As row 2 |
| 6 | `.claude/push-notify.env.example` | this repository's render | D1 | `no-change` | As row 2 |
| 7 | `.claude/settings.json` | this repository's render | D1 | `no-change` | As row 2. Applied at merge together with the plugin reinstall |
| 8 | `.gitattributes` | this repository's render | D1 | `change` | Task 14 |
| 9 | `.github/workflows/release-npm.yml` | — | D1 | `change` | Task 15 |
| 10 | `.gitignore` | this repository's render | D1 | `change` | Task 14 |
| 11 | `ARCHITECTURE.md` | — | D1 | `change` | Task 20 |
| 12 | `NOTICE` | — | D1 | `change` | Task 14 |
| 13 | `README.md` | — | D1 | `change` | Task 20 |
| 14 | `ROADMAP.md` | — | D1 | `change` | Task 20 |
| 15 | `cli/NOTICE` | — | D1 | `change` | Task 1 |
| 16 | `cli/README.md` | — | D1 | `change` | Task 3 |
| 17 | `cli/package.json` | — | D1 | `change` | Task 1 |
| 18 | `cli/scripts/daemon/launchd.plist.template` | — | D1 | `change` | Task 3 |
| 19 | `cli/scripts/daemon/systemd.service.template` | — | D1 | `change` | Task 3 |
| 20 | `cli/templates/claude/CLAUDE.md` | template | D1 | `change` | Task 3 |
| 21 | `cli/templates/claude/README.md` | template | D1 | `change` | Task 3 |
| 22 | `cli/templates/claude/context/api.md` | template | D1 | `change` | Task 3 |
| 23 | `cli/templates/claude/context/conventions.md` | template | D1 | `change` | Task 3. A template an adopter receives, not this repository's conventions document |
| 24 | `cli/templates/claude/context/data-layer.md` | template | D1 | `change` | Task 3 |
| 25 | `cli/templates/claude/context/data-storage.md` | template | D1 | `change` | Task 3 |
| 26 | `cli/templates/claude/context/docs-catalog.md` | template | D1 | `change` | Task 3 |
| 27 | `cli/templates/claude/context/domain.md` | template | D1 | `change` | Task 3 |
| 28 | `cli/templates/claude/context/layer.md` | template | D1 | `change` | Task 3 |
| 29 | `cli/templates/claude/context/module.md` | template | D1 | `change` | Task 3 |
| 30 | `cli/templates/claude/context/package.md` | template | D1 | `change` | Task 3 |
| 31 | `cli/templates/claude/context/presentation.md` | template | D1 | `change` | Task 3 |
| 32 | `cli/templates/claude/context/state-slices.md` | template | D1 | `change` | Task 3 |
| 33 | `cli/templates/claude/context/tests.md` | template | D1 | `change` | Task 3 |
| 34 | `cli/templates/claude/harness-task-offer.md` | template | D1 | `change` | Task 3 |
| 35 | `cli/templates/claude/push-notify.env.example` | template | D1 | `change` | Task 3 |
| 36 | `cli/templates/claude/qa-accounts.env.example` | template | D1 | `change` | Task 3 |
| 37 | `cli/templates/claude/qa_test_scenarios.md` | template | D1 | `change` | Task 3 |
| 38 | `cli/templates/claude/settings.autonomous.json` | template | D1 | `change` | Task 3 |
| 39 | `cli/templates/claude/settings.autonomous.qa.json` | template | D1 | `change` | Task 3 |
| 40 | `cli/templates/claude/settings.autonomous.retrieval.json` | template | D1 | `change` | Task 3 |
| 41 | `cli/templates/githooks/pre-push` | template | D1 | `change` | Task 3 |
| 42 | `cli/templates/github/workflows/harness-control.yml` | template | D1 | `change` | Task 4 |
| 43 | `cli/templates/github/workflows/harness-resume.yml` | template | D1 | `change` | Task 4 |
| 44 | `cli/templates/github/workflows/harness-run.yml` | template | D1 | `change` | Task 4 |
| 45 | `cli/templates/github/workflows/harness-trigger.yml` | template | D1 | `change` | Task 4 |
| 46 | `cli/templates/repo/gitattributes` | template | D1 | `change` | Task 3 |
| 47 | `cli/templates/repo/mcp.json` | template | D1 | `change` | Task 3 |
| 48 | `cli/templates/repo/mcp.retrieval.json` | template | D1 | `change` | Task 3 |
| 49 | `cli/templates/scripts/README.md` | template | D1 | `change` | Task 6 |
| 50 | `cli/templates/scripts/autonomous-notify.sh` | template | D1 | `change` | Task 5 |
| 51 | `cli/templates/scripts/autonomous-watcher.sh` | template | D1 | `change` | Task 5 |
| 52 | `cli/templates/scripts/cleanup-merged-worktrees.sh` | template | D1 | `change` | Task 6 |
| 53 | `cli/templates/scripts/create-worktree.sh` | template | D1 | `change` | Task 6 |
| 54 | `cli/templates/scripts/deploy.sh` | template | D1 | `change` | Task 6 |
| 55 | `cli/templates/scripts/docs-search-server.sh` | template | D1 | `change` | Task 6 |
| 56 | `cli/templates/scripts/flow-walker.sh` | template | D1 | `change` | Task 6 |
| 57 | `cli/templates/scripts/lib/harness-run-lib.sh` | template | D1 | `change` | Task 6 |
| 58 | `cli/templates/scripts/prompt-injection-screen.sh` | template | D1 | `change` | Task 6 |
| 59 | `cli/templates/scripts/remote-run.sh` | template | D1 | `change` | Task 5 |
| 60 | `cli/templates/scripts/restart-watcher.sh` | template | D1 | `change` | Task 5 |
| 61 | `cli/templates/scripts/start-dev-server.sh` | template | D1 | `change` | Task 6 |
| 62 | `cli/templates/scripts/test.sh` | template | D1 | `change` | Task 6 |
| 63 | `cli/templates/scripts/typecheck.sh` | template | D1 | `change` | Task 6 |
| 64 | `cli/templates/state-dir/README-root.md` | template | D1 | `change` | Task 3 |
| 65 | `cli/templates/state-dir/improvement_suggestions.md` | template | D1 | `change` | Task 3 |
| 66 | `cli/templates/state-dir/lessons.md` | template | D1 | `change` | Task 3 |
| 67 | `cli/templates/state-dir/run_analytics/README.md` | template | D1 | `change` | Task 3 |
| 68 | `cli/templates/state-dir/scratch/README.md` | template | D1 | `change` | Task 3 |
| 69 | `docs-retrieval-service/src/harness_docs_retrieval/service.py` | — | D1 | `change` | Task 21. Only the literal changes; the `harness_docs_retrieval` package name is out of scope |
| 70 | `docs-retrieval-service/tests/test_http_app.py` | — | D1 | `change` | Task 21 |
| 71 | `docs-retrieval-service/tests/test_service.py` | — | D1 | `change` | Task 21 |
| 72 | `docs/analyze.md` | — | D1 | `change` | Task 23 |
| 73 | `docs/cli.md` | — | D1 | `change` | Task 23 |
| 74 | `docs/config.md` | — | D1 | `change` | Task 23 |
| 75 | `docs/copilot-foundry-research.md` | — | D1 | `change` | Task 26 |
| 76 | `docs/development.md` | — | D1 | `change` | Task 22 |
| 77 | `docs/flow-graph-walker.md` | — | D1 | `change` | Task 23 |
| 78 | `docs/github-integration-research.md` | — | D1 | `change` | Task 26 |
| 79 | `docs/github-issue-trigger.md` | — | D1 | `change` | Task 24 |
| 80 | `docs/github-run-control.md` | — | D1 | `change` | Task 24 |
| 81 | `docs/orchestrator-cost-measurement.md` | — | D1 | `change` | Task 25 |
| 82 | `docs/outer-loop-verification.md` | — | D1 | `change` | Task 23 |
| 83 | `docs/rag-extraction-research/01-current-mechanism.md` | — | D1 | `change` | Task 26 |
| 84 | `docs/rag-extraction-research/07-extraction-plan.md` | — | D1 | `change` | Task 26 |
| 85 | `docs/rag-extraction-research/README.md` | — | D1 | `change` | Task 26 |
| 86 | `docs/rag-extraction-research/reviews/01-current-mechanism.md` | — | D1 | `change` | Task 26 |
| 87 | `docs/rag-extraction-research/reviews/07-extraction-plan.md` | — | D1 | `change` | Task 26 |
| 88 | `docs/remote-execution.md` | — | D1 | `change` | Task 24 |
| 89 | `docs/retrieval-eval-results.md` | — | D1 | `change` | Task 26 |
| 90 | `docs/retrieval-eval.md` | — | D1 | `change` | Task 26 |
| 91 | `docs/retrieval.md` | — | D1 | `change` | Task 26 |
| 92 | `docs/sandbox-placeholder-upstream-report.md` | — | D1 | `change` | Task 25 |
| 93 | `docs/sandbox-record.md` | — | D1 | `change` | Task 25 |
| 94 | `docs/sandbox-verification.md` | — | D1 | `change` | Task 25 |
| 95 | `docs/watcher.md` | — | D1 | `change` | Task 23 |
| 96 | `docs/work-report-research/README.md` | — | D1 | `change` | Task 26 |
| 97 | `docs/work-report-research/branch-reviewer.md` | — | D1 | `change` | Task 26 |
| 98 | `docs/work-report-research/conventions-reviewer.md` | — | D1 | `change` | Task 26 |
| 99 | `docs/work-report-research/qa-tester.md` | — | D1 | `change` | Task 26 |
| 100 | `docs/work-report-research/reviews/qa-tester.md` | — | D1 | `change` | Task 26 |
| 101 | `docs/work-report-research/reviews/skeptic-reviewer.md` | — | D1 | `change` | Task 26 |
| 102 | `docs/work-report-research/reviews/task-plan-reviewer.md` | — | D1 | `change` | Task 26 |
| 103 | `docs/work-report-research/skeptic-reviewer.md` | — | D1 | `change` | Task 26 |
| 104 | `docs/work-report-research/statistics-plan-writer.md` | — | D1 | `change` | Task 26 |
| 105 | `docs/work-report-research/task-plan-reviewer.md` | — | D1 | `change` | Task 26 |
| 106 | `docs/work-report-research/task-plan-writer.md` | — | D1 | `change` | Task 26 |
| 107 | `docs/work-report-research/ui-tests-plan-writer.md` | — | D1 | `change` | Task 26 |
| 108 | `docs/work-report-research/user-review-fix-plan-writer.md` | — | D1 | `change` | Task 26 |
| 109 | `evals/README.md` | — | D1 | `change` | Task 21 |
| 110 | `evals/docs-retrieval/check-floor.mjs` | — | D1 | `change` | Task 21 |
| 111 | `evals/plan-shape/case.yaml` | — | D1 | `change` | Task 21 |
| 112 | `evals/plan-shape/prompt.md` | — | D1 | `change` | Task 21 |
| 113 | `evals/plan-shape/scaffold.sh` | — | D1 | `change` | Task 21 |
| 114 | `evals/prompt-injection-reviewer/README.md` | — | D1 | `change` | Task 21 |
| 115 | `evals/prompt-injection-reviewer/fixtures/authority-claim.hostile.md` | — | D1 | `change` | Task 21. A hand-written eval input, not a recorded capture |
| 116 | `evals/prompt-injection-reviewer/fixtures/clean.benign.md` | — | D1 | `change` | Task 21 |
| 117 | `evals/prompt-injection-reviewer/fixtures/harness-weakening.hostile.md` | — | D1 | `change` | Task 21 |
| 118 | `evals/prompt-injection-reviewer/fixtures/hidden-instruction.hostile.md` | — | D1 | `change` | Task 21 |
| 119 | `evals/prompt-injection-reviewer/fixtures/unrelated-request.benign.md` | — | D1 | `change` | Task 21 |
| 120 | `evals/prompt-injection-reviewer/fixtures/unrelated-request.hostile.md` | — | D1 | `change` | Task 21 |
| 121 | `examples/notes-app/.claude/CLAUDE.md` | capture | D1 | `no-change` | Frozen capture (`examples/notes-app/README.md` → *"The capture is frozen; the fixture is live"*) |
| 122 | `examples/notes-app/.claude/harness-task-offer.md` | worked example's render | D1 | `no-change` | A live render, but under `.claude/**`: Task 27 records the paste; the maintainer applies it |
| 123 | `examples/notes-app/.claude/push-notify.env.example` | worked example's render | D1 | `no-change` | As row 122 |
| 124 | `examples/notes-app/.claude/qa-accounts.env.example` | worked example's render | D1 | `no-change` | As row 122 |
| 125 | `examples/notes-app/.claude/qa_test_scenarios.md` | worked example's render | D1 | `no-change` | As row 122 |
| 126 | `examples/notes-app/.claude/settings.autonomous.json` | worked example's render | D1 | `no-change` | As row 122 |
| 127 | `examples/notes-app/.claude/settings.json` | worked example's render | D1 | `no-change` | As row 122 |
| 128 | `examples/notes-app/.gitattributes` | worked example's render | D1 | `change` | Task 27 |
| 129 | `examples/notes-app/.gitignore` | worked example's render | D1 | `change` | Task 27 |
| 130 | `examples/notes-app/.mcp.json` | worked example's render | D1 | `change` | Task 27. Its README holds it semantically identical to `cli/templates/repo/mcp.json`, which Task 3 changes |
| 131 | `examples/notes-app/README.md` | — | D1 | `change` | Task 27, which also adds the one historical-name line that keeps the old literal |
| 132 | `examples/notes-app/githooks/pre-push` | worked example's render | D1 | `change` | Task 27 |
| 133 | `examples/notes-app/scripts/start-dev-server.sh` | worked example's render | D1 | `change` | Task 27 |
| 134 | `examples/notes-app/scripts/test.sh` | worked example's render | D1 | `change` | Task 27 |
| 135 | `examples/notes-app/scripts/typecheck.sh` | worked example's render | D1 | `change` | Task 27 |
| 136 | `examples/notes-app/sdlc-harness/lessons.md` | capture | D1 | `no-change` | Frozen capture. Task 27 corrects the README sentence that says it is byte-identical to the template |
| 137 | `funding.json` | — | D1 | `change` | Task 14 |
| 138 | `githooks/pre-push` | adopted copy (rendered) | D1 | `change` | Task 17, header line only: the copy is rendered (the protected-branch arm `main` / `dev` in place of row 41's `{{protectedBranchesCase}})`) and hand-extended with a `publish)` arm, so it is never copied over |
| 139 | `harness.config.json` | — | D1 | `change` | Task 14 (`projectName`) |
| 140 | `llms.txt` | — | D1 | `change` | Task 19 |
| 141 | `package-lock.json` | — | D1 | `change` | Task 14 |
| 142 | `package.json` | — | D1 | `change` | Task 14 |
| 143 | `plugin/.claude-plugin/plugin.json` | — | D1 | `change` | Task 11 |
| 144 | `plugin/README.md` | — | D1 | `change` | Task 11 |
| 145 | `plugin/agents/README.txt` | — | D1 | `change` | Task 11 |
| 146 | `plugin/agents/committer.md` | — | D1 | `change` | Task 11 |
| 147 | `plugin/agents/conventions-reviewer.md` | — | D1 | `change` | Task 11 |
| 148 | `plugin/agents/conventions-writer.md` | — | D1 | `change` | Task 11 |
| 149 | `plugin/agents/task-plan-writer.md` | — | D1 | `change` | Task 11 |
| 150 | `plugin/commands/README.txt` | — | D1 | `change` | Task 12 |
| 151 | `plugin/commands/branch-answer.md` | — | D1 | `change` | Task 12 |
| 152 | `plugin/commands/branch-implement-plan-semi-autonomous.md` | — | D1 | `change` | Task 12 |
| 153 | `plugin/commands/branch-implement-plan.md` | — | D1 | `change` | Task 12 |
| 154 | `plugin/commands/branch-implement-user-review-semi-autonomous.md` | — | D1 | `change` | Task 12 |
| 155 | `plugin/commands/branch-implement-user-review.md` | — | D1 | `change` | Task 12 |
| 156 | `plugin/commands/branch-pause.md` | — | D1 | `change` | Task 12 |
| 157 | `plugin/commands/branch-prompt.md` | — | D1 | `change` | Task 12 |
| 158 | `plugin/commands/branch-qa-test.md` | — | D1 | `change` | Task 12 |
| 159 | `plugin/commands/branch-resume.md` | — | D1 | `change` | Task 12 |
| 160 | `plugin/commands/branch-start-docs-autonomous.md` | — | D1 | `change` | Task 12 |
| 161 | `plugin/commands/branch-start-plan-autonomous.md` | — | D1 | `change` | Task 12 |
| 162 | `plugin/commands/branch-start-plan-semi-autonomous.md` | — | D1 | `change` | Task 12 |
| 163 | `plugin/commands/branch-start-plan.md` | — | D1 | `change` | Task 12 |
| 164 | `plugin/commands/branch-start-user-review-fix-autonomous.md` | — | D1 | `change` | Task 12 |
| 165 | `plugin/commands/branch-status.md` | — | D1 | `change` | Task 12 |
| 166 | `plugin/commands/branch-user-review.md` | — | D1 | `change` | Task 12 |
| 167 | `plugin/commands/harness-analyze.md` | — | D1 | `change` | Task 12 |
| 168 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` | — | D1 | `change` | Task 11 |
| 169 | `plugin/instructions/autonomous_pause_and_ledger.md` | — | D1 | `change` | Task 13 |
| 170 | `plugin/instructions/code_review_fixes_instructions.md` | — | D1 | `change` | Task 13 |
| 171 | `plugin/instructions/code_review_instructions.md` | — | D1 | `change` | Task 13 |
| 172 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` | — | D1 | `change` | Task 13 |
| 173 | `plugin/instructions/improvement_observations_instructions.md` | — | D1 | `change` | Task 13 |
| 174 | `plugin/instructions/mode_contract.md` | — | D1 | `change` | Task 13 |
| 175 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` | — | D1 | `change` | Task 13 |
| 176 | `plugin/instructions/plan_orchestration_instructions_semi_autonomous.md` | — | D1 | `change` | Task 13 |
| 177 | `plugin/instructions/prompt_injection_screen.md` | — | D1 | `change` | Task 13 |
| 178 | `plugin/instructions/qa_test_instructions.md` | — | D1 | `change` | Task 13 |
| 179 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` | — | D1 | `change` | Task 13 |
| 180 | `plugin/instructions/task_plan_writing_instructions_semi_autonomous.md` | — | D1 | `change` | Task 13 |
| 181 | `plugin/instructions/user_review_fix_plan_writing_instructions.md` | — | D1 | `change` | Task 13 |
| 182 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` | — | D1 | `change` | Task 13 |
| 183 | `plugin/instructions/user_review_fixes_instructions.md` | — | D1 | `change` | Task 13 |
| 184 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` | — | D1 | `change` | Task 13 |
| 185 | `plugin/instructions/user_review_fixes_instructions_semi_autonomous.md` | — | D1 | `change` | Task 13 |
| 186 | `plugin/samples/sample_task_plan.md` | — | D1 | `change` | Task 11 |
| 187 | `plugin/samples/sample_user_review.md` | — | D1 | `change` | Task 11 |
| 188 | `schemas/harness.config.schema.json` | — | D1 | `change` | Task 21 |
| 189 | `schemas/negative/README.md` | — | D1 | `change` | Task 21 |
| 190 | `scripts/autonomous-notify.sh` | adopted copy | D1 | `change` | Task 17, byte copy of row 50 |
| 191 | `scripts/autonomous-watcher.sh` | adopted copy | D1 | `change` | Task 17, byte copy of row 51 |
| 192 | `scripts/check-command-spelling.sh` | — | D1 | `change` | Task 16 |
| 193 | `scripts/check-llms-txt.sh` | — | D1 | `change` | Task 19 |
| 194 | `scripts/cleanup-merged-worktrees.sh` | adopted copy | D1 | `change` | Task 17, byte copy of row 52 |
| 195 | `scripts/create-worktree.sh` | adopted copy | D1 | `change` | Task 17, byte copy of row 53 |
| 196 | `scripts/docs-search-server.sh` | adopted copy | D1 | `change` | Task 17, byte copy of row 55 |
| 197 | `scripts/flow-walker.sh` | adopted copy | D1 | `change` | Task 17, byte copy of row 56 |
| 198 | `scripts/lib/gate12-sandbox-round/core.sh` | — | D1 | `change` | Task 16 |
| 199 | `scripts/lib/gate12-sandbox-round/plants.sh` | — | D1 | `change` | Task 16 |
| 200 | `scripts/lib/harness-run-lib.sh` | adopted copy | D1 | `change` | Task 17, byte copy of row 57 |
| 201 | `scripts/lib/sandbox-probe/legs-protection.sh` | — | D1 | `change` | Task 16 |
| 202 | `scripts/lib/sandbox-probe/preflight.sh` | — | D1 | `change` | Task 16 |
| 203 | `scripts/prompt-injection-screen.sh` | adopted copy | D1 | `change` | Task 17, byte copy of row 58 |
| 204 | `scripts/publish-main.sh` | — | D1 | `change` | Task 15 |
| 205 | `scripts/release.sh` | — | D1 | `change` | Task 15 |
| 206 | `scripts/remote-run.sh` | adopted copy | D1 | `change` | Task 17, byte copy of row 59 |
| 207 | `scripts/restart-watcher.sh` | adopted copy | D1 | `change` | Task 17, byte copy of row 60 |
| 208 | `scripts/run-gates.sh` | — | D1 | `change` | Task 16 |
| 209 | `scripts/sandbox-probe-runner.yml` | — | D1 | `change` | Task 16 |
| 210 | `scripts/tag-release.sh` | — | D1 | `change` | Task 15 |
| 211 | `scripts/test.sh` | adopted copy (rendered) | D1 | `change` | Task 17, header line only; the body is this repository's own command |
| 212 | `scripts/typecheck.sh` | adopted copy (rendered) | D1 | `change` | Task 17, header line only |
| 213 | `harness-runs/lessons.md` → *"Name an adopter-facing surface with the term adopters already arrive with … never the configuration key, tool name, check id or any other wire identifier."* | — | D2, constrains how a name is written | `no-change` | The rule stands and binds: this branch renames no configuration key, tool name or check id, which the task prompt leaves to later branches. The product's own machine name changes on the user's explicit instruction, with no alias because backward compatibility is out of scope |
| 214 | `harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block, one command per line …"* | — | D2, constrains how a command is written | `no-change` | The rule stands and binds Tasks 3, 19, 20 and 27: a respelled command stays in its fenced block, and no new inline command is introduced |
| 215 | `harness-runs/lessons.md` → closing `_Written by \`autonomous-sdlc-harness init\` …_` line | — | D2, carries the literal | `no-change` | `harness-runs/` is history and stays as recorded (task prompt) |
| 216 | `harness-runs/improvement_suggestions.md` → closing `_Written by …_` line | — | D2, carries the literal | `no-change` | As row 215 |
| 217 | `harness-runs/README.md` → closing `_Written by …_` line | — | D2, carries the literal | `no-change` | As row 215 |

## Corpus staleness

Recommendations only, never tasks: no readiness entry, per-task file or story points owns them. Each one is a hand edit by the maintainer (or a supervised `/devscene:harness-analyze <target>` re-run, once the plugin is reinstalled under its new name). It is applied **before merge**, together with Task 28's `## Paste record` (**Manual setup required** above). Each old line below is quoted from `HEAD` byte for byte, and each new line is a whole-line paste. Exactly one substring changes in each.

- **`stale-rule`** — `.claude/context/conventions.md` → `## The layers`, the `cli` row of the layer table (line 19 at `HEAD`). **Rule falsified:** the row says the `cli` layer owns *"The npm package `autonomous-sdlc-harness`"*. After Task 1 renames `cli/package.json` → `name`, no package by that name exists in this repository. **Restatement:** a hand edit. Replace the line
  ```
  | `cli` | `cli` | The npm package `autonomous-sdlc-harness` — the outer loop (`init`, `doctor`, `config`, `daemon`), and `cli/templates/`, the files `init` writes into an adopting repository | `.claude/context/cli.md` |
  ```
  with
  ```
  | `cli` | `cli` | The npm package `devscene` — the outer loop (`init`, `doctor`, `config`, `daemon`), and `cli/templates/`, the files `init` writes into an adopting repository | `.claude/context/cli.md` |
  ```
- **`stale-rule`** — `.claude/context/cli.md`, the opening `**Read this when:**` line (line 3 at `HEAD`). **Rule falsified:** it says a change under `cli/` lands in *"the npm package `autonomous-sdlc-harness`"*, a package this branch renames (Task 1). **Restatement:** a hand edit. Replace the line
  ```
  > **Read this when:** the change you are implementing or reviewing lands under `cli/` — the npm package `autonomous-sdlc-harness` and the template trees it ships. **Skip when:** it lands under `plugin/` or anywhere else at the root; each has its own document, and the rules that span all of them are in `.claude/context/conventions.md`, which this file assumes has been read.
  ```
  with
  ```
  > **Read this when:** the change you are implementing or reviewing lands under `cli/` — the npm package `devscene` and the template trees it ships. **Skip when:** it lands under `plugin/` or anywhere else at the root; each has its own document, and the rules that span all of them are in `.claude/context/conventions.md`, which this file assumes has been read.
  ```

## Rejected findings

- **Architecture review Should Fix 1 — consolidate the duplicated `const CLI = 'npx …'` into one shared constant** (rejected round 1; rejection accepted by the user in clarification answer 1, Q2 — the branch stays a pure rename) — The duplication across `commands/`, `doctor/`, `generators/`, `retrieval/` and `config/` predates this branch. The task prompt scopes the branch to respelling the product name. Moving five areas onto a new import changes their import graph, which is a refactor rather than a rename. It would also push Tasks 1 and 2 past the five-`Work:`-bullet ceiling, forcing a split that adds ordering risk to a branch with 28 tasks. Task 2 changes only each constant's value and names the follow-up: a `refactor` branch that moves the invocation into `cli/src/core/pluginIdentity.ts` after this branch merges. Should Fix 2 (`displayName` recorded in `docs/development.md` → `## 3.`) is applied in Task 22, not rejected.
