### Task 28 — Record this repository's `.claude/` paste and the remaining-hit report

**Goal:** Give the maintainer an exact paste for this repository's own `.claude/` files, which the task prompt asks to move to the new name and which no agent may write. Record the done-when search's result on the finished branch, each remaining hit with its reason.

**Depends on:** Tasks 1–27. The paste must match what the renamed generators and templates would write: `PLUGIN_KEY` `devscene@devscene` and `MARKETPLACE_NAME` `devscene` (Task 1), `firu-daniel/devscene` (Task 14), and the renamed `.claude/` templates (Task 3). The remaining-hit report is taken after every other task has landed.

**Why nothing under `.claude/` is written.** The tool layer refuses an agent's write under `.claude/**` ahead of any permission entry, and an attempted write there can park the run. `.claude/context/conventions.md` and `.claude/context/cli.md` are conventions documents, which are never a task's target. Their one stale line each is raised as a `stale-rule` entry in the story index's `## Corpus staleness` section (`harness-runs/story_plans/chore_rename_to_devscene_story_plan.md`, at its end). Each entry carries the exact old and new line, so the maintainer's hand edit is a paste. This task's `## Paste record` does not repeat them. Its `## Remaining hits` lists the two files under *pending conventions-document hand edit*, pointing at that section.

### Targets

- `harness-runs/task_plans/chore_rename_to_devscene/task_28_plan.md`: this file, which gains a `## Paste record` and a `## Remaining hits` section at its end

**Work:**

- [ ] Append `## Paste record`. Reader: the maintainer. Put each span in a fenced block. (1) The whole intended `.claude/settings.json`: `enabledPlugins` key `devscene@devscene`, `extraKnownMarketplaces` key `devscene` with `"repo": "firu-daniel/devscene"`, every other byte as at `HEAD`. Mark it **apply at merge, together with the plugin reinstall**: a session that reads `devscene@devscene` before that plugin is installed loads none. (2) For `.claude/CLAUDE.md`, each line carrying the old name with its full replacement line, including the H1 `# DevScene` and the `**DevScene ships …**` opening (backticked `devscene` where the line quotes a command), and the `/devscene:branch-*`, `/devscene:harness-*`, `/devscene:harness-analyze` and `devscene init` occurrences. (3) The same for `.claude/harness-task-offer.md`, where the skill name `devscene:branch-prompt` is the value the template's `{{pluginName}}` now renders, and for `.claude/push-notify.env.example`.
- [ ] Confirm span (1) parses: write it to `harness-runs/scratch/`, run `node -e "JSON.parse(require('fs').readFileSync('<path>','utf8'))"` as one plain command, then delete the scratch copy.
- [ ] Append `## Remaining hits`. Run `git grep -n 'autonomous-sdlc-harness' -- . ':!harness-runs'` from the checkout root, as one plain command. List every hit it prints, each with its reason, drawn only from these: *recorded-release fixture* (`cli/test/fixtures/harness-control-0.6.1.yml`); *frozen capture* (`examples/notes-app/.claude/CLAUDE.md`, `examples/notes-app/sdlc-harness/**`); *historical-name line* (the one `examples/notes-app/README.md` line Task 27 added); *pending maintainer paste* (`.claude/CLAUDE.md`, `.claude/harness-task-offer.md`, `.claude/push-notify.env.example`, `.claude/settings.json`, and `examples/notes-app/.claude/` files other than `CLAUDE.md`); *pending conventions-document hand edit* (`.claude/context/conventions.md`, `.claude/context/cli.md`). A hit that fits none of these is a miss by an earlier task. Name it and its owning task in this task's return, and do not fix it here.

**Verification:**

- `git status --short -- .claude` prints nothing: this task wrote nothing under `.claude/`.
- Every line `## Remaining hits` lists carries one of the five reasons above. The section is a complete copy of the command's output, so the closing report can quote it.
- **Deviations from plan:** The scratch copy `harness-runs/scratch/task28_settings.json` was not deleted: `rm` on it was refused (*"Permission to use Bash has been denied because Claude Code is running in don't ask mode."*). It is untracked, under the uncommitted scratch directory, and holds exactly span (1) below. The parse check itself ran and exited 0 with no output. The replacement lines in span (2) and (3) were generated, not hand-typed, by `bash scripts/scratch-run.sh harness-runs/scratch/task28_lines.mjs <root>`, which also stays in the scratch directory.
- **Deviations from plan:** One hit fits none of the five reasons: `examples/notes-app/.mcp.json:2`. It is a miss by Task 27, whose edit there was refused; Task 27's `## Paste record` span (4) carries its replacement. It is listed under its own heading in `## Remaining hits` and not fixed here.

## Paste record

**Reader:** the maintainer, applying these edits by hand to this repository's `.claude/` (an agent's write there is refused by the tool layer). Each span follows the story index's spelling table. Every byte not shown stays as at `HEAD`. The two conventions-document lines (`.claude/context/conventions.md`, `.claude/context/cli.md`) are not repeated here: they are in the story index's `## Corpus staleness` section.

### (1) `.claude/settings.json` — apply at merge, together with the plugin reinstall

A session that reads `devscene@devscene` before that plugin is installed loads no plugin. So replace the whole file with this at merge, in the same step as `claude plugin marketplace add firu-daniel/devscene` and `claude plugin install devscene@devscene` (story index → **Manual setup required**, *At merge, together*). Parse-checked with `node -e "JSON.parse(require('fs').readFileSync('<path>','utf8'))"` (exit 0); `diff` against `HEAD`'s file shows only lines 3, 6 and 9 changed.

```json
{
  "enabledPlugins": {
    "devscene@devscene": true
  },
  "extraKnownMarketplaces": {
    "devscene": {
      "source": {
        "source": "github",
        "repo": "firu-daniel/devscene"
      }
    }
  },
  "permissions": {
    "allow": [
      "Bash(bash scripts/task-offer-check.sh)"
    ]
  }
}
```

### (2) `.claude/CLAUDE.md` — apply before merge

Each line below replaces the whole line at that number, as at `HEAD`. Old lines are quoted in `## Remaining hits`.

Line 1:
```
# DevScene
```

Line 3:
```
**DevScene ships an autonomous software-delivery harness as two halves** (`README.md`): `plugin/`, the Claude Code plugin carrying the process assets — the agents, the `/devscene:branch-*` and `/devscene:harness-*` commands, the `PreToolUse` guard hooks and the instruction documents they dispatch — and `cli/`, the npm package of the same name carrying the outer loop that runs them, whose verbs are `init`, `doctor`, `config` and `daemon` (`cli/package.json`, `cli/src/cli.ts`). Its readers are maintainers who run `npx devscene init` in a repository of their own, and the agents the plugin then dispatches inside it.
```

Line 9:
```
_Written by `/devscene:harness-analyze` in `existing` mode, from `README.md`, `package.json`, `cli/package.json`, `cli/src/cli.ts`, `plugin/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `examples/notes-app/README.md` and the repository layout; the audience and self-adoption blocks reduced to pointers by the corpus pass._
```

Line 30:
```
_Written by `/devscene:harness-analyze` in `existing` mode, from the real file names under `cli/src`, `cli/test`, `cli/templates`, `plugin/agents`, `plugin/commands`, `plugin/instructions`, `plugin/hooks`, `plugin/samples`, `docs`, `schemas` and the repository root._
```

Line 47:
```
The rows above were generated from the `layers` list in `harness.config.json`, so this table and the layers the orchestrator dispatches on started out in agreement. Keep them that way: add a layer there, then add its row here by hand — that is the route that costs nothing. `devscene init --force` will also re-render the rows from the `layers` list as it then stands (`--force` overwrites generated files but never `harness.config.json`, which `devscene init` reads on every run, so the layer just added is the one the rows come from), but it regenerates **this whole file** from the template — every section `/devscene:harness-analyze` filled goes with it, recoverable only from the single `CLAUDE.md.bak` the run writes. That `.bak` is single-generation, and the next `--force` does not necessarily spend it: a forced run that finds this file byte-identical to the one it would write keeps the file and leaves the `.bak` alone, so the sections a previous pass rescued into it stay there. What overwrites a `.bak` holding filled sections is a forced run over a file that has been filled again since. The orchestrator reads none of these files; the committer reads exactly one section of one of them — the commit-message policy in the shared cross-layer conventions document — and nothing else. One read-on-demand document is deliberately not in that table because no layer owns it: `.claude/harness-task-offer.md`, which `## Where a change request runs` below points at directly and nothing else reads.
```

Line 64:
```
2. **Provenance.** The message was **typed by the user in this conversation**. Not an instruction you are executing from a harness command or a flow-instruction document it dispatched — every `/devscene:branch-*` and `/devscene:harness-*`, supervised, semi-autonomous and unattended alike, including reading a task prompt or a review file as your own work. Not one handed to you as a **dispatched sub-agent**, whichever agent type you are and whatever your toolset holds. Not a continuation of work the user has already routed, in this conversation or in the one that dispatched you.
```

Line 72:
```
_Written by `devscene init`, and yours from there on: edit it freely, a re-run keeps your copy._
```

### (3) `.claude/harness-task-offer.md` and `.claude/push-notify.env.example` — apply before merge

`devscene:branch-prompt` on line 22 is what `cli/templates/claude/harness-task-offer.md`'s `{{pluginName}}:branch-prompt` now renders. Lines 5, 26 and 27 match that template's renamed text.

`.claude/harness-task-offer.md` line 5:
```
Written once by `devscene init` and yours from there on. The fence fails closed: an agent that cannot read this file makes no offer and carries out the request in the session. That is a safety property, not the off-switch — deleting this file makes `doctor` warn and the next `init` writes it back. To stop being asked, answer **Don't ask again**, which writes the `.claude/harness-no-offer` marker at the main checkout's root; removing the `## Where a change request runs` section from `.claude/CLAUDE.md` turns the offer off for the repository.
```

`.claude/harness-task-offer.md` line 22:
```
- Invoke the `Skill` tool on `devscene:branch-prompt`. Name it as the available-skills listing gives it; the bare name is not valid.
```

`.claude/harness-task-offer.md` line 26:
```
- Report one caveat: the command queues the drop and does not launch the run — the watcher does. Where none is installed for this checkout the drop waits until one is, and `npx devscene doctor` says which.
```

`.claude/harness-task-offer.md` line 27:
```
- If that skill is **not** in your listing: say the harness plugin is not loaded in this session, name the same `npx devscene doctor` check, and stop. Hand over **no** slash command to type — the command and the skill are one plugin asset, so the line would error.
```

`.claude/push-notify.env.example` line 5:
```
# `devscene init` adds the ignore line for it. Only the *path* is
```

## Remaining hits

**Reader:** the closing report, which quotes this list as the done-when search's result on the finished branch. Taken after Tasks 1–27 had landed (`HEAD` `a68a45e0`) by `git grep -n 'autonomous-sdlc-harness' -- . ':!harness-runs'`, run from the checkout root. Each hit appears below once, verbatim, under the one reason that keeps it.

### Pending maintainer paste — this repository's `.claude/` (this file's `## Paste record`)

```
.claude/CLAUDE.md:1:# autonomous-sdlc-harness
.claude/CLAUDE.md:3:**`autonomous-sdlc-harness` ships an autonomous software-delivery harness as two halves** (`README.md`): `plugin/`, the Claude Code plugin carrying the process assets — the agents, the `/autonomous-sdlc-harness:branch-*` and `/autonomous-sdlc-harness:harness-*` commands, the `PreToolUse` guard hooks and the instruction documents they dispatch — and `cli/`, the npm package of the same name carrying the outer loop that runs them, whose verbs are `init`, `doctor`, `config` and `daemon` (`cli/package.json`, `cli/src/cli.ts`). Its readers are maintainers who run `npx autonomous-sdlc-harness init` in a repository of their own, and the agents the plugin then dispatches inside it.
.claude/CLAUDE.md:9:_Written by `/autonomous-sdlc-harness:harness-analyze` in `existing` mode, from `README.md`, `package.json`, `cli/package.json`, `cli/src/cli.ts`, `plugin/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `examples/notes-app/README.md` and the repository layout; the audience and self-adoption blocks reduced to pointers by the corpus pass._
.claude/CLAUDE.md:30:_Written by `/autonomous-sdlc-harness:harness-analyze` in `existing` mode, from the real file names under `cli/src`, `cli/test`, `cli/templates`, `plugin/agents`, `plugin/commands`, `plugin/instructions`, `plugin/hooks`, `plugin/samples`, `docs`, `schemas` and the repository root._
.claude/CLAUDE.md:47:The rows above were generated from the `layers` list in `harness.config.json`, so this table and the layers the orchestrator dispatches on started out in agreement. Keep them that way: add a layer there, then add its row here by hand — that is the route that costs nothing. `autonomous-sdlc-harness init --force` will also re-render the rows from the `layers` list as it then stands (`--force` overwrites generated files but never `harness.config.json`, which `autonomous-sdlc-harness init` reads on every run, so the layer just added is the one the rows come from), but it regenerates **this whole file** from the template — every section `/autonomous-sdlc-harness:harness-analyze` filled goes with it, recoverable only from the single `CLAUDE.md.bak` the run writes. That `.bak` is single-generation, and the next `--force` does not necessarily spend it: a forced run that finds this file byte-identical to the one it would write keeps the file and leaves the `.bak` alone, so the sections a previous pass rescued into it stay there. What overwrites a `.bak` holding filled sections is a forced run over a file that has been filled again since. The orchestrator reads none of these files; the committer reads exactly one section of one of them — the commit-message policy in the shared cross-layer conventions document — and nothing else. One read-on-demand document is deliberately not in that table because no layer owns it: `.claude/harness-task-offer.md`, which `## Where a change request runs` below points at directly and nothing else reads.
.claude/CLAUDE.md:64:2. **Provenance.** The message was **typed by the user in this conversation**. Not an instruction you are executing from a harness command or a flow-instruction document it dispatched — every `/autonomous-sdlc-harness:branch-*` and `/autonomous-sdlc-harness:harness-*`, supervised, semi-autonomous and unattended alike, including reading a task prompt or a review file as your own work. Not one handed to you as a **dispatched sub-agent**, whichever agent type you are and whatever your toolset holds. Not a continuation of work the user has already routed, in this conversation or in the one that dispatched you.
.claude/CLAUDE.md:72:_Written by `autonomous-sdlc-harness init`, and yours from there on: edit it freely, a re-run keeps your copy._
.claude/harness-task-offer.md:5:Written once by `autonomous-sdlc-harness init` and yours from there on. The fence fails closed: an agent that cannot read this file makes no offer and carries out the request in the session. That is a safety property, not the off-switch — deleting this file makes `doctor` warn and the next `init` writes it back. To stop being asked, answer **Don't ask again**, which writes the `.claude/harness-no-offer` marker at the main checkout's root; removing the `## Where a change request runs` section from `.claude/CLAUDE.md` turns the offer off for the repository.
.claude/harness-task-offer.md:22:- Invoke the `Skill` tool on `autonomous-sdlc-harness:branch-prompt`. Name it as the available-skills listing gives it; the bare name is not valid.
.claude/harness-task-offer.md:26:- Report one caveat: the command queues the drop and does not launch the run — the watcher does. Where none is installed for this checkout the drop waits until one is, and `npx autonomous-sdlc-harness doctor` says which.
.claude/harness-task-offer.md:27:- If that skill is **not** in your listing: say the harness plugin is not loaded in this session, name the same `npx autonomous-sdlc-harness doctor` check, and stop. Hand over **no** slash command to type — the command and the skill are one plugin asset, so the line would error.
.claude/push-notify.env.example:5:# `autonomous-sdlc-harness init` adds the ignore line for it. Only the *path* is
.claude/settings.json:3:    "autonomous-sdlc-harness@autonomous-sdlc-harness": true
.claude/settings.json:6:    "autonomous-sdlc-harness": {
.claude/settings.json:9:        "repo": "firu-daniel/autonomous-sdlc-harness"
```

### Pending conventions-document hand edit (story index → `## Corpus staleness`)

```
.claude/context/cli.md:3:> **Read this when:** the change you are implementing or reviewing lands under `cli/` — the npm package `autonomous-sdlc-harness` and the template trees it ships. **Skip when:** it lands under `plugin/` or anywhere else at the root; each has its own document, and the rules that span all of them are in `.claude/context/conventions.md`, which this file assumes has been read.
.claude/context/conventions.md:19:| `cli` | `cli` | The npm package `autonomous-sdlc-harness` — the outer loop (`init`, `doctor`, `config`, `daemon`), and `cli/templates/`, the files `init` writes into an adopting repository | `.claude/context/cli.md` |
```

### Recorded-release fixture

```
cli/test/fixtures/harness-control-0.6.1.yml:1:# harness-control.yml — acts on an autonomous-sdlc-harness command comment
cli/test/fixtures/harness-control-0.6.1.yml:7:# WHO WRITES IT. `autonomous-sdlc-harness init`, only when harness.config.json's
```

### Frozen capture

```
examples/notes-app/.claude/CLAUDE.md:41:The rows above were generated from the `layers` list in `harness.config.json`, so this table and the layers the orchestrator dispatches on started out in agreement. Keep them that way: add a layer there, then add its row here by hand — that is the route that costs nothing. `autonomous-sdlc-harness init --force` will also re-render the rows from the `layers` list as it then stands (`--force` overwrites generated files but never `harness.config.json`, which `autonomous-sdlc-harness init` reads on every run, so the layer just added is the one the rows come from), but it regenerates **this whole file** from the template — every section `/harness-analyze` filled goes with it, recoverable only from the single `CLAUDE.md.bak` the run writes. That `.bak` is single-generation, and the next `--force` does not necessarily spend it: a forced run that finds this file byte-identical to the one it would write keeps the file and leaves the `.bak` alone, so the sections a previous pass rescued into it stay there. What overwrites a `.bak` holding filled sections is a forced run over a file that has been filled again since. The orchestrator reads none of these files; the committer reads exactly one section of one of them — the commit-message policy in the shared cross-layer conventions document — and nothing else. One read-on-demand document is deliberately not in that table because no layer owns it: `.claude/harness-task-offer.md`, which `## Where a change request runs` below points at directly and nothing else reads.
examples/notes-app/.claude/CLAUDE.md:66:_Written by `autonomous-sdlc-harness init`, and yours from there on: edit it freely, a re-run keeps your copy._
examples/notes-app/sdlc-harness/lessons.md:23:_Written by `autonomous-sdlc-harness init`, and yours from there on: a re-run never touches a ledger that already exists._
```

### Historical-name line (Task 27)

```
examples/notes-app/README.md:45:**The capture predates the rename.** The run was captured under the product's earlier name, `autonomous-sdlc-harness`, so the captured artifacts name the CLI, the plugin and its commands that way; the product is now DevScene (`devscene`), and nothing in the capture was respelled.
```

### Pending maintainer paste — `examples/notes-app/.claude/` other than `CLAUDE.md` (Task 27's `## Paste record`)

```
examples/notes-app/.claude/harness-task-offer.md:5:Written once by `autonomous-sdlc-harness init` and yours from there on. The fence fails closed: an agent that cannot read this file makes no offer and carries out the request in the session. That is a safety property, not the off-switch — deleting this file makes `doctor` warn and the next `init` writes it back. To stop being asked, answer **Don't ask again**, which writes the `.claude/harness-no-offer` marker at the main checkout's root; removing the `## Where a change request runs` section from `.claude/CLAUDE.md` turns the offer off for the repository.
examples/notes-app/.claude/harness-task-offer.md:22:- Invoke the `Skill` tool on `autonomous-sdlc-harness:branch-prompt`. Name it as the available-skills listing gives it; the bare name is not valid.
examples/notes-app/.claude/harness-task-offer.md:26:- Report one caveat: the command queues the drop and does not launch the run — the watcher does. Where none is installed for this checkout the drop waits until one is, and `npx autonomous-sdlc-harness doctor` says which.
examples/notes-app/.claude/harness-task-offer.md:27:- If that skill is **not** in your listing: say the harness plugin is not loaded in this session, name the same `npx autonomous-sdlc-harness doctor` check, and stop. Hand over **no** slash command to type — the command and the skill are one plugin asset, so the line would error.
examples/notes-app/.claude/push-notify.env.example:5:# `autonomous-sdlc-harness init` adds the ignore line for it. Only the *path* is
examples/notes-app/.claude/qa-accounts.env.example:5:# version control; `autonomous-sdlc-harness init` adds the ignore line for it. Only the
examples/notes-app/.claude/qa_test_scenarios.md:3:_Written once by `autonomous-sdlc-harness init`, and yours from there on: a checked-in file like any
examples/notes-app/.claude/settings.autonomous.json:4:    "UNATTENDED SETTINGS PROFILE - written by `autonomous-sdlc-harness init`, and yours from there on: edit it freely, a re-run keeps your copy. It is selected per run with `--settings` - a remote job passes this file, and the run watcher passes a per-run copy rendered from it - and is never installed as the interactive default, so dropping that flag reverts every grant below with nothing to undo.",
examples/notes-app/.claude/settings.autonomous.json:11:    "THE OUTER-LOOP SCRIPTS AN AGENT RUNS ARE LISTED THE SAME WAYS, AND THE REST GET NOTHING: `autonomous-sdlc-harness init` writes a second family of scripts into scripts whose bodies ship fixed and read `harness.config.json` at run time rather than carrying a command line of yours. Only the ones a dispatched agent or the orchestrating session is itself the thing that runs are listed here - the orchestrating session runs four of them, the flow walker `flow-walker.sh`, the prompt-injection screen `prompt-injection-screen.sh`, the test-suite runner `run-test-suite.sh` and the gate launcher `launch-sandboxed-gates.sh`, on a bubblewrap host - and they are in `allow` rather than `ask` because they sit on the unattended commit, planning or gate-run path, where an `ask` is evaluated first and refuses the call. The run watcher, the worktree tooling and the cleanup sweep are started by the watcher process or by you, and `remote-run.sh` by the watcher, the remote job or you; they carry no entry on purpose: one would hand a dispatched agent a path to a branch deletion, a daemon restart or a remote run dispatch. The docs-retrieval server launcher carries no entry either, for a different reason: the agent runner starts it from `.mcp.json` when docs.retrieval is on, never a dispatched agent's Bash call, and the one tool it serves, `search_docs` on the `harness-docs` server, is granted by the retrieval fragment's entry for it instead. Adding an entry for one of them is a decision to let an agent run it - make it deliberately, in the same forms as everything else here.",
examples/notes-app/.claude/settings.autonomous.json:29:    "THE BROWSER HALF, ADDED ONLY WHEN TWO CONDITIONS BOTH HOLD - THE INTERACTIVE TEST PHASE IS ENABLED, AND ITS DRIVER IS THE BROWSER ONE: the `enabledMcpjsonServers` key, the `mcp__` entries at the end of `allow` and the port and liveness probes beside them were merged in because `phases.qa` was true AND `qa.driver` was `web-playwright` when this file was generated. Fail either condition and none of them is written at all, so an adopter who never drives a browser pays neither the browser tool schemas in every session's context nor a launched browser process. With a MOBILE driver that is not merely a saving: the mobile variants of the interactive test agent are declared-not-implemented in this release and carry built-ins-only tool allowlists, so a server started here would be one no agent could ever call - which is why the repository's own `.mcp.json` is withheld in the same run rather than left declaring servers this profile never starts. Turning the phase on in `harness.config.json`, or changing `qa.driver` to `web-playwright`, and re-running `autonomous-sdlc-harness init` does NOT rewrite this file — it is yours once written; copy the entries in from a fresh generation, or re-run it with --force, which takes a .bak first.",
examples/notes-app/.claude/settings.autonomous.json:33:    "THE PHASE'S OWN HELPER SCRIPTS ARE NOT ALLOW-LISTED HERE - ADD THEM BY HAND, ONCE: the port, dev-server and QA-user helpers this phase runs ship inside the harness plugin and are invoked as `bash ${CLAUDE_PLUGIN_ROOT}/scripts/<name>.sh`. Keeping the token in an entry rescues nothing, because the guard matches the raw command string and a substitution anywhere in that string defeats the match however the entry is worded (measured against `claude` 2.1.227, with the limits of that measurement recorded in the harness repository's own `docs/development.md` section 3). So each line you add must name a RESOLVED root - `Bash(bash <resolved plugin root>/scripts/<name>.sh:*)`, in the same unquoted form the wrapper entries above use, naming the script FILE rather than the directory holding it, because a directory-prefix entry was measured not to match either. That form is what a resolved command meets, whatever kind of file names the helper - an adoption run on 2026-08-26 reached three of them through it and stalled at none - but WHICH root it resolves to does depend on that: a helper named in an instruction file is resolved by the agent itself, one named in an agent definition body has the token substituted by the runtime, and on a directory-sourced marketplace those two were measured to be different directories. Add the line once per helper per root where they differ. `autonomous-sdlc-harness init` does not generate these lines, and an unknowable root is not the reason - it is recorded per plugin in the agent runner's own `installed_plugins.json`. What stops the generator is that `init` may run before the plugin is enabled, and that the path carries the plugin VERSION, so a line written once goes silently stale on the next upgrade. The resolving is therefore done at check time instead: run `npx autonomous-sdlc-harness doctor` and paste what its `plugin-permissions` check prints - it re-resolves both roots on every run and names each missing line exactly, grouped by root. The helper names are declared once, in the plugin's own `scripts/README.md`, and are deliberately not repeated here. Until those lines exist the phase's helper calls are refused, per the completeness line above. This file is written create-if-absent, so the lines you add survive every later `autonomous-sdlc-harness init`: a plain re-run keeps the whole file, and `--force`, the one run that regenerates it from the template after a .bak, re-reads it first and CARRIES FORWARD every `permissions.allow` entry naming a plugin root this machine still resolves - the lines above among them. The one it does not carry is an entry naming a root it no longer resolves, which is what a plugin upgrade leaves behind: that run names each entry it dropped, and `doctor` names them on every run after it. That exception applies only where the plugin DOES resolve on the machine running it - where none of its roots resolve at all, nothing there can tell a stranded entry from one you pasted a minute ago, so the run carries every absolute entry outside the checkout forward UNVERIFIED and says so in those words.",
examples/notes-app/.claude/settings.json:3:    "autonomous-sdlc-harness@autonomous-sdlc-harness": true
examples/notes-app/.claude/settings.json:6:    "autonomous-sdlc-harness": {
examples/notes-app/.claude/settings.json:9:        "repo": "firu-daniel/autonomous-sdlc-harness"
```

### Fits none of the five reasons — a miss by Task 27

Task 27's edit to this live file was refused (its `**Deviations from plan:**` note); its replacement is Task 27's `## Paste record` span (4). Not fixed here.

```
examples/notes-app/.mcp.json:2:  "_comment": "Browser wiring for the interactive test phase, written by `autonomous-sdlc-harness init` and merged rather than overwritten on a re-run: a server you add here survives, and one of these two is re-added only if it is missing. THE TWO SERVERS ARE SEPARATE BROWSER INSTANCES - each launches and drives its own browser, so a page one of them has navigated or signed in is not visible to the other, and a test that needs both drives each of them into the state it needs. BOTH RUN --isolated because each package otherwise defaults to one fixed persistent profile directory: a second instance started against a profile already in use refuses to launch, which is a failure that surfaces only when two runs overlap. THE VERSIONS ARE PINNED DELIBERATELY - a browser-automation server's tool names and flags change between releases, and an unpinned fetch would change what the phase can do without any edit here. Raise a pin as its own change, and re-check the tool names allow-listed in the generated permission profile when you do. NEITHER PACKAGE IS INSTALLED BY init - the `npx -y` above fetches each pinned spec from the registry the first time the interactive-test phase runs, so a machine that is offline, behind a proxy, or on a mirror that does not carry those exact versions fails at that first dispatch rather than at setup; `npx autonomous-sdlc-harness doctor --check-registry` answers it beforehand.",
```
