### Task 10 — Declare the `gate-sandbox` leg, source it, and restate the leg tables in Gate 15

**Goal:** The probe runs the new leg and says what it and the changed legs expect. `scripts/lib/sandbox-probe/core.sh` → `SP_LEGS` and `docs/development.md` Gate 15 say the same thing, in this one task, so the two never disagree in between. `cli/test/sandbox-probe-git-and-legs.test.mjs` holds them equal, row for row.

**Depends on:**

- **Task 8.** On Linux T3 issues `bash <main>/<scripts_dir>/launch-sandboxed-gates.sh <clone> sbx_probe_t2`, Phase G's launcher spelling, and collects with the clone's own `--wait`. It is `not run` unless the launcher answered `pending`. T2 on macOS is unchanged.
- **Task 9.**
  - `scripts/lib/sandbox-probe/legs-gate-sandbox.sh` defines `sp_leg_gate_sandbox`, which prints rows GS1, GS2, GS3, GS4 and WF5:
    - GS1: the launcher's worker outlives the call and the session and yields a verdict;
    - GS2: writes outside its roots, and to `<target>/.git/config`, are refused on disk while the control lands. The outside paths lie outside the target in both layouts: the home directory and the target's parent directory always, and the main checkout in the clone layout only, since in job mode the main checkout is the target;
    - GS3: `curl https://example.com/` returns no body while the unsandboxed control reaches it;
    - GS4: `~/.ssh/config` and the denied token variables are unreadable while the control read succeeds;
    - WF5: `hr_lane_mtime` advances through the GNU `stat` arm in the launcher's worker.
  - `legs-detached.sh` now prints BG9 alone.

**This is a catch-all task** (`path` `"."`). Its implementer reads every configured layer's conventions document.

### Targets

- `scripts/lib/sandbox-probe/core.sh`:
  - the `gates` and `detached` declarations;
  - a new `gate-sandbox` declaration after `detached`;
  - `sp_job_declare`;
  - `SP_LINUX_ONLY_LEGS`.
- `scripts/sandbox-probe.sh`: the library list it sources.
- `docs/development.md`, Gate 15:
  - the opening paragraph's *"the Linux-only legs"* list;
  - the leg table's `gates` and `detached` rows and a new `gate-sandbox` row;
  - the job-leg table's `detached` row and a new `gate-sandbox` row;
  - *"What a Linux run expects"*, the `gates` and `detached` rows and a new `gate-sandbox` row;
  - **What the runner owes**, the `detached` bullet and a new `gate-sandbox` bullet.

  These are the story index's `## Scope register` rows 37–43.

**Work:**

- [ ] **`core.sh`, the declarations.** No field may carry a `|`, a tab, a double quote or a backtick.
  - **`gates`.** Keep the sentence, and add that on Linux T3 issues Phase G's launcher, `launch-sandboxed-gates.sh`, and is not run unless the launcher answers pending.
  - **`detached`.** The rows become `BG9`. The expectation: Linux only: a process started with nohup and disown inside one sandboxed call outlives the call and the session (BG9), recorded as F10's fact.
  - **`gate-sandbox`.** Declare it after `detached`, with rows `GS1,GS2,GS3,GS4,WF5`. The expectation: Linux only: the gate launcher's worker, started from one excluded call under the launcher's own bwrap sandbox, outlives the call and the session and reaches a verdict (GS1); inside it a write to the home directory, to the target's parent directory and, in the clone layout, to the main checkout, and a write to the target's .git/config, are refused on disk while its control lands (GS2), a call to an outside host returns no body while the same call from the probe's shell does (GS3), the denied credential file and token variables read as absent while an ordinary file reads (GS4), and hr_lane_mtime advances through the GNU stat arm (WF5). Recorded in `§8 The Linux legs (owed) (GS1, GS2, GS3, GS4); §5 Failures and their follow-ups (WF5)`.
- [ ] **`core.sh`, the lists, and the entry point.**
  - `sp_job_declare detached "BG9"`, and `sp_job_declare gate-sandbox "GS1,GS2,GS3,GS4,WF5"` after it.
  - Add `gate-sandbox` to `SP_LINUX_ONLY_LEGS`.
  - In `scripts/sandbox-probe.sh`'s `for sp_lib_file in …` list, add `legs-gate-sandbox.sh` after `legs-detached.sh`.
- [ ] **`docs/development.md`, the leg tables.**
  - The Gate 15 leg table's `gates`, `detached` and new `gate-sandbox` rows carry the `core.sh` strings byte-for-byte, in the form the table already uses.
  - The job-leg table gives `detached` the rows `BG9`, and adds `gate-sandbox` with `GS1, GS2, GS3, GS4, WF5`.
  - The opening paragraph's Linux-only list gains `gate-sandbox`.
- [ ] **`docs/development.md`, *"What a Linux run expects"* and *What the runner owes*.**
  - The `gates` row's expectation adds T3's launcher spelling and its pending precondition. The `detached` row keeps BG9's wording and drops WF5's. A new `gate-sandbox` row states GS1–GS4 and WF5 as above.
  - In every row, the macOS-baseline cell keeps its recorded results verbatim. The `gate-sandbox` row's is `none: the launcher answers in-session off a bubblewrap host`.
  - The `detached` bullet drops WF5, and a `gate-sandbox` bullet states the same five expectations.

**Verification:**

- `bash scripts/sandbox-probe.sh --list` prints `gates`, `detached` and `gate-sandbox` lines whose expectation text equals the corresponding Gate 15 leg-table cells character for character. Compare them with `diff` of the extracted text, not by eye.
- `bash scripts/sandbox-probe.sh --list --job` prints `detached BG9` and `gate-sandbox GS1,GS2,GS3,GS4,WF5`, equal to the job-leg table.
- `git diff -- scripts/lib/sandbox-probe/core.sh` touches only the declarations and lists named under `### Targets`. `git diff -U0 -- docs/development.md` touches only the sites named there.
- `bash scripts/typecheck.sh` passes.
