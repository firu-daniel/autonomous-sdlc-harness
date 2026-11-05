### Task 4 — Test FR3's wrapper refusals and FR6's zero-plan restore, replaying round 13

**Goal:** Pin findings 2 and 3 in `cli/test/gate12-sandbox-round-full-run.test.mjs`. Round 13's two jobs grade FR3 `fail` and FR6 `pass`. A wrapper refusal in either spelling fails FR3. FR6 grades its `placed` clause only where the parked job's bundle holds a planning file.

**Depends on:** Task 2. The cases below hold it to this contract:
- **FR3.** `g12_fr3_arm` fails a job whose `Run the harness` log carries a line with `commit-on-branch.sh: ` and `refusing to commit`, or whose `Push the branch` log carries a line with `push-branch.sh: ` and `refusing to push`. The evidence is `run <id>: <the line, from the script name on>`. An expired `Push the branch` log is `expired`. A passing job's evidence is still `run <id>: <job: line>`.
- **FR6, read.** With a `restored the bundle of run <parked id>` line and no `placed` line, `g12_fr6_restore` reads the parked job's artifact through `g12_artifact <parked id>`. That reader answers from the cache directory `<stateDir>/scratch/gate12-sandbox-round/runs/<id>/harness-state/` when it exists, before any `gh` call. Otherwise it lists `gh api repos/<slug>/actions/runs/<id>/artifacts`, whose `harness-state` entry is absent (`none`) or marked `"expired": true` (`expired`).
- **FR6, grade.** A bundle with no regular file under `planning/` is `pass`, its evidence ending `placed: none to place, the park preceded any plan file`. A bundle holding one or more is `fail`, its evidence naming `carries no placed <n> planning file(s) line` and the count. An expired artifact is `expired`, and an absent one `not run`.
- **The `--list` note.** FR3's note now reads `commits and pushes through the wrappers, graded on the job: line of the Run the harness step log and on a wrapper's refusing line, since push-branch.sh exits 0 on a refusal and Run the harness concludes success even on a failed run`. This suite does not assert it: the row table is the entry-point suite's to hold, and Task 5 restates it.

Task 2 owns the driver, and this task changes nothing under `scripts/`.

### Targets

- `cli/test/gate12-sandbox-round-full-run.test.mjs` — the shipped-string extraction, `stage`, a round-13 job builder, new cases, and its header.

**Work:**

- [ ] **Shipped strings.** Read the wrapper strings out of the shipped files, as the suite already does for every other log string, rather than retyping them:
  - from `cli/templates/scripts/push-branch.sh`: the `push-branch.sh: refusing to push: ` prefix of the `$HR_WT_CONFIG_REFUSAL` echo, and the em-dash form `detached HEAD — refusing to push`;
  - from `cli/templates/scripts/commit-on-branch.sh`: the `commit-on-branch.sh: refusing to commit: ` prefix of its `$HR_WT_CONFIG_REFUSAL` echo.

  Use `extract` over the file text, with a regex anchored on each `echo "…"`. The reason after a prefix is composed at run time, so it is canned in round 13's shape: `<WORKTREE>/.git/config.worktree sets core.sparsecheckout; remove the file, then re-run setup-worktree.sh in that working copy`. Add both files to the header's list of shipped sources.
- [ ] **`stage`, artifacts.** Give `stage` an `artifacts` option, keyed by run id. A value that is an object of `{ <relative path>: <body> }` is written under `scratch(fixture)/runs/<id>/harness-state/`, `runs.sh`'s documented cache. The value `'expired'` or `'none'` routes `api repos/${GATE12_SLUG}/actions/runs/<id>/artifacts` to `{"artifacts":[{"name":"harness-state","expired":true}]}` or `{"artifacts":[]}`.
  - By default, pre-seed `PARKED`'s artifact with a `status.json` and two files under `planning/`, matching the `placed 2` line `fullRun` already logs. Then every path standing in for the bundle carries what the grader may now read, even where the grader does not read it (`harness-runs/lessons.md` → *"When a check moves to reading a field one producer writes, the same change makes every path that stands in for that producer … write the field too"*).
  - Add `pushExtra` and `harnessExtra` options to `fullRun`, the lines appended to the completed job's `Push the branch` and `Run the harness` logs, and a `placed` option (default `true`) that drops the resumed job's `placed` line when `false`.
- [ ] **Round 13's two jobs.** Add `round13()`, which builds the two jobs round 13 ran.
  - **The parked job.** Its `Run the harness` logs `LAUNCH` then `PARKED_STOP`. Its `Push the branch` logs the round-13 refusal line. Its `Save the state bundle` logs `SAVED` and no `skipped` line.
  - **The resumed job.** It is also the job that completed the run. Its `Restore the previous job's state` logs `RESTORED` and `WROTE`, and **no** `PLACED`. Its `Run the harness` logs `RESUME` then `${JOB_FINAL}completed stop`. Its `Push the branch` logs the same refusal line.
  - **Its artifact.** Pre-seed `PARKED`'s artifact with `status.json` and `clarifications/<B>/question_1.md`, and no `planning/`.
- [ ] **FR3 cases.** Each is staged through `stage`:
  - Round 13's replay is FR3 `fail`, its evidence carrying `run ${PARKED}: ` and the refusal line. Read the evidence file, as the FR4 case does, and assert that it records both runs' refusals.
  - `fullRun({ harnessExtra: [<commit-on-branch.sh refusal line>] })` is FR3 `fail`, quoting that line.
  - `fullRun({ pushExtra: ['push-branch.sh: detached HEAD — refusing to push'] })` is FR3 `fail`, built from the extracted em-dash string.
  - The existing expected-shape case still asserts FR3 `pass`, unchanged.
- [ ] **FR6 cases, and the header.**
  - Round 13's replay is FR6 `pass`, its evidence ending `placed: none to place, the park preceded any plan file`.
  - `fullRun({ placed: false })` with the default two-file artifact is FR6 `fail`, naming the count 2.
  - `fullRun({ placed: false })` with `artifacts: { [PARKED]: 'expired' }` is FR6 `expired`.
  - Header: extend the rule to FR3's refusal lines and FR6's zero-plan restore. Name the artifact cache this suite pre-seeds, and why: `g12_artifact`'s download path is the adversarial-grade suite's to prove, and a route cannot write files. Keep the line saying it reads fixed files and owes no `treeGuards` entry.

**Verification:**

- `npm test --workspace cli -- test/gate12-sandbox-round-full-run.test.mjs`, from the repository root, as one plain foreground command, exits 0. Its counts show the new cases passing beside the existing ones.
- The `grade` helper's own assertions hold in every new case: FR rows only, in order, FR1's `source` line second, no state file before or after, and exit 4 exactly when a line printed `fail`. Round 13's replay therefore exits 4.
- Every wrapper refusal string in the file is built from an `extract` over the shipped `push-branch.sh` or `commit-on-branch.sh`, apart from the canned run-time reason. Grep the file for a literal `refusing to` outside those `extract` regexes and find none.
