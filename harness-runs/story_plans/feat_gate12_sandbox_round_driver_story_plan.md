# Story: A hand-run driver for Gate 12's sandbox series round

## Context

This branch adds `scripts/gate12-sandbox-round.sh`, with its library under `scripts/lib/gate12-sandbox-round/`. The script takes the job legs of `docs/development.md` → **Gate 12** → **The sandbox series round (#170 step 4) — not yet run.**: round step 6 (the full-run leg, observation **(xvi) The full-run leg: one task through `harness-run.yml`, end to end.**), step 7 (the adversarial legs) and step 8 (the default-branch leg). It plants each adversarial branch, dispatches its job, and grades the job logs and artifacts into one result line per row of `docs/sandbox-verification.md` → `## 10. The full-run leg and the Gate 12 sandbox round`. **It takes no measurement and records no result.** Every row stays *not yet measured*. Nothing in this branch reaches GitHub, and nothing runs in this repository (`docs/development.md` → **This repository cannot host its own remote runs.**). The tests drive a `gh` stub against throwaway fixture repositories under the system temp directory.

**The model is `scripts/sandbox-probe.sh`** and `scripts/lib/sandbox-probe/core.sh`. Like them, the new script is hand-written, is not in the set `init --force` regenerates, and is not a `cli/templates/` file. It is never shipped to adopters. It copies their shape:
- a single row table in `core.sh`, printed by `--list`, which `docs/development.md` restates;
- a result-line printer that refuses a row not in the table;
- libraries sourced in a fixed order, each only if present, with a usage refusal naming a missing function;
- every file, the sourced libraries included, opens with `#!/usr/bin/env bash` on its first line (`.claude/context/conventions.md` → `## Shell assets`), as every `scripts/lib/sandbox-probe/*.sh` does;
- `set -u` and no `-e`;
- a Bash 3.2 floor (no associative arrays);
- an exit code where the highest code wins;
- evidence kept only for a row that does not pass.

The script runs from the Gate 12 repository's root and names that repository with `--repo <owner>/<name>`. It reads the Gate 12 repository's own `harness.config.json` for `stateDir` and `scriptsDir`, written below as `<g12_state>` and `<g12_scripts>`.

**The cross-task interfaces.** Every task restates the parts it consumes. They are stated once here:

- **Names.** Functions are prefixed `g12_` and globals `G12_`. Libraries are sourced in this order: `core.sh`, `preflight.sh`, `state.sh`, `plant.sh`, `plants.sh`, `default-branch.sh`, `runs.sh`, `grade-plant.sh`, `grade-state.sh`, `grade-full-run.sh`, `teardown.sh`.
- **Subcommands.** `--help` · `--list` · `plant --repo <slug> [--row <ID>]...` · `default-branch --repo <slug> [--other-branch <name>] [--stall-warn-secs <n>] [--stall-kill-secs <n>] [--wait-secs <n>]` · `grade --repo <slug> [--row <ID>]... [--full-run <branch>]` · `teardown --repo <slug>`.
- **The result line**, printed by `g12_result_line <row> <result> <evidence> [<departure>]`: `row="<ID>" result="<r>" evidence="<one line>" departure="<text|none>"`. `<r>` is one of `pass`, `fail`, `not run`, `expired` and `source`. A `source` line is not graded. It names the file and symbol the row's clause is read from.
- **Exit codes**, highest wins:
  - `0`: nothing failed;
  - `1`: a usage error, or a library function not present;
  - `2`: a preflight refusal, with nothing created;
  - `3`: a `gh` or `git` call failed;
  - `4`: at least one row printed `fail`;
  - `5`: a restore or a removal left something behind, named on stderr.
- **The scratch directory** is `<g12_state>/scratch/gate12-sandbox-round/`, printed by `g12_scratch_dir` in `state.sh` (Task 2). It is derived there only: the state file's path and every `runs/<id>/…` and `evidence/<row>.log` path (`runs.sh`, Task 6) build on it.
- **The state file** is `state.json` in the scratch directory, printed by `g12_state_path`. It is JSON and is written atomically through a temp file beside it. Its keys are `schema`, `repo`, `default_branch`, `branches[]` (`name`, `row`, `arm`, `commit`), `runs[]` (`row`, `arm`, `branch`, `run_id`, `dispatched_at`, and the optional `stall_values_unconfirmed` — read as `false` when absent, written only by the default-branch leg, Task 5), `tokens` (by row), `other_branch` and `variables` (by name: `present`, `value`, `restored`). `state.sh`'s header (Task 2) is the one declaration of these shapes; no other task adds a key.
- **Planted branches** are named `gate12_<row lower-case>_<arm>_<UTC yyyymmddHHMMSS>`. Each one is built by plumbing from the tip of `origin/<GitHub default branch>`: a commit placing the task prompt at `<g12_state>/task_prompts/<branch>_task_prompt.md`, then the plant commit. `g12_branch_build` writes objects only; `g12_branch_push` records the name in `branches[]` **before** it creates the local ref `refs/heads/<branch>` and pushes (Task 3), and the default-branch leg records `other_branch` before it pushes that branch and refuses when one is already recorded (Task 5), so no ref this script creates is ever unrecorded. Each is pushed with `git push --no-verify`. Each is dispatched through the Gate 12 repository's own `bash <g12_scripts>/remote-run.sh dispatch <branch> --engine task`, because that file is *"the one place a `gh workflow run` of the run workflow is composed"* (`cli/templates/scripts/remote-run.sh`, header).

**How the round's plants reach a job — settled from the shipped sources, as the prompt requires.**

| Row | Route | The line that offers it, or why there is none |
|---|---|---|
| JS1 (`.claude/settings.json` arm, `<scriptsDir>/remote-run.sh` arm) | A pushed plumbing commit | The row itself names plumbing and a push. `harness-run.yml` → `Check out the run's branch` checks out what the branch carries, and `Refuse a branch that changed the job's own files` judges it. |
| JS4 (`.npmrc` arm, `node_modules/` arm) | A pushed plumbing commit | The same checkout. Plumbing ignores `.gitignore`, so `node_modules/` can be committed. The marker prints a fixed line on stderr, so presence is read from the step logs the row names. |
| SB2 — the second link, inside `clarifications/<branch>/` | A pushed plumbing commit (mode `120000`), pointing at a token file committed outside the state directory | The job places a clarification directory only from a previous bundle (`cli/templates/scripts/lib/harness-run-lib.sh` → THE FORMAT OF RECORD), and a first job has none. |
| SB2 — `PAUSE_PROGRESS.md` replaced by a link | **None. A hand step.** | On a `resume none` launch the job moves a carried `PAUSE_PROGRESS.md` aside before the session (`cli/templates/scripts/autonomous-watcher.sh` header → *"THE PAUSE NOTE belongs to the run that wrote it"*; `run_job` tests `[ -f "$state_abs/$HR_REMOTE_PAUSE_FILE" ]`, then calls `hr_remote_move_aside` into `autonomous_logs/remote_superseded/`, which the bundle's format of record does not carry). **This assumes the row's own link target, a token file, which is a regular file:** `-f` follows the link, so the link is moved aside and never reaches `Save the state bundle`. A dangling link, or a link to a directory, fails `-f`, is not moved aside, and would reach the save step's `hr_remote_bundle_source_ok`; the row does not plant that shape, and Task 18's prompt names it for the follow-up. The session cannot make a link either: the job's base profile (`cli/templates/claude/settings.autonomous.json` → `permissions.allow`, `"defaultMode": "dontAsk"`) allows no `ln`, and the file tools write regular files. |
| SB2 variant — `autonomous_logs/remote_status.json` linked | **None. A hand step.** | The watcher writes `remote_status.json` *"once more when the run leaves `running` for good"* (`autonomous-watcher.sh` header → *"IT WRITES `remote_status.json`"*) through `hr_remote_status_write`, whose `mv` replaces whatever is at the path (*"The temp file sits beside <out_json> so the `mv` is a same-filesystem rename"*). The session cannot make a link, as above. |
| SB3 — the session's uncommitted `stateDir` rewrite | **None. A hand step.** | `harness.config.json` is a write-protected path in the job's base profile (`cli/src/generators/writeProtection.ts` → `protectedPaths`, the `CONFIG_FILENAME` entry). A committed rewrite is a job surface (`jobSurfacePaths`), which `Refuse a branch that changed the job's own files` refuses. |
| SB4 — the bundle half | No plant of its own: route `reads-SB2` in `G12_ROWS` (Task 1), arms `-` | It reads SB2's planted job's `harness-state` artifact. `plant` never plants it and `grade` never prints it as a hand row; the gate's *Taken by* shows `grade (SB2's run)`. The optional half (a throwaway upload workflow, and a background process) stays a hand step, as the row itself says. |
| RJ2 | A pushed plumbing commit of `.claude/settings.autonomous.json` with `sandbox.enabled: false` and no opt-out marker | The round lists it. **Settled from the source:** that file is itself a job surface — `protectedPaths` carries `join(repoRoot, PROFILE_PATH)` and `jobSurfacePaths` keeps every checkout-relative entry (`cli/src/generators/writeProtection.ts`) — so `Refuse a branch that changed the job's own files` refuses the branch before the launch check. The plant records that refusal as the round sees it, and the grade prints `not run` with that evidence. RJ2's launch-check clause has no route, and joins the follow-up prompt (Task 18). |
| JS3 — the lowered `STALL_WARN_SECS` / `STALL_KILL_SECS` | Repository variables, set by `gh variable set` for the dispatch and restored afterwards | `harness-run.yml`'s `run` job `env:` carries `STALL_WARN_SECS: ${{ vars.STALL_WARN_SECS }}` and `STALL_KILL_SECS: ${{ vars.STALL_KILL_SECS }}`, and its header → `WHAT IT READS` names *"the watcher tunables listed in the `run` job's `env:` under their own names"*. The GitHub default branch reaches the job as `HARNESS_GITHUB_DEFAULT_BRANCH: ${{ github.event.repository.default_branch }}`, fixed at dispatch. |
| JS3N — a job surface committed by the session before the stall | **None. A hand step.** | Every job surface is a write-protected path in the session, by construction: `jobSurfacePaths` is derived from `placeholderProtectedPaths` (`writeProtection.ts`). So the session cannot change one in order to commit it, and a pushed one is JS1's refusal. |
| RJ3, and the three `sandbox1h` checks | Hand steps, as the prompt fixes | — |

The five unroutable cases are SB2's `PAUSE_PROGRESS.md` arm, SB2's `remote_status.json` variant, SB3, JS3N and RJ2's launch-check clause. The first four stay hand steps; RJ2 is still planted, to record its refusal. The gate says why (Task 16). Together they become one follow-up task prompt (Task 18).

**JS3's evidence is the step log's watcher lines, not the doctor report.** `check_stalled_runs` runs `stall_job_surfaces_ok >>"$log_path" 2>&1`, so the `doctor --job-surfaces` report lands in the per-branch run log (the bundle's `run.log`). Only the watcher's `log` lines reach the `Run the harness` step log: `-> reset to the last commit and resume (restart #<n>)` or `-> failed (…)`. Task 7 grades on those and prints the *"from a temporary directory"* clause as a `source` line; Task 13 keeps the report out of its canned step log.

**Ship order.** The script tasks (`general`, under `scripts/`) come first. The tests (`cli`, under `cli/test/`) follow, because each one drives a script task that must already exist. The documentation, and the follow-up task prompt, are the catch-all tasks that close the branch. Task 17 is a `cli` test of Task 16's restated table, so it sits between them.

**The constraints every task carries:**
- No profile, generator, wrapper, guard, watcher or `harness-run.yml` behaviour changes, and nothing under `cli/templates/` changes. A defect an implementer notices is named in its return as a candidate follow-up task prompt, never fixed here.
- The Gate 12 repository is never deleted. The script deletes only the branches its state file records.
- No recursive removal is shelled out (`.claude/context/conventions.md` → `## Shell assets`).

**Top risks:**
- **Grading the wrong evidence.** The likeliest failure is a grader that reads something other than the row's **Read from**: a log line spelled differently from the shipped source, a skipped step read as a pass, or a step's `success` read as the run's (`Run the harness` concludes `success` even on a `failed` run, because `run_job` ends `echo "job: $final $decision"` then `exit 0`, so FR3 is graded on that line, Task 8). Tasks 6–8 take every string from the cited `remote-run.sh` / `autonomous-watcher.sh` source and treat a step `gh` reports as skipped or absent as `not run`. Tasks 13–14 hold them to that with a stub.
- **The default-branch leg leaves the repository switched.** The default-branch leg changes the repository's GitHub default branch and two repository variables. Task 5 restores both from a trap on every exit path, interrupt included, and Task 12 proves it on success, on a failed `gh` call and on a signal.
- **A teardown that deletes something it did not create.** Task 9 deletes only what the state file records, and Task 15 asserts that a branch it did not record survives.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else, such as sub-step bullets inside a per-task file, are informational only. They are never the iteration source, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/feat_gate12_sandbox_round_driver/task_<K>_plan.md`.

1. [x] **Task 1** — Add the entry point and `core.sh`: the row table, `--list`, the result line and the exit accumulator _(layer: general)_ _(points: 20)_
2. [ ] **Task 2** — Add `preflight.sh` and `state.sh`: the refusals, the Gate 12 configuration read and the atomic state file _(layer: general)_ _(points: 20)_
3. [ ] **Task 3** — Add `plant.sh`: the plumbing branch builder, the dispatch, the run-ID lookup and the `plant` subcommand _(layer: general)_ _(points: 20)_
4. [ ] **Task 4** — Add `plants.sh`: what each adversarial branch carries, for JS1, JS4, SB2 and RJ2 _(layer: general)_ _(points: 15)_
5. [ ] **Task 5** — Add `default-branch.sh`: round step 8 for JS3, restoring the default branch and the stall variables on every exit path _(layer: general)_ _(points: 20)_
6. [ ] **Task 6** — Add `runs.sh` and `grade-plant.sh`: the run readers, the expiry rule, and the JS1, JS4 and RJ2 grades _(layer: general)_ _(points: 20)_
7. [ ] **Task 7** — Add `grade-state.sh`: the SB2, SB4 and JS3 grades and the hand-step rows _(layer: general)_ _(points: 15)_
8. [ ] **Task 8** — Add `grade-full-run.sh`: FR1–FR7 from the full run's branch, with `source` lines _(layer: general)_ _(points: 20)_
9. [ ] **Task 9** — Add `teardown.sh`: delete the recorded branches and confirm the default branch _(layer: general)_ _(points: 10)_
10. [ ] **Task 10** — Test the entry point, the row table and the preflight refusals, with a shared Gate 12 fixture helper _(layer: cli)_ _(points: 15)_
11. [ ] **Task 11** — Test `plant`: the plumbing branches, the dispatch and the state file _(layer: cli)_ _(points: 20)_
12. [ ] **Task 12** — Test `default-branch`: the restore on success, on failure and on a signal _(layer: cli)_ _(points: 20)_
13. [ ] **Task 13** — Test the adversarial grades: pass, fail, `not run`, `expired` and the hand rows _(layer: cli)_ _(points: 20)_
14. [ ] **Task 14** — Test the full-run grade: FR1–FR7 and their `source` lines _(layer: cli)_ _(points: 15)_
15. [ ] **Task 15** — Test `teardown`: only recorded branches, and the default-branch confirmation _(layer: cli)_ _(points: 10)_
16. [ ] **Task 16** — Give round steps 6, 7 and 8 and observation (xvi) the script's commands, and say why each hand step stays _(layer: general)_ _(points: 20)_
17. [ ] **Task 17** — Test that the gate's restated row table matches `--list` _(layer: cli)_ _(points: 10)_
18. [ ] **Task 18** — Write the follow-up task prompt for the rows with no route _(layer: general)_ _(points: 8)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Round steps 6, 7 and 8, and observation (xvi), give the script's commands beside the hand steps they replace. A hand step stays where the script cannot take its row."*

**Derivation entry 1 — corpus files (command).** Re-run verbatim from the repository root:

`git grep -n -E 'sandbox series round|The full-run leg: one task through|Gate 12 sandbox round' -- 'docs/*.md' '*.md' ':!harness-runs' ':!examples'`

**Derivation entry 2 — rows of the standing `## 10.` matrix (procedure).**
- **Artifact:** `docs/sandbox-verification.md` → `## 10. The full-run leg and the Gate 12 sandbox round`, the table under **Reading a result.**
- **Traversal:** its body rows, in file order, by their `#` cell.
- **Decision rule:** every row is reached, because the script grades or names each one.

**Derivation entry 3 — the new artifact (procedure).**
- **Artifact:** this plan's own `### Targets` lists.
- **Traversal:** each per-task file in readiness order.
- **Decision rule:** a target that is durable corpus text is reached. That is Task 16's and Task 18's targets; the `scripts/` and `cli/test/` targets are source.

**Closure invariant:** every site any derivation entry reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/development.md` → **The sandbox series round (#170 step 4) — not yet run.**, steps 6, 7 and 8 | — | entry 1, `sandbox series round` | `change` | Task 16 |
| 2 | `docs/development.md` → **(xvi) The full-run leg: one task through `harness-run.yml`, end to end.** | — | entry 1, `The full-run leg: one task through` | `change` | Task 16 |
| 3 | `docs/development.md` → **The two wrappers keep their hand-set lines.** (*"step 4 of Gate 12's **The sandbox series round…**"*) | — | entry 1, `sandbox series round` | `no-change` | It cites round step 4, which the script does not take |
| 4 | `docs/development.md` → (xvi)'s **Where its results go.** | — | entry 1, `Gate 12 sandbox round` | `no-change` | Results still go to `## 10.`'s cells, and no result is taken here |
| 5 | `docs/development.md` → **The GitHub-hosted runner legs, in the Gate 12 repository.** | — | entry 1, `sandbox series round` | `no-change` | Round step 5, Gate 15's probe, not this script's |
| 6 | `docs/cli.md` → the `<stateDir>/README.md` row of the re-run table | — | entry 1, `sandbox series round` | `no-change` | `sandbox1h` §2, round step 4, a hand step |
| 7 | `docs/cli.md` → the `.gitignore` row of the re-run table | — | entry 1, `sandbox series round` | `no-change` | `sandbox1h` §2, round step 4 |
| 8 | `docs/cli.md` → *"An adopter's forced run at a published `<version>`"* | — | entry 1, `sandbox series round` | `no-change` | `sandbox1h` §1, round step 4 |
| 9 | `docs/cli.md` → *"a throwaway workflow on the same runner image uploading a directory holding a link"* | — | entry 1, `sandbox series round` | `no-change` | SB4's optional half, which stays a hand step and is still *not yet measured* |
| 10 | `docs/outer-loop-verification.md` → **On a published release, against a real daemon.** | — | entry 1, `sandbox series round` | `no-change` | `sandbox1h` §3, step 9, a hand step |
| 11 | `docs/outer-loop-verification.md` → the macOS row *"step 9 of the sandbox series round"* | — | entry 1 | `no-change` | Step 9, a hand step |
| 12 | `docs/outer-loop-verification.md` → the Linux row *"step 9 of the sandbox series round"* | — | entry 1 | `no-change` | Step 9, a hand step |
| 13 | `docs/remote-execution.md` → *"The design rests on these GitHub behaviours"* | — | entry 1, `Gate 12 sandbox round` | `no-change` | A record that points at the observation, with nothing measured |
| 14 | `docs/remote-execution.md` → the row *"A real `run` job, under the base profile passed unchanged as `--settings`"* | — | entry 1 | `no-change` | FR1 stays *not yet measured* |
| 15 | `docs/remote-execution.md` → the row *"A branch whose profile fails `run_profile_check`"* | — | entry 1 | `no-change` | RJ2 stays *not yet measured*. The refusal before launch is settled from the source; the gate states it (Task 16) and the follow-up prompt carries it (Task 18), not a record |
| 16 | `docs/remote-execution.md` → the row *"A local `remote-run.sh start <branch>`, then `review`, from a mirror"* | — | entry 1 | `no-change` | RJ3, a hand step |
| 17 | `docs/remote-execution.md` → **The step has not yet run on GitHub.** | — | entry 1 | `no-change` | FR2 stays unmeasured |
| 18 | `docs/remote-execution.md` → **The post-session steps on a job that passed.** | — | entry 1 | `no-change` | A record. Nothing measured |
| 19 | `docs/remote-execution.md` → *"It is taken, still not yet run, in Gate 12's **The sandbox series round (#170 step 4)**"* | — | entry 1 | `no-change` | It still is not run |
| 20 | `docs/sandbox-verification.md` → **Since then.** | — | entry 1, `Gate 12 sandbox round` | `no-change` | It names §10 and records nothing new |
| 21 | `docs/sandbox-verification.md` → `## 9.`'s **What this section is.** | — | entry 1 | `no-change` | Gate 15's probe |
| 22 | `docs/sandbox-verification.md` → `## 10.` heading and **What this section is.** | — | entry 1 | `no-change` | The rows are the contract, and the prompt keeps them *not yet measured* |
| 23 | `docs/sandbox-verification.md` §10 row FR1 | — | entry 2 | `no-change` | The contract the grade reads. It stays *not yet measured* |
| 24 | §10 row FR2 | — | entry 2 | `no-change` | As row 23 |
| 25 | §10 row FR3 | — | entry 2 | `no-change` | As row 23 |
| 26 | §10 row FR4 | — | entry 2 | `no-change` | As row 23 |
| 27 | §10 row FR5 | — | entry 2 | `no-change` | As row 23 |
| 28 | §10 row FR6 | — | entry 2 | `no-change` | As row 23 |
| 29 | §10 row FR7 | — | entry 2 | `no-change` | As row 23 |
| 30 | §10 row JS1 | — | entry 2 | `no-change` | As row 23 |
| 31 | §10 row JS3 | — | entry 2 | `no-change` | As row 23 |
| 32 | §10 row JS3N | — | entry 2 | `no-change` | A hand step. The gate states why (Task 16) |
| 33 | §10 row JS4 | — | entry 2 | `no-change` | As row 23 |
| 34 | §10 row SB2 | — | entry 2 | `no-change` | Partly a hand step. The gate states why (Task 16) |
| 35 | §10 row SB3 | — | entry 2 | `no-change` | A hand step. The gate states why (Task 16) |
| 36 | §10 row SB4 | — | entry 2 | `no-change` | As row 23 |
| 37 | §10 row RJ2 | — | entry 2 | `no-change` | As row 23 |
| 38 | §10 row RJ3 | — | entry 2 | `no-change` | A hand step |
| 39 | `harness-runs/task_prompts/chore_gate12_unroutable_sandbox_rows_task_prompt.md` (new) | — | entry 3 | `change` | Task 18 |
