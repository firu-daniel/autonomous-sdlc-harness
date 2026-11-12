# Story: Rename the files and commands an adopter's repository receives from "harness" to DevScene

## Context

This branch renames what `init` writes into an adopter's repository and what the plugin exposes: the configuration file, its schema, the default state and scripts directories, the change-request offer file and its opt-out marker, the two plugin commands, the systemd unit, the generated failure prefix, the two hidden markers, the workflow run titles, the poll-state artifact and the run step's name. It is the fourth of five rename branches after `chore_rename_to_devscene`. Backward compatibility is out of scope. Nothing reads an old name as a fallback, nothing repairs a file an earlier release wrote, and no sentence anywhere names an old value or says that a name changed (`harness-runs/lessons.md` → *Adopter-facing documentation*, the breaking-rename rule). Adopters migrate by hand.

**The spelling table. Every task applies it; no task re-decides it.** Rows 1–11 are literal substring replacements, so an `Edit` with `replace_all` per row is exactly the rename. No kept name contains one of these substrings: `harness-config-lib.sh`, `harnessConfig.ts` and `HarnessConfig` have no dot after `harness`; `harness-runs/` matches no row.

| # | Old substring | New substring | Notes |
|---|---|---|---|
| 1 | `harness.config` | `devscene.config` | Covers `harness.config.json`, `harness.config.json.bak` and `harness.config.schema.json` |
| 2 | `sdlc-harness` | `devscene` | The default `stateDir`, every fixture value and every path under it. **Exception:** the product's earlier name `autonomous-sdlc-harness` is never changed. It appears outside `harness-runs/` only in the example's frozen capture and in `examples/notes-app/README.md` → *"The capture predates the rename"*, which stays as it is |
| 3 | `harness-scripts` | `devscene-scripts` | The default `scriptsDir` (row 14 covers the old `scripts` fallback) |
| 4 | `harness-task-offer` | `devscene-task-offer` | The file `.claude/devscene-task-offer.md` and its template `cli/templates/claude/devscene-task-offer.md` |
| 5 | `harness-no-offer` | `devscene-no-offer` | The opt-out marker `.claude/devscene-no-offer` |
| 6 | `harness-analyze` | `analyze` | `/devscene:harness-analyze` → `/devscene:analyze`, bare `/harness-analyze` → `/analyze`, `plugin/commands/harness-analyze.md` → `plugin/commands/analyze.md` |
| 7 | `harness-read-mention` | `read-mention` | `/devscene:read-mention`, `plugin/commands/read-mention.md`, `MENTION_COMMAND_NAME` |
| 8 | `harness-watcher@` | `devscene-watcher@` | The systemd unit `devscene-watcher@<slug>.service` |
| 9 | `harness:unfilled`, `harness:setup-pending` | `devscene:unfilled`, `devscene:setup-pending` | The second covers `/harness:setup-pending` too, so the banner pair becomes `<!-- devscene:setup-pending -->` / `<!-- /devscene:setup-pending -->` |
| 10 | `harness-poll-state` | `devscene-poll-state` | `POLL_STATE_ARTIFACT_NAME` and its mirrors |
| 11 | `Run the harness` | `Run DevScene` | The run job's step name and every mention of it. The one prose use, in `evals/docs-retrieval/index-build.mjs`, reads `Run DevScene's retrieval setup` |
| 12 | `harness <verb>` in a run title | `devscene <verb>` | **Judgement, not substring.** The verbs are `run`, `pause`, `stop`, `control` and `trigger`, plus `harness <action>` and `harness ${{ … }}`. A hit is a title when it spells or quotes a workflow run's title: a `run-name:` value, a `displayTitle` match (`--arg t "harness run $branch"`, `titled_runs "harness pause $branch"`, `startswith("harness run ")`, `ltrimstr("harness run ")`), a message or comment naming a title (`` no `harness run feat_x` run ``, `'harness stop'`, `### harness run <branch>`, `### harness trigger`), a test's `displayTitle` fixture, or a document naming a title. Prose using "harness run" as a noun phrase (*"a harness run on the branch"*, *"the harness run on `<branch>` paused"*, *"No harness run."*) is not a title and stays |
| 13 | `harness_fail "harness: ` | `harness_fail "devscene: ` | The user-facing prefix of the placeholder line `cli/src/generators/scripts.ts` writes, and the tests that pin it. The function name `harness_fail` stays |
| 14 | the `scripts` fallback for an absent `scriptsDir` | `devscene-scripts` | `DEFAULTS.scriptsDir`, the schema `default`, `hr_config_dir … scriptsDir "scripts"`, `hc_config_dir … scriptsDir scripts`, the workflows' `.scriptsDir // "scripts"`, and every plugin `<scripts_dir>` row's "`scripts/` when the key is absent", which becomes "`devscene-scripts/` when the key is absent" |

**What keeps its current spelling, and why.**
- Out of scope by the task prompt: `scripts/lib/harness-run-lib.sh`, `plugin/hooks/lib/harness-config-lib.sh` and every other internal file name; the `hr_*` / `hc_*` function names; `harnessConfig.ts`, the `Harness*` type names and `HarnessError`; the `harness-docs` retrieval server, the `harness_docs_retrieval` Python package and the database default `postgresql://harness:harness@…` (`chore_devscene_docs_retrieval` renames them).
- Not in the table: the `harness-state` artifact, the `harness-task` dispatch event type, the workflow concurrency groups (`harness-run-…`, `harness-resume`, `harness-review-…`, `harness-control-…`), the `mktemp` stems (`harness-trigger-comment.XXXXXX` and kin), the `harness_fail` function, the kept `HARNESS_*` plumbing names, and the word "harness" in prose.
- `INIT_SCRIPTS_DIR` keeps its identifier. Task 1 binds it to `DEFAULTS.scriptsDir`, so the value `init` writes and the schema default are one value with one owner, and the sixty suites that import it through `cli/test/helpers/fixture.mjs` need no edit. The table names it only as the place the old value lived; the closing check lists it as a deliberate leftover.
- `harness-runs/` is this repository's own configured `stateDir` (task prompt, goal 4) and is history.
- The frozen capture in `examples/notes-app/`: the run artifacts under its state directory, which move from `sdlc-harness/` to `devscene/` with their bytes unchanged, and the prose of `.claude/CLAUDE.md` and `.claude/context/*.md` (`examples/notes-app/README.md` → *"The capture is frozen; the fixture is live"*; `.claude/context/conventions.md` → `## Documents of record`). The captured `.claude/CLAUDE.md` keeps its pointer to the earlier offer-file name.
- Two lines of `docs/rag-extraction-research/reviews/07-extraction-plan.md` record a measured grep command and state this rename's mapping. Respelling their old side would make them false (Task 32).
- Task 35's closing check lists every one of these deliberate leftovers.

**Goal 2 — one `scriptsDir` value.** `DEFAULTS.scriptsDir` and the schema default become `devscene-scripts`, the value `init` writes. Task 1 removes the absent-`scriptsDir` warning from `cli/src/config/check.ts`, its header paragraph, and the prose in `cli/src/config/model.ts` that explains why the two values differed. Tasks 15, 36, 28 and 29 remove the same prose from the schema description, `docs/config.md` §5, `docs/cli.md` and `docs/development.md` → Gate 12 (*"`scripts` for the second by default"*). A fixture that omits `scriptsDir` now means `devscene-scripts`. A suite case that placed its scripts under `scripts` for an absent key moves them, or sets the key explicitly. `cli/test/scripts-dir.test.mjs`, `cli/test/profile.test.mjs` (the absent-key constant near its top), `cli/test/create-worktree.test.mjs` and `cli/test/doctor.test.mjs` (the `scripts` collision case) are the known ones; each is in a suite task.

**Dated records are respelled, silently.** Gate rounds in `docs/development.md`, the sandbox records, measured comments in `cli/src/commands/init.ts` and the research documents take the table like any other text, because the *Done when* allows no exception outside `harness-runs/`, the captured example artifacts and recorded-release fixtures. No sentence says a name was respelled. The `ROADMAP.md` 0.6.6 row is respelled to `devscene-scripts/` like the rest.

**This repository's own adoption is cut over by the maintainer after the run, not by a task.** The run executing this branch reads `harness.config.json` at the run copy's root through code this branch does not change: the main checkout's `launch-sandboxed-gates.sh` reads `<run copy>/harness.config.json` for `stateDir` before Phase G runs the run copy's `run-test-suite.sh`, and the installed plugin's guards read the same file. The run copy's own `scripts/` copies (`run-test-suite.sh`, `prompt-injection-screen.sh`, `flow-walker.sh` and the run library they source) read whatever name their library carries. Renaming the root file, or bringing the self-adopted copies to the renamed template bytes, inside the run would break Phase G either way. So:
- No task renames `harness.config.json` at this root or edits the self-adopted copies under `scripts/` (the byte-identical copies of `cli/templates/scripts/*` plus the rendered `scripts/test.sh` and `scripts/typecheck.sh`).
- Task 35's per-task file carries the exact `## Cutover record` the maintainer applies after the run's last automated phase and before merge (**Manual setup required** below).
- Task 26 points the four suites that copy `scripts/lib/harness-run-lib.sh` from this checkout at `cli/templates/scripts/lib/harness-run-lib.sh` instead. That is the template the adopted copy is byte-identical to after the cutover, so the change holds afterwards too.
- A suite can also reach that library without naming it. `scripts/lib/gate12-sandbox-round/preflight.sh` → `g12_preflight` and `scripts/lib/sandbox-probe/preflight.sh` → `sp_preflight` source `lib/harness-run-lib.sh` relative to their own location. Run in place, that is the self-adopted copy, which reads `harness.config.json`, and it would refuse every renamed-config fixture. `cli/test/helpers/gate12-round.mjs` → `runRound` / `spawnRound` (through `ROUND_SCRIPT`) and `cli/test/sandbox-probe-job-mode.test.mjs` → `IN_PLACE_PROBE` ran the drivers this way. Task 26 runs both from a staged copy outside the fixture, with the template library placed at `lib/harness-run-lib.sh` beside it.
- The inert self-adoption edits run in-run in Task 35: the `.gitignore` rules and the comments in `githooks/pre-push`.

**`.claude/**` is written by the maintainer, never by a task.** The tool layer refuses an agent's write under `.claude/**` ahead of any permission entry, and that refusal parks the run. So this repository's `.claude/CLAUDE.md`, `.claude/harness-task-offer.md` and `.claude/push-notify.env.example`, and the example's live renders `examples/notes-app/.claude/{harness-task-offer.md, push-notify.env.example, qa-accounts.env.example, settings.autonomous.json}`, get no task. Task 35's file carries their `## Paste record`. The three conventions documents under `.claude/context/` are no task's target at all. They are raised as `stale-rule` corpus staleness for a hand edit.

**Cross-task contracts fixed here.**
- `cli/src/core/pluginIdentity.ts` → `ANALYZE_COMMAND` = `` `/${PLUGIN_NAME}:analyze` `` (Task 1). `scripts/check-command-spelling.sh` → `PATTERN` alternative `analyze` in place of `harness-analyze` (Task 17), and its exemptions `docs/development.md|line|/analyze --dry-run`, `docs/development.md|line|/analyze` and `cli/src/commands/init.ts|contains|claude -p "/analyze" --permission-mode plan`. Task 29 writes those two gate-8 lines into `docs/development.md`. Task 3 writes the `init.ts` line. Gate 6's prose in `docs/development.md` (Task 29) states the same pattern and carve-outs.
- The run titles `devscene <action> <branch>`, `devscene control …` and `devscene trigger …` are produced by the workflow templates and matched by `remote-run.sh` (Task 6, one task, per the task prompt), by the watcher (Task 5) and by the Gate 12 scripts (Task 16).
- `scripts/lib/gate12-sandbox-round/core.sh`'s FR3 description (Task 16) and the FR3 row of `docs/development.md`'s Gate 12 table (Task 29) carry the same text, `… line of the Run DevScene step log …`, because `cli/test/gate12-sandbox-round-docs.test.mjs` reads both.
- `TASK_OFFER_PATH` = `.claude/devscene-task-offer.md`, and the template `cli/templates/claude/devscene-task-offer.md` is renamed in the same task that changes the generator's `render(...)` call (Task 2), so `init` never names a template that is not there.

**Order, and the tree guards that force it.** The readiness list ships in this order. Task numbers are identities, not positions.
- **The configuration contract lands first, schema-first, in three consecutive commits covering the contract's four places:** Task 15 (the schema, its validation scripts and fixtures, and the example configurations), then Task 1 (`cli/src/config/model.ts` and `check.ts`), then Task 36 (`docs/config.md` §3 and §5's default cells). Those are the contract's four places, in the order `.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`, item 1 fixes, and `### Where a new responsibility goes` puts the schema ahead of its readers. `cli/src/config/model.ts`'s header requires its defaults to agree with the schema's `default`. Shipping the contract this way means no commit has `DEFAULTS` disagreeing with the schema for longer than the one commit between Task 15 and Task 1, which a one-layer-per-task split cannot avoid. It also means no header cites a schema path that does not exist. That item-1 rule outranks the layer sequence below, so Tasks 15 (`general`) and 36 (`general`) sit ahead of the `cli` producers. Task 15 needs no value from Task 1. Task 1 sets `DEFAULTS` equal to the schema `default` values Task 15 set.
- Tasks 2–9 are the remaining `cli` producers: `cli/src`, then the templates.
- `test/watcher-main-anchor.test.mjs` guards `cli/templates/scripts/**` and launches the written watcher through `cli/test/helpers/watcher.mjs`. That helper runs `init` and then reads the config file and state directory by name. So **Task 5**, the first template-scripts task, renames the run library, the watcher and that helper together.
- Tasks 10–14 are `plugin`. Task 11 renames the analyze command file and, in the same commit, respells the three `plugin/agents/` citations of its old path, so no commit leaves an agent naming a dispatcher that does not exist (`.claude/context/conventions.md` → item 3; `.claude/context/plugin.md` → `## Citation`). Tasks 16–18 are the remaining `general` producers that suites read: this repository's probe and Gate 12 scripts, the command-spelling gate, and the Python service with the evals.
- Tasks 19–26 respell the `cli` suites. They come after every producer they read, so each task can run its edited files green.
- **The command names land in the CLI before the plugin ships them.** From readiness position 2 (Task 1, `ANALYZE_COMMAND = /devscene:analyze`) through position 12, `init`'s remedy text (Task 1), `MENTION_COMMAND_NAME = 'read-mention'` (Task 4) and the `remote-run.sh` template's `MENTION_COMMAND='/devscene:read-mention'` with its `commands/<basename>.md` existence check (Task 6) name `/devscene:analyze`, `/devscene:read-mention` and `plugin/commands/read-mention.md`, which the in-tree plugin carries only from Task 11 (position 13). This is deliberate and is kept against `.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`, item 3, for two reasons:
  - **The names are inert inside the run.** The CLI and template strings resolve against the adopter's *installed* plugin, never the in-tree one: `remote-run.sh` checks `$HARNESS_MENTION_PLUGIN_DIR/commands/<basename>.md`, and `init` only prints the command. No intermediate commit is executed against the in-tree plugin, and the installed plugin is refreshed only after merge (**Manual setup required**). The only suites that read both sides (`remote-names`, `remote-control-mention`, `init`, `doctor`) are respelled in Tasks 19–23, after Task 11.
  - **Moving Task 11 first only inverts the gap.** With Task 11 ahead of Task 1, `plugin/commands/analyze.md` and `read-mention.md` would exist while `init` and `remote-run.sh` still named `/devscene:harness-analyze` and `harness-read-mention.md`, which is the same dispatch-of-a-missing-contract in the other direction. Only one commit spanning `cli` and `plugin` closes it, and one-layer-per-task rules that out.
- So the readiness list leaves `cli` → `plugin` → `general` order, or a dispatch/asset pair, out of step in exactly three places: the configuration contract at the head of the list, the suite tasks, and this command-name gap.
- Tasks 27–34 are the documents and the example's live files. Task 35 is this repository's in-run self-adoption edits, the cutover and paste records, and the closing check.

**Test files are edited by the task that can run them green.** No producer task edits a suite, except Task 5's watcher helper. Between Task 1 and the suite tasks, suites not yet respelled are red. No intermediate commit runs them: the unit loop runs only a task's own test files and the guards its paths select, and the full suite runs once, at Phase G.

**Top risks:**
- **A mirror pair drifts.** `remote-run.sh` might match `harness run <branch>` while the workflow titles its runs `devscene run <branch>`, or `POLL_STATE_ARTIFACT_NAME` might differ between `githubActions.ts`, `remote-run.sh` and `devscene-resume.yml`. Then a remote run is never found and a paused run never resumes. Task 6 changes the script and the four workflows together. Task 22's `workflow-templates`, `remote-names` and `remote-run` suites hold the pairs to the constants.
- **A broad replacement hits a kept name.** `harness-state`, `harness-task`, `harness-run-lib.sh` or the earlier product name `autonomous-sdlc-harness` respelled would break job plumbing or falsify the capture. Every task applies only the table's rows, and row 12 by judgement. Task 35's closing check confirms the kept names still occur.
- **This run breaking itself.** If the run renamed its own root config or self-adopted scripts, Phase G and the guards would lose the file they read. No task does either. The cutover is the maintainer's, after the run (Task 35's `## Cutover record`).

**Manual setup required:**
- **After the run's last automated phase, before merge:** apply Task 35's `## Cutover record`. It renames this repository's `harness.config.json` to `devscene.config.json` and copies the renamed templates over the self-adopted `scripts/` copies. Then apply its `## Paste record` to this repository's `.claude/` and to `examples/notes-app/.claude/`, and make the three conventions-document hand edits listed under `## Corpus staleness` in the plan's return. Re-run the closing check that record ends with (depends on Task 35, and on every task).
- **After merge, on this machine:** refresh the installed plugin at the merged version, so the guards read `devscene.config.json` and `/devscene:analyze` and `/devscene:read-mention` resolve. Then restart the run watcher with `bash scripts/restart-watcher.sh` from the main checkout, because the running watcher process is the pre-merge script (depends on Tasks 5, 10 and 11).
- **On any host whose watcher runs under systemd:** run `npx devscene daemon uninstall` with the pre-merge CLI before upgrading, then `npx devscene daemon install` with the merged one. The new CLI knows only `devscene-watcher@<slug>.service` and does not find the old unit (depends on Task 3).
- **Before the next remote run or Gate 12 round:** let every in-flight remote run finish or stop it first. In every GitHub repository that runs rendered `devscene-*.yml` workflows (the Gate 12 sandbox repository included), run `npx devscene@<merged version> init --force` and commit the re-rendered workflows and scripts to the default branch. The old workflows title runs `harness …`, and the new `remote-run.sh` finds only `devscene …` titles (depends on Task 6).

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. An implementer never changes a marker here and never edits any other line of this section while a run is iterating this index. `[ ]` markers anywhere else, such as sub-step bullets inside per-task files, are informational only. They are never the iteration source, and the committer does not touch them.

Each entry maps 1:1 to `harness-runs/task_plans/chore_devscene_adopter_layout/task_<K>_plan.md`. Entries are in ship order, and a task's number is its identity, not its position. Tasks 15, 1 and 36 lead, and Tasks 19–26 sit after the `plugin` and `general` producers, for the reasons `## Context` gives.

1. [x] **Task 15** — Rename the schema, its validation scripts and fixtures, and the example configurations and state directory _(layer: general)_ _(points: 20)_
2. [x] **Task 1** — Rename the config file constant, the default directories and the analyze command, and drop the absent-`scriptsDir` warning _(layer: cli)_ _(points: 20)_
3. [ ] **Task 36** — State the renamed `stateDir` and `scriptsDir` defaults in `docs/config.md` _(layer: general)_ _(points: 5)_
4. [ ] **Task 2** — Rename the change-request offer file and the two hidden markers in the generator and its `claude/` templates _(layer: cli)_ _(points: 20)_
5. [ ] **Task 3** — Respell the commands, core paths, daemon unit and detection modules in `cli/src` _(layer: cli)_ _(points: 15)_
6. [ ] **Task 4** — Respell `doctor`, the remaining generators, the remote names and retrieval in `cli/src` _(layer: cli)_ _(points: 15)_
7. [ ] **Task 5** — Rename in the run library, watcher and restart-watcher templates and the watcher test helper _(layer: cli)_ _(points: 20)_
8. [ ] **Task 6** — Rename in the `remote-run.sh` template and the four workflow templates, run titles included _(layer: cli)_ _(points: 20)_
9. [ ] **Task 7** — Rename in the commit, push, refresh, worktree, cleanup and scratch wrapper templates _(layer: cli)_ _(points: 15)_
10. [ ] **Task 8** — Rename in the remaining script templates and the scripts README _(layer: cli)_ _(points: 15)_
11. [ ] **Task 9** — Rename in the non-script templates and the package READMEs _(layer: cli)_ _(points: 15)_
12. [ ] **Task 10** — Rename in the plugin's guards, shared library, QA helpers and hooks README _(layer: plugin)_ _(points: 15)_
13. [ ] **Task 11** — Rename the analyze and read-mention commands, respell the command files and plugin READMEs, and re-point the agents' citations of the analyze command _(layer: plugin)_ _(points: 20)_
14. [ ] **Task 12** — Respell the plugin agent definitions _(layer: plugin)_ _(points: 15)_
15. [ ] **Task 13** — Respell the first half of the plugin instruction documents _(layer: plugin)_ _(points: 15)_
16. [ ] **Task 14** — Respell the second half of the plugin instructions, the samples and the plugin flow documents _(layer: plugin)_ _(points: 15)_
17. [ ] **Task 16** — Rename in this repository's sandbox-probe and Gate 12 scripts _(layer: general)_ _(points: 15)_
18. [ ] **Task 17** — Respell the command-spelling gate, `run-gates.sh` and `publish-main.sh` _(layer: general)_ _(points: 10)_
19. [ ] **Task 18** — Rename the config file the Python retrieval service reads, and respell the evals _(layer: general)_ _(points: 15)_
20. [ ] **Task 19** — Respell the `init`, scripts-directory, offer and preset suites with the fixture helper _(layer: cli)_ _(points: 20)_
21. [ ] **Task 20** — Respell the `config`, `doctor`, `daemon` and profile suites _(layer: cli)_ _(points: 20)_
22. [ ] **Task 21** — Respell the wrapper, clone and worktree suites _(layer: cli)_ _(points: 20)_
23. [ ] **Task 22** — Respell the `remote-run`, remote-names, workflow-template and delivery suites _(layer: cli)_ _(points: 20)_
24. [ ] **Task 23** — Respell the run-control, collect, report, progress and trigger suites _(layer: cli)_ _(points: 20)_
25. [ ] **Task 24** — Respell the watcher, restart-watcher, keep-awake and ledger suites _(layer: cli)_ _(points: 20)_
26. [ ] **Task 25** — Respell the outer-loop-scripts, walker, prompt-injection, analytics and test-suite suites _(layer: cli)_ _(points: 15)_
27. [ ] **Task 26** — Respell the suites that read the plugin and this repository's scripts, and point four of them at the template run library _(layer: cli)_ _(points: 20)_
28. [ ] **Task 27** — Respell `README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, `ROADMAP.md` and `llms.txt` _(layer: general)_ _(points: 15)_
29. [ ] **Task 28** — Respell `docs/cli.md`, `docs/analyze.md` and the rest of `docs/config.md`, and drop the split-default prose _(layer: general)_ _(points: 15)_
30. [ ] **Task 29** — Respell `docs/development.md`, gates 6, 8 and 12 included _(layer: general)_ _(points: 20)_
31. [ ] **Task 30** — Respell the remote-execution, run-control, issue-trigger and watcher documents _(layer: general)_ _(points: 20)_
32. [ ] **Task 31** — Respell the sandbox, guard and outer-loop verification records _(layer: general)_ _(points: 20)_
33. [ ] **Task 32** — Respell the retrieval, decision and research documents _(layer: general)_ _(points: 15)_
34. [ ] **Task 33** — Respell the work-report research documents _(layer: general)_ _(points: 10)_
35. [ ] **Task 34** — Respell the example's live files and the examples README _(layer: general)_ _(points: 10)_
36. [ ] **Task 35** — Respell this repository's `.gitignore` and `pre-push` hook, and run the closing check against the cutover and paste records _(layer: general)_ _(points: 15)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Rename each item in the table everywhere it is generated, read, matched, documented or tested."* The *Done when* sharpens it: *"`git grep` for each old name outside `harness-runs/`, the captured example artifacts and recorded-release fixtures returns nothing. The report lists any deliberate leftovers."*

`cli/src` and `cli/test` are application source and owe no register rows. Tasks 1–5 (`cli/src` and the watcher helper) and 19–26 own them. Every derivation entry below was executed on this tree before shipping, and D1–D3 were re-run and D4 re-walked in revision round 1, when Task 36 split from Task 28 and Task 11 took the agents' analyze-command citations; the sites they reach are unchanged, and only rows 84, 174 and 175 changed owner.

**Derivation entry D1 — corpus files carrying a table token or a run title (command).** Re-run verbatim from the checkout root:
`git grep -lE 'harness\.config|sdlc-harness|harness-scripts|harness-task-offer|harness-no-offer|harness-analyze|harness-read-mention|harness-watcher@|harness:unfilled|harness:setup-pending|harness-poll-state|Run the harness|harness (run|pause|stop|control|trigger)( [^a-z ]|[^ a-z]| [a-z]+_)|harness <action>|harness [$][{][{]' -- . ':!harness-runs' ':!cli/src' ':!cli/test' ':!examples/notes-app/sdlc-harness'`

**Derivation entry D2 — renamed paths (command).** Re-run verbatim: `git ls-files -- '*harness.config*' '*harness-task-offer*' 'plugin/commands/harness-*'`, then `git ls-tree -d --name-only HEAD -- examples/notes-app/sdlc-harness`. Each path either prints is a site whose **name** changes.

**Derivation entry D3 — the old `scriptsDir` fallback (command).** Re-run verbatim:
``git grep -lE '`scripts/?` when the key is absent|`scripts` for the second by default|absent `scriptsDir`|An absent key means `scripts`|before 0\.6\.6|// "scripts"|scriptsDir "?scripts"?(\)|$)|"default": "scripts"' -- . ':!harness-runs' ':!cli/src' ':!cli/test'``

**Derivation entry D4 — standing-artifact rows (procedure).** **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`. **Artifact:** the standing lessons ledger at the root of `harness-runs/`. **Traversal:** its `## ` headings in file order, then the `- ` rule lines under each. **Decision rule:** a rule line is reached when it constrains how a renamed name, a wire identifier or an adopter-run command is written.

**Closure invariant:** every site each derivation entry reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `.claude/CLAUDE.md` | this repository's render | D1 | `no-change` | Under `.claude/**`, which no task may write. Task 35's `## Paste record`; the maintainer applies it |
| 2 | `.claude/context/cli.md` | — | D1 | `no-change` | A conventions document. Raised as `stale-rule` in `## Corpus staleness` for a hand edit |
| 3 | `.claude/context/conventions.md` | — | D1 | `no-change` | As row 2 |
| 4 | `.claude/context/plugin.md` | — | D1 | `no-change` | As row 2 |
| 5 | `.claude/harness-task-offer.md` | this repository's render | D1, D2 | `no-change` | Under `.claude/**`. Task 35's `## Paste record` renames it and respells it |
| 6 | `.claude/push-notify.env.example` | this repository's render | D1 | `no-change` | As row 1 |
| 7 | `.gitignore` | this repository's render | D1 | `change` | Task 35 |
| 8 | `ARCHITECTURE.md` | — | D1 | `change` | Task 27 |
| 9 | `CONTRIBUTING.md` | — | D1 | `change` | Task 27 |
| 10 | `README.md` | — | D1 | `change` | Task 27 |
| 11 | `ROADMAP.md` | — | D1 | `change` | Task 27. The *"Interactive session vs harness run"* lines are prose under row 12 and stay |
| 12 | `cli/README.md` | — | D1 | `change` | Task 9 |
| 13 | `cli/scripts/daemon/systemd.service.template` | — | D1 | `change` | Task 3 |
| 14 | `cli/templates/README.md` | template | D1 | `change` | Task 9 |
| 15 | `cli/templates/claude/CLAUDE.md` | template | D1 | `change` | Task 2 |
| 16 | `cli/templates/claude/README.md` | template | D1 | `change` | Task 2 |
| 17 | `cli/templates/claude/context/api.md` | template | D1 | `change` | Task 2 |
| 18 | `cli/templates/claude/context/conventions.md` | template | D1 | `change` | Task 2 |
| 19 | `cli/templates/claude/context/data-layer.md` | template | D1 | `change` | Task 2 |
| 20 | `cli/templates/claude/context/data-storage.md` | template | D1 | `change` | Task 2 |
| 21 | `cli/templates/claude/context/docs-catalog.md` | template | D1 | `change` | Task 2 |
| 22 | `cli/templates/claude/context/domain.md` | template | D1 | `change` | Task 2 |
| 23 | `cli/templates/claude/context/layer.md` | template | D1 | `change` | Task 2 |
| 24 | `cli/templates/claude/context/module.md` | template | D1 | `change` | Task 2 |
| 25 | `cli/templates/claude/context/package.md` | template | D1 | `change` | Task 2 |
| 26 | `cli/templates/claude/context/presentation.md` | template | D1 | `change` | Task 2 |
| 27 | `cli/templates/claude/context/state-slices.md` | template | D1 | `change` | Task 2 |
| 28 | `cli/templates/claude/context/tests.md` | template | D1 | `change` | Task 2 |
| 29 | `cli/templates/claude/harness-task-offer.md` | template | D1, D2 | `change` | Task 2 (renamed to `devscene-task-offer.md`) |
| 30 | `cli/templates/claude/push-notify.env.example` | template | D1 | `change` | Task 9 |
| 31 | `cli/templates/claude/qa-accounts.env.example` | template | D1 | `change` | Task 9 |
| 32 | `cli/templates/claude/settings.autonomous.json` | template | D1 | `change` | Task 9 |
| 33 | `cli/templates/claude/settings.autonomous.qa.json` | template | D1 | `change` | Task 9 |
| 34 | `cli/templates/claude/settings.autonomous.retrieval.json` | template | D1 | `change` | Task 9 |
| 35 | `cli/templates/githooks/README.md` | template | D1 | `change` | Task 9 |
| 36 | `cli/templates/githooks/pre-push` | template | D1 | `change` | Task 9 |
| 37 | `cli/templates/github/workflows/devscene-control.yml` | template | D1, D3 | `change` | Task 6 |
| 38 | `cli/templates/github/workflows/devscene-resume.yml` | template | D1, D3 | `change` | Task 6 |
| 39 | `cli/templates/github/workflows/devscene-run.yml` | template | D1, D3 | `change` | Task 6 |
| 40 | `cli/templates/github/workflows/devscene-trigger.yml` | template | D1, D3 | `change` | Task 6 |
| 41 | `cli/templates/repo/gitignore` | template | D1 | `change` | Task 9 |
| 42 | `cli/templates/scripts/README.md` | template | D1 | `change` | Task 8 |
| 43 | `cli/templates/scripts/autonomous-watcher.sh` | template | D1 | `change` | Task 5 |
| 44 | `cli/templates/scripts/cleanup-merged-worktrees.sh` | template | D1 | `change` | Task 7 |
| 45 | `cli/templates/scripts/commit-on-branch.sh` | template | D1 | `change` | Task 7 |
| 46 | `cli/templates/scripts/create-worktree.sh` | template | D1 | `change` | Task 7 |
| 47 | `cli/templates/scripts/deploy.sh` | template | D1 | `change` | Task 8 |
| 48 | `cli/templates/scripts/docs-search-server.sh` | template | D1 | `change` | Task 8 |
| 49 | `cli/templates/scripts/flow-walker.sh` | template | D1 | `change` | Task 8 |
| 50 | `cli/templates/scripts/launch-sandboxed-gates.sh` | template | D1 | `change` | Task 8 |
| 51 | `cli/templates/scripts/lib/flow-walker-gates.sh` | template | D1 | `change` | Task 8 |
| 52 | `cli/templates/scripts/lib/harness-run-lib.sh` | template | D1 | `change` | Task 5 (its D3 line, `hr_config_dir … scriptsDir "scripts"`, too) |
| 53 | `cli/templates/scripts/prompt-injection-screen.sh` | template | D1 | `change` | Task 8 |
| 54 | `cli/templates/scripts/push-branch.sh` | template | D1 | `change` | Task 7 |
| 55 | `cli/templates/scripts/refresh-branch.sh` | template | D1 | `change` | Task 7 |
| 56 | `cli/templates/scripts/remote-run.sh` | template | D1 | `change` | Task 6 |
| 57 | `cli/templates/scripts/restart-watcher.sh` | template | D1 | `change` | Task 5 |
| 58 | `cli/templates/scripts/run-analytics.sh` | template | D1 | `change` | Task 8 |
| 59 | `cli/templates/scripts/run-test-suite.sh` | template | D1 | `change` | Task 8 |
| 60 | `cli/templates/scripts/scratch-run.sh` | template | D1 | `change` | Task 7 |
| 61 | `cli/templates/scripts/setup-worktree.sh` | template | D1 | `change` | Task 7 |
| 62 | `cli/templates/scripts/start-dev-server.sh` | template | D1 | `change` | Task 8 |
| 63 | `cli/templates/scripts/task-offer-check.sh` | template | D1 | `change` | Task 8 |
| 64 | `cli/templates/scripts/test.sh` | template | D1 | `change` | Task 8 |
| 65 | `cli/templates/scripts/typecheck.sh` | template | D1 | `change` | Task 8 |
| 66 | `cli/templates/state-dir/README-root.md` | template | D1 | `change` | Task 9 |
| 67 | `cli/templates/state-dir/architecture_branch_review_point_reviews/README.md` | template | D1 | `change` | Task 9 |
| 68 | `cli/templates/state-dir/business_parity_branch_review_point_reviews/README.md` | template | D1 | `change` | Task 9 |
| 69 | `cli/templates/state-dir/business_parity_branch_reviews/README.md` | template | D1 | `change` | Task 9 |
| 70 | `cli/templates/state-dir/business_parity_reviews/README.md` | template | D1 | `change` | Task 9 |
| 71 | `cli/templates/state-dir/business_parity_user_review_reviews/README.md` | template | D1 | `change` | Task 9 |
| 72 | `cli/templates/state-dir/docs_catalog/README.md` | template | D1 | `change` | Task 9 |
| 73 | `cli/templates/state-dir/flow_progress/README.md` | template | D1 | `change` | Task 9 |
| 74 | `cli/templates/state-dir/qa_review_point_reviews/README.md` | template | D1 | `change` | Task 9 |
| 75 | `cli/templates/state-dir/qa_reviews/README.md` | template | D1 | `change` | Task 9 |
| 76 | `cli/templates/state-dir/ui_test_plan_reviews/README.md` | template | D1 | `change` | Task 9 |
| 77 | `cli/templates/state-dir/ui_test_plans/README.md` | template | D1 | `change` | Task 9 |
| 78 | `docs-retrieval-service/README.md` | — | D1 | `change` | Task 18 |
| 79 | `docs-retrieval-service/src/harness_docs_retrieval/corpus.py` | — | D1 | `change` | Task 18 (the package directory name stays, out of scope) |
| 80 | `docs-retrieval-service/src/harness_docs_retrieval/service.py` | — | D1 | `change` | Task 18 |
| 81 | `docs-retrieval-service/tests/test_backend_parity_e2e.py` | — | D1 | `change` | Task 18 |
| 82 | `docs/analyze.md` | — | D1 | `change` | Task 28 |
| 83 | `docs/cli.md` | — | D1, D3 | `change` | Task 28 |
| 84 | `docs/config.md` | — | D1, D3 | `change` | Task 36 (§3's default sentence and §5's `stateDir` and `scriptsDir` rows, its D3 lines among them) and Task 28 (every other respelling) |
| 85 | `docs/copilot-foundry-research.md` | — | D1 | `change` | Task 32 |
| 86 | `docs/development.md` | — | D1, D3 | `change` | Task 29 |
| 87 | `docs/github-issue-trigger.md` | — | D1 | `change` | Task 30 |
| 88 | `docs/github-run-control.md` | — | D1 | `change` | Task 30 |
| 89 | `docs/guard-verification.md` | — | D1, D3 | `change` | Task 31: rows 1 and 2 throughout, and the re-measurement of `#### The single-guard configuration gates`' three `scriptsDir`-absent / `scriptsDir`-configured matrix rows, whose schema-default probe `<repo>/scripts/typecheck.sh` Task 10's default change moves. Its D3 hit, the absent-`scriptsDir` paragraph under that table, stays only if the re-taken rows still show it |
| 90 | `docs/outer-loop-verification.md` | — | D1 | `change` | Task 31 |
| 91 | `docs/rag-extraction-research/01-current-mechanism.md` | — | D1 | `change` | Task 32 |
| 92 | `docs/rag-extraction-research/07-extraction-plan.md` | — | D1 | `change` | Task 32 |
| 93 | `docs/rag-extraction-research/reviews/01-current-mechanism.md` | — | D1 | `change` | Task 32 |
| 94 | `docs/rag-extraction-research/reviews/07-extraction-plan.md` | — | D1 | `change` | Task 32. Its recorded `git grep -lE "harness.config|…"` line and its *"devscene4 renames `harness.config.json` → `devscene.config.json`"* line state a measured command and the rename mapping. They stay as deliberate leftovers |
| 95 | `docs/remote-execution.md` | — | D1 | `change` | Task 30 |
| 96 | `docs/retrieval-eval-results.md` | — | D1 | `change` | Task 32 |
| 97 | `docs/retrieval-eval.md` | — | D1 | `change` | Task 32 |
| 98 | `docs/retrieval.md` | — | D1 | `change` | Task 32 |
| 99 | `docs/sandbox-record.md` | — | D1 | `change` | Task 31 |
| 100 | `docs/sandbox-verification.md` | — | D1 | `change` | Task 31. Its *"No harness run."* is prose under row 12 and stays |
| 101 | `docs/team-accounts-research.md` | — | D1 | `change` | Task 32 |
| 102 | `docs/typecheck-key-decision.md` | — | D1 | `change` | Task 32 |
| 103 | `docs/watcher.md` | — | D1 | `change` | Task 30. Its *"for a harness run — locally"* is prose under row 12 and stays |
| 104 | `docs/work-report-research/README.md` | — | D1 | `change` | Task 33 |
| 105 | `docs/work-report-research/_brief.md` | — | D1 | `change` | Task 33 |
| 106 | `docs/work-report-research/business-parity-reviewer.md` | — | D1 | `change` | Task 33 |
| 107 | `docs/work-report-research/conventions-reviewer.md` | — | D1 | `change` | Task 33 |
| 108 | `docs/work-report-research/conventions-writer.md` | — | D1 | `change` | Task 33 |
| 109 | `docs/work-report-research/docs-reviewer.md` | — | D1 | `change` | Task 33 |
| 110 | `docs/work-report-research/docs-writer.md` | — | D1 | `change` | Task 33 |
| 111 | `docs/work-report-research/layer-implementer.md` | — | D1 | `change` | Task 33 |
| 112 | `docs/work-report-research/layer-reviewer.md` | — | D1 | `change` | Task 33 |
| 113 | `docs/work-report-research/qa-tester-mobile-maestro.md` | — | D1 | `change` | Task 33 |
| 114 | `docs/work-report-research/qa-tester-mobile-mcp.md` | — | D1 | `change` | Task 33 |
| 115 | `docs/work-report-research/qa-tester.md` | — | D1 | `change` | Task 33 |
| 116 | `docs/work-report-research/review-plan-reviewer.md` | — | D1 | `change` | Task 33 |
| 117 | `docs/work-report-research/reviews/conventions-reviewer.md` | — | D1 | `change` | Task 33 |
| 118 | `docs/work-report-research/reviews/conventions-writer.md` | — | D1 | `change` | Task 33 |
| 119 | `docs/work-report-research/reviews/docs-reviewer.md` | — | D1 | `change` | Task 33 |
| 120 | `docs/work-report-research/reviews/layer-implementer.md` | — | D1 | `change` | Task 33 |
| 121 | `docs/work-report-research/reviews/layer-reviewer.md` | — | D1 | `change` | Task 33 |
| 122 | `docs/work-report-research/reviews/qa-tester-mobile-mcp.md` | — | D1 | `change` | Task 33 |
| 123 | `docs/work-report-research/reviews/qa-tester.md` | — | D1 | `change` | Task 33 |
| 124 | `docs/work-report-research/reviews/task-plan-reviewer.md` | — | D1 | `change` | Task 33 |
| 125 | `docs/work-report-research/skeptic-reviewer.md` | — | D1 | `change` | Task 33 |
| 126 | `docs/work-report-research/task-plan-reviewer.md` | — | D1 | `change` | Task 33 |
| 127 | `docs/work-report-research/task-plan-writer.md` | — | D1 | `change` | Task 33 |
| 128 | `docs/work-report-research/test-fix-plan-writer.md` | — | D1 | `change` | Task 33 |
| 129 | `docs/work-report-research/ui-tests-plan-reviewer.md` | — | D1 | `change` | Task 33 |
| 130 | `docs/work-report-research/user-review-fix-plan-writer.md` | — | D1 | `change` | Task 33 |
| 131 | `evals/README.md` | — | D1 | `change` | Task 18 |
| 132 | `evals/docs-retrieval/README.md` | — | D1 | `change` | Task 18 |
| 133 | `evals/docs-retrieval/cold-build.mjs` | — | D1 | `change` | Task 18 |
| 134 | `evals/docs-retrieval/corpora.mjs` | — | D1 | `change` | Task 18 |
| 135 | `evals/docs-retrieval/index-build.mjs` | — | D1 | `change` | Task 18 (row 11's prose form) |
| 136 | `evals/docs-retrieval/mirror-fixture.mjs` | — | D1 | `change` | Task 18 |
| 137 | `evals/docs-retrieval/query-log-pass.mjs` | — | D1 | `change` | Task 18 |
| 138 | `evals/docs-retrieval/results.mjs` | — | D1 | `change` | Task 18 |
| 139 | `evals/plan-shape/case.yaml` | — | D1 | `change` | Task 18 |
| 140 | `evals/plan-shape/graders/plan-shape.md` | — | D1 | `change` | Task 18 |
| 141 | `evals/plan-shape/scaffold.sh` | — | D1 | `change` | Task 18 |
| 142 | `evals/prompt-injection-reviewer/fixtures/clean.benign.md` | — | D1 | `change` | Task 18 |
| 143 | `evals/prompt-injection-reviewer/fixtures/hidden-instruction.hostile.md` | — | D1 | `change` | Task 18 |
| 144 | `examples/README.md` | — | D1 | `change` | Task 34 |
| 145 | `examples/harness.config.json` | — | D1, D2 | `change` | Task 15 (renamed to `examples/devscene.config.json`) |
| 146 | `examples/notes-app/.claude/CLAUDE.md` | capture | D1 | `no-change` | Frozen capture (`examples/notes-app/README.md` → *"The capture is frozen; the fixture is live"*) |
| 147 | `examples/notes-app/.claude/context/conventions.md` | capture | D1 | `no-change` | As row 146 |
| 148 | `examples/notes-app/.claude/context/data-layer.md` | capture | D1 | `no-change` | As row 146 |
| 149 | `examples/notes-app/.claude/context/domain.md` | capture | D1 | `no-change` | As row 146 |
| 150 | `examples/notes-app/.claude/context/presentation.md` | capture | D1 | `no-change` | As row 146 |
| 151 | `examples/notes-app/.claude/context/tests.md` | capture | D1 | `no-change` | As row 146 |
| 152 | `examples/notes-app/.claude/harness-task-offer.md` | worked example's render | D1, D2 | `no-change` | A live render under `.claude/**`. Task 35's `## Paste record` renames and respells it |
| 153 | `examples/notes-app/.claude/push-notify.env.example` | worked example's render | D1 | `no-change` | As row 152 |
| 154 | `examples/notes-app/.claude/qa-accounts.env.example` | worked example's render | D1 | `no-change` | As row 152 |
| 155 | `examples/notes-app/.claude/settings.autonomous.json` | worked example's render | D1 | `no-change` | As row 152 |
| 156 | `examples/notes-app/.gitignore` | worked example's render | D1 | `change` | Task 34 |
| 157 | `examples/notes-app/README.md` | — | D1 | `change` | Task 34. Its *"The capture predates the rename"* paragraph keeps `autonomous-sdlc-harness` (row 2's exception) |
| 158 | `examples/notes-app/githooks/pre-push` | worked example's render | D1 | `change` | Task 34 |
| 159 | `examples/notes-app/harness.config.json` | worked example's render | D1, D2 | `change` | Task 15 (renamed to `devscene.config.json`, `stateDir` respelled) |
| 160 | `examples/notes-app/scripts/start-dev-server.sh` | worked example's render | D1 | `change` | Task 34 |
| 161 | `examples/notes-app/scripts/test.sh` | worked example's render | D1 | `change` | Task 34 |
| 162 | `examples/notes-app/scripts/typecheck.sh` | worked example's render | D1 | `change` | Task 34 |
| 163 | `examples/notes-app/sdlc-harness` (directory) | capture | D2 | `change` | Task 15 moves it to `examples/notes-app/devscene/`; the artifacts inside keep their bytes |
| 164 | `githooks/pre-push` | this repository's render | D1 | `change` | Task 35 (comments only) |
| 165 | `harness.config.json` (this repository's) | this repository's render | D2 | `no-change` | Renamed by the maintainer in Task 35's `## Cutover record`, after the run; `## Context` states why no task may |
| 166 | `llms.txt` | — | D1 | `change` | Task 27 |
| 167 | `package.json` | — | D1 | `change` | Task 15 |
| 168 | `plugin/README.md` | — | D1 | `change` | Task 11 |
| 169 | `plugin/agents/README.txt` | — | D1 | `change` | Task 11 |
| 170 | `plugin/agents/architecture-reviewer.md` | — | D1 | `change` | Task 12 |
| 171 | `plugin/agents/branch-reviewer.md` | — | D1 | `change` | Task 12 |
| 172 | `plugin/agents/business-parity-reviewer.md` | — | D1 | `change` | Task 12 |
| 173 | `plugin/agents/committer.md` | — | D1 | `change` | Task 12 |
| 174 | `plugin/agents/conventions-reviewer.md` | — | D1 | `change` | Task 11 (its two `commands/harness-analyze.md` citations) and Task 12 (every other respelling) |
| 175 | `plugin/agents/conventions-writer.md` | — | D1 | `change` | Task 11 (its `commands/harness-analyze.md` dispatcher citation) and Task 12 (every other respelling) |
| 176 | `plugin/agents/docs-reviewer.md` | — | D1 | `change` | Task 12 |
| 177 | `plugin/agents/docs-writer.md` | — | D1 | `change` | Task 12 |
| 178 | `plugin/agents/layer-implementer.md` | — | D1, D3 | `change` | Task 12 |
| 179 | `plugin/agents/layer-reviewer.md` | — | D1, D3 | `change` | Task 12 |
| 180 | `plugin/agents/prompt-injection-reviewer.md` | — | D1, D3 | `change` | Task 12 |
| 181 | `plugin/agents/qa-tester-mobile-maestro.md` | — | D1 | `change` | Task 12 |
| 182 | `plugin/agents/qa-tester-mobile-mcp.md` | — | D1 | `change` | Task 12 |
| 183 | `plugin/agents/qa-tester.md` | — | D1 | `change` | Task 12 |
| 184 | `plugin/agents/review-plan-reviewer.md` | — | D1 | `change` | Task 12 |
| 185 | `plugin/agents/skeptic-reviewer.md` | — | D1 | `change` | Task 12 |
| 186 | `plugin/agents/statistics-plan-writer.md` | — | D1 | `change` | Task 12 |
| 187 | `plugin/agents/task-plan-reviewer.md` | — | D1 | `change` | Task 12 |
| 188 | `plugin/agents/task-plan-writer.md` | — | D1, D3 | `change` | Task 12 |
| 189 | `plugin/agents/test-fix-plan-writer.md` | — | D1 | `change` | Task 12 |
| 190 | `plugin/agents/ui-tests-plan-reviewer.md` | — | D1 | `change` | Task 12 |
| 191 | `plugin/agents/ui-tests-plan-writer.md` | — | D1 | `change` | Task 12 |
| 192 | `plugin/agents/user-review-fix-plan-writer.md` | — | D1 | `change` | Task 12 |
| 193 | `plugin/commands/README.txt` | — | D1 | `change` | Task 11 |
| 194 | `plugin/commands/branch-answer.md` | — | D1 | `change` | Task 11 |
| 195 | `plugin/commands/branch-implement-plan-semi-autonomous.md` | — | D1 | `change` | Task 11 |
| 196 | `plugin/commands/branch-implement-plan.md` | — | D1 | `change` | Task 11 |
| 197 | `plugin/commands/branch-implement-review.md` | — | D1 | `change` | Task 11 |
| 198 | `plugin/commands/branch-implement-user-review-semi-autonomous.md` | — | D1 | `change` | Task 11 |
| 199 | `plugin/commands/branch-implement-user-review.md` | — | D1 | `change` | Task 11 |
| 200 | `plugin/commands/branch-pause.md` | — | D1 | `change` | Task 11 |
| 201 | `plugin/commands/branch-prompt.md` | — | D1 | `change` | Task 11 |
| 202 | `plugin/commands/branch-qa-test.md` | — | D1 | `change` | Task 11 |
| 203 | `plugin/commands/branch-resume.md` | — | D1 | `change` | Task 11 |
| 204 | `plugin/commands/branch-review.md` | — | D1 | `change` | Task 11 |
| 205 | `plugin/commands/branch-start-docs-autonomous.md` | — | D1 | `change` | Task 11 |
| 206 | `plugin/commands/branch-start-plan-autonomous.md` | — | D1 | `change` | Task 11 |
| 207 | `plugin/commands/branch-start-plan-semi-autonomous.md` | — | D1 | `change` | Task 11 |
| 208 | `plugin/commands/branch-start-plan.md` | — | D1 | `change` | Task 11 |
| 209 | `plugin/commands/branch-start-user-review-fix-autonomous.md` | — | D1 | `change` | Task 11 |
| 210 | `plugin/commands/branch-start-user-review-fix-plan.md` | — | D1 | `change` | Task 11 |
| 211 | `plugin/commands/branch-status.md` | — | D1 | `change` | Task 11 |
| 212 | `plugin/commands/branch-user-review.md` | — | D1 | `change` | Task 11 |
| 213 | `plugin/commands/harness-analyze.md` | — | D1, D2 | `change` | Task 11 (renamed to `analyze.md`) |
| 214 | `plugin/commands/harness-read-mention.md` | — | D2 | `change` | Task 11 (renamed to `read-mention.md`) |
| 215 | `plugin/docs/AUTONOMOUS_FLOW.md` | — | D1 | `change` | Task 14 |
| 216 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` | — | D1 | `change` | Task 14 |
| 217 | `plugin/hooks/README.md` | — | D1 | `change` | Task 10 |
| 218 | `plugin/hooks/allow-qa-credentials-read.sh` | — | D1 | `change` | Task 10 |
| 219 | `plugin/hooks/allow-safe-compounds.sh` | — | D1 | `change` | Task 10 |
| 220 | `plugin/hooks/autonomous-protected-branch-guard.sh` | — | D1 | `change` | Task 10 |
| 221 | `plugin/hooks/autonomous-script-allowlist-guard.sh` | — | D1, D3 | `change` | Task 10 |
| 222 | `plugin/hooks/git-commit-branch-guard.sh` | — | D1 | `change` | Task 10 |
| 223 | `plugin/hooks/git-rewrite-branch-guard.sh` | — | D1 | `change` | Task 10 |
| 224 | `plugin/hooks/git-trust-file-guard.sh` | — | D1 | `change` | Task 10 |
| 225 | `plugin/hooks/lib/harness-config-lib.sh` | — | D1 | `change` | Task 10 (file name kept) |
| 226 | `plugin/instructions/autonomous_pause_and_ledger.md` | — | D1 | `change` | Task 13 |
| 227 | `plugin/instructions/clarification_digest_instructions.md` | — | D1 | `change` | Task 13 |
| 228 | `plugin/instructions/code_review_fixes_instructions.md` | — | D1 | `change` | Task 13 |
| 229 | `plugin/instructions/code_review_instructions.md` | — | D1 | `change` | Task 13 |
| 230 | `plugin/instructions/dispatch_discipline_instructions.md` | — | D1 | `change` | Task 13 |
| 231 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` | — | D1 | `change` | Task 13 |
| 232 | `plugin/instructions/docs_phase_instructions.md` | — | D1 | `change` | Task 13 |
| 233 | `plugin/instructions/improvement_observations_instructions.md` | — | D1 | `change` | Task 13 |
| 234 | `plugin/instructions/main_repo_resolution.md` | — | D1 | `change` | Task 13 |
| 235 | `plugin/instructions/mode_contract.md` | — | D1 | `change` | Task 13 |
| 236 | `plugin/instructions/plan_orchestration_instructions.md` | — | D1 | `change` | Task 13 |
| 237 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` | — | D1 | `change` | Task 13 |
| 238 | `plugin/instructions/plan_orchestration_instructions_core.md` | — | D1 | `change` | Task 13 |
| 239 | `plugin/instructions/plan_orchestration_instructions_semi_autonomous.md` | — | D1 | `change` | Task 13 |
| 240 | `plugin/instructions/prompt_injection_screen.md` | — | D1, D3 | `change` | Task 13 |
| 241 | `plugin/instructions/qa_test_instructions.md` | — | D1 | `change` | Task 14 |
| 242 | `plugin/instructions/run_mode_instructions.md` | — | D1 | `change` | Task 14 |
| 243 | `plugin/instructions/task_plan_implementation_instructions.md` | — | D1 | `change` | Task 14 |
| 244 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` | — | D1 | `change` | Task 14 |
| 245 | `plugin/instructions/task_plan_writing_instructions_core.md` | — | D1 | `change` | Task 14 |
| 246 | `plugin/instructions/task_plan_writing_instructions_semi_autonomous.md` | — | D1 | `change` | Task 14 |
| 247 | `plugin/instructions/unit_loop_core.md` | — | D1 | `change` | Task 14 |
| 248 | `plugin/instructions/untrusted_input.md` | — | D1 | `change` | Task 14 |
| 249 | `plugin/instructions/user_review_fix_plan_writing_instructions.md` | — | D1 | `change` | Task 14 |
| 250 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` | — | D1 | `change` | Task 14 |
| 251 | `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` | — | D1 | `change` | Task 14 |
| 252 | `plugin/instructions/user_review_fixes_instructions.md` | — | D1 | `change` | Task 14 |
| 253 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` | — | D1 | `change` | Task 14 |
| 254 | `plugin/instructions/user_review_fixes_instructions_core.md` | — | D1 | `change` | Task 14 |
| 255 | `plugin/instructions/user_review_fixes_instructions_semi_autonomous.md` | — | D1 | `change` | Task 14 |
| 256 | `plugin/samples/sample_code_review.md` | — | D1 | `change` | Task 14 |
| 257 | `plugin/samples/sample_code_review/finding_1.md` | — | D1 | `change` | Task 14 |
| 258 | `plugin/samples/sample_statistics.md` | — | D1 | `change` | Task 14 |
| 259 | `plugin/samples/sample_story/task_2_plan.md` | — | D1 | `change` | Task 14 |
| 260 | `plugin/samples/sample_story_plan.md` | — | D1 | `change` | Task 14 |
| 261 | `plugin/samples/sample_task_plan.md` | — | D1 | `change` | Task 14 |
| 262 | `plugin/samples/sample_user_review_fix_plan.md` | — | D1 | `change` | Task 14 |
| 263 | `plugin/samples/sample_user_review_fix_plan/finding_1.md` | — | D1 | `change` | Task 14 |
| 264 | `plugin/samples/sample_user_review_fix_plan/finding_2.md` | — | D1 | `change` | Task 14 |
| 265 | `plugin/samples/sample_user_review_fix_plan/finding_3.md` | — | D1 | `change` | Task 14 |
| 266 | `plugin/scripts/release-qa-user.sh` | — | D1 | `change` | Task 10 |
| 267 | `plugin/scripts/reserve-qa-user.sh` | — | D1 | `change` | Task 10 |
| 268 | `schemas/README.md` | — | D1 | `change` | Task 15 |
| 269 | `schemas/harness.config.schema.json` | — | D1, D2, D3 | `change` | Task 15 (renamed to `devscene.config.schema.json`) |
| 270 | `schemas/negative/README.md` | — | D1 | `change` | Task 15 |
| 271 | `schemas/negative/agent-effort-unknown.json` | — | D1 | `change` | Task 15 |
| 272 | `schemas/negative/detection-preset-unknown.json` | — | D1 | `change` | Task 15 |
| 273 | `schemas/negative/docs-retrieval-backend-unknown.json` | — | D1 | `change` | Task 15 |
| 274 | `schemas/negative/docs-retrieval-without-docs-phase.json` | — | D1 | `change` | Task 15 |
| 275 | `schemas/negative/execution-target-unknown.json` | — | D1 | `change` | Task 15 |
| 276 | `schemas/negative/layers-no-catch-all.json` | — | D1 | `change` | Task 15 |
| 277 | `schemas/negative/qa-driver-unknown.json` | — | D1 | `change` | Task 15 |
| 278 | `schemas/negative/sandbox-domain-without-reason.json` | — | D1 | `change` | Task 15 |
| 279 | `schemas/negative/sandbox-opt-out-boolean.json` | — | D1 | `change` | Task 15 |
| 280 | `schemas/negative/sandbox-pass-env-not-a-name.json` | — | D1 | `change` | Task 15 |
| 281 | `schemas/negative/state-dir-leading-dot.json` | — | D1 | `change` | Task 15 |
| 282 | `schemas/negative/state-dir-nested-dot.json` | — | D1 | `change` | Task 15 |
| 283 | `schemas/negative/tree-guard-without-covers.json` | — | D1 | `change` | Task 15 |
| 284 | `scripts/autonomous-watcher.sh` | adopted copy | D1 | `no-change` | Self-adopted copy of row 43. Task 35's `## Cutover record`, after the run |
| 285 | `scripts/check-command-spelling.sh` | — | D1 | `change` | Task 17 |
| 286 | `scripts/cleanup-merged-worktrees.sh` | adopted copy | D1 | `no-change` | Copy of row 44; cutover record |
| 287 | `scripts/commit-on-branch.sh` | adopted copy | D1 | `no-change` | Copy of row 45; cutover record |
| 288 | `scripts/create-worktree.sh` | adopted copy | D1 | `no-change` | Copy of row 46; cutover record |
| 289 | `scripts/docs-search-server.sh` | adopted copy | D1 | `no-change` | Copy of row 48; cutover record |
| 290 | `scripts/flow-walker.sh` | adopted copy | D1 | `no-change` | Copy of row 49; cutover record |
| 291 | `scripts/launch-sandboxed-gates.sh` | adopted copy | D1 | `no-change` | Copy of row 50; cutover record |
| 292 | `scripts/lib/flow-walker-gates.sh` | adopted copy | D1 | `no-change` | Copy of row 51; cutover record |
| 293 | `scripts/lib/gate12-sandbox-round/core.sh` | — | D1 | `change` | Task 16 |
| 294 | `scripts/lib/gate12-sandbox-round/grade-full-run.sh` | — | D1 | `change` | Task 16 |
| 295 | `scripts/lib/gate12-sandbox-round/grade-plant.sh` | — | D1 | `change` | Task 16 |
| 296 | `scripts/lib/gate12-sandbox-round/grade-state.sh` | — | D1 | `change` | Task 16 |
| 297 | `scripts/lib/gate12-sandbox-round/plant.sh` | — | D1 | `change` | Task 16 |
| 298 | `scripts/lib/gate12-sandbox-round/preflight.sh` | — | D1 | `change` | Task 16 |
| 299 | `scripts/lib/gate12-sandbox-round/runs.sh` | — | D1 | `change` | Task 16 |
| 300 | `scripts/lib/gate12-sandbox-round/state.sh` | — | D1 | `change` | Task 16 |
| 301 | `scripts/lib/harness-run-lib.sh` | adopted copy | D1, D3 | `no-change` | Copy of row 52; cutover record |
| 302 | `scripts/lib/sandbox-probe/legs-gate-sandbox.sh` | — | D1 | `change` | Task 16 |
| 303 | `scripts/lib/sandbox-probe/legs-planted-files.sh` | — | D1 | `change` | Task 16 |
| 304 | `scripts/lib/sandbox-probe/legs-refresh.sh` | — | D1 | `change` | Task 16 |
| 305 | `scripts/lib/sandbox-probe/legs-refusal.sh` | — | D1 | `change` | Task 16 |
| 306 | `scripts/lib/sandbox-probe/legs-settings.sh` | — | D1 | `change` | Task 16 |
| 307 | `scripts/lib/sandbox-probe/preflight.sh` | — | D1 | `change` | Task 16 |
| 308 | `scripts/lib/sandbox-probe/session.sh` | — | D1 | `change` | Task 16 |
| 309 | `scripts/prompt-injection-screen.sh` | adopted copy | D1 | `no-change` | Copy of row 53; cutover record |
| 310 | `scripts/publish-main.sh` | — | D1 | `change` | Task 17 |
| 311 | `scripts/push-branch.sh` | adopted copy | D1 | `no-change` | Copy of row 54; cutover record |
| 312 | `scripts/refresh-branch.sh` | adopted copy | D1 | `no-change` | Copy of row 55; cutover record |
| 313 | `scripts/remote-run.sh` | adopted copy | D1 | `no-change` | Copy of row 56; cutover record |
| 314 | `scripts/restart-watcher.sh` | adopted copy | D1 | `no-change` | Copy of row 57; cutover record |
| 315 | `scripts/run-analytics.sh` | adopted copy | D1 | `no-change` | Copy of row 58; cutover record |
| 316 | `scripts/run-gates.sh` | — | D1 | `change` | Task 17 |
| 317 | `scripts/run-test-suite.sh` | adopted copy | D1 | `no-change` | Copy of row 59; cutover record |
| 318 | `scripts/sandbox-absent-path-check.sh` | — | D1 | `change` | Task 16 |
| 319 | `scripts/sandbox-probe-runner.yml` | — | D1, D3 | `change` | Task 16 |
| 320 | `scripts/scratch-run.sh` | adopted copy | D1 | `no-change` | Copy of row 60; cutover record |
| 321 | `scripts/setup-worktree.sh` | adopted copy | D1 | `no-change` | Copy of row 61; cutover record |
| 322 | `scripts/task-offer-check.sh` | adopted copy | D1 | `no-change` | Copy of row 63; cutover record |
| 323 | `scripts/test.sh` | this repository's render | D1 | `no-change` | Rendered copy of row 64; cutover record (row 1 of the table only) |
| 324 | `scripts/typecheck.sh` | this repository's render | D1 | `no-change` | Rendered copy of row 65; cutover record (row 1 of the table only) |
| 325 | `harness-runs/lessons.md` → *"A rename declared breaking ships no compatibility path …"* | — | D4, constrains how a renamed name is written | `no-change` | The rule stands and binds every task: no fallback read, no repair, no sentence naming an old value (`## Context`, first paragraph) |
| 326 | `harness-runs/lessons.md` → *"Name an adopter-facing surface with the term adopters already arrive with … never the configuration key, tool name, check id or any other wire identifier."* | — | D4, constrains renaming a wire identifier | `no-change` | The rule stands. The task prompt explicitly orders this rename of file names, command names and markers, with no alias because backward compatibility is out of scope |
| 327 | `harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block …"* | — | D4, constrains how a command is written | `no-change` | The rule stands and binds Tasks 27–34: a respelled `/devscene:analyze` or `npx devscene …` line stays in its fenced block, and no inline command is introduced |

## Rejected findings

- **Should Fix 1 — the CLI names the renamed slash commands before the plugin ships them** (rejected round 2) — The reorder is not taken; the inversion is recorded instead, in `## Context` → *Order, and the tree guards that force it*, as the third deliberate departure. The CLI and template names resolve only against the adopter's installed plugin (`remote-run.sh` checks `$HARNESS_MENTION_PLUGIN_DIR/commands/<basename>.md`; `init` only prints the command), no intermediate commit runs against the in-tree plugin, and the installed plugin is refreshed only after merge. Moving Task 11 ahead of Task 1 would open the same gap in the other direction, and only a cross-layer commit could close it.
