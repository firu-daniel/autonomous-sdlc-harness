# Story: Run gates reach a verdict in a sandboxed Linux session, with the gate worker re-sandboxed by a launcher

## Context

This branch fixes `docs/sandbox-verification.md` §5 **F10**. On a bubblewrap host (Linux, WSL2), a process that a sandboxed Bash call detaches with `nohup … &` and `disown` does not outlive the call. BG9 measured this in both Linux runs, LB5 saw it in both, and T3 showed it reaching `run-test-suite.sh`'s run form on 2026-11-02. So an unattended Linux run never gets a Run gates verdict. The branch also folds in the four probe defects PD25–PD28 that the second Linux run found. **No measured result is invented anywhere in this branch.** The cause of F10 is not measured, and the plan relies on nothing beyond what was observed.

**The design is the user's ruling, not the writer's choice.** `harness-runs/clarifications/fix_linux_detached_gate_run/answer_1.md` decides it:

- **Q2: the earlier plan's `bash <checkout>/<scripts_dir>/run-test-suite.sh:*` exclusion is rejected.** That entry, the job copy that carried it and its planned residual are gone. A gate run executes the build, the tests and the package scripts the session itself wrote, so session-written code never runs unsandboxed through an excluded command.
- **The route taken is the ruling's route 1: re-sandbox the worker.** A launcher that is safe to exclude starts the gate worker under the launcher's own bubblewrap sandbox. This supersedes goal 1's *"on the same profile and under the same sandbox it has today"*: the base profile gains one excluded command, the launcher's, and the gates run in a sandbox the launcher builds rather than in Claude Code's.
- **Already closed, and not revisited:** detaching inside a sandboxed call (BG9, LB5, T3); keeping a call alive past the Bash tool's 10-minute cap or its background time limit (F6); the nested-sandbox settings, which the task prompt forbids.
- **Q1: planning continues.** `review_3.md`'s Must Fix applies as written: PD25's predicate accepts exactly what `hr_run_copy_check_var` accepts (Task 11, Task 14, Task 15).

**The launcher, `launch-sandboxed-gates.sh`.** It is a new outer-loop script, a new row of `cli/src/generators/outerLoopScripts.ts` → `OUTER_LOOP_SCRIPTS` with `agentInvocable: true` and `runsUnsandboxed: true` (Task 3). From that one row the generator derives everything a git wrapper already gets:

- the base profile's excluded entry `bash <repoRoot>/<scriptsDir>/launch-sandboxed-gates.sh:*`, through `sandboxExcludedCommand`;
- its two allow forms;
- its write protection on both sides in the main checkout, through `writeProtection.ts` → `protectedPaths`.

It qualifies on the ruling's two grounds:

- **It is run from the main checkout and is write-protected the way the git wrappers are.**
- **It carries their checks:** `hr_wrapper_main_of`, `hr_git_env_drop`, `hr_wrapper_target_check_var` and `hr_wrapper_branch_var`. It runs no git command in the target, so `hr_pinned_hooks_path` and `hr_worktree_config_check_var` have nothing to guard. Its header and the `runsUnsandboxed` doc comment say so.

It reads no environment variable for a trust decision. `HARNESS_MAIN_REPO` included: an assignment prefix could set one.

**Its interface**, which Tasks 2, 4, 5, 6, 8, 9, 13 and 16 rely on, is `launch-sandboxed-gates.sh <target> <label>`. It prints one stdout line:

- **`in-session`, exit 4.** This host is not a bubblewrap host (`hr_placeholder_host_probe_var` answers `0`), or the main checkout's base profile has `sandbox.enabled` `false` (the opt-out). Either way the session's own run form works as it does today, and nothing is started.
- **`pending`, exit 3.** A run of `<label>` was already live: `.running` held a heartbeat no older than `STALE_SECONDS`, 30 s, mirrored from `run-test-suite.sh`. Or the launcher started one under its own sandbox, and that run claimed `.running` or wrote `.verdict` at or after the launch's own start second.
- **Exit 2: a refusal.** One stderr line `launch-sandboxed-gates.sh: <reason>`, nothing on stdout. It covers bad arguments, the label pattern, the target check, an unreadable branch or profile, `bwrap` not on `PATH`, `bwrap` unable to start a sandbox here, a protected path whose parent directory is absent, and a run that did not start.

**What the launcher runs, and how it is sandboxed.** The launcher detaches a supervisor: itself, re-invoked as `launch-sandboxed-gates.sh --supervise <target> <label>`, through `setsid` where `command -v setsid` resolves, plus `nohup`, `</dev/null`, `&` and `disown`. The supervisor runs `bwrap` in the foreground. `bwrap`'s one command is `bash <target>/<scripts_dir>/run-test-suite.sh --no-detach <label>`. That is the target's own copy, which is session-written and therefore runs only inside the sandbox. Its new `--no-detach` form (Task 1) does the run form's start-up work and then runs both gates in its own process instead of detaching a worker. The reason: a detached worker inside a PID namespace would die with the namespace's first process, which is F10's likely mechanism. After `bwrap` exits, the supervisor removes the placeholders it mounted, through the run library's leftover test (Task 2).

The `bwrap` argument vector:

- **The namespaces:** `--new-session --unshare-all --die-with-parent`, and no `--share-net`. The worker has no network.
- **The filesystem:**
  - `--ro-bind / /`, `--dev /dev`, `--proc /proc` and `--tmpfs /tmp`;
  - `--bind <target> <target>`, the only writable root;
  - `--ro-bind <p> <p>` for every exact absolute `sandbox.filesystem.denyWrite` entry of the session's own profile that lies under `<target>/` and exists;
  - `--ro-bind /dev/null <p>` for one that is absent, when its parent directory exists, refused otherwise;
  - each base-profile `sandbox.credentials.files` path that exists masked, `~/` read as `$HOME/`: a directory by `--tmpfs`, a file by `--ro-bind /dev/null`.
- **The environment:**
  - `--unsetenv` for every base-profile `sandbox.credentials.envVars` name and for `RUN_TEST_SUITE_WORKER`;
  - `--setenv TMPDIR /tmp` and `--chdir <target>`.

The session's own profile is the per-run copy at `hr_run_profile_file "$(hr_repo_slug <main>)" <branch>` when the target is a clone or a legacy worktree. When the target is the main checkout itself, which is job mode, it is the base, `<main>/.claude/settings.autonomous.json`. That covers the local watcher and the remote job alike (`harness-runs/lessons.md` → `## Unattended control loops`). `bwrap` is found the way the wrappers find `git` and `jq`: `command -v bwrap` on the `PATH` the excluded call inherits from the agent runner, the trust `docs/cli.md` §6 residual 5 already states. Before detaching anything, the launcher runs the recipe's own check, `bwrap --ro-bind / / --dev /dev --unshare-all --proc /proc true` (§0, PD20). A non-zero exit is a refusal that quotes `bwrap`'s first stderr line and names `kernel.apparmor_restrict_unprivileged_userns`.

**What reaches the session, and the fallback.** Phase G gains a mode-contract binding, `<gate_launcher>` (Tasks 5 and 6), on the precedent `<park_answer_lookup>` set: declared in both cores that run Phase G and bound by all four forks.

- **The autonomous forks** bind it to the literal spelling `bash <MAIN_REPO>/<scripts_dir>/launch-sandboxed-gates.sh <repo_root> <gate_key>_round_<gate_round>`.
- **The semi-autonomous forks** bind `none`. They run under the user's own settings, which `init` merges with no sandbox block, so F10 does not reach them. The supervised item loops do not change.

G.1 step 2 issues the launcher first when the binding is not `none`, and branches on its line:

- **`pending`:** issue no run form, and collect with step 3's unchanged `--wait`.
- **`in-session`:** issue the run form as today.
- **A refusal at the permission layer:** this is a profile generated before this release. Issue the run form as today.
- **A refusal on stderr:** this is G.1's existing no-verdict-line case, `<escalate>`. In an autonomous run that **parks with the launcher's reason**, for example `bwrap` missing or user namespaces refused. A gate is never reported as passed. That is the ruling's fallback for a host where the route cannot run, and F10's row (Task 15) records that this branch shipped route 1 with that refusal.

If the next Gate 15 container run shows that the supervisor does not outlive the call, F10's row records the follow-up as a proposal: make the launcher refuse on every bubblewrap host. It does not record it as pending work (`harness-runs/lessons.md` → `## Evidence and measurement`).

**What does not change.**

- **The watcher.** No watcher function changes. The per-run copy already appends the run copy's twin of every `Bash(bash <MAIN_REPO>/<scriptsDir>/…` allow entry and checks it, so the launcher's twin rides the existing render and launch check. The only change to what a session is launched on is the base profile's new row, which every per-run copy and every job inherit.
- **macOS's behaviour.** The launcher answers `in-session`, and the run form runs as before. Every macOS probe verdict, BG1–BG8 and T2 keep their records. T2 is not edited.
- **`cli/src` code, except the one table row and the doctor consequence sentence.** No other `cli/src` code line changes.

**Proof, owed rather than claimed.** The probe gains a Linux-only leg, `gate-sandbox`, which runs in job mode too (Tasks 9 and 10). Its rows are:

- **GS1:** the launcher's worker outlives the call and the session, and yields a verdict.
- **GS2:** a write outside its roots, and a write to a protected path inside the target, is refused on disk.
- **GS3:** a network call is refused.
- **GS4:** a denied credential path and the denied token variables cannot be read.
- **WF5,** moved from `detached`: `hr_lane_mtime`'s GNU arm, read in the launcher's worker.

T3 issues the launcher, as Phase G now does on Linux (Task 8). BG9 keeps measuring the sandboxed detach, F10's own fact. The grading functions are tested against fixtures (Tasks 12 and 13), and the Linux results stay owed to the next Gate 15 container run (Task 15).

**PD25–PD28** (Task 11, tested in Task 14):

- **PD25:** plant over Claude Code's own empty `config.worktree` on Linux, accepting exactly `hr_run_copy_check_var`'s inert shape.
- **PD26:** take the bubblewrap-host answer before `run_profile_check`.
- **PD27:** never pick a file the bootstrap reads.
- **PD28:** the evidence cannot decide it. The shape stays out of the judge, and the git leg gains the `.git/config.lock` readings that decide it next time.

**Ship order, and the layers.** The tasks run in this order:

1. **The `cli` mechanism (Tasks 1–4).** The worker form first, then the launcher template, then its row, which arrives after its template as `OUTER_LOOP_SCRIPTS`' ordering rule requires, then its tests.
2. **The `plugin` binding (Tasks 5–6).**
3. **This checkout's root copies (Task 7),** so a probe run from the main checkout runs the new scripts.
4. **The probe (Tasks 8–11),** which is `general`, because `scripts/` sits under the catch-all.
5. **The probe's tests (Tasks 12–14),** which are `cli`. They come after the probe code they test, so the catch-all is not last: dependency order wins, as it did on `fix_sandbox_probe_round3_findings`.
6. **The documents of record and the live fixture (Tasks 15–18).**

The Bash 3.2 floor binds every shell edit: no associative arrays, no `${var,,}`, no `mapfile`.

**Top risks:**

- **A launcher wider than the session's own sandbox.** The worst failure is a launcher that runs session-written bytes outside a sandbox, or a worker sandbox wider than the session's: with network, or with write access outside the target or to a protected path inside it. Task 2 builds the argument vector from the session's own profile. Task 4 asserts it element by element, with a recording `bwrap` stub, and asserts that no step of the launcher executes a byte of the target outside `bwrap`. GS2–GS4 measure it on Linux.
- **A Phase G that never reaches the launcher.** Phase G could issue anything but the literal launcher spelling, or skip it, and Linux would fall back to F10. Or a stale adopter profile could make Phase G escalate on macOS. Task 5 states the branch rule once, the refused-at-the-permission-layer fallback included. Task 6 binds the literal spelling, and T3 issues exactly that spelling (Task 8).
- **Claiming the fix works.** Whether a process detached from an excluded call outlives it on Linux is not measured. GS1 is the isolated row and T3 the end-to-end one, and Task 15 writes *"owed to the next Gate 15 container run"* and no result.

**Manual setup required:**

- **After merge, regenerate this checkout's own untracked `.claude/settings.autonomous.json`** with `HARNESS_SELF_ADOPT=1 node cli/dist/cli.js init --force --no-analyze --non-interactive`. Then restore the hand-kept files from git, as `docs/sandbox-verification.md` §0 *The regeneration (step 1)* does. The profile then carries the launcher's excluded entry, its allow forms and its write protection. Until then `doctor`'s `profile-sandbox` warns that the entry is missing, and Phase G takes the refused-launcher fallback. The same `--force` rewrites `scripts/launch-sandboxed-gates.sh` at mode `0755` if Task 7's `chmod` was refused. Every adopting repository needs the same `init --force` to gain the launcher. Owner: Tasks 3 and 7.
- **Take the Linux results by hand in Gate 15's container:** T3, GS1–GS4, WF5, and the PD25–PD28 rows. This branch takes none of them. Owner: Task 15's rows.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as sub-step bullets inside the per-task files, are informational progress markers only, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_linux_detached_gate_run/task_<K>_plan.md`. They are in ship order, by dependency: first `cli` and `plugin`, then the `general` root copies and probe code, then the `cli` tests of that probe code, and last the `general` records.

1. [x] **Task 1** — Give `run-test-suite.sh` a `--no-detach <label>` form that runs both gates in its own process, and test it _(layer: cli)_ _(points: 15)_
2. [x] **Task 2** — Add the `launch-sandboxed-gates.sh` template, which re-sandboxes the gate worker under its own `bwrap`, and a path-list placeholder sweep in the run library _(layer: cli)_ _(points: 20)_
3. [x] **Task 3** — Register the launcher as an excluded, agent-invocable outer-loop row, and bring the doctor sentence, the profile `_README` and the script lists level with it _(layer: cli)_ _(points: 20)_
4. [x] **Task 4** — Test the launcher end to end against a recording `bwrap` stub _(layer: cli)_ _(points: 20)_
5. [x] **Task 5** — Declare the `<gate_launcher>` binding and make Phase G issue it before the run form _(layer: plugin)_ _(points: 20)_
6. [x] **Task 6** — Bind `<gate_launcher>` in the four forks and name the launcher in the autonomous flow document _(layer: plugin)_ _(points: 10)_
7. [x] **Task 7** — Bring this checkout's root `run-test-suite.sh`, run library and new launcher level with their templates _(layer: general)_ _(points: 10)_
8. [x] **Task 8** — Take T3 through Phase G's launcher spelling, and stop its post-session wait on a stale heartbeat _(layer: general)_ _(points: 15)_
9. [ ] **Task 9** — Add the probe's `gate-sandbox` leg (GS1–GS4 and WF5), and take WF5 out of the `detached` leg _(layer: general)_ _(points: 20)_
10. [ ] **Task 10** — Declare the `gate-sandbox` leg, source it, and restate the leg tables in Gate 15 _(layer: general)_ _(points: 15)_
11. [ ] **Task 11** — Fix probe defects PD25, PD26 and PD27, and add PD28's `.git/config.lock` readings to the git leg _(layer: general)_ _(points: 20)_
12. [ ] **Task 12** — Test T3's launcher answer and the lane-state reading in the gates-leg suite _(layer: cli)_ _(points: 10)_
13. [ ] **Task 13** — Test the `gate-sandbox` leg's grading and declaration, and move the WF5 cases with it _(layer: cli)_ _(points: 20)_
14. [ ] **Task 14** — Test the PD25–PD28 fixes against fixtures, and pin that PD28's shape stays out of the judge's Linux table _(layer: cli)_ _(points: 20)_
15. [ ] **Task 15** — Record F10 and PD25–PD28 as fixed by this branch in `docs/sandbox-verification.md`, restate T3, WF5 and their runner rows, and add the GS rows as owed _(layer: general)_ _(points: 20)_
16. [ ] **Task 16** — State the launcher and its sandbox in `docs/cli.md` §5 and §6, with a new residual _(layer: general)_ _(points: 20)_
17. [ ] **Task 17** — State the launcher and the `--no-detach` form in `docs/watcher.md`'s shipped-scripts table _(layer: general)_ _(points: 10)_
18. [ ] **Task 18** — Re-render the launcher's entries into the notes-app profile, and record that re-render in the notes-app README _(layer: general)_ _(points: 15)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt (*The goal*, items 3 and 4):

> *"The probe's T3, BG9 and WF5 rows can show the fix: their expectations are updated where the mechanism changes, with fixtures in the probe's tests."*
>
> *"`docs/sandbox-verification.md` §5 F10 and PD25–PD28 read as fixed by this branch, saying what changed and that the next Gate 15 container run confirms it. **No measured result is invented.**"*

The constraints add *"do not widen `excludedCommands` … without saying so in F10's row"*. The ruling (`answer_1.md`) adds a new excluded command and a new Phase G binding. Every durable text that does any of the following is therefore a candidate:

- states the excluded set;
- lists the shipped outer-loop scripts;
- states the Run gates route;
- lists the Phase G bindings;
- holds a probe row or leg this plan changes.

**Derivation entries.** Each is a read-only command, re-run verbatim from the checkout root.

- **E1 — the record's rows (command):** `git grep -n -E '^\| (F10|PD25|PD26|PD27|PD28|T3|BG9|WF5|LB5|BG9 \(runner\)|WF5 \(runner\)|LB5 \(runner\)|CS14 \(Linux\)|CS8 \(Linux\)|R3 \(Linux\)|CL5 \(Linux\)) \|' -- docs/sandbox-verification.md`
- **E2 — statements of the excluded set (command):** `git grep -n -i -E 'three (excluded )?wrappers|excluded wrappers|THREE COMMANDS RUN OUTSIDE' -- docs README.md ARCHITECTURE.md plugin cli/README.md cli/templates examples/notes-app/README.md examples/notes-app/.claude/settings.autonomous.json ':!docs/work-report-research'`. It replaces the narrower `'three excluded wrappers'` entry of round 1, whose every hit it still reaches.
- **E3 — the corpus's gate-run, Run-gates-route and excluded-command statements (command):** `git grep -n -i -e 'run-test-suite\.sh' -e 'excludedCommands' -e 'runsUnsandboxed' -e 'Run gates wrapper' -e 'no verdict line' -e 'its wait form' -e 'the run form' -- plugin docs README.md ARCHITECTURE.md cli/README.md cli/templates/scripts/README.md cli/templates/claude cli/src ':!docs/sandbox-verification.md' ':!docs/work-report-research'`. It replaces round 2's narrower entry, which named only the first three patterns, case-sensitively; every hit of that entry is still reached. The added patterns reach the sites that state the route's verdict and failure branch in other words (rows 82–89); `-i` additionally reaches the `staleExcludedCommands` lines, which fall inside rows 20 and 25.
- **E4 — Gate 15's leg text (command):** `git grep -n -F -e 'BG9' -e 'WF5' -e 'the Linux-only legs' -- docs/development.md`
- **E5 — enumerations of the outer-loop set (command):** `git grep -n -E 'commit-on-branch\.sh`?, `?push-branch\.sh`?,? (and|or) `?refresh-branch\.sh|commit / push / branch-refresh' -- README.md ARCHITECTURE.md docs plugin cli/README.md cli/templates/scripts/README.md cli/src ':!docs/sandbox-verification.md' ':!docs/work-report-research'`
- **E6 — the live fixture (command):** `git grep -n -e 'refresh-branch\.sh' -e 'THREE COMMANDS' -e 'run-test-suite\.sh' -- examples/notes-app/.claude/settings.autonomous.json examples/notes-app/README.md`
- **E7 — the Phase G binding sites (command):** `git grep -n -F '<park_answer_lookup>' -- plugin/instructions`
- **E8 — the conventions documents (command):** `git grep -n -e 'refresh-branch\.sh' -e 'run-test-suite\.sh' -- .claude/context`
- **Standing-artifact rows.** None are owed. No standing tracked matrix under `harness-runs/` covers a target of this plan. `harness-runs/lessons.md` is read as a planning constraint, and no lesson in it names a file this plan changes.

**Closure invariant:** every site any derivation entry above reaches appears as a row below. A site reached by two entries is one row, naming both. Two kinds of change land outside the derivations, and each is recorded beside the site it belongs to:

- **New rows** (GS1–GS4 and their runner rows), each recorded with its table's row.
- **New files**: `cli/templates/scripts/launch-sandboxed-gates.sh`, `scripts/launch-sandboxed-gates.sh`, `scripts/lib/sandbox-probe/legs-gate-sandbox.sh`, `cli/test/launch-sandboxed-gates.test.mjs` and `cli/test/sandbox-probe-gate-sandbox-legs.test.mjs`. Each is listed in its own task's `### Targets`.

| # | Site (path + symbol or quoted anchor) | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/sandbox-verification.md` → §5 row F10 | — | E1 | `change` | Task 15 |
| 2 | `docs/sandbox-verification.md` → §5 rows PD25, PD26, PD27, PD28 | — | E1 | `change` | Task 15, Follow-up cells |
| 3 | `docs/sandbox-verification.md` → §5 row T3 | — | E1 | `change` | Task 15, Check and Expected cells |
| 4 | `docs/sandbox-verification.md` → §5 row WF5 | — | E1 | `change` | Task 15, Check and Expected cells: the `gate-sandbox` leg's worker |
| 5 | `docs/sandbox-verification.md` → §5 row BG9 | — | E1 | `no-change` | BG9 still measures a detach inside a sandboxed call, which is F10's fact. This branch routes the gate run around that shape rather than changing it, so BG9's Check and Expected stay true, and its `fail` stays F10's record. GS1 carries the new shape (row 14). |
| 6 | `docs/sandbox-verification.md` → §8 rows `R3 (Linux)`, `CS14 (Linux)`, `CS8 (Linux)` | — | E1 | `no-change` | measured records with unchanged expectations; PD27's, PD25's and PD26's rows carry the fixes |
| 7 | `docs/sandbox-verification.md` → §8 row `CL5 (Linux)` | — | E1 | `change` | Task 15: its Expected cell gains the `.git/config.lock` readings clause |
| 8 | `docs/sandbox-verification.md` → §8 row LB5 | — | E1 | `no-change` | a listener a sandboxed call starts is still F10's: the launcher covers the gate run only |
| 9 | `docs/sandbox-verification.md` → §9 row `BG9 (runner)` | — | E1 | `change` | Task 15: Expected cell only (*"A job's gate run detaches this way"* stops being true on a bubblewrap host) |
| 10 | `docs/sandbox-verification.md` → §9 row `WF5 (runner)` | — | E1 | `change` | Task 15: Expected cell only |
| 11 | `docs/sandbox-verification.md` → §9 row `LB5 (runner)` | — | E1 | `no-change` | as row 8 |
| 12 | `docs/sandbox-verification.md` → the opening **Who reads this:** paragraph (*"the three excluded wrappers"*) | — | E2 | `change` | Task 15: adds the launcher and `run-test-suite.sh`'s `--no-detach` form |
| 13 | `docs/sandbox-verification.md` → §2 row CS4 (*"The three excluded wrappers on a real clone"*) | — | E2 | `no-change` | a measured row about the git wrappers' clone shape; the launcher is not among what it measured |
| 14 | `docs/sandbox-verification.md` → §8, new rows GS1–GS4; §9, new rows `GS1 (runner)`–`GS4 (runner)` | — | new rows | `change` | Task 15, owed and with no result |
| 15 | `docs/cli.md` → *"Everything that runs outside the sandbox is write-protected on both sides"* (*"the three excluded wrappers"*) | — | E2 | `change` | Task 16 |
| 16 | `ARCHITECTURE.md` → *"The permission model"* row | — | E3 | `no-change` | its statement of the `excludedCommands` form (`bash <path>:*`) stays true |
| 17 | `cli/README.md` → the templates paragraph listing the outer-loop shell assets | — | E3, E5 | `change` | Task 3 |
| 18 | `cli/src/config/model.ts` → `isNoneSentinel` doc comment | — | E3 | `no-change` | about the typecheck sentinel |
| 19 | `cli/src/doctor/checks.ts` → `SANDBOXED_WRAPPER_CONSEQUENCE` and its doc comment | — | E3 | `change` | Task 3: the consequence no longer holds for every `runsUnsandboxed` row |
| 20 | `cli/src/doctor/checks.ts` → `PROFILE_SANDBOX_CHECK`'s doc comment (*"An excluded entry in an earlier release's `Bash(…)` form ({@link expectedSandbox}'s `staleExcludedCommands`)"*), its `excludedCommands` / `staleExcludedCommands` grading and its pass message | — | E3 | `no-change` | derived from `expectedSandbox`, which derives from the table; the stale form is produced per row, so the launcher's row gets one like every other |
| 21 | `cli/src/generators/outerLoopScripts.ts` → `OuterLoopScript.runsUnsandboxed` doc comment | — | E3 | `change` | Task 3 |
| 22 | `cli/src/generators/outerLoopScripts.ts` → `OUTER_LOOP_SCRIPTS`, the three git wrapper rows, the `run-test-suite.sh` row and `readonly runsUnsandboxed?: true` | — | E3 | `no-change` | unchanged; the new row is added beside the `run-test-suite.sh` row by Task 3 |
| 23 | `cli/src/generators/permissionProfile.ts` → `SANDBOX_LISTS` | — | E3 | `no-change` | list shapes unaffected |
| 24 | `cli/src/generators/profileEntries.ts` → `sandboxExcludedCommand` (*"the one producer of one"*) | — | E3 | `no-change` | still the one producer: the launcher's entry comes through it |
| 25 | `cli/src/generators/sandboxProfile.ts` → the module header, `ExpectedSandbox`, `expectedSandbox`, `applySandbox` | — | E3 | `no-change` | each derives the set from the `runsUnsandboxed` flag |
| 26 | `cli/src/generators/writeProtection.ts` → `protectedPaths`' two `OUTER_LOOP_SCRIPTS` filters | — | E3 | `no-change` | derive the protected set from the table |
| 27 | `cli/templates/claude/settings.autonomous.json` → `_README` *"THE OUTER-LOOP SCRIPTS AN AGENT RUNS"* | template | E3 | `change` | Task 3 |
| 28 | `cli/templates/claude/settings.autonomous.json` → `_README` *"THE SANDBOX IS STRICT"* | template | E3 | `no-change` | it states the sandbox, not its exceptions; row 29's line states those |
| 29 | `cli/templates/claude/settings.autonomous.json` → `_README` *"THREE COMMANDS RUN OUTSIDE THE SANDBOX"* | template | E2, E3 | `change` | Task 3, rewritten to four |
| 30 | `cli/templates/claude/settings.autonomous.json` → `"excludedCommands": []` | template | E3 | `no-change` | the generator fills it |
| 31 | `cli/templates/scripts/README.md` → *"The other family in this directory is not generated."* | — | E3, E5 | `change` | Task 3 |
| 32 | `docs/cli.md` → §5 *"Two families land in `scriptsDir`"* | — | E3 | `change` | Task 16 |
| 33 | `docs/cli.md` → §6 *"The unattended profile runs every Bash command … inside Claude Code's OS-level sandbox"* | — | E3 | `no-change` | the exceptions are row 34's paragraph's |
| 34 | `docs/cli.md` → §6 *"Three wrappers run outside the sandbox, each in one spelling."* | — | E2, E3 | `change` | Task 16 |
| 35 | `docs/cli.md` → §7 *"`profile-sandbox` is a warning without `--remote-job`"* | — | E3 | `change` | Task 16: the grading is unchanged, but the bullet quotes `SANDBOXED_WRAPPER_CONSEQUENCE` word for word (*"that wrapper running sandboxed where a clone cannot move the main checkout's branch …"*), which Task 3 rewords so it holds for the launcher; the quoted clause is restated to Task 3's new value |
| 36 | `docs/config.md` → `commands.typecheck` and `commands.test` rows | — | E3 | `no-change` | the wrapper invocation is unchanged |
| 37 | `docs/development.md` → Gate 15 leg table, `gates` row | — | E3 | `change` | Task 10 |
| 38 | `docs/development.md` → *"What a Linux run expects"*, `gates` row | — | E3 | `change` | Task 10 |
| 39 | `docs/development.md` → Gate 15 leg table, `detached` row | — | E4 | `change` | Task 10: rows `BG9`; a new `gate-sandbox` row after it |
| 40 | `docs/development.md` → the job-leg table, `detached` row | — | E4 | `change` | Task 10: `BG9`; a new `gate-sandbox` row |
| 41 | `docs/development.md` → *"What a Linux run expects"*, `detached` row | — | E4 | `change` | Task 10; a new `gate-sandbox` row |
| 42 | `docs/development.md` → **What the runner owes**, the `detached` bullet | — | E4 | `change` | Task 10; a new `gate-sandbox` bullet |
| 43 | `docs/development.md` → Gate 15's opening paragraph, *"off Linux it skips the Linux-only legs"* | — | E4 | `change` | Task 10: the list gains `gate-sandbox` |
| 44 | `docs/outer-loop-verification.md` → **Which outer-loop scripts carry a generated permission entry** | — | E5 | `no-change` | a dated measurement record; its count was already the count on its own date |
| 45 | `docs/watcher.md` → shipped-scripts table, `commit-on-branch.sh` row | — | E3 | `no-change` | unaffected wrapper |
| 46 | `docs/watcher.md` → shipped-scripts table, `run-test-suite.sh` row | — | E3 | `change` | Task 17, with a new `launch-sandboxed-gates.sh` row |
| 47 | `plugin/agents/layer-implementer.md` → **A sandbox refusal is the boundary working, in every mode.** | — | E3 | `no-change` | an implementer runs no gate |
| 48 | `plugin/agents/test-fix-plan-writer.md` → the five `== run-test-suite.sh: gate …` marker lines | — | E3 | `no-change` | the markers are unchanged; the `--no-detach` form writes the same ones |
| 49 | `plugin/commands/branch-implement-plan-semi-autonomous.md` → **Phase G:** bullet; `plugin/commands/branch-implement-user-review-semi-autonomous.md` → **Phase A (fixes) …** | — | E3 | `no-change` | semi-autonomous forks bind `<gate_launcher>` to `none` |
| 50 | `plugin/docs/AUTONOMOUS_FLOW.md` → *"Run gates phase"* row | — | E3 | `change` | Task 6 |
| 51 | `plugin/docs/AUTONOMOUS_FLOW.md` → *"Git wrappers"* row | — | E5 | `no-change` | the launcher is not a git wrapper |
| 52 | `plugin/hooks/autonomous-script-allowlist-guard.sh` → the header comment naming `commit-on-branch.sh` as excluded | — | E3 | `no-change` | a comment about another wrapper; the launcher takes no deny-list entry |
| 53 | `plugin/instructions/code_review_fixes_instructions.md` step 1, `code_review_instructions.md` step 6.1, `user_review_fixes_instructions.md` step 1 | — | E3 | `no-change` | supervised item loops: no sandbox block and no per-run profile |
| 54 | `plugin/instructions/plan_orchestration_instructions_core.md` → `## Phase G — Run gates` opening paragraph (*"through one `run-test-suite.sh` call per round"*) | — | E3 | `change` | Task 5 |
| 55 | `plugin/instructions/plan_orchestration_instructions_core.md` → G.0 **Pending an answer** bullet, and the **Pending an answer.** conditions | — | E3, E7 | `no-change` | `<park_answer_lookup>` usage unchanged |
| 56 | `plugin/instructions/plan_orchestration_instructions_core.md` → G.1 step 1, the heartbeat print | — | E3 | `no-change` | prints the wrapper's name only |
| 57 | `plugin/instructions/plan_orchestration_instructions_core.md` → G.1 step 2 | — | E3 | `change` | Task 5 |
| 58 | `plugin/instructions/plan_orchestration_instructions_core.md` → G.1 step 3, the `--wait` form | — | E3 | `no-change` | the wait form is unchanged in both routes |
| 59 | `plugin/instructions/plan_orchestration_instructions_core.md` → Done summary **Run gates (Phase G)** line | — | E3 | `no-change` | reports a verdict |
| 60 | `plugin/instructions/plan_orchestration_instructions_core.md` → `## Mode contract — bindings this file uses`, the `<park_answer_lookup>` row | — | E7 | `change` | Task 5: a `<gate_launcher>` row is added after it |
| 61 | `plugin/instructions/plan_orchestration_instructions_core.md` → Phase G's *"Two flow-dependent vocabularies"* note | — | E7 | `change` | Task 5: names `<gate_launcher>` among Phase G's bindings |
| 62 | `plugin/instructions/user_review_fixes_instructions_core.md` → the `<park_answer_lookup>` binding row | — | E7 | `change` | Task 5: a `<gate_launcher>` row after it |
| 63 | `plugin/instructions/mode_contract.md` → `## Binding vocabulary`, the `<park_answer_lookup>` row | — | E7 | `change` | Task 5: a `<gate_launcher>` row after it |
| 64 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → its `<park_answer_lookup>` binding row | — | E7 | `change` | Task 6: a `<gate_launcher>` row after it |
| 65 | `plugin/instructions/plan_orchestration_instructions_semi_autonomous.md` → its `<park_answer_lookup>` binding row | — | E7 | `change` | Task 6 |
| 66 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` → its `<park_answer_lookup>` binding row | — | E7 | `change` | Task 6 |
| 67 | `plugin/instructions/user_review_fixes_instructions_semi_autonomous.md` → its `<park_answer_lookup>` binding row | — | E7 | `change` | Task 6 |
| 68 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` and `user_review_fixes_instructions_autonomous.md` → **The Phase G answer lookup.** paragraphs | — | E7 | `no-change` | the lookup is unchanged |
| 69 | `examples/notes-app/.claude/settings.autonomous.json` → `_README` *"THE OUTER-LOOP SCRIPTS AN AGENT RUNS"* and *"THREE COMMANDS RUN OUTSIDE THE SANDBOX"* | notes-app | E2, E6 | `change` | Task 18: the live fixture's rendering of rows 27 and 29 |
| 70 | `examples/notes-app/.claude/settings.autonomous.json` → `_README` *"WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN FROM INSIDE IT"* | notes-app | E6 | `change` | Task 18: the generated write-protection line gains the launcher |
| 71 | `examples/notes-app/.claude/settings.autonomous.json` → the wrapper allow rows, the `Edit` deny rows, `sandbox.excludedCommands` and `sandbox.filesystem.denyWrite` | notes-app | E6 | `change` | Task 18: the launcher's entries added beside the existing ones; no existing entry changes |
| 72 | `examples/notes-app/README.md` → **The one edit the kept artifacts carry, and where it landed.** (E2 reaches it through an earlier re-render's record naming *"THREE COMMANDS RUN OUTSIDE THE SANDBOX"*, which stays a true record of that re-render) | notes-app | E2, E6 | `change` | Task 18 |
| 73 | `.claude/context/conventions.md` → `## Shell assets`, *"A call to a main-checkout wrapper — `commit-on-branch.sh`, `push-branch.sh`, `refresh-branch.sh` under `<MAIN_REPO>` — carries no `$` at all"* | — | E8 | `no-change` | A conventions document is never a target (the conventions-document prohibition). The branch's work makes the list incomplete: the launcher is a fourth main-checkout call with the same rule. That is raised in `## Corpus staleness` as a `stale-rule` entry. |
| 74 | `.claude/context/conventions.md` → *"Never `git add -A` …"* and **Merge commits.** | — | E8 | `no-change` | about the git wrappers only |
| 75 | `docs/cli.md` → §6 *"The excluded rule's `:*` accepts any argument, so all three wrappers check their target before any git call"* | — | E2 | `change` | Task 16: the bold lead names the four excluded scripts (the launcher checks its target before it starts anything, and runs no git call), and the `hr_git_env_drop` sentence adds the launcher; the rest of the paragraph describes git calls the launcher does not make |
| 76 | `docs/cli.md` → §6 **"Credentials are denied on both sides."** (*"which is also why the excluded wrappers keep the environment an HTTPS push needs"*) | — | E2 | `change` | Task 16: the launcher is excluded and keeps that environment too, and re-masks it for its worker |
| 77 | `cli/templates/claude/settings.autonomous.json` → `_README` *"CREDENTIALS ARE DENIED ON BOTH SIDES"* (*"so the excluded wrappers above keep the environment an HTTPS push needs"*) | template | E2 | `change` | Task 3: one sentence added for the launcher, no `{{…}}` token |
| 78 | `examples/notes-app/.claude/settings.autonomous.json` → `_README` *"CREDENTIALS ARE DENIED ON BOTH SIDES"* | notes-app | E2 | `change` | Task 18: the live fixture's rendering of row 77 |
| 79 | `docs/watcher.md` → **Not read.** (*"The excluded wrappers place the main checkout from their own location through `hr_wrapper_main_of`"*) | — | E2 | `change` | Task 17: names the launcher among the excluded scripts that place the main checkout that way |
| 80 | `docs/sandbox-verification.md` → §2 row CS3 (*"a run reaches origin only through the excluded wrappers"*) | — | E2 | `no-change` | a measured row's record; it stays true, since the launcher's worker has no network and reaches no origin |
| 81 | `examples/notes-app/README.md` → the frozen-capture list's *"the three wrappers under `scripts/`"* | notes-app | E2 | `no-change` | names `start-dev-server.sh`, `test.sh` and `typecheck.sh`, the token-rendered scripts of the frozen capture, not the excluded set; the launcher's template carries no token and was not in that capture |
| 82 | `plugin/instructions/plan_orchestration_instructions_core.md` → the opening paragraph's parenthetical, *"… and the Run gates wrapper in Phase G."* | — | E3 | `change` | Task 5: the processes the orchestrator runs directly now include the launcher G.1 step 2 issues; the parenthetical names it beside the wrapper, without the `<gate_launcher>` token |
| 83 | `plugin/instructions/plan_orchestration_instructions_core.md` → G.1's **Branch on the verdict line:** list, the **No verdict line** bullet (*"the wrapper, or its wait form, printed nothing on stdout → `<escalate>`, … quoting the wrapper's one stderr line"*) | — | E3 | `change` | Task 5: Task 5's new step 2 routes a launcher stderr refusal here, so the bullet names that trigger beside the wrapper and its wait form, and quotes the launcher's one stderr line |
| 84 | `plugin/instructions/plan_orchestration_instructions_core.md` → `## Stop conditions`, *"**The Run gates wrapper prints no verdict line** (G.1, the run form or its wait form)"* | — | E3 | `change` | Task 5: the core's escalation list names the launcher's stderr refusal beside *"the run form or its wait form"* |
| 85 | `plugin/instructions/user_review_fixes_instructions_core.md` → the opening paragraph's parenthetical, *"… and the Run gates wrapper in Phase G."* | — | E3 | `change` | Task 5: as row 82; this core runs the cited Phase G, so it issues the launcher too |
| 86 | `plugin/instructions/autonomous_pause_and_ledger.md` → the `G.` ledger line (*"the Run gates wrapper printed pass"*) | — | E3 | `no-change` | in both routes the verdict line is printed by the wrapper: the launcher prints only `pending` / `in-session` or refuses, and step 3's unchanged `--wait` prints `pass`, so the line stays true |
| 87 | `plugin/instructions/autonomous_pause_and_ledger.md` → the `RG.` ledger line (*"the Run gates wrapper printed pass"*) | — | E3 | `no-change` | as row 86 |
| 88 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → the ledger flip rule *"`G` — flip once Phase G's wrapper prints `pass`"* | — | E3 | `no-change` | as row 86: the wrapper's wait form still prints the `pass` it flips on |
| 89 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` → the ledger flip rule *"`RG` — once the cited Phase G's wrapper prints `pass`"* | — | E3 | `no-change` | as row 88 |
</content>
</invoke>
