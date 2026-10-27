### Task 11 — Test that a fused or foreign row is refused and that non-passing legs are recorded

**Goal:** Add the test defect 1 asks for: one that catches a result line with a fused row. Also pin Task 1's non-pass record, which Task 3's evidence keeping reads.

**Depends on:** Task 1, which changed `scripts/lib/sandbox-probe/core.sh` in two ways:

- **`sp_result_line <leg> <row> <verdict> <evidence> <departure>`** first refuses a row that is not one of `sp_leg_rows <leg>`. Leg `judge` with row `-` is accepted. A refusal:
  - prints no line;
  - writes `sandbox-probe: sp_result_line: row '<row>' is not a row of leg '<leg>' (<comma-joined rows>)` on stderr;
  - adds 1 to `SP_FAIL_COUNT`;
  - returns 1.

  The existing verdict refusal runs second, with its text unchanged.
- **`SP_NONPASS_LEGS`** gains the leg of every `fail` or `not run` line and of every refused line. `sp_leg_nonpass <leg>` returns 0 for a recorded leg and 1 otherwise.

Task 1 also restated eight legs' expected texts in both `SP_LEGS` and Gate 15's table. This suite's existing `Gate 15's restated leg table matches --list, row for row` case already compares them, and stays unchanged.

### Targets

- `cli/test/sandbox-probe-git-and-legs.test.mjs`: new cases under `sp_result_line`, and the header.

**Work:**

- [ ] **The fused row.** Through the existing `sourced(…)` helper, call `sp_result_line gates 'T2fail' '<sandbox_violations>' 'x' ''`. That is the first run's argument shift: the fused row, with the evidence taking the verdict's place. Assert:
  - stdout `|1|1` from `printf "|%s|%s" "$?" "$SP_FAIL_COUNT"`;
  - stderr exactly `sandbox-probe: sp_result_line: row 'T2fail' is not a row of leg 'gates' (T2,W7)\n`.
- [ ] **A foreign row, the prefix trap and the judge exception.**
  - `sp_result_line gates CS3 pass x ''` is refused naming `(T2,W7)`.
  - `sp_result_line planted-files CS1 pass x ''` is refused even though `CS12` is one of that leg's rows: the match is on whole rows.
  - `sp_result_line judge - pass x ''` prints its line.
- [ ] **The non-pass record.** In one shell:
  - print a `pass` line for `network N1`, a `not run` line for `git CS3`, and a refused line for `gates T2fail`;
  - then print `sp_leg_nonpass network; sp_leg_nonpass git; sp_leg_nonpass gates` statuses.
  - Assert `1`, `0`, `0`.
- [ ] **The header.** Add the rule: *a result line's row must be one of its leg's rows, so an argument shift that fuses the row with the verdict is refused at its source.* Name `sp_leg_nonpass` beside `sp_result_line` in the list of what the suite covers.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-git-and-legs.test.mjs` passes, including the unchanged `--list` and Gate 15 comparison cases.
- The new cases call only `core.sh` (and `judge.sh`, through `sourced`). None launches the probe's `run`.
