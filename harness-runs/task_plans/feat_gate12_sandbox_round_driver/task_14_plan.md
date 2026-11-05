### Task 14 — Test the full-run grade: FR1–FR7 and their `source` lines

**Goal:** Hold `grade --full-run <branch>` (Task 8) to observation (xvi)'s rows FR1–FR7 in `docs/sandbox-verification.md` → `## 10.`:
- each row is graded on its **Read from** alone;
- FR1's source clause is printed `source`, not graded;
- FR4's denials are quoted whole and kept;
- missing jobs and gone logs are `not run` and `expired`.

**Depends on:**
- Task 10: `makeGate12Fixture`, `ghStub` and `runRound`. The fixture's bare origin can take a pushed branch carrying `<stateDir>/run_analytics/<branch>/run-analytics.json`.
- Task 8:
  - The runs are `gh run list --workflow harness-run.yml --branch <branch>`, titled `harness run <branch>`, oldest first.
  - The parked job is the first whose `Run the harness` log carries `job: parked stop`. The resumed job is the first later one carrying `job: resuming parked run '<branch>' (answers `.
  - **FR1** is `job: launching run for '<branch>'` with no later `not launching`, plus a `row="FR1" result="source"` line naming `spawn_engine`'s job-mode arm.
  - **FR2** is the install and preflight steps.
  - **FR3** is `Run the harness` and `Push the branch` ran in every job, graded on each job's last `job: <final> <decision>` line in its `Run the harness` log (`<decision>` one of `stop`, `continue`, `wait-poller`, from `run_job`): a `failed` `<final>`, a missing line, or a `Push the branch` `failure` is a `fail` quoting the line, because `run_job` exits 0 and the step concludes `success` whatever the run's end.
  - **FR4** is the records with `permission_denied: true` from `git show origin/<branch>:<stateDir>/run_analytics/<branch>/run-analytics.json`, always kept in `evidence/FR4.log`.
  - **FR5** is the refusal and record steps' `success`.
  - **FR6** is `saved the bundle of <branch>` with no line containing `skipped` in the parked job's `Save the state bundle` log — neither `remote-run.sh: save: skipped …` (`save_link_free` / `verb_save`, `remote-run.sh`) nor `remote state bundle: skipped …` (`hr_remote_copy_tree` / `hr_remote_bundle_source_ok`, `harness-run-lib.sh`) — then `restored the bundle of run <parked id>` and `placed <n> planning file(s)`. Any `skipped` line is a `fail`.
  - **FR7** is graded on the resumed job's `Run the harness` resume line alone (its Read from). A `wrote answer_<n>.md for <branch>` line in the restore log is quoted into the evidence only and never moves the verdict. Its evidence ends on the second clause not graded.

### Targets

- `cli/test/gate12-sandbox-round-full-run.test.mjs` (new).

**Work:**

- [ ] Header. The rule: the full-run grade reads only what each FR row's **Read from** names, prints a source clause as `source` rather than grading it, and keeps FR4's quotes in full. State that it reads fixed source files for its log strings, and no tree.
- [ ] A three-run branch (parked, resumed, completed), with canned step lists and logs (each job's `Run the harness` log ending on a non-`failed` `job: <final> <decision>` line — `job: parked stop` for the parked job) and a pushed `run-analytics.json` carrying two denied records and one allowed, prints:
  - FR1–FR7 `pass`;
  - exactly one `FR1 source` line;
  - `evidence/FR4.log` holding the two denied records byte for byte, with the allowed one absent.
- [ ] The resumed-job and per-row variants of that branch, one case each:
  - With the resumed job's restore log lacking `wrote answer_<n>.md for <branch>` but its `Run the harness` carrying the resume line, FR7 is still `pass` — the restore log is not FR7's Read from.
  - Without the resumed run, FR6 and FR7 are `not run`.
  - With `Preflight with doctor` `failure`, FR2 is `fail`.
  - With the final job's `Run the harness` concluded `success` but its log ending `job: failed stop`, FR3 is `fail` and its evidence quotes that line; with that job's `job: <final> <decision>` line removed altogether, FR3 is `fail` too.
  - With a `not launching '<branch>': ` line after the launch line, FR1 is `fail`.
  - With the parked job's `Save the state bundle` log carrying a `remote state bundle: skipped <path>: <path> is a symbolic link` line (the prefix and suffix read from `hr_remote_copy_tree` in `cli/templates/scripts/lib/harness-run-lib.sh` at test time) beside its `saved the bundle of <branch>` line, FR6 is `fail`; the same with a `remote-run.sh: save: skipped …` line instead is also `fail`.
- [ ] With the parked run's log answered HTTP 410, FR1, FR2, FR5 and FR6 are `expired`. With no `run-analytics.json` on the branch, FR4 is `not run`. With it unparseable, FR4 is `fail`.
- [ ] `grade --full-run <branch>` prints no JS, SB or RJ line, and reads no state file. Assert the state file is absent before and after.

**Verification:**

- `npm test --workspace cli -- test/gate12-sandbox-round-full-run.test.mjs` passes. It is this task's own new test file.

**Deviations from plan:**

- "Without the resumed run" is canned as the parked job alone; a later non-resume job would grade the same through `g12_fr_find`'s search, and is not a separate case.
- "No `run-analytics.json` on the branch" pushes the branch carrying another file. A branch absent from origin fails `git fetch` instead, which `g12_fr4` grades `not run` but also raises exit 3, a different path from the one the plan names.
- FR2's passing case cans the install step's `The sandbox prerequisites are present.` line, read from `harness-run.yml`'s install step: `g12_fr2` keeps that line as evidence on a pass, and the plan does not name a source for it.
- `cli/test/helpers/gate12-round.mjs` is unchanged. FR4's branch is pushed from a second clone under the fixture root, so the checkout the driver runs in stays on `main`.
