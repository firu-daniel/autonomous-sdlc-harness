### 2. A job whose watcher is itself killed (a `stop` cancel, a step timeout) still hands `Push the branch` a leftover `<scriptsDir>/.git`

**File:** `cli/templates/github/workflows/harness-run.yml` — the step "`- name: Push the branch`" (`run: bash "$SCRIPTS_DIR/push-branch.sh"`, `if: always() && env.SCRIPTS_DIR != ''`) and the header's post-session account. Also `cli/templates/scripts/autonomous-watcher.sh`, at three sites:

- the entry `case "${1:-watch}" in` ("`job)`");
- the job-mode switch "`if [ "${1:-}" = "job" ]; then`";
- the header's `Subcommands:` list ("`HARNESS_JOB_MODE=1 autonomous-watcher.sh job <branch> <engine> <resume>`").

Tests: `cli/test/workflow-templates.test.mjs` and `cli/test/watcher-placeholder-host.test.mjs`.

**Depends on:** Finding 1. That finding writes the job manifest under `$RUNNER_TEMP` through `hr_job_absent_file`, adds the job-mode branch of `placeholder_sweep_pass`, and makes `placeholder_start_recover` run in job mode for a job-mode subcommand.

**The problem.** The user asked whether the post-session `push-branch.sh` step needs the same sweep. Finding 1's sweep at `run_job`'s exit covers every job whose watcher lives to the end. It does not cover a job whose watcher is killed together with its session:

- **A user's `stop`.** `remote-run.sh stop` asks GitHub to cancel the run. Gate 12 round 3, observation (viii) in `docs/development.md`, recorded this: *"the job ended `cancelled` with its `Save the state bundle` and `Upload the state bundle` steps `success`"*.
- **The `Run the harness` step's `timeout-minutes`.**

In both cases the runner kills the step's process tree mid-call. That leaves the base profile's absent entries behind, `<checkout>/<scriptsDir>/.git` among them, by the same mechanism as a `kill -9`. This is derived, not measured: CS6 is owed. `Push the branch` then runs under `always()`, and `hr_wrapper_main_of` refuses it with *"cannot place this script in a main checkout"*. The push exits 0 and pushes nothing, so every commit since the last push is lost to the next job (`docs/cli.md` §6, residual 12, **Job mode** item 2).

This is not the stall-kill case the user asked to fix, so it is Should Fix. It is reachable by an ordinary user action, though, and it loses work.

**Why not sweep inside `push-branch.sh`.** That is an unsandboxed wrapper. A session also calls the wrappers, so a sweep inside one could unlink a placeholder that the same session's in-flight call is mounting (`docs/cli.md` §6 residual 12, *"What a run cannot rely on"*, the last bullet). The workflow's own step runs only after the session's step has ended.

**Fix:**

- [ ] **The watcher: a `job-sweep <branch>` subcommand.**
  - It is refused unless `HARNESS_JOB_MODE=1`, through `job_usage`, as `job` is. It takes exactly one argument.
  - Extend the `if [ "${1:-}" = "job" ]` switch to `job | job-sweep`, so the same local facilities are forced off.
  - At source time, a leftover `<checkout>/<scriptsDir>/.git` makes `hr_main_repo` fail. Finding 1's job-mode `placeholder_start_recover` handles that: it passes over the leftover to the checkout, gates on the checkout's registry and sweeps the job manifests.
  - After sourcing, the entry calls the job-mode manifest sweep once, logs a `placeholder sweep: removed` / `kept` line per path, and exits 0. That covers a leftover that does not stop `hr_main_repo`, such as `.claude/settings.local.json`.
  - **Not gated on the probe**, for the reason `placeholder_start_recover` states: manifests are only ever written on a placeholder host.
  - A live run, meaning a `running` record whose `pid` answers `kill -0`, keeps everything and logs the skip.
  - Add it to the header's `Subcommands:` list and the exit map.
  - Note in the JOB MODE block that the watcher's basename is on the script-allowlist guard's `DENY_SCRIPT_BASENAMES`, so no session can run it.
- [ ] **The workflow: a new step directly before `Push the branch`.**

  ```yaml
  - name: Sweep the sandbox placeholders
    if: always() && env.SCRIPTS_DIR != ''
    continue-on-error: true
    run: HARNESS_JOB_MODE=1 bash "$SCRIPTS_DIR/autonomous-watcher.sh" job-sweep "$HARNESS_INPUT_BRANCH"
  ```

  Give it a header comment saying why it exists: a cancelled or timed-out `Run the harness` step leaves its session's placeholders behind, `push-branch.sh` places itself past them, and Finding 1's exit sweep does not run in a killed watcher. It is best-effort, so it never fails the job. Where the header lists the post-session steps, add this one.
- [ ] **Tests** — `cli/test/workflow-templates.test.mjs`: assert that the step exists with that exact `run` line, that its `if` carries both `always()` and `env.SCRIPTS_DIR != ''`, that it has `continue-on-error: true`, and that it is the step immediately before `Push the branch`.
- [ ] **Tests** — `cli/test/watcher-placeholder-host.test.mjs`. These cases need no probe override, because `job-sweep` is not probe-gated:
  1. With a recorded `0444` empty `<checkout>/<scriptsDir>/.git` in a job manifest under a fixture `RUNNER_TEMP`, and the registry record `running` with a dead `pid`: `HARNESS_JOB_MODE=1 autonomous-watcher.sh job-sweep <branch>` exits 0, the file is gone, and `hr_wrapper_main_of "<checkout>/<scriptsDir>"` then prints the checkout.
  2. The same without `HARNESS_JOB_MODE=1` exits 2 and leaves the file.
  3. The same with the record's `pid` live keeps the file.
  4. A leftover that no manifest lists is kept.

**Deviations from plan:**

- `job-sweep`'s two refusals (HARNESS_JOB_MODE not 1, other than one argument) run at source time, directly ahead of `placeholder_start_recover "${1-}"`, not in the entry arm. In the entry arm they come after the source-time `fatal` that a leftover `<scriptsDir>/.git` triggers when the recovery does not run outside job mode, so test case 2 would have exited 1, not 2. `job_usage` therefore moves up beside `fatal` and takes the subcommand as its first argument: `job_usage <job|job-sweep> <reason>`. The `job` arm's call sites now pass `job`. Its message is unchanged.
- The entry's sweep is a new `placeholder_sweep_unprobed <exclude> <quiet>`, split out of `placeholder_sweep_pass`, which keeps the probe gate and now calls it. This avoids a second copy of the live-run skip and the removed/kept logging.
- Test case 3 has two subtests. With a live pid and a leftover `<scriptsDir>/.git`, the start-up recovery keeps the file and the watcher's existing start refusal exits 1 before the entry runs, so no skip line is logged; the subtest asserts the file is kept, exit 1 and `START_REFUSAL`. The finding's "logs the skip" is asserted on a second subtest that uses a leftover `.claude/settings.local.json`: exit 0, kept, and `placeholder sweep: skipped, 1 run(s) of this repository live`. An extra case, 1b, asserts that the entry's own pass removes a `.claude/settings.local.json` leftover. Case 4 also asserts exit 1 and `START_REFUSAL`.
- The workflow header has no list of post-session steps (a read of its header block found only generic `always()` mentions), so the new step carries its own header comment and no header list was edited.
- `docs/watcher.md` (the sweep-points paragraph) and `docs/cli.md` §6 residual 12 (**Job mode** item 2) still describe the unswept cancel/timeout case. Both are outside the `cli` layer's path and were not edited.
