# Story: Sandboxed scripts place their root past the `<scriptsDir>/.git` placeholder in job mode (F15), the probe's `/proc` controls run (PD31), and JS3's plant stalls

## Context

**F15.** In the Gate 12 sandbox series round 14 (2026-11-05, 0.6.9, runner `ubuntu-26.04`, bubblewrap 0.11.1, Claude Code 2.1.318), every sandboxed call that places its repository root from inside the scripts directory failed in job mode. The probe's `gate-sandbox` leg got `launch-sandboxed-gates.sh: the sandboxed gate run of sbx_probe_gs did not start: run-test-suite.sh: '<checkout>/harness-scripts' is not inside a git repository`. Every implementer's `typecheck.sh` and `scratch-run.sh` hit the same failure inside the session's own sandbox, and four answered jobs parked at Run gates. The cause is in the task prompt. The base profile write-protects `<checkout>/<scriptsDir>/.git` at every scripts-directory level by exact path (`cli/src/generators/writeProtection.ts` → `protectedPaths`, the `scriptsDirLevels` loop). On Linux, an exact entry for an absent path is enforced by a placeholder at that path (`docs/sandbox-verification.md` §5 F9). Claude Code mounts one for the session, and `launch-sandboxed-gates.sh` → `lsg_bwrap_args_var` mounts one for the gate worker with `--ro-bind /dev/null <p>`. Twelve scripts place their root with `git -C <scriptsDir> rev-parse --show-toplevel`, directly or through `hr_repo_root "$script_dir"`. Git's discovery stops at that non-directory `.git` and fails: `fatal: not a regular file` for the character device, and `fatal: invalid gitfile format` for an empty file. Only job mode is hit. There the run copy *is* the checkout the base profile was generated for. In the clone layout the entry names the main checkout, which no sandboxed call places its root from.

**The route: (a), placing the root without walking through `<scriptsDir>/.git`.** The placeholder stays, and so does every `<scriptsDir>/.git` entry. Each of the twelve scripts takes as its candidate root the nearest directory, its own included, that holds `harness.config.json`. It confirms the candidate with `git -C <candidate> rev-parse --show-toplevel`, which must answer exactly the candidate. Git's discovery then starts at the root and never meets the scripts directory's `.git`. A candidate that does not confirm is passed over and the walk goes on upward. When no ancestor confirms, the script falls back to today's `git -C <scriptsDir>` answer, so a layout with no configuration behaves as before. The depth comes from where `harness.config.json` sits, so a script that cannot read the configuration (the four rendered wrappers, which source no library and need no `jq`) knows it the same way. Task 1 states the algorithm once, as `hr_script_root` in the run library. Tasks 2 and 3 switch the eight library-sourcing scripts to it. Task 4 inlines the same algorithm in the four wrapper templates, a mirror that the library function's doc comment declares.

- **(b) is rejected.** A placeholder git skips (an empty directory) could fix only the launcher half, because Claude Code chooses the session's own placeholder. A `.git` directory left on disk is also exactly what `hr_wrapper_main_of` takes as a main checkout.
- **(c) is rejected.** Dropping the job-mode entries needs a route as strong as the exact entry, and none is measured. The ledger forbids dropping a protection on an unmeasured "another route can already" (lessons → *Trust checks*).

**What does not change** (the #232 ruling, as the task prompt restates it):

- No gate, wrapper or launcher worker leaves the sandbox. No `<scriptsDir>/.git` entry is dropped.
- `lsg_bwrap_args_var` still pins every protected path, `<target>/<scriptsDir>/.git` included.
- `hr_wrapper_main_of` and the `nogit` placement functions it uses are not edited, so an unsandboxed wrapper's main checkout is placed exactly as before. A planted empty or device `.git` at the scripts directory is still refused. A planted directory is still kept out by the profile's `entry` protection.
- The clone layout gets the same answers. There, the nearest ancestor holding `harness.config.json` is the checkout root, which `git -C` confirms.

**PD31 and JS3.** In the probe's `runner-pid` and `runner-privs` legs, every Bash call that names a `/proc` path was refused at the permission layer in `dontAsk` mode, although each was in `--allowedTools`. Task 6 routes each `/proc` read, and its control in the same session, through a one-line script the probe writes into its checkout. The session runs it as `bash <file>`, so no command string names a `/proc` path. The read itself still happens in the sandboxed call. Task 7 holds it with fixtures. JS3 printed `not run` because the honest task never went `STALL_KILL_SECS` silent. Task 8 gives the plant a stall that stays inside the job's profile: one allow-listed `scratch-run.sh` call on a Node scratch file that sleeps past the kill threshold once, guarded by a marker. Task 9 holds it with fixtures. LB5 is F10 and is not this branch's.

**Why some cli tasks follow general ones.** The probe and the Gate 12 driver live under `scripts/`, which is the catch-all `general` layer, and their fixtures live under `cli/test/`. A fixture cannot land before the code it grades, so each of those two capabilities ships its `general` task first and its `cli` fixture task right after. `fix_linux_gate_sandbox_findings` ordered PD28–PD30 the same way. Every other capability runs in the configured order, `cli` first and the catch-all last: Tasks 1–5, then the catch-all sync and documentation, Tasks 10 and 11.

**One test seam is shared.** The runner's git dies on a non-directory `.git`, while a local git may pass over a `/dev/null` link. Task 1 therefore adds `cli/test/helpers/runner-git-shim.mjs`. It puts a recording `git` first on `PATH` that answers `-C <d> rev-parse --show-toplevel` as the runner's git did whenever the first `.git` above `<d>` is a placeholder shape, and runs the real git otherwise. Tasks 2, 4 and 5 use it, so no suite's verdict depends on the host's git version. Tests cannot create a character device without root. The shim treats a symbolic link to `/dev/null`, which `stat` follows to the device, as the device stand-in, and every suite's header says so.

**Top risks:**

- **A fix that passes locally and still fails on the runner.** The local git's leniency would hide the defect, as the launcher suite's stub already hid it by removing the `.git`-leaf placeholder. Tasks 1, 2, 4 and 5 run under Task 1's runner-git shim. Task 5 keeps the placeholder in place while the worker runs. The runner proof itself is a manual step (below).
- **Weakening an unsandboxed script's placement.** Task 1 asserts that `hr_wrapper_main_of`'s answers for each planted shape are unchanged, and that a planted `harness.config.json` in the scripts directory does not move the placement. Task 5 asserts that the launcher's vector still pins `<main>/<scriptsDir>/.git`.
- **Adopters keep the old wrappers.** Both families are `create-if-absent`, so an adopting repository gets the fix only through `init --force`. Task 11 says so where the wrappers' anchoring is documented, and the manual steps carry it.

**Manual setup required:**

1. After this branch's head is pushed, dispatch `sandbox-probe-runner.yml` in the Gate 12 repository in job mode at that head (`probe_commit` set to it), with the `gate-sandbox`, `runner-pid` and `runner-privs` legs. GS1–GS4 and WF5 prove Tasks 1–5's route on a GitHub-hosted runner. PN1–PN3 and NN2 prove Task 6's route. If either route is refused there, Run gates keep refusing on a runner, as they do now, and the result goes back into this branch as a finding.
2. After the release: `npx autonomous-sdlc-harness init --force` in the Gate 12 repository (it brings in the new wrappers and outer-loop scripts), then the scoped Gate 12 round from the task prompt's *Afterwards*. That round includes step 8's `default-branch` with Task 8's stalling plant, and JS3's grading. Round 14's results are recorded into `docs/sandbox-verification.md` by hand, as the task prompt gives it.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom.

- **Only the committing role flips a marker to `[x]`.** In every flow that dispatches one, that is the `committer` agent. In the supervised flow, which dispatches none, it is the orchestrator itself.
- **No implementer edits this section.** No implementer changes a marker, or any other line of this section, in an index a run is iterating.
- **Other `[ ]` markers are informational.** `[ ]` markers anywhere else, such as sub-step bullets in the per-task files, are progress markers for the implementer only. They are never the iteration source, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_job_mode_scripts_git_placeholder/task_<K>_plan.md`. Entries are ordered bottom-up by ship sequence, in the configured layer order `cli`, `plugin`, `general`. The catch-all `general` layer comes last, except for the two probe and driver capabilities whose code precedes their `cli` fixtures (see `## Context`). No task is in the `plugin` layer.

1. [x] **Task 1** — Add `hr_script_root`, which places a script's root from the nearest confirmed `harness.config.json` ancestor, and the runner-git test shim _(layer: cli)_ _(points: 20)_
2. [x] **Task 2** — Place `run-test-suite.sh`'s and `scratch-run.sh`'s root through `hr_script_root`, held on a job-layout fixture with a placeholder `<scriptsDir>/.git` _(layer: cli)_ _(points: 15)_
3. [x] **Task 3** — Switch the six other library-sourcing scripts to `hr_script_root` _(layer: cli)_ _(points: 10)_
4. [x] **Task 4** — Inline the same placement in the four wrapper templates, held through `init` on a job-layout fixture _(layer: cli)_ _(points: 20)_
5. [x] **Task 5** — Keep the launcher suite's `.git`-leaf placeholder in place, and show a job-mode gate run reaching its verdict past it _(layer: cli)_ _(points: 15)_
6. [x] **Task 6** — PD31: run the probe's `/proc` reads and their controls through probe-written scripts _(layer: general)_ _(points: 15)_
7. [ ] **Task 7** — PD31's fixtures: the indirected commands, their allow rules, the PID substitution and the grading _(layer: cli)_ _(points: 15)_
8. [ ] **Task 8** — Give JS3's plant a one-time silent stall past `STALL_KILL_SECS` through `scratch-run.sh` _(layer: general)_ _(points: 10)_
9. [ ] **Task 9** — JS3's fixtures: the stalling prompt, its derived durations and the refusal of a threshold no Bash call can outlast _(layer: cli)_ _(points: 10)_
10. [ ] **Task 10** — Refresh this repository's self-adopted `scripts/` copies and `examples/notes-app/scripts/` wrappers _(layer: general)_ _(points: 10)_
11. [ ] **Task 11** — Record F15 and PD31 in `docs/sandbox-verification.md`, restate the rows the fixes change, and describe the new anchoring and JS3's plant _(layer: general)_ _(points: 20)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Every script that places its root from its own directory, with `hr_repo_root "$script_dir"` or `git -C "$script_dir" rev-parse --show-toplevel`"*, *"Find a route Claude Code 2.1.318 allows … prove it on a runner, and keep each control in the same session as its probe."* and *"Give the JS3 plant a way to stall that stays inside the job's profile"*. Read here as: the project's durable prose that states how those scripts place their root; prose that states what a `<scriptsDir>/.git` at a scripts-directory level does; prose that spells the `runner-pid` and `runner-privs` legs' `/proc` commands or JS3's plant; and the standing record's rows for the probe rows and Gate 12 rows the prompt names.

**Derivation entry 1 — prose stating how a script places its root (command).** Re-run verbatim from the checkout root:
`git grep -n -E 'git -C "\$script_dir"|hr_repo_root|asks git which checkout|anchors itself' -- '*.md' ':!harness-runs/**'`

**Derivation entry 2 — prose naming the `runner-pid` / `runner-privs` legs, their `/proc` reads, or JS3's honest plant (command).** Re-run verbatim from the checkout root:
`git grep -n -E 'runner-pid|runner-privs|/proc/self/status|/proc/<pid>/environ|honest JS3' -- '*.md' ':!harness-runs/**'`

**Derivation entry 3 — prose naming a `.git` at the scripts directory (command).** Re-run verbatim from the checkout root:
`git grep -n -E 'scripts?[dD]ir>?/\.git|scripts/\.git|harness-scripts/\.git' -- '*.md' ':!harness-runs/**'`

**Derivation entry 4 — the standing record's rows (procedure).** **First step, runnable:** `grep -nE '^\| (F[0-9]+|PD[0-9]+|T3|WF5|GS[0-9]+|PN[0-9]+|NN[0-9]+|JS3N?) \|' docs/sandbox-verification.md`. **Artifact:** `docs/sandbox-verification.md`, the standing measurement record. **Traversal:** §5's F rows, then its PD rows, in file order; then §5's T3 and WF5, §8's GS rows, §9's PN and NN rows, and §10's JS3 and JS3N, in file order. **Decision rule:** a T3, WF5, GS, PN, NN, JS3 or JS3N row is reached because the task prompt names it as a row this branch must make takeable. An F or PD row is reached only when its text names a `.git` at a scripts directory or the refusal `is not inside a git repository`. Before this branch the second filter, `grep -nE '^\| (F[0-9]+|PD[0-9]+) \|.*(is not inside a git repository|scripts?[dD]ir>?/\.git|scripts/\.git)' docs/sandbox-verification.md`, prints nothing. The two ids this branch adds, F15 and PD31, are reached by name: `grep -nE '^\| (F15|PD31) \|' docs/sandbox-verification.md` prints nothing before Task 11 and one line per id after it.

**Closure invariant:** every site each derivation entry reaches appears as a row below. A file with several sites carries one row per anchor.

| # | Site (path + symbol or quoted anchor, or standing-artifact row id) | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `cli/templates/scripts/README.md` → *"Every wrapper anchors itself to its own checkout before it runs"* | — | entry 1, `anchors itself` | `no-change` | Still true. The wrapper still anchors to its own checkout; only the route to it changes. |
| 2 | `docs/cli.md` → the JVM paragraph's *"Below the repository root each anchors itself — `-f <dir>/pom.xml` for Maven"* | — | entry 1, `anchors itself` | `no-change` | About a build tool's own anchor, not a harness script. |
| 3 | `docs/cli.md` §5 → **Every wrapper anchors itself, then forwards its arguments.** (*"asks git which checkout that directory belongs to and runs there"*) | — | entry 1, `asks git which checkout`, `anchors itself` | `change` | Task 11 |
| 4 | `docs/development.md` → Gate 9 (ii)'s **The wrappers are observed rather than executed in place** (*"Every generated wrapper anchors itself with `repo_root="$(git -C "$script_dir" rev-parse --show-toplevel)"`"*) | — | entry 1, `git -C "$script_dir"`, `anchors itself` | `change` | Task 11 |
| 5 | `examples/notes-app/README.md` → **A snapshot, not a live adoption.** (*"the wrappers with `git -C "$script_dir" rev-parse --show-toplevel`"*) | — | entry 1, `git -C "$script_dir"` | `change` | Task 11 |
| 6 | `docs/development.md` → Gate 12 step 8's `default-branch` paragraph (*"It then plants and dispatches an honest JS3 branch"*) | — | entry 2, `honest JS3` | `change` | Task 11 |
| 7 | `docs/development.md` → **Gate 15 — the unattended sandbox probe (macOS and Linux).** opening | — | entry 2, `runner-pid` | `no-change` | It names the legs. What each leg measures is unchanged. |
| 8 | `docs/development.md` → Gate 15's legs table, rows `runner-pid` and `runner-privs` | — | entry 2, `runner-pid`, `runner-privs` | `no-change` | They state what is measured, which is unchanged. They do not spell the commands. |
| 9 | `docs/development.md` → Gate 15's second table, rows `runner-pid` and `runner-privs` | — | entry 2, `runner-pid`, `runner-privs` | `no-change` | A leg-to-rows map, unchanged. |
| 10 | `docs/development.md` → the runner-legs list's `runner-pid` and `runner-privs` bullets | — | entry 2, `runner-pid`, `runner-privs` | `no-change` | They describe the expectation, which is unchanged. |
| 11 | `docs/sandbox-verification.md` §0 → **The probe's second job-mode run (2026-11-02).** | — | entry 2, `runner-pid` | `no-change` | A past run's record. |
| 12 | `docs/cli.md` → the write-protection paragraph (**Everything that runs outside the sandbox is write-protected on both sides**), its `.git` at each scripts-directory level | — | entry 3 | `no-change` | The protected set is unchanged (constraint). |
| 13 | `docs/cli.md` §6 residual 4 (*"a `.git` pointer file planted at `<main>/<scriptsDir>/.git` is the profile's entry alone"*) | — | entry 3 | `no-change` | `hr_wrapper_main_of` is unchanged (Task 1 asserts it). |
| 14 | `docs/cli.md` → **Leftovers.** (*"`<main>/<scriptsDir>/.git` among them, and that one file makes every wrapper refuse every run"*) | — | entry 3 | `no-change` | It is about the git wrappers' `hr_wrapper_main_of` refusal, which this branch keeps. |
| 15 | `docs/cli.md` → the sweep bullet *"when a leftover `<main>/<scriptsDir>/.git` would otherwise stop it starting"* | — | entry 3 | `no-change` | The watcher's start-up placement is not one of the twelve scripts. |
| 16 | `docs/cli.md` → **What the gate does not see** (*"that session's in-flight `<main>/<scriptsDir>/.git` can make a run's wrapper refuse"*) | — | entry 3 | `no-change` | Same `hr_wrapper_main_of` refusal, unchanged. |
| 17 | `docs/cli.md` → **The remedy and what is owed.** (*"A leftover `<checkout>/<scriptsDir>/.git` then makes `hr_wrapper_main_of` refuse"*) | — | entry 3 | `no-change` | Same, unchanged. |
| 18 | `docs/sandbox-placeholder-upstream-report.md` → its setup paragraph and the *2026-10-31* bullet | — | entry 3 | `no-change` | An upstream report's own measurements on their own dates. |
| 19 | `docs/sandbox-verification.md` §0 → the **Absent** row naming `scripts/.git` | — | entry 3 | `no-change` | A past run's record. |
| 20 | `docs/sandbox-verification.md` §0 → **The wrappers after a killed session.** | — | entry 3 | `no-change` | A past run's record of `hr_wrapper_main_of`, which is unchanged. |
| 21 | `docs/sandbox-verification.md` → row CS1 | — | entry 3 | `no-change` | It grades the protection itself, which is unchanged. |
| 22 | `docs/sandbox-verification.md` → row W6 | — | entry 3 | `no-change` | It grades the file tools' deny rules, which are unchanged. |
| 23 | `docs/sandbox-verification.md` → row WR7 (*"create `<main>/scripts/.git` as a file and as a directory"*) | — | entry 3 | `no-change` | The planted-`.git` refusal is unchanged. Task 1 asserts that `hr_wrapper_main_of`'s answers hold. |
| 24 | `docs/sandbox-verification.md` → AP3, first table | — | entry 3 | `no-change` | The sweep and `hr_wrapper_main_of` are unchanged. |
| 25 | `docs/sandbox-verification.md` → AP5, first table | — | entry 3 | `no-change` | Placeholders still form, by design of route (a). |
| 26 | `docs/sandbox-verification.md` → AP3, second table | — | entry 3 | `no-change` | A past run's observation. |
| 27 | `docs/sandbox-verification.md` → AP3, third table | — | entry 3 | `no-change` | A past run's observation. |
| 28 | `docs/sandbox-verification.md` → AP5, third table | — | entry 3 | `no-change` | A past run's observation. |
| 29 | `docs/sandbox-verification.md` §5 → the F rows F1–F14 | — | entry 4, F filter (no row matched) | `no-change` | None names a scripts-directory `.git` or the refusal. F9 is cited from the new F15 row, not edited. |
| 30 | `docs/sandbox-verification.md` §5 → the PD rows PD1–PD30 | — | entry 4, PD filter (no row matched) | `no-change` | None matched the filter. |
| 31 | `docs/sandbox-verification.md` §5 → new row F15 | — | entry 4, by name | `change` | Task 11 |
| 32 | `docs/sandbox-verification.md` §5 → new row PD31 | — | entry 4, by name | `change` | Task 11 |
| 33 | `docs/sandbox-verification.md` → row T3 | — | entry 4 | `no-change` | Its expectation is unchanged. Round 14's observation is the hand-recorded part (task prompt, *Afterwards*). |
| 34 | `docs/sandbox-verification.md` → row WF5 | — | entry 4 | `no-change` | As row 33. |
| 35 | `docs/sandbox-verification.md` §8 → row GS1 | — | entry 4 | `no-change` | Its expectation is unchanged. Its runner result is owed to manual step 1 and the scoped round. |
| 36 | `docs/sandbox-verification.md` §8 → row GS2 | — | entry 4 | `no-change` | As row 35. GS2 must still pass (task prompt), and Task 5 keeps every protected path closed. |
| 37 | `docs/sandbox-verification.md` §8 → row GS3 | — | entry 4 | `no-change` | As row 35. |
| 38 | `docs/sandbox-verification.md` §8 → row GS4 | — | entry 4 | `no-change` | As row 35. |
| 39 | `docs/sandbox-verification.md` §9 → row PN1 (*"a sandboxed `grep -a -c <canary>= /proc/<pid>/environ`"*) | — | entry 2, entry 4 | `change` | Task 11. Its measurement cell names Task 6's script indirection. Observed and verdict are unchanged. |
| 40 | `docs/sandbox-verification.md` §9 → row PN2 | — | entry 2, entry 4 | `change` | Task 11, as row 39. |
| 41 | `docs/sandbox-verification.md` §9 → row PN3 | — | entry 2, entry 4 | `change` | Task 11, as row 39. |
| 42 | `docs/sandbox-verification.md` §9 → row NN1 | — | entry 2, entry 4 | `no-change` | `sudo -n true` names no `/proc` path and ran (task prompt). Task 6 leaves it as written. |
| 43 | `docs/sandbox-verification.md` §9 → row NN2 (*"`NoNewPrivs` read from `/proc/self/status`"*) | — | entry 2, entry 4 | `change` | Task 11, as row 39. |
| 44 | `docs/sandbox-verification.md` §10 → row JS3 | — | entry 4 | `change` | Task 11. Its measurement cell names Task 8's stall. Observed and verdict are unchanged. |
| 45 | `docs/sandbox-verification.md` §10 → row JS3N | — | entry 4 | `no-change` | A hand step, untouched by the plant. |
