### Task 21 — Exclude `test_run_logs` from gate 6a in `scripts/run-gates.sh` and `docs/development.md`

**Goal:** Stop this repository's self-containment gate from failing on the Run gates phase's own logs. Gate 6a greps the working tree for the running user's `$HOME`. The wrapper writes each gate run's full output, machine paths included, to `harness-runs/test_run_logs/<branch>/<label>.log` inside the checkout, and it is writing the current round's log while 6a runs. Without the exclusion, a failing gate would be followed by a 6a failure the branch cannot fix, and every later round would fail the same way.

**Depends on:** Task 3 and Task 20. Task 3 names the directory `test_run_logs`, which is machine-local and gitignored by its contents. Task 20 creates it in this repository, with its README, and adds the ignore rule. The directory name is fixed. `--exclude-dir` matches a directory's base name on both GNU and BSD grep, which is why the exclusion can name `test_run_logs` rather than a path.

### Targets

- `scripts/run-gates.sh` → `machine_path_hits`.
- `docs/development.md` → gate 6's quoted 6a command, `grep -rn "$HOME" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git | grep -v '^\./\.git:[0-9][0-9]*:'`, and its explanation.

**Work:**

- [ ] `run-gates.sh`: add `--exclude-dir=test_run_logs` to the first `grep` in `machine_path_hits`. Add one line to the comment above it: the Run gates phase's logs carry machine paths by construction, are gitignored, and include the log of the run in progress.
- [ ] `docs/development.md`: add the same flag to the quoted command. Beside it, add one sentence stating the exclusion and its reason: the logs are machine-local and never committed, the gate exists to stop a machine path reaching a commit, and the log of the current run is written while the gate reads the tree.

**Verification:**

- The quoted command in `docs/development.md` and the first `grep` in `scripts/run-gates.sh` carry the same `--exclude-dir` set. Compare `grep -n "exclude-dir=test_run_logs" scripts/run-gates.sh docs/development.md` against the list in each line.
- Use the `Write` tool to plant `harness-runs/scratch/test_run_logs/probe.log`, holding the running user's home path. That path is gitignored, and its basename is the one the flag matches. Then run `grep -rln "$HOME" harness-runs/scratch --exclude-dir=test_run_logs`. The planted file is not among the paths it prints. Without the flag, the same command prints it. That pair shows the exclusion is what hides it.
- This unit adds no test file. Gate 6a's full effect is exercised by the Run gates phase, not by this unit.
