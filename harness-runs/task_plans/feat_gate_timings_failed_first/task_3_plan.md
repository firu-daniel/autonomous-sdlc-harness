### Task 3 — The `test_run_logs/` and `scripts/` README templates describe `<label>.commit`, gate-written records and the reused verdict

**Goal:** Bring the two adopter-facing READMEs that describe the Run gates wrapper and its lane into line with Task 1. The lane now also holds `<label>.commit`, and may hold records a gate command writes. A re-run of the same label is no longer a fresh run when the label's verdict is reused.

**Depends on:** Task 1. Its `cli/templates/scripts/run-test-suite.sh` header owns the behaviour, under the paragraphs opening `ONE RUN PER LABEL.`, `THE LOG IS VERSIONED PER ROUND`, `WHAT A GATE IS TOLD.` and `BESIDE THE LOG`:

- The worker writes `<label>.commit` (the commit id) beside `.verdict` for a run that was clean outside `<state_dir>` at its start and finish.
- The run form answers a finished verdict of its label at once when HEAD is still that commit and the tree is still clean outside `<state_dir>`.
- Both gates receive `RUN_TEST_SUITE_LABEL` and `RUN_TEST_SUITE_LOG_DIR`, and may write their own records beside the log.

These READMEs state each fact in one sentence and cite the header for the rest. They do not restate its definition of "clean".

### Targets

- `cli/templates/state-dir/test_run_logs/README.md`
- `cli/templates/scripts/README.md`: the `run-test-suite.sh` sentence only.

**Work:**

- [ ] `test_run_logs/README.md`, first paragraph: the sentence *"Beside each log sit `<label>.running`, the in-flight run's PID, and `<label>.verdict`, the one line the run printed"* gains `<label>.commit`, the commit a clean run ran against. Add one sentence: a gate command may write its own records for the round beside the log, named `<label>.<suffix>`, and is told where through `RUN_TEST_SUITE_LOG_DIR`. Keep it generic and name no repository's files.
- [ ] `test_run_logs/README.md`, third paragraph: *"Only a re-run of the same label — a resumed round — truncates that label's log"* gains the exception. A resumed round whose run already finished on the same commit, with nothing outside the state directory changed since, collects that run's verdict and leaves its log as it was. Cite `run-test-suite.sh` → `ONE RUN PER LABEL`.
- [ ] `scripts/README.md`: the sentence *"`run-test-suite.sh` is run once per Run gates round and has two forms: the run form starts … and prints `pending`"* gains one clause. The run form prints the finished verdict of its label at once when that run finished on the commit the checkout is at, with nothing changed since.

**Verification:**

- `git diff --stat` touches only the two targets.
- `grep -n 'commit' cli/templates/state-dir/test_run_logs/README.md` shows the new lane file named, and nothing there names `run-gates.sh`, `gates.tsv` or any other file of this repository's.
- The marker-line sentence in `test_run_logs/README.md` is byte-unchanged (`git diff` shows no change to the `== run-test-suite.sh: gate` spans).
