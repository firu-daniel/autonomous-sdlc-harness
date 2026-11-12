### Task 16 — Rename in this repository's sandbox-probe and Gate 12 scripts

**Goal:** Make this repository's hand-run probe and Gate 12 round scripts read the config file a fresh `init` writes, `devscene.config.json`, under the `devscene/` default. They look runs up by the titles the workflows now give them (`devscene run <branch>`, `devscene pause …`) and grade the step `Run DevScene`.

**Depends on:** Task 6, which titles runs `devscene <action> <branch>` and names the run step `Run DevScene`. Task 5's run library reads `devscene.config.json`. These scripts drive scratch repositories that a merged CLI's `init` wrote. They are not self-adopted copies, so they change in-run.

**The contract with Task 29.** `cli/test/gate12-sandbox-round-docs.test.mjs` reads `scripts/lib/gate12-sandbox-round/core.sh`'s observation descriptions and the Gate 12 table in `docs/development.md` and holds them equal. The FR3 description in `core.sh` becomes *"commits and pushes through the wrappers, graded on the job: line of the Run DevScene step log and on a wrapper's refusing line, …"*. Only `Run the harness` → `Run DevScene` changes in it. Task 29 writes the same text into the table row. No other description in `core.sh` changes except by a table row.

**Where this task stops.** The suites reading these scripts (`gate12-*`, `gate-round-lib`, `sandbox-probe-*`, `launch-sandboxed-gates`) are Task 26's. The self-adopted `scripts/lib/harness-run-lib.sh` these scripts source is the maintainer's cutover (Task 35). Until then, the driver and the probe run in place would source the old library through their preflights (`g12_preflight`'s and `sp_preflight`'s `lib/harness-run-lib.sh`, resolved from their own location), while this task's checks name `devscene.config.json`. No hand-run round does that in this run. The suites that ran the drivers in place, `helpers/gate12-round.mjs`'s `runRound` / `spawnRound` and `sandbox-probe-job-mode.test.mjs`, run a staged copy beside the template library from Task 26 on. Between this task and Task 26 those suites are red, as `## Context` → *Test files are edited by the task that can run them green* allows.

### Targets

- `scripts/lib/gate12-sandbox-round/core.sh`, `grade-full-run.sh`, `grade-plant.sh`, `grade-state.sh`, `plant.sh`, `preflight.sh`, `runs.sh`, `state.sh`
- `scripts/lib/sandbox-probe/legs-gate-sandbox.sh`, `legs-planted-files.sh`, `legs-refresh.sh`, `legs-refusal.sh`, `legs-settings.sh`, `preflight.sh`, `session.sh`
- `scripts/sandbox-probe-runner.yml`, `scripts/sandbox-absent-path-check.sh`

**Work:**

- [ ] Gate 12, titles and step: apply rows 11 and 12 of `## Context`'s spelling table. `G12_STEP_HARNESS="Run DevScene"` (the variable name stays). Every `--arg t "devscene run $branch"` / `"devscene run $G12_SB2_BRANCH"`. The refusal *"no run titled 'devscene run $branch' after …"*. Every comment naming a title or the step. The FR3 description per the contract above.
- [ ] Gate 12, config: apply rows 1 and 2 to `preflight.sh`, `state.sh` and every other config-file or state-directory mention.
- [ ] Sandbox probe: apply rows 1 and 2 to every leg and to `preflight.sh` and `session.sh`, fixture writes (`> "$…/devscene.config.json"`) and REPRO comments included.
- [ ] `sandbox-probe-runner.yml`: `jq -r '.scriptsDir // "devscene-scripts"' devscene.config.json` (rows 1 and 14) and every other mention. `sandbox-absent-path-check.sh`: apply row 1 to its refusal message.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|Run the harness|harness (run|pause|stop)( [^a-z ]|[^ a-z]| [a-z]+_)|// "scripts"' -- scripts/lib/gate12-sandbox-round scripts/lib/sandbox-probe scripts/sandbox-probe-runner.yml scripts/sandbox-absent-path-check.sh` prints nothing.
- `bash -n` on each changed `.sh` file exits 0.
- `git grep -nF 'line of the Run DevScene step log' -- scripts/lib/gate12-sandbox-round/core.sh` prints the FR3 line.

**Deviations from plan:**
- Evidence downgrade, `bash -n` bullet: a direct `bash -n <changed .sh files>` was refused by the tool layer (don't-ask mode). The claim rests instead on `bash scripts/typecheck.sh` (the configured `commands.typecheck`), whose step `scripts/check-shell-parse.sh` parses every `git ls-files` `*.sh` with `/bin/bash`; it printed `check-shell-parse: 124 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed` and `PASS: typecheck`. That set includes all 15 changed `.sh` targets.
- Row 12 was applied by judgement to two title mentions the verification grep does not match, `runs.sh`'s header (`` `harness run` run `` → `` `devscene run` run ``) and `grade-full-run.sh`'s `not run` message (`no devscene run $branch run on $branch`). Both name a run title. The kept names `harness-state`, `harness-docs`, the `harness-gates` `mktemp` stems, `harness-marketplace` and the repository `harness-gate12` were left unchanged.
