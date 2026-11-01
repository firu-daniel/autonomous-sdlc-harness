### Task 3 — Add job mode's own preflight

**Goal:** Give `sp_preflight` (`scripts/lib/sandbox-probe/preflight.sh`) a job arm, taken when `SP_JOB_MODE` is `1`. The job's own preflight is `doctor --remote-job` (`docs/remote-execution.md` → **The permission profile.**), under which `sandbox-prerequisites`, `profile-paths`, `plugin-permissions` and `profile-tracked` fail where a plain `doctor` warns. In job mode the watcher turns the cleanup sweep off. So refusals 4 and 5, and refusal 6's `SETTINGS_PROFILE` half, which all assume a local watcher, do not run. The arm states its own checks instead, each refusing exactly as today: one `sandbox-probe: refusing to start: <reason>` line, status 2, nothing left behind.

**Depends on:** Task 1, which declares `SP_JOB_MODE`, `SP_JOB_CHECKOUT` (the `--job` argument, as given) and `SP_RUNNER_CONTROLS_FILE` (the `--runner-controls` argument, or empty) in `core.sh`, assigned only by the entry point (Task 5). It reuses, unchanged: `sp_preflight_refuse`, `sp_snapshot_take` with `sp_snapshot_paths`, which hash `SP_MAIN`'s three files, `sp_platform_of`, `hr_default_branch`, and the doctor-line parser in check 6's loop.

**Where this task stops.** It edits `preflight.sh` only. The entry point that sets the mode and calls this is Task 5's. What setup does with the checkout is Task 2's. IS4 reads `SP_JOB_PREREQ_LINE` (Task 7). Tests are Task 17's.

### Targets

- `scripts/lib/sandbox-probe/preflight.sh`

**Work:**

- [ ] **The header's refusal list** gains a *JOB MODE* block naming each job check below, why 4, 5 and 6's second half are left out (no local watcher, and the job turns the sweep off), and the new globals `SP_JOB_PREREQ_LINE` and `SP_JOB_DOCTOR_OUT`. Under *TEST-ONLY SEAMS*, `SANDBOX_PROBE_DOCTOR` now also replaces job mode's doctor command, run in the checkout.
- [ ] **Check 1, job arm.** It still sources the probe's own run library from `probe_scripts`, as today. Then:
  - `SP_JOB_CHECKOUT` must resolve to a git top through `hr_repo_root`;
  - **straight after that, and before either test below,** that top must not be the probe's own checkout (the git top of `probe_scripts`), compared canonically: *"job mode measures another checkout; the probe's own is not one"*. It runs first so that this refusal names the same cause whatever kind of checkout the probe itself sits in — a main checkout, a linked worktree or a run copy carrying `.git/objects/info/alternates`;
  - `hr_main_repo` of that top must be the top itself, compared canonically: a linked worktree is refused;
  - its `.git` must be a directory carrying no `objects/info/alternates`: a run copy is refused.

  Then `hr_run_main_set_var` on it, `SP_MAIN` from `HR_RUN_MAIN`, and `sp_snapshot_take`, as today.
- [ ] **Checks 2, 3 and 7** run as today against that `SP_MAIN`. Check 3 also refuses a tracked change: `git -C "$SP_MAIN" status --porcelain --untracked-files=no` must print nothing, the test the job's *Generate the job's permission profile* step applies. The reason names the first changed path. Teardown's `switch --discard-changes` (Task 2) then discards only the probe's own edits. Checks 4 and 5 are skipped in job mode.
- [ ] **Check 6, job arm.** The command is chosen in this order:
  - `SANDBOX_PROBE_DOCTOR`, run by `bash -c` in `SP_MAIN`, as today;
  - else, when `HARNESS_CLI_VERSION` is non-empty (the workflow sets it, as `harness-run.yml` does), `npx --yes "autonomous-sdlc-harness@$HARNESS_CLI_VERSION" doctor --cwd "$SP_MAIN" --remote-job`, run from `SP_TMP` and never from the checkout, as the job runs it from `runner.temp`;
  - else `node "<probe checkout>/cli/dist/cli.js" doctor --cwd "$SP_MAIN" --remote-job`, refusing as today when that file is missing.

  Keep its exit status and its whole output in `SP_JOB_DOCTOR_OUT`. Refuse on a non-zero exit, naming the first `!! FAIL` line, or the exit status when there is none. Then require a `PASS` line for each of `profile-sandbox`, `profile-write-protection`, `profile-main-anchor` and `sandbox-prerequisites`, through the existing parser. Set `SP_JOB_PREREQ_LINE` to the `sandbox-prerequisites` line verbatim. The `SETTINGS_PROFILE` comparison is not made.
- [ ] **A new check 8, job mode only.** When `SP_RUNNER_CONTROLS_FILE` is non-empty, it must name a readable regular file, not a symbolic link. Otherwise refuse, naming the path. Its content is the runner legs' to read (Task 7).

**Verification:**

- The type check passes.
- `git diff scripts/lib/sandbox-probe/preflight.sh` shows every new branch behind an `SP_JOB_MODE` test, and the clone-layout path of checks 1–7 unchanged line for line.
- By hand, from the checkout root: `bash -c '. scripts/lib/sandbox-probe/core.sh; . scripts/lib/sandbox-probe/platform.sh; . scripts/lib/sandbox-probe/preflight.sh; SP_JOB_MODE=1; SP_JOB_CHECKOUT=.; sp_preflight; echo "rc=$?"'` prints the refusal that the probe's own checkout is not one job mode measures, and `rc=2`. Because the probe's-own comparison precedes the linked-worktree and alternates tests, this holds whether the checkout it runs in is a main checkout, a linked worktree or a run copy. It is a by-hand read, never a test: no `cli/test` suite is aimed at this checkout (Task 17 runs its copy of the probe in a fixture).

**Deviations from plan:**

- *Clone path "unchanged line for line".* Check 1's clone arm, checks 4 and 5, and check 6's `SETTINGS_PROFILE` comparison now sit inside `if [ "$SP_JOB_MODE" … ]` guards and are re-indented by two spaces; their text is otherwise unchanged. Plain `git diff scripts/lib/sandbox-probe/preflight.sh` shows them as changed lines; `git diff -w scripts/lib/sandbox-probe/preflight.sh` (run in this session) shows only added guard lines, plus one changed line: check 6's `if [ -n "${SANDBOX_PROBE_DOCTOR:-}" ]` became `elif`, behind a new `if [ "$SP_JOB_MODE" = 1 ]` arm. Bash has no construct that skips a block without enclosing it.
- *The by-hand check was not executed (evidence downgrade).* The `bash -c '…; sp_preflight; echo "rc=$?"'` command was refused by the permission layer (`Permission to use Bash has been denied because Claude Code is running in don't ask mode`), twice. The claim rests on reading the code: `sp__preflight_job_main` resolves `SP_JOB_CHECKOUT=.` and the probe's scripts directory to the same git top, compares them canonically before `hr_main_repo` and the `.git` / alternates tests, and refuses through `sp_preflight_refuse` with status 2 before `sp_snapshot_take` creates anything. Task 17's fixture suite verifies it by execution.
- *The local `cli/dist/cli.js` doctor arm runs from `SP_TMP`*, like the `npx` arm. The plan named a working directory only for the `npx` arm, and `--cwd "$SP_MAIN"` makes the working directory irrelevant to which checkout doctor grades.
</content>
</invoke>
