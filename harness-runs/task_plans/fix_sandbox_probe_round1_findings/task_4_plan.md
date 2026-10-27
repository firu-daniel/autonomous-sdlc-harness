### Task 4 — Fix T2's result line and run the gates through `run-test-suite.sh`, give W7 a debug log, and spell TD2's control as a literal

**Goal:** Make three legs in `scripts/lib/sandbox-probe/legs-local.sh` gradeable.

- **T2** (defects 1 and 2). Its result line is no longer fused. The gates are measured sandboxed in a form that can complete: the run form of `run-test-suite.sh` plus bounded `--wait` collection, judged from the lane's verdict and log.
- **W7** (defect 12). Its session gets a debug log for W8.
- **TD2** (defect 3). The positive control is spelled as a literal path that `Bash(mktemp:*)` matches, and a call refused at the permission layer grades `not run`, never `fail`.

**Depends on:**

- **Task 1.** `sp_result_line` now refuses a row not in the leg's rows. The `gates` leg's expected text names *"started in the clone through run-test-suite.sh and collected with --wait"*, and the `mktemp` leg's names *"the explicit form spelled with the session's TMPDIR as a literal path"*.
- **Task 3.** `sp_keep_file <path>` registers an extra evidence file for the current leg. `sp_session` records `--debug-file` paths.

**Where this layer stops.**

- This task exports `SP_W7_DEBUG`, and **Task 5** reads it. W8's grading of the two logs is Task 5's.
- **Task 13** tests the three grading functions below by sourcing `core.sh`, `judge.sh`, `controls.sh` and this file. So each function calls only functions from those files, never `sp_session`, `hr_*` or `sp_track`.
- **Task 16** amends T2's, TD2's and W7's rows.

### Targets

- `scripts/lib/sandbox-probe/legs-local.sh`: `sp_leg_gates`, `sp_leg_mktemp`, three new grading functions, and the header.

**Work:**

- [ ] **T2's call and session.**
  - Fix the fused argument: `sp_result_line gates T2 "$verdict" …`.
  - Replace the single foreground `bash $scripts_rel/test.sh` with one session, cwd = the clone, on `SP_RUN_PROFILE`. Its calls are:
    - `bash $scripts_rel/run-test-suite.sh sbx_probe_t2`, the run form;
    - then `bash $scripts_rel/run-test-suite.sh --wait sbx_probe_t2`.
  - Append one sentence after `sp_prompt_new`'s preamble. It names the `--wait` call as the one exception to *"do not retry"*: issue it again, exactly as written, each time it prints `pending`, until it prints anything else, at most `SP_T2_MAX_WAITS` times (a named constant, 40). This is the Run gates phase's own collection shape (`docs/sandbox-verification.md` §7 OR6).
  - After the session, the lane is `$SP_CLONE/<state dir>/test_run_logs/<hr_sanitize_branch SP_BRANCH>/sbx_probe_t2.{verdict,log,running}`. If `.verdict` is absent while `.running` exists, the probe polls for `.verdict` itself before grading. It polls every 5 s, up to `SP_T2_COLLECT_SECONDS` (a named constant, 1800), so teardown never removes the clone under a live gate worker. A verdict collected this way is graded the same, and its evidence says the probe collected it.
  - Copy the `.log` to `$SP_TMP/gates-t2.lane.log` and pass that copy to `sp_keep_file`.
- [ ] **`sp__t2_grade <stream> <run command> <verdict file> <log file>`.** It sets `SP_VERDICT` and `SP_EVIDENCE`:
  - The run command is absent from the stream, or answered at the permission layer (`sp_judge_call … ran`, then `SP_LAYER`) → `not run`, quoting the judge's evidence.
  - No verdict file → `not run`: `no verdict for the gate run: …`. Name whether the log exists.
  - A verdict line `pass` → `pass`, evidence `run-test-suite.sh verdict pass`.
  - A verdict line `fail <path>` → `fail`. The evidence is the log's first line carrying `mkstemp failed` or `Operation not permitted`. If there is none, it is the first `== run-test-suite.sh: gate … exited <n> ==` line with a non-zero `<n>`. Either way, add `; compare with the same call unsandboxed on the same tree before filing its row`.
  - Any other verdict line → `not run`, quoting it.
  - In every case, append the count of log lines carrying `<sandbox_violations>` or `host is not on the allow list`, and the first such line. These lines are **recorded, never graded**: the prompt's outbound `api.anthropic.com` / `datadoghq.com` denials.
- [ ] **W7's debug log.**
  - Launch W7's session with `--debug-file "$SP_TMP/gates-w7.debug.log"`.
  - Once that session has launched, set the global `SP_W7_DEBUG="$SP_TMP/gates-w7.debug.log"`. Leave it empty when the gates leg returns before launching it, and initialise it to `""` at the top of the file.
  - W7's departure now names the `--debug-file`, as the write-protection leg's does.
  - W7's grading is unchanged.
- [ ] **TD2's literal control.** Split the leg into two sessions:
  - **Session `mktemp-tmpdir`**, through `--allowed "Bash(printenv TMPDIR)"`, one call: `printenv TMPDIR`.
  - **Session `mktemp-td2`**, through `--allowed "Bash(mktemp:*)"`, four calls: `mktemp`, `mktemp -d`, `mktemp -t harness-gates`, and `mktemp <tmpdir>/harness-gates.XXXXXX`, with `<tmpdir>` the literal path from `sp__td2_tmpdir`.
  - `sp__td2_tmpdir <stream> <command>` prints the TMPDIR the session's call printed, without a trailing slash. It returns status 1 when:
    - the call is absent or not layer `ran`;
    - or its first line is not an absolute path;
    - or it fails `sp__ctl_literal`.
  - On status 1, TD2 prints `not run` with `the session's TMPDIR could not be read as a literal path: …` and the second session is not launched.
  - Keep the existing cleanup of whatever a form created: `sp_track` a file, `rmdir` an empty directory. It happens in the leg, after grading.
- [ ] **`sp__td2_grade <stream> <tmpdir>`.** It sets `SP_VERDICT` and `SP_EVIDENCE` from the four exact commands above:
  - **Any of the four answered at the permission layer → `not run`**, naming it: `<form>: refused at the permission layer, so it never reached the sandbox: …`. This is defect 3's rule, applied to the control and to the measured forms alike.
  - Otherwise `fail` when any of these holds:
    - a bare, `-d` or `-t` form ran;
    - or it was refused without `mkstemp failed` or `mkdtemp failed`;
    - or the explicit form did not print a path under `<tmpdir>/harness-gates.`.
  - Otherwise `not run` when any call is absent.
  - Otherwise `pass`.
  - Evidence: one clause per form in the order bare, `-d`, `-t`, explicit (`<form>: <layer> <first line>`).
  - Update the header to name both sessions, the `printenv TMPDIR` departure, T2's route and the three functions.

**Verification:**

- `grep -n 'T2"' scripts/lib/sandbox-probe/legs-local.sh` finds nothing, and every `sp_result_line` / `sp_row_result` in the file names `T2`, `W7` or `TD2` with its leg (or `SR1`, `SR2`, `MC1`, unchanged).
- No call in either TD2 session carries a `$`, a `{` or a quote. The four `mktemp` commands are literals that `Bash(mktemp:*)` matches.
- Each grading function reads only its arguments and the stream. None calls `sp_session`, `sp_track`, `sp_keep_file` or an `hr_` function (`grep -n` within each function body).
