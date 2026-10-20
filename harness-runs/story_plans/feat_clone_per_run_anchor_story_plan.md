# Story: Give every reader of the main checkout one anchor that survives a per-run clone, and call the run's own copy the "run copy"

## Context

Today every reader finds the main checkout as the first entry of `git worktree list`. In a linked worktree that answer is correct. Inside a `git clone --shared` of the main checkout it silently names the clone itself, the global kill switch `<MAIN_REPO>/<state_dir>/AUTONOMOUS_STOP` included. `feat_clone_per_run` taught the run library and the three excluded wrappers to trust and operate on such a clone (`docs/watcher.md` → `### Where the family runs git in a run's copy, and under what pins`; `docs/cli.md` §6), and stated the boundary this branch closes: *"Inside a clone, `hr_main_repo` and `hr_wrapper_main_of` answer the clone itself."* This branch is the second of three. **Every real run still gets a linked worktree when it merges**, and every reader resolves exactly as it does today, in a worktree and in the main checkout. The layout switch, cleanup from the registry, migration and `branch-prompt.md`'s collision guard are the next branch's. Nothing this branch writes schedules them (`harness-runs/lessons.md` → *"A decision rule's outcome is a proposal to the maintainer"*).

**The anchor is an environment variable, `HARNESS_MAIN_REPO`, and the decision is settled here.** The task prompt offers two candidates. A file under the main checkout's state directory can only be found by a reader that already knows where the main checkout is, and inside a clone the reader does not, so that candidate is circular. A file inside the run copy is sandbox-writable and is barred by the prompt. An environment variable set by the launcher reaches every Bash call of the session. A sandboxed command cannot change it in its parent, and an `export` does not survive into the next Bash call, because the agent runner starts each call from its own environment. So:

- **Set.** The watcher's `spawn_engine` exports `HARNESS_MAIN_REPO="$MAIN_REPO"` inside the engine subshell only. That is the one site that launches an unattended session with Bash; job mode reaches the same function. `remote-run.sh`'s control-job mention session is the only other `"$AGENT_CLI"` call. It runs `--tools Read,Grep,Glob` in a temporary directory, can run no command, and has no reader to serve, so it is left unset, and Task 3 records why.
- **Read, by the plugin.** A bare `printenv HARNESS_MAIN_REPO`, allow-listed by the generated profile as the exact rule `Bash(printenv HARNESS_MAIN_REPO)` (Task 1), and graded by a new `doctor` check `profile-main-anchor` (Task 2). When it prints no path — a supervised session, any session no launcher started, or a profile without the rule — the reader takes today's first `worktree ` line, so the main checkout and a linked worktree resolve exactly as today.
- **Read, by the QA-lock helpers.** `hc_main_root` in `plugin/hooks/lib/harness-config-lib.sh` prefers the variable when it names a main checkout, else falls back to today's `--git-common-dir` answer (Task 7). No guard calls `hc_main_root`.
- **Never read by unsandboxed code.** The excluded wrappers and every script the watcher runs keep placing the main checkout from their own location (`hr_wrapper_main_of`, `hr_main_repo "$SCRIPT_DIR"`), because an assignment prefix on an excluded call could set the variable. Task 3 guards that with a source test.

**The owner of the name.** `cli/src/core/mainRepoAnchor.ts` (Task 1) exports `MAIN_REPO_ANCHOR_VARIABLE = 'HARNESS_MAIN_REPO'`, `MAIN_REPO_ANCHOR_READ = 'printenv HARNESS_MAIN_REPO'` and `MAIN_REPO_ANCHOR_RULE = 'Bash(printenv HARNESS_MAIN_REPO)'`, each built from the one before. Its header declares the mirrors outside the package that must spell the same literal: the watcher template's export line (Task 3), `hc_main_root` (Task 7), and the plugin's resolution row and clause (Tasks 8–13). That follows `.claude/context/conventions.md` → *"An environment-variable name is a constant with an owner too"*.

**The two canonical texts every plugin reader carries, byte for byte.** Each per-task file that edits a plugin reader restates both.

- **The resolution row**, in every file that declares `<MAIN_REPO>` in `## Resolved values` (eight files: `plugin/agents/committer.md`, `plugin/commands/branch-start-user-review-fix-autonomous.md`, `plugin/docs/AUTONOMOUS_FLOW.md`, and `plugin/instructions/` `autonomous_pause_and_ledger.md`, `clarification_digest_instructions.md`, `dispatch_discipline_instructions.md`, `improvement_observations_instructions.md`, `task_plan_writing_instructions_autonomous.md`):

  ```
  | `<MAIN_REPO>` | derived at runtime | The main checkout — the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain`. Spell it as a literal absolute path in the command, never through a substitution or a variable. |
  ```

- **The resolution clause**, for every site that resolves `<MAIN_REPO>` in prose instead — the `AUTONOMOUS_STOP` checks, the registry and inbox commands, `qa-tester.md`'s profile read:

  ```
  the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain`
  ```

  A site writes "Resolve `<MAIN_REPO>` as " followed by the clause, or "`<MAIN_REPO>` is " followed by it. Any piped spelling (`git worktree list --porcelain | head -1 | sed …`) and "the watcher-supplied env" go.

**The closure for the anchor.** `grep -rn 'worktree list' plugin` prints only lines that also carry `printenv HARNESS_MAIN_REPO`, or a line the `## Scope register` records `no-change`: `branch-prompt.md`'s collision guard (b), which is the layout switch's, and `improvement_observations_instructions.md`'s machine-path needles, which enumerate every checkout root rather than resolve the main one.

**"Run copy" wording, one rule for every corpus task (Tasks 5, 6, 7–13, 18).** Prose that means the run's own copy says **run copy**: "the run's (own) worktree", "its own worktree", "this worktree" or "the worktree" meaning the run's, "sibling worktree(s)" meaning other runs' copies, and "the run's (own) / a fresh / the branch's existing working copy" meaning the copy the watcher prepares. Articles follow the grammar: "the run copy", "its run copy", "a sibling run copy", "run copies". The shared agent phrase `its **own worktree**` becomes `its **run copy**` in every file that carries it. **Keep:**

- a sentence about a linked worktree as such — `git worktree`'s own behaviour, a `.git` pointer file, a worktree record `<main>/.git/worktrees/<name>/`, git's "main worktree";
- every name: `create-worktree.sh`, `setup-worktree.sh`, `cleanup-merged-worktrees.sh`, the token `<worktree_glob>` and `{{worktreeGlob}}`, the registry field `worktree`, the `doctor` check id `worktrees`, every code identifier, every permission entry such as `Bash(git worktree:*)`;
- every heading another file cites, and every upper-case `_README` heading prefix up to its colon — and the adjective **worktree-relative** wherever it appears, because it is the name of `## Override A — worktree-relative reads`, which the forks and commands cite as *"the worktree-relative reads (Override A)"*;
- the path placeholder `<worktree>`, which is a name (`.claude/context/plugin.md` → `## The placeholder vocabulary`);
- "working copy" where it means any checkout, a person's included;
- text inside a fenced block or a quoted command.

A block several agents carry stays one wording, copied byte for byte. **The phrases several files share take one fixed replacement**, so the copies stay identical whichever task edits them:

| Phrase today | Becomes |
|---|---|
| `its **own worktree**` | `its **run copy**` |
| `the run's **own worktree**` | `the **run copy**` |
| `the run's own worktree` | `the run copy` |
| `current worktree` | `current run copy` |
| `From a worktree, the script-allowlist guard` | `From a run copy, the script-allowlist guard` |
| `naming the same worktree root` | `naming the same run-copy root` |
| `The worktree root this run executes in` | `The run-copy root this run executes in` |
| `worktree branch` | `run branch` |

**The adopter-vocabulary lesson binds here** (`harness-runs/lessons.md` → *"Name an adopter-facing surface with the term adopters already arrive with … never the configuration key, tool name, check id or any other wire identifier"*). Its second half is why every name in the keep list stays. For its first half, the task prompt has decided that "worktree" stops describing a run's copy once that copy may be a clone. So each adopter-facing file glosses the term at its first use: *"run copy — the working copy the watcher prepares for one run"* (Tasks 5 and 6). Every command an adopter is meant to run sits in a fenced block, one command per line (same ledger, `## Adopter-facing documentation`).

**No agent definition's word count rises** (`.claude/context/plugin.md` → `## Writing agent prose`): Task 9 measures `wc -w` before and after for `committer.md` and `qa-tester.md`, whose row and clause grow, and for `layer-implementer.md`, whose sandbox-refusal sentence trades "worktree" for "run copy", and trims words in the same file to pay for it.

**Out of reach on purpose.** `.claude/CLAUDE.md` and `cli/templates/claude/CLAUDE.md`'s opt-out clause, with its partner in `cli/templates/claude/harness-task-offer.md`, run only in a user-typed supervised session (task prompt → `## Not in this branch`). The merge-lines `.gitignore` templates keep their comments, because a reworded comment line would be appended beside the old one in every existing adopter's `.gitignore`. `cli/src/core/git.ts`'s mirror of `hr_main_repo` is `doctor`'s own placement and is not a plugin reader. The self-adopted root copies — `scripts/`, `.claude/`, `harness-runs/*/README.md` — are `init`'s output in this checkout and are not re-rendered here. So real runs launched by this checkout's own watcher do not yet set the variable, fall back, and resolve exactly as today.

**The work is nineteen single-layer tasks.** Tasks 1–6 are `cli`: the owned constant and the profile entry, the `doctor` grade, the launcher, the test-suite isolation, and the two template wording sweeps. Tasks 7–13 are `plugin`: the QA-lock library first, then six reader groups. **Task 14 is a `cli` task placed after the `plugin` tasks** because it tests Task 7's library change, and no task depends on a later one. Tasks 15–19 are `general`: the owed sandbox row, the two documents of record, the developer-document wording, and the worked example's re-render. `phases.parity` is `false`, so nothing here is held to a reference implementation. Scripts stay bash 3.2 compatible, `allowWrite` is not widened, how the run loads the plugin does not change, and **no test is ever aimed at this repository's own main checkout** (`.claude/context/conventions.md` → `## The testing bar`).

**Top risks:**

- **The variable may not reach a sandboxed Bash call.** If it does not, every plugin reader silently falls back, and the branch adds nothing. Task 15 writes the owed `docs/sandbox-verification.md` row that decides it, and the manual setup below takes it before merge.
- **The suite leaks onto the real main checkout.** A launcher-set variable reaches the Run gates' `node --test` and every child. Task 4 blanks it in `ISOLATED_ENV` and at every suite's own `process.env` spread, and proves the fixture runners hand a child an empty value. Task 14's QA-lock cases set it only to a fixture's own main checkout.
- **Corpus drift.** About sixty files change wording, and eight carry the row. Each plugin task restates the canonical row and clause verbatim and closes on the `grep` above. Task 9 measures the three growing agents' word counts.

**Manual setup required:**

1. **Take the owed anchor rows** (depends on Tasks 3 and 15). Use `docs/sandbox-verification.md` → `## 0. Method`'s launch line with `HARNESS_MAIN_REPO=<main>` set on the launch, exactly as `spawn_engine` sets it — or a real watcher pass once the main checkout's `scripts/autonomous-watcher.sh` carries this branch's template. Take one exact `printenv HARNESS_MAIN_REPO` call with cwd = a linked worktree and with cwd = a `git clone --shared` of the main checkout, plus the controls the rows name, and record `claude --version` in the Observed cell. **These rows decide whether this branch merges.** A run cannot take them: it cannot launch a sandboxed session under the profile it measures.
2. **Bring this checkout's unattended profile up to Task 1** (depends on Tasks 1 and 2). Add `Bash(printenv HARNESS_MAIN_REPO)` to `.claude/settings.autonomous.json` → `permissions.allow` by hand, or regenerate the profile with the forced self-adopt `init` that `docs/sandbox-verification.md` → `## 0. Method` describes, restoring the hand-kept files it rewrites. Confirm `doctor`'s `profile-main-anchor` passes.
3. **Run the whole suite with the anchor set in the parent shell** (depends on Task 4; task prompt goal 5). From an ordinary terminal, run `HARNESS_MAIN_REPO=<a scratch directory holding one marker file> bash scripts/test.sh`. It must pass, and the scratch directory must be byte-identical afterwards. A unit may not run the configured test command (`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`), so this is a person's step.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as sub-step bullets in the per-task files, are informational only: they are never the iteration source, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/feat_clone_per_run_anchor/task_<K>_plan.md`. They are ordered bottom-up by ship sequence, with the catch-all layer last. Task 14 sits after the `plugin` tasks because it depends on Task 7.

1. [x] **Task 1** — Own the anchor's name in `cli/src/core/mainRepoAnchor.ts` and allow-list its read in the generated profile _(layer: cli)_ _(points: 15)_
2. [ ] **Task 2** — Add the `doctor` check `profile-main-anchor`, which grades the profile's allow rule for the anchor read _(layer: cli)_ _(points: 15)_
3. [ ] **Task 3** — Set `HARNESS_MAIN_REPO` in the watcher's engine subshell, and prove no other outer-loop script names it _(layer: cli)_ _(points: 15)_
4. [ ] **Task 4** — Keep the test suite isolated from the anchor: blank it in `ISOLATED_ENV` and at every suite's own environment spread _(layer: cli)_ _(points: 20)_
5. [ ] **Task 5** — Say "run copy" in the `cli/templates/claude/` profile templates' `_README` prose _(layer: cli)_ _(points: 15)_
6. [ ] **Task 6** — Say "run copy" in the `repo/` README and the state-directory contract READMEs and ledger template _(layer: cli)_ _(points: 10)_
7. [ ] **Task 7** — Make `hc_main_root` prefer the anchor for the QA-lock helpers, and say "run copy" in the hooks and scripts READMEs _(layer: plugin)_ _(points: 15)_
8. [ ] **Task 8** — Move the five instruction files that declare `<MAIN_REPO>` to the canonical row, with "run copy" wording _(layer: plugin)_ _(points: 20)_
9. [ ] **Task 9** — Move `committer.md` and `qa-tester.md` to the anchor, and say "run copy" in every agent's `<repo_root>` row, holding word counts _(layer: plugin)_ _(points: 20)_
10. [ ] **Task 10** — Move the six registry and inbox commands to the canonical clause, with "run copy" wording _(layer: plugin)_ _(points: 15)_
11. [ ] **Task 11** — Move the three `branch-start-*-autonomous` commands and the docs fork's kill-switch checks to the anchor _(layer: plugin)_ _(points: 15)_
12. [ ] **Task 12** — Move the three autonomous fix and orchestration forks' kill-switch checks to the anchor, with "run copy" wording _(layer: plugin)_ _(points: 20)_
13. [ ] **Task 13** — Say "run copy" in the remaining cores, the QA and mode-contract files and the two flow documents, and give `AUTONOMOUS_FLOW.md` the row _(layer: plugin)_ _(points: 15)_
14. [ ] **Task 14** — Prove the QA-lock helpers follow the anchor from a clone and fall back without it, in `cli/test/qa-user-locks.test.mjs` _(layer: cli)_ _(points: 15)_
15. [ ] **Task 15** — Add the owed anchor rows to `docs/sandbox-verification.md`, and record the library change in `docs/guard-verification.md` _(layer: general)_ _(points: 10)_
16. [ ] **Task 16** — State in `docs/watcher.md` how the anchor is set, read and graded, and what a session no launcher started resolves _(layer: general)_ _(points: 10)_
17. [ ] **Task 17** — State the anchor's allow rule, its `doctor` check and the suite's isolation in `docs/cli.md` _(layer: general)_ _(points: 15)_
18. [ ] **Task 18** — Say "run copy" in the five developer documents, and add the anchor to `ARCHITECTURE.md`'s launch contract _(layer: general)_ _(points: 15)_
19. [ ] **Task 19** — Re-render the worked example's profile for the anchor rule and the reworded `_README` lines _(layer: general)_ _(points: 8)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Prose that means "the run's own copy" says **run copy**, in the plugin corpus, the adopter-facing templates and the developer documents (`ARCHITECTURE.md`, `ROADMAP.md`, `docs/config.md`, `docs/retrieval.md`, `docs/remote-execution.md`)."* — together with goal 4's *"Each file that declares `<MAIN_REPO>` carries one byte-identical resolution row … Close with a grep: every remaining `worktree list` in the plugin corpus sits inside that row or its stated fallback, never alone."*, goal 3's *"Add an owed `docs/sandbox-verification.md` row"* and goal 7's *"`docs/watcher.md` and `docs/cli.md` say how the anchor is set, read and graded"*.

The register covers the plan's **corpus** targets only. `cli/src/**/*.ts`, `cli/test/**/*.mjs` and the shell under `cli/templates/scripts/`, `plugin/hooks/` and `plugin/scripts/` are code and code comments, so their per-task files own them.

**Derivation entry A — plugin files that resolve or name `<MAIN_REPO>` (command).** Re-run verbatim from the checkout root: `grep -rln -E 'worktree list|<MAIN_REPO>' plugin`

**Derivation entry B — corpus files carrying run-copy wording candidates (command).** Re-run verbatim from the checkout root: `grep -rliE "worktree|working cop(y|ies)|run's (own )?copy|sibling cop(y|ies)" plugin cli/templates ARCHITECTURE.md ROADMAP.md docs/config.md docs/retrieval.md docs/remote-execution.md --exclude='*.sh' --exclude='*.yml' --exclude='pre-push'`

**Derivation entry C — developer documents that state how the main checkout is found (command).** Re-run verbatim from the checkout root: `grep -rln -E 'worktree list|first working copy|MAIN_REPO|watcher-supplied' docs ARCHITECTURE.md README.md ROADMAP.md llms.txt CONTRIBUTING.md cli/README.md`

**Derivation entry D — the mirrored render of the profile template (command).** Re-run verbatim from the checkout root: `grep -rliE "worktree|working cop(y|ies)" examples/notes-app/.claude/settings.autonomous.json`

**Derivation entry E — rows of the standing sandbox matrix (procedure).**

- **First step, runnable:** `grep -n -E '^\| [A-Z]+[0-9]+[a-z]? \|.*(worktree list|MAIN_REPO|printenv)' docs/sandbox-verification.md`.
- **Artifact:** `docs/sandbox-verification.md`, the standing record of measured sandbox rows.
- **Traversal:** every table row in file order: §1 D, §2 G and CL, §3 P/R/H/C/K/L and CW, §4 N/S/W/WR/Q and RG, §5 F/T.
- **Decision rule:** a row is reached when its own line names `git worktree list`, `MAIN_REPO` or `printenv`. This is exactly the first step's match set.

**Derivation entry F — documents a shared-library change must update (procedure).**

- **First step, runnable:** `grep -n -E 'guard-verification' .claude/context/plugin.md`.
- **Artifact:** `.claude/context/plugin.md` → `## Guards, the shared library and the helper scripts`.
- **Traversal:** that section's bullets in file order.
- **Decision rule:** a bullet that names a document a change to the shared library must update reaches that document. Here that is `docs/guard-verification.md`, through the bullet *"A change to any guard or to the library re-measures itself in `docs/guard-verification.md`"*.

**Closure invariant:** every site any of the six derivation entries reaches appears as a row below. Entry E's rows are identified by their row id. The anchor's own closure — every `grep -rn 'worktree list' plugin` line carries `printenv HARNESS_MAIN_REPO` or is a `no-change` row here — is checked by every plugin task.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `plugin/agents/committer.md` → the `<MAIN_REPO>` and `<repo_root>` rows | — | A, B | `change` | Task 9 |
| 2 | `plugin/agents/qa-tester.md` → the `**Mocking requests when a test needs it:**` profile read, and the `<repo_root>` row | — | A, B | `change` | Task 9 |
| 3 | `plugin/agents/architecture-reviewer.md` → `<repo_root>` row | — | B | `change` | Task 9 |
| 4 | `plugin/agents/branch-reviewer.md` → `<repo_root>` row | — | B | `change` | Task 9 |
| 5 | `plugin/agents/business-parity-reviewer.md` → `<repo_root>` row | — | B | `change` | Task 9 |
| 6 | `plugin/agents/docs-reviewer.md` → `<repo_root>` row | — | B | `change` | Task 9 |
| 7 | `plugin/agents/docs-writer.md` → `<repo_root>` row | — | B | `change` | Task 9 |
| 8 | `plugin/agents/layer-implementer.md` → `<repo_root>` row, and **A sandbox refusal is the boundary working** ("a write outside the worktree") | — | B | `change` | Task 9 |
| 9 | `plugin/agents/layer-reviewer.md` → `<repo_root>` row | — | B | `change` | Task 9 |
| 10 | `plugin/agents/review-plan-reviewer.md` → `<repo_root>` row | — | B | `change` | Task 9 |
| 11 | `plugin/agents/skeptic-reviewer.md` → `<repo_root>` row | — | B | `change` | Task 9 |
| 12 | `plugin/agents/statistics-plan-writer.md` → `<repo_root>` row | — | B | `change` | Task 9 |
| 13 | `plugin/agents/task-plan-reviewer.md` → `<repo_root>` row | — | B | `change` | Task 9 |
| 14 | `plugin/agents/task-plan-writer.md` → `<repo_root>` row | — | B | `change` | Task 9 |
| 15 | `plugin/agents/task-plan-writer.md` → the deny-listed basename list naming `cleanup-merged-worktrees.sh` | — | B | `no-change` | a script name, which stays |
| 16 | `plugin/agents/test-fix-plan-writer.md` → `<repo_root>` row | — | B | `change` | Task 9 |
| 17 | `plugin/agents/ui-tests-plan-reviewer.md` → `<repo_root>` row | — | B | `change` | Task 9 |
| 18 | `plugin/agents/ui-tests-plan-writer.md` → `<repo_root>` row | — | B | `change` | Task 9 |
| 19 | `plugin/agents/user-review-fix-plan-writer.md` → `<repo_root>` row | — | B | `change` | Task 9 |
| 20 | `plugin/commands/branch-answer.md` → step 1's resolution and its worktree prose | — | A, B | `change` | Task 10 |
| 21 | `plugin/commands/branch-pause.md` → step 1's resolution and its worktree prose | — | A, B | `change` | Task 10 |
| 22 | `plugin/commands/branch-prompt.md` → step 1's resolution and its worktree prose | — | A, B | `change` | Task 10 |
| 23 | `plugin/commands/branch-prompt.md` → step 4 **Collision guard.**, check (b) *"a sibling worktree `<work_root>/<project_name>-<branch>` via `git worktree list`"* | — | A, B | `no-change` | the collision guard is the layout switch's (task prompt → `## Not in this branch`), and the check enumerates copies rather than resolving the main checkout |
| 24 | `plugin/commands/branch-resume.md` → step 1's resolution and its worktree prose | — | A, B | `change` | Task 10 |
| 25 | `plugin/commands/branch-status.md` → step 1's resolution and its worktree prose | — | A, B | `change` | Task 10 |
| 26 | `plugin/commands/branch-user-review.md` → step 1's resolution and its worktree prose | — | A, B | `change` | Task 10 |
| 27 | `plugin/commands/branch-start-docs-autonomous.md` → step 2 **Global kill switch** and its worktree prose | — | A, B | `change` | Task 11 |
| 28 | `plugin/commands/branch-start-plan-autonomous.md` → step 2 **Global kill switch** and its worktree prose | — | A, B | `change` | Task 11 |
| 29 | `plugin/commands/branch-start-user-review-fix-autonomous.md` → the `<MAIN_REPO>` row, step 2 **Global kill switch**, and its worktree prose | — | A, B | `change` | Task 11 |
| 30 | `plugin/instructions/docs_orchestration_instructions_autonomous.md` → step 1 **Paths (Override-A equivalent).** and step 2 **Kill switch** | — | A, B | `change` | Task 11 |
| 31 | `plugin/instructions/autonomous_pause_and_ledger.md` → the `<MAIN_REPO>` row and its worktree prose | — | A, B | `change` | Task 8 |
| 32 | `plugin/instructions/clarification_digest_instructions.md` → the `<MAIN_REPO>` row and its worktree prose | — | A, B | `change` | Task 8 |
| 33 | `plugin/instructions/dispatch_discipline_instructions.md` → the `<MAIN_REPO>` row and its worktree prose | — | A, B | `change` | Task 8 |
| 34 | `plugin/instructions/improvement_observations_instructions.md` → the `<MAIN_REPO>` row and its worktree prose | — | A, B | `change` | Task 8 |
| 35 | `plugin/instructions/improvement_observations_instructions.md` → **Machine-path check — before every wrapper call.** (*"every line beginning `worktree ` in `git worktree list --porcelain` gives a checkout root"*) | — | A, B | `change` | Task 8 adds `<MAIN_REPO>` as a needle; its `worktree list` stays without the clause because it enumerates every checkout root rather than resolving the main one — the stated exception to the anchor closure |
| 36 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → the `<MAIN_REPO>` row and its worktree prose | — | A, B | `change` | Task 8 |
| 37 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → `## Global kill switch`'s **Path:** bullet and its worktree prose | — | A, B | `change` | Task 12 |
| 38 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` → the global kill switch's **Path:** bullet and its worktree prose | — | A, B | `change` | Task 12 |
| 39 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Safety scaffolding` step 1 **STOP checks.** and its worktree prose | — | A, B | `change` | Task 12 |
| 40 | `plugin/docs/AUTONOMOUS_FLOW.md` → the `<MAIN_REPO>` row and its run's-own-working-copy prose | — | A, B | `change` | Task 13 |
| 41 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → its working-copy prose; its `<MAIN_REPO>` mentions name the kill-switch path and resolve nothing | — | A, B | `change` | Task 13 |
| 42 | `plugin/instructions/plan_orchestration_instructions_core.md` → the `<worktree_glob>` row's description and the dev-server **Do NOT** paragraph | — | B | `change` | Task 13 |
| 43 | `plugin/instructions/plan_orchestration_instructions_core.md` → the branch-name paragraph naming `create-worktree.sh` and `worktree add -b` | — | B | `no-change` | a script name and git's own command |
| 44 | `plugin/instructions/qa_test_instructions.md` → the `<worktree_glob>` row's description and the dev-server paragraphs | — | B | `change` | Task 13 |
| 45 | `plugin/instructions/mode_contract.md` → the `<repo_root>` binding row (*"the run's own per-branch worktree"*) | — | B | `change` | Task 13 |
| 46 | `plugin/instructions/plan_orchestration_instructions_semi_autonomous.md` → *"a worktree run resolves the same way to that worktree's own"* | — | B | `no-change` | a semi-autonomous session runs where a person started it, so the worktree is that person's linked worktree, which a bare `--show-toplevel` answers |
| 47 | `plugin/instructions/user_review_fixes_instructions_semi_autonomous.md` → the same sentence | — | B | `no-change` | as row 46 |
| 48 | `plugin/instructions/user_review_fix_plan_writing_instructions.md` → the same sentence | — | B | `no-change` | as row 46, for the supervised fork |
| 49 | `plugin/instructions/user_review_fixes_instructions_core.md` → the branch-name paragraph naming `create-worktree.sh` | — | B | `no-change` | a script name and git's own command |
| 50 | `plugin/instructions/unit_loop_core.md` → *"the working copy's index did not take it"* | — | B | `no-change` | the unit loop runs in every mode, so "working copy" means any checkout |
| 51 | `plugin/hooks/README.md` → the allowlist guard's "sibling worktrees" row, the deny-list rows and *"the same script inside any sibling worktree"* | — | B | `change` | Task 7; the `core.hooksPath` paragraph about a commit in a sibling worktree describes git's shared `.git/config` and keeps the word |
| 52 | `plugin/scripts/README.md` → **`reserve-qa-user.sh [slot]`** (*"so every worktree shares them"*), and the wrapper family line naming the worktree wrappers | — | B | `change` | Task 7; the wrapper family names stay |
| 53 | `cli/templates/claude/settings.autonomous.json` → `_README` lines `THE CHECKOUT AND ITS SIBLING WORKTREES BOTH`, `EVERY WRAPPER IN`, `THE OUTER-LOOP SCRIPTS AN AGENT RUNS`, `THREE COMMANDS RUN OUTSIDE THE SANDBOX`, `TWO RESIDUALS` | template | B | `change` | Task 5; heading prefixes, worktree-record and `.git`-pointer clauses, and every `{{worktreeGlob}}` rule stay |
| 54 | `cli/templates/claude/settings.autonomous.qa.json` → `_README` *"A fresh working copy has no local settings file"* | template | B | `change` | Task 5 |
| 55 | `examples/notes-app/.claude/settings.autonomous.json` → the same `_README` lines, plus the anchor allow rule and its `_README` line | notes-app render | D | `change` | Task 19, mirroring Tasks 1 and 5 |
| 56 | `cli/templates/claude/CLAUDE.md` → **Checkout root** (*"In a second working copy"*) and **Opt-out.** | — | B | `no-change` | the first means any second working copy, a person's included; the opt-out clause is out of this branch (task prompt → `## Not in this branch`) |
| 57 | `cli/templates/claude/harness-task-offer.md` → the **Don't ask again** marker lines | — | B | `no-change` | the opt-out clause's partner, which runs only in a user-typed supervised session; "main worktree" there is git's term |
| 58 | `cli/templates/repo/gitignore` → the client-env, profile and marker comments | — | B | `no-change` | written `merge-lines` (`cli/src/core/writer.ts`), so a reworded comment would be appended beside the old one in every existing adopter's `.gitignore` |
| 59 | `cli/templates/repo/gitignore.qa` → its opening comment | — | B | `no-change` | as row 58: merged into the same managed block |
| 60 | `cli/templates/repo/README.md` → *"what the browser half of a run leaves in the working copy"* | — | B | `change` | Task 6 |
| 61 | `cli/templates/scripts/README.md` → the family line naming the worktree wrappers | — | B | `no-change` | script names, which stay |
| 62 | `cli/templates/state-dir/autonomous_inbox/README.md` | — | B | `change` | Task 6 |
| 63 | `cli/templates/state-dir/autonomous_logs/README.md` → *"whichever sibling working copy a run actually executes in"* | — | B | `change` | Task 6; the `cleanup-merged-worktrees.sh` name stays |
| 64 | `cli/templates/state-dir/clarification_digests/README.md` | — | B | `change` | Task 6 |
| 65 | `cli/templates/state-dir/clarifications/README.md` | — | B | `change` | Task 6 |
| 66 | `cli/templates/state-dir/flow_progress/README.md` | — | B | `change` | Task 6 |
| 67 | `cli/templates/state-dir/improvement_observations/README.md` → the worked example's heading *"gated in a sibling working copy"* | — | B | `change` | Task 6 |
| 68 | `cli/templates/state-dir/lessons.md` → **What this is.** (*"a run in a second working copy"*) | — | B | `change` | Task 6 |
| 69 | `ARCHITECTURE.md` → `## 5.` (the launch path) and `## 6.` (assets), their run-copy prose, and `## 7.`'s engine-contract list — the **1. Launch a session.** item and the `W` diagram label | — | B | `change` | Task 18; adds the anchor to the `spawn_engine` row and to operation 1 |
| 70 | `ROADMAP.md` → *"the worktree, the branch-review diff and the branch refresh"* | — | B | `change` | Task 18 |
| 71 | `docs/config.md` → `## 1. The three resolution classes` (*"sibling-worktree glob"*, *"a second worktree appears"*) and the `commands.depInstall`, `qa` and `parity.toolchainCommands` rows | — | B | `change` | Task 18; the `<worktree_glob>` token row and `projectName`'s "worktree directory names" stay as names |
| 72 | `docs/retrieval.md` → the per-worktree index and database prose | — | B | `change` | Task 18; `setup-worktree.sh` stays |
| 73 | `docs/remote-execution.md` → the mirror-working-copy prose, the job-mode sentence and the `denyWrite` globs sentence | — | B | `change` | Task 18; the cited heading `### Where the family runs git in a run's copy, and under what pins` stays byte for byte |
| 74 | `docs/watcher.md` → §1 step 1 (*"`<MAIN_REPO>` is the first working copy `git worktree list` reports"*), step 6, and a new anchor paragraph | — | C | `change` | Task 16 |
| 75 | `docs/cli.md` → §6, §7's table and check list, §10 | — | C | `change` | Task 17 |
| 76 | `docs/cli.md` → §6's commit-point spelling `bash <MAIN_REPO>/<scripts_dir>/commit-on-branch.sh` and §7's `worktrees` row | — | C | `no-change` | a placeholder use and a check id, both unchanged |
| 77 | `docs/sandbox-verification.md` → **Who reads this:** and a new owed subsection under §2 | — | C | `change` | Task 15 |
| 78 | `docs/sandbox-verification.md` row G6 | — | C, E | `no-change` | an owed row about a relocated worktree record, whose own `git worktree list` probe is git's behaviour |
| 79 | `docs/outer-loop-verification.md` → the `hr_main_repo` failing row and the empty-slug paragraph | — | C | `no-change` | dated measurements of the watcher's own placement, which this branch leaves byte for byte |
| 80 | `docs/guard-verification.md` → a dated note on the library change | — | F | `change` | Task 15 |
