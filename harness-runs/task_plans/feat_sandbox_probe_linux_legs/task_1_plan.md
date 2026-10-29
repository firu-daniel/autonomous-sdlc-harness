### Task 1 — Add the probe's platform library: `sp_platform_of`, `sp_prereq_cmd` and the stamp

**Goal:** Give the sandbox probe one place that names the platform it measures and records the host it ran on. That place is a new sourced library, `scripts/lib/sandbox-probe/platform.sh`, holding:

- `sp_platform_of`, which maps `uname -s` to `macos` or `linux`;
- `SP_PLATFORM`, the variable every Linux arm on this branch keys on;
- `sp_prereq_cmd`, the one spelling of the `bwrap` and `socat` lookups;
- `sp_stamp`, the host stamp the task prompt asks every Linux run to record. No macOS run recorded its git and OS versions either, so the stamp prints on both platforms.

**Where this task stops.** It defines these functions and calls none of them. Task 2 sources the file from `scripts/sandbox-probe.sh` and sets `SP_PLATFORM` in preflight refusal 2. Task 2 also calls `sp_stamp` after preflight passes and calls `sp_prereq_cmd` in the refusal subcommand's preflight. Tasks 3, 4, 5 and 10 read `SP_PLATFORM`. Task 12 tests this file.

### Targets

- `scripts/lib/sandbox-probe/platform.sh` (new).

**Work:**

- [ ] **The header**, in the shape of every sibling under `scripts/lib/sandbox-probe/`: `#!/usr/bin/env bash`, then `# platform.sh — <what it is>`. It states:
  - what the file owns;
  - each test-only seam below, with its default;
  - the closing paragraph the siblings carry: *SOURCED, NEVER EXECUTED. It sets no shell option: the entry point owns `set -u`. Bash 3.2 floor.*

  The header also states the rule the file exists for: **every Linux-only arm in the probe tests `SP_PLATFORM` = `linux`, so with it empty or `macos` the probe behaves exactly as it did before this branch.**
- [ ] **`SP_PLATFORM=""`**, declared once here.
  - **`sp_platform_of <uname -s output>`** prints `macos` for `Darwin` and `linux` for `Linux`. For anything else, empty included, it prints nothing and returns status 1. It reads only its argument.
- [ ] **`sp_prereq_cmd bwrap|socat`** prints the command name the probe looks up: `${SANDBOX_PROBE_BWRAP:-bwrap}` or `${SANDBOX_PROBE_SOCAT:-socat}`. Any other argument returns status 1 and prints nothing.
  - The two variables are test-only seams. A test sets one to a name that resolves nowhere to stand for a host lacking that package. Task 2's preflight and this task's stamp both use the function, so the lookup has one spelling.
- [ ] **`sp_stamp`** prints one stderr line per key, `sandbox-probe: stamp: <key>: <value>`, in a fixed order. Each value is that command's first output line.
  - **With `SP_PLATFORM` = `linux`**, the keys are:
    - `uname -a`;
    - `distribution`: `PRETTY_NAME` from `${SANDBOX_PROBE_OS_RELEASE:-/etc/os-release}`, unquoted;
    - `bwrap --version`, running the `sp_prereq_cmd bwrap` command;
    - `socat -V`: the first line carrying `socat version`, running the `sp_prereq_cmd socat` command;
    - `git --version`;
    - `agent cli --version`: `${SANDBOX_PROBE_AGENT_CLI:-claude} --version`;
    - `kernel.apparmor_restrict_unprivileged_userns`: the content of `${SANDBOX_PROBE_APPARMOR_FILE:-/proc/sys/kernel/apparmor_restrict_unprivileged_userns}`, or `absent`;
    - `caller`: `root` when `id -u` prints `0`, else `non-root (uid <n>)`.
  - **Otherwise**, the keys are `uname -a`, `macOS` (`sw_vers -productVersion`), `git --version`, `agent cli --version` and `caller`.
  - A command that does not resolve on `PATH` gives the value `not found`. A file that cannot be read gives `unreadable`.
  - It never exits non-zero, it prints nothing on stdout, and it spawns each command with `2>/dev/null`.
- [ ] **No other file is touched.** The entry point's source list, preflight and the legs are Task 2's and later tasks'.

**Verification:**

- The type check passes. It parses every shell file under `/bin/bash` 3.2, so a construct 3.2 refuses fails it.
- By hand, from the repository root, `bash -c '. scripts/lib/sandbox-probe/platform.sh; sp_platform_of Darwin; sp_platform_of Linux; sp_platform_of FreeBSD; echo "rc=$?"'` prints `macos`, `linux` and `rc=1`.
- By hand, `bash -c '. scripts/lib/sandbox-probe/platform.sh; SP_PLATFORM=linux; sp_stamp' 2>&1 >/dev/null` on this macOS host prints eight `sandbox-probe: stamp:` lines. Here `bwrap --version` and `socat -V` read `not found`, and the AppArmor key reads `absent`.
- `grep -n 'set -[euo]' scripts/lib/sandbox-probe/platform.sh` finds nothing: a sourced library sets no shell option.
- **Deviations from plan:**
  - The `grep -n 'set -[euo]'` bullet cannot find nothing: the header paragraph this plan mandates (*"the entry point owns `set -u`"*, carried by every sibling) matches it. Run from the repository root, the grep's one hit is that header comment line; no executable `set` line exists in the file.
  - Unspecified edge: an os-release file that is readable but carries no `PRETTY_NAME=` line gives the `distribution` value `absent`, stated in the file header.
  - Evidence downgrade: both `By hand` `bash -c '…'` bullets were refused at the permission layer in this run ("Permission to use Bash has been denied because Claude Code is running in don't ask mode"), so neither was executed and no probe was used to route around the refusal. The `sp_platform_of` outputs and the eight Linux-stamp keys rest on reading the code only; Task 12's tests are the executed evidence. The type check (`bash scripts/typecheck.sh`, which parsed the new untracked file: its parse check lists `git ls-files --cached --others --exclude-standard`) passed: `check-shell-parse: 91 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`, `PASS: typecheck`.
</content>
</invoke>
