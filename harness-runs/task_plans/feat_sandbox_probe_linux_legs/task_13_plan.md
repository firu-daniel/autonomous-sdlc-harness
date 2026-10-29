### Task 13 — Test refusal 2 on Linux and the refusal subcommand's preflight

**Goal:** Update `cli/test/sandbox-probe-shell.test.mjs` for Task 2's preflight, and add cases for the refusal subcommand's narrower preflight.

- **Refusal 2 now admits Linux.** The existing case 2 asserts the old macOS-only refusal, so it now asserts the refusal of an unmapped platform. A new case shows Linux getting past check 2.
- **The refusal subcommand's narrower preflight:**
  - it refuses a non-Linux host;
  - it refuses a host where `doctor` passes `sandbox-prerequisites`;
  - it refuses a host where both `bwrap` and `socat` resolve;
  - it passes check 6 only on a host that lacks one.
  - `run`'s own refusal 6 is unchanged, so it still refuses a non-passing `sandbox-prerequisites`.

This is the third of the four places the refusal-2 text lives. Task 2 owns the first two, the probe's header and `preflight.sh`; Task 11 owns the fourth, Gate 15.

**Depends on:** Task 2.

- **Refusal 2** sets `SP_PLATFORM` from `sp_platform_of` (`Darwin` → `macos`, `Linux` → `linux`). Any other value refuses with exactly `this probe measures the macOS and Linux sandboxes and 'uname -s' is '<x>'`.
- **Under `SP_PREFLIGHT_PREREQ=absent`**, a non-Linux host refuses with exactly `the refusal subcommand measures a Linux host lacking bwrap or socat, and 'uname -s' is '<x>'`. The entry point assigns the variable: `preflight` and `run` set `present`, `refusal` sets `absent`, so an exported value is not inherited.
- **Check 6 under `absent`** needs `PASS` lines for `profile-sandbox`, `profile-write-protection` and `profile-main-anchor`. Its refusals:
  - `sandbox-prerequisites` printing `PASS` refuses with exactly `doctor passes sandbox-prerequisites, so this host can start the sandbox and the refusal subcommand has nothing to measure: <that line>`;
  - both `command -v "$(sp_prereq_cmd bwrap)"` and `… socat` resolving refuses with exactly `the refusal subcommand needs bwrap or socat missing from PATH, and both resolve`.
- **Seams.** `SANDBOX_PROBE_BWRAP` and `SANDBOX_PROBE_SOCAT` replace the looked-up names (Task 1's `sp_prereq_cmd`). `SANDBOX_PROBE_UNAME`, `SANDBOX_PROBE_DOCTOR` and `SANDBOX_PROBE_AGENT_CLI` are unchanged.
- **The subcommand's shape.** `refusal` refuses at preflight with exit 2, exactly as `preflight` does, before `sp_setup` creates anything.

**Where this task stops.** It tests preflight and the subcommand's refusals. It does not run the subcommand past preflight, because that would cut a clone through `create-worktree.sh`. It does not test the leg table (Task 14) or the stamp (Task 12).

### Targets

- `cli/test/sandbox-probe-shell.test.mjs`

**Work:**

- [ ] **The header's rule** gains the refusal subcommand: its preflight refuses, with exit 2 and nothing created, a host it does not measure, and `run`'s refusal 6 is not weakened. Its *Left out deliberately* paragraph gains the subcommand past preflight, which would cut a clone.
- [ ] **Case `2.`** becomes *a host that is neither macOS nor Linux*. With `SANDBOX_PROBE_UNAME: 'FreeBSD'` it asserts `assertRefused(run, "this probe measures the macOS and Linux sandboxes and 'uname -s' is 'FreeBSD'")` and no leftover. A new case passes `SANDBOX_PROBE_UNAME: 'Linux'` with every other seam passing, and asserts the run gets past check 2: no refusal line naming the platform, and the run's outcome is the same as the existing `Darwin` pass case's.
- [ ] **A new `test(...)`, *the refusal subcommand refuses a host it does not measure*,** runs the probe copy's `refusal` subcommand through a helper shaped like `preflight(...)`, with `[probe, 'refusal']`. Each subtest asserts `assertRefused` with the exact text and no leftover under its `TMPDIR`:
  - (a) `SANDBOX_PROBE_UNAME: 'Darwin'` → the non-Linux refusal;
  - (b) `Linux`, with the default doctor stub (all four `PASS`) → the `doctor passes sandbox-prerequisites…` refusal, quoting the stub's `PASS  sandbox-prerequisites  ok` line;
  - (c) `Linux`, a doctor stub whose `sandbox-prerequisites` line is `! WARN  sandbox-prerequisites  bwrap missing`, and `SANDBOX_PROBE_BWRAP`/`SANDBOX_PROBE_SOCAT` naming two stub scripts placed on `PATH` → the `both resolve` refusal.
- [ ] **Check 6 passing under `absent`, without cutting a clone.** In a `bash -c` from the fixture copy's library directory (`f.libDir`), source `core.sh`, `platform.sh` and `preflight.sh`, set `SP_PREFLIGHT_PREREQ=absent`, and call `sp_preflight`, under (c)'s seams with `SANDBOX_PROBE_BWRAP` naming a command that resolves nowhere. It returns 0. A control in the same case, with `SP_PREFLIGHT_PREREQ=present` and the same doctor stub, refuses with the existing `doctor does not pass sandbox-prerequisites: ! WARN  sandbox-prerequisites  bwrap missing` text, which shows `run`'s refusal 6 unchanged.
- [ ] **No case exports `SP_PREFLIGHT_PREREQ` to the entry point**, except a single subtest that does it on purpose. That subtest runs `preflight` with `SP_PREFLIGHT_PREREQ: 'absent'` in its environment and the `! WARN` stub, and asserts the `present`-mode refusal: the entry point does not inherit the variable.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-shell.test.mjs` passes, run from the repository root as one plain foreground command.
- `grep -n "macOS sandbox and 'uname -s'" cli/test/sandbox-probe-shell.test.mjs` finds nothing: the old refusal text is gone from the suite.
</content>
</invoke>
