### Task 7 — PD31's fixtures: the indirected commands, their allow rules, the PID substitution and the grading

**Goal:** Hold Task 6's route with fixtures. Neither leg may put a `/proc` path into a command string the permission layer judges. The agent PID must reach the script file. Grading must still read the counts and refusals correctly, and still call a permission-layer refusal `not run`.

**Depends on:** Task 6, which changes `scripts/lib/sandbox-probe/legs-runner-isolation.sh` and `scripts/lib/sandbox-probe/session.sh` to these shapes:

- **The script files.**
  - `runner-pid` writes `<SP_CLONE>/sbx_pn_agent.sh` (carrying `@SP_AGENT_PID@`), `sbx_pn_probe.sh`, `sbx_pn_ls.sh` and `sbx_pn_self.sh`.
  - `runner-privs` writes `<SP_CLONE>/sbx_nn_nnp.sh`.
  - Each holds one line. The three environ files hold `grep -a -c <name>= /proc/<pid|self>/environ`; the other two hold `ls /proc` and `grep NoNewPrivs /proc/self/status`.
- **The calls and rules.** The session's calls are `bash <absolute file path>`, each with the `--allowedTools` rule `Bash(bash <absolute file path>)`. NN1's `sudo -n true` and the `dd` control are unchanged.
- **The PID substitution.** `sp_session` takes `--token-file <path>` (repeatable). It replaces `@SP_AGENT_PID@` in each file with the PID it writes to `SP_TMP/<name>.agent-pid`, before `exec`. A missing file exits 96 with a message naming it.
- **The grading.** It judges the `bash <file>` command and names the `/proc` path in its evidence. A permission-layer refusal is still `not run` (PD9).
- **Cleanup.** The files are removed after the leg, and only if the probe created them.

### Targets

- `cli/test/sandbox-probe-runner-legs.test.mjs`: new PD31 cases, and any existing case whose recorded command or allow rule names a `/proc` path directly.

**Work:**

- [x] Existing cases: update every expected `--allowedTools` rule or prompt line that spells a `/proc` command directly to the `bash <file>` shape. Change nothing else in them.
- [x] Case `PD31: no runner-pid or runner-privs prompt or allow rule names a /proc path`. Drive both legs under the suite's existing agent-CLI stub, read the prompt files and `sp_departures`, and assert: no `/proc` substring in either; each expected script file existed during the session and held exactly its one command line; and the files are gone afterwards.
- [x] Case `PD31: sp_session replaces @SP_AGENT_PID@ in a --token-file before the agent starts`. The stub CLI reads `sbx_pn_agent.sh` and records its line. That line names the PID `SP_TMP/runner-pid.agent-pid` holds. A missing `--token-file` path exits 96 with the path named.
- [x] Case `PD31: the graders judge the bash call and quote the /proc path`. Use streams in which the `bash <file>` call answers a count `≥ 1`, `No such file or directory`, `Permission denied`, `0`, a permission-layer refusal, and `NoNewPrivs:\t1`. The verdicts are `fail`, `pass`, `pass`, `not run`, `not run` and `pass`, each evidence naming the `/proc` path rather than the script path.
- [x] Case `PD31: a script path that exists before the session prints the leg's rows not run and removes nothing`.

**Verification:**

- `cli/test/sandbox-probe-runner-legs.test.mjs` passes.
- The PD31 cases fail when Task 6's `--token-file` substitution is removed. Check this once with a throwaway edit in a copy of `session.sh` the case sources, then restore.

**Deviations from plan:**

- Work item 1 changed nothing. No existing case spells a `/proc` command as an `--allowedTools` rule or a prompt line, because none of them drives a session. The existing grader cases pass a direct `/proc` command as the grader's `<command>` argument. Task 6 kept that form working by making the `/proc` path an optional argument, so those cases were left as they were.
- "The suite's existing agent-CLI stub" did not exist: this suite had no stub. The PD31 block adds one, `legFixture`, copied from the `agentFixture` stub in `cli/test/sandbox-probe-job-launch.test.mjs`. The stub also copies every `sbx_*.sh` in its working directory, which is how the case sees the script files' contents during the session. `legRun` replaces `sp_launch_args` and `sp_job_manifest_write` with no-op stubs inside the case, the same way Task 6's probe did, and reads a full controls file so that `runner-privs` gets past its controls gate.
- The grader case builds its `bash <file>` streams in the case directory, from the existing `runner-pn-*` and `runner-nn2-set` fixtures with the recorded command rewritten. It adds no fixture files.
- The pre-existing-path case covers both legs: `sbx_pn_ls.sh` for `runner-pid` and `sbx_nn_nnp.sh` for `runner-privs`.
- Mutation check: the throwaway edit went into `scripts/lib/sandbox-probe/session.sh` itself, not into a copy, because the suite sources the library from `WORKSPACE_ROOT`. The script was `harness-runs/scratch/task7_token_file_mutation.mjs`, run through `scripts/scratch-run.sh`. It removed the `for tf in …` substitution loop, ran the suite and restored the file in a `finally`. Result: `# tests 50`, `# pass 47`, `# fail 3`. The two session-driving PD31 cases failed. The grader case and the pre-existing-path case passed, because neither depends on the substitution. The script printed `restored: true`, and `git status` afterwards showed only the test file modified.
