# Story: The sandbox probe's job mode, and the GitHub-hosted runner legs

## Context

This branch gives `scripts/sandbox-probe.sh` (Gate 15 in `docs/development.md` → `## 5. Verifying a change`) a **job mode**: `run --job <checkout>` measures **the checkout it runs in, under the base profile a `harness-run.yml` job builds**, instead of a cut probe clone under a per-run profile. It adds the legs only a GitHub-hosted runner can answer, and a workflow file, `scripts/sandbox-probe-runner.yml`, that a person commits **by hand** to the Gate 12 repository `firu-daniel/harness-gate12` and runs there. **It takes no measurement and records no result.** Every row it adds to `docs/sandbox-verification.md` says *not yet measured*. It changes no profile, generator, wrapper, guard, watcher or `harness-run.yml` behaviour. A defect it would expose becomes a follow-up task prompt. No profile the probe measures sets `allowNestedUserNamespaces` or `enableWeakerNestedSandbox`. The workflow never runs in this repository: it lives under `scripts/`, never under `.github/`, and `scripts/publish-main.sh` removes `scripts/` from `main` and every release tag.

This is sandbox3b2, the second of three branches that split sandbox3b. Its Linux baseline is `docs/sandbox-verification.md` §8 *The Linux legs (owed)* with §0's stamp for the first Linux container run (2026-10-29), §5 **F9** with the absent-path re-take AP1–AP5, §5 **F10**, and §5 **PD1–PD23**.

**What job mode is, in four differences from the clone layout.** Each reproduces the job rather than approximating it:

- **No clone, no per-run profile.** `SP_CLONE` and `SP_MAIN` are both the checkout, as in a job, where *"the main checkout and the run copy are the same directory"* (`docs/remote-execution.md`). `SP_RUN_PROFILE` is the checkout's base profile `<checkout>/.claude/settings.autonomous.json`, checked by the watcher's own `run_profile_check` with **no copy**, as its header states for job mode (*"In job mode <file> is $SETTINGS_PROFILE, no <copy> is passed, and the appended set is empty"*). The probe cuts a probe branch **in the checkout**, publishes it to origin with a plain refspec push that writes no upstream into `.git/config`, and switches back and deletes it on every exit path.
- **The launch line.** `sp_launch_args` is **extended, not forked**: in job mode it appends one `--add-dir` per `permissions.additionalDirectories` entry of the base profile, in file order, minus empty entries and the two fixed directories, which is the watcher's `JOB MODE ONLY` tail (`cli/templates/scripts/autonomous-watcher.sh` → the launch-line comment and `spawn_engine`).
- **The preflight.** Job mode's preflight is its own (Task 3): the target is a main checkout that is not the probe's own, on its `defaultBranch` with no tracked change, and `doctor --remote-job` exits 0 and passes the four sandbox checks. Refusals 4 and 5 and refusal 6's `SETTINGS_PROFILE` half assume a local watcher, which job mode turns off, and do not run.
- **The placeholder sweep.** Before each session on a placeholder host the probe writes the job-mode manifest `spawn_engine` writes (`hr_job_absent_file`), and at teardown it runs the job's own `Sweep the sandbox placeholders` step, `HARNESS_JOB_MODE=1 autonomous-watcher.sh job-sweep <branch>`. Every leg reads the checkout's git state before that sweep, and says so in its evidence.

**Which legs run in job mode.** A second declaration beside the leg table, printed by `--list --job`, names each job leg and its job rows (Task 1). The clone-only rows do not carry over: CS1–CS5, CS7–CS15, CL5, and the wrappers' clone arm (CS4, P3, CW2). Each job leg prints its clone-only rows `not run`, *clone layout only*.

| Leg | Job rows |
|---|---|
| `wrappers` | P1c, CW5, P1b, CW6 — the prefix and compound on the checkout's own wrappers, over its HTTPS origin |
| `planted-files` | L1, taken only because it becomes reachable (below) |
| `write-protection` | W6, W8 |
| `network` | N1–N5, N4 with the runner's metadata-service control |
| `credentials` | S1, S2, S4, S5 |
| `detached` (Linux) | BG9, WF5 |
| `loopback` (Linux) | LB1–LB5 |
| `job-layout` (new, job mode only) | CS6, the job layout's own row, a hand row until now |
| `runner-install` (new, Linux job mode) | IS1–IS4 |
| `runner-pid` (new, Linux job mode) | PN1–PN3 |
| `runner-privs` (new, Linux job mode) | NN1, NN2 |

**The runner legs, and what each measures rather than cites.**

- **PID namespace (PN1–PN3).** A sandboxed call counts, never prints, the canary variable `SBX_PROBE_CANARY` in `/proc/<pid>/environ` of the agent CLI that launched it (PN1) and of the probe (PN2), each PID resolved outside the call and spelled as a literal (PD3); and `ls /proc` is checked for either PID (PN3). The agent CLI's PID is substituted into the prompt at launch through a token `sp_session` resolves in its own subshell before `exec` (Task 4). The workflow sets the canary; it is not a secret, and no real secret is ever read by name.
- **no-new-privileges (NN1, NN2).** A sandboxed `sudo -n true` beside the workflow's own unsandboxed `sudo -n true` control, which GitHub documents as passwordless; a control that did not succeed makes NN1 `not run`, never a pass. NN2 reads `NoNewPrivs` from `/proc/self/status` in a sandboxed call.
- **The install step (IS1–IS4).** The AppArmor sysctl before `Install the sandbox prerequisites` (IS1), what the step installed (IS2), whether it wrote `/etc/apparmor.d/bwrap` (IS3), and whether `bwrap` then starts as the runner user while `doctor --remote-job` passes `sandbox-prerequisites` (IS4). This is PD20's restricted case. The workflow takes every host reading itself, before and after the step, into a **runner controls file** the probe grades from.
- **The job layout (CS6)** in job mode, on the base profile the job builds, in two sessions: `git status` and `git add` first, with the index read from outside before the wrapper runs, because the wrapper's own index sync legitimately rewrites `<job>/.git/index`; then the wrapper call, graded on the ref and its change set (Task 9). Job mode also takes CS6 on a local fresh clone, on macOS too, cloned onto the configured `defaultBranch` (Task 15).
- **N4** against Azure's Instance Metadata Service: the workflow's unsandboxed step records the status line only, never a body. Any HTTP status line counts as an answer. If it answered, a response to the sandboxed call is a `fail`; if not, N4 is graded as on macOS since #192.
- **Loopback** N3 and LB1–LB5, **detached** BG9 (and WF5, which rides in BG9's worker), and the macOS legs that apply: network, write protection, wrappers over HTTPS, credentials. The workflow creates a placeholder `~/.ssh/config` so S1 and S2 can tell a refusal from an absence (PD21).
- **L1.** On the clone layout L1 is unreachable (§3 L1). Where the target is the checkout itself, `push-branch.sh` (`cli/templates/scripts/push-branch.sh`) reaches its dash check after the target, worktree-config and hook checks, none of which looks a branch up in the run registry. So job mode sets the checkout's `HEAD` to `refs/heads/-sbxdash` from outside and takes L1. Because `push-branch.sh` runs outside the sandbox, a `fail` leaves `-sbxdash` on origin; the restore, registered before the ref exists, removes it there too when the probe caused it (Task 13). Task 21's fixture drives the wrapper against such a checkout first; if the dash refusal is not what answers, L1 stays `not run`, naming what did.

**The workflow** (Task 14) runs on `${{ vars.HARNESS_RUNNER || 'ubuntu-latest' }}`, the job's own expression. It checks out the adopted repository at `$GITHUB_WORKSPACE` as the job does, then switches it to `harness.config.json` → `defaultBranch` when that differs from GitHub's default branch, refusing and naming both when the configured branch is not on origin, because job-mode preflight check 3 accepts only the configured branch. It clones the probe from the marketplace repository named in the checkout's `.claude/settings.json` at the commit it takes as an input, into `$RUNNER_TEMP`. It copies the job's own steps byte for byte: installing the claude CLI and the pinned plugin, generating the profile with `init --plugin-root-entries`, installing the sandbox prerequisites, and bootstrapping the checkout. It signs in with the `CLAUDE_CODE_OAUTH_TOKEN` secret and runs `run --job "$GITHUB_WORKSPACE" --runner-controls <file>`. It records the image (`ImageOS`, `ImageVersion`, `uname -r`, the `bwrap --version` it installed) and the probe commit. It uploads the kept evidence directory, the probe's stdout and stderr and the controls file as the `sandbox-probe-evidence` artifact, with a **3-day** retention. The runner legs are taken at the release #170 step 4 cuts from a `dev` carrying this branch and #195, through `bash scripts/release.sh <version>`, not at 0.6.7, whose `harness-run.yml` has neither `Install the sandbox prerequisites` nor `Sweep the sandbox placeholders`. Gate 15 says so (Task 15).

**The record** (Task 23) gains `## 9. The GitHub-hosted runner legs`. That heading carries **no** *(owed)* suffix, so it never needs renaming once filled: sandbox3c (#167) writes it up and sandbox4 (#144) cites it. Gate 15 names it. Every row in it says *not yet measured*, with its expected result and, where one exists, its macOS and container baselines beside it.

**Interpretations this plan takes rather than asks about.**

- **PD23's shapes go into the judge, and that is the one place container verdicts on recorded evidence may move.** The prompt says to add the shapes the container run met before the runner run. On Linux only, `Permission denied`, `Device or resource busy` and `inter-device move failed` become sandbox-layer refusals (Task 6), and `legs-protection.sh`'s rename classifier follows (Task 12). So a container row that met only those shapes (CS1, GW2) would now grade where it printed `not run`, which is PD23's own stated follow-up. Every macOS arm is untouched, and every other container verdict is unchanged; Tasks 19–21 show both. The record's CS1 (Linux) and GW2 cells, graded by the maintainer as `blocked: F9`, are not re-graded (Task 23).
- **The runner's host readings come from the workflow, not the probe.** The sysctl before the step, the profile before and after, both controls and the image stamp can only be taken in the workflow's own unsandboxed steps, some of them before the probe exists on disk. The probe grades them from the runner controls file, whose keys Task 7 fixes and Task 14 writes.
- **The probe uses its own run library.** In job mode `hr_*` calls are the probe checkout's `scripts/lib/harness-run-lib.sh`, while every wrapper, the watcher's `run_profile_check` and `job-sweep` are the target checkout's own. Gate 15 tells the person to give `probe_commit` as the commit the release was cut from, so the two are the same code.
- **The job's preflight doctor is the job's.** With `HARNESS_CLI_VERSION` set, as the workflow sets it, job mode runs `npx --yes autonomous-sdlc-harness@<version> doctor --cwd <checkout> --remote-job` from its temp area, as `harness-run.yml` does; without it, the probe checkout's built CLI.
- **The new row ids are IS, PN and NN.** None collides with an id in use. Runner results of existing rows are recorded as `<id> (runner)` rows in §9.

**Cross-task interfaces** (each producer's file defines the contract, and each consumer's file restates the part it calls):

- **Task 1 → every later probe task.** `SP_JOB_MODE` (`0`/`1`), `SP_JOB_CHECKOUT` and `SP_RUNNER_CONTROLS_FILE`, declared in `core.sh` and assigned only by the entry point. The new legs and rows. `sp_job_declare`, `sp_job_print`, `sp_leg_job_rows <leg>`, `sp_leg_job_only <leg>`, `sp_leg_mode_skip <leg> <evidence> [<row>...]` and `sp_job_skip_clone_rows <leg>`. In job mode `sp_result_line` refuses any verdict but `not run` for a row that is not a job row of its leg.
- **Task 2 → Tasks 4, 5, 9, 11, 13.** `job.sh`: `sp_job_setup`, `sp_job_add_dirs <base profile> <cwd> <state root>` (sets the array `SP_JOB_ADD_DIRS`), `sp_job_manifest_write <settings file> <add-dir root>...`, `sp_job_teardown` (the sweep, then the branch restore) and `sp_job_git_note`. Also `SP_JOB_BASE_PROFILE`, `SP_JOB_ORIG_BRANCH` and `SP_JOB_RUNNER_TEMP`.
- **Task 3 → Tasks 5, 7.** `sp_preflight`'s job arm under `SP_JOB_MODE=1`, and `SP_JOB_PREREQ_LINE`, the `sandbox-prerequisites` line its `doctor --remote-job` printed.
- **Task 4 → Tasks 8, 9, 13.** `sp_setup` hands off to `sp_job_setup` after its config reads. `sp_launch_args` appends `SP_JOB_ADD_DIRS` in job mode. `sp_session` writes the job manifest before each launch, and replaces the token `@SP_AGENT_PID@` in the prompt and every `--allowed` rule with the PID the agent CLI will run as. `sp_teardown` calls `sp_job_teardown` after its pending restore and before its clone loop.
- **Task 5 → Tasks 15, 16, 17.** `run --job <checkout> [--runner-controls <file>] [--leg <name>]...`, `preflight --job <checkout> [--runner-controls <file>]`, `--list --job`, and the run loop's job-mode selection.
- **Task 7 → Tasks 8, 10, 14.** The runner controls file: `<key>\t<value>` lines with the fixed key set Task 7 lists. `sp_runner_controls_read <file>`, `sp_runner_control <key>` (the value, or `unrecorded` with status 1) and `sp_runner_stamp`.
- **Task 8 → Tasks 14, 20.** `SP_RUNNER_CANARY_NAME=SBX_PROBE_CANARY`, the variable the workflow sets.
- **Tasks 6–13 → Tasks 19–21.** The grading functions each probe task's file names. Each test task restates the exact signature it drives.
- **Task 1's two tables → Task 15.** Gate 15 restates `--list` and `--list --job` row for row.

**Ship order, and why it departs from the configured layer order.** The configured order is `cli → plugin → general`, with the catch-all last. As on `feat_sandbox_probe_linux_legs`, the `cli` suites test `general`-layer scripts, so the dependency runs against that order:

1. Tasks 1–14 build the probe and the workflow (`general`).
2. Task 15 restates Gate 15 (`general`). It ships before the suites, because `cli/test/sandbox-probe-git-and-legs.test.mjs` compares Gate 15's tables with `--list` and `--list --job`.
3. Tasks 16–22 test them (`cli`).
4. Task 23 adds the rows of record (`general`), last.

**Between those commits some existing cases fail, and that is expected.** Each case below fails from the task named until the test task named updates it. Phase G runs the whole suite once, at the end.

| Suite and case | Fails from | Updated by |
|---|---|---|
| `sandbox-probe-git-and-legs.test.mjs`, `LEG_ORDER` and the `sp_leg_linux_only` case | Task 1 | Task 16 |
| `sandbox-probe-git-and-legs.test.mjs`, *Gate 15's restated leg table matches --list* | Task 1 | Task 15 |
| `sandbox-probe-judge.test.mjs`, *the Linux refusal string and the unrecognised layer* (its `Device or resource busy` example) | Task 6 | Task 19 |
| `sandbox-probe-protection-legs.test.mjs`, the `wp-dd-unrecognised` and `sbx_wp_mv … Device or resource busy` cases | Tasks 6 and 12 | Task 19 |
| `sandbox-probe-glob-registry-legs.test.mjs`, RG2 (a)'s and RG3's busy evidence | Task 6 | Task 19 |

**Top risks:**

- **A macOS or container verdict moves.** Every job arm is gated on `SP_JOB_MODE` being `1`, which only the entry point assigns and never reads from the environment. The runner arms are further gated on a controls file. PD23's strings are gated on `SP_PLATFORM` being `linux`. Tasks 17–21 run each new arm's fixtures with job mode off as well and assert the clone-layout output is byte-identical. Task 19 keeps each existing Linux `unrecognised` case on a string the judge still does not know.
- **The probe damages the adopted checkout or leaves its branch behind.** Job mode refuses a checkout that is the probe's own, is not a main checkout, is off its default branch or carries a tracked change. It writes no upstream into `.git/config`, which the `shasum` guard still watches, and teardown sweeps, switches the checkout back and deletes the probe branch locally and on origin on every exit path through the existing trap. L1's `HEAD` change rides the pending-restore slot. Task 17 drives setup and teardown against a fixture with a bare origin, including an interrupted run.
- **A runner leg leaks a secret, or passes on a call that never ran.** The canary is counted with `grep -a -c` by name and never printed. The metadata-service control keeps the status code only. Every measured call carries its own exact `--allowedTools` rule (PD17), and a refusal at the permission layer is `not run` (PD9). Task 20 drives a permission-refused fixture through every runner grade. Task 22 asserts that no workflow step echoes a secret, that the control step writes no response body, and that the artifact holds only the named paths.
- **The launch line or the manifest drifts from the job's.** Both are mirrors of `spawn_engine` and say so in `job.sh`'s header. Task 18 drives `sp_launch_args` and `sp_job_manifest_write` against profiles carrying duplicate, empty and fixed-directory `additionalDirectories` entries, and asserts the clone-layout line is unchanged.
- **The workflow drifts from the job.** Task 22 asserts that every copied step's `run:` body equals `cli/templates/github/workflows/harness-run.yml`'s step of the same name byte for byte, that every `uses:` pin is one that template carries, and that `runs-on` is the job's expression.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.**

- The orchestrator walks the `[ ]` entries below top-to-bottom.
- **Only the committing role flips a marker to `[x]`:**
  - the `committer` agent, in every flow that dispatches one;
  - the orchestrator itself, in the supervised flow, which dispatches none.
- No implementer changes a marker, or edits any other line of this section, in an index a run is iterating.
- `[ ]` markers elsewhere, such as the sub-step bullets in per-task files, are informational only. The committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/feat_sandbox_probe_job_mode/task_<K>_plan.md`.

1. [x] **Task 1** — Declare the job-mode legs and rows, and refuse a measured clone-only row in job mode _(layer: general)_ _(points: 15)_
2. [x] **Task 2** — Add `job.sh`: job-mode setup, the launch line's job tail, the placeholder manifest, the sweep and the branch restore _(layer: general)_ _(points: 20)_
3. [x] **Task 3** — Add job mode's own preflight _(layer: general)_ _(points: 20)_
4. [ ] **Task 4** — Hook job mode into the session API, and resolve the agent CLI's PID at launch _(layer: general)_ _(points: 15)_
5. [ ] **Task 5** — Add `run --job`, `preflight --job`, `--runner-controls` and `--list --job` to the entry point _(layer: general)_ _(points: 15)_
6. [ ] **Task 6** — Add PD23's Linux refusal shapes to the judge's layer table _(layer: general)_ _(points: 10)_
7. [ ] **Task 7** — Add the runner controls file, the runner stamp and the `runner-install` leg (IS1–IS4) _(layer: general)_ _(points: 15)_
8. [ ] **Task 8** — Add the `runner-pid` (PN1–PN3) and `runner-privs` (NN1, NN2) legs _(layer: general)_ _(points: 20)_
9. [ ] **Task 9** — Add the `job-layout` leg (CS6) _(layer: general)_ _(points: 15)_
10. [ ] **Task 10** — Grade N4 against the runner's metadata-service control _(layer: general)_ _(points: 8)_
11. [ ] **Task 11** — Take the wrappers leg's prefix and compound rows on the checkout in job mode _(layer: general)_ _(points: 15)_
12. [ ] **Task 12** — Take W6 and W8 in job mode, and class PD23's rename shapes as sandbox refusals _(layer: general)_ _(points: 12)_
13. [ ] **Task 13** — Take L1 in job mode on the checkout's own `HEAD` _(layer: general)_ _(points: 15)_
14. [ ] **Task 14** — Add the runner workflow `scripts/sandbox-probe-runner.yml` _(layer: general)_ _(points: 20)_
15. [ ] **Task 15** — Restate Gate 15 for job mode and the runner workflow _(layer: general)_ _(points: 20)_
16. [ ] **Task 16** — Test the leg table, the job table, Gate 15's two restated tables and the mode skips _(layer: cli)_ _(points: 12)_
17. [ ] **Task 17** — Test job mode's preflight, setup and teardown _(layer: cli)_ _(points: 20)_
18. [ ] **Task 18** — Test the job launch line, the manifest, the sweep call and the agent-PID token _(layer: cli)_ _(points: 20)_
19. [ ] **Task 19** — Test PD23's shapes, and move the existing `unrecognised` cases onto a string the judge still does not know _(layer: cli)_ _(points: 15)_
20. [ ] **Task 20** — Test the runner controls file, the runner stamp, the runner legs' grades and N4's runner arm _(layer: cli)_ _(points: 20)_
21. [ ] **Task 21** — Test CS6's grade, the carried-over legs' job arms and L1's reachability _(layer: cli)_ _(points: 20)_
22. [ ] **Task 22** — Test the runner workflow against the job's template _(layer: cli)_ _(points: 15)_
23. [ ] **Task 23** — Add `## 9. The GitHub-hosted runner legs`, each row *not yet measured*, and point the existing rows at job mode _(layer: general)_ _(points: 20)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"The Linux runner's results get their own section with a stable heading in `docs/sandbox-verification.md`, because sandbox3c (#167) writes it up and sandbox4 (#144) cites it for its in-job routes. Name that heading in the gate. Every row in it says *not yet measured*."* It is read with the prompt's goal 3, *"the gate's instructions for committing it to the Gate 12 repository, running it, and reading the uploaded evidence"*, and its constraints *"No measured result is invented"* and *"No profile, generator, wrapper, guard, watcher or `harness-run.yml` behaviour changes"*. So a statement no measurement has yet answered stays as it is, and is `no-change`.

**Derivation entry 1 — the record's rows this branch takes, compares against, or whose follow-up it settles (command).** Re-run verbatim from the checkout root:
`grep -nE '^\| (CS6|L1|N3|N4|BG9|F9|F10|PD9|PD17|PD20|PD21|PD22|PD23) \|' docs/sandbox-verification.md`

**Derivation entry 2 — durable text naming the runner legs' deferral, this branch, or the job-mode-shaped row (command).** Re-run verbatim:
`git grep -nE 'GitHub-hosted runner legs|roadmap item 21|sandbox3b2|feat_sandbox_probe_job_mode|job-mode-shaped|has not yet run on GitHub' -- docs README.md ARCHITECTURE.md`

**Derivation entry 3 — Gate 15's anchors (command).** Re-run verbatim:
`grep -nE '^\*\*Gate 15|^\| Leg \| Rows|^An expected refusal whose text|^\*\*A leg that does not pass|^\*\*A Linux run, in a local container|^\*\*The rows this probe does not take' docs/development.md`

**Derivation entry 4 — the record's opening and its last section (command).** Re-run verbatim:
`grep -nE '^\*\*Since then\.\*\*|^## 8\. |^\*\*Who reads this' docs/sandbox-verification.md`

**Derivation entry 5 — the lessons ledger (procedure).**
- **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`.
- **Artifact:** that ledger.
- **Traversal:** its topic headings in file order, then each rule under its heading.
- **Decision rule:** a rule is reached when it names a measurement or a document of record, a temporary working copy, branch or process, a bounded retry or wait, an expiring store, a new execution environment, or a command a person runs.

**Closure invariant:** every site any derivation entry reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/sandbox-verification.md` → row CS6 (§2 *The clone layout (owed)*) | — | entries 1, 2 (`job-mode-shaped`) | `change` | Task 23: Observed becomes *not yet measured*, naming the `job-layout` leg that takes it (`run --job`), locally and on the runner, whose result is `CS6 (runner)` in §9. Verdict stays *not run — owed* |
| 2 | row L1 (§3) | — | entry 1 | `no-change` | the clone-layout and worktree record stands; the job-mode result is `L1 (runner)` in §9 (Task 23) |
| 3 | row N3 (§4) | — | entry 1 | `no-change` | macOS record; `N3 (runner)` is in §9 |
| 4 | row N4 (§4) | — | entry 1 | `no-change` | macOS record; `N4 (runner)`, with the metadata-service control, is in §9 |
| 5 | row BG9 (§5) | — | entry 1 | `no-change` | the container's result stands; `BG9 (runner)` is in §9 |
| 6 | row F9 (§5) | — | entry 1 | `no-change` | a finding with its fix; job mode sweeps as the job does and changes nothing it records |
| 7 | row F10 (§5) | — | entry 1 | `change` | Task 23: its Follow-up cell adds that `BG9 (runner)` in §9 takes it on a GitHub-hosted runner, not yet measured |
| 8 | row PD9 (§5) | — | entry 1 | `no-change` | its lesson is honoured: a permission-layer refusal is `not run` in every new grade (Tasks 7–9, 13) |
| 9 | row PD17 (§5) | — | entry 1 | `no-change` | its lesson is honoured: every measured call carries its own exact rule (Tasks 8, 9, 13) |
| 10 | row PD20 (§5) | — | entries 1, 2 (`sandbox3b2`) | `change` | Task 23: Follow-up adds that the restricted case is IS1–IS4 in §9, taken by `feat_sandbox_probe_job_mode`'s workflow, not yet measured; the container recipe's line stays owed |
| 11 | row PD21 (§5) | — | entry 1 | `change` | Task 23: Follow-up adds that the runner workflow creates the placeholder `~/.ssh/config`; the container recipe's stays owed |
| 12 | row PD22 (§5) | — | entry 1 | `change` | Task 23: Follow-up adds that the runner workflow uploads the kept evidence as an artifact; the container recipe's four items stay owed |
| 13 | row PD23 (§5) | — | entry 1 | `change` | Task 23: Follow-up becomes *the three shapes are in the judge's Linux table since `feat_sandbox_probe_job_mode` (Task 6), taken from the strings quoted in this row; not yet confirmed by a run* |
| 14 | `docs/cli.md` → *"commit signing … row CS11, owed under roadmap item 21"* | — | entry 2 | `no-change` | the signing measurement, unrelated to job mode |
| 15 | `docs/cli.md` → **A remote job passes the base profile, checked, and its checkout's `.git` stays write-denied.** (*"the job-mode-shaped session is … CS6"*) | — | entry 2 | `no-change` | still unmeasured; it cites row CS6, whose own row (1) names the leg that now takes it |
| 16 | `docs/cli.md` → **Credentials are denied on both sides.** (roadmap item 21) | — | entry 2 | `no-change` | the shell-configuration denial question, unrelated to job mode |
| 17 | `docs/cli.md` → residual list, **Job mode** (*"a job-mode-shaped session is … CS6, owed"*) | — | entry 2 | `no-change` | as row 15 |
| 18 | `docs/remote-execution.md` → **The step has not yet run on GitHub.** | — | entry 2 | `no-change` | IS1–IS4 measure it; no result yet, and no measured result is invented |
| 19 | `docs/sandbox-verification.md` → row CS11 (roadmap item 21) | — | entry 2 | `no-change` | as row 14 |
| 20 | `docs/development.md` → **Gate 15 — the unattended sandbox probe (macOS and Linux).** opening paragraph | — | entry 3 | `change` | Task 15: adds job mode (`run --job`), its preflight, its footprint in the checkout, and the GitHub-hosted runner |
| 21 | `docs/development.md` → Gate 15's leg table (`\| Leg \| Rows \| Expected \| Recorded in \|`) | — | entry 3 | `change` | Task 15: restated from Task 1's `--list`, with the four new legs; a second table restates `--list --job` |
| 22 | `docs/development.md` → *"An expected refusal whose text carries none of the refusal strings the judge knows prints `not run` …"* | — | entry 3 | `change` | Task 15: PD23's three shapes are in the table now; the rule stands for any other string |
| 23 | `docs/development.md` → **A leg that does not pass leaves its evidence behind.** | — | entry 3 | `no-change` | the rule is mode-free; the workflow points `TMPDIR` at its own directory and uploads what the rule keeps (Task 14) |
| 24 | `docs/development.md` → **A Linux run, in a local container.** | — | entry 3 | `no-change` | the container recipe is unchanged; PD20–PD22's container items stay owed |
| 25 | `docs/development.md` → **The rows this probe does not take, named so the list is complete.** | — | entries 2, 3 | `change` | Task 15: the runner legs leave the deferral, now job mode's, taken in #170 step 4's Gate 12 round; CS6 leaves the hand rows; CS5 stays one; the full run stays `chore_sandbox_gate12_full_run_leg`'s |
| 25a | `docs/development.md` → `## 6. The roadmap this tree defers to`, row 20 (*"the install step **has not yet run on GitHub**, and its first real run is item 21's full-run leg"*) | — | entry 2 | `no-change` | IS1–IS4 measure the step on a runner, but no result exists yet, and the full run on the real job is still `chore_sandbox_gate12_full_run_leg`'s; a shipped roadmap row is not rewritten ahead of a measurement |
| 26 | `docs/sandbox-verification.md` → **Who reads this:** | — | entry 4 | `no-change` | its readers and its pointer to the probe's leg table (§0) cover job mode as written |
| 27 | `docs/sandbox-verification.md` → **Since then.** | — | entry 4 | `change` | Task 23: one sentence pointing at §9, all owed |
| 28 | `docs/sandbox-verification.md` → `## 8. The Linux legs (owed)` | — | entry 4 | `no-change` | §9 is appended after §8's last row; §8 is unchanged, and its CS1 (Linux) and GW2 verdicts are not re-graded |
| 29 | `harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block, one command per line …"* | — | entry 5, a command a person runs | `no-change` | honoured by Task 15: every gate command sits alone on its line in a fenced block |
| 30 | `harness-runs/lessons.md` → *"A figure measured under a test stub or a fixture-sized corpus never justifies a design decision …"* | — | entry 5, measurement | `no-change` | honoured: no fixture result is written as a measurement (Tasks 16–23) |
| 31 | `harness-runs/lessons.md` → *"A feature that ships as "not yet measured" ships the seam that will measure it …"* | — | entry 5, measurement | `no-change` | honoured: every §9 row names the leg and the workflow that take it (Tasks 14, 23) |
| 32 | `harness-runs/lessons.md` → *"A decision rule's outcome is a proposal to the maintainer, not a settled future …"* | — | entry 5, document of record | `no-change` | honoured: no runner outcome is written into another document as pending work (Tasks 15, 23) |
| 33 | `harness-runs/lessons.md` → *"A wall-clock figure in a document of record is never one a run measured inside its own session …"* | — | entry 5, measurement | `no-change` | honoured: the workflow's step timeout and the legs' waits are bounds, not records |
| 34 | `harness-runs/lessons.md` → *"Attribute a measured effect to one rule family only after a control run …"* | — | entry 5, measurement | `no-change` | honoured: NN1 and N4 are graded against the workflow's unsandboxed controls, and PN1–PN3 and NN2 against an in-session control (Tasks 8, 10) |
| 35 | `harness-runs/lessons.md` → *"A measurement script stores and reports every reading in full …"* | — | entry 5, measurement | `no-change` | honoured: the controls file keeps every reading whole and the workflow uploads it with the probe's full stdout and stderr (Tasks 7, 14) |
| 36 | `harness-runs/lessons.md` → *"Grade a write probe on what reached the disk, never on the call's exit status …"* | — | entry 5, measurement | `no-change` | honoured: CS6's `git add` is graded on the index's `shasum` and the staged set, both read before the wrapper runs so its legitimate index sync never enters the reading, and its commit on the ref and the commit's change set (Task 9) |
| 37 | `harness-runs/lessons.md` → *"Every automatic retry in an unattended path is bounded by a count or a deadline …"* | — | entry 5, a bounded retry or wait | `no-change` | honoured: the workflow job and its probe step carry `timeout-minutes`, and the probe adds no unbounded wait (Tasks 8, 14) |
| 38 | `harness-runs/lessons.md` → *"State held only in an expiring store (an artifact, a cache) must be reported plainly as expired …"* | — | entry 5, an expiring store | `no-change` | honoured: Gate 15 states that an expired `sandbox-probe-evidence` artifact means the evidence is gone and the round is re-run (Task 15) |
| 39 | `harness-runs/lessons.md` → *"A new execution environment must state, for every configurable phase, whether that phase runs there …"* | — | entry 5, a new execution environment | `no-change` | honoured: `--list --job` states for every leg whether it runs in job mode and with which rows, and Gate 15 restates it (Tasks 1, 15) |
| 40 | `harness-runs/lessons.md` → *"A command scoped to one branch reads and writes that branch's state only …"* | — | entry 5, a temporary working copy or branch | `no-change` | honoured: job mode creates only its own probe branch, in the checkout it measures |
| 41 | `harness-runs/lessons.md` → *"A script that creates a temporary working copy or branch removes it on every exit path …"* | — | entry 5, a temporary working copy or branch | `no-change` | honoured: the probe branch, the checkout's `HEAD` and L1's `-sbxdash` ref are restored or removed by teardown on every exit path, and never one the probe did not create (Tasks 2, 13, 17). L1's `-sbxdash` covers both copies: `sp__pf_l1_restore`, registered before the ref is created, deletes the local ref and, when origin had none before and its tip is now the probe's commit, the remote ref the `fail` arm's push left there (Tasks 13, 21) |
| 42 | `harness-runs/lessons.md` → *"Never drop a protection because another route "can already" reach the same target until that route is measured …"* | — | entry 5, measurement | `no-change` | honoured: the branch drops no protection. Job mode adds no profile, generator, wrapper or guard change, and relies on no unmeasured route: it measures the base profile the job already builds, and every route it takes is a measured call graded on its own exact rule |
</content>
</invoke>
