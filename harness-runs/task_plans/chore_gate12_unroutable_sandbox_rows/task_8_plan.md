### Task 8 — Rewrite SB2, SB3, JS3N and RJ2 in `docs/sandbox-verification.md` §10, and align `docs/cli.md` §6 and `docs/remote-execution.md`

**Goal:** Make each changed row's **Expected** and **Read from** name exactly what `grade` now grades, so the column and the grade change together, as the prompt requires. Make the two residual statements and the three remote-execution sites say what the source now guarantees.

**Depends on:**

- **Task 1:** `hr_remote_status_write` removes a link at `<out_json>` before the rename and refuses a real directory, with the race left open.
- **Task 3:** SB2's arm `pause-note` is a link the session makes at `<stateDir>/PAUSE_PROGRESS.md` through `bash <scriptsDir>/scratch-run.sh <stateDir>/scratch/gate12_sb2_pause_link.mjs`. SB3 and JS3N are on route `source`.
- **Task 4:** RJ2 is `pass` on its refusal at `Refuse a branch that changed the job's own files`, with JS1's checks, and prints a `source` line naming `writeProtection.ts` → `protectedPaths` / `PROFILE_PATH` / `jobSurfacePaths`.
- **Task 5:** SB2 folds `clarifications` and `pause-note`, then prints a `source` line naming `hr_remote_status_write`. SB3 and JS3N print a `source` line carrying their note.

This is a catch-all task: read every configured layer's conventions document (`.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md`). `docs/development.md` is **Task 9's**.

**Rules for every row edit.** Change only the **Expected** and **Read from** cells. **Observed** and **Verdict** are recorded round 14 and round 15 results, and they stay byte for byte (`.claude/context/conventions.md` → `## Documents of record`). A clause read from the source says *read from the source, not observed* and *unreachable by construction*, and names its file and symbol. A clause still to be taken stays *not yet measured*. Cite by symbol or quoted text, never by line number.

### Targets

- `docs/sandbox-verification.md` → `## 10.`: rows `SB2`, `SB3`, `JS3N`, `RJ2`.
- `docs/cli.md` → `## 6.` → residual 1, items 4 and 5.
- `docs/remote-execution.md`: the facts-table row beginning *"A branch whose profile fails `run_profile_check`"*, the sentence *"the planted links and the untrusted `stateDir` are SB2 and SB3"*, and the sentence *"the stalled-watchdog arms are JS3 and JS3N, in step 8"*.

**Work:**

- [ ] **SB2.**
  - **Expected:** the `PAUSE_PROGRESS.md` link is made by the session during its run, through `scratch-run.sh`, on the `pause-note` arm's own branch. A committed one is moved aside at the job's start (the watcher header's *"THE PAUSE NOTE belongs to the run that wrote it"*). The `clarifications` link stays as it is. One `skipped <path>: <path> is a symbolic link` line each, and the artifact holds no link and no token. The variant: read from the source, not observed, unreachable by construction, because `hr_remote_status_write` (`cli/templates/scripts/lib/harness-run-lib.sh`) removes a link at `autonomous_logs/remote_status.json` before every rename. Then state the residual: a process the session left running could re-place a link between that test and the rename.
  - **Read from:** each arm's `Save the state bundle` step log and downloaded `harness-state` artifact; the `clarifications` arm's next job's `Restore the previous job's state` log; and, for the variant, `hr_remote_status_write`, printed as `grade`'s SB2 `source` line.
- [ ] **SB3 and JS3N.**
  - **Expected:** unreachable by construction, read from the source, not observed.
    - SB3: `harness.config.json` is write-protected (`writeProtection.ts` → `protectedPaths`, its `CONFIG_FILENAME` entry). The session's processes may write only under `sandbox.filesystem.allowWrite` (`cli/templates/claude/settings.autonomous.json`), which names the state directory. A committed rewrite is a `jobSurfacePaths` entry, refused at `Refuse a branch that changed the job's own files` (that is JS1).
    - JS3N: `jobSurfacePaths` derives from `placeholderProtectedPaths`, so every job surface is write-protected for the session, as is the checkout's whole `.git`. A pushed one is JS1's refusal.
  - **Read from:** those symbols, as `grade`'s `source` line for the row.
- [ ] **RJ2.**
  - **Expected:** the planted profile is a job surface (`protectedPaths` → `join(repoRoot, PROFILE_PATH)`, kept by `jobSurfacePaths`). So the branch is refused at `Refuse a branch that changed the job's own files` exactly as JS1 is: job `failure`, an `::error::` naming `.claude/settings.autonomous.json`, every later step skipped, no bundle, `remote-run.sh status` `failed`. The launch-check clause is unreachable from a branch by construction, read from the source, not observed. A branch that passes the refusal step is a `fail`.
  - **Read from:** that step's log and annotation, the job's steps and artifacts, `remote-run.sh status`, and the `source` line naming `writeProtection.ts` and `run_profile_check`.
- [ ] **`docs/cli.md`.**
  - **Item 4:** add one clause. A link at `autonomous_logs/remote_status.json` that names a directory takes `restore`'s `mv` into that directory, reasoned from how `mv` treats a directory target and not measured. Restore is unchanged.
  - **Item 5:** add one sentence. The watcher's own writes of `remote_status.json` go through `hr_remote_status_write`, which removes a link at the path before its rename. So a link there that reaches `save` was placed after the watcher's last write, and the first bullet's gap is what remains.
- [ ] **`docs/remote-execution.md`.**
  - **The facts row's source cell:** a branch's profile never reaches the launch check in a job, because it is a job surface refused first. §10 RJ2 grades that refusal and reads the clause from the source.
  - **The two sentences:** SB3 and JS3N are read from the source, not taken by a job. SB2's two links stay taken in step 7.

**Verification:**

- Re-run the story index's register entries A, B and C. Every hit in these three files is a register row, and each `change` row owned by Task 8 has been edited.
- For SB2, SB3, JS3N and RJ2, the **Observed** and **Verdict** cells are byte-identical to the base: `git diff` shows changes in the two edited columns only.
- Each row's **Read from** names the file and symbol that `grade`'s `source` line for that row prints, per Tasks 4 and 5.
