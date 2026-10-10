### Task 12 — Bring the repository's own copies of the wrapper and the state-directory READMEs in line with their templates

**Goal:** This repository has adopted its own harness. Its `scripts/run-test-suite.sh` is the `init`-written copy of `cli/templates/scripts/run-test-suite.sh`, and its `harness-runs/test_run_logs/README.md` is the `init`-written copy of `cli/templates/state-dir/test_run_logs/README.md`. Both are byte-identical to their templates at v0.6.6. Replace each with its template's new bytes (Task 1's wrapper and Task 3's README), so this repository's own Run gates rounds run the two-gate wrapper and this repository's own log-directory contract, which `test-fix-plan-writer` reads, describes it. That is what an adopter gets from `init --force` for these files. Its `harness-runs/README.md` is the `init`-written copy of `cli/templates/state-dir/README-root.md`, but an older, drifted one (its `scratch/` clause lacks the template's "with the directories the branch commands' GitHub route fetches …" text). For that file, apply Task 3's one replacement clause only, so its `test_run_logs/` sentence agrees with the template's, and leave its existing drift alone.

**Depends on:** Task 1 and Task 3.

- **Task 1** produces the wrapper template: one call runs `commands.typecheck` (whole tree) and then `commands.test`, with the same verdict lines, label, `--wait` form and log location as before, and per-gate marker lines in the log. Here `commands.typecheck` is `bash scripts/typecheck.sh` (it runs `npm run build`) and `commands.test` is `bash scripts/test.sh` (it runs `scripts/run-gates.sh`), so this repository's rounds will run the build and then the gates.
- **Task 3** rewrites `cli/templates/state-dir/test_run_logs/README.md` to say each log holds the whole-tree `commands.typecheck` output and then the `commands.test` output, each under a gate marker line. Task 3 also replaces, in `cli/templates/state-dir/README-root.md`, the clause "and the full output of each test-gate run, one log per round, under `<state_dir>/test_run_logs/`" with exactly "and the full output of each Run gates round, the whole-tree type check and then the test suite, one log per round, under `<state_dir>/test_run_logs/`". Task 3 edits the templates only; it touches neither `harness-runs/` copy. This task copies Task 3's results and writes no wording of its own.

**This is a catch-all task** (`scripts/` and `harness-runs/` sit under the `layers[]` row whose `path` is `"."`). It copies Task 3's and Task 1's text and adds none of its own. It ships after every `cli` and `plugin` task.

**What this task does not touch.** `scripts/typecheck.sh` and `scripts/test.sh` are this repository's rendered wrappers ("yours from there on"), and `scripts/run-gates.sh` is hand-written. None of them changes, so `scripts/run-gates.sh` still passes for the same reasons it did. `scripts/lib/harness-run-lib.sh` is **not** refreshed. It is an older copy that differs from the template, at least in its header comment and in functions this wrapper never calls. Refreshing it is outside this branch's scope. Task 1 calls no library function the current wrapper does not already call (`hr_repo_root`, `hr_state_dir`, `hr_current_branch`, `hr_sanitize_branch`, `hr_command`), and the repository's copy of `hr_command` already accepts the `typecheck` key (`HR_CFG_COMMAND_KEYS='typecheck test build devServer depInstall'`). `harness-runs/README.md` is **not** overwritten with the template's bytes: its pre-existing drift sits in a clause this branch does not change and is outside this branch's scope. The other `harness-runs/*/README.md` copies are not touched either: `harness-runs/scratch/README.md` and `harness-runs/test_fix_plans/README.md` are register rows 40 and 41, `no-change`.

### Targets

- `scripts/run-test-suite.sh`
- `harness-runs/test_run_logs/README.md`
- `harness-runs/README.md`: the gitignore paragraph's `test_run_logs/` clause only (register row 44).

**Work:**

- [ ] Overwrite `scripts/run-test-suite.sh` with the exact bytes of `cli/templates/scripts/run-test-suite.sh`, keeping its executable mode (`0755`, as `OUTER_LOOP_SCRIPTS` gives it).
- [ ] Overwrite `harness-runs/test_run_logs/README.md` with the exact bytes of `cli/templates/state-dir/test_run_logs/README.md` as Task 3 left it.
- [ ] In `harness-runs/README.md`, replace "and the full output of each test-gate run, one log per round, under `<state_dir>/test_run_logs/`" with exactly the clause Task 3 wrote into the template: "and the full output of each Run gates round, the whole-tree type check and then the test suite, one log per round, under `<state_dir>/test_run_logs/`". Change nothing else in the file.

**Verification:**

- `cmp cli/templates/scripts/run-test-suite.sh scripts/run-test-suite.sh` exits 0 and prints nothing.
- `cmp cli/templates/state-dir/test_run_logs/README.md harness-runs/test_run_logs/README.md` exits 0 and prints nothing.
- `git diff --summary -- scripts/run-test-suite.sh` reports no mode change.
- `git grep -n 'configured test command' -- harness-runs/test_run_logs/README.md` prints no line that describes the wrapper as running only `commands.test`.
- `git grep -n 'test-gate' -- harness-runs/README.md` prints nothing. `git grep -hn 'each Run gates round, the whole-tree type check and then the test suite' -- harness-runs/README.md cli/templates/state-dir/README-root.md` prints the same clause from both files. `git diff -- harness-runs/README.md` touches only that clause.
- Every `hr_` function the copied wrapper calls is defined in the repository's own library: for each function name among the `hr_` words `grep -oE 'hr_[a-z_]+' scripts/run-test-suite.sh` prints (setting aside the script's own variable `hr_lib`), `grep -n '^<name>()' scripts/lib/harness-run-lib.sh` prints a definition. The invariant is that no called function lacks one. `grep -n "HR_CFG_COMMAND_KEYS='typecheck" scripts/lib/harness-run-lib.sh` prints the key set that includes `typecheck`.
