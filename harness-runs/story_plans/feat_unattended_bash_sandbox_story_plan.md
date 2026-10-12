# Story: Unattended Bash sandbox — the profile

## Context

This branch puts every Bash command an unattended run issues, and every process that command starts, inside Claude Code's OS-level sandbox. It also turns the network from blocked-by-omission into denied. It ships the **profile half** only:

- the `sandbox` block of the generated `.claude/settings.autonomous.json`, and the `sandbox` configuration key that feeds it;
- the write protection the sandbox makes necessary, and the credential denial on both sides;
- the two git wrappers' refusal of an untrusted target and of an untrusted per-working-copy git configuration;
- `dontAsk` as the unattended permission mode;
- two `doctor` checks that the profile on disk carries the sandbox and the write protection.

The prerequisite checks and the launch refusal are `feat_unattended_sandbox_preflight`'s. The measurement and the rewrite of the honesty paragraphs are `feat_unattended_sandbox_measurement`'s. The guards, the deny floor and the `pre-push` hook all stay: this adds a layer and removes none. The supervised profile is out of scope.

**The one design decision every task leans on: which copy of a git wrapper runs unsandboxed.** On macOS an SSH push or fetch fails inside the sandbox, so `push-branch.sh` and `refresh-branch.sh` must run outside it, through `sandbox.excludedCommands`. An excluded command runs with full access, so the file it runs must not be writable from inside the sandbox. A run's working directory is its worktree, and the sandbox can write there by default. The only spelling of a sibling worktree a profile entry can carry is the worktree glob, and Linux skips any `denyWrite` entry containing `*`. So the worktree's own copy of a wrapper cannot be protected on every platform. The main checkout's copy can: it is outside every worktree, the profile names it by absolute path, and it is denied on both sides. Therefore:

- **Task 2** excludes exactly one spelling of each wrapper: `Bash(bash <main checkout>/<scriptsDir>/push-branch.sh:*)` and the same for `refresh-branch.sh`. The repo-relative and sibling-worktree spellings stay allow-listed, and they stay **sandboxed**.
- **Task 3** protects those two files and the run library they source.
- **Tasks 8–10** move every agent-issued push in the plugin corpus to `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh "$REPO_ROOT"`. `push-branch.sh` already takes the checkout it pushes as its argument. **Task 5** gives `refresh-branch.sh` the same optional argument, so the main checkout's copy can refresh a worktree.

The excluded spelling and the corpus spelling are the same string by construction: `<repoRoot>` in the profile is the checkout `init` ran in, and `<MAIN_REPO>` is the first entry of `git worktree list`.

**The excluded rule accepts any argument, so the wrappers validate it.** `:*` matches every argument, so a sandboxed command could build a repository whose own `.git/config` sets `core.sshCommand` or a credential helper, and hand that directory to the main checkout's copy, which would then run it unsandboxed. **Task 24** makes both wrappers refuse, before any git call, unless the target is either the main checkout itself, or a worktree the main repository lists: its gitdir is `<main>/.git/worktrees/<name>`, its `commondir` resolves to `<main>/.git`, and that gitdir's own `gitdir` file points back at the target. The main checkout is derived from the script's own location, never from the argument. A refused push stays non-fatal (exit 0); a refused refresh exits 1. This also covers a rewritten `.git` pointer or `commondir`.

**The hooks pin follows from the same rule.** `setup-worktree.sh` points each worktree's `core.hooksPath` at the worktree's own hooks directory, which the sandbox can write. So the wrappers pin `core.hooksPath` to the **main repository's own configured hooks directory**. That value is read from the main repository's `.git/config`, which the sandbox cannot write and Task 3 denies to the file tools, and it is made absolute against the main checkout. Protecting the value is not enough: the **directory** it names must be protected too, and `init` deliberately leaves a foreign `core.hooksPath` (such as `.husky`) in place (`cli/src/generators/githooks.ts` → choice 1). So the pin accepts exactly two directories, and refuses under each wrapper's exit contract otherwise:

- `<main>/<githooksDir>`, with `githooksDir` read from the **main checkout's** `harness.config.json`;
- `<main>/.git/hooks`, git's default when `core.hooksPath` is unset.

Task 3 protects both directories and that `harness.config.json` on both sides, so the value compared against comes from a file the run cannot write. A run edits its worktree's copy of the configuration, never the main checkout's. Task 4 owns the derivation and the comparison, states them once in the run library, and tests the foreign-path refusal.

**The permission mode is `dontAsk` (the user's ruling on Question 1).** **Task 15** changes the watcher's `PERMISSION_MODE` default and the profile's `defaultMode` from `acceptEdits` to `dontAsk`. `acceptEdits` stays available as a documented `PERMISSION_MODE` override in the watcher's `watcher.env`. Two consequences follow:

- **The network.** The profile sets `network.strictAllowlist: true`. Whether a `--settings` file may set it is unresolved: the settings reference scopes it to user or managed settings, and the sandboxing page also admits CLI `--settings`. If it is not honoured, an unlisted host is decided by the permission mode. Under `dontAsk` that is a refusal (verified fact). Under the `acceptEdits` override it is a prompt no unattended run can answer.
- **Every statement this makes false is corrected here.** A call that matches neither `allow` nor `deny`, or that hits an `ask` rule (the profile's or a hook's), is now **refused at once** in an unattended run rather than stalling it. The repository says the opposite in about eighty places. **Tasks 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 25, 26 and 27** rewrite each such sentence, minimally, keeping the rule it supports. The register below lists every site, with the ones that stay and why. Other uses of "stall" stay as they are: the watcher's stall watchdog and its tunables, an un-loaded MCP tool (a tool that does not exist is not a call the mode decides), a park on a question file, and dated measurement and research records.

  The canonical restatement every rewrite follows: *under the default `dontAsk` mode, such a call is refused at once rather than prompting a session nobody can answer*. The **override clause** (*under `PERMISSION_MODE=acceptEdits` it prompts, and the run stalls*) is stated only in four owners: the watcher's tunable comment and the profile's `_README` (Task 15), `docs/watcher.md` §4 (Task 25), and `docs/cli.md` §6 (Task 13). Every other site states the default and does not repeat the override.

**`autoAllowBashIfSandboxed` is set to `false` (Task 2), so no outcome depends on how its default interacts with `dontAsk`**, which neither documentation page states. A sandboxed Bash call then goes through the ordinary permission flow: an `allow` entry runs it, and a call with none is decided by the mode. That is what makes the canonical restatement above true of Bash calls as well as of the other tools.

**Credentials (the user's ruling on Question 2, and the follow-up on file tools).** **Task 23** adds `sandbox.credentials` in the shape the sandboxing page gives (`files` / `envVars`, each entry `{ "path" | "name", "mode": "deny" }`, `~/` paths following the `sandbox.filesystem.*` prefix rules). That block reaches sandboxed Bash commands only, and the `Read`, `Grep` and `Glob` tools run outside the sandbox. So Task 23 also renders one `permissions.deny` `Read(...)` pair per credential file path, as `Read(/<home>/<rest>)` and `Read(/<home>/<rest>/**)`, where `/<home>` is the account home directory resolved at generation time. That follows the `_README`'s own rule: a `//` prefix followed by a path that brings its own leading slash. The `~/` rule form is avoided because the profile's note covers only `//` and `/`. A deny holds in every permission mode, the `acceptEdits` override included.

**The domain list.** Git's network traffic leaves through the two excluded wrappers. Claude Code's own API traffic, `WebFetch`, `WebSearch` and local MCP servers run outside the sandbox. So the shipped allowlist is empty, with one conditional entry: `127.0.0.1`, added only when the interactive-test browser wiring applies, because a hostname that resolves only to loopback is refused unless the IP itself is listed. The adopter's own part is `sandbox.allowedDomains` in `harness.config.json`, default none. Each entry carries a `reason`, which the profile's `_README` repeats. The named opt-out is `sandbox.optOut` with a required `reason`. It is never a default, and the rendered profile shows it in the `_README` and in `sandbox.enabled: false`.

**Order.** The tasks are single-layer and bottom-up in the configured order `cli`, `plugin`, `general`. Task ids were assigned when each task was first drafted, so the readiness list's position, not the id, is the ship order. The catch-all `general` tasks ship last, so the schema (Task 12) lands after the model and the check that read the key (Task 1). That is coherent within the branch: the CLI's own structural check accepts the key from Task 1 on, and the schema gate validates only `examples/` and `schemas/negative/` documents. Task 12 states the order explicitly. The worked example's rendered artifacts (Task 26) are last, because they render what every template task before it changed.

**Residuals, stated rather than hidden.** Task 4's and Task 24's wrapper headers, the profile's `_README` (Tasks 2–3) and `docs/cli.md` (Task 13) each carry the ones that concern them:

1. The watcher's **own** git calls in a worktree a sandboxed session has written to are outside this branch's two wrappers. Examples are its staging and commit of a dropped user review, and its `status`, `fetch` and `merge` there. They still read that worktree's `config.worktree` and its hooks directory.
2. On Linux the worktree-glob `denyWrite` entries are skipped. The protection they add holds on macOS only: the worktree's hooks directory, and the worktree's copy of `docs-search-server.sh` and its library when docs retrieval applies. The `Edit`/`Write` deny rules carry the same globs and hold everywhere.
3. The interactive-test phase is unmeasured under the sandbox. On Linux each sandboxed command has a private loopback, so the dev server and the readiness poll cannot meet.

The former residual *"a rewritten `.git` pointer or `commondir` is not detected"* is now covered by Task 24, and no task restates it as open.

**Unresolved, and planned around rather than decided:**

- Whether a headless `-p` session honours all of this exactly as an interactive one does.
- What `dontAsk` does to a write under `.claude/`. That refusal comes from the tool layer ahead of any permission rule, and it was measured under `acceptEdits` only (`docs/analyze.md`). The sentences describing it stay as measured (register rows 82, 101).

**Top risks:**

- **A call that `acceptEdits` auto-accepted and the profile never allowed is now refused.** That would be a regression in a working flow rather than a stale sentence. Task 15 guards the profile side by testing the shipped `defaultMode`. The manual full-run step below is the only thing that measures it.
- **A missed agent-issued push spelling fails silently**, because on macOS the push fails inside the sandbox and `push-branch.sh` still exits 0. Tasks 8–10 clear the scope register site by site, and a manual SSH push step backs them up.
- **The target check, the refusal or the pin could break an ordinary push or refresh.** Tasks 4, 5 and 24 each drive a clean linked worktree end to end before any refusal case. The pin deliberately refuses an adopter whose main `.git/config` names a foreign `core.hooksPath`; that push is reported with its remedy and still exits 0, and Task 4's case (f) pins the refusal while case (g) pins the unset-path push.
- **A `doctor` grade could disagree with the generator.** Tasks 6–7 read every expected value from Tasks 2–3's exports and the shipped template, never from a second copy.
- **A remote job could exit at startup.** Until `feat_unattended_sandbox_preflight` lands, `failIfUnavailable` makes a job on a runner without `bubblewrap` and `socat` exit at startup. That is the stated interim behaviour.

**Manual setup required:**

- After merge, regenerate this checkout's machine-local profile and `init` output from the main checkout with the branch's CLI, as a `HARNESS_SELF_ADOPT=1` forced `init`. Until then this repository's own unattended runs stay unsandboxed and launch under `acceptEdits`. The tracked copies under `scripts/` are that `init` output and are refreshed by the same step. *(All tasks.)*
- On macOS, in a sandboxed `claude -p` session using the regenerated profile, launched as the watcher launches it (`--permission-mode dontAsk`):
  - run `scripts/run-gates.sh` *(constraint; `feat_unattended_sandbox_measurement` makes it a gate)*;
  - run one full unattended task flow, and read its stream for permission refusals of calls the flow needs. Each is a profile entry `acceptEdits` used to cover silently *(Task 15)*;
  - push through `bash <main checkout>/scripts/push-branch.sh <worktree>` over the SSH remote, because a failed push still exits 0 *(Tasks 2, 4, 8–10, 24)*;
  - from a sandboxed command, build a scratch repository whose `.git/config` sets `core.sshCommand`, pass it to the main checkout's `push-branch.sh`, and confirm the refusal *(Task 24)*;
  - check that an unlisted host is refused rather than stalling, and once more under `PERMISSION_MODE=acceptEdits` to learn whether `strictAllowlist` set through `--settings` is honoured *(Tasks 2, 15)*;
  - run `git config --worktree core.hooksPath <elsewhere>` from a sandboxed command and confirm the next push refuses *(Task 4)*;
  - read `~/.ssh` from a sandboxed command, and with the `Read`, `Grep` and `Glob` tools, and confirm each is refused *(Task 23)*.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else, such as sub-step bullets inside the per-task files, are informational only, and the committer never touches them. Each entry resolves 1:1 to `harness-runs/task_plans/feat_unattended_bash_sandbox/task_<K>_plan.md`. The order is bottom-up by ship sequence, in the configured layer order with the catch-all `general` layer last. A task's id is not its position.

1. [x] **Task 1** — Add the `sandbox` configuration key to the config model and its structural check _(layer: cli)_ _(points: 15)_
2. [x] **Task 15** — Make `dontAsk` the unattended permission mode, and correct the profile's own statements of what an unlisted call does _(layer: cli)_ _(points: 15)_
3. [x] **Task 2** — Render the strict sandbox block, the network denies and the two named unsandboxed wrappers into the unattended profile _(layer: cli)_ _(points: 20)_
4. [x] **Task 23** — Deny credential reads on both sides: `sandbox.credentials` and the file tools' `Read` rules _(layer: cli)_ _(points: 15)_
5. [x] **Task 3** — Protect every path that runs outside the sandbox, on both sides of the profile _(layer: cli)_ _(points: 20)_
6. [x] **Task 4** — Add the per-working-copy config refusal and the hooks pin to the run library, and apply both in `push-branch.sh` _(layer: cli)_ _(points: 20)_
7. [x] **Task 5** — Apply the refusal and the pin in `refresh-branch.sh`, and let it refresh a named checkout _(layer: cli)_ _(points: 15)_
8. [x] **Task 24** — Make both unsandboxed wrappers refuse any target but the main checkout or a worktree it lists _(layer: cli)_ _(points: 20)_
9. [x] **Task 6** — Add `doctor`'s `profile-sandbox` check _(layer: cli)_ _(points: 15)_
10. [x] **Task 7** — Add `doctor`'s `profile-write-protection` check _(layer: cli)_ _(points: 18)_
11. [x] **Task 16** — Correct the unlisted-call statements in the generators and the profile suite _(layer: cli)_ _(points: 18)_
12. [x] **Task 27** — Correct the unlisted-call statements in `init`, `doctor`, the daemon backend and the `init` suite _(layer: cli)_ _(points: 18)_
13. [x] **Task 17** — Correct the unlisted-call statements in the shipped wrapper scripts and the CLI's scripts README _(layer: cli)_ _(points: 15)_
14. [x] **Task 8** — Move the autonomous forks' pushes to the main checkout's wrapper _(layer: plugin)_ _(points: 18)_
15. [x] **Task 9** — Move the shared push and ledger-flip modules to the main checkout's wrapper _(layer: plugin)_ _(points: 15)_
16. [x] **Task 10** — Move the committer's push and the review-fix command's wrapper statement to the main checkout's wrapper _(layer: plugin)_ _(points: 10)_
17. [x] **Task 11** — Teach the implementer and the test-fix planner to read a sandbox refusal as the boundary working _(layer: plugin)_ _(points: 10)_
18. [x] **Task 18** — Correct the unlisted-call statements in the guard hooks and their README _(layer: plugin)_ _(points: 18)_
19. [x] **Task 19** — Correct the unlisted-call statements in the shared instruction modules _(layer: plugin)_ _(points: 15)_
20. [ ] **Task 20** — Correct the unlisted-call statements in the plan and task-plan instruction cores and forks _(layer: plugin)_ _(points: 15)_
21. [ ] **Task 21** — Correct the unlisted-call statements in the review-fix and docs forks and the three autonomous commands _(layer: plugin)_ _(points: 15)_
22. [ ] **Task 22** — Correct the unlisted-call statements in the agents, the flow docs and the plugin scripts README _(layer: plugin)_ _(points: 10)_
23. [ ] **Task 12** — Declare `sandbox` in the configuration schema, with its two negative fixtures _(layer: general)_ _(points: 15)_
24. [ ] **Task 13** — Document the sandbox block, the permission mode and the two new `doctor` checks in `docs/cli.md` _(layer: general)_ _(points: 20)_
25. [ ] **Task 14** — Document the `sandbox` keys in `docs/config.md` and the sandbox object in `ARCHITECTURE.md` _(layer: general)_ _(points: 20)_
26. [ ] **Task 25** — Document `PERMISSION_MODE` in `docs/watcher.md`, and correct the unlisted-call statements in the remaining docs and evals _(layer: general)_ _(points: 18)_
27. [ ] **Task 26** — Re-render the worked example's profile and wrappers _(layer: general)_ _(points: 15)_

## Scope register

**Scope predicates**, quoted verbatim:

- For the agent-issued wrapper spellings (task prompt): *"The git network commands the wrappers run work on macOS."*
- For the honesty paragraphs (task prompt): *"Change one here only where this branch would otherwise make it false."*
- For the permission-mode statements (the user's ruling on Question 1, as forwarded): *"Fix in this branch only the statements this change makes false — the ones describing what happens to a call that is neither allowed nor denied, or that hits an `ask` rule, in an unattended run (it is now refused at once, not stalled). Unrelated uses of "stall" (the watcher's stall detector and its tunables, other stall causes) stay as they are."*

**Derivation entry A — the push wrapper's spellings in the plugin corpus (command).** Re-run verbatim from the repository root:

```
git grep -n -F '<scripts_dir>/push-branch.sh' -- plugin
```

**Derivation entry B — claims that the push wrapper's path is repo-relative and runs from the run's own root (command).** Re-run verbatim:

```
git grep -n -E 'repo-relative and take no app-root|wrapper paths below are repo-relative|repo-relative and run from' -- plugin
```

**Derivation entry L — every `repo-relative` sentence in the plugin corpus (command).** Strictly wider than entry B, whose three phrases all contain `repo-relative`; entry B stays because rows cite it. Re-run verbatim:

```
git grep -n -i -F 'repo-relative' -- plugin
```

- **Decision rule:** a sentence is `change` when it says the **push** wrapper's script path is repo-relative or runs from the run's own root, in a file where Tasks 8–10 move the push under `<MAIN_REPO>`, or when it says that of the wrapper calls a fork adds, in the core those forks bind (rows 31, 32). It is `no-change` when it is about a `commands.*` string, the commit wrapper, a staged or recorded path, the `<scripts_dir>` definition itself, or any other repo-relative value (a config path, a quoted path in a finding), and every hit in a file where no push moves is `no-change`. The `no-change` hits are grouped into class rows 201–205, as row 193 does.
- **Executed while writing this revision**, it reached, beyond rows 7, 8, 22, 26 and 30–32, one new `change` site: the `dispatch_discipline_instructions.md` → `## Push` sentence (row 200). That file's `## Commit mechanics` *"Write the script-path token exactly as shown — unquoted and repo-relative"* is about the commit wrapper and stays (row 202).

**Derivation entry C — the doctor, `--remote-job` and permission-model descriptions the new checks and the new profile key touch (command).** Re-run verbatim:

```
git grep -n -E 'profile-deny-floor|grades the permission profile as a remote job|whole grant surface' -- docs ARCHITECTURE.md README.md
```

**Derivation entry D — the honesty paragraphs the task prompt names (procedure).**

- **Artifact:** the task prompt's `## Not in this branch` → the *"Measuring what breaks"* bullet.
- **Traversal:** each paragraph it lists, in the order listed. For each, read the named section of the named file.
- **Decision rule:** a paragraph is `change` when a sentence in it becomes false once this branch's tasks have landed. Otherwise it is `no-change`, because understating what is contained is the safe direction the prompt names.

**Derivation entry E — the documents a new configuration key and a new negative fixture owe (procedure).**

- **Artifact:** `.claude/context/conventions.md` → `## What accompanies a new unit of each kind`, the rows *A configuration key* and *A negative schema fixture*.
- **Traversal:** those two rows, in table order.
- **Decision rule:** every prose document a row names is a site. It is `change` when this branch adds that kind of unit, which it does for both.

**Derivation entry F — standing-artifact rows (procedure).**

- **First step, runnable:**

  ```
  grep -n -i -E 'sandbox|push-branch|permission profile|settings.autonomous|stall|acceptEdits' harness-runs/lessons.md harness-runs/improvement_suggestions.md
  ```

- **Artifact:** those two standing artifacts.
- **Traversal:** each hit, in file order.
- **Decision rule:** a row is reached when it states something about the profile, the push wrapper or the permission mode that this branch changes. Executed while writing this plan, the command printed nothing, so this entry reaches no row.

**Derivation entry G — statements of what an unlisted or `ask`-matched call does in an unattended run, and every statement of the mode itself (two commands).** Both are read-only and use one pathspec. The excluded paths are frozen records: run artifacts, the raw retrieval-eval output, the worked example's captured run, and recorded transcripts. The first command carries no same-line context condition, so a sentence wrapped across lines is reached by its stall word alone, and it also reaches every line naming the mode this branch replaces (`acceptEdits`), including a quotation of the watcher's `PERMISSION_MODE` line that contains no stall word. Re-run verbatim:

```
git grep -n -i -E -e '(^|[^a-z])stall(s|ed|ing)?([^a-z]|$)' -e 'cannot be answered' -e 'unanswerable' -e 'acceptEdits' -- . ':!harness-runs' ':!docs/retrieval-eval-results.md' ':!examples/notes-app/sdlc-harness' ':!evals/docs-retrieval/transcripts'
```

```
git grep -l -i -E -e 'neither .?allow.? nor .?deny|neither allowed nor denied|falls? through to (a prompt|.?ask)|unanswerable prompt|run cannot answer|prompt (it|the run) cannot|parks? (with no|an unattended|the run)|no diagnostic|hangs there|draws a prompt|raises an? (approval )?prompt|permission prompt|approval prompt' -- . ':!harness-runs' ':!docs/retrieval-eval-results.md' ':!examples/notes-app/sdlc-harness' ':!evals/docs-retrieval/transcripts'
```

Every file in the union of the two outputs is a site, and the decision is made sentence by sentence inside it. The first command prints hit lines directly; the second, run with `-n` in place of `-l`, does the same. Those lines are what the rows below cite. Executed while writing this revision, the widened first command reached the files and lines of rows 126–166 in addition to the earlier rows; every one is a row.

- **Decision rule:** a sentence is `change` when it says that, in an unattended, headless or print-mode run, a call that matches neither `allow` nor `deny`, matches an `ask` rule (the profile's or a hook's), or falls through a silent guard to the profile, stalls, hangs, parks, or raises a prompt nobody answers.
- **`no-change` when:**
  - the stall is another cause: the stall watchdog and its tunables, an un-loaded MCP tool, a park on a question file, a generic slow run;
  - the sentence states no unattended outcome, such as an interactive prompt cost;
  - it is a supervised-session rule;
  - it is a dated measurement or research record, or a procedure that names `--permission-mode acceptEdits` explicitly (a line that names `acceptEdits` as the **current shipped default** is not a procedure, and is `change`);
  - it is a `.claude/**` tool-layer refusal (unresolved under `dontAsk`, see `## Context`);
  - the file is this checkout's own `init` output under `scripts/`, which the post-merge forced `init` regenerates.

**Derivation entry H — sentences that state the outcome in words entry G does not search for (procedure).**

- **Artifact:** every file under entry G's pathspec (the repository minus the four frozen paths entry G excludes), not only the files a task targets.
- **First step, runnable.** It is read-only, and prints the outcome vocabulary across that whole pathspec:

  ```
  git grep -n -i -E '(^|[^a-z])(hang|hangs|hung|parks?|parked|stall(s|ed|ing)?|unanswerable|cannot answer|cannot be answered|nobody answers|no one answers)([^a-z]|$)' -- . ':!harness-runs' ':!docs/retrieval-eval-results.md' ':!examples/notes-app/sdlc-harness' ':!evals/docs-retrieval/transcripts'
  ```

- **Traversal:** each file in the output, in path order. Within it, each hit in line order, read together with the whole sentence it sits in (the lines before and after), so a sentence wrapped across lines is read whole.
- **Decision rule:** entry G's rule, applied to the whole sentence.
- **Executed while writing this revision, over the whole pathspec.** Beyond the rows entry G and the earlier, targeted run of this entry already gave, it reached:
  - `change`: the task-offer template and its example copy (rows 185–186), `doctor`'s `--remote-job` help sentence (row 189), the `ROADMAP.md` release-tags row (row 191) and the `docs/cli.md` §2 helper-script sentence (row 192);
  - `no-change`: this checkout's own task-offer copy (row 187), this checkout's own `init` output of row 72, `scripts/refresh-branch.sh` (row 123), and every hit in a file no earlier row names (rows 194–199).

  Earlier results of this entry: `cli/templates/scripts/refresh-branch.sh` (row 72), the `plugin/hooks/autonomous-script-allowlist-guard.sh` token-list sentence and *"quoted (the stall escape)"* row (row 105), two test comments (rows 124, 125), the `cli/src/doctor/checks.ts`, `cli/src/generators/permissionProfile.ts`, `cli/templates/scripts/commit-on-branch.sh` and `cli/test/profile.test.mjs` sentences (rows 167–178), the continuation lines of rows 89 and 94 (row 183), and the other-cause sentences of rows 179–182. Every other hit in a file a row already names is a park on a question file, the stall watchdog or its registry fields, a hung fetch, probe or test, a dated record, the `.claude/**` tool-layer wall, or an unrelated use of the word (*"hangs off"*, *"the frame the output hangs on"*, a QA account *"parked"* in a slot). All are `no-change` under entry G's rule.

**Derivation entry I — the follow-up deferrals this branch writes into shipped text (procedure).**

- **Artifact:** `.claude/context/conventions.md` → `## Documents of record` (*"A deferral cites a numbered roadmap item, and the number owes a row"*), read against the `**Work:**` bullets of every per-task file of this plan.
- **Traversal:** each `**Work:**` bullet, in readiness order, that writes text into a shipped file naming work this branch leaves to a later one.
- **Decision rule:** each such deferral cites a numbered roadmap item, never a branch name. The item's row in `docs/development.md` → `## 6. The roadmap this tree defers to` is a site, `change` when the row does not yet exist. Executed while writing this revision, it reached Task 6's grade argument (the launch refusal) and Task 23's `_README` omissions line (the measurement of the shell start-up files). Both cite items 20 and 21, which Task 25 adds (row 184).

**Derivation entry J — sentences that restrict what `<MAIN_REPO>` is used for (command).** Re-run verbatim:

```
git grep -n -F '<MAIN_REPO>' -- plugin
```

- **Decision rule:** a sentence that restricts or describes what `<MAIN_REPO>` is used for is `change` in a file where Tasks 8–10 add a push under it (the five autonomous forks, the four shared modules, `committer.md` and `branch-start-user-review-fix-autonomous.md`), because that push is a new use. Every other hit — a resolution step, a kill-switch or registry path, or a file no push is added to — is `no-change`.

**Derivation entry K — the `--remote-job` check count (command).** Tasks 6 and 7 make two more checks fail under the option, so every sentence counting the checks it moves is reached. Re-run verbatim:

```
git grep -n -E 'turns three|three profile checks|three warnings|fail instead of warning|three profile warnings' -- cli docs
```

- **Decision rule:** a sentence that counts or lists the checks `--remote-job` moves is `change`. A sentence that counts the profile checks for `doctor`'s evaluation order is `no-change` (rows 132, 144). Executed while writing this revision, it reached `cli/src/commands/doctor.ts` (row 190), `cli/src/doctor/checks.ts` (row 132) and `docs/cli.md` (rows 33, 144).

**Closure invariant:** every site any entry above reaches appears as a row below. A conventions document is never an owning task's target.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `plugin/agents/committer.md` → `## Invocation contract`, the `push` bullet ("via `<scripts_dir>/push-branch.sh`") | — | entry A | `no-change` | It names the mechanism. The spelling an agent runs lives in the two procedure steps (rows 2–3), which change. |
| 2 | `plugin/agents/committer.md` → `### Standard procedure (…)`, the push sub-step ("run `bash <scripts_dir>/push-branch.sh <repo_root>`") | — | entry A | `change` | Task 10 |
| 3 | `plugin/agents/committer.md` → `### ui_test_pass procedure`, step h ("**Push (only when `push == true` AND a commit was made in step f):**") | — | entry A | `change` | Task 10 |
| 4 | `plugin/commands/branch-start-docs-autonomous.md` → `## Hard boundary` ("via `<scripts_dir>/push-branch.sh`") | — | entry A | `no-change` | It states that the flow pushes and through which script. The file still lives in `<scripts_dir>`, and the spelling is the instruction files'. |
| 5 | `plugin/commands/branch-start-plan-autonomous.md` → `## Hard boundary` ("via `<scripts_dir>/push-branch.sh`") | — | entry A | `no-change` | as row 4 |
| 6 | `plugin/commands/branch-start-user-review-fix-autonomous.md` → `## Hard boundary` ("via `<scripts_dir>/push-branch.sh`") | — | entry A | `no-change` | as row 4 |
| 7 | `plugin/commands/branch-start-user-review-fix-autonomous.md` ("whose Override 3 / Override 4 wrapper calls name their `<scripts_dir>` scripts repo-relative and run from `$REPO_ROOT`") | — | entry B | `change` | Task 10 — the push call no longer runs repo-relative |
| 8 | `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.6 How to flip / create …` ("`<scripts_dir>/commit-on-branch.sh`, then `<scripts_dir>/push-branch.sh`" / "both wrapper paths are repo-relative and take no app-root prefix") | — | entries A, B | `change` | Task 9 |
| 9 | `plugin/instructions/clarification_digest_instructions.md` → `## Push` ("bash <scripts_dir>/push-branch.sh") | — | entry A | `change` | Task 9 |
| 10 | `plugin/instructions/dispatch_discipline_instructions.md` → `## Push` ("bash <scripts_dir>/push-branch.sh") | — | entry A | `change` | Task 9 |
| 11 | `plugin/instructions/improvement_observations_instructions.md` → `## Push` ("bash <scripts_dir>/push-branch.sh") | — | entry A | `change` | Task 9 |
| 12 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` → `## Commit mechanics (single source of truth)` ("bash <scripts_dir>/push-branch.sh") | — | entry A | `change` | Task 8 |
| 13 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → `### Override E — push after the Override D direct-`git` commit …` ("bash <scripts_dir>/push-branch.sh") | — | entry A | `change` | Task 8 |
| 14 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → `## Override G — pause/resume + flow-progress ledger …` ("**Flow-progress ledger — Implementation flip points.**") | — | entry A | `no-change` | It points at the flip mechanism, whose spelling is owned by `autonomous_pause_and_ledger.md` §1.6 (row 8). |
| 15 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → `## Override H — docs phase …` ("**Commits** land per doc via `<scripts_dir>/commit-on-branch.sh` + …") | — | entry A | `no-change` | It names the mechanism. The spelling is the docs core's `## Commit mechanics` (row 12). |
| 16 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → `## Autonomous-fork commit points — the clean-tree invariant …` ("**Post-commit push.**") | — | entry A | `no-change` | It names the mechanism and cites the blocks that spell it (rows 3, 13). |
| 17 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 3 — commit the UI-test plan after it converges` (the code block "bash <scripts_dir>/push-branch.sh") | — | entry A | `change` | Task 8 |
| 18 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 3 …` ("**Push after the commit.** The `<scripts_dir>/push-branch.sh` call above") | — | entry A | `no-change` | It refers to the call above by name, and that call still names this script. |
| 19 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 4 — commit the task plan after it converges` (the code block "bash <scripts_dir>/push-branch.sh") | — | entry A | `change` | Task 8 |
| 20 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 4 …` ("**Push after the commit.** The `<scripts_dir>/push-branch.sh` call above") | — | entry A | `no-change` | as row 18 |
| 21 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 5 — pause/resume + flow-progress ledger (planning half)` ("**Flip the `## Planning` entries**") | — | entry A | `no-change` | as row 14 |
| 22 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Resolved values`, the `<app_dir>` row ("the `<scripts_dir>` wrapper paths below are repo-relative and run from `$REPO_ROOT`") | — | entry B | `change` | Task 8 |
| 23 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 3 — commit the fix plan + source review after the gates converge` (the code block "bash <scripts_dir>/push-branch.sh") | — | entry A | `change` | Task 8 |
| 24 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 3 …` ("**Push after the commit.** The `<scripts_dir>/push-branch.sh` call above") | — | entry A | `no-change` | as row 18 |
| 25 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 4 — pause/resume + flow-progress ledger (fix-planning half)` ("**Flip the `## Fix planning` entries**") | — | entry A | `no-change` | as row 14 |
| 26 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Resolved values`, the `<app_root>` row ("the `commit-on-branch.sh` / `push-branch.sh` calls this fork **adds** … name their script paths repo-relative and run from `$REPO_ROOT`") | — | entry B | `change` | Task 8 |
| 27 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` → `### Override E — push after the Override D direct-`git` commit …` ("bash <scripts_dir>/push-branch.sh") | — | entry A | `change` | Task 8 |
| 28 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` → `## Override G — pause/resume + flow-progress ledger (fixing half)` ("**Flip the `## Fixing` entries**") | — | entry A | `no-change` | as row 14 |
| 29 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` → `## Override H — docs phase …` ("**Commits** land per doc via …") | — | entry A | `no-change` | as row 15 |
| 30 | `plugin/instructions/mode_contract.md` → `## Resolved values`, the `<app_root>` row ("the configured `commands.*` strings and the `<scripts_dir>` wrapper paths they name are repo-relative") | — | entry B | `no-change` | It is about the `commands.*` wrappers, which stay repo-relative. The push wrapper is not one of them. |
| 31 | `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` → `## Resolved values`, the `<app_root>` row ("It does **not** anchor the wrapper calls a fork *adds* (mechanism rule (3)): `<scripts_dir>` is repo-relative, so those calls name their script paths repo-relative and run from `<repo_root>`") | — | entries B, L | `change` | Task 8 — the autonomous fix-plan fork's Override 3 push, one of the calls a fork adds, moves under `<MAIN_REPO>` (row 23), so the claim is narrowed to the commit-wrapper calls; the core stays literal-free |
| 32 | `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` → the paragraph "**`<app_root>` is declared here, not consumed here.**" ("those name their `<scripts_dir>` script paths repo-relative and run from `<repo_root>`") | — | entries B, L | `change` | Task 8, as row 31 |
| 33 | `docs/cli.md` → `## 7. \`doctor\``, the opening paragraph ("`--remote-job` grades the permission profile as a remote job needs it" … "because it turns three profile warnings into failures") | — | entry C | `change` | Task 13 — the count becomes false once Tasks 6 and 7 make `profile-sandbox` and `profile-write-protection` fail under `--remote-job`; it is rewritten to agree with row 36's paragraph, the taken opt-out staying a warning. |
| 34 | `docs/cli.md` → `## 7. \`doctor\``, the check table row "`profile-deny-floor`" | — | entry C | `change` | Task 13 — the two new rows land after it, in `CHECKS` order |
| 35 | `docs/cli.md` → `## 7. \`doctor\``, the severity bullet "**`profile-deny-floor` is a warning**" | — | entry C | `change` | Task 13 — the two new severity bullets land beside it |
| 36 | `docs/cli.md` → `## 7. \`doctor\`` ("**`--remote-job`** grades the permission profile as a remote job needs it and changes no other check") | — | entry C | `change` | Task 13 — it names the checks the option moves, and the two new ones also fail under it |
| 37 | `ARCHITECTURE.md` → the permission-model row ("The whole grant surface of an unattended run") | — | entry C | `change` | Task 14 — the grant surface now includes a `sandbox` object |
| 38 | `cli/templates/scripts/scratch-run.sh` → `# WHAT THIS DOES NOT CONTAIN.` | — | entry D | `no-change` | It understates containment once the sandbox lands, which is the safe direction. `feat_unattended_sandbox_measurement` rewrites it. (The separate line-21 sentence is row 75.) |
| 39 | `cli/templates/claude/settings.autonomous.json` → `_README`, the existing lines | — | entries D, G | `change` | Task 15 rewrites the lines that state an unlisted call stalls (`COMPLETENESS IS LOAD-BEARING`, `SCRIPT PATHS ARE UNQUOTED LITERALS`, `EVERY WRAPPER IN …`, the commit-path wrappers' `allow`-not-`ask` line, and `CREATING A FILE AND CHANGING ONE …`'s `defaultMode` sentence). The probe-route line understates and stays. Tasks 2, 3 and 23 **add** lines and edit none. |
| 40 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → the "**5. The sandbox**" row | — | entry D | `no-change` | It describes the profile, the guards and the backstop, all of which stay. It understates. (Line 83 is row 99.) |
| 41 | `plugin/hooks/README.md`, the guards' scope statements | — | entry D | `no-change` | No guard changes, and its statements about what a guard sees stay true. (Its unlisted-call sentences are row 102.) |
| 42 | `README.md` → `## Scope and limits` | — | entry D | `no-change` | No bullet there claims an absent sandbox or a stall, so nothing becomes false. |
| 43 | `docs/config.md` → `## 5. Key reference` (one row per key) | — | entry E, *A configuration key* | `change` | Task 14 |
| 44 | `schemas/negative/README.md` (one sentence per wired fixture) | — | entry E, *A negative schema fixture* | `change` | Task 12 |
| 45 | `.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md` (conventions documents), read against every task's work | — | read against every task's work | `no-change` | A conventions document is never a task target. The permission-mode change falsifies four sentences in two of them (rows 46–47), and those are raised in `## Corpus staleness` of the writer's return. |
| 46 | `.claude/context/cli.md` → *"One string, one producer."* ("drift between them is invisible until an unattended run stalls") | — | entry G | `no-change` | conventions document; raised as `stale-rule` |
| 47 | `.claude/context/conventions.md` (line hints 65, 109, 135: "a different string and stalls"; "an unanswerable prompt in an unattended run is a stall"; "raises an approval prompt the run cannot answer") | — | entry G | `no-change` | conventions document; raised as `stale-rule` |
| 48 | `.claude/CLAUDE.md` (line hint 66, "can raise a permission prompt mid-fence") | — | entry G | `no-change` | The change-request fence applies only where `AskUserQuestion` exists, so it is a supervised-session rule. |
| 49 | `ARCHITECTURE.md` (line hints 122, 280: "COMPLETENESS IS LOAD-BEARING … stalls rather than prompting"; "one that stalls, as this one does"; "a test reaching for it stalls until an adopter adds the entry") | — | entry G | `change` | Task 14 |
| 50 | `cli/scripts/README.md` (line hint 5, "parks with no diagnostic") | — | entry G | `change` | Task 17 |
| 51 | `cli/src/commands/init.ts` (line hints 44, 1100, 1108, 3035, 3117) | — | entry G | `change` | Task 27 |
| 52 | `cli/src/config/model.ts` (line hint 561) | — | entry G | `no-change` | un-loaded MCP tool |
| 53 | `cli/src/core/templating.ts` (line hint 55) | — | entry G | `change` | Task 16 |
| 54 | `cli/src/daemon/backend.ts` (line hint 15) | — | entry G | `change` | Task 27 |
| 55 | `cli/src/detect/presets.ts` (line hints 10, 877) | — | entry G | `change` | Task 16 |
| 56 | `cli/src/doctor/checks.ts` (line hints 3328 "is the stall rather than the grant", 3439 "hangs there with no diagnostic", 4655 "**silent stall** — a run that reaches one of these helpers", 4812 'parks with no error at the first helper script it reaches' change; 4980, 5048 stay) | — | entry G | `change` | Task 27. The two kept lines are un-loaded MCP tools. Its further sites are rows 132 and 167–171. |
| 57 | `cli/src/generators/harnessConfig.ts` (line hint 31) | — | entry G | `change` | Task 16 |
| 58 | `cli/src/generators/permissionProfile.ts` (line hints 5–6, 11, 32, 98, 167, 674, 746, 893, 1086, 1708 change; 67, 1017, 1048 stay) | — | entry G | `change` | Task 16. The kept lines are un-loaded MCP tools. Its further site is row 172. |
| 59 | `cli/src/generators/repoRoot.ts` (line hints 49, 377–378, 393, 696) | — | entry G | `no-change` | un-loaded MCP tool, all five |
| 60 | `cli/src/generators/scripts.ts` (line hints 8–9, 32) | — | entry G | `change` | Task 16 |
| 61 | `cli/templates/claude/CLAUDE.md` (line hint 48) | — | entry G | `no-change` | as row 48 |
| 62 | `cli/templates/claude/README.md` (line hint 5) | — | entry G | `no-change` | un-loaded MCP tool |
| 63 | `cli/templates/claude/settings.autonomous.json` `_README` | — | entry G | `change` | Task 15 (same site as row 39) |
| 64 | `cli/templates/claude/settings.autonomous.qa.json` (line hint 7, "Until those lines exist the phase STALLS rather than failing" change; 4, 5, 6 stay) | — | entry G | `change` | Task 15. Line 4 is an un-loaded tool, line 5 an unbounded `await`, and line 6 states no outcome. |
| 65 | `cli/templates/claude/settings.autonomous.retrieval.json` (line hint 3) | — | entry G | `no-change` | un-loaded MCP tool |
| 66 | `cli/templates/scripts/autonomous-watcher.sh` (line hints 1306, 1654) | — | entry G | `no-change` | The park-loop note and the tunables echo. The `PERMISSION_MODE` default line is row 138, and the watchdog lines row 139. |
| 67 | `cli/templates/scripts/cleanup-merged-worktrees.sh` (line hint 85, "a prompt it cannot answer") | — | entry G | `change` | Task 17 |
| 68 | `cli/templates/scripts/commit-on-branch.sh` (line hints 7–8, 54, 90) | — | entry G | `change` | Task 17. Its further site is row 173. |
| 69 | `cli/templates/scripts/deploy.sh` (line hint 40) | — | entry G | `change` | Task 17 |
| 70 | `cli/templates/scripts/lib/harness-run-lib.sh` (line hint 417 change; 200 stays) | — | entry G | `change` | Task 17. Line 200 is about stdout diagnostics. |
| 71 | `cli/templates/scripts/push-branch.sh` (line hints 11, 23) | — | entry G | `change` | Task 17 |
| 72 | `cli/templates/scripts/refresh-branch.sh` → `# WHY IT EXISTS.` ("which an unattended run cannot answer") | — | entry H | `change` | Task 17 |
| 73 | `cli/templates/scripts/README.md` (line hint 3) | — | entry G | `change` | Task 17 |
| 74 | `cli/templates/scripts/restart-watcher.sh` (line hint 87) | — | entry G | `change` | Task 17 |
| 75 | `cli/templates/scripts/scratch-run.sh` (line hint 21, "draws a prompt an unattended run cannot answer") | — | entry G | `change` | Task 17 — outside `# WHAT THIS DOES NOT CONTAIN.` (row 38) |
| 76 | `cli/templates/scripts/test.sh` (line hint 43) | — | entry G | `change` | Task 17 |
| 77 | `cli/templates/scripts/typecheck.sh` (line hint 43) | — | entry G | `change` | Task 17 |
| 78 | `cli/templates/state-dir/clarification_digests/README.md` (line hint 3) | — | entry G | `no-change` | a park on a question file |
| 79 | `cli/templates/state-dir/clarifications/README.md` (line hint 5) | — | entry G | `no-change` | as row 78 |
| 80 | `cli/test/init.test.mjs` (line hints 39–40, 6080, 6095) | — | entry G | `change` | Task 27 |
| 81 | `cli/test/profile.test.mjs` (line hints 5–6, 287, 385, 404, 426, 574 change; 593 stays) | — | entry G | `change` | Task 16. Line 593 is an un-loaded tool. Its further sites are rows 124, 174–178 and 179. |
| 82 | `docs/analyze.md` (line hints 56, 58) | — | entry G | `no-change` | 56 is a supervised command. 58 is the `.claude/**` tool-layer wall, measured under `acceptEdits` and unresolved under `dontAsk`. |
| 83 | `docs/cli.md` (line hints 71, 140, 193, 309, 312, 329, 331, 334, 422, 434 change; 107, 338, 340, 406 stay) | — | entry G | `change` | Task 13. 338 and 340 are un-loaded tools; 107's stall word (*"stalled now"*) and 406 are unrelated. 107's separate helper-script sentence is row 192. |
| 84 | `docs/config.md` (line hint 11, "stalls on a prompt") | — | entry G | `change` | Task 14 |
| 85 | `docs/development.md` (line hint 2252 change; 136, 690 stay) | — | entry G | `change` | Task 25. 136 is a dated measurement; 690 is a gate leg that names `--permission-mode acceptEdits` explicitly. Its further sites are rows 146 and 184. |
| 86 | `docs/guard-verification.md` (line hints 382, 665 change; 626, 804, 897, 984 stay) | — | entry G | `change` | Task 25. The kept lines state an interactive prompt cost or a reader's misreading, not an unattended outcome. |
| 87 | `docs/outer-loop-verification.md` (line hints 43, 394, 494) | — | entry G | `no-change` | 43 and 394 are the stall watchdog. 494 is a closed-finding record of what two headers said at closure. |
| 88 | `docs/remote-execution.md` (line hint 593 change; 124 stays) | — | entry G | `change` | Task 25. 124 is the stall watchdog. |
| 89 | `docs/retrieval-eval.md` (line hints 299, 829) | — | entry G | `change` | Task 25. Both state a general rule about the unattended profile, not a measured outcome. |
| 90 | `docs/retrieval.md` (line hint 88) | — | entry G | `no-change` | a generic stall before a planning dispatch |
| 91 | `docs/team-accounts-research.md` (line hint 661) | — | entry G | `no-change` | a GitHub workflow approval, not a permission mode |
| 92 | `docs/watcher.md` (line hints 73, 248 change; 122 stays) | — | entry G | `change` | Task 25. 122 is the stall watchdog. |
| 93 | `docs/work-report-research/_brief.md`, `docs/work-report-research/committer.md`, `docs/work-report-research/reviews/committer.md` | — | entry G | `no-change` | Dated research records pinned to the template's line numbers at that commit. |
| 94 | `evals/docs-retrieval/arm-a/run-arm-a.sh` (line hint 11), `evals/docs-retrieval/cold-build.mjs` (26), `evals/docs-retrieval/run.mjs` (31) | — | entry G | `change` | Task 25 |
| 95 | `examples/notes-app/.claude/settings.autonomous.json` (`_README` lines 5, 6, 9, 10, 13, 22 change; 19, 20, 21 stay; `defaultMode` is row 155) | example copy of `cli/templates/claude/settings.autonomous.json` + `.qa.json` | entry G | `change` | Task 26, mirroring Task 15. The kept lines mirror qa.json's 4–6. |
| 96 | `examples/notes-app/.claude/CLAUDE.md` (line hint 60) | example copy of row 61 | entry G | `no-change` | frozen capture prose, and a supervised-session rule |
| 97 | `examples/notes-app/scripts/test.sh`, `examples/notes-app/scripts/typecheck.sh` (line hint 43) | example copies of rows 76–77 | entry G | `change` | Task 26 |
| 98 | `plugin/agents/committer.md` (line hints 80, 113) | — | entry G | `change` | Task 22 |
| 99 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` (line hint 83 change; 7 stays) | — | entry G | `change` | Task 22. 7 is the stall watchdog. |
| 100 | `plugin/agents/qa-tester.md` (line hint 120) | — | entry G | `change` | Task 22 — a loaded but un-granted tool is a call neither allowed nor denied |
| 101 | `plugin/agents/task-plan-reviewer.md` (92), `plugin/agents/task-plan-writer.md` (86, 93) | — | entry G | `no-change` | 86 and 92 describe allowed utilities, which never prompt. 93 is the `.claude/**` tool-layer wall (as row 82). |
| 102 | `plugin/hooks/README.md` (line hints 12, 13, 39, 80 change; 66, 82 stay) | — | entry G | `change` | Task 18. 66 says a guard would permit; 82 is an interactive prompt cost. |
| 103 | `plugin/hooks/allow-qa-credentials-read.sh` (line hint 23 change; 177, 395 stay) | — | entry G | `change` | Task 18. The kept lines name the ordinary prompt with no unattended outcome. |
| 104 | `plugin/hooks/allow-safe-compounds.sh` (line hint 11) | — | entry G | `change` | Task 18 |
| 105 | `plugin/hooks/autonomous-script-allowlist-guard.sh` (line hints 13, 255; the token-list sentence near 139; the "(the stall escape)" row near 373 change; 663 stays) | — | entries G, H | `change` | Task 18. 663 is an interactive prompt cost. |
| 106 | `plugin/hooks/lib/harness-config-lib.sh` (line hints 464–465 change; 77, 669 stay) | — | entry G | `change` | Task 18. 77 and 669 are about stdout diagnostics. |
| 107 | `plugin/commands/branch-start-docs-autonomous.md` (59), `branch-start-plan-autonomous.md` (69), `branch-start-user-review-fix-autonomous.md` (73) | — | entry G | `change` | Task 21 |
| 108 | `plugin/commands/harness-analyze.md` (line hint 560) | — | entry G | `no-change` | a supervised command |
| 109 | `plugin/docs/AUTONOMOUS_FLOW.md` (line hint 254) | — | entry G | `change` | Task 22 |
| 110 | `plugin/instructions/autonomous_pause_and_ledger.md` (line hints 296, 309, 468, 492, 498) | — | entry G | `change` | Task 19 |
| 111 | `plugin/instructions/clarification_digest_instructions.md` (77) | — | entry G | `change` | Task 19 |
| 112 | `plugin/instructions/dispatch_discipline_instructions.md` (125, 130) | — | entry G | `change` | Task 19 |
| 113 | `plugin/instructions/docs_phase_instructions.md` (49) | — | entry G | `change` | Task 19 |
| 114 | `plugin/instructions/improvement_observations_instructions.md` (146, 159, 179, 189 change; 16, 136 stay) | — | entry G | `change` | Task 19. 16 and 136 are generic examples of a slow run. |
| 115 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` (40, 99, 119, 145, 199) | — | entry G | `change` | Task 20 |
| 116 | `plugin/instructions/plan_orchestration_instructions_core.md` (120, 430) | — | entry G | `change` | Task 20 |
| 117 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` (93, 132, 159) | — | entry G | `change` | Task 20 |
| 118 | `plugin/instructions/task_plan_writing_instructions_core.md` (129) | — | entry G | `change` | Task 20 |
| 119 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` (92, 100, 109, 123) | — | entry G | `change` | Task 21 |
| 120 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` (81, 112) | — | entry G | `change` | Task 21 |
| 121 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` (38, 96, 116, 142) | — | entry G | `change` | Task 21 |
| 122 | `plugin/scripts/README.md` (line hints 15, 22 change; 21 stays) | — | entry G | `change` | Task 22. 21 is a dated measurement ("nothing stalled"). |
| 123 | `scripts/autonomous-notify.sh`, `scripts/autonomous-watcher.sh`, `scripts/cleanup-merged-worktrees.sh`, `scripts/commit-on-branch.sh`, `scripts/lib/harness-run-lib.sh`, `scripts/push-branch.sh`, `scripts/refresh-branch.sh` (`# WHY IT EXISTS.`, "# cannot answer. Both fire on the SAFE direction too"), `scripts/restart-watcher.sh`, `scripts/scratch-run.sh`, `scripts/test.sh`, `scripts/typecheck.sh` | this checkout's `init` output of rows 66–77 (row 72 included), 134, 138–142 | entries G, H | `no-change` | This checkout's self-adoption output, regenerated by the post-merge forced `init` (Manual setup). It already differs from its templates today. |
| 124 | `cli/test/profile.test.mjs` (line hint 727, "ends in the same silent stall the line is there to prevent") | — | entry H | `change` | Task 16 |
| 125 | `cli/test/doctor.test.mjs` (line hint 4745, "costs a silent stall") | — | entry H | `change` | Task 27 |
| 126 | `ARCHITECTURE.md` → the **[shipped]** paragraph *"Two flags in the invocation row name more than a value."*, which quotes the shipped line `PERMISSION_MODE="${PERMISSION_MODE:-acceptEdits}"` | — | entry G (widened) | `change` | Task 14 — Task 15 changes that line, so the quotation becomes false; the paragraph's never-a-bypass-mode argument stays |
| 127 | `ARCHITECTURE.md` → the `.claude/` namespace row (*"a sensitive path `--permission-mode acceptEdits` does not cover"*) | — | entry G (widened) | `no-change` | The `.claude/**` tool-layer wall, measured under `acceptEdits` and unresolved under `dontAsk` (as row 82) |
| 128 | `ARCHITECTURE.md` → the `classify_run_exit` inventory row and its two paragraphs (*"the `stall_killing` registry flag"*, *"Stall and completion therefore survive an engine change"*, *"one written by the watcher (`stall_killing`)"*) | — | entry G (widened) | `no-change` | the stall watchdog |
| 129 | `cli/src/core/git.ts` → the module header's invariant 2 (*"is a different string and stalls on a / prompt (`docs/config.md` §1)"*) | — | entry G (widened) | `change` | Task 27 |
| 130 | `cli/src/core/git.ts` → the `check-ignore` doc comment (*"Each caller decides what an unanswerable probe means for it"*) | — | entry G (widened) | `no-change` | a git probe's third exit status, not a permission outcome |
| 131 | `cli/src/core/layerCoverage.ts` (*"an unanswerable probe leaves the candidate in"*), `cli/src/machine/registry.ts` (*"makes \"is it still a repository\" unanswerable rather than false"*) | — | entry G (widened) | `no-change` | unrelated uses of *unanswerable* |
| 132 | `cli/src/doctor/checks.ts` → the check-order doc comments (*"makes the three profile checks unanswerable"*, *"it is unanswerable until `remote`'s is answered"*) | — | entry G (widened) | `no-change` | `doctor`'s evaluation order, not a permission outcome |
| 133 | `cli/templates/github/workflows/harness-run.yml` (*"run parked or paused longer than its retention cannot be answered"*; the `STALL_WARN_SECS`, `STALL_KILL_SECS`, `STALL_MAX_RESTARTS` variables) | — | entry G (widened) | `no-change` | a park on a question file, and the watchdog's tunables |
| 134 | `cli/templates/scripts/autonomous-notify.sh` (*"launch, resume, park and stall paths"*), `cli/templates/scripts/remote-run.sh` (*"the park-loop, auto-resume and stall counts"*) | — | entry G (widened) | `no-change` | the stall watchdog |
| 135 | `cli/templates/state-dir/dispatch_additions/README.md` (*"That question cannot be answered from the review artifacts alone"*) | — | entry G (widened) | `no-change` | unrelated |
| 136 | `cli/test/helpers/watcher.mjs` (`STALL_CHECK_ENABLED`), `cli/test/outer-loop-scripts.test.mjs` (the `stall_*` registry fields; *"a fetch that HANGS … stalls the whole loop"*), `cli/test/remote-run.test.mjs` (`stall_restarts`), `cli/test/watcher-remote-dispatch.test.mjs` (*"never reconciled, counted, stall-killed or usage-paused"*) | — | entry G (widened) | `no-change` | the stall watchdog, and a hung fetch |
| 137 | `cli/test/init.test.mjs` (*"which is the un-loaded-tool stall rather than a failure"*) | — | entry G (widened) | `no-change` | un-loaded MCP tool |
| 138 | `cli/templates/scripts/autonomous-watcher.sh` → `PERMISSION_MODE="${PERMISSION_MODE:-acceptEdits}"` and its comment | — | entry G (widened) | `change` | Task 15 |
| 139 | `cli/templates/scripts/autonomous-watcher.sh` → the stall watchdog (`check_stalled_runs`, `stall_mtime`, `stall_human_time`, the `STALL_*` tunables, the `stall_*` registry fields, its header and test-recipe notes) and the usage pass's *"the question cannot be ANSWERED"* | — | entry G (widened) | `no-change` | the stall watchdog and its tunables; a usage reset question |
| 140 | `cli/templates/scripts/cleanup-merged-worktrees.sh` (*"Against a fetch stalled for 3 seconds"*, *"rather than fails stalls the whole loop"*) | — | entry G (widened) | `no-change` | a hung fetch |
| 141 | `cli/templates/scripts/lib/harness-run-lib.sh` (*"The stall watchdog kills"*; the `stall_*` registry fields; *"this function would stall every other pass of that loop behind a lock"*) | — | entry G (widened) | `no-change` | the stall watchdog, and a lock wait |
| 142 | `cli/templates/scripts/restart-watcher.sh` (*"what happens when that cannot be answered"*, *"the unanswerable cases below"*) | — | entry G (widened) | `no-change` | whether a run is in flight, not a permission outcome |
| 143 | `cli/templates/claude/settings.autonomous.json` → `"defaultMode": "acceptEdits"` | — | entry G (widened) | `change` | Task 15 |
| 144 | `docs/cli.md` → `## 7. \`doctor\`` (*"a failed `git` check makes every question below it unanswerable"*) | — | entry G (widened) | `no-change` | `doctor`'s evaluation order |
| 145 | `docs/config.md` → `## 3. \`stateDir\`` (*"`.claude/**` is treated as a sensitive path that `--permission-mode acceptEdits` does not cover"*) | — | entry G (widened) | `no-change` | the `.claude/**` tool-layer wall, a measured fact (as row 82) |
| 146 | `docs/development.md` → the docs-retrieval gate leg's `claude -p … --permission-mode acceptEdits` procedure line | — | entry G (widened) | `no-change` | a procedure that names the flag explicitly |
| 147 | `docs/github-integration-research.md` (*"Under `claude -p … --permission-mode acceptEdits`"*, and its measurement line) | — | entry G (widened) | `no-change` | a dated measurement record |
| 148 | `docs/guard-verification.md` (*"a guard that failed to recognise an adopter's protected branch would not stall — it would permit"*) | — | entry G (widened) | `no-change` | a quotation of `plugin/hooks/README.md`'s would-permit sentence (row 102 keeps it) |
| 149 | `docs/outer-loop-verification.md` → `### 2.6 The stall watchdog`, the orphaned-subshell bullet (*"the property the stall watchdog depends on"*), and *"`stall_killing` is cleared after the restart is spawned"* | — | entry G (widened) | `no-change` | the stall watchdog |
| 150 | `docs/remote-execution.md` → `### Stalls`, the job-mode paragraphs, *"Liveness."*, *"The bundle expires."* and the `STALL_*` variable rows | — | entry G (widened) | `no-change` | the stall watchdog and its tunables |
| 151 | `docs/retrieval-eval.md` → the heading `### The two execution routes, and the one that stalls` | — | entry G (widened) | `change` | Task 25 — the section's body (row 89) now says the route is refused; no file links to the heading's anchor |
| 152 | `docs/retrieval-eval.md` → the two `claude -p … --permission-mode acceptEdits` procedure lines | — | entry G (widened) | `no-change` | procedures that name the flag explicitly |
| 153 | `docs/retrieval.md` → **(v) The unattended session through `.mcp.json`.** | — | entry G (widened) | `no-change` | a measured leg that names the flag it ran under |
| 154 | `docs/watcher.md` (*"a stall past the restart cap"*, the usage-gate knobs paragraph, *"the stall watchdog and the park-loop guard run inside the job"*, *"is it still a repository\" unanswerable"*) | — | entry G (widened) | `no-change` | the stall watchdog; an unrelated *unanswerable* |
| 155 | `examples/notes-app/.claude/settings.autonomous.json` → `"defaultMode": "acceptEdits"` | example copy of row 143 | entry G (widened) | `change` | Task 26, mirroring Task 15 |
| 156 | `plugin/commands/branch-resume.md` (*"its carried park-loop, auto-resume and stall counts"*) | — | entry G (widened) | `no-change` | the stall watchdog |
| 157 | `plugin/commands/branch-start-docs-autonomous.md`, `branch-start-plan-autonomous.md`, `branch-start-user-review-fix-autonomous.md` → `## Resolved values`, the `<protected_branches>` row (*"`Bash(git push:*)` **`ask`** entry — evaluated before any `allow`, and unanswerable in an unattended run"*) | — | entry G (widened) | `change` | Task 21 |
| 158 | `plugin/docs/AUTONOMOUS_FLOW.md` → **2. The best-effort convenience layer.** (*"evaluated before any `allow`, and unanswerable in an unattended run"*) | — | entry G (widened) | `change` | Task 22 |
| 159 | `plugin/docs/AUTONOMOUS_FLOW.md` → the outer-loop table row (*"usage gate, stall watchdog"*) and the park paragraph | — | entry G (widened) | `no-change` | the stall watchdog; a park on a question file |
| 160 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → **Capability is withheld by basename, not by hope.** (*"evaluated before any `allow`, and unanswerable in an unattended run"*) | — | entry G (widened) | `change` | Task 22 |
| 161 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → the **1. Trigger / control plane** row, the **Stall watchdog** row, and *"The stall watchdog is its neighbour"* | — | entry G (widened) | `no-change` | the stall watchdog |
| 162 | `plugin/hooks/autonomous-protected-branch-guard.sh` → header (*"A named ordinary push stalls at the `git push` / `ask` entry in the adopter's permission profile instead"*) | — | entry G (widened) | `change` | Task 18 — the *do NOT move `git push` out of `ask`* instruction stays |
| 163 | `plugin/hooks/git-commit-branch-guard.sh` → header item 2 (*"in an unattended run an `ask` / cannot be answered, so it is a silent stall"*) | — | entry G (widened) | `change` | Task 18 |
| 164 | `plugin/instructions/autonomous_pause_and_ledger.md` (*"no shell-expansion stall on `${branch}`"*) | — | entry G (widened) | `change` | Task 19 |
| 165 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` → the fix loop (*"If still `FAIL` after the cap: **do not stall**"*) | — | entry G (widened) | `no-change` | a generic instruction to proceed |
| 166 | `schemas/flow-graph.schema.json` (*"so a stalled loop is visible from the heartbeat alone"*) | — | entry G (widened) | `no-change` | a generic slow loop |
| 167 | `cli/src/doctor/checks.ts` → the `profile-paths` doc comment (*"a command matching neither `allow` nor / `deny` does not prompt in print mode, it hangs."*) | — | entry H | `change` | Task 27 |
| 168 | `cli/src/doctor/checks.ts` → the `plugin-permissions` doc comment (*"which turns that stall into a copy-paste"*) | — | entry H | `change` | Task 27 |
| 169 | `cli/src/doctor/checks.ts` → the **Under `--remote-job`** paragraph (*"so a gap is a launch that parks rather than an operator's paste"*; *"a missing shell grant has not been observed to stall a run"*) | — | entry H | `change` | Task 27 |
| 170 | `cli/src/doctor/checks.ts` → the comment *"complete that is one unreadable file away from a stall"* | — | entry H | `change` | Task 27 |
| 171 | `cli/src/doctor/checks.ts` → the user-facing `jobClause` message (*"so a gap here is a launch that parks rather than an operator's paste"*) | — | entry H | `change` | Task 27 — no case under `cli/test` asserts the old substring (checked while planning) |
| 172 | `cli/src/generators/permissionProfile.ts` → the pairing-invariant doc comment above `assertEveryScriptListed` (*"a dropped form is invisible until the run that used that spelling hangs."*) | — | entry H | `change` | Task 16 |
| 173 | `cli/templates/scripts/commit-on-branch.sh` (*"a caller-side `if [ -d … ]; then` existence check would reintroduce the stall described under WHY A WRAPPER EXISTS AT ALL"*) | — | entry H | `change` | Task 17 |
| 174 | `cli/test/profile.test.mjs` → the header's continuation (*"There is no error, no prompt and no log line — the run parks."*) | — | entry H | `change` | Task 16 |
| 175 | `cli/test/profile.test.mjs` → `FILE_RULE_KINDS`' comment (*"a rule that matches nothing stalls exactly like a rule that is missing"*) | — | entry H | `change` | Task 16 |
| 176 | `cli/test/profile.test.mjs` → the helper-line comment (*"and the phase stalls at the first helper"*) | — | entry H | `change` | Task 16 |
| 177 | `cli/test/profile.test.mjs` → the scratch-runner case comment (*"invisible until the run that happened to use that spelling parks"*) | — | entry H | `change` | Task 16 |
| 178 | `cli/test/profile.test.mjs` → the assertion message (*"the only thing standing between an adopter and a stalled phase"*) | — | entry H | `change` | Task 16 |
| 179 | `cli/test/profile.test.mjs` (*"An entry for one of them is not a stall — it is a grant nobody asked for"*; *"read once a run has already parked"*) | — | entry H | `no-change` | the first states no unattended outcome; the second is a park on a question file |
| 180 | `cli/src/generators/scripts.ts` → the recursion assertion (*"a run that hangs rather than one that reports anything"*) | — | entry H | `no-change` | a wrapper that runs itself, another cause |
| 181 | `cli/test/init.test.mjs` (*"the prompt never blocks a run that cannot answer it"*, twice) | — | entry H | `no-change` | the CLI's own interactive prompt on a piped stdin, not a permission outcome |
| 182 | `cli/test/doctor.test.mjs` (*"the run starts, and parks"*), `cli/src/doctor/checks.ts` → the `base-freshness` doc comment (*"the run has parked"*, *"starts and parks cleanly"*) | — | entry H | `no-change` | a park on a question file |
| 183 | `docs/retrieval-eval.md` (*"than failing: the run hangs instead of reporting a refusal"*), `evals/docs-retrieval/arm-a/run-arm-a.sh` (*"so an unattended attempt hangs the run instead of"*) | — | entry H | `change` | Task 25 — the continuation lines of the sentences rows 89 and 94 own |
| 184 | `docs/development.md` → `## 6. The roadmap this tree defers to`, the item table | — | entry I | `change` | Task 25 — rows for item 20 (the sandbox's prerequisite checks and the launch refusal) and item 21 (measuring what the sandbox breaks, and the rewrite of the honesty paragraphs), which Tasks 6 and 23 cite |
| 185 | `cli/templates/claude/harness-task-offer.md` (*"A remote address is worse: the run has no web access granted at all, so it would hang rather than fail."*) | — | entry H (widened) | `change` | Task 17 — Task 2 denies `WebFetch` and `WebSearch`, so the fetch is refused, not hung |
| 186 | `examples/notes-app/.claude/harness-task-offer.md` (the same sentence) | example copy of row 185 | entry H (widened) | `change` | Task 26, mirroring Task 17. The example README keeps this copy live, not frozen. |
| 187 | `.claude/harness-task-offer.md` (the same sentence) | this checkout's `init` output of row 185 | entry H (widened) | `no-change` | This checkout's self-adoption output, as row 123. |
| 188 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` → `## Setup (once, at session start)` step **1. Paths (Override-A equivalent).** (*"`<MAIN_REPO>` (for the global kill switch only) is the first entry of `git worktree list`"*) | — | entry J | `change` | Task 8 — it adds a push under `<MAIN_REPO>` to this file, so *"only"* becomes false |
| 189 | `cli/src/commands/doctor.ts` → the help text's `--remote-job` paragraph (*"so its preflight stops before / a session that would park"*) | — | entry H (widened) | `change` | Task 7 — under `dontAsk` a profile gap is a refused call, not a park |
| 190 | `cli/src/commands/doctor.ts` → the module header (*"it changes three profile checks' grades"*), the `REMOTE_JOB_FLAG` doc comment (*"`profile-paths`, `profile-tracked` and `plugin-permissions` fail instead of warning"*) and the help text (*"turns three warnings into failures"*) | — | entry K | `change` | Task 7 — it lands the second of the two checks that also fail under the option |
| 191 | `ROADMAP.md` → the **Release tags in the protected set** row (*"`git tag` and `git push` are on the autonomous profile's ask list, which no one answers there"*) | — | entry H (widened) | `change` | Task 14 — under `dontAsk` an `ask` match is refused at once |
| 192 | `docs/cli.md` → ``## 2. `init` ``, the analyze-step paragraph (*"without which an unattended run parks at the first helper script with no error"*) | — | entry H (widened) | `change` | Task 13 |
| 193 | entry J's other hits: `plugin/commands/branch-answer.md`, `branch-pause.md`, `branch-prompt.md`, `branch-resume.md`, `branch-status.md`, `branch-user-review.md`, the three `branch-start-*-autonomous.md` commands (their `## Resolved values` lead and the kill-switch step), `plugin/docs/AUTONOMOUS_FLOW.md` (the `derived at runtime` row, the kill-switch bullet), `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` (the kill-switch row), `docs_orchestration_instructions_autonomous.md` (the `## Resolved values` lead, the kill-switch step), `plan_orchestration_instructions_autonomous.md` (the `AUTONOMOUS_STOP` path bullets), `user_review_fix_plan_writing_instructions_autonomous.md` (the vocabulary paragraph, *"Neither binding reaches a `STOP`-file halt"*, the STOP-checks step), `user_review_fixes_instructions_autonomous.md` (the same three, and the `AUTONOMOUS_STOP` path bullets) | — | entry J | `no-change` | Each resolves `<MAIN_REPO>` or names a path under it, and none restricts what it is used for; the commands get no push. |
| 194 | `.gitignore`, `cli/templates/repo/gitignore`, `examples/notes-app/.gitignore` (*"The questions a parked run asks"*); `cli/templates/state-dir/README-root.md`, `cli/templates/state-dir/README.md`, `cli/src/generators/stateDir.ts` (*"the park-and-ask clarification channel"*); `cli/templates/claude/qa_test_scenarios.md` and `examples/notes-app/.claude/qa_test_scenarios.md` (*"not a park — no fix loop"*); `cli/src/commands/doctor.ts` (the watcher's event names, *"`parked`, `paused`"*); `cli/src/generators/notifications.ts` (*"completed, parked and failed events"*); `cli/src/remote/githubActions.ts` (`RUN_STATES`, the `parked` label) | — | entry H (widened) | `no-change` | a park on a question file, or the run state it names |
| 195 | `cli/test/flow-walker-resume.test.mjs`, `cli/test/workflow-templates.test.mjs`, `cli/test/watcher-park-loop.test.mjs`, `cli/test/watcher-park-resume.test.mjs`, `cli/test/watcher-remote-job.test.mjs`, `cli/test/watcher-remote-park-sequence.test.mjs`, `cli/test/restart-watcher-remote.test.mjs`, `cli/test/remote-collect.test.mjs`, `cli/test/remote-control.test.mjs`, `cli/test/remote-control-close.test.mjs`, `cli/test/remote-control-mention.test.mjs`, `cli/test/remote-control-review.test.mjs`, `cli/test/remote-deliver.test.mjs`, `cli/test/remote-names.test.mjs` and `cli/test/remote-report.test.mjs` | — | entry H (widened) | `no-change` | parks on a question file, the `parked` / `park_loop` run states, and a test's own bound on a hung watcher |
| 196 | `docs/flow-graph-walker.md`, `docs/github-issue-trigger.md`, `docs/github-run-control.md`, `docs/second-runtime-port-decision.md`, `plugin/commands/branch-answer.md`, `plugin/commands/branch-pause.md`, `plugin/commands/branch-status.md`, `plugin/commands/branch-user-review.md`, `plugin/instructions/mention_reading.md`, `plugin/instructions/unit_loop_core.md` (*"It never parks and never escalates"*) | — | entry H (widened) | `no-change` | a park on a question file, or the run state it names |
| 197 | `cli/test/test-timeout.test.mjs` (*"a hung watcher case fails by name"*), `cli/test/push-branch-deleted-upstream.test.mjs` (*"Remote cannot answer"*), `docs-retrieval-service/tests/test_backend_parity_e2e.py` (*"hang the byte-identical case's `mcp.Client` call"*), `cli/src/core/prompt.ts` (*"`askLine` cannot answer the question differently"*), `plugin/scripts/reserve-qa-user.sh` and `plugin/scripts/release-qa-user.sh` (a test-account slot *"parked"*), `plugin/agents/branch-reviewer.md` and `plugin/agents/skeptic-reviewer.md` (*"an answer nobody in the loop has"*) | — | entry H (widened) | `no-change` | a hung test or probe, an unreachable remote, a QA account slot, or an unrelated use of the word |
| 198 | `plugin/agents/conventions-reviewer.md` (*"the tool layer refuses those paths ahead of any permission entry, so it parks a run"*), `plugin/agents/conventions-writer.md` (*"such a step parks a run"*) | — | entry H (widened) | `no-change` | the `.claude/**` tool-layer wall, unresolved under `dontAsk` (as row 82) |
| 199 | `docs/work-report-research/business-parity-reviewer.md`, `docs/work-report-research/qa-tester.md`, `docs/work-report-research/task-plan-writer.md`, `docs/work-report-research/ui-tests-plan-writer.md`, `docs/work-report-research/user-review-fix-plan-writer.md`, `docs/work-report-research/reviews/business-parity-reviewer.md`, `docs/work-report-research/reviews/ui-tests-plan-writer.md`, `docs/work-report-research/reviews/user-review-fix-plan-writer.md` | — | entry H (widened) | `no-change` | dated research records, as row 93 |
| 200 | `plugin/instructions/dispatch_discipline_instructions.md` → `## Push`, the sentence after the code block ("The script-path token obeys the same guard-safe spelling rule `## Commit mechanics` states above — unquoted and repo-relative — and the call is **unconditional**") | — | entry L | `change` | Task 9 — the push token moves under `<MAIN_REPO>`, so *"repo-relative"* becomes false of it; *"and the call is **unconditional**"* onward stays byte-identical |
| 201 | entry L's `<scripts_dir>` definition hits: the `<scripts_dir>` row (*"the repo-relative directory …"*) of `plugin/agents/committer.md`, `clarification_digest_instructions.md`, `dispatch_discipline_instructions.md`, `improvement_observations_instructions.md`, `docs_orchestration_instructions_autonomous.md`, `task_plan_writing_instructions_core.md`, `user_review_fixes_instructions.md`, `code_review_instructions.md`, `code_review_fixes_instructions.md`, `docs_phase_instructions.md`, `plugin/agents/layer-implementer.md`, `layer-reviewer.md`, `task-plan-writer.md`, `user-review-fix-plan-writer.md`, `plugin/commands/branch-answer.md`, `branch-pause.md`, `branch-resume.md`, `branch-status.md`, `branch-user-review.md`, `plugin/docs/AUTONOMOUS_FLOW.md`, and the `scriptsDir` comment in `plugin/hooks/autonomous-script-allowlist-guard.sh` | — | entry L | `no-change` | The `<scripts_dir>` definition itself: the directory stays repo-relative. (Task 9 amends a later sentence of three of these rows, the one naming the two scripts.) |
| 202 | entry L's commit-wrapper hits: `dispatch_discipline_instructions.md` → `## Commit mechanics` (*"Write the script-path token exactly as shown — unquoted and repo-relative"*); `docs_orchestration_instructions_autonomous.md` → `## Commit mechanics (single source of truth)` rule (1) (*"write the script-path token UNQUOTED and repo-relative"*) and the Done summary's *"the unquoted repo-relative wrapper token"*; `improvement_observations_instructions.md` → **Exact staging + commit.** (*"the wrapper path is repo-relative, so no app-root prefix belongs on it"*); `user_review_fixes_instructions_autonomous.md` → Override D **Exact staging + commit.** (*"the wrapper path is repo-relative and takes no app-root prefix"*) | — | entry L | `no-change` | the commit wrapper, which stays repo-relative (the docs section's push reason is the sentence Task 8 adds) |
| 203 | entry L's `commands.*` hits: the `<test_cmd>` / `<typecheck_cmd>` / `<dev_server_cmd>`, `<app_dir>` and `<app_root>` rows of `plan_orchestration_instructions_autonomous.md`, `plan_orchestration_instructions_core.md`, `plan_orchestration_instructions_semi_autonomous.md`, `user_review_fixes_instructions_autonomous.md`, `user_review_fixes_instructions_core.md`, `user_review_fixes_instructions_semi_autonomous.md`, `user_review_fix_plan_writing_instructions.md`, `user_review_fix_plan_writing_instructions_autonomous.md` (`<app_dir>`), `user_review_fix_plan_writing_instructions_core.md` (`<app_dir>`), `task_plan_writing_instructions_autonomous.md` (*"the app's directory inside the checkout, repo-relative"*), `mode_contract.md` (`<app_dir>`), `plugin/agents/layer-implementer.md`, `qa_test_instructions.md`; the three `branch-start-*-autonomous.md` / `branch-start-user-review-fix-plan.md` `<app_dir>` rows and the Setup paragraphs' *"each configured string is repo-relative"* / *"each configured string and each wrapper path is repo-relative"* | — | entry L | `no-change` | a `commands.*` string or the configured app directory, both of which stay repo-relative |
| 204 | entry L's staged- or recorded-path hits: `plugin/agents/committer.md` (*"Every path in this set is repo-relative"*, step 3's *"repo-relative, unprefixed"*, *"Pass `<plan_path>` exactly as the orchestrator gave it — repo-relative"*); **Write mechanics — absolute write, repo-relative commit** in `clarification_digest_instructions.md`, `dispatch_discipline_instructions.md` and `improvement_observations_instructions.md`; `dispatch_discipline_instructions.md`'s *"pass repo-relative paths to the commit wrapper"*; `improvement_observations_instructions.md`'s entry-format rules (*"every path repo-relative"*, **Every path in an entry is repo-relative.**, the needle note, the machine-path check) | — | entry L | `no-change` | a staged or recorded path, which stays repo-relative |
| 205 | entry L's other hits: `plugin/agents/architecture-reviewer.md`, `branch-reviewer.md`, `business-parity-reviewer.md`, `conventions-reviewer.md`, `conventions-writer.md`, `docs-reviewer.md`, `docs-writer.md`, `layer-reviewer.md`, `qa-tester.md`, `review-plan-reviewer.md`, `skeptic-reviewer.md`, `statistics-plan-writer.md`, `task-plan-reviewer.md`, `task-plan-writer.md`, `test-fix-plan-writer.md`, `ui-tests-plan-reviewer.md`, `ui-tests-plan-writer.md`, `user-review-fix-plan-writer.md`; `plugin/commands/branch-implement-plan.md`, `branch-implement-plan-semi-autonomous.md`, `branch-implement-review.md`, `branch-implement-user-review.md`, `branch-implement-user-review-semi-autonomous.md`, `branch-qa-test.md`, `harness-analyze.md`, `branch-start-docs-autonomous.md` (`<docs_root>`); `plugin/docs/AUTONOMOUS_FLOW.md` (`<githooks_dir>`); `plugin/hooks/allow-qa-credentials-read.sh`, `plugin/hooks/autonomous-script-allowlist-guard.sh`, `plugin/hooks/lib/harness-config-lib.sh`; the `<qa_creds_path>`, `<docs_root>` and `<reference_impl>` sentences of the push-carrying instruction files; `plugin/samples/sample_code_review/finding_1–3.md`, `plugin/samples/sample_user_review_fix_plan/finding_1–3.md` | — | entry L | `no-change` | another repo-relative value (a config path, a layer path, a quoted path in a finding or a guard's path resolution), or a file where no push moves |
