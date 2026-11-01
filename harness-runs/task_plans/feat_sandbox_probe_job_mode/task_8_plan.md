### Task 8 — Add the `runner-pid` (PN1–PN3) and `runner-privs` (NN1, NN2) legs

**Goal:** Take the two answers `fix_run_job_credential_exposure` (sandbox4, #144) needs from a GitHub-hosted runner, **measured, never cited**. The sandbox-runtime README's *"every sandbox this library starts has its own PID namespace and a fresh `/proc`"* is the expectation, not the result. Nothing documents no-new-privileges.

- **PN1:** a sandboxed call reads `/proc/<agent pid>/environ`, the agent CLI process that launched it. That is the parent its `$PPID` chain leads to, and the process holding the job's credential.
- **PN2:** the same read of `/proc/<probe pid>/environ`, a process outside the call's own tree that also carries the canary.
- **PN3:** `ls /proc` in a sandboxed call lists neither PID.
- **NN1:** a sandboxed `sudo -n true`, beside the workflow's own unsandboxed `sudo -n true` control. GitHub documents passwordless `sudo` on its hosted Linux runners, so the control is expected to succeed; if it did not, NN1 is `not run`, not a pass.
- **NN2:** `NoNewPrivs` from `/proc/self/status`, in a sandboxed call.

**No real secret is ever read by name or printed.** The workflow sets `SBX_PROBE_CANARY`, a non-secret value, in the probe's environment, and the agent CLI inherits it. Every read is `grep -a -c SBX_PROBE_CANARY= /proc/<pid>/environ`: a count, never the file, as S4 checks presence with `printenv <name> >/dev/null`. The kept streams then hold a number, not an environment.

**Depends on:**

- **Task 1:** the legs `runner-pid` (`PN1,PN2,PN3`) and `runner-privs` (`NN1,NN2`), each in `SP_LINUX_ONLY_LEGS` and `SP_JOB_ONLY_LEGS`; `SP_JOB_MODE`; and `sp_leg_mode_skip`.
- **Task 4:** `sp_session` replaces the token `@SP_AGENT_PID@` in the prompt and in every `--allowed` rule with the PID the agent CLI runs as, resolved in the launching subshell before `exec`, and writes it to `$SP_TMP/<session name>.agent-pid`.
- **Task 7:** `sp_runner_control <key>` prints a controls value, or `unrecorded` with status 1. NN1 reads `sudo-control`, `exit <n>`.

It reuses, unchanged: `session.sh` → `sp_session`, `sp_prompt_new`, `sp_prompt_bash`, `sp_departures`, `SP_RUN_PROFILE`, `SP_CLONE`, `SP_TMP`, `SP_DD_RULE` and `sp_dd_cmd`; `controls.sh` → the `written` control, `sp_ctl_held` and `sp_row_result`; `judge.sh` → `sp_judge_call`, `SP__TEXT`, `SP__STATUS`, `SP_LAYER`.

**Where this task stops.** One new library file. The canary's value is the workflow's to set (Task 14); its name is owned here. Tests are Task 20's.

### Targets

- `scripts/lib/sandbox-probe/legs-runner-isolation.sh` (new)

**Work:**

- [ ] **The header** states: the five rows and their expected results; the canary rule above; that every PID is resolved outside the call and spelled as a literal (PD3); that each measured call carries its own exact `--allowedTools` rule (PD17); that a call refused at the permission layer is `not run` (PD9); the grading functions with their signatures; and *SOURCED, NEVER EXECUTED … Bash 3.2 floor.* It declares `SP_RUNNER_CANARY_NAME=SBX_PROBE_CANARY`, the one spelling the workflow test reads back.
- [ ] **`sp__pn_read_grade <stream> <command>`** sets `SP_VERDICT` and `SP_EVIDENCE` for PN1 and PN2. Judge the call at `ran`, then:
  - refused at the permission layer → `not run`;
  - a first output line that is an integer of 1 or more → `fail`: *the canary was readable in /proc/<pid>/environ (count <n>)*;
  - an error carrying `No such file or directory` → `pass`, *the process is not visible from the call*;
  - an error carrying `Permission denied` → `pass`, *its environ is not readable from the call*;
  - `0` → `not run`, *the environ was readable but the canary was not in it, so the read proves nothing*;
  - anything else → `not run`, quoting the first line.
- [ ] **`sp__pn3_grade <stream> <command> <agent pid> <probe pid>`** reads the `ls /proc` result's whitespace-separated words:
  - either PID listed as a word → `fail`, naming it;
  - neither, and at least one numeric entry listed → `pass`, recording how many numeric entries the call saw;
  - no numeric entry, or a permission-layer refusal → `not run`.
- [ ] **NN's two grades.**
  - **`sp__nn1_grade <stream> <command> <sudo-control>`**:
    - the control is not `exit 0` → `not run`, *the workflow's unsandboxed sudo -n true did not succeed (<value>), so a refusal here proves nothing*;
    - the sandboxed call ran without error → `fail`, *sudo succeeded inside the sandbox*;
    - it errored → `pass`, quoting its message line through `sp__message_line`;
    - a permission-layer refusal → `not run`.
  - **`sp__nn2_grade <stream> <command>`**: the result's `NoNewPrivs:` line reads `1` → `pass`; `0` → `fail`; anything else → `not run`, quoting it.
- [ ] **The two leg functions.** Each prints its rows through `sp_leg_mode_skip` outside job mode (*job mode only*), and stops there.
  - **`sp_leg_runner_pid`.**
    - **Before the session, outside it:** when `printenv "$SP_RUNNER_CANARY_NAME" >/dev/null` fails, print all three rows `not run`, *the workflow set no canary*. Take the probe's PID from `$$`.
    - **The session** `runner-pid`, on `SP_RUN_PROFILE`, cwd `SP_CLONE`. Its prompt issues, in order:
      - `grep -a -c SBX_PROBE_CANARY= /proc/@SP_AGENT_PID@/environ`;
      - `grep -a -c SBX_PROBE_CANARY= /proc/<probe pid>/environ`;
      - `ls /proc`;
      - the in-session control `grep -a -c PATH= /proc/self/environ`, which proves an `environ` read works inside the call;
      - the `written` `dd` control.

      Each call carries its own exact `--allowed` rule, `Bash(<that exact command>)`, plus `SP_DD_RULE`.
    - **Grading:** read the agent PID back from `$SP_TMP/runner-pid.agent-pid`. Grade PN1–PN3. Print each through `sp_row_result`, so a failed control makes a refusal row `not run`. A row whose grade is `fail` goes through `sp_row_result --direct`, because a readable canary needs no control.
  - **`sp_leg_runner_privs`.**
    - With no controls file read, print both rows `not run`, *no runner controls file*.
    - Otherwise run the session `runner-privs`, on `SP_RUN_PROFILE`. It issues `sudo -n true` and `grep NoNewPrivs /proc/self/status`, each with its own exact rule, then the `written` `dd` control. Grade, and print NN1 and NN2 through `sp_row_result`.

**Verification:**

- The type check passes.
- `grep -nE 'printenv [A-Z_]+$|cat /proc|environ"?$' scripts/lib/sandbox-probe/legs-runner-isolation.sh` finds no call that would print an environment or a variable's value: every `environ` read is a `grep -a -c` and every presence check is redirected to `/dev/null`.
- By hand, with a one-line stream fixture of your own under `${TMPDIR:-/tmp}`, `sp__nn2_grade` on a result `NoNewPrivs:\t1` prints `pass`, and `sp__pn_read_grade` on a result `1` prints `fail`.
</content>
</invoke>
