### Task 5 — Add `scripts/measure-suite.sh`: time `npm test` and `run-gates.sh` at any commit, on this host

**Goal:** Ship the step that produces this branch's figures, so the before and after are measured by one re-runnable command rather than by hand, and a later branch (the task prompt names `feat_run_gates_phase`) can re-measure without re-deriving the method. This task delivers the **host** mode; Task 6 adds the core-restricted container mode to the same file.

**Why a script, and why here.** The ledger rule under `## Evidence and measurement` — *"the branch that makes the decision also ships the gate step that produces the real-shape figure"* — binds this branch: its decision is argued from run times, so the thing that measures them ships with it. It is a hand-written file in the root `scripts/` directory beside `scripts/run-gates.sh` and `scripts/check-llms-txt.sh` (the `general` layer), not a template: nothing under `cli/templates/` changes. A `bash scripts/<name>.sh` invocation with plain arguments is also what an unattended run's script-allowlist guard permits, which a hand-typed `git worktree add … && npm ci && …` compound is not.

**Where this task stops.** Host mode only. The `--cpus <n>` option is **parsed and refused** here with exit 2 and the message `measure-suite: --cpus needs the container mode, which Task 6 of chore_test_suite_run_time adds` — Task 6 replaces that refusal with the container path and owns everything about containers. This task does not run the before/after measurement for the record, and edits no document — Task 7 does both.

### Targets

- `scripts/measure-suite.sh` (new).

**Work:**

- [ ] Header, following `scripts/check-llms-txt.sh`'s shape — `#!/usr/bin/env bash`, a `# measure-suite.sh — …` first line, `THE CONTRACT.`, `Usage:` and `Exit:` blocks — then `set -uo pipefail` (no `-e`, `scripts/run-gates.sh`'s reason: every timed run is reported even when one fails). Bash 3.2 must run it (`.claude/context/conventions.md` → `## The stack…`): no associative arrays, no `mapfile`, no `${var,,}`. Resolve the repository root from the script's own location exactly as `run-gates.sh` does.
- [ ] Arguments: `--ref <commit>` (default `HEAD`, resolved once with `git rev-parse --verify --quiet "<ref>^{commit}"` to a full SHA, refused with exit 2 when it does not resolve), `--runs <k>` (default `1`, a positive integer, else exit 2), `--cpus <n>` (refused as above until Task 6). Unknown argument → exit 2 with a usage line.
- [ ] Host mode: create a directory with `mktemp -d` under the system temp directory (never inside this checkout), `git worktree add --detach <that dir>/tree <sha>`, run `npm ci` there **untimed** with its output in a log (exit 1 naming the step and the log's last lines if it fails). Remove the worktree on every exit path with a `trap` running `git worktree remove --force <dir>/tree` then `rmdir <dir>` — git's own removal and a non-recursive `rmdir`, **never a shelled-out recursive removal** (`.claude/context/conventions.md` → `## Shell assets`).
- [ ] The timed runs, inside that worktree: `npm test` `k` times, then `bash scripts/run-gates.sh` `k` times, each with its output to a log file rather than a pipe (`run-gates.sh`'s own reason). Take wall time in milliseconds from `node -e 'process.stdout.write(String(Date.now()))'` before and after each run (bash 3.2 has no sub-second clock and macOS `date` has no `%N`). Print one line per run: `measure-suite: host cpus=<os.availableParallelism()> ref=<12-char sha> <npm-test|run-gates> run <i>/<k>: <seconds, two decimals> s, exit <status>`; after each `run-gates` run also print that run's own closing summary lines (from `run-gates:` to the end of its log) so the failure set can be compared between runs.
- [ ] Preamble and exit: before the first timed run print the host facts the figures depend on — `uname -sm`, `node --version`, `git --version`, and `os.availableParallelism()`. Exit `0` when every timed run completed and was reported **whatever it exited with** — the script measures, and each run's own verdict is on its line — `1` when setup failed and no figure exists, `2` on bad usage.

**Verification:**

- `bash scripts/measure-suite.sh --runs 1` from this worktree prints the preamble, one `npm-test` line and one `run-gates` line with its summary, and exits 0; afterwards `git worktree list` shows no worktree under the temp directory and the directory `mktemp` made is gone.
- `bash scripts/measure-suite.sh --ref not-a-commit`, `--runs 0` and `--cpus 4` each exit 2 with a one-line reason and create no worktree.
- An interrupted run still removes the worktree: start `bash scripts/measure-suite.sh --runs 1` in the background, send its process `SIGINT` with `kill -INT <pid>` while `npm ci` is running, and `git worktree list` afterwards lists only the checkouts that existed before (the trap covers `EXIT`, `INT` and `TERM`).
- `bash -n scripts/measure-suite.sh` exits 0, and `/bin/bash scripts/measure-suite.sh --runs 0` (macOS's bash 3.2) reaches the usage refusal rather than a syntax error.
- `grep -n 'rm -rf\|rm -r ' scripts/measure-suite.sh` prints nothing.
- `bash scripts/run-gates.sh` prints no failure that its run on this branch's previous commit did not print (gates 1a and 11 are out of this branch's scope and are compared, not fixed).

**Deviations from plan:**

- The interrupt check's "while `npm ci` is running" rests on the script's phase, not on a process listing: a `pgrep` taken from the scratch probe before sending `SIGINT` returned nothing. The run had printed the preamble's `ref` line, which comes right before `npm ci`, and no timed-run line. It exited 130 about 4 s after starting, printed `interrupted; removing the worktree`, and left `git worktree list` and the `measure-suite.*` temp directories as they were before.
- The usage line prints only for an unknown argument or a flag with no value. A bad `--ref` or `--runs` value, and `--cpus`, print only their one-line reason, as the verification asks.
