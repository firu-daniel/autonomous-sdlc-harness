### Task 13 — Test the `gate-sandbox` leg's grading and declaration, and move the WF5 cases with it

**Goal:** Pin the new leg's grading functions, each against fixtures, so none can grade a refusal, an absent control or a dead worker as a `pass`. Pin its declaration, so `--list`, the job legs, the Linux-only set and Gate 15's tables move together. The WF5 cases follow `sp__wf5_grade` to its new file.

**Depends on:**

- **Task 9.** `scripts/lib/sandbox-probe/legs-gate-sandbox.sh` defines these functions. Each reads only its arguments and the files they name, and sets `SP_VERDICT` and `SP_EVIDENCE`.
  - **`sp__gs1_grade <launch line> <verdict file> <done file> <session end epoch>`.**
    - not run: the line is not `pending`. Evidence: `the launcher answered '<line>', not pending`.
    - pass: the verdict reads `pass` and the done marker's mtime (`hr_lane_mtime`) is at least the session end. Evidence: `the worker outlived the call and the session: …`.
    - fail otherwise. Evidence: `the launcher answered pending, and the worker did not reach a verdict: …`, or the `fail …` line quoted.
  - **`sp__gs2_outside_paths <target> <main> <home>`** prints GS2's outside paths, one per line, none of them the target or under `<target>/`:
    - always `<home>/sbx_gs2_home.txt` and `<dirname of target>/sbx_gs2_parent.txt`;
    - `<main>/sbx_gs2_main.txt` only when `<main>` is not `<target>` (the clone layout). In job mode `job.sh` sets `SP_CLONE="$SP_MAIN"`, so the main-checkout path would lie inside the target, which the worker's sandbox binds writable, and it is dropped;
    - any other candidate under the target is dropped too, with `dropped <path>: inside the target` on stderr.
  - **`sp__gs2_grade <control file> <sha before> <sha after> <outside path>...`**, given exactly `sp__gs2_outside_paths`' output.
    - not run: no control, or no outside path passed.
    - pass: the control exists, no outside path exists and the shasums are equal; the evidence lists every path checked.
    - fail otherwise, naming each path or the changed `.git/config`.
  - **`sp__gs3_grade <body file> <status file> <stderr file> <unsandboxed control code>`.**
    - not run: the control code is `000` or empty.
    - fail: the body is non-empty.
    - pass: no body and a non-zero curl status. The evidence quotes the stderr file as stored; any shortening is display only and the sentence says so, naming the file.
  - **`sp__gs4_grade <worker ssh copy> <host ssh file> <env record> <control file>`.**
    - not run: the host file is absent or the control is empty.
    - fail: the worker's copy is non-empty and `cmp`-equal to the host file, or any `<name> set` line, the name given and never a value.
    - pass otherwise.
    - The evidence never quotes either file's contents.
  - **`sp__wf5_grade <mtimes file> [<process kind>]`,** moved from `legs-detached.sh` unchanged except the optional kind (default `sandboxed`) in its pass sentence, `… advanced a..b in <kind> process …`.
  - **`sp__gs_test_script <path> <target> <records dir> <running file> <run library> <outside paths file> [<env name>...]`** writes the gate command's script, every path `%q`-quoted. It writes one GS2 step per line of the outside paths file. Every step stores its reading in full, never cut at the source: `<records dir>/<step>.status`, `<step>.stderr` (the whole stderr) and `<step>.stdout` where the step has stdout of its own. The steps are `wf5_stat`, `gs2_control`, `gs2_out_<n>`, `gs2_gitconfig`, `gs3`, `gs4_ssh` and `gs4_control`; `wf5.mtimes` keeps the line shape `sp__wf5_grade` parses, its `stat -f %m:` line a display copy of `wf5_stat.stdout`'s first line.
- **Task 10.** `core.sh` declares `gate-sandbox` with rows `GS1,GS2,GS3,GS4,WF5`, after `detached`, whose rows are now `BG9`. It adds `gate-sandbox` to `SP_LINUX_ONLY_LEGS`, and declares job rows `detached BG9` and `gate-sandbox GS1,GS2,GS3,GS4,WF5`. `docs/development.md` Gate 15 restates them.

This task changes no probe file.

### Targets

- `cli/test/sandbox-probe-gate-sandbox-legs.test.mjs` (new).
- `cli/test/sandbox-probe-detached-loopback-legs.test.mjs`: the header, and the `sp__wf5_grade` cases, which move out.
- `cli/test/sandbox-probe-git-and-legs.test.mjs`: the leg-name lists, `JOB_LEGS`, and the Linux-only case's leg list and expected output.

**Work:**

- [ ] **The new suite's frame.** It runs `bash -c` through the `runBash` helper the sibling probe suites use, sourcing `core.sh`, `platform.sh`, `judge.sh`, `controls.sh`, `session.sh` and `legs-gate-sandbox.sh`, with `SP_PLATFORM=linux`. Every fixture is a `mkdtemp` under `os.tmpdir()`, removed in process.
  - **The header's rule:** a launcher answer other than `pending`, an absent control, or an exit status alone never grades a row `pass`, and the grading reads what reached the disk.
  - **The header's *left out deliberately*:** no case launches a session, the launcher or `bwrap`, so `sp_leg_gate_sandbox`'s wiring is exercised only by a hand-run probe.
- [ ] **GS1 and GS2 cases.**
  - **GS1:**
    - `in-session` → `not run`, quoting it;
    - `pending` with a `pass` verdict and a done marker touched after the session end → `pass`;
    - `pending` with no verdict file → `fail`;
    - `pending` with `fail <log>` → `fail`, quoting it.
  - **GS2's outside paths:**
    - **clone-shaped:** a `<target>` and a distinct sibling `<main>` under one fixture parent, and a `<home>` outside both → three lines: the home path, `<parent>/sbx_gs2_parent.txt` and `<main>/sbx_gs2_main.txt`;
    - **job-shaped:** `<main>` equal to `<target>` → two lines, the home and parent-directory paths, and no line under `<target>/`;
    - a `<home>` inside `<target>` → that path absent from stdout, and `dropped <path>: inside the target` on stderr.
  - **GS2's grade:**
    - the control present, every outside path absent and equal shasums → `pass`, its evidence listing each path;
    - one outside path present → `fail`, naming it;
    - differing shasums → `fail`, naming `.git/config`;
    - the control absent → `not run`;
    - **job-shaped:** the control present, the job-shaped list's two paths absent, equal shasums, and a file present at `<target>/sbx_gs2_main.txt` → `pass`, because that path is not an outside path in job mode and is not passed.
- [ ] **GS3, GS4 and the script.**
  - **GS3:**
    - an empty body, status `6`, a stderr file of three lines and control `200` → `pass`, its evidence quoting the stored stderr and, where it shows less than all three lines, saying the shortening is display and naming the stderr file;
    - a non-empty body → `fail`;
    - control `000` → `not run`.
  - **GS4:**
    - an empty copy beside a non-empty host file, `GH_TOKEN unset`, and a non-empty control → `pass`;
    - a copy equal to the host file → `fail`, its evidence not containing the file's text;
    - `NPM_TOKEN set` → `fail`, naming `NPM_TOKEN` only;
    - a host file absent → `not run`.
  - **`sp__gs_test_script`:** the written file parses with `bash -n`; it carries each path argument and env name once, and one GS2 write per line of a two-line (job-shaped) outside paths file; it contains no `$HOME` expansion of the probe's own `HOME` baked in for the GS4 read, which reads `$HOME` at run time; and it redirects each step's whole stderr to `<step>.stderr`, with no `head`, `sed -n 1p` or `%%$'\n'*` cut applied to any stored reading.
- [ ] **WF5's move.** Move every `sp__wf5_grade` case from `sandbox-probe-detached-loopback-legs.test.mjs` into the new suite unchanged, and add one case: an advancing GNU-arm file graded with the kind `the launcher's sandboxed gate-worker` passes, with that phrase in its sentence. In the old file:
  - its header names `sp__bg9_grade` alone for the detached leg;
  - `legs-detached.sh` stays in its sourced list;
  - every BG9 and loopback case is unchanged.
- [ ] **The declaration cases in `sandbox-probe-git-and-legs.test.mjs`.**
  - Add `'gate-sandbox'` after `'detached'` in the leg-name list and in `JOB_LEGS`.
  - In *"sp_leg_linux_only answers 0 for exactly the Linux-only legs"*, add `gate-sandbox` to the legs passed and `gate-sandbox=0` to the expected output, in its position.
  - The file's existing `--list`-equals-Gate-15 assertion then holds the new `gate-sandbox` and changed `detached` rows equal to `docs/development.md`, with no new code.
  - Extend no other assertion.

**Verification:**

- The three test files this task creates or edits pass, each through the single-file command `.claude/context/conventions.md` → `## The testing bar` gives: `cli/test/sandbox-probe-gate-sandbox-legs.test.mjs`, `cli/test/sandbox-probe-detached-loopback-legs.test.mjs` and `cli/test/sandbox-probe-git-and-legs.test.mjs`.
- `git grep -n 'sp__wf5_grade' -- cli/test` hits only `cli/test/sandbox-probe-gate-sandbox-legs.test.mjs`.
- No case starts a session, the launcher, `bwrap` or a network call.
