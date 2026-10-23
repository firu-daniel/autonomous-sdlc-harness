### Task 3 — Correct the run form's description in `cli/templates/scripts/README.md`

**Goal:** Stop telling an adopter that the Run gates wrapper "prints only `pass` or `fail <log path>`". Its run form now starts the gates detached from the calling session and prints `pending`, and its `--wait <label>` form prints the verdict.

**Depends on:** Task 1, which makes the run form start the gates as a detached worker and print `pending` (exit 3). It also collects an in-flight run of the same label rather than starting a second. The wait form `--wait <label>` prints `pass` or `fail <log path>` once the run has finished, and `pending` before. This task describes that contract and changes nothing in the script.

### Targets

- `cli/templates/scripts/README.md`: the sentence beginning *"`run-test-suite.sh` is run once per Run gates phase"*.

**Work:**

- [ ] Rewrite that one sentence. Keep what is still true: once per Run gates round, the whole-tree `commands.typecheck` then `commands.test`, and their output to a per-round log under `<state_dir>/test_run_logs/`. State the two forms: the run form starts both gates detached from the calling session and prints `pending`, and `--wait <label>`, re-issued after each `pending`, prints `pass` or `fail <log path>`. Name no Claude Code time limit and no duration. Leave the rest of the paragraph, including the `docs-search-server.sh` sentence after it, byte-identical.

**Verification:**

- `grep -n "prints only \`pass\` or \`fail" cli/templates/scripts/README.md` prints nothing.
- `git diff --stat -- cli/templates/scripts/README.md` shows one file and only the one-sentence edit.
- No copy of this README needs bringing level: `init` writes no `README.md` into `scriptsDir` (no generator under `cli/src/generators/` enqueues it), and `ls scripts` in this checkout lists none.
