### Task 14 — Test the new leg table, the Linux-only skip and the parity script's Linux text

**Goal:** Update `cli/test/sandbox-probe-git-and-legs.test.mjs` for three changes:

- **Task 2's leg table:** the new run order, the new rows, the Linux-only helpers, and `run --leg refusal`'s usage refusal.
- **Task 5's parity script**, which prints Linux expectations when the platform is Linux and is byte-identical otherwise.
- **Gate 15's restated table** (Task 11), which this suite's existing case already holds to `--list` row for row. That case needs no edit, and passes once Tasks 2 and 11 have both landed.

**Depends on:**

- **Task 2** (`scripts/lib/sandbox-probe/core.sh`, `scripts/sandbox-probe.sh`):
  - **The leg order:** `gates`, `mktemp`, `scratch`, `retrieval`, `wrappers`, `wrappers-refresh`, `planted-config`, `planted-files`, `write-protection`, `git`, `network`, `retry`, `repo-settings`, `credentials`, `invalid-profile`, `glob-deny`, `registry`, `detached`, `loopback`, `headless-parity`, `refusal`.
  - **The changed and new rows:** `gates` `T2,W7,T3`; `mktemp` `TD2,TD4`; `glob-deny` `GW1,GW2`; `registry` `RG1,RG2,RG3`; `detached` `BG9,WF5`; `loopback` `LB1,LB2,LB3,LB4,LB5`; `refusal` `RF1,RF2,RF3`.
  - **`SP_LINUX_ONLY_LEGS`** is `glob-deny registry detached loopback refusal`, and `sp_leg_linux_only <leg>` returns status 0 for exactly those.
  - **`sp_leg_platform_skip <leg>`** prints one `not run` line per row, with evidence `Linux only: this host is macos` when `SP_PLATFORM=macos`.
  - **`sp_leg_row_for <macOS row> <Linux row>`** prints the second argument when `SP_PLATFORM=linux`, else the first.
  - **`run --leg refusal`** is a usage error reading `the refusal leg runs only through 'sandbox-probe.sh refusal'`, exit 1, raised while parsing the arguments, before preflight.
  - **`print-parity-script`** sets `SP_PLATFORM` from `${SANDBOX_PROBE_UNAME:-Darwin}`.
- **Task 5** (`legs-settings.sh` → `sp_print_parity_script`). With `SP_PLATFORM=linux`:
  - step 2 ends `expect a network refusal: CONNECT tunnel failed, response 403, or a <sandbox_violations> line:`;
  - step 4 ends `expect a sandbox refusal: Read-only file system, or Operation not permitted:`.

  Every other line is unchanged, and so is the whole output otherwise.
- **Task 11**, which restates Gate 15's leg table from `--list`.

**Where this task stops.** It edits this one suite. Preflight is Task 13's, and the platform library Task 12's.

### Targets

- `cli/test/sandbox-probe-git-and-legs.test.mjs`

**Work:**

- [ ] **`LEG_ORDER`** becomes the 21-leg order above. **`NEW_ROWS`** gains `T3`, `TD4`, `GW1`, `GW2`, `BG9`, `WF5`, `LB1`–`LB5` and `RF1`–`RF3`, and `RG1`–`RG3` if the constant lists rows by the branch that added them to the table. Read its declaration and keep its meaning.
  - The header's rule names the Linux-only legs and the per-platform row choice.
- [ ] **A new `test(...)`, *the Linux-only legs and the per-platform rows*,** through the suite's `sourced(...)` helper:
  - `sp_leg_linux_only` gives status 0 for each of the five Linux-only legs and 1 for `gates` and `headless-parity`;
  - `sp_leg_platform_skip loopback` with `SP_PLATFORM=macos` prints five `not run` result lines, `LB1`–`LB5` in order, each with evidence `Linux only: this host is macos`;
  - `sp_leg_row_for TD2 TD4` prints `TD4` with `SP_PLATFORM=linux`, and `TD2` with it `macos` or empty.
- [ ] **A subtest asserting `run --leg refusal`:** through the entry point, exit 1, and a stderr line `sandbox-probe: the refusal leg runs only through 'sandbox-probe.sh refusal'`.
- [ ] **The `print-parity-script` test** gains a subtest for the placeholder form with `SANDBOX_PROBE_UNAME: 'Linux'`. Its output equals the existing placeholder form's expected text with exactly the two step endings replaced as above.
  - The existing subtests keep their expected text byte for byte. They now pass no `SANDBOX_PROBE_UNAME`, or `Darwin`, so the macOS text is asserted on any host.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-git-and-legs.test.mjs` passes, run from the repository root as one plain foreground command. That includes the existing *Gate 15's restated leg table matches --list, row for row* case.
</content>
</invoke>

- **Deviations from plan:** The two `sp_result_line` refusal subtests expected `gates`' rows as `(T2,W7)`; Task 2's `gates` row is `T2,W7,T3`, so both expected messages now read `(T2,W7,T3)` — without it the suite fails on the leg table this task asserts. The `run --leg refusal` subtest sits inside the `--list prints the leg table` test. The Linux parity subtest also asserts each macOS ending occurs exactly once in the Darwin output, so the two-replacement comparison cannot pass vacuously.
