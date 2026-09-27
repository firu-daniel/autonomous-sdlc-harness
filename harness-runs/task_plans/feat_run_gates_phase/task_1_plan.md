### Task 1 — Ship the `run-test-suite.sh` outer-loop script and its `OUTER_LOOP_SCRIPTS` row

**Goal:** Ship the one wrapper the Run gates phase invokes. It runs the configured `commands.test` string once, writes the full output to a per-round log under the run-artifact tree, and prints exactly one line — `pass`, or `fail <log path>` — so the orchestrator reads a verdict and never the gate output. It also leaves that verdict in a file beside the log, and a `--wait <label>` form reads it back, so a caller whose run was moved to the background can collect the verdict without ending its turn.

**Where this layer stops.** This task ships the script and registers it. Task 2 owns its behaviour suite. Task 3 owns the `test_run_logs` directory's README and its ignore rule; the script creates the per-branch subdirectory on its own, so it does not depend on Task 3. Every instruction that invokes the script is a `plugin` task: Tasks 9, 13 and 17. Task 20 copies it into this repository's own `scripts/`.

### Targets

- `cli/templates/scripts/run-test-suite.sh` (new) — the script.
- `cli/src/generators/outerLoopScripts.ts` → `OUTER_LOOP_SCRIPTS` — its row.
- `cli/test/init.test.mjs` → `OUTER_LOOP_SCRIPT_FILES` — the explicit list of outer-loop files.
- `cli/test/outer-loop-scripts.test.mjs` — a case asserting the file lands verbatim and a re-run keeps it.
- `cli/src/retrieval/server.ts` → the module header's count of `tools:` allowlists (comment only).

**The contract this task defines (restated by Tasks 2, 9, 13, 17, 20 and 22):**

- **Invocation.** Two forms, and nothing else:
  - **Run:** `bash <scriptsDir>/run-test-suite.sh <label>`, with exactly one argument. `<label>` must match `^[A-Za-z0-9][A-Za-z0-9._-]*$`. The Run gates phase passes `<gate_key>_round_<gate_round>`, for example `task_round_1` or `review_2_round_3`.
  - **Wait:** `bash <scriptsDir>/run-test-suite.sh --wait <label>`, with exactly two arguments, the same label pattern. This is how a caller whose run the Bash tool moved to the background gets the verdict **inside the same turn** (Task 9's G.1 and Task 17 use it). `--wait` cannot collide with a label, because the pattern forbids a leading `-`.
- **Resolution.**
  - Repository root: taken from the script's own location with `git -C "$script_dir" rev-parse --show-toplevel`, the derivation every outer-loop script uses.
  - Library: sources `lib/harness-run-lib.sh` from its own directory.
  - Command: `commands.test`, read with `hr_command "$root" test`.
  - Run-artifact tree: `hr_state_dir`.
  - Branch: `hr_current_branch`, passed through `hr_sanitize_branch`.
- **Log.** `<stateDir>/test_run_logs/<sanitized branch>/<label>.log`, repo-relative.
  - `mkdir -p` the directory, then truncate the file. A re-run of the same label replaces that round's log, and a different label never touches another round's log. That is the **versioned-per-round** choice the story index `## Context` records.
- **Run.** `eval` the configured string from the repository root, in a subshell with stdin from `/dev/null` and stdout and stderr both redirected into the log. Grade it by exit status only. The script has no `-e`, so it outlives the command's failure; follow `scripts/test.sh`'s `set -uo pipefail`.
- **Verdict and in-flight files (run form).** Beside the log, in the same directory, which Task 3 ignores by its contents and Task 21 excludes from gate 6a:
  - `<label>.running` — written before the command starts, holding the wrapper's own PID (`$$`); removed after the verdict file is in place.
  - `<label>.verdict` — any stale copy removed before the command starts; after the command exits, the verdict line (`pass` or `fail <repo-relative log path>`) written to `<label>.verdict.tmp` and renamed with `mv` onto `<label>.verdict`, so a reader never sees a half-written line.
  - A refusal writes neither file.
- **Output (run form).**
  - Exactly one stdout line: `pass`, with exit 0, or `fail <repo-relative log path>`, with exit 1. It is the same line the verdict file holds.
  - Nothing from the command reaches stdout or stderr.
- **Wait form.** Reads, never writes, and never runs the command:
  - `<label>.verdict` exists → print its line and exit 0 for `pass`, 1 for `fail <log>`.
  - Otherwise, `<label>.running` exists and its PID is alive (`kill -0`) → poll inside the script, re-checking the verdict file, for at most one **wait slice**, then print exactly `pending` and exit 3 if no verdict appeared. If the verdict appears within the slice, print it at once as above.
  - The slice is a named constant in the script, `WAIT_SLICE_SECONDS`, set far inside the Bash tool's default foreground window so the wait call itself is never moved to the background. The environment variable `RUN_TEST_SUITE_WAIT_SLICE` overrides it (Task 2 sets it small). **No caller's correctness depends on the value:** `pending` means only "issue the same call again", so the suite may take any length of time. The header says so.
  - Neither file exists, or `<label>.running` names a PID that is not alive and no verdict was written → refusal `run-test-suite.sh: no run in flight for <label>` (exit 2).
- **Refusals.** Each exits 2, prints one stderr line `run-test-suite.sh: <reason>`, prints nothing on stdout, and writes no log, verdict or in-flight file:
  - an argument list that is neither `<label>` nor `--wait <label>`;
  - no run in flight, in the wait form (above);
  - a label that fails the pattern;
  - an unresolvable configuration;
  - `commands.test` unset;
  - no current branch, for example a detached `HEAD`.

**Work:**

- [ ] `run-test-suite.sh`: write it to the contract above. Model its header, root derivation and library sourcing on `cli/templates/scripts/flow-walker.sh` and `scratch-run.sh`. The header opens with the file's name and what it decides. It states the one-line output contract, the per-round log naming and why it is versioned rather than overwritten, and that the orchestrator never reads the log. It also states the wait form and why it exists: a headless session is torn down when its turn ends (`plugin/instructions/autonomous_pause_and_ledger.md` → §2.5), so a caller whose run was backgrounded must obtain the verdict with repeated foreground `--wait` calls rather than a `Monitor`, a long sleep or an ended turn. Carry no `{{token}}`: the file is copied verbatim.
- [ ] `outerLoopScripts.ts`: add `Object.freeze({ file: 'run-test-suite.sh', mode: 0o755, agentInvocable: true })` after the `flow-walker.sh` row. Its comment says the orchestrating session runs it and that it carries no `DENY_SCRIPT_BASENAMES` entry, because it must be reachable. Name the Run gates phase as its caller.
- [ ] `init.test.mjs` → `OUTER_LOOP_SCRIPT_FILES`: add `'run-test-suite.sh'`.
- [ ] `outer-loop-scripts.test.mjs`: add a case in the shape of the flow-walker case, covering the default and a relocated `scriptsDir`. It asserts that `run-test-suite.sh` lands under `scriptsDir` byte-identical to the template at mode `0o755`, and that a second `init` leaves it byte-identical.
- [ ] `server.ts` module header: *"`plugin/agents/*.md` quotes {@link SEARCH_TOOL_PERMISSION} in ten `tools:` allowlists"* becomes eleven. Task 7 adds the eleventh, `plugin/agents/test-fix-plan-writer.md`, whose `tools:` line carries `mcp__harness-docs__search_docs`, and brings `plugin/agents/README.txt`'s roster to eleven in the same branch. This is a comment edit only; no executable line changes. Between this commit and Task 7's the header leads the roster by one; that is accepted, because the bottom-up order puts every `cli` task ahead of every `plugin` one, and no test reads the count.

**Verification:**

- `bash scripts/typecheck.sh` passes. That builds `cli/dist`, which the suites run against.
- The two edited suite files, which this unit edits, are run on their own where the conventions documents state a single-file test command. Where none is stated, the run is skipped and recorded as skipped (`plugin/instructions/unit_loop_core.md` → `## The test-run rule`, once Task 5 lands).
- `grep -n "run-test-suite.sh" cli/src/generators/outerLoopScripts.ts` shows exactly one row, and `grep -rn "'run-test-suite.sh'" cli/src` shows no second spelling of the name used as a path. That is the module's one-table rule.
- `grep -nw "ten\|eleven" cli/src/retrieval/server.ts` shows the header's count as eleven and no `ten` beside `tools:`.
