# Story: A remote job installs the plugin version its workflow was rendered for

## Context

Through 0.4.2 the `Install the pinned plugin` step of `cli/templates/github/workflows/harness-run.yml` runs `claude plugin marketplace add "$source_repo"` and `claude plugin install …`, which take the marketplace's default branch as it stands, then refuses when the installed version differs from `HARNESS_CLI_VERSION`. So every release that reaches `main` stops every job rendered for an earlier version. This branch makes the job install **exactly the version its workflow names**. It also gives the adopter one command to move to a new version, has `doctor` say when a workflow names a version other than the CLI running it, and adds the release step that creates what the job installs from. A release of this repository then changes nothing for a repository that has not upgraded. Upgrading stays a deliberate act by the adopter: they re-render, commit and push the workflows themselves. The prompt rejects an auto-update setting, because the harness never commits on the user's behalf and cannot push the default branch.

**The approach chosen, and why the other candidates were not.** The job clones the marketplace repository named in the committed `.claude/settings.json` at the release tag `autonomous-sdlc-harness--v<version>`, into `$RUNNER_TEMP/harness-marketplace`. It adds that clone as a `directory`-sourced marketplace and installs from it. The version check stays as the guard, and both of its refusals name the upgrade route. This is candidate 2's first form. Everything it relies on is either a git operation or a measured runtime behaviour: `marketplace add ./path` is an accepted form that installs a pinned snapshot (`docs/development.md` → `## 1. Source types and the plugin root`, measured on 2.1.246). A directory source's two plugin roots are already resolved by `cli/src/machine/plugins.ts` (`pluginRuntimeRoot`, `pluginInstallRoot`). They are granted by `init --plugin-root-entries` and graded by `doctor --remote-job`, both of which the job already runs. The other candidates were set aside for these reasons:

- **Candidate 1** (a ref in the marketplace source, or a version on install) rests on a CLI surface nobody has measured. The last recorded `--help` output, from 2.1.282, offered neither, and the planner could not run `claude` to re-measure. A `ref` in the committed `extraKnownMarketplaces` entry would also go stale on upgrade, because `.claude/settings.json` is `merge-json`, missing keys only (`cli/src/core/writer.ts` re-run table). Task 6 adds a probe and Task 7 records what the current CLI accepts, so a later branch can swap the clone for a native ref if one exists.
- **Shipping `plugin/` inside the npm package** would make one shipped half carry the other at run time, which `.claude/context/conventions.md` → `## The layers` forbids to an implementing run.
- **Candidate 3, the reusable workflow,** would not pin the plugin by itself: the called workflow still has to install it. It would also move the adopter's tuning into inputs. It rests on unverified `workflow_call` behaviour of `vars`, `run-name`, `concurrency` and `permissions`, which only a Gate 12 round could verify, and Gate 12 is out of scope. It can be layered on later over this pin.

**How the work is cut.** The work is nine single-layer tasks in bottom-up ship order: four `cli` tasks, then five `general` tasks. Nothing lands in `plugin/`: no plugin asset names the workflows' install step, the upgrade route or the release tag. The shared wire strings are defined once, in the task that produces each, and every consuming task restates them:

- the switch `--upgrade-workflows`, exported as `UPGRADE_WORKFLOWS_FLAG` from `cli/src/generators/githubWorkflows.ts`;
- the route `npx autonomous-sdlc-harness@<version> init --upgrade-workflows`, produced by `upgradeWorkflowsCommand(version)` in that module;
- the pin reader `renderedCliVersions(text)` and the constant `CLI_VERSION_VARIABLE` (`'HARNESS_CLI_VERSION'`), both in `cli/src/remote/githubActions.ts`;
- the tag `autonomous-sdlc-harness--v<version>`, annotated, with the message `autonomous-sdlc-harness <version>` — the shape of the one tag that exists, created by hand by the maintainer on 2026-09-09 on the initial commit;
- the two document anchors `docs/remote-execution.md` → `### Upgrading` (under `## 7. Turning it on`, cited as "docs/remote-execution.md, section 7, Upgrading") and `docs/development.md` → `## 7. Releasing`.

**Release tags, and the decisions the prompt asked for.** Main's first-parent history shows version bumps for 0.2.0 (`b67a5e3`), 0.4.0 (`99b429e`), 0.4.1 (`355f1e8`) and 0.4.2 (`4dd0881`). 0.3.0 was bumped on `dev` (`908d822`) but never published to `main` as its own commit. The only existing tag is `autonomous-sdlc-harness--v0.1.0`.

- **Backfill.** The missing tags for published versions are backfilled for the record by the operator, with Task 5's script. No workflow rendered before this fix reads a tag, so nothing depends on them. 0.3.0 cannot be backfilled, and the script refuses it by name.
- **`marketplace.json` → `metadata.version`.** It stays `0.1.0`. It is recorded as the marketplace catalogue's own version, not a release number: `plugin/.claude-plugin/plugin.json` is the sole version of record (`docs/development.md` §3), and the release tag names it.

**Top risks:**

- **The same-name marketplace.** The job's session runs in a checkout whose committed `.claude/settings.json` declares a *github*-sourced marketplace with the same name as the *directory*-sourced one the job just added. If the runtime re-sources it at session start, the session would load the default branch's plugin after the check had passed. Nothing in this repository has measured that. Task 7 records it as unverified in `docs/remote-execution.md` §6, and Task 9 adds the Gate 12 observation that settles it.
- **A missing release tag.** A release published without its tag makes every workflow rendered for that version refuse. Task 5's script makes tagging one command. Task 9 orders it before the npm publication. Task 4's refusal names the missing tag.
- **Lost tuning on upgrade.** Task 1 replaces each workflow only after a `.bak`, only when the pin differs, and carries the cron schedule over. Task 2 reports every `.bak` with the diff command and tests that nothing tuned vanishes without a trace.

**Manual setup required:**

- Backfill the release tags, from a checkout of `dev` at a terminal, once Task 5 has landed. The script refuses to push when stdin is not a terminal, so no agent can do this. Run it once per version: `bash scripts/tag-release.sh 0.2.0`, then `0.4.0`, `0.4.1` and `0.4.2`.
- At the release that carries this fix, run `bash scripts/tag-release.sh <that version>` after its publication pull request lands on `main` and before the npm package is published (Task 5; the steps are documented by Task 9). Without it, every workflow rendered for that version refuses to start.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker to `[x]`:** the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker or edits any other line of this section while a run is iterating this index. `[ ]` markers anywhere else, such as sub-step bullets inside the per-task files, are informational only; the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_remote_plugin_version_pin/task_<K>_plan.md`. Entries are in bottom-up ship order: the `cli` layer first, then the catch-all `general` layer last.

1. [x] **Task 1** — Add the workflow pin reader and an upgrade mode to the workflow generator _(layer: cli)_ _(points: 12)_
2. [x] **Task 2** — Add `init --upgrade-workflows` and report what it re-rendered _(layer: cli)_ _(points: 15)_
3. [x] **Task 3** — Have `doctor`'s `remote-execution` check warn on a workflow rendered for another version _(layer: cli)_ _(points: 10)_
4. [ ] **Task 4** — Install the plugin from the release tag in `harness-run.yml`, with a test that drives two versions _(layer: cli)_ _(points: 18)_
5. [ ] **Task 5** — Add `scripts/tag-release.sh`, which creates the release tag the job installs from _(layer: general)_ _(points: 10)_
6. [ ] **Task 6** — Add `scripts/probe-plugin-cli.sh`, which records what the agent-runner CLI accepts for a plugin install _(layer: general)_ _(points: 5)_
7. [ ] **Task 7** — Document the pinned install and the upgrade route in `docs/remote-execution.md` _(layer: general)_ _(points: 18)_
8. [ ] **Task 8** — Document `--upgrade-workflows` and the version warning in `docs/cli.md` _(layer: general)_ _(points: 10)_
9. [ ] **Task 9** — Document the release steps, the catalogue version and the Gate 12 observation in `docs/development.md` _(layer: general)_ _(points: 15)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Upgrading is one documented route, and ideally one command: an `init` option (or a `doctor` remedy) that re-renders only the two workflows at the current CLI version, keeping or pointing at the adopter's tuning, so the route is not delete, re-init and re-tune by hand."* Together with it: *"`docs/remote-execution.md` gains an *Upgrading* section, and `## 6.`'s row *The plugin cannot be pinned by a ref at install* is updated with what was established."*

**Derivation entry — corpus files (command).** Re-run verbatim from the checkout root:

```
git grep -n -e "upgrade path" -e "re-pins" -e "Install the pinned plugin" -e "cannot be pinned" -e "was rendered for" -e "Delete them and run a plain" -e "THE PLUGIN PIN" -e "installs the plugin" -e "a re-run of .init. keeps your copy" -e "pinned to this CLI" -e "Eleven observations" -e "sole version of record" -e "tunes its cron" -e "is offline: it reads the two workflow files" -- docs README.md CONTRIBUTING.md llms.txt cli/README.md cli/templates/github plugin/docs plugin/README.md
```

No standing tracked matrix under `harness-runs/` covers these files, so no standing-artifact derivation entry is owed.

**Closure invariant:** every site the command entry reaches appears as a row below. Each hit's path-and-line maps to a row.

| # | Site | Copy | Evidence (what the derivation matched) | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `cli/templates/github/workflows/harness-resume.yml` → header `WHO WRITES IT.` ("a re-run of `init` keeps your copy") | — | `a re-run of .init. keeps your copy` | `change` | Task 4 |
| 2 | `cli/templates/github/workflows/harness-run.yml` → header `WHO WRITES IT.` ("a re-run of `init` keeps your copy") | — | `a re-run of .init. keeps your copy` | `change` | Task 4 |
| 3 | `cli/templates/github/workflows/harness-run.yml` → header `# THE PLUGIN PIN.` ("`claude plugin marketplace add --help` and") | — | `THE PLUGIN PIN` | `change` | Task 4 |
| 4 | `cli/templates/github/workflows/harness-run.yml` → header `# THE PLUGIN PIN.` ("So the job installs the plugin, then refuses to run") | — | `installs the plugin` | `change` | Task 4 |
| 5 | `cli/templates/github/workflows/harness-run.yml` → step `Install the pinned plugin` | — | `Install the pinned plugin` | `change` | Task 4 — the step keeps its name and changes its body |
| 6 | `cli/templates/github/workflows/harness-run.yml` → that step's `::error::` ("but this workflow was rendered for") | — | `was rendered for` | `change` | Task 4 |
| 7 | `docs/cli.md` → `## 3. The re-run contract`, row `.github/workflows/harness-run.yml` ("also what re-pins it") | — | `re-pins` | `change` | Task 8 |
| 8 | `docs/cli.md` → `## 3. The re-run contract`, row `.github/workflows/harness-resume.yml` ("The adopter tunes its cron") | — | `tunes its cron` | `change` | Task 8 |
| 9 | `docs/cli.md` → `## 7. \`doctor\``, the `remote-execution` / `remote-github` bullet ("`remote-execution` is offline: it reads the two workflow files") | — | `is offline: it reads the two workflow files` | `change` | Task 8 |
| 10 | `docs/development.md` → `## 3.`, bullet "The marketplace entry carries no `version`" ("the sole version of record") | — | `sole version of record` | `change` | Task 9 — the `metadata.version` statement |
| 11 | `docs/development.md` → `## 5.`, **Gate 12** opening ("Eleven observations") | — | `Eleven observations` | `change` | Task 9 — observation (xii) is added |
| 12 | `docs/remote-execution.md` → `## 1.`, step 4 ("the one the workflow was rendered for") | — | `was rendered for` | `change` | Task 7 |
| 13 | `docs/remote-execution.md` → `## 4.`, "**Plugin install, and its pin.**" ("The job installs the plugin explicitly") | — | `installs the plugin` | `change` | Task 7 |
| 14 | `docs/remote-execution.md` → `## 6.`, row "The plugin cannot be pinned by a ref at install" | — | `cannot be pinned` | `change` | Task 7 |
| 15 | `docs/remote-execution.md` → `## 7.`, step **2** ("with the run workflow pinned to this CLI's version") | — | `pinned to this CLI` | `change` | Task 7 |
| 16 | `docs/remote-execution.md` → `## 7.`, "The job installs the plugin from the marketplace source named in the committed `.claude/settings.json`" | — | `installs the plugin` | `change` | Task 7 — the source must carry the release tags |
| 17 | `docs/remote-execution.md` → `## 7.`, "A repository adopted before this release" paragraph ("Delete them and run a plain `init`") | — | `Delete them and run a plain` | `change` | Task 7 |
| 18 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → "The protected-branch guarantee is a backstop" ("a decision with an upgrade path") | — | `upgrade path` | `no-change` | About the protected-branch guard's upgrade path, not the plugin pin or the workflows. |
