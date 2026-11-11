# Story: Rename the adopter-facing `HARNESS_*` variables to `DEVSCENE_*`

## Context

This branch renames every `HARNESS_*` variable an adopter sets, reads or is told about to `DEVSCENE_*`. It is the third of five rename branches after `chore_rename_to_devscene`. Backward compatibility is out of scope. Nothing reads an old name as a fallback: no `${DEVSCENE_X:-$HARNESS_X}`. Nothing repairs a file an earlier release wrote: no key migration in `init`, and no `doctor` note that spots an old-named variable. No sentence anywhere names an old name or says that a name changed (`harness-runs/lessons.md` → *Adopter-facing documentation*, the breaking-rename rule). Adopters migrate by hand.

**The spelling table. Every task applies it; no task re-decides it.** Each row is a literal substring replacement, `HARNESS_` → `DEVSCENE_`, with the rest of the token kept as it is. A plain substring replacement of these tokens, such as an `Edit` with `replace_all`, is exactly the rename. That holds because no kept or excluded name contains one of these substrings: `HARNESS_REMOTE_STOP` is not inside `HARNESS_REMOTE_SLUG`; `HARNESS_GIT_TOKEN` is not inside `HARNESS_GITHUB_*`; `HARNESS_STEP_TIMEOUT_MINUTES` is not inside `HARNESS_STEP_ALLOWANCE_MINUTES`; `HARNESS_SELF_PAUSE_AFTER_MINUTES` is not inside `HARNESS_SELF_PAUSE_MARGIN_MINUTES`; and no kept name begins `HARNESS_CLI`, `HARNESS_PUSH_`, `HARNESS_QA_`, `HARNESS_RUN` or `HARNESS_POLL_`. `HARNESS_CLI` and `HARNESS_CLI_VERSION` are both renamed, so replacing `HARNESS_CLI` turns `HARNESS_CLI_VERSION` into `DEVSCENE_CLI_VERSION`, which is correct.

| # | Old token | New token | Class | Evidence it is adopter-visible |
|---|---|---|---|---|
| 1 | `HARNESS_RUN_ACTORS` | `DEVSCENE_RUN_ACTORS` | repository variable | `vars.` in all four workflow templates; `init` prints `gh variable set`; `README.md` documents it |
| 2 | `HARNESS_TRIGGER_LABEL` | `DEVSCENE_TRIGGER_LABEL` | repository variable | `vars.` in `devscene-trigger.yml`; `init` prints `gh variable set` |
| 3 | `HARNESS_TRIGGER_ALLOWED_BOTS` | `DEVSCENE_TRIGGER_ALLOWED_BOTS` | repository variable | `vars.` in three templates; `init` prints `gh variable set` |
| 4 | `HARNESS_RUNNER` | `DEVSCENE_RUNNER` | repository variable | `vars.` in all four templates; `init` prints `gh variable set`; `doctor --help` names it |
| 5 | `HARNESS_REMOTE_STOP` | `DEVSCENE_REMOTE_STOP` | repository variable | `vars.` in all four templates; `remote-run.sh`'s notification text tells the adopter to clear it |
| 6 | `HARNESS_MAX_CHAIN` | `DEVSCENE_MAX_CHAIN` | repository variable | `vars.` in `devscene-run.yml` and `devscene-resume.yml`; `remote-run.sh`'s failure notifications name it |
| 7 | `HARNESS_POLL_MAX_DISPATCH_FAILURES` | `DEVSCENE_POLL_MAX_DISPATCH_FAILURES` | repository variable | `vars.` in `devscene-resume.yml`; `docs/remote-execution.md` |
| 8 | `HARNESS_POLL_GIVE_UP_AFTER_MINUTES` | `DEVSCENE_POLL_GIVE_UP_AFTER_MINUTES` | repository variable | as row 7 |
| 9 | `HARNESS_STEP_TIMEOUT_MINUTES` | `DEVSCENE_STEP_TIMEOUT_MINUTES` | repository variable, also passed between steps | `vars.` in `devscene-run.yml`, which also writes it to `$GITHUB_ENV` and names it in a `::error::`. Set by adopters and passed internally, so renamed throughout |
| 10 | `HARNESS_SELF_PAUSE_AFTER_MINUTES` | `DEVSCENE_SELF_PAUSE_AFTER_MINUTES` | repository variable, also passed between steps | as row 9 |
| 11 | `HARNESS_GIT_TOKEN` | `DEVSCENE_GIT_TOKEN` | repository secret, also a script variable | `secrets.` in `devscene-run.yml` and `devscene-trigger.yml`; `init` prints `gh secret set`; `doctor` warns naming it |
| 12 | `HARNESS_PUSH_URL` | `DEVSCENE_PUSH_URL` | repository secret and push-settings key | `secrets.` in two templates; `init` prints `gh secret set`; the key in `push-notify.env.example` |
| 13 | `HARNESS_PUSH_CMD` | `DEVSCENE_PUSH_CMD` | push-settings key | the key in `push-notify.env.example`; `doctor` and `init` messages name it |
| 14 | `HARNESS_PUSH_TITLE` | `DEVSCENE_PUSH_TITLE` | variable the adopter's command reads | `autonomous-notify.sh` hands the title to the adopter's `PUSH_CMD` command in this variable (its header, *"the title in the environment as …"*); `docs/outer-loop-verification.md` |
| 15 | `HARNESS_PUSH_` (family prefix, `HARNESS_PUSH_*`) | `DEVSCENE_PUSH_` | prefix in prose | `push-notify.env.example` line 10; `cli/src/generators/claudeContext.ts` header |
| 16 | `HARNESS_QA_` (`HARNESS_QA_<n>_EMAIL`, `_PASSWORD`, `_USER_ID`, `_DISPLAY_NAME`, and the prefix) | `DEVSCENE_QA_` | credentials-file keys | the adopter writes them in `qa-accounts.env`; `plugin/scripts/reserve-qa-user.sh` reads them |
| 17 | `HARNESS_CLI` | `DEVSCENE_CLI` | environment override | named by the task prompt; `restart-watcher.sh`'s error text tells the adopter to set it |
| 18 | `HARNESS_CLI_VERSION` | `DEVSCENE_CLI_VERSION` | the pin line in the adopter's workflow | `doctor` and `init --upgrade-workflows` messages name it (`CLI_VERSION_VARIABLE`); `devscene-control.yml`'s `::warning::` names it; `docs/cli.md` |
| 19 | `HARNESS_AGENT_CLI` | `DEVSCENE_AGENT_CLI` | environment override | named by the task prompt; `doctor`'s daemon checks name it (`AGENT_CLI_VARIABLE`) |
| 20 | `HARNESS_GH_CLI` | `DEVSCENE_GH_CLI` | environment override | `doctor`'s `GH_INSTALL_REMEDY`: *"… or point HARNESS_GH_CLI at it"* |
| 21 | `HARNESS_MAIN_REPO` | `DEVSCENE_MAIN_REPO` | anchor the watcher sets, also set by hand | `doctor`'s `profile-main-anchor` warning names it; `docs/watcher.md` → *A session no launcher started* tells the adopter to set it by hand; `plugin/instructions/main_repo_resolution.md` → *Known cost* tells a repository to set it. Set by adopters and passed internally, so renamed throughout |
| 22 | `HARNESS_DEV_SERVER_PORT` | `DEVSCENE_DEV_SERVER_PORT` | variable the adopter's dev command reads | `start-dev-server.sh` exports it to the adopter's own command; `docs/cli.md` documents it |
| 23 | `HARNESS_FETCH_TIMEOUT` | `DEVSCENE_FETCH_TIMEOUT` | environment override | `cleanup-merged-worktrees.sh`: *"raises it for an adopter on a link where 60 s is not …"*; `docs/outer-loop-verification.md` |
| 24 | `HARNESS_VERSION_MANAGER_INIT` | `DEVSCENE_VERSION_MANAGER_INIT` | environment override | `setup-worktree.sh`'s header tells the adopter to point it at their version manager's init file |

**Names kept, and why.** Each is plumbing or a contributor or test switch that no adopter meets:
- **Plumbing between workflow steps or outer-loop scripts:** `HARNESS_INPUT_ANSWERS`, `_BRANCH`, `_CHAIN`, `_ENGINE`, `_PARK_LOOP_CLEAR`, `_RESUME`; `HARNESS_JOB_MODE`, `_STARTED_EPOCH`, `_DEADLINE_EPOCH`; `HARNESS_STOPPED`. The task prompt names these.
- **Also plumbing:**
  - `HARNESS_REMOTE_SLUG` and `HARNESS_REPO_SLUG`: workflow env to the scripts, and the watcher to the notifier.
  - `HARNESS_GITHUB_DEFAULT_BRANCH`, `HARNESS_GITHUB_DEFAULT_COMMIT` and `HARNESS_DEFAULT_BRANCH_COMMIT`: written to `$GITHUB_ENV` by the job.
  - `HARNESS_PR_TOKEN`: the job's own copy of the token secret, which the profile denies to the session.
  - `HARNESS_MENTION_PLUGIN_DIR`: passed between the steps of `devscene-control.yml`.
  - `HARNESS_HOSTED_JOB_LIMIT_MINUTES`, `HARNESS_SELF_HOSTED_JOB_LIMIT_MINUTES`, `HARNESS_STEP_ALLOWANCE_MINUTES` and `HARNESS_SELF_PAUSE_MARGIN_MINUTES`: constants in `devscene-run.yml`'s job `env:`, read by no `vars.`.
- **Plumbing named in an internal-invariant message:** the watcher's stall-watchdog line names `HARNESS_GITHUB_DEFAULT_BRANCH`, `HARNESS_GITHUB_DEFAULT_COMMIT` and `HARNESS_DEFAULT_BRANCH_COMMIT`. They stay. The task prompt's own example is the precedent: `HARNESS_JOB_MODE` stays though the watcher's usage line prints it. In that same line `HARNESS_CLI_VERSION` becomes `DEVSCENE_CLI_VERSION` (row 18).
- **Test seams no document gives an adopter:**
  - `HARNESS_TRIGGER_LOOKUP_SECS`, which `remote-run.sh` calls *"a test seam"*.
  - `AUTONOMOUS_SDLC_HARNESS_KEEP_AWAKE_LOCK_PROBE` and `AUTONOMOUS_SDLC_HARNESS_NESTED_USERNS_PROBE` (`cli/src/doctor/checks.ts`: *"No shipped path ever sets it"*; set only by `cli/test/helpers/fixture.mjs` → `ISOLATED_ENV`).
  - `HARNESS_TEST_CONCURRENCY`, `HARNESS_TEST_EXIT`, `HARNESS_TEST_RECORD`, `HARNESS_TEST_TIME_SCALE`, `HARNESS_FIXTURE_FLAG`, `HARNESS_IDENTITY` and `HARNESS_JOB_USAGE_REPEAT`: suite-only, or documented only in `docs/development.md`.
- **Contributor switches:** `HARNESS_SELF_ADOPT`, `HARNESS_EVAL_CORPUS_ROOT` (task prompt) and `HARNESS_GATES_CONTAINERS` (`scripts/run-gates.sh`, documented only in `docs/development.md`). `init`'s self-adoption refusal names `HARNESS_SELF_ADOPT`, but it fires only inside DevScene's own repository, so it stays as the task prompt directs.
- **Not a variable:** `NOT_HARNESS_BRANCH_REFUSAL`, a JavaScript constant in `cli/test/remote-control.test.mjs`.
- **Bare prefix mentions, not variables:** a token that is only a prefix, followed by `*`, by `(` or by a non-name character, names a family in prose or in a grep pattern. It names no variable, so no task changes it and the branch leaves each of these in the tree:
  - `HARNESS_` — in `cli/templates/scripts/launch-sandboxed-gates.sh` and its adopted copy `scripts/launch-sandboxed-gates.sh` (*"nothing here reads that or any other `HARNESS_*` name"*; Tasks 5 and 16 rename only that line's `HARNESS_MAIN_REPO`); in `docs/rag-extraction-research/07-extraction-plan.md` (the `HARNESS_(DOCS_)?RETRIEVAL` pattern in *"#156's Done-when grep"*); and in `docs/rag-extraction-research/reviews/07-extraction-plan.md` (the `harness.config|devscene|HARNESS_` grep, the *"case-sensitive on `HARNESS_`"* bullet and the `HARNESS_(DOCS_)?RETRIEVAL` regex).
  - `AUTONOMOUS_SDLC_HARNESS_` — in `docs/rag-extraction-research/01-current-mechanism.md` (*"names moved off `AUTONOMOUS_SDLC_HARNESS_*`"*) and in `docs/rag-extraction-research/reviews/07-extraction-plan.md` (*"The two `AUTONOMOUS_SDLC_HARNESS_*` names"*).
  - `DEVSCENE_`, the same kind of mention on the new side — in `docs/rag-extraction-research/07-extraction-plan.md` (*"`DEVSCENE_*`, `/devscene:analyze`"*) and in `docs/rag-extraction-research/reviews/07-extraction-plan.md` (*"→ `DEVSCENE_*`"*). Both were in the tree before this branch. Task 26's **No invented names** check admits it.
- **Excluded by the task prompt** (`chore_devscene_docs_retrieval` renames them): `HARNESS_DOCS_RETRIEVAL_*`, `HARNESS_RETRIEVAL_*`, `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_LOG` and `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB`, including their prose prefix forms in `docs/rag-extraction-research/`.
- **The recorded-release exception:** `examples/notes-app/.claude/context/conventions.md` keeps `HARNESS_DEV_SERVER_PORT`. It is part of the example's frozen capture of what one release produced on a stated date (`examples/notes-app/README.md` → *"The capture is frozen; the fixture is live"*; `.claude/context/conventions.md` → `## Documents of record`). The earlier rename branches kept the same capture as their recorded-release exception. It is the only renamed token left outside `harness-runs/` once Task 26's paste record is applied.

**Dated records are respelled, silently.** Gate rounds in `docs/development.md`, the sandbox records and the research documents take the table like any other text, because the *Done when* allows no exception outside `harness-runs/` and recorded-release fixtures. No sentence is added saying that a name was respelled: the breaking-rename lesson forbids it, and the earlier rename's provenance sentence is no longer in the tree. A sentence whose *claim* the rename falsifies is reworded instead. The one such sentence is the research forecast that `HARNESS_AGENT_CLI` would keep its name (Task 25).

**`.claude/**` is written by the maintainer, never by a task.** The tool layer refuses an agent's write under `.claude/**` ahead of any permission entry, and that refusal parks the run. This repository's `.claude/push-notify.env.example` and the example's live renders `examples/notes-app/.claude/{push-notify.env.example, qa-accounts.env.example, settings.autonomous.json}` therefore get no edit. Task 26 records an exact paste for each in its own per-task file, and the maintainer applies it (**Manual setup required** below). No conventions document of this repository names a renamed token, so `## Corpus staleness` is empty.

**Mirror pairs and constant owners.** `cli/src/remote/githubActions.ts` owns `RUNNER_VARIABLE`, `REMOTE_STOP_VARIABLE`, `TRIGGER_LABEL_VARIABLE`, `TRIGGER_ALLOWED_BOTS_VARIABLE`, `RUN_ACTORS_VARIABLE`, `PUSH_URL_SECRET`, `GIT_TOKEN_SECRET`, `GH_CLI_VARIABLE` and `CLI_VERSION_VARIABLE`. `cli/src/generators/notifications.ts` owns `PUSH_URL_KEY` and `PUSH_CMD_KEY`. `cli/src/core/mainRepoAnchor.ts` owns `MAIN_REPO_ANCHOR_VARIABLE`, from which `MAIN_REPO_ANCHOR_READ` and `MAIN_REPO_ANCHOR_RULE` are built. `cli/src/doctor/checks.ts` owns `AGENT_CLI_VARIABLE`. Every `init` and `doctor` message, every `gh variable set` and `gh secret set` line included, is built from these constants, so Task 2 changes their text. One message was the exception: `doctor --help` spelled `HARNESS_RUNNER` as a literal in `cli/src/commands/doctor.ts`. Task 2 makes it interpolate `${RUNNER_VARIABLE}`, so the statement holds once Task 2 lands. The shell and YAML mirrors are the four workflow templates (Task 6), `remote-run.sh` (Task 4), `autonomous-watcher.sh` and `harness-run-lib.sh` (Tasks 3 and 5), and the plugin's `printenv HARNESS_MAIN_REPO` wire (Tasks 14 and 15).

**Order, and the three tree guards that force it.**
- `test/main-repo-resolution-corpus.test.mjs` guards `plugin/**/*.md` and spells `printenv HARNESS_MAIN_REPO` as a literal. **Task 1** moves it to `MAIN_REPO_ANCHOR_VARIABLE` while that constant still holds the old name, so it passes. After Task 2 renames the constant, the guard that Task 15's plugin edit selects reads the new name.
- `test/watcher-main-anchor.test.mjs` guards `cli/templates/scripts/**`, reads the constant, and launches the watcher through `cli/test/helpers/watcher.mjs`'s agent stub. So **Task 3** is the first template-scripts task. It renames the watcher's export and agent-CLI seam *and* that helper together; otherwise the guard would launch the real agent binary.
- The suites that read `plugin/` (`qa-user-locks`, `main-root-fallback`) or this repository's `scripts/` (`sandbox-probe-git-and-legs`) are edited in **Task 18**, after their producers (Tasks 14 and 17). That is the one place the readiness list leaves `cli` → `plugin` → `general` order.

The rest runs in this order:
- Tasks 2–6: the `cli` producers.
- Tasks 7–13: the `cli` suites.
- Tasks 14–15: `plugin`.
- Tasks 16–17: this repository's scripts. Task 16 copies the renamed templates over the self-adopted copies, which have the same blob ids as their templates today (`git ls-files -s`) and differ only in mode.
- Tasks 19–25: the documents.
- Task 26: the example's live files, the paste record and the closing check.

**Test files are edited by the task that can run them green.** No `cli` producer task (2–6) edits a suite, except Task 3's helper as above. Between Task 2 and the suite tasks, suites not yet respelled are red. No intermediate commit runs them: the unit loop runs only a task's own test files and the guards its paths select, and the full suite runs once, at Phase G.

**Top risks:**
- **A stub seam renamed on one side only.** If a template reads `DEVSCENE_GH_CLI` or `DEVSCENE_AGENT_CLI` while a suite still sets `HARNESS_*`, that suite launches the real `gh` or agent binary, which reaches the network. Each suite task renames every seam in its files, and its verification greps them for any table token. Task 3 pairs the watcher with its helper for the guard's sake.
- **A mirror pair drifts.** For example, a workflow template keeps `vars.HARNESS_RUN_ACTORS` while `RUN_ACTORS_VARIABLE` says `DEVSCENE_RUN_ACTORS`. Then the allow-list is read from a variable no adopter sets. `cli/test/workflow-templates.test.mjs` and `cli/test/remote-names.test.mjs` (Task 8) hold the templates and `remote-run.sh` to the constants.
- **A kept name renamed by a broad replacement.** `HARNESS_REMOTE_SLUG`, `HARNESS_GITHUB_DEFAULT_COMMIT` or `HARNESS_STEP_ALLOWANCE_MINUTES` spelled as `DEVSCENE_*` would break job plumbing silently. Every task replaces only the table's tokens. Task 26's closing check also asserts that no `DEVSCENE_` token outside the table exists and that the kept names still occur.

**Manual setup required:**
- **Before merge:** apply Task 26's `## Paste record` to this repository's `.claude/push-notify.env.example` and to `examples/notes-app/.claude/{push-notify.env.example, qa-accounts.env.example, settings.autonomous.json}` (depends on Task 26).
- **After merge, on this machine:** in this repository's `.claude/push-notify.env` and in the machine-local `push.env` that `init --notifications` writes (`cli/src/generators/notifications.ts` → `PUSH_ENV_FILENAME`), rename the keys `HARNESS_PUSH_URL` and `HARNESS_PUSH_CMD` to `DEVSCENE_PUSH_URL` and `DEVSCENE_PUSH_CMD`. The notifier recognises no other spelling (depends on Tasks 3 and 16). If the run daemon's unit sets `HARNESS_AGENT_CLI` or `HARNESS_GH_CLI`, rename them there too.
- **After merge, on this machine:** reinstall the plugin at the merged version. Then move `.claude/settings.autonomous.json` aside and run `npx devscene init` once in the main checkout, so the profile allows `Bash(printenv DEVSCENE_MAIN_REPO)`. Until both are done, sessions fall back to `plugin/instructions/main_repo_resolution.md`, and `doctor`'s `profile-main-anchor` warns (depends on Tasks 2, 15 and 16).
- **Before the next remote run or sandbox probe:** in every GitHub repository that runs a rendered `devscene-*.yml` or `scripts/sandbox-probe-runner.yml` (the Gate 12 sandbox repository included), set each repository variable and secret under its `DEVSCENE_` name with the `gh variable set` and `gh secret set` lines `init` prints, then delete the `HARNESS_` ones. In that same repository, run `npx devscene@<merged version> init --upgrade-workflows`, because a workflow rendered before this branch reads only the old names (depends on Tasks 2, 6 and 17).

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. The committer flips each entry to `[x]` as that task's commit lands. **Only the committing role flips a marker.** In every flow that dispatches one, that role is the `committer` agent. In the supervised flow, which dispatches none, it is the orchestrator itself. An implementer never changes a marker here and never edits any other line of this section while a run is iterating this index. `[ ]` markers anywhere else, such as sub-step bullets inside per-task files, are informational only. They are never the iteration source, and the committer does not touch them.

Each entry maps 1:1 to `harness-runs/task_plans/chore_devscene_env_variables/task_<K>_plan.md`. Entries are in ship order. Task 18 sits among the `general` tasks for the reason `## Context` gives.

1. [x] **Task 1** — Read the anchor name from `MAIN_REPO_ANCHOR_VARIABLE` in the main-repo-resolution corpus guard _(layer: cli)_ _(points: 5)_
2. [x] **Task 2** — Rename the variable-name constants and literals in `cli/src` _(layer: cli)_ _(points: 15)_
3. [x] **Task 3** — Rename the variables in the watcher, restart-watcher and notifier templates and the watcher test helper _(layer: cli)_ _(points: 15)_
4. [x] **Task 4** — Rename the variables in the `remote-run.sh` template _(layer: cli)_ _(points: 15)_
5. [x] **Task 5** — Rename the variables in the remaining script templates _(layer: cli)_ _(points: 10)_
6. [x] **Task 6** — Rename the variables in the four workflow templates and the two `.env.example` templates _(layer: cli)_ _(points: 20)_
7. [x] **Task 7** — Rename the variables in the `doctor` suites _(layer: cli)_ _(points: 20)_
8. [x] **Task 8** — Rename the variables in the `init`, workflow-template and remote-names suites _(layer: cli)_ _(points: 20)_
9. [x] **Task 9** — Rename the variables in the remote-trigger, remote-control and remote-collect suites _(layer: cli)_ _(points: 20)_
10. [x] **Task 10** — Rename the variables in the close, mention, needs-agent and review run-control suites _(layer: cli)_ _(points: 20)_
11. [x] **Task 11** — Rename the variables in the `remote-run` suite and the smaller remote suites _(layer: cli)_ _(points: 15)_
12. [x] **Task 12** — Rename the variables in the watcher and restart-watcher suites _(layer: cli)_ _(points: 15)_
13. [x] **Task 13** — Rename the variables in the remaining cli-only suites and the timing helper _(layer: cli)_ _(points: 10)_
14. [x] **Task 14** — Rename the anchor and QA keys in the plugin's shell library and QA helpers _(layer: plugin)_ _(points: 10)_
15. [x] **Task 15** — Rename the anchor read, the remote-stop variable and the QA prefix in the plugin's prose _(layer: plugin)_ _(points: 15)_
16. [x] **Task 16** — Bring the self-adopted script copies to the renamed template bytes _(layer: general)_ _(points: 10)_
17. [x] **Task 17** — Rename the variables in the sandbox-probe scripts, the probe runner workflow and the arm-A eval script _(layer: general)_ _(points: 10)_
18. [x] **Task 18** — Rename the variables in the suites that read the plugin and this repository's scripts _(layer: cli)_ _(points: 8)_
19. [x] **Task 19** — Rename the variables in `README.md` and `ARCHITECTURE.md` _(layer: general)_ _(points: 8)_
20. [x] **Task 20** — Rename the variables in `docs/cli.md`, `docs/watcher.md` and `docs/guard-verification.md` _(layer: general)_ _(points: 15)_
21. [x] **Task 21** — Rename the variables in `docs/development.md` _(layer: general)_ _(points: 20)_
22. [x] **Task 22** — Rename the variables in `docs/remote-execution.md` _(layer: general)_ _(points: 20)_
23. [x] **Task 23** — Rename the variables in `docs/github-issue-trigger.md` and `docs/github-run-control.md` _(layer: general)_ _(points: 20)_
24. [x] **Task 24** — Rename the variables in `docs/outer-loop-verification.md` and `docs/sandbox-verification.md` _(layer: general)_ _(points: 15)_
25. [x] **Task 25** — Rename the variables in the research documents and reword the stale keep-forecast _(layer: general)_ _(points: 10)_
26. [x] **Task 26** — Rename the example's live dev-server files, record the `.claude/` paste, and run the closing check _(layer: general)_ _(points: 15)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Rename the selected variables everywhere they are set, read, documented, checked by `doctor` or asserted in tests."* The *Done when* sharpens it: *"Every renamed variable has zero remaining `HARNESS_` uses outside `harness-runs/` and recorded-release fixtures."*

`cli/src` and `cli/test` are application source and owe no register rows. Tasks 1–2, 3 (its helper) and 7–13 and 18 own them.

**Derivation entry D1 — corpus files carrying a table token (command).** Re-run verbatim from the checkout root:
`git grep -lE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- . ':!harness-runs' ':!cli/src' ':!cli/test'`

**Derivation entry D2 — the name inventory (command).** Re-run verbatim from the checkout root: `git grep --threads=1 -ohE '[A-Z_]*HARNESS_[A-Z0-9_]*' -- . ':!harness-runs'`. `--threads=1` is load-bearing: run multi-threaded with `-o`, this command was observed on this tree to print truncated, non-existent tokens such as `HARNESS_INPUT_PARK_LOOP_CLEA`, and to print a different set on each run. **Invariant:** every distinct token it prints is either a row of `## Context`'s spelling table or one of the entries its *Names kept* list classifies, the bare prefix mentions `HARNESS_` and `AUTONOMOUS_SDLC_HARNESS_` included. This entry yields no site rows; it closes the classification the task prompt asks for.

**Derivation entry D3 — standing-artifact rows (procedure).** **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md harness-runs/improvement_suggestions.md harness-runs/README.md`. **Artifact:** the standing files at the root of `harness-runs/`. **Traversal:** each file in that order; within a file, its `## ` headings in file order, then the `- ` rule lines under each. **Decision rule:** a line is reached when it carries a `HARNESS_` name, or when it constrains how a wire identifier or a renamed name is written.

**Closure invariant:** every site each derivation entry reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `.claude/push-notify.env.example` | this repository's render | D1 | `no-change` | Under `.claude/**`, which no task may write. Task 26 records the paste; the maintainer applies it |
| 2 | `ARCHITECTURE.md` | — | D1 | `change` | Task 19 |
| 3 | `README.md` | — | D1 | `change` | Task 19 |
| 4 | `cli/templates/claude/push-notify.env.example` | template | D1 | `change` | Task 6 |
| 5 | `cli/templates/claude/qa-accounts.env.example` | template | D1 | `change` | Task 6 |
| 6 | `cli/templates/github/workflows/devscene-control.yml` | template | D1 | `change` | Task 6 |
| 7 | `cli/templates/github/workflows/devscene-resume.yml` | template | D1 | `change` | Task 6 |
| 8 | `cli/templates/github/workflows/devscene-run.yml` | template | D1 | `change` | Task 6 |
| 9 | `cli/templates/github/workflows/devscene-trigger.yml` | template | D1 | `change` | Task 6 |
| 10 | `cli/templates/scripts/autonomous-notify.sh` | template | D1 | `change` | Task 3 |
| 11 | `cli/templates/scripts/autonomous-watcher.sh` | template | D1 | `change` | Task 3 |
| 12 | `cli/templates/scripts/cleanup-merged-worktrees.sh` | template | D1 | `change` | Task 5 |
| 13 | `cli/templates/scripts/launch-sandboxed-gates.sh` | template | D1 | `change` | Task 5 |
| 14 | `cli/templates/scripts/lib/harness-run-lib.sh` | template | D1 | `change` | Task 5 |
| 15 | `cli/templates/scripts/push-branch.sh` | template | D1 | `change` | Task 5 |
| 16 | `cli/templates/scripts/remote-run.sh` | template | D1 | `change` | Task 4 |
| 17 | `cli/templates/scripts/restart-watcher.sh` | template | D1 | `change` | Task 3 |
| 18 | `cli/templates/scripts/run-analytics.sh` | template | D1 | `change` | Task 5 |
| 19 | `cli/templates/scripts/setup-worktree.sh` | template | D1 | `change` | Task 5 |
| 20 | `cli/templates/scripts/start-dev-server.sh` | template | D1 | `change` | Task 5 |
| 21 | `cli/templates/scripts/task-offer-check.sh` | template | D1 | `change` | Task 5 |
| 22 | `docs/cli.md` | — | D1 | `change` | Task 20 |
| 23 | `docs/copilot-foundry-research.md` | — | D1 | `change` | Task 25 |
| 24 | `docs/development.md` | — | D1 | `change` | Task 21 |
| 25 | `docs/github-integration-research.md` | — | D1 | `change` | Task 25 |
| 26 | `docs/github-issue-trigger.md` | — | D1 | `change` | Task 23 |
| 27 | `docs/github-run-control.md` | — | D1 | `change` | Task 23 |
| 28 | `docs/guard-verification.md` | — | D1 | `change` | Task 20 |
| 29 | `docs/outer-loop-verification.md` | — | D1 | `change` | Task 24 |
| 30 | `docs/rag-extraction-research/07-extraction-plan.md` | — | D1 | `change` | Task 25 (respell and reword the row-6/7 keep-forecast) |
| 31 | `docs/rag-extraction-research/reviews/07-extraction-plan.md` | — | D1 | `change` | Task 25 |
| 32 | `docs/remote-execution.md` | — | D1 | `change` | Task 22 |
| 33 | `docs/retrieval-eval.md` | — | D1 | `change` | Task 25 |
| 34 | `docs/sandbox-verification.md` | — | D1 | `change` | Task 24 |
| 35 | `docs/team-accounts-research.md` | — | D1 | `change` | Task 25 |
| 36 | `docs/watcher.md` | — | D1 | `change` | Task 20 |
| 37 | `evals/docs-retrieval/arm-a/run-arm-a.sh` | — | D1 | `change` | Task 17 (`HARNESS_AGENT_CLI` only; `HARNESS_EVAL_CORPUS_ROOT` stays) |
| 38 | `examples/notes-app/.claude/context/conventions.md` | capture | D1 | `no-change` | Frozen capture, and the recorded-release exception `## Context` names |
| 39 | `examples/notes-app/.claude/push-notify.env.example` | worked example's render | D1 | `no-change` | Live render under `.claude/**`. Task 26 records the paste |
| 40 | `examples/notes-app/.claude/qa-accounts.env.example` | worked example's render | D1 | `no-change` | As row 39 |
| 41 | `examples/notes-app/.claude/settings.autonomous.json` | worked example's render | D1 | `no-change` | As row 39 (`printenv HARNESS_MAIN_REPO` in `_README` and `allow`; its `HARNESS_PR_TOKEN` entry is a kept name) |
| 42 | `examples/notes-app/scripts/start-dev-server.sh` | worked example's render | D1 | `change` | Task 26 |
| 43 | `examples/notes-app/tools/dev-server.mjs` | — | D1 | `change` | Task 26 |
| 44 | `plugin/agents/committer.md` | — | D1 | `change` | Task 15 |
| 45 | `plugin/agents/qa-tester.md` | — | D1 | `change` | Task 15 |
| 46 | `plugin/commands/branch-answer.md` | — | D1 | `change` | Task 15 |
| 47 | `plugin/commands/branch-pause.md` | — | D1 | `change` | Task 15 |
| 48 | `plugin/commands/branch-prompt.md` | — | D1 | `change` | Task 15 |
| 49 | `plugin/commands/branch-resume.md` | — | D1 | `change` | Task 15 |
| 50 | `plugin/commands/branch-start-docs-autonomous.md` | — | D1 | `change` | Task 15 |
| 51 | `plugin/commands/branch-start-plan-autonomous.md` | — | D1 | `change` | Task 15 |
| 52 | `plugin/commands/branch-start-user-review-fix-autonomous.md` | — | D1 | `change` | Task 15 |
| 53 | `plugin/commands/branch-status.md` | — | D1 | `change` | Task 15 |
| 54 | `plugin/commands/branch-user-review.md` | — | D1 | `change` | Task 15 |
| 55 | `plugin/docs/AUTONOMOUS_FLOW.md` | — | D1 | `change` | Task 15 |
| 56 | `plugin/hooks/lib/harness-config-lib.sh` | — | D1 | `change` | Task 14 |
| 57 | `plugin/instructions/autonomous_pause_and_ledger.md` | — | D1 | `change` | Task 15 |
| 58 | `plugin/instructions/clarification_digest_instructions.md` | — | D1 | `change` | Task 15 |
| 59 | `plugin/instructions/dispatch_discipline_instructions.md` | — | D1 | `change` | Task 15 |
| 60 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` | — | D1 | `change` | Task 15 |
| 61 | `plugin/instructions/improvement_observations_instructions.md` | — | D1 | `change` | Task 15 |
| 62 | `plugin/instructions/main_repo_resolution.md` | — | D1 | `change` | Task 15 |
| 63 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` | — | D1 | `change` | Task 15 |
| 64 | `plugin/instructions/plan_orchestration_instructions_core.md` | — | D1 | `change` | Task 15 (`HARNESS_QA_*`) |
| 65 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` | — | D1 | `change` | Task 15 |
| 66 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` | — | D1 | `change` | Task 15 |
| 67 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` | — | D1 | `change` | Task 15 |
| 68 | `plugin/scripts/release-qa-user.sh` | — | D1 | `change` | Task 14 |
| 69 | `plugin/scripts/reserve-qa-user.sh` | — | D1 | `change` | Task 14 |
| 70 | `scripts/autonomous-notify.sh` | adopted copy | D1 | `change` | Task 16, content copy of row 10 |
| 71 | `scripts/autonomous-watcher.sh` | adopted copy | D1 | `change` | Task 16, content copy of row 11 |
| 72 | `scripts/cleanup-merged-worktrees.sh` | adopted copy | D1 | `change` | Task 16, content copy of row 12 |
| 73 | `scripts/launch-sandboxed-gates.sh` | adopted copy | D1 | `change` | Task 16, content copy of row 13 |
| 74 | `scripts/lib/harness-run-lib.sh` | adopted copy | D1 | `change` | Task 16, content copy of row 14 |
| 75 | `scripts/lib/sandbox-probe/legs-settings.sh` | — | D1 | `change` | Task 17 |
| 76 | `scripts/lib/sandbox-probe/preflight.sh` | — | D1 | `change` | Task 17 |
| 77 | `scripts/lib/sandbox-probe/session.sh` | — | D1 | `change` | Task 17 |
| 78 | `scripts/push-branch.sh` | adopted copy | D1 | `change` | Task 16, content copy of row 15 |
| 79 | `scripts/remote-run.sh` | adopted copy | D1 | `change` | Task 16, content copy of row 16 |
| 80 | `scripts/restart-watcher.sh` | adopted copy | D1 | `change` | Task 16, content copy of row 17 |
| 81 | `scripts/run-analytics.sh` | adopted copy | D1 | `change` | Task 16, content copy of row 18 |
| 82 | `scripts/sandbox-absent-path-check.sh` | — | D1 | `change` | Task 17 |
| 83 | `scripts/sandbox-probe-runner.yml` | — | D1 | `change` | Task 17 |
| 84 | `scripts/setup-worktree.sh` | adopted copy | D1 | `change` | Task 16, content copy of row 19 |
| 85 | `scripts/task-offer-check.sh` | adopted copy | D1 | `change` | Task 16, content copy of row 21 |
| 86 | `harness-runs/lessons.md` → *"A rename declared breaking ships no compatibility path …"* | — | D3, constrains how a renamed name is written | `no-change` | The rule stands and binds every task: no fallback read, no migration, no sentence naming an old name (`## Context`, first paragraph) |
| 87 | `harness-runs/lessons.md` → *"Name an adopter-facing surface with the term adopters already arrive with … never the configuration key, tool name, check id or any other wire identifier."* | — | D3, constrains renaming a wire identifier | `no-change` | The rule stands. The task prompt explicitly orders this rename of environment-variable names, with no alias because backward compatibility is out of scope |
| 88 | `harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block …"* | — | D3, constrains how a command is written | `no-change` | The rule stands and binds Tasks 19–25: a respelled `gh variable set` or `gh secret set` line stays in its fenced block, and no inline command is introduced |
