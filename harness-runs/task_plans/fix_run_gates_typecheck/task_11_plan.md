### Task 11 — `docs/config.md`, `docs/watcher.md` and `docs/cli.md` describe the two-gate wrapper

**Goal:** Make the three adopter-facing reference documents at the root say that the Run gates wrapper runs `commands.typecheck` over the whole tree as well as `commands.test` once per round. A `<none>` typecheck is recorded not run and never fails a round, and an already-wired repository picks up the changed wrapper through `init --force`.

**Depends on:** Task 1, which fixes the behaviour described:

- `run-test-suite.sh <label>` runs `commands.typecheck` (no path argument) and then `commands.test`, each exactly once, and the test runs even when the typecheck failed;
- it prints one line, `pass` (both passed, or a `<none>` typecheck not run and the test passed) or `fail <log path>`, and the log under `<state_dir>/test_run_logs/` holds one marked section per gate;
- `commands.typecheck` unset → exit 2 with `run-test-suite.sh: commands.typecheck is not set in harness.config.json`.

Also depends on Task 3, which states the same thing in the template READMEs. The wording here must agree with it. **This is the catch-all task:** it documents what the `cli` and `plugin` tasks built, so it ships after them. Its implementer reads every configured layer's conventions document: `.claude/context/conventions.md`, `.claude/context/cli.md` and `.claude/context/plugin.md`.

### Targets

- `docs/config.md`: §5's `commands.typecheck` and `commands.test` rows.
- `docs/watcher.md`: the script table's `run-test-suite.sh` row.
- `docs/cli.md`: the agent-invocable paragraph's `run-test-suite.sh` clause ("to run `commands.test` and read back only `pass` or `fail <log path>`").

**Work:**

- [ ] `docs/config.md` → `commands.test`: replace "The flow runs it once per Run gates phase, through `run-test-suite.sh`, and never per implemented unit; `commands.typecheck` still runs per unit." with: the flow runs it once per Run gates round, through `run-test-suite.sh`, after that round's whole-tree `commands.typecheck`, and never per implemented unit. `commands.typecheck` → append: besides running per unit, it runs over the whole tree, with no path argument, in every Run gates round through the same wrapper, and a round passes only when it and `commands.test` both pass. `<none>` is logged as not run and never fails the round. Leave the sentinel text already in the row as it is.
- [ ] `docs/watcher.md` → the `run-test-suite.sh` row: "Runs the configured test command once, writes its full output to a per-round log …" becomes: runs the whole-tree `commands.typecheck` and then `commands.test` once each, writes both outputs to the per-round log under a marker per gate, and prints only `pass` or `fail <log path>`. The "who runs it" and "agent-invocable" cells are unchanged.
- [ ] `docs/cli.md`: in the agent-invocable paragraph, change "to run `commands.test` and read back only `pass` or `fail <log path>`" to "to run `commands.typecheck` over the whole tree and then `commands.test`, and read back only `pass` or `fail <log path>`". In §3's outer-loop row, which already says a shipped fix reaches an already-wired repository only through `--force`, add nothing unless that row no longer says so. It is the update route this change relies on, and the story index cites it.

**Verification:**

- `git grep -nE 'configured test command once|to run .commands\.test. and read back' -- docs` prints nothing.
- The register's derivation command (story index → `## Scope register`), re-run, reaches `docs/config.md`, `docs/watcher.md` and `docs/cli.md`. Read at each hit, none describes the wrapper as running only `commands.test`, and every hit outside these three in `docs/` is a register row marked `no-change`.
- The wording agrees with `cli/templates/scripts/README.md` and `cli/templates/state-dir/test_run_logs/README.md` (Task 3) on what the wrapper runs and on `<none>`.
- Each command an adopter is meant to run that these edits add (for example `init --force`) sits in a fenced block, one command per line, per the lessons ledger's adopter-facing documentation rule. An inline mention that is not an instruction to run is fine.
