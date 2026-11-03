### Task 1 — Give `run-test-suite.sh` a `--no-detach <label>` form that runs both gates in its own process, and test it

**Goal:** `run-test-suite.sh --no-detach <label>` does what the run form does up to the point where the run form detaches its worker:

- it reads the configuration and refuses as the run form does;
- it applies one run per label;
- it creates the lane directory and removes a stale `.verdict`.

Then, instead of detaching a worker, it becomes the worker in its own process: it claims `.running`, runs both gates and writes `.verdict`. The launcher (Task 2) runs this form as `bwrap`'s one command. A worker that detached inside `bwrap`'s PID namespace would end with that namespace's first process, which is F10's likely mechanism (`docs/sandbox-verification.md` §5 F10, not measured). Every other form is byte-for-byte unchanged.

**Where this layer stops.**

- The launcher that runs this form is **Task 2's**.
- This checkout's root copy is **Task 7's**.
- The shipped-scripts table in `docs/watcher.md` is **Task 17's**.
- Phase G never issues this form itself. Only the launcher does, inside its sandbox.

### Targets

- `cli/templates/scripts/run-test-suite.sh`: argument parsing, the run-form block, the header.
- `cli/test/run-test-suite.test.mjs`: new cases.

**Work:**

- [ ] **Parsing.** In the two-argument arm, accept `--no-detach` beside `--wait`, as `mode=nodetach`. Extend the usage string in both refusals to `usage: run-test-suite.sh <label> | run-test-suite.sh --wait <label> | run-test-suite.sh --no-detach <label>`, the same in both places.
- [ ] **The block.** In the `if [ "$worker_marker" != "$label" ]` block, for `mode=nodetach` only:
  - when `run_alive`, print `pending` and exit 3, starting nothing. Never call `wait_for_verdict` here: no caller reads this form's stdout;
  - otherwise keep the `mkdir -p "$log_dir"` and the `rm -f "$verdict_file" "$verdict_file.tmp"`;
  - then skip the `nohup` start and the start-up poll, and fall through to the worker section below the block, which runs unchanged.

  The run form's own path through the block stays byte-identical.
- [ ] **The header.**
  - Add `THE NO-DETACH FORM, AND WHO ISSUES IT` after *THE WAIT FORM, AND WHY IT EXISTS*. It states four things:
    - It is for `launch-sandboxed-gates.sh` alone. That script runs this form as the one command of its own `bwrap` sandbox on a bubblewrap host, because a process detached inside a sandboxed call there did not outlive the call (`docs/sandbox-verification.md` §5 F10; BG9, LB5, T3), and a worker detached inside a PID namespace would end with it.
    - Issued from a session's foreground call, it is bounded by the Bash tool's limits (F6), so Phase G never issues it.
    - `.running` then holds the worker's PID inside its own namespace, which only this script ever compares, against its own `$$`.
    - `launch-sandboxed-gates.sh` mirrors `LABEL_PATTERN`, `STALE_SECONDS` and the `LOG_SUBDIR` / `log_dir` lane layout (with the branch it is composed from, which this script takes from `hr_current_branch`), so a change to any of them is an edit to both scripts.
  - Add the form to the `Usage:` lines.
  - Add one sentence to the exit map: exit 3 for a live label, and otherwise the worker's verdict exit, 0 or 1.
- [ ] **Tests** in `cli/test/run-test-suite.test.mjs`, through its existing stub `commands.test` and counter fixtures. Extend the file header's rule with the no-detach form.
  - (a) `--no-detach <label>` returns only after the stub ran, exactly once, in the same process tree. The stub records `RUN_TEST_SUITE_WORKER` as `unset`, and no `nohup` shadow on `PATH` is called. It prints `pass` and exits 0, `.verdict` reads `pass`, and `.running` is gone.
  - (b) A failing stub gives `fail <log path>` with exit 1, and the log carries the existing marker lines.
  - (c) A fresh `.running` written by the case gives `pending` with exit 3, the counter unchanged.
  - (d) A stale `.verdict` from an earlier run of the label is replaced, never read.
  - (e) Three arguments, or `--no-detach` with no label, refuse with exit 2 and the new usage string.

  Keep every existing case as it is.

**Verification:**

- `cli/test/run-test-suite.test.mjs` passes, through the single-file command `.claude/context/conventions.md` → `## The testing bar` gives.
- `git diff -- cli/templates/scripts/run-test-suite.sh` changes no line that the run form or the wait form alone executes. Read every hunk: each new branch is guarded by `mode = nodetach`, or is a header, usage or exit-map line.
- `bash scripts/typecheck.sh` passes. It includes the shell-parse gate over the template, under the Bash 3.2 floor.

**Deviations from plan:**

- The no-detach handling is its own `mode = nodetach`-guarded block placed before `if [ "$worker_marker" != "$label" ]`, rather than branches inside that block: it does the live-label check, the `mkdir -p` and the stale-`.verdict` removal, then sets `worker_marker="$label"` so the run form's block is skipped and the worker section runs. The run form's block stays byte-identical in the diff; the cost is the `mkdir -p` / `rm -f` pair appearing twice.
- The usage string is held once in a `usage` variable that all refusals pass, instead of being spelled out in each one. The plan's "the same in both places" holds by construction.
- Case (e) asks for `--no-detach` with no label to refuse with the usage string. Under the existing parser that one-argument call fell through to the label-pattern refusal. A new line after the argument `case`, `[ "$label" != "--no-detach" ] || refuse "$usage"`, makes it give the usage string. The run form also executes this line; it is a usage line, and it changes no outcome for any label that `LABEL_PATTERN` admits.
- The `--wait` arm of the parser changed from `[ "$1" = "--wait" ] || refuse …; mode=wait` to a `case` on `$1`. The plan's parsing step called for this change ("accept `--no-detach` beside `--wait`"), and the wait form's behaviour is unchanged: all existing cases pass.
