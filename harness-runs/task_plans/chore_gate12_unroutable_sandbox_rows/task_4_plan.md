### Task 4 — Grade RJ2 on its refusal at the job-surface step, with a `source` line for the launch-check clause

**Goal:** RJ2's launch-check clause is unreachable from a branch by construction. The planted `.claude/settings.autonomous.json` is a job surface, so `Refuse a branch that changed the job's own files` ends the job before the watcher's launch check. After this task, `grade` reads that refusal as RJ2's `pass`, reads a branch that passes the step as `fail`, and prints a `source` line naming where the launch-check clause is read from.

**Depends on:** Task 3, which keeps RJ2 on route `plant` with the single arm `profile`. Its note now says the row is graded on its refusal, with the launch-check clause read from the source. This task reads the row's arms through `g12_row_arms RJ2` and decides no route. The SB2, SB4, JS3 and `source`-route rows are **Task 5's**, in `grade-state.sh`. The tests are **Task 7's**.

### Targets

- `scripts/lib/gate12-sandbox-round/grade-plant.sh`: its header, `g12_js1_arm`, `g12_rj2_arm` and `g12_grade_rj2`.

**Work:**

- [ ] Factor the refusal checks of `g12_js1_arm` into `g12_refused_arm <row> <arm> <path>`. These are everything after its `case "$arm"` path choice, through its `pass` line:
  - the refusal step concluded `failure`, `success` being `fail` and anything else `not run`;
  - the run concluded `failure`;
  - every step from `Read the configuration` on is skipped;
  - no `harness-state` artifact;
  - the step's own `::error::` annotation, not its echo;
  - the log names `<path>`;
  - `remote-run.sh status` prints `state: failed`.

  `g12_js1_arm` keeps its path choice and calls it. JS1's result lines, evidence wording and departure must stay byte-identical, because the existing JS1 cases in `cli/test/gate12-sandbox-round-grade.test.mjs` hold them.
- [ ] `g12_rj2_arm`: refuse any arm but `profile`, then call `g12_refused_arm RJ2 profile .claude/settings.autonomous.json`. When the refusal step concluded `success`, the arm is `fail` with evidence saying that the branch passed `Refuse a branch that changed the job's own files`, so `.claude/settings.autonomous.json` was not refused as a job surface, and the source this row is read from does not hold for that job. Delete the old launch-line / `not launching` / `status.json` grading, which no route reaches now.
- [ ] `g12_grade_rj2`: print the folded line with the same departure JS1 prints: *read through status, not sync …*. Then always print `g12_result_line RJ2 source "<evidence>"`, where the evidence is `cli/src/generators/writeProtection.ts protectedPaths: join(repoRoot, PROFILE_PATH), kept by jobSurfacePaths, so Refuse a branch that changed the job's own files ends a branch that plants a profile before run_profile_check (cli/templates/scripts/autonomous-watcher.sh) runs`. Keep the evidence free of double quotes.
- [ ] Header: the RJ2 entry and the comment above `g12_rj2_arm` describe the new grade: the refusal is `pass`, passing the step is `fail`, and one `source` line follows. They name `g12_refused_arm`.

**Verification:**

- `bash -n scripts/lib/gate12-sandbox-round/grade-plant.sh` exits 0.
- Grep `grade-plant.sh` for `not launching` and for `job: launching run for`: no grading code is left on either.
- Read `g12_js1_arm` against its pre-change body: every string it passes to `g12_arm_set`, and the departure, is unchanged.

**Deviations from plan:**

- Evidence downgrade, `bash -n scripts/lib/gate12-sandbox-round/grade-plant.sh`: the bare call was refused by the permission layer (twice, as a standalone command). The claim rests instead on `bash scripts/typecheck.sh`, whose `scripts/check-shell-parse.sh` runs `/bin/bash -n --` over every `git ls-files`-listed `*.sh` and printed `check-shell-parse: 122 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`, then `PASS: typecheck`.
- `g12_refused_arm` keeps the signature `<row> <arm> <path>`. To let RJ2 word its own `success` failure while JS1's stays byte-identical, it also sets `G12_ARM_REFUSE_CONCL` to the refusal step's conclusion, and `g12_rj2_arm` re-sets the arm's evidence when that is `success`.
- Run on reading, not execution: `cli/test/gate12-sandbox-round-grade.test.mjs` cases `RJ2: a not launching line and a failed bundle is pass`, `RJ2: a refusal step concluding failure is not run, naming the job surface`, `RJ2: an expired artifact is expired`, and the all-rows case expecting `RJ2: 'pass'`, pin the old grade. They were not run, because this unit did not edit that file. Task 7 rewrites them, and the Run gates phase runs the suite.
