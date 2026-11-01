### Task 7 — Add the runner controls file, the runner stamp and the `runner-install` leg (IS1–IS4)

**Goal:** Some readings a GitHub-hosted runner owes can only be taken in the workflow's own unsandboxed steps, some before the probe is on disk. These are the AppArmor sysctl before `Install the sandbox prerequisites`, `/etc/apparmor.d/bwrap` before and after, the `sudo -n true` control, the metadata-service control and the image stamp. The workflow (Task 14) writes them into a **runner controls file**. This task fixes that file's format, reads it, prints its image keys as stamp lines on every job run, and grades the install step from it. This is PD20's restricted case, which the container run could not take: it set the VM's sysctl to `0` (§0), and the runner must not.

**Depends on:**

- **Task 1:** `runner-install` with rows `IS1,IS2,IS3,IS4`, in `SP_LINUX_ONLY_LEGS` and `SP_JOB_ONLY_LEGS`; `SP_JOB_MODE` and `SP_RUNNER_CONTROLS_FILE`; and `sp_leg_mode_skip`.
- **Task 3:** `SP_JOB_PREREQ_LINE`, the `sandbox-prerequisites` line job mode's `doctor --remote-job` printed, verbatim.
- **Task 5:** the entry point calls `sp_runner_controls_read <file>` after preflight, a status 1 refusing the run with exit 2, and `sp_runner_stamp` after `sp_stamp`.

**Where this task stops.** One new library file. The workflow that writes the file is Task 14's, and it writes exactly the keys listed here. N4's use of `imds-control` is Task 10's, and NN1's use of `sudo-control` is Task 8's. Tests are Task 20's.

### Targets

- `scripts/lib/sandbox-probe/legs-runner.sh` (new)

**Work:**

- [ ] **The header** states the runner controls file's contract, which this file owns:
  - one `<key>\t<value>` line per reading, with the value kept whole; a value never carries a tab or a newline, because the workflow replaces either with a space;
  - an unknown key is ignored, and a repeated key keeps its last value;
  - **the keys, closed:**
    - the stamp: `image-os`, `image-version`, `uname-r`, `probe-commit`, `cli-version`;
    - read before the install step: `sysctl-before`, the content of `/proc/sys/kernel/apparmor_restrict_unprivileged_userns` or `absent`; `apparmor-profile-before`, `present` or `absent`; `bwrap-before` and `socat-before`, the `command -v` path or `absent`;
    - the controls: `sudo-control`, `exit <n>` of the workflow's own unsandboxed `sudo -n true`; `imds-control`, `http <code>` or `no answer: curl exit <n>`;
    - read after the install step: `sysctl-after`, `apparmor-profile-after`, `bwrap-after`, `socat-after`; `bwrap-version`, the first line of `bwrap --version` or `absent`; `bwrap-start`, `exit 0` or `exit <n>: <first stderr line>` of `bwrap --ro-bind / / --dev /dev --unshare-all --proc /proc true`, run as the runner user;
    - `ssh-config`, `created` or `existed`.

  It also lists the grading functions with their signatures, and ends *SOURCED, NEVER EXECUTED … Bash 3.2 floor.*
- [ ] **Reading the file.**
  - **`sp_runner_controls_read <file>`** keeps the file's lines in `SP__RUNNER_CONTROLS`. It returns 1, with an `sp_refuse` line, when the file is unreadable or holds no line of the `<key>\t<value>` shape.
  - **`sp_runner_control <key>`** prints the value, or `unrecorded` with status 1 when the key is absent or no file was read.
  - **`sp_runner_stamp`** prints `sandbox-probe: stamp: runner <key>: <value>` on stderr for `image-os`, `image-version`, `uname-r`, `bwrap-version`, `probe-commit` and `cli-version`, in that order, an absent key printing `unrecorded`. It prints nothing when no file was read. This is the stamp every runner row carries.
- [ ] **The four grading functions.** Each reads only its arguments and sets `SP_VERDICT` and `SP_EVIDENCE`. Any argument that is `unrecorded` gives `not run`, naming the key.
  - **`sp__is1_grade <sysctl-before>`** — recorded, not graded: `pass`, *`kernel.apparmor_restrict_unprivileged_userns` before the install step: `<value>`*.
  - **`sp__is2_grade <bwrap-before> <socat-before> <bwrap-after> <socat-after> <bwrap-version>`**:
    - both `-after` values are paths: `pass`, naming which the step installed (`absent` before, a path after) and the version;
    - either `-after` value is `absent`: `fail`, naming it.
  - **`sp__is3_grade <sysctl-before> <profile-before> <profile-after>`** — the step writes the profile exactly when the sysctl reads `1` and no profile granting `userns` is there:
    - `pass`, *written* or *not needed*, when the before/after pair agrees with that rule;
    - `fail` when the sysctl read `1` and the profile is `absent` after;
    - `not run`, quoting the three values, for any other pair.
  - **`sp__is4_grade <bwrap-start> <prereq line>`**:
    - `pass` when `bwrap-start` is `exit 0` and the prerequisites line's first field is `PASS`;
    - `fail` when `bwrap-start` is any other exit, quoting it;
    - `not run` when the prerequisites line is empty.
- [ ] **`sp_leg_runner_install`.**
  - Outside job mode, print every row through `sp_leg_mode_skip runner-install "job mode only: run it with --job <checkout>"`.
  - In job mode with no controls file read, print `sp_leg_mode_skip runner-install "no runner controls file: the GitHub-hosted runner workflow writes one (--runner-controls)"`.
  - Otherwise, read each key through `sp_runner_control`, grade, and print IS1–IS4 through `sp_result_line runner-install …`, with departure `none`. No session is launched: every reading was taken outside the sandbox.

**Verification:**

- The type check passes.
- By hand, `bash -c '. scripts/lib/sandbox-probe/core.sh; . scripts/lib/sandbox-probe/legs-runner.sh; sp__is3_grade 1 absent present; echo "$SP_VERDICT: $SP_EVIDENCE"; sp__is2_grade absent absent /usr/bin/bwrap absent "bubblewrap 0.9.0"; echo "$SP_VERDICT: $SP_EVIDENCE"'` prints `pass` (written) and then `fail` naming `socat`.
- `grep -nE 'cat |printf .*\$\(cat' scripts/lib/sandbox-probe/legs-runner.sh` shows the file reads the controls file only through its own reader.
</content>
</invoke>
