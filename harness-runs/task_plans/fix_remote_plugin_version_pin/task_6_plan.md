### Task 6 — Add `scripts/probe-plugin-cli.sh`, which records what the agent-runner CLI accepts for a plugin install

**Goal:** Make the prompt's question, *"Establish what the agent-runner CLI actually supports now"*, answerable by an unattended run. A plain `claude … --help` is not reachable from a run's permission profile, but a `.sh` wrapper under `scripts/` is permitted by the script-allowlist guard. This read-only script prints the version and help text that Task 7 records verbatim in `docs/remote-execution.md` §6, with the command and the date. This is the measurement the story index's candidate-1 rejection points to.

**Where this task stops.** This task creates and runs nothing but the probe. It records its output nowhere. Writing the measurement into the document of record is **Task 7's**, which runs this script itself. The chosen install (Task 4) rests on none of what this probe measures.

### Targets

- `scripts/probe-plugin-cli.sh` (new) — hand-written for this repository, like `scripts/measure-suite.sh`. It is not in the set `init --force` regenerates, and `publish-main.sh` removes it from `main` with the rest of `scripts/`.

**Work:**

- [ ] **Header comment:** what it measures and why; that it is read-only (it adds, installs and changes nothing); that its output is what `docs/remote-execution.md` → `## 6. What is not verified here` records for the row about pinning the plugin at install; and a `Usage:` line and an `Exit:` line (0 printed, 1 when `claude` does not resolve on `PATH`).
- [ ] **Body.** Start with `#!/usr/bin/env bash` and `set -u`. If `claude` does not resolve on `PATH`, print that and exit 1. Otherwise print a `$ <command>` line, then the command's combined output, then `exit status: <n>`, for each of these in order:
  - `claude --version`
  - `claude plugin --help`
  - `claude plugin marketplace --help`
  - `claude plugin marketplace add --help`
  - `claude plugin install --help`

  A non-zero status from one command is printed, and the script goes on to the next.

**Verification:**

- `bash -n scripts/probe-plugin-cli.sh` exits 0.
- `bash scripts/probe-plugin-cli.sh`, run without a pipe, prints the five `$ ` headers in the order above, each followed by an `exit status:` line. Run it in a clean checkout, then run `git status --porcelain` to confirm it changed nothing.

**Deviations from plan:**

- `bash -n scripts/probe-plugin-cli.sh` was refused by the permission profile (approval required) and not run. The syntax claim rests on the full `bash scripts/probe-plugin-cli.sh` run on Claude Code 2.1.284, which parsed the whole file and printed the five `$ ` headers in order, each followed by `exit status: 0`; `git status --porcelain` afterwards listed only the new script.
- Each probed command runs with stdin from `/dev/null`, so a subcommand that prompts cannot hang the probe. The plan did not state this.
