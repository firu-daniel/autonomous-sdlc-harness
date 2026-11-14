### Task 5 — Bring this checkout's `scripts/run-test-suite.sh` and lane README level with their templates

**Goal:** Make this repository's own self-adopted copies byte-identical to the templates Tasks 2 and 3 changed. Phase G of every run in this checkout, this branch's own included, issues `bash scripts/run-test-suite.sh`, not the template.

**Depends on:** Task 2, which changed `cli/templates/scripts/run-test-suite.sh` (the launch line without `nohup`, and the `<label>.start` lifecycle and header). Also Task 3, which changed `cli/templates/state-dir/test_run_logs/README.md` (the lane-file sentence now names `<label>.start`). This task copies both and changes nothing in either.

**Where this layer stops.** Copy only. No content is written here that the templates do not carry. `scripts/lib/harness-run-lib.sh` and `scripts/launch-sandboxed-gates.sh` are not touched, because no task changed their templates.

### Targets

- `scripts/run-test-suite.sh` — byte copy of `cli/templates/scripts/run-test-suite.sh`.
- `harness-runs/test_run_logs/README.md` — byte copy of `cli/templates/state-dir/test_run_logs/README.md`.

**Work:**

- [ ] Replace the content of `scripts/run-test-suite.sh` with the template's, byte for byte, through the file tools: Read the template, then Write the copy. Keep the file's mode as committed.
- [ ] Replace the content of `harness-runs/test_run_logs/README.md` with its template's, byte for byte, the same way.

**Verification:**

- `cmp scripts/run-test-suite.sh cli/templates/scripts/run-test-suite.sh` and `cmp harness-runs/test_run_logs/README.md cli/templates/state-dir/test_run_logs/README.md` each exit 0.
- `git diff --summary -- scripts/run-test-suite.sh` reports no mode change.
- `bash -n scripts/run-test-suite.sh` exits 0. Nothing in this task issues the wrapper in any form: Phase G is what runs it, and Phase G of this branch is the end-to-end check that the copy starts its worker inside the sandbox.
- **Deviations from plan:** The copy was made with the Edit tool, applying the template's diff hunks to the existing files rather than a whole-file Write; a `cp` attempt was refused by the permission layer first. Edit kept `scripts/run-test-suite.sh` at its committed mode 100755 (`git diff --summary -- scripts/run-test-suite.sh` printed nothing), and both `cmp` checks exited 0 with no output. Evidence downgrade: the standalone `bash -n /<repo_root>/scripts/run-test-suite.sh` was refused by the permission layer ("Permission to use Bash has been denied"). The parse claim rests instead on `bash scripts/typecheck.sh` (commands.typecheck), whose `scripts/check-shell-parse.sh` leg runs `bash -n` over every shell script git lists, the wrapper included. It printed `Check-shell-parse: 125 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed` and then `PASS: typecheck`.
