### Task 12 — Take W6 and W8 in job mode, and class PD23's rename shapes as sandbox refusals

**Goal:** Two changes to `scripts/lib/sandbox-probe/legs-protection.sh`, which owns both the `write-protection` and `git` legs.

1. **Job mode.** The `write-protection` leg takes its job rows W6 and W8 against the checkout's own protected files, under the base profile. CS1, CS2 and CS7 are clone rows and do not carry over. In job mode the leg launches one session carrying W6's `Write` and `Edit` calls and its control, issues no CS1, CS2 or CS7 call, and prints those three rows `not run`, *clone layout only*. W8 normally reads two debug logs, write-protection's and W7's. W7 is the `gates` leg's, which is not a job leg, so in job mode W8 grades the write-protection log alone and says W7's half is not a job row.
2. **PD23.** `sp__wp_mv_class` reads a rename's message itself rather than through the judge. It prints `landed`, `stage-failed`, `refused`, or, when no refusal string matches, `unrecognised` on Linux and `other` on macOS. On Linux it must print `refused` for a line carrying `Device or resource busy`, as it does today for `Read-only file system`. That covers `inter-device move failed: … unable to remove target: Device or resource busy` too, and matches the judge's layer table (Task 6). CS1's renames then grade as the judge grades them.

The `git` leg (CS3, CL5) is not a job leg and is untouched.

**Depends on:**

- **Task 1:** the job rows `W6,W8`, `SP_JOB_MODE`, and `sp_job_skip_clone_rows <leg>`, which prints `not run`, *clone layout only*, for each non-job row in job mode.
- **Task 6:** on Linux, the judge's `sp__layer` files `Permission denied` and `Device or resource busy` under `sandbox`.
- **In job mode**, `SP_CLONE` and `SP_MAIN` are the checkout and `SP_RUN_PROFILE` is its base profile (Task 2). W5's set, which W6 writes to, comes from that profile's `Edit` deny rules.

**Where this task stops.** It edits `legs-protection.sh` only. Tests are Task 19's for the PD23 classifier, which also moves the existing `Device or resource busy` `unrecognised` case onto a string still unknown, and Task 21's for the job arm.

### Targets

- `scripts/lib/sandbox-probe/legs-protection.sh`

**Work:**

- [ ] **`sp__wp_mv_class`.** In its Linux `case`, `*"Device or resource busy"*` joins `*"Read-only file system"*` and prints `refused`. Off Linux it is unchanged. Its comment cites PD23 and the judge's table.
- [ ] **`sp_leg_write_protection` in job mode.** First `sp_job_skip_clone_rows write-protection`. Then build the session from W6's calls alone: the `Write` and `Edit` (after `Read`) of W5's set and the session's control, launched with `--debug-file`, as today. Print W6 from that session as today.
- [ ] **`sp__wp_w8` in job mode.** Grade the write-protection log alone:
  - **`pass`** when it holds no `is not matched by file permission checks` or `mixes * with the trailing :* prefix syntax` line for any rule the base profile carries;
  - **`fail`** when it holds one;
  - **`not run`** when the log is missing or empty.

  The evidence says *W7's half is not a job row: the gates leg does not run in job mode*. With `SP_JOB_MODE` at `0`, W8 grades both halves, unchanged.
- [ ] **The header** gains a *JOB MODE* paragraph naming the two job rows, the three skipped ones, W8's one-log grade, and the PD23 classifier change.

**Verification:**

- The type check passes.
- `git diff scripts/lib/sandbox-probe/legs-protection.sh` shows the macOS arm of `sp__wp_mv_class` unchanged and every job change behind an `SP_JOB_MODE` test.
- By hand, `bash -c '. scripts/lib/sandbox-probe/core.sh; . scripts/lib/sandbox-probe/legs-protection.sh; SP_PLATFORM=linux; sp__wp_mv_class "sbx_wp_mv 0 mv: cannot move a to b: Device or resource busy"; SP_PLATFORM=macos; sp__wp_mv_class "sbx_wp_mv 0 mv: cannot move a to b: Device or resource busy"'` prints `refused` then `other`.

**Deviations from plan:**

- **The W6 prompt loop is shared, not copied.** The clone arm's loop that writes W6's `Write` / `Edit` sentences moved, byte-identical in output, into `sp__wp_prompt_w6`, which both arms call. That part of the diff is therefore not behind an `SP_JOB_MODE` test; it changes no prompt the clone arm writes. Every other job change is behind `SP_JOB_MODE`: `sp__wp_job` (dispatched from `sp_leg_write_protection`), `sp__wp_all`'s row set, `sp_protected_set`'s skip of the dd / rename set and the plugin root, and `sp__wp_w8`'s one-log arm.
- **"Its control" read as the file-tool control alone.** The job session carries one control, `sp_ctl_add … tool Write <checkout>/sbx_wp_tool_ctl.txt`, the control matching W6's file-tool calls. The clone arm's two dd controls (`written` into `<clone>/.git`, `ran` over a tracked file) are not issued: they need the dd `--allowedTools` rule, and the `written` one would write into the job checkout's own `.git`. The session therefore carries no `--allowed` flag.
- **Evidence downgrade — the by-hand check.** The bullet's `bash -c '…'` command, and a bare `bash -n` of the file, were refused at the permission layer (`Permission to use Bash has been denied because Claude Code is running in don't ask mode`). The same calls were run from a probe under `harness-runs/scratch/` through `bash scripts/scratch-run.sh`: `bash -n` exited 0; on Linux `sp__wp_mv_class` printed `refused` for `cannot move a to b: Device or resource busy`, for an `inter-device move failed: … unable to remove target: Device or resource busy` line and for `Read-only file system`, `unrecognised` for an unknown string, and on macOS `other` for the busy line. A second probe graded `sp__wp_w8` against fixture logs: with `SP_JOB_MODE=1` a clean log is `pass`, a log naming a profile rule is `fail`, an empty log is `not run`, each ending `W7's half is not a job row: the gates leg does not run in job mode`; with `SP_JOB_MODE=0` the evidence strings were the unchanged two-log ones. A third confirmed `sp_protected_set` builds no dd / rename target in job mode (`T=0`) and the same W6 set in both modes. The job session itself (`sp__wp_job`) was not launched: that needs a job checkout and an agent session, which Task 21's tests cover.
</content>
</invoke>
