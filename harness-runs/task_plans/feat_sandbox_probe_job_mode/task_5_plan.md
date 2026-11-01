### Task 5 — Add `run --job`, `preflight --job`, `--runner-controls` and `--list --job` to the entry point

**Goal:** Expose job mode on `scripts/sandbox-probe.sh`'s command line, source the three new library files, and make the run loop pick legs by mode. A person or the runner workflow then starts it as:

```
bash scripts/sandbox-probe.sh run --job <checkout>
bash scripts/sandbox-probe.sh run --job <checkout> --runner-controls <file>
bash scripts/sandbox-probe.sh run --job <checkout> --leg job-layout
bash scripts/sandbox-probe.sh preflight --job <checkout>
bash scripts/sandbox-probe.sh --list --job
```

**Depends on:**

- **Task 1** (`core.sh`): `SP_JOB_MODE`, `SP_JOB_CHECKOUT` and `SP_RUNNER_CONTROLS_FILE`, which this entry point alone assigns. Also `sp_job_print`, `sp_leg_job_rows <leg>` (status 1 for a leg not run in job mode), `sp_leg_job_only <leg>` and `sp_leg_mode_skip <leg> <evidence> [<row>...]`. The four new legs sit before `headless-parity`; the three runner legs are also in `SP_LINUX_ONLY_LEGS`.
- **Task 3** (`preflight.sh`): `sp_preflight`'s job arm under `SP_JOB_MODE=1`.
- **Task 4** (`session.sh`): `sp_setup` hands off to `sp_job_setup`, and `sp_teardown` calls `sp_job_teardown`.

**Where this task stops.** It edits the entry point only. It calls two functions a later task defines, each only when `declare -F` finds it, as the entry point already treats every library function: `sp_runner_controls_read <file>`, status 1 on an unusable file, and `sp_runner_stamp`, which prints the runner stamp lines. Task 7 defines both. Until then a job run reads no controls file and prints no runner stamp, and the runner legs print `not run — leg not implemented`. The legs are Tasks 7–13's. Gate 15's restatement is Task 15's. Tests are Tasks 16 and 17.

### Targets

- `scripts/sandbox-probe.sh`

**Work:**

- [ ] **The source list** gains `job.sh` after `session.sh`, and `legs-job.sh legs-runner.sh legs-runner-isolation.sh` after `legs-loopback.sh`. Each is still sourced only if present.
- [ ] **Argument parsing.**
  - `run` accepts `--job <checkout>` and `--runner-controls <file>`, in any order with `--leg`.
  - `preflight` accepts the same two.
  - `--list` accepts one optional `--job`, which prints `sp_job_print` instead of the leg table.
  - **Usage errors**, exit 1, each raised before preflight:
    - `--runner-controls` without `--job`;
    - `--job` or `--runner-controls` given twice, or with an empty value;
    - `--job` on `refusal`, `judge` or `print-parity-script`;
    - `run --job --leg headless-parity`: the parity script prints a clone's paths.
  - When `--job` is given, set `SP_JOB_MODE=1`, `SP_JOB_CHECKOUT` and `SP_RUNNER_CONTROLS_FILE`. Otherwise set `SP_JOB_MODE=0` and both values empty, **assigned here, never inherited**, as `SP_PREFLIGHT_PREREQ` is.
- [ ] **After a passing preflight, in job mode.** Call `sp_runner_controls_read "$SP_RUNNER_CONTROLS_FILE"` when a controls file was given and the function is defined; a status 1 from it is a preflight refusal, exit 2. Call `sp_stamp` as today, then `sp_runner_stamp` when defined. Also print one stamp line `sandbox-probe: stamp: mode: job (<checkout>)`, or `mode: clone layout` outside job mode, so every run's record names its mode.
- [ ] **The run loop's selection.**
  - **Job mode, no `--leg`:** run exactly the legs `sp_leg_job_rows` answers; skip `headless-parity` and `refusal`; skip the Linux-only legs off Linux, as today.
  - **Job mode, with `--leg`:** a selected leg with no job rows prints its rows through `sp_leg_mode_skip <leg> "not a job-mode leg: job mode cuts no clone"`.
  - **Clone layout, no `--leg`:** skip every `sp_leg_job_only` leg.
  - **Clone layout, with `--leg`:** a selected job-only leg prints `sp_leg_mode_skip <leg> "job mode only: run it with --job <checkout>"`.

  The Linux-only skip keeps precedence off Linux, as today.
- [ ] **The header and `usage`.** Both name the new forms and flags. The header's line *"the GitHub-hosted runner legs are owed under roadmap item 21"* becomes: job mode measures a checkout under its base profile, locally or on a GitHub-hosted runner through `scripts/sandbox-probe-runner.yml` (Gate 15). The footprint sentence gains job mode's own: the probe branch in the checkout and on its origin, the checkout's `HEAD` and the job-mode placeholder manifest under `RUNNER_TEMP`, each restored or removed at teardown. The exit map is unchanged.

**Verification:**

- The type check passes.
- `bash scripts/sandbox-probe.sh --list --job` prints the eleven job lines; `bash scripts/sandbox-probe.sh run --runner-controls x` exits 1 with a usage line naming `--job`.
- `bash scripts/sandbox-probe.sh --list` prints the same table as Task 1's `core.sh` declares, unchanged by this task.
- **Deviations from plan:**
  - The controls-file read after a passing preflight runs on `preflight --job` as well as `run --job`, since a status 1 from it is a preflight refusal; a refusal goes through `sp_preflight_refuse`, which checks and releases the snapshot.
  - The `mode:` stamp line is also printed by the `refusal` subcommand (as `mode: clone layout`), so every run's record names its mode; `preflight` prints no stamp, as before.
  - `--runner-controls`, like `--job`, is a usage error on `refusal`, `judge` and `print-parity-script`.
  - The run loop's four mode-selection arms were read, not executed: each needs a passing preflight and a live session. Evidence rests on reading `scripts/sandbox-probe.sh` and on `bash scripts/typecheck.sh` (its shell-parse check covers the file); Tasks 16 and 17 own the tests.
</content>
</invoke>
