### 4. Two descriptions still call the two-gate wrapper the "test-suite" wrapper or say it runs once per phase

**File:** `cli/templates/state-dir/test_run_logs/README.md` ("A log is written by the harness's test-suite wrapper, `run-test-suite.sh`"), its byte-identical copy `harness-runs/test_run_logs/README.md` (same sentence), and `docs/watcher.md` (the `run-test-suite.sh` row: "the orchestrating session, once per Run gates phase")

The task prompt's goal-8 check is a grep for "test-suite wrapper", among other strings. Two hits survive in the README pair, and their sentence follows directly after the paragraph that now says each log holds the type-check output as well as the test output. `cli/README.md` and `cli/templates/scripts/README.md` were renamed on this branch to "the Run gates wrapper", so the log README now uses a different name for the same script than its siblings do. `docs/watcher.md`'s row, edited on this branch, still says the session runs the wrapper "once per Run gates phase". Every other document this branch touched says once per **round** (`docs/config.md`'s `commands.test` row was changed from "phase" to "round" for exactly this reason), and a phase runs the wrapper up to `MAX_GATE_ROUNDS` times.

**Fix:**

- [ ] In `cli/templates/state-dir/test_run_logs/README.md`, replace `A log is written by the harness's test-suite wrapper, \`run-test-suite.sh\`,` with `A log is written by the harness's Run gates wrapper, \`run-test-suite.sh\`,`.
- [ ] Make the identical edit in `harness-runs/test_run_logs/README.md`, so it stays byte-identical to the template (`cmp` of the two files prints nothing).
- [ ] In `docs/watcher.md`, in the `run-test-suite.sh` row, replace `the orchestrating session, once per Run gates phase` with `the orchestrating session, once per Run gates round`.
