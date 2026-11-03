### Task 9 — Add the probe's `gate-sandbox` leg (GS1–GS4 and WF5), and take WF5 out of the `detached` leg

**Goal:** On Linux, one leg measures the ruling's four claims about the launcher's sandbox (`harness-runs/clarifications/fix_linux_detached_gate_run/answer_1.md`, *Proof*). It does so through the real launcher, a real session and a gate command the probe writes:

- **GS1.** The worker outlives the call and the session, and yields a verdict.
- **GS2.** A write outside the worker's roots, and a write to a protected path inside the target, is refused, graded on what reached the disk.
- **GS3.** A network call is refused.
- **GS4.** A denied credential path and the denied token variables cannot be read.

It also takes **WF5**: `hr_lane_mtime`'s GNU `stat -c %Y` arm advances, read inside the launcher's worker. That is now where a Linux gate run's heartbeat lives. WF5 leaves the `detached` leg, whose sandboxed worker dies with its call (F10), so WF5 could never be read there.

The leg runs in the clone layout and in job mode. In both, the target is `SP_CLONE`, which job mode sets to the checkout itself (`scripts/lib/sandbox-probe/job.sh`). So job mode measures the launcher's main-checkout arm, the arm a real job takes.

**Depends on:**

- **Task 2,** the launcher. `launch-sandboxed-gates.sh <target> <label>` prints `pending` (exit 3), `in-session` (exit 4), or a refusal (exit 2). It starts `bash <target>/<scripts_dir>/run-test-suite.sh --no-detach <label>` under `bwrap` with:
  - no network;
  - the target the only writable root;
  - the session profile's protected paths under the target read-only;
  - `/tmp` a private tmpfs;
  - every base `sandbox.credentials.files` path masked;
  - every `envVars` name unset.

  The worker reads the target's `harness.config.json` inside the sandbox.
- **Task 1,** the `--no-detach` form, which runs `commands.test` in the worker's own process and writes `.verdict` when it ends.
- **Task 7,** which puts the launcher in the main checkout the probe runs from.

The leg's declaration, its sourcing and Gate 15's tables are **Task 10's**. The tests of every grading function here are **Task 13's**, which reads the signatures below.

**This is a catch-all task** (`path` `"."`). Its implementer reads every configured layer's conventions document.

### Targets

- `scripts/lib/sandbox-probe/legs-gate-sandbox.sh` (new): `sp_leg_gate_sandbox`, its helpers and grading functions, and `sp__wf5_grade`, moved here.
- `scripts/lib/sandbox-probe/legs-detached.sh`: drop WF5.

**Work:**

- [ ] **The file and its worker script.** Write `legs-gate-sandbox.sh` in the probe's file form: the header, *THE GRADING FUNCTIONS*, sourced and never executed, setting no shell option, Bash 3.2 floor.
  - **Constants:** `SP_GS_LABEL=sbx_probe_gs`, and `SP_GS_HOLD_SECONDS=60`, declared a mirror of `SP_BG9_SECONDS` and its reasoning.
  - **`sp__gs2_outside_paths <target> <main> <home>`** prints GS2's outside paths, one per line, each lying outside `<target>` in both layouts. The target is the only writable root of the worker's sandbox, so a path under it would land by design and grade a correct sandbox `fail`:
    - **Always:** `<home>/sbx_gs2_home.txt`, and `<dirname of target>/sbx_gs2_parent.txt`, the target's parent directory, which `--ro-bind / /` leaves read-only in both layouts.
    - **Clone layout only** (`<main>` is not `<target>`): `<main>/sbx_gs2_main.txt`, the main checkout, outside a clone.
    - **Job mode** (`<main>` equals `<target>`, because `job.sh` sets `SP_CLONE="$SP_MAIN"`): the main-checkout path is dropped, since it lies inside the target there. The parent-directory path stands in for it.
    - Any candidate equal to `<target>` or under `<target>/`, compared after `cd -P` on its directory, is dropped too, so a `$HOME` inside the target can never be graded. Each dropped path is printed on stderr as `dropped <path>: inside the target`, and the leg copies that into GS2's evidence. An empty list makes GS2 `not run`.
  - **`sp__gs_test_script <path> <target> <records dir> <running file> <run library> <outside paths file> [<env name>...]`** (the outside paths file holds `sp__gs2_outside_paths`' output; the env names are the base profile's `.sandbox.credentials.envVars[].name`, read by the leg with `jq`) writes the gate command's script, every path a `%q` literal, in `sp__bg9_helpers`' style. **Every step's reading is stored in full**, never cut at the source (`harness-runs/lessons.md` → `## Evidence and measurement`: truncation belongs to a display, never to the record a verdict is read from). Each step `<step>` writes, under `<records dir>`, `<step>.status` holding its exit status, `<step>.stderr` holding its whole stderr, and `<step>.stdout` holding its whole stdout where the step has any that is not already its named output file. No step stops the script:
    1. **WF5 (`wf5_stat`, `wf5`):** run `stat -f %m <running file>` once as step `wf5_stat`, its whole stdout, stderr and status stored as above. Then write `wf5.mtimes` in the line shape the moved `sp__wf5_grade` parses: `stat -f %m: <first line of wf5_stat.stdout>`, then `mtime <n>` from `hr_lane_mtime <running file>` twice, 2 s apart, after sourcing `<run library>`. That first line is a display copy derived from the stored full reading, and the leg keeps `wf5_stat.stdout` beside it in WF5's evidence, so nothing is lost at the source.
    2. **The hold:** `sleep` `SP_GS_HOLD_SECONDS`, so the session has ended before anything else.
    3. **GS2 (`gs2_control`, `gs2_out_<n>`, `gs2_gitconfig`):** write `gs2_control.txt` under `<records dir>`; write each path of the outside paths file, the `<n>`th as step `gs2_out_<n>`; append `# sbx_gs2` to `<target>/.git/config`. Use `printf` redirections.
    4. **GS3 (`gs3`):** `curl -sS --max-time 5 -o <records dir>/gs3.body https://example.com/`.
    5. **GS4 (`gs4_ssh`, `gs4_control`):** `cat "$HOME/.ssh/config"` into `gs4.ssh` (empty when refused), and for each base `envVars` name passed in, one `<name> set` or `<name> unset` line, never a value, into `gs4.env`. Then the control: `cat <target>/harness.config.json` into `gs4.control`.
    6. `: > <records dir>/done`, then `exit 0`.
- [ ] **The grading functions.** Each reads only its arguments and the files they name, and sets `SP_VERDICT` and `SP_EVIDENCE`.
  - **`sp__gs1_grade <launch line> <verdict file> <done file> <session end epoch>`.**
    - not run: the launch line is not `pending`. Evidence: `the launcher answered '<line>', not pending`.
    - pass: `.verdict` reads `pass` and the done marker's `hr_lane_mtime` is at least the session end. Evidence: `the worker outlived the call and the session: verdict pass, its done marker written <n>s after the session ended`.
    - fail: no verdict, or one reading `fail …`, quoted. Evidence: `the launcher answered pending, and the worker did not reach a verdict: …`.
  - **`sp__gs2_grade <control file> <sha before> <sha after> <outside path>...`.** The outside paths are exactly `sp__gs2_outside_paths`' output for this layout: in the clone layout the home, parent-directory and main-checkout paths; in job mode the home and parent-directory paths.
    - not run: the control is absent, or no outside path was passed.
    - pass: the control exists, no outside path exists, and the two `.git/config` shasums are equal. The evidence lists every outside path checked, so the layout's list is visible in the record.
    - fail: any outside path exists, or the shasums differ. The evidence names each, and states that it was read on disk, never from an exit status (`harness-runs/lessons.md` → `## Evidence and measurement`). It may quote the matching `gs2_out_<n>.stderr` file for context; any shortening there is display, and the evidence says so (`stderr shown to its first line; full text in <file>`).
  - **`sp__gs3_grade <body file> <status file> <stderr file> <unsandboxed control code>`.**
    - not run: the control code, from `curl -sS --max-time 5 -o /dev/null -w '%{http_code}' https://example.com/` run by the probe's own shell, is `000` or empty.
    - fail: the body file is non-empty, a body came back.
    - pass: there is no body and the worker's curl status is non-zero. The evidence quotes `gs3.stderr`, read from the stored file in full. If the evidence sentence shortens it, the shortening is display only and the sentence says so, naming the file that holds the full text.
  - **`sp__gs4_grade <worker ssh copy> <host ssh file> <env record> <control file>`.**
    - not run: the host file is absent, or the control is empty.
    - fail: the worker's copy is non-empty and `cmp`-equal to the host file, or any env line reads `set`. The evidence names the variable, never a value.
    - pass otherwise.
    - The evidence never quotes either file's contents.
  - **`sp__wf5_grade <mtimes file> [<process kind>]`,** moved byte-for-byte from `legs-detached.sh`. Its pass sentence takes the kind, defaulting to `sandboxed`: `… advanced a..b in <kind> process …`. The leg passes `the launcher's sandboxed gate-worker`.
- [ ] **`sp_leg_gate_sandbox`.** The flow:
  1. Compute GS2's outside paths with `sp__gs2_outside_paths "$SP_CLONE" "$SP_MAIN" "$HOME"` into `$SP_TMP/gate-sandbox.outside`, keeping its stderr for GS2's evidence. Refuse every row `not run` with the reason, as `sp__bg9_both` does, when the target's `scriptsDir` or `stateDir` is unresolvable, or a path is not one literal word (`sp__ctl_literal`). Do the same when any of these exists before the session: the records directory `<target>/sbx_gs/`, the test script `<target>/sbx_gs_test.sh`, or any path in the outside list.
  2. Copy the target's `harness.config.json` to `$SP_TMP/gate-sandbox.config.json`. Rewrite the target's copy from the probe's own shell with `jq`: `.commands.typecheck = "<none>" | .commands.test = "bash <target>/sbx_gs_test.sh"`. This is the departure *"a fixture written from an ordinary terminal"* (§0).
  3. Write the test script, and `sp_track` it and the records directory.
  4. Record the target's `.git/config` shasum.
  5. Launch one session, `gate-sandbox`, on `SP_RUN_PROFILE` with `--cwd "$SP_CLONE"`. Its prompt issues one call, `bash $SP_SCRIPTS/launch-sandboxed-gates.sh $SP_CLONE $SP_GS_LABEL`, and no `--allowed` rule: the profile allows it. Record the session's end epoch, and the launch line through `sp_judge_call … ran` and `sp__first_line`.
  6. Poll for `.verdict` for at most `SP_GS_HOLD_SECONDS + 60` seconds. Track no PID: the worker's PID is a namespace PID.
  7. Take the control curl, and the shasum after.
  8. Grade and print GS1, GS2, GS3, GS4 and WF5 through `sp_row_result`, GS2 with the outside list from step 1. Keep every file of the records directory, whole, and the lane log in the evidence (`sp_keep_file`), as `legs-detached.sh` keeps its `.mtimes` file.
  9. **On every path**, restore `harness.config.json` byte-identically from the saved copy, and check it with `cmp`. A failing `cmp` is `sp_refuse` plus `sp_exit_raise 3`, which is the shasum guard's class. Remove what the leg created: a path in `$SP_TMP/gate-sandbox.outside` only, and only because step 1's pre-check found it absent, so in job mode the main checkout is never touched by this cleanup. A `.git/config` that changed is restored from the probe's own copy, saved before the session.
- [ ] **`legs-detached.sh` drops WF5.** Take out these, and keep BG9's session, prompt, helpers, grading and evidence byte-identical:
  - `sp__wf5_grade`, which moved;
  - the worker's `sbx_wf5.mtimes` writes in `sp__bg9_helpers`;
  - WF5's line in `sp__bg9_both` and in `sp_leg_detached`;
  - the `detached.wf5.mtimes` copy.

  Rewrite its header: the leg takes BG9 alone, F10's own fact, and WF5 moved to the `gate-sandbox` leg because on Linux the gate run's heartbeat now lives in the launcher's worker.

**Verification:**

- `bash scripts/typecheck.sh` passes. Its shell-parse gate covers both files under the Bash 3.2 floor.
- `git grep -n 'WF5\|wf5' -- scripts/lib/sandbox-probe/legs-detached.sh` hits only the header's sentence saying WF5 moved.
- `git diff -- scripts/lib/sandbox-probe/legs-detached.sh` leaves BG9's grading function and session lines unchanged. Read every hunk.
- `sp_leg_gate_sandbox` restores `harness.config.json` on every exit path. Read each `return` against the restore.
- In the written test script, no outside path GS2 writes lies under the target in either layout: read `sp__gs2_outside_paths` against `job.sh`'s `SP_CLONE="$SP_MAIN"`.
- `git grep -n -i 'first stderr line\|first line' -- scripts/lib/sandbox-probe/legs-gate-sandbox.sh` hits only the `wf5.mtimes` display line and evidence sentences that say their shortening is display.

**Deviations from plan:**

- `sp__wf5_grade`'s kind defaults to `a sandboxed`, not `sandboxed`: the pass sentence is `in <kind> process`, so this default keeps the moved function's default sentence byte-identical (`in a sandboxed process`), and the leg's `the launcher's sandboxed gate-worker` reads `in the launcher's sandboxed gate-worker process`.
- The launch line strips the Bash tool's bare `Exit code <n>` header (PD18) before `sp__first_line`. The launcher answers `pending` with exit 3, so `sp__first_line` alone would read `Exit code 3` and GS1 could never see `pending`. A call that did not run at all, or was refused at a layer, gives a launch line naming that layer instead.
- `sp__gs2_outside_paths` always offers `<main>/sbx_gs2_main.txt`. In job mode the inside-the-target rule drops it, with a `dropped … : inside the target` stderr line, so GS2's evidence shows the drop. It also drops a candidate whose directory does not exist (`dropped <path>: its directory does not exist`), because a write there fails whether or not there is a sandbox.
- The session-level gate `sp_row_result` reads (`SP_CTL_OK`) is set from the launch call: 1 when it ran, 0 with the launch line otherwise. Each row's own control is read inside its grading function, as the plan specifies. The leg prints every row with `--direct`, so a visible `fail` is never withheld.
- Grading arms the plan leaves unstated:
  - GS1 is `not run` when its verdict reads `pass` but the session end or the done marker cannot be read, or the done marker predates the session end.
  - GS2 is `not run` when a `.git/config` shasum is empty.
  - GS3 is `fail` when curl exits 0 with no body, and `not run` when `gs3.status` is absent or not an integer.
  - GS4's pass evidence says whether the worker's copy was empty or differed, and counts the unset names.
- Evidence is kept as copies under `$SP_TMP/gate-sandbox.records/`, and each copy goes through `sp_keep_file`. The originals in `<target>/sbx_gs/`, the lane's `.verdict` and `.log` are removed by the leg. `sp_rm_tree` refuses a directory outside `SP_TMP`, so the job-mode records directory in the main checkout has to be removed in-leg. The lane's `.verdict`, `.log` and lane directory are removed only when each was absent before the session.
- The worker reads which `envVars` names are set from `compgen -e`, the shell's list of exported names. That gives names only and never a value, and needs no `${!name}` indirection.
- `legs-detached.sh` also drops the `scriptsDir` / run-library plumbing. That is the `hr_scripts_dir` refusal, the `lib` literal check, the `lib=` line and the helper's fourth argument, and WF5 was their only reader. BG9's grading function, session, prompt, control and the worker's beat loop are unchanged.
- Evidence downgrade: the leg itself was not run. It needs Linux, `bwrap` and a real session, and its result is owed to Gate 15's container (story index, *Take the Linux results by hand*). The verification bullets above are reads plus `bash scripts/typecheck.sh`, run from the checkout root, which printed `PASS: typecheck` with `check-shell-parse: 107 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`.
