### Task 2 — Declare the Linux legs and rows, admit Linux at preflight refusal 2, and add the `refusal` subcommand with its narrower preflight

**Goal:** Make the probe start on Linux and know its Linux legs:

- the leg table declares every new leg and row;
- preflight refusal 2 admits Linux and sets `SP_PLATFORM`;
- the entry point skips the Linux-only legs on macOS and prints the stamp;
- a new `refusal` subcommand runs the `refusal` leg behind a narrower preflight that needs a Linux host lacking `bwrap` or `socat`, without weakening refusal 6 for `run`.

**Depends on:** Task 1, which ships `scripts/lib/sandbox-probe/platform.sh` with:

- `sp_platform_of <uname -s>`, printing `macos` or `linux`, or nothing with status 1;
- `SP_PLATFORM`, declared empty;
- `sp_prereq_cmd bwrap|socat`, printing `${SANDBOX_PROBE_BWRAP:-bwrap}` or `${SANDBOX_PROBE_SOCAT:-socat}`;
- `sp_stamp`, which prints the stamp on stderr.

**Where this task stops.** It declares the legs and wires the subcommand. It writes no leg body:

| Leg function | Where it lands |
|---|---|
| `sp_leg_glob_deny` | `legs-glob.sh` (Task 6) |
| `sp_leg_registry` | `legs-registry.sh` (Task 7) |
| `sp_leg_detached` | `legs-detached.sh` (Task 8) |
| `sp_leg_loopback` | `legs-loopback.sh` (Task 9) |
| `sp_leg_refusal` | `legs-refusal.sh` (Task 10) |

Until each ships, the entry point's existing fallbacks hold. `run` prints `not run — leg not implemented` (`sp_leg_missing`). `refusal` exits 1 naming the missing function (`sp_need`).

The row choice inside `mktemp` and `gates` is Task 4's: it calls `sp_leg_row_for`, defined here.

Gate 15's restatement of the leg table is Task 11's. `cli/test/sandbox-probe-git-and-legs.test.mjs` compares it with `--list`, so that case fails until Task 11. The shell suite's refusal-2 case fails until Task 13, and `LEG_ORDER` until Task 14 (story index `## Context`).

### Targets

- `scripts/lib/sandbox-probe/core.sh`
- `scripts/sandbox-probe.sh`
- `scripts/lib/sandbox-probe/preflight.sh`

**Work:**

- [ ] **`core.sh`: the leg table** (`SP_LEGS`, through `sp_leg_declare`). Change two existing legs, append five new ones and add three helpers. Every new or changed expected text carries no `|`, no tab, no double quote and no backtick, because Gate 15 restates it as a Markdown table cell.
  - **Two existing legs change.** Every other leg's line stays byte-identical.
    - `gates` rows become `T2,W7,T3`. Its expected text: `the gates, started in the clone through run-test-suite.sh and collected with --wait, reach a pass verdict with no gate failing on its temporary file (T2 on macOS, T3 on Linux), and each of W7's six wrapper calls runs with no permission denial`. Its recorded-in text: `§5 Failures and their follow-ups (T2, T3); §4 The profile's denials (W7)`.
    - `mktemp` rows become `TD2,TD4`. Its expected text: `on macOS (TD2) the bare, -d and -t mktemp forms are refused with mkstemp failed; on Linux (TD4) the bare and -d forms are written under the session's TMPDIR and -t fails with too few X's, as TD3 found unsandboxed; on both the explicit form spelled with the session's TMPDIR as a literal path is written, and a call refused at the permission layer is not run`. Its recorded-in text is unchanged.
  - **Five new legs**, in this order:
    - after `invalid-profile`: `glob-deny`, `registry`, `detached`, `loopback`;
    - then the existing `headless-parity`;
    - then `refusal`, last.
  - **The new legs' rows, expected texts and recorded-in texts:**

    | Leg | Rows | Expected | Recorded in |
    |---|---|---|---|
    | `glob-deny` | `GW1,GW2` | `Linux only: on a scratch per-run profile without the clone's exact entries, a sandboxed dd onto a clone path that only a denyWrite entry containing a star covers is recorded as refused or written, for a path that exists when the session starts (GW1) and one that does not (GW2), while its control is written` | `§8 The Linux legs (owed)` |
    | `registry` | `RG1,RG2,RG3` | `Linux only: a sandboxed dd onto the run registry is refused while a new file beside it is written and an Edit of it is refused (RG1), a rename onto it leaves its inode and shasum unchanged (RG2), and moving its directory aside is refused, the probe restoring it at once if not (RG3)` | `§8 The Linux legs (owed)` |
    | `detached` | `BG9,WF5` | `Linux only: a process started with nohup and disown inside one sandboxed call outlives the call and the session (BG9), and hr_lane_mtime, read in that process through the GNU stat arm, advances (WF5)` | `§5 Failures and their follow-ups` |
    | `loopback` | `LB1,LB2,LB3,LB4,LB5` | `Linux only: the probe's loopback listener is called by 127.0.0.1 and by localhost, each also with --noproxy, on the network scratch profile as generated (LB1, LB2) and with 127.0.0.1 listed (LB3, LB4), and a listener a sandboxed call starts is called from outside the sandbox (LB5); once the listener answered the probe's own request, each row records whether the token came back and the proxy variables' host and port, and grades neither outcome` | `§8 The Linux legs (owed)` |
    | `refusal` | `RF1,RF2,RF3` | `Linux only, through the refusal subcommand on a host lacking bwrap or socat: Claude Code's own startup refusal under failIfUnavailable is quoted (RF1), the watcher's launch-time prerequisite probe refuses naming the missing package (RF2), and a session on CS8's invalid profile is recorded as refused at startup or run unsandboxed (RF3)` | `§8 The Linux legs (owed)` |

  - **The helpers**, each documented in the header:
    - `SP_LINUX_ONLY_LEGS="glob-deny registry detached loopback refusal"`, and `sp_leg_linux_only <leg>`, which returns status 0 for a leg in that list.
    - `sp_leg_platform_skip <leg>` prints one `not run` line per row of `<leg>` through `sp_result_line`. Its evidence: `Linux only: this host is macos`, or `… is not macOS or Linux` when `SP_PLATFORM` is empty.
    - `sp_leg_row_for <macOS row> <Linux row>` prints the second argument when `SP_PLATFORM` is `linux`, else the first.
- [ ] **`scripts/sandbox-probe.sh`: the entry point.**
  - **The source list** adds `platform.sh` right after `core.sh`. It appends `legs-glob.sh legs-registry.sh legs-detached.sh legs-loopback.sh legs-refusal.sh` after `legs-settings.sh`, each sourced only if present, as today.
  - **The header's platform line** (*"macOS only; the Linux legs are owed under roadmap item 21 (docs/development.md §6)."*) becomes `macOS, and Linux in a local container (docs/development.md → Gate 15); the GitHub-hosted runner legs are owed under roadmap item 21 (docs/development.md §6).`
  - **Usage.** The header's and `usage()`'s usage line add ` | refusal`. `usage()` adds the line `refusal                on a Linux host lacking bwrap or socat: the refusal leg, behind its own preflight`.
  - **`run`'s loop:**
    - It never runs `refusal`. `run --leg refusal` is a `usage_error` reading `the refusal leg runs only through 'sandbox-probe.sh refusal'`.
    - With no `--leg`, it skips `headless-parity`, as today, and also skips every `sp_leg_linux_only` leg unless `SP_PLATFORM` is `linux`.
    - With `--leg <a Linux-only leg>` off Linux, it calls `sp_leg_platform_skip` instead of the leg.
    - After preflight passes and before `sp_setup`, it calls `sp_stamp` when that function is defined.
  - **The new `refusal` subcommand:**
    - it takes no argument;
    - it sets `SP_PREFLIGHT_PREREQ=absent`;
    - it calls `sp_need sp_preflight sp_setup sp_teardown sp_leg_refusal`;
    - then, in order, the preflight (exit 2 on refusal), `sp_stamp`, `sp_setup`, `SP_CURRENT_LEG=refusal`, `sp_leg_refusal`, `sp_teardown` and `sp_finish`. This is `run`'s shape.
  - **`SP_PREFLIGHT_PREREQ` is assigned by the entry point, never inherited.** `preflight` and `run` set it to `present` before calling `sp_preflight`, and `refusal` sets it to `absent`. An exported `SP_PREFLIGHT_PREREQ=absent` therefore cannot invert `run`'s refusal 6.
  - **`judge` and `print-parity-script`** set `SP_PLATFORM="$(sp_platform_of "${SANDBOX_PROBE_UNAME:-Darwin}")"` before they act. They run no preflight, so without `SANDBOX_PROBE_UNAME` they grade and print as on macOS on any host. That keeps the existing fixture suites host-independent.
- [ ] **`preflight.sh`, refusal 2.** It sets `SP_PLATFORM` from `sp_platform_of "$uname_s"`.
  - **An unmapped platform** refuses with exactly `this probe measures the macOS and Linux sandboxes and 'uname -s' is '<uname_s>'`.
  - **Under `SP_PREFLIGHT_PREREQ=absent`**, a platform other than `linux` refuses with exactly `the refusal subcommand measures a Linux host lacking bwrap or socat, and 'uname -s' is '<uname_s>'`.
  - **The header's `THE REFUSALS, IN ORDER.` entry 2** is rewritten to say both, with no roadmap-item deferral. That deferral now lives only in `scripts/sandbox-probe.sh`'s header and Gate 15.
  - The `SANDBOX_PROBE_UNAME` seam is unchanged.
- [ ] **`preflight.sh`, refusal 6, parameterised by `SP_PREFLIGHT_PREREQ`** (`present`, or `absent`). An empty or unset value reads as `present`. Under `present`, check 6 is byte-for-byte today's. Under `absent`:
  - `profile-sandbox`, `profile-write-protection` and `profile-main-anchor` must each print a `PASS` line, as today.
  - `sandbox-prerequisites` must print a line that is **not** `PASS`. When it passes, the refusal reads exactly `doctor passes sandbox-prerequisites, so this host can start the sandbox and the refusal subcommand has nothing to measure: <line>`.
  - At least one of `command -v "$(sp_prereq_cmd bwrap)"` and `command -v "$(sp_prereq_cmd socat)"` must fail. When both resolve, the refusal reads exactly `the refusal subcommand needs bwrap or socat missing from PATH, and both resolve`.
  - The `SETTINGS_PROFILE` check and checks 1, 3, 4, 5 and 7 are unchanged in both modes.
  - The header documents the variable and both new refusals, and adds `SANDBOX_PROBE_BWRAP` and `SANDBOX_PROBE_SOCAT` to `TEST-ONLY SEAMS`.

**Verification:**

- The type check passes. It parses every shell file under `/bin/bash` 3.2.
- `bash scripts/sandbox-probe.sh --list` prints 21 lines, in the order above, each with four tab-separated fields. Every line other than `gates` and `mktemp` among the first 15 is byte-identical to `git show HEAD:scripts/lib/sandbox-probe/core.sh`'s declaration.
- `bash scripts/sandbox-probe.sh run --leg refusal` exits 1 and prints the usage refusal named above. `bash scripts/sandbox-probe.sh --help` lists `refusal`.
- `grep -n 'SP_PREFLIGHT_PREREQ' scripts/lib/sandbox-probe/preflight.sh` shows the variable read only inside checks 2 and 6.
- No new leg's expected or recorded-in text carries a `|` or a double quote: `bash scripts/sandbox-probe.sh --list | grep -c '[|"]'` prints `0`.
</content>
</invoke>
