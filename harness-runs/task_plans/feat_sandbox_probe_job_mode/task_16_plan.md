### Task 16 — Test the leg table, the job table, Gate 15's two restated tables and the mode skips

**Goal:** Extend `cli/test/sandbox-probe-git-and-legs.test.mjs`, whose header already states the rule that the leg table is the single declaration `--list` prints and Gate 15 restates row for row, to hold job mode to the same rule:

- the four new legs and their rows;
- the job declaration `--list --job` prints, and Gate 15's restatement of it;
- every job row being a row of its leg;
- the mode skips;
- `sp_result_line`'s refusal of a measured clone-only row in job mode.

**Depends on:**

- **Task 1 (`core.sh`):**
  - the legs `job-layout` (`CS6`), `runner-install` (`IS1,IS2,IS3,IS4`), `runner-pid` (`PN1,PN2,PN3`) and `runner-privs` (`NN1,NN2`), between `loopback` and `headless-parity`;
  - `sp_job_print`, which prints one `<leg>\t<job rows>` line per job leg in leg-table order;
  - `sp_leg_job_rows <leg>`, status 1 for a leg not run in job mode; `sp_leg_is_job_row <leg> <row>`; `sp_leg_job_only <leg>`;
  - `SP_LINUX_ONLY_LEGS`, now with the three runner legs;
  - `sp_leg_mode_skip <leg> <evidence> [<row>...]`; `sp_job_skip_clone_rows <leg>`;
  - `SP_JOB_MODE`.
- **Task 5:** `--list --job`, and the usage errors for `--runner-controls` without `--job` and for `run --job --leg headless-parity`.
- **Task 15:** Gate 15's second table, `| Leg | Job rows |`, directly after the leg table.

**Where this task stops.** It edits this one suite. No case launches `claude`, and no case runs `run` past its usage checks.

### Targets

- `cli/test/sandbox-probe-git-and-legs.test.mjs`

**Work:**

- [ ] **The header** adds job mode to its rule: *the job declaration `--list --job` prints is the single source of which rows each leg takes in job mode, every job row is a row of its leg, Gate 15 restates it row for row, and in job mode a clone-only row can be printed only `not run`.*
- [ ] **`LEG_ORDER`** gains `job-layout`, `runner-install`, `runner-pid` and `runner-privs` before `headless-parity`. `NEW_ROWS` gains `CS6`, `IS1`–`IS4`, `PN1`–`PN3` and `NN1`, `NN2`. The `sp_leg_linux_only` case's list and expected output gain the three runner legs, answering `0`, and `job-layout`, answering `1`.
- [ ] **A new `test('--list --job prints the job table')`**:
  - the lines, in leg-table order, for exactly the eleven job legs;
  - each job row is in that leg's `--list` row field;
  - no non-job leg appears;
  - `sp_leg_job_rows` answers each with its field, and `git` with status 1.
- [ ] **A new `test("Gate 15's restated job table matches --list --job, row for row")`**, built as the existing leg-table comparison: find `| Leg | Job rows |` in `docs/development.md`, read the rows to the next blank line, strip backticks, join `, ` to `,`, and compare with `--list --job`.
- [ ] **A new `test('the mode skips and the job-mode result line')`**:
  - `sp_leg_mode_skip runner-pid "job mode only: x"` prints three `not run` lines carrying that evidence;
  - with `SP_JOB_MODE=1`, `sp_job_skip_clone_rows wrappers` prints `not run` for CS4, P3 and CW2 only, with the *clone layout only* evidence;
  - with `SP_JOB_MODE=0`, the same call prints nothing;
  - with `SP_JOB_MODE=1`, `sp_result_line wrappers CW2 pass x ""` returns 1 and prints the refusal on stderr, while `sp_result_line wrappers CW2 "not run" x ""` prints its line, and `sp_result_line wrappers P1b pass x ""` prints its line;
  - with `SP_JOB_MODE=0`, `sp_result_line wrappers CW2 pass x ""` prints its line as before;
  - `run --runner-controls x` and `run --job /nonexistent --leg headless-parity` each exit 1 before preflight, with a usage line.

**Verification:**

- This suite passes: `npm test --workspace cli -- test/sandbox-probe-git-and-legs.test.mjs`, from the repository root, as one plain foreground command.
- Read the counts and the exit status, not a summary line.
</content>
</invoke>
