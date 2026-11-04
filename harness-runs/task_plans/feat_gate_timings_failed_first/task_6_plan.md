### Task 6 — Bring this repository's copies of `run-test-suite.sh`, the run library and the `test_run_logs/` README in line with their templates

**Goal:** This repository has adopted its own harness, so `scripts/run-test-suite.sh`, `scripts/lib/harness-run-lib.sh` and `harness-runs/test_run_logs/README.md` are its `init`-written copies of templates Tasks 1 and 3 changed. Make each byte-identical to its template, so this branch's own Run gates phase runs the new wrapper — the one that exports `RUN_TEST_SUITE_LABEL` / `RUN_TEST_SUITE_LOG_DIR` that `scripts/run-gates.sh` (Task 9) reads.

**Depends on:** Task 1 (`cli/templates/scripts/run-test-suite.sh` and the `THE RUN GATES LANE:` comment of `cli/templates/scripts/lib/harness-run-lib.sh`) and Task 3 (`cli/templates/state-dir/test_run_logs/README.md`). Each copy was byte-identical to its template before this branch (`cmp` printed nothing for all three), so a copy is the whole edit.

### Targets

- `scripts/run-test-suite.sh`
- `scripts/lib/harness-run-lib.sh`
- `harness-runs/test_run_logs/README.md`

**Work:**

- [ ] Write each target with its template's exact bytes: `cli/templates/scripts/run-test-suite.sh` → `scripts/run-test-suite.sh`; `cli/templates/scripts/lib/harness-run-lib.sh` → `scripts/lib/harness-run-lib.sh`; `cli/templates/state-dir/test_run_logs/README.md` → `harness-runs/test_run_logs/README.md`. Keep each file's mode as it is (`git diff` shows no mode change).

**Verification:**

- `cmp cli/templates/scripts/run-test-suite.sh scripts/run-test-suite.sh`, `cmp cli/templates/scripts/lib/harness-run-lib.sh scripts/lib/harness-run-lib.sh` and `cmp cli/templates/state-dir/test_run_logs/README.md harness-runs/test_run_logs/README.md` each print nothing and exit 0.
- `bash scripts/typecheck.sh` passes.
