### Task 3 — Test the new launch line and the `<label>.start` contract, and list the file in the lane README template

**Goal:** Pin, against a throwaway fixture, what Task 2 changed in the run form. A worker that never starts still produces the byte-identical refusal and now leaves its own stderr in `<label>.start`. A started run leaves no `.start`. A stale `.start` is cleared. The worker still ignores HUP. Also tell an adopter, in the lane README `init` writes, what the new file is.

**Depends on:** Task 2, which changes `cli/templates/scripts/run-test-suite.sh` as follows. This task tests exactly these, and changes nothing in that file.

- The worker is launched as `( trap '' HUP; export RUN_TEST_SUITE_WORKER="$label"; exec bash "<script>" "$label" ) </dev/null >/dev/null 2>>"$start_file" &`. `bash` is resolved by name on `PATH` inside that subshell. That is the seam this suite shadows, replacing the old shadowed `nohup`.
- `start_file` is `<log_dir>/<label>.start`. The run form, when it starts a run rather than reusing one, removes a stale one beside `.verdict` and `.commit` and creates it empty before the launch. The `--no-detach` form removes a stale one too, and detaches nothing.
- The worker removes it directly after writing `.running`, then sends its stderr to `/dev/null`.
- On the start-up refusal, the run form appends exactly one line: `== run-test-suite.sh: worker <pid> of <label> neither claimed .running nor wrote .verdict within <N>s ==`. Its stderr is still exactly `run-test-suite.sh: the detached run of <label> did not start\n`, with exit 2 and nothing on stdout.

### Targets

- `cli/test/run-test-suite.test.mjs` — re-seam two cases, add three, and amend the header's rule.
- `cli/templates/state-dir/test_run_logs/README.md` — the lane-file list.

**Work:**

- [ ] **The never-starts case** (`a worker that never starts refuses with exit 2, one stderr line and no gate run`). Replace the `nohup` stub with a fake `bash` first on `PATH`. When `RUN_TEST_SUITE_WORKER` is set, it prints one fixed line to stderr and exits non-zero. Otherwise it `exec`s the real `bash` by the absolute path the test resolves before shadowing. `runBash` resolves `bash` through the env's `PATH`, so the wrapper itself must still reach the real interpreter. Keep every existing assertion: `NOT_STARTED` byte-exact, exit 2, empty stdout, no `.running` / `.verdict` / log, and no counter. Add one: `<LOG_DIR>/<LABEL>.start` holds the fake's line, then the marker line above, and nothing else.
- [ ] **The no-detach case** that today shadows `nohup` to prove the form calls none. Re-seam it on the same fake `bash`, which here records when it is invoked with `RUN_TEST_SUITE_WORKER` set. Assert that it never is. Also assert that a `<label>.start` planted before the call is gone afterwards.
- [ ] **Started runs and stale files.** After a passing run form, once its verdict has been collected, no `<label>.start` exists. A `<label>.start` planted before a run form that starts a fresh run is gone once the run has its verdict. The reuse path, a finished verdict on an unchanged clean tree, leaves the lane as it found it, as its existing cases already assert for the log, `.verdict` and `.commit`.
- [ ] **HUP is still ignored on the worker's entry.** With the gate held on the existing `STUB_RELEASE` file, send HUP to the PID `.running` names. Then release the gate. The verdict `pass` is written and `.running` is removed, as the wrapper's `SIGNALS` paragraph records for HUP. Amend the file's header so its rule sentence names the `<label>.start` contract and the HUP case.
- [ ] **The lane README template.** In `cli/templates/state-dir/test_run_logs/README.md`, in the sentence that lists the files beside each log, add `<label>.start`. It holds the detached worker's own stderr until it claims `.running`, and is then removed, so it is present only after a worker that did not start, with the run form's marker line as its last line. Keep every other sentence byte-identical. This checkout's copy is Task 5's.

**Verification:**

- `npm test --workspace cli -- test/run-test-suite.test.mjs`, from the repository root, as one plain foreground command, passes, with the new and re-seamed cases among those that ran.
- The never-starts case reads `<label>.start` from the fixture's lane on disk. The test asserts on the file's bytes, never on a message that describes them.
- `grep -n "nohup" cli/test/run-test-suite.test.mjs` finds no seam that shadows `nohup`.
