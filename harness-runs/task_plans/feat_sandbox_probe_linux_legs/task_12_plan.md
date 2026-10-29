### Task 12 — Test `sp_platform_of`, `sp_prereq_cmd` and the stamp

**Goal:** Hold the probe's platform library to its contract in a new suite, `cli/test/sandbox-probe-platform.test.mjs`. The suite runs on any host: macOS or a Linux CI runner. It launches nothing and reaches no network.

**Depends on:** Task 1, which ships `scripts/lib/sandbox-probe/platform.sh`:

- **`sp_platform_of <uname -s>`** prints `macos` for `Darwin` and `linux` for `Linux`. Anything else, empty included, prints nothing with status 1.
- **`sp_prereq_cmd bwrap|socat`** prints `${SANDBOX_PROBE_BWRAP:-bwrap}` or `${SANDBOX_PROBE_SOCAT:-socat}`. Any other argument gives status 1 and nothing.
- **`sp_stamp`** prints `sandbox-probe: stamp: <key>: <value>` lines on stderr and nothing on stdout, and never exits non-zero.
  - **With `SP_PLATFORM=linux`**, the keys in order: `uname -a`, `distribution` (`PRETTY_NAME` from `${SANDBOX_PROBE_OS_RELEASE:-/etc/os-release}`, unquoted), `bwrap --version`, `socat -V` (the first line carrying `socat version`), `git --version`, `agent cli --version` (`${SANDBOX_PROBE_AGENT_CLI:-claude} --version`), `kernel.apparmor_restrict_unprivileged_userns` (from `${SANDBOX_PROBE_APPARMOR_FILE:-…}`, or `absent`), `caller` (`root` for `id -u` `0`, else `non-root (uid <n>)`).
  - **Otherwise**, the keys `uname -a`, `macOS` (`sw_vers -productVersion`), `git --version`, `agent cli --version`, `caller`.
  - A command off `PATH` gives `not found`. An unreadable file gives `unreadable`.

**Where this task stops.** It tests `platform.sh` alone. Refusal 2's use of `sp_platform_of` is Task 13's suite, and the dispatch's use of it is Task 14's.

### Targets

- `cli/test/sandbox-probe-platform.test.mjs` (new)

**Work:**

- [ ] **The header** opens with the rule the suite enforces: **the platform is named by one mapping; the prerequisite lookups have one spelling; and the stamp prints every key in a fixed order, on stderr only, whatever is missing.** It says what it leaves out: whether a real `bwrap --version` prints the line the stamp quotes, which only a Linux run shows.
  - It sources `scripts/lib/sandbox-probe/core.sh` and `platform.sh` in a `bash -c` through `runBash` from `cli/test/helpers/fixture.mjs`, as `cli/test/sandbox-probe-gates-legs.test.mjs` sources its libraries.
  - Its stubs and files live in a `mkdtemp` under `os.tmpdir()`, removed when each case ends. No fixture is created inside this checkout.
- [ ] **`sp_platform_of`:**
  - `Darwin` → `macos`, status 0;
  - `Linux` → `linux`;
  - `FreeBSD`, `darwin` and the empty string → no output, status 1.
- [ ] **`sp_prereq_cmd`:**
  - the defaults are `bwrap` and `socat`;
  - with `SANDBOX_PROBE_BWRAP=sbx-no-such-bwrap` it prints that name;
  - an unknown argument gives status 1 and no output.
- [ ] **`sp_stamp` with `SP_PLATFORM=linux`.**
  - **Setup:**
    - stubs for `uname`, `bwrap`, `socat`, `git`, `id` and a stub agent CLI in a stub directory prepended to `PATH`, each printing a fixed line;
    - `SANDBOX_PROBE_AGENT_CLI` naming the stub agent CLI;
    - `SANDBOX_PROBE_OS_RELEASE` naming a file with `PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"`;
    - `SANDBOX_PROBE_APPARMOR_FILE` naming a file holding `1`.
  - **Assert** that stdout is empty, and that stderr's `sandbox-probe: stamp:` lines are exactly the eight keys, in order, with the stubs' values. The distribution is unquoted. The caller is `non-root (uid 1000)` with `id -u` stubbed to `1000`, and `root` with it stubbed to `0`.
  - **A second case** sets `SANDBOX_PROBE_BWRAP` to a name that resolves nowhere and points `SANDBOX_PROBE_APPARMOR_FILE` at a missing file. It asserts `bwrap --version: not found`, `kernel.apparmor_restrict_unprivileged_userns: absent`, and status 0.
- [ ] **`sp_stamp` with `SP_PLATFORM` empty**, with a `sw_vers` stub: exactly the five macOS keys, in order.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-platform.test.mjs` passes, run from the repository root as one plain foreground command.
- The suite reads fixed files and stubs, never a tree of repository files, so it is not a tree-reading test and owes no `treeGuards` entry (`unit_loop_core.md` → `## The test-run rule` point 8's boundary).
</content>
</invoke>
