### Task 4 — Hook job mode into the session API, and resolve the agent CLI's PID at launch

**Goal:** Make `scripts/lib/sandbox-probe/session.sh` run job mode through the same functions every leg already calls, so no leg needs a second launcher. Four hooks into `job.sh`, plus one new launch-time substitution the PID-namespace leg needs:

1. `sp_setup` hands off to `sp_job_setup` after its configured reads.
2. `sp_launch_args` appends the job tail. It is **extended, not forked**, so the headless sessions and the parity checklist cannot drift.
3. `sp_session` writes the job-mode manifest before each launch.
4. `sp_teardown` sweeps and switches back before its clone loop.
5. `sp_session` replaces the token `@SP_AGENT_PID@` in the prompt and in every `--allowed` rule with the PID the agent CLI will run as. That PID is resolved in the launching subshell itself, before `exec`, so the value is spelled as a literal in the call (PD3) and the session's exact rule matches it (PD17).

**Depends on:** Task 2, whose `job.sh` provides:

- `sp_job_setup` (status 0, or 2 having printed its refusal), which sets `SP_RUN_PROFILE`, `SP_CLONE`, `SP_JOB_BASE_PROFILE` and `SP_JOB_ORIG_BRANCH`;
- `sp_job_add_dirs <base profile> <cwd> <state root>`, which sets the array `SP_JOB_ADD_DIRS`;
- `sp_job_manifest_write <settings file> <add-dir root>...`;
- `sp_job_teardown`.

Each is a no-op when `SP_JOB_MODE` is not `1`. Task 1 declares `SP_JOB_MODE` in `core.sh`.

**Where this task stops.** It edits `session.sh` only. Which legs put `@SP_AGENT_PID@` in a prompt is Task 8's. Tests are Task 18's (launch line, manifest, token) and Task 17's (setup, teardown).

### Targets

- `scripts/lib/sandbox-probe/session.sh`

**Work:**

- [ ] **`sp_setup`.** After the configured reads (`SP_STATE_DIR`, `SP_REGISTRY`, `SP_AGENT_MODEL`, `SP_AGENT_EFFORT`, `SP_SCRIPTS`, `SP_SLUG`) and the probe-branch name, and before `sp__branch_taken` and the clone cut, add: `if [ "$SP_JOB_MODE" = 1 ]; then sp__install_trap; sp_job_setup; return $?; fi`. The trap is installed first, so a refusal after the branch is cut still tears down. The header's *THE SESSION API* states that in job mode `SP_CLONE` is the checkout, `SP_RUN_PROFILE` is its base profile, and no clone or per-run profile exists.
- [ ] **`sp_launch_args`.** After the two fixed `--add-dir` entries, when `SP_JOB_MODE` is `1`, call `sp_job_add_dirs "$SP_JOB_BASE_PROFILE" "$3" "$4/$5"` and append one `--add-dir <dir>` per `SP_JOB_ADD_DIRS` entry, in order. Use the `${arr[@]+…}` form for the empty array, as the watcher does on the 3.2 floor. Its doc comment names the watcher's `JOB MODE ONLY` tail as what it mirrors.
- [ ] **`sp_session`.**
  - **The manifest.** After `sp_launch_args` and before the launch, when `SP_JOB_MODE` is `1`, call `sp_job_manifest_write "$settings" "$cwd" "$SP_MAIN/$SP_STATE_DIR"`, followed by each `SP_JOB_ADD_DIRS` entry. Every `--add-dir` root is passed, so each root's `.mcp.json` is recorded, as `spawn_engine` records them.
  - **The token.** Inside the launching subshell, before `exec`, when the prompt or any `--allowed` rule carries `@SP_AGENT_PID@`:
    - read the subshell's own PID with a portable form that works on bash 3.2, which has no `BASHPID`: `sh -c 'echo "$PPID"'`;
    - replace every occurrence of the token in the prompt and in every `--allowedTools` value;
    - write the PID to `$SP_TMP/<name>.agent-pid`, so the leg can name it in its evidence.

    A prompt without the token launches exactly as today. The header states that after `exec` the agent CLI holds that PID, and that a CLI launched through a wrapper that forks would hold another. The leg's evidence names the PID it read either way.
- [ ] **`sp_teardown`.** After the pending-restore block and before the clone loop, call `sp_job_teardown` when it is defined. In job mode the clone loop then finds no registered clone and removes no per-run profile. The tracked-branch pass deletes the probe branch, now no longer checked out, locally and on origin. The header's teardown description names the new step.
- [ ] **The evidence directory's containment check.** `sp__td_keep_evidence` already refuses an evidence directory inside `SP_MAIN` or `SP_CLONE`. In job mode both are the checkout, so it holds unchanged. Add one header sentence saying so, and no code.

**Verification:**

- The type check passes.
- `git diff scripts/lib/sandbox-probe/session.sh` shows every behavioural change behind an `SP_JOB_MODE` test or the `@SP_AGENT_PID@` token's presence, and `sp_launch_args`' clone-layout output unchanged.
- By hand, `bash -c '. scripts/lib/sandbox-probe/core.sh; . scripts/lib/sandbox-probe/session.sh; SP_AGENT_MODEL=opus; sp_launch_args s dontAsk /w /m harness-runs; printf "%s\n" "${SP_LAUNCH_ARGS[@]}"'` prints the same ten arguments as before this task, ending `--add-dir`, `/w`, `--add-dir`, `/m/harness-runs`.
  - **Deviations from plan:** The by-hand check was refused as a direct `/bin/bash -c` call, so the implementer ran the same script under `/bin/bash` (3.2.57) from a probe, `bash scripts/scratch-run.sh harness-runs/scratch/launch_args_probe.py`. It printed the ten arguments `--settings s --permission-mode dontAsk --model opus --add-dir /w --add-dir /m/harness-runs`. The same probe also checked three more cases. Job mode with a base profile whose `additionalDirectories` is `["/w","/plug/a","","/plug/b/"]` appended `--add-dir /plug/a --add-dir /plug/b/`. An `sp_session` whose prompt and `--allowed` rule carried `@SP_AGENT_PID@`, launched on a fake CLI that prints its own PID, showed the CLI's PID in the prompt, in the rule and in `<name>.agent-pid`. A prompt without the token launched with no substitution and no `.agent-pid` file. An earlier probe, `harness-runs/scratch/agent_pid_probe.py`, confirmed on bash 3.2 that `sh -c 'echo "$PPID"'` run in the subshell returns the PID that `exec` keeps. The implementer could not remove either probe file because the `rm` was refused. Both are under the ignored `harness-runs/scratch/*`, so neither can be committed. The job-mode manifest call was not exercised on a placeholder host; Task 18 tests it.
</content>
</invoke>
