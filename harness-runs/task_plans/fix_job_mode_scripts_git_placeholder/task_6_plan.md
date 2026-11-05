### Task 6 — PD31: run the probe's `/proc` reads and their controls through probe-written scripts

**Goal:** In round 14, every Bash call in `runner-pid` and `runner-privs` that named a `/proc` path was refused at the permission layer in `dontAsk` mode, although each was named verbatim in `--allowedTools`. The refused calls were `grep -a -c SBX_PROBE_CANARY= /proc/<pid>/environ`, `ls /proc`, the control `grep -a -c PATH= /proc/self/environ`, and `grep NoNewPrivs /proc/self/status`. So PN1–PN3 and NN2 printed `not run`. The same sessions' `dd` and `sudo -n true` calls ran. This task routes each `/proc` read, and its control, through a one-line script the probe writes into its checkout, so that the session's command string names no `/proc` path. The read itself still runs inside the sandboxed Bash call. Each control stays in the same session as its probe.

**Where this task stops.** It changes the probe's two legs and the session launcher. **Task 7** writes the fixtures in `cli/test/sandbox-probe-runner-legs.test.mjs`, and needs the names and shapes below exactly. Whether Claude Code 2.1.318 allows the route on a runner is the story index's manual step 1, not something this task can show.

### Targets

- `scripts/lib/sandbox-probe/legs-runner-isolation.sh`: `sp_leg_runner_pid`, `sp_leg_runner_privs`, the header, and whichever grading signatures need the `/proc` path passed separately.
- `scripts/lib/sandbox-probe/session.sh`: `sp_session`, and its usage lines in the header.

**The shapes Task 7 tests:**

- **The script files.** The probe writes these before the session, through the existing `sp__runner_ctl_path` check (the path must be spellable as one literal and absent beforehand, or the leg prints its rows `not run`):
  - `runner-pid`: `<SP_CLONE>/sbx_pn_agent.sh`, `sbx_pn_probe.sh`, `sbx_pn_ls.sh` and `sbx_pn_self.sh`.
  - `runner-privs`: `<SP_CLONE>/sbx_nn_nnp.sh`.

  Each holds exactly one command line: today's command, unchanged. That is `sp__environ_count_cmd`'s output for the three environ reads, `ls /proc`, and `grep NoNewPrivs /proc/self/status`. The canary rule is kept: a count, never the file.
- **The calls.** The session's call for each is `bash <that file's absolute path>`. Its `--allowedTools` rule is `Bash(bash <that path>)`, one rule per file, so `sp_departures` records the departures.
- **The agent PID.** `sbx_pn_agent.sh` carries `@SP_AGENT_PID@`. `sp_session` gains the option `--token-file <path>`, repeatable. In its launching subshell, after the PID is read and before `exec`, it replaces `@SP_AGENT_PID@` in each named file with that same PID, as it does in the prompt. A missing or unwritable file exits 96 with a message naming it, as the PID failure does today.
- **The grading.** It judges the `bash <file>` command (`sp_judge_call`). A call refused at the permission layer is still `not run` (PD9). The evidence still names the `/proc` path read. Pass that path to the graders separately, because `sp__pn_read_grade` currently takes it from the command's last word. The `sudo -n true` call (NN1) and the `dd` control are unchanged.
- **Cleanup.** Every script file is removed after the session, on each exit path of the leg, and only if the probe created it.

**Work:**

- [ ] `session.sh` → `sp_session`: add `--token-file <path>` (repeatable, validated like `--cwd`), and the substitution in the launching subshell. Add the option to the usage comment and to the header's `sp_session` line.
- [ ] `legs-runner-isolation.sh` → `sp_leg_runner_pid`: write the four files, prompt `bash <file>` for each, pass `--allowed "Bash(bash <file>)"` for each and `--token-file` for `sbx_pn_agent.sh`, grade PN1–PN3 on the `bash` commands with the `/proc` paths as evidence, and remove the files. The `sp_ctl_add … ran` control is the `bash <sbx_pn_self.sh>` call.
- [ ] `legs-runner-isolation.sh` → `sp_leg_runner_privs`: the same for `sbx_nn_nnp.sh` and NN2. NN1's `sudo -n true` call stays as written.
- [ ] `legs-runner-isolation.sh` header: replace *"Each measured call carries its own exact `--allowedTools` rule, `Bash(<that exact command>)` (PD17)"* with the indirection and its reason, PD31. Quote the refusal *"Permission to use Bash has been denied because Claude Code is running in don't ask mode"*, and record that the route is not yet measured on a runner.

**Verification:**

- `bash -n` parses both files.
- Read the prompt file a dry `runner-pid` setup writes: it contains no `/proc` substring. Each `/proc` read appears only inside the script files, one line each.
- `grep -n '/proc' scripts/lib/sandbox-probe/legs-runner-isolation.sh` shows every `/proc` command reaching the session only through a written file, never through `sp_prompt_bash` directly.
