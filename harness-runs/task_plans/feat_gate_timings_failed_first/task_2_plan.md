### Task 2 — Pin the verdict reuse and the gate environment in `cli/test/run-test-suite.test.mjs`

**Goal:** Extend the wrapper's suite so that it pins what Task 1 added. A finished verdict is reused on the same commit with a clean tree, and not reused after HEAD moved or with a dirty tree. `<label>.commit` is written only for a run that was clean at start and finish. The `--no-detach` form's reuse refreshes the verdict and runs nothing. Both gates receive `RUN_TEST_SUITE_LABEL` and `RUN_TEST_SUITE_LOG_DIR`.

**Depends on:** Task 1, which changes `cli/templates/scripts/run-test-suite.sh` as follows:

- The worker writes `<lane>/<label>.commit`, one line holding the commit id. It does so only when `git rev-parse --verify -q HEAD` and `git --no-optional-locks status --porcelain --untracked-files=all -- . ':(exclude)<state_dir>'` (empty output) agree at the worker's start and at its finish.
- The run form, finding `.verdict` and a `.commit` that equals the current clean-tree HEAD, prints that verdict line and exits 0 (`pass`) or 1 (`fail <log>`), starting nothing.
- The `--no-detach` form does the same, after rewriting `.verdict` in place so its mtime is the current second.
- Otherwise both forms remove `.verdict` and `.commit` and run as today.
- Each gate command sees `RUN_TEST_SUITE_LABEL=<label>` and `RUN_TEST_SUITE_LOG_DIR=<state_dir>/test_run_logs/<sanitized branch>` (repo-relative).

This task tests those behaviours and changes no script.

### Targets

- `cli/test/run-test-suite.test.mjs`: new cases, and the header's rule sentence.

**Work:**

- [ ] **A fixture whose tree stays clean.** The existing `STUB` writes `stub-counter.txt`, `stub-pwd.txt`, `stub-pid.txt` and `stub-env.txt` at the repository root. That dirties the tree, so as it stands Task 1 writes no `.commit` in this suite. For the reuse cases, add a helper that commits a `.gitignore` covering every stub output file and commits the stubs and the configuration, so the tree is clean before the run form is issued. Extend the stub so it also records `${RUN_TEST_SUITE_LABEL-unset}` and `${RUN_TEST_SUITE_LOG_DIR-unset}` into an ignored file. Change no existing case's subject.
- [ ] **Reused on the same commit.** Issue the run form, then `--wait` until it prints `pass`. Assert `<LOG_DIR>/<label>.commit` holds `git rev-parse HEAD`. A second run form then prints `pass` with exit 0 and nothing on stderr. The counter is unchanged, the log is byte-identical, and `.verdict` and `.commit` are unchanged. Make the same case for a `fail` verdict (stub exit 1): exit 1 and `fail <log>`.
- [ ] **Not reused, and why.** Start from a finished clean run each time:
  - (a) A commit that changes a file outside the state directory: the next run form prints `pending`, the counter grows by one, and `.commit` then names the new HEAD.
  - (b) An untracked, unignored file at the root: the run form starts a fresh run.
  - (c) An untracked file under `sdlc-harness/`, the state directory: the run form reuses the verdict.
  - (d) A stub variant that writes an unignored file during its run: the worker writes no `.commit`, and the next run form starts a fresh run.
- [ ] **The no-detach form and the gate environment.** With a finished clean run of a label, `--no-detach <label>` prints the verdict, runs no gate (counter unchanged) and leaves `.verdict`'s mtime at or after the call's start second. Both stubs (typecheck and test) record `RUN_TEST_SUITE_LABEL` equal to the label and `RUN_TEST_SUITE_LOG_DIR` equal to `sdlc-harness/test_run_logs/feat-run-gates`. The existing *"The worker's marker never reaches a gate"* assertion still holds.
- [ ] **Keep the existing re-run cases honest.** These cases assert that a run of a label already finished is run again:
  - *"each round keeps its own log, and only a re-run of the same label replaces one"*
  - *"a run form finding a stale heartbeat of its label starts a fresh run"*
  - *"--no-detach replaces a stale `.verdict` of its label and never reads it"*

  Each must still exercise a fresh run. If one of them now reuses a verdict, amend its setup so the re-run is forced: a dirty tree or a moved HEAD, said in a comment. Keep its assertion. Update the file header's **rule** sentence to add the reuse and its two conditions, and the `Not covered here:` list to name the `--no-optional-locks` read under a read-only `.git`, which only the launcher's `bwrap` sets up.

**Verification:**

- `npm test --workspace cli -- test/run-test-suite.test.mjs` passes, run from the repository root as one plain foreground command.
- Each new case fails if Task 1's reuse is reverted. The implementer checks this on a scratch copy of the template, never by editing the tracked file, and records the result in the return.
- `git diff -- cli/test/run-test-suite.test.mjs` removes no existing assertion.
