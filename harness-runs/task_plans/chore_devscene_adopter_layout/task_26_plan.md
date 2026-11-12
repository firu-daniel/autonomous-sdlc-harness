### Task 26 — Respell the suites that read the plugin and this repository's scripts, and point four of them at the template run library

**Goal:** Bring the suites that execute plugin shell assets, read plugin prose, or drive this repository's own Gate 12 and probe scripts in line with the renamed names. Stop four of them from copying this checkout's self-adopted run library, which stays at its old bytes until the maintainer's cutover.

**Depends on:**
- Task 10: the guards, the shared library and the QA helpers read `devscene.config.json`, default `stateDir` to `devscene` and `scriptsDir` to `devscene-scripts`.
- Tasks 13 and 14: the plugin prose the corpus guards read.
- Task 16: the Gate 12 and probe scripts carry `devscene.config.json`, the `devscene run <branch>` titles, `G12_STEP_HARNESS="Run DevScene"` and the FR3 text `… line of the Run DevScene step log …`.
- Task 5: the template run library at `cli/templates/scripts/lib/harness-run-lib.sh`.

**Why four suites change their library source.** `cli/test/launch-sandboxed-gates.test.mjs`, `cli/test/gate12-sandbox-round-cli.test.mjs`, `cli/test/sandbox-probe-gate-sandbox-legs.test.mjs` and `cli/test/sandbox-probe-job-launch.test.mjs` copy or source `join(WORKSPACE_ROOT, 'scripts', 'lib', 'harness-run-lib.sh')`. That is this checkout's self-adopted copy, which no task may change in-run (`## Context` → *This repository's own adoption is cut over by the maintainer*). Each now takes `join(WORKSPACE_ROOT, 'cli', 'templates', 'scripts', 'lib', 'harness-run-lib.sh')`, the file the copy is byte-identical to after the cutover. Each file's header or the comment at that line says it reads the template, the copy `init` ships. The same switch applies to any other target suite found copying or sourcing that self-adopted file, including through a fixture that copies this checkout's `scripts/lib/`. It is the one root-level file whose bytes lag the template during this run. No other path in these suites moves to the templates. `scripts/lib/sandbox-probe/` and `scripts/lib/gate12-sandbox-round/` are this repository's own, and Task 16 respells them in place.

**Why the Gate 12 driver and the job-mode probe run from a staged copy.** A suite can reach the self-adopted run library without naming it. Two drivers source it by their own location:
- `scripts/lib/gate12-sandbox-round/preflight.sh` → `g12_preflight`: `lib="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)/lib/harness-run-lib.sh"`.
- `scripts/lib/sandbox-probe/preflight.sh` → `sp_preflight`: `probe_scripts="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"`, then `lib="$probe_scripts/lib/harness-run-lib.sh"`.

Run in place, both source this checkout's `scripts/lib/harness-run-lib.sh`, which still reads `harness.config.json` until the cutover. After Task 16, `g12_preflight`'s own check is for `devscene.config.json`, and after this task the fixtures write only that file. The old library's `hr_state_dir` / `hr_scripts_dir` / `hr_default_branch` then find no config, and preflight refuses. Two places run a driver in place against such a fixture:
- `cli/test/helpers/gate12-round.mjs` → `runRound` (its `script = ROUND_SCRIPT` default) and `spawnRound` (`spawn('bash', [ROUND_SCRIPT, …])`), where `ROUND_SCRIPT = join(WORKSPACE_ROOT, 'scripts', 'gate12-sandbox-round.sh')`. Every `gate12-sandbox-round-*` suite that calls them without `script:` is affected. That includes the non-target `-default-branch`, `-plant` and `-teardown` suites, which carry no old name and need no edit of their own.
- `cli/test/sandbox-probe-job-mode.test.mjs` → `IN_PLACE_PROBE = join(WORKSPACE_ROOT, 'scripts', PROBE_FILE)`, run as `preflight --job <fixture>` and `run --job <fixture> …` against a fixture that `init` wrote.

Each now runs a **staged copy** that sits outside the fixture checkout, in the layout the drivers expect: the entry script, its `lib/<driver>/` directory, and `cli/templates/scripts/lib/harness-run-lib.sh` copied to `lib/harness-run-lib.sh` beside them. This is the layout `gate12-sandbox-round-cli.test.mjs` already builds under the `cp(join(WORKSPACE_ROOT, 'scripts', 'gate12-sandbox-round.sh'), script)` line in *"a copy run from inside the script's own repository"*. Two placement constraints follow from the preflights:
- The Gate 12 copy goes under the fixture's `root`, beside `dir` and never inside it. `g12_preflight` refuses a `G12_ROOT` carrying `scripts/lib/gate12-sandbox-round/core.sh`, and `G12_SCRIPT_ROOT` must not equal the fixture's top level.
- The probe copy must sit inside a git repository of its own. `sp__preflight_job_main` resolves `hr_repo_root "$probe_scripts"` and refuses when that is empty or equal to the measured checkout. So it is a throwaway `git init` directory under the case's temp directory, never the fixture.

Suites that never reach a preflight keep running in place: `gate12-sandbox-round-docs.test.mjs`'s `ROUND_SCRIPT --list` (the driver's `--list` arm exits before `g12_need g12_preflight`), and `sandbox-probe-git-and-legs.test.mjs`'s `--list`, `print-parity-script` and usage-error cases.

**Where this task stops.** `cli/test/gate12-sandbox-round-docs.test.mjs` compares `core.sh`'s descriptions with `docs/development.md`'s Gate 12 table. It is no task's target. It goes green when Task 29 writes the matching row, and Phase G runs it.

### Targets

- `cli/test/qa-user-locks.test.mjs`, `cli/test/path-anchored-arms.test.mjs`, `cli/test/main-repo-resolution-corpus.test.mjs`, `cli/test/untrusted-input-corpus.test.mjs`
- `cli/test/gate-round-lib.test.mjs`, `cli/test/gate12-sandbox-round-cli.test.mjs`, `cli/test/gate12-sandbox-round-full-run.test.mjs`, `cli/test/gate12-sandbox-round-grade.test.mjs`, `cli/test/helpers/gate12-round.mjs`
- `cli/test/launch-sandboxed-gates.test.mjs`, `cli/test/sandbox-prerequisites-shell-mirror.test.mjs`
- `cli/test/sandbox-probe-gate-sandbox-legs.test.mjs`, `cli/test/sandbox-probe-git-and-legs.test.mjs`, `cli/test/sandbox-probe-job-mode.test.mjs`, `cli/test/sandbox-probe-remote-legs.test.mjs`, `cli/test/sandbox-probe-shell.test.mjs`, `cli/test/sandbox-probe-job-launch.test.mjs`

**Work:**

- [ ] The four suites above: switch their run-library source to the template path, with the comment as stated.
- [ ] `qa-user-locks.test.mjs`, `path-anchored-arms.test.mjs`: every fixture writes and `git add`s `devscene.config.json`, and every `stateDir` literal is respelled (rows 1 and 2 of `## Context`'s spelling table). `main-repo-resolution-corpus.test.mjs`, `untrusted-input-corpus.test.mjs`: respell the header sentence that names the `treeGuards` entry's file (row 1).
- [ ] `helpers/gate12-round.mjs`: the fixture map key `'devscene.config.json'`, `stateDir = 'devscene'` and the run-title literal (rows 1, 2 and 12). The three `gate12-sandbox-round-*` suites: rows 1, 2, 11 and 12. That covers `harness: 'Run DevScene'` (the key stays), the FR3 test titles *"… whose Run DevScene succeeded …"*, and every `devscene run …` title.
- [ ] `gate-round-lib.test.mjs`, `launch-sandboxed-gates.test.mjs`, `sandbox-prerequisites-shell-mirror.test.mjs` and the six `sandbox-probe-*` suites: rows 1–3. `sandbox-probe-git-and-legs.test.mjs`'s `SP_STATE_DIR=devscene` is included.
- [ ] Stage the drivers outside the fixture, per *Why the Gate 12 driver and the job-mode probe run from a staged copy* above.
  - `helpers/gate12-round.mjs`: `makeGate12Fixture` builds the Gate 12 copy under the fixture's `root`, beside `dir`: `gate12-sandbox-round.sh`, `lib/gate12-sandbox-round/` and the template run library as `lib/harness-run-lib.sh`. It exposes the copy's entry as a new `roundScript` property, added to the `Gate12Fixture` typedef. `runRound`'s `script` default and `spawnRound`'s launched script become `fixture.roundScript`. `ROUND_SCRIPT` stays exported as the in-place source path, and its doc comment says it is run directly only for arms that exit before preflight (`--list`, `--help`). `cleanup` already removes `root`, so it removes the copy too.
  - `sandbox-probe-job-mode.test.mjs`: `IN_PLACE_PROBE` becomes a staged probe, built once per case under the case's temp directory in a throwaway `git init` repository: `sandbox-probe.sh`, `lib/sandbox-probe/` and the template run library as `lib/harness-run-lib.sh`. Rename the constant to say what it now is. Rewrite the header sentence *"the probe runs **in place** from `WORKSPACE_ROOT/scripts/sandbox-probe.sh`"* to describe the staged copy and say why: the in-place copy sources this checkout's self-adopted run library. The `withProbe` case, which commits a probe copy inside a fixture that `init` wrote, keeps its shape.
  - Any other target suite found running `scripts/gate12-sandbox-round.sh` or `scripts/sandbox-probe.sh` in place past preflight, against a fixture carrying `devscene.config.json`, takes the same staging.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-scripts|Run the harness|harness (run|pause|stop)( [^a-z ]|[^ a-z]| [a-z]+_)' --` followed by this task's seventeen target paths prints nothing.
- `git grep -nE "WORKSPACE_ROOT, 'scripts', 'lib', 'harness-run-lib\.sh'" -- cli/test` prints nothing.
- No target suite runs the Gate 12 driver or the probe in place against a renamed-config fixture:
  - `git grep -nE 'ROUND_SCRIPT|IN_PLACE_PROBE' -- cli/test` prints only three kinds of line: the `ROUND_SCRIPT` declaration and its doc comment in `helpers/gate12-round.mjs`, the `--list` call and its import in `gate12-sandbox-round-docs.test.mjs`, and `ROUND_SCRIPT` as a copy source. No line is a `script = ROUND_SCRIPT` default, a `spawn('bash', [ROUND_SCRIPT` launch, or an `IN_PLACE_PROBE` probe call.
  - `git grep -nE "join\(WORKSPACE_ROOT, 'scripts', '(gate12-sandbox-round|sandbox-probe)\.sh'\)" -- cli/test` prints only copy sources, `--list` / `--help` / `print-parity-script` / usage-error callers, and `sandbox-probe-git-and-legs.test.mjs`'s `PROBE` and `sandbox-probe-judge.test.mjs`'s `PROBE`, whose cases end before `sp_preflight`. Each printed line is checked against that rule by reading it.
- Each target test file passes through `npm test --workspace cli -- test/<name>.test.mjs`, from the repository root, one plain foreground command per file. `helpers/gate12-round.mjs` is exercised by the Gate 12 suites.

**Deviations from plan:**
- `launch-sandboxed-gates.test.mjs`: the fixture config omitted `scriptsDir` while the suite places its scripts under `scripts`; with `DEFAULTS.scriptsDir` now `devscene-scripts` (story `## Context` → *Goal 2*), every fixture case failed `ENOENT … scripts/lib/harness-run-lib.sh`. Set `scriptsDir: SCRIPTS` explicitly in the fixture config; the suite then passed 21/21.
- `gate12-sandbox-round-full-run.test.mjs` fails 17 of 21 for a producer defect outside the `cli` layer: Task 16 respelled `scripts/lib/gate12-sandbox-round/grade-full-run.sh` → `g12_full_run_jobs`'s `--arg t "harness run $branch"` as `"devscene run$branch"` (the space dropped), and `grade-state.sh`'s SB2 next-job lookup (`--arg t "devscene run$G12_SB2_BRANCH"`, and its `not run` evidence string) the same way, while `plant.sh` keeps `"devscene run $branch"`. Evidence: FR1 evidence `no devscene rungate12_full_run_20261104000000 run on gate12_full_run_20261104000000`. The suite's own fixture titles (`devscene run ${B}`) are row 12's spelling and stay. Needs a `general`-layer fix to those two scripts (and the `devscene run<branch>` comments in `grade-full-run.sh` and `grade-state.sh`); not run green in this unit.
- Not run: the non-target `gate12-sandbox-round-default-branch`, `-plant` and `-teardown` suites, which exercise `helpers/gate12-round.mjs`'s staged driver; the unit runs only its own edited files and selected tree guards. Verified by the Run gates phase.
