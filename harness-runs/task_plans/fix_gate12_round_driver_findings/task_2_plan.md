### Task 2 — Fail FR3 on a wrapper's refusal line, and grade FR6's `placed` clause only where the parked bundle holds a planning file

**Goal:** Make `grade --full-run` grade round 13's logs correctly. FR3 must be `fail` for both jobs, whose `Push the branch` logged `push-branch.sh: refusing to push: …` while the step concluded `success`. FR6 must be `pass` for the zero-plan park, whose restore logged no `placed` line because the parked job's bundle held no planning file. Rewrite FR3's `--list` note to match what the row is now graded on.

**Where this task stops.** This task changes the driver only. The fixtures that pin it are **Task 4's**, in `cli/test/gate12-sandbox-round-full-run.test.mjs`: round 13's two-job replay (FR3 `fail`, FR6 `pass`) and the FR6 artifact variants. Task 4 provides the parked job's artifact by pre-seeding `runs.sh`'s documented cache, `<scratch>/runs/<id>/harness-state/`. It provides an expired or absent artifact through the `gh api repos/<slug>/actions/runs/<id>/artifacts` route. So this task reads the artifact through `g12_artifact <id>` and nothing else, and that reader answers from its cache before any `gh` call. The restated docs are **Task 5's**: it copies the FR3 note below verbatim into `docs/development.md`'s table, re-derived from `--list`.

### Targets

- `scripts/lib/gate12-sandbox-round/grade-full-run.sh` — `g12_fr3_arm`, `g12_fr6_restore`, and the comment blocks above FR3 and FR6.
- `scripts/lib/gate12-sandbox-round/core.sh` — FR3's `g12_row_declare` note.

**Work:**

- [ ] `g12_fr3_arm <id>`: keep the existing order up to and including the `job: failed` check. Then add two refusal checks:
  - **Run the harness.** The first line of the already-read `Run the harness` log (`G12_ARM_LOG`) that carries `commit-on-branch.sh: ` and `refusing to commit` fails the arm: `g12_arm_set fail "run $id: <that line from commit-on-branch.sh: on, trimmed>" "$G12_ARM_LOG"`.
  - **Push the branch.** Keep the `Push the branch` conclusion check. Then read that step's log with `g12_arm_log "$G12_STEP_PUSH"`. Its `expired` and `not run` outcomes stand as the arm's verdict, exactly as for the harness log. The first line carrying `push-branch.sh: ` and `refusing to push` fails the arm the same way, quoting the line from `push-branch.sh: ` on, with the push log as the record.
  - **Both spellings match.** `<script>: refusing to …: <reason>` and `<script>: <reason> — refusing to …` both match, which is why the test is the two substrings rather than one prefix (story index `## Context` → **Wrapper refusal spellings.**). Nothing else in either log fails the arm: `push failed for …` is not a refusal.
  - **The pass evidence stays `run $id: <job: line>`.** `g12_arm_log` overwrites `G12_ARM_LOG`, so keep the quoted `job:` line in its local before reading the push log.
- [ ] `g12_fr6_restore`: keep the `restored` check, and the pass that quotes the `placed` clause when a `placed` line is present. When the `restored` line is present and the `placed` line absent, read the **parked** job's artifact: `art="$(g12_artifact "$G12_FR_PARKED")"`.
  - **Status 3.** Raise 3 and set the arm `not run`, naming run `$G12_FR_PARKED`'s artifact. Do not use `g12_arm_gh_failed`: its evidence names `G12_ARM_ID`, which here is the resumed job.
  - **`expired`.** The arm is `expired`, naming run `$G12_FR_PARKED`'s `harness-state` artifact, so whether its bundle held a planning file was not read.
  - **`none`.** The arm is `not run`, with run `$G12_FR_PARKED` having no `harness-state` artifact.
  - **A directory.** Count the regular files under `$art/planning`, using `find "$art/planning" -type f`. That form follows no link, so a link counts as no file, as it counts in neither of `hr_remote_bundle_restore`'s tallies. An absent `planning/` counts zero.
    - **Zero** passes: `run $G12_ARM_ID restored the bundle of run $G12_FR_PARKED; placed: none to place, the park preceded any plan file`. That last clause is the prompt's literal and is carried byte for byte.
    - **More than zero** fails: `$G12_STEP_RESTORE in run $G12_ARM_ID carries no placed <n> planning file(s) line, but run $G12_FR_PARKED's bundle holds <count> planning file(s)`, with a record holding the restore log and the listed paths.
- [ ] Rewrite the comment blocks above FR3 and FR6 to state the new reads:
  - **FR3.** `push-branch.sh` exits 0 on every refusal (`cli/templates/scripts/push-branch.sh` → **EVERY FAILURE PATH IS NON-FATAL (exit 0)**), so `Push the branch` concludes `success` on one, and the arm reads the step's log. Name both refusal spellings and both wrappers.
  - **FR6.** The `placed` line is printed only when `HR_REMOTE_PLANNING_PLACED + HR_REMOTE_PLANNING_KEPT` is non-zero (`cli/templates/scripts/remote-run.sh` → `verb_restore`). So with no such line, the parked job's artifact decides whether a planning file was saved, read through `g12_artifact` at `planning/`, the bundle's planning directory (`HR_REMOTE_PLANNING_DIR` in `cli/templates/scripts/lib/harness-run-lib.sh`). FR6 is graded on the save and restore lines, plus that artifact read.
  - **The file header.** Its sentence *"Each row reads exactly what its **Read from** names"* stays true once Task 5 adds the artifact to FR6's Read from. Say in the FR6 block that it does.
- [ ] `core.sh`, FR3's `g12_row_declare`: replace the note with exactly `commits and pushes through the wrappers, graded on the job: line of the Run the harness step log and on a wrapper's refusing line, since push-branch.sh exits 0 on a refusal and Run the harness concludes success even on a failed run`. It contains no tab and no `|`, so `--list` keeps five fields and the restated table keeps four cells. Change no other row's note.

**Verification:**

- `bash scripts/typecheck.sh` passes.
- `bash scripts/gate12-sandbox-round.sh --list`, run from this repository's root (it takes no `--repo` and runs no preflight), still prints the same rows in the same order, with five tab-separated fields each. Its FR3 line now ends with the note above, and every other line is byte-identical to the one before this change.
- Grep `grade-full-run.sh` for `g12_artifact`. Its only new call is in `g12_fr6_restore`, on `$G12_FR_PARKED`, and is reached only when the `placed` line is absent, so a run that placed drafts makes no new `gh` call.
- The two files set no shell option and use no Bash-4 construct.
- Task 4's fixtures are the behavioural proof. This task writes no test file.
