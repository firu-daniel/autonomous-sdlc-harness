### Task 10 — Correct the `run-test-suite.sh` row of `docs/watcher.md`

**Goal:** `docs/watcher.md`'s scripts table says the Run gates wrapper *"prints only `pass` or `fail <log path>`"*. Its run form now starts the gates detached from the calling session and prints `pending`, and its `--wait <label>` form prints the verdict. Make the row say so.

**Depends on:** Task 1, whose run form starts both gates as a detached worker and prints `pending` (exit 3), or collects an in-flight run of the same label. Its `--wait <label>` form prints `pass` or `fail <log path>` once the run finishes, and `pending` before. Task 3 corrects the same description in `cli/templates/scripts/README.md`. This task touches only `docs/watcher.md`.

### Targets

- `docs/watcher.md`: the `run-test-suite.sh` row of the scripts table, its second cell.

**Work:**

- [ ] Rewrite the row's second cell. Keep what is still true: the whole-tree `commands.typecheck` then `commands.test`, once each, both outputs written to a per-round log under `<state_dir>/test_run_logs/` under a marker line per gate. Replace *"and prints only `pass` or `fail <log path>`"* with the two forms: the run form starts both gates detached from the calling session and prints `pending`, and `--wait <label>`, re-issued after each `pending`, prints `pass` or `fail <log path>`. Leave the third cell (*"the orchestrating session, once per Run gates round"*) and the fourth (**yes**) byte-identical, and name no duration or Claude Code limit.

**Verification:**

- `grep -n 'run-test-suite.sh' docs/watcher.md` shows the row with `pending` and `--wait` in its second cell and its last two cells unchanged.
- `grep -c "prints only \`pass\` or \`fail" docs/watcher.md` prints `0`.
- The table still renders: the edited row has the same number of `|` separators as its neighbours.
