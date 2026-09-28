### Task 23 — Give `branch-resume`, `branch-pause` and `branch-user-review` their remote arms

**Goal:** Make resuming, pausing and starting a fix round work for a remote run with the same commands and the same one-file writes, each syncing the record first so it acts on the run's real state.

**Depends on:** Task 22, which established the pattern these three follow and the `<scripts_dir>` wording for a command that invokes `remote-run.sh`. Task 6's `bash <scripts_dir>/remote-run.sh sync <branch>` (exit 0 done · 1 usage/config · 2 refused · 3 `gh` failed; writes the record's `status`, `pause_reason` — `usage` | `budget` | `user` | `overload` | `killed` — and fills the mirror). Task 12's relays, which turn each file into a dispatch: a `RESUME` in a paused remote record's mirror becomes `resume: pause`; a `PAUSE` in a running remote record's mirror becomes `action: pause`, which the running job honours at its next clean checkpoint. Task 11's review path: a dropped review for a remote branch is committed and dispatched by the watcher. Task 5's `bash <scripts_dir>/remote-run.sh stop <branch>`, which cancels a remote run's queued and in-progress jobs.

### Targets

- `plugin/commands/branch-resume.md` (register row 4).
- `plugin/commands/branch-pause.md` (register row 5).
- `plugin/commands/branch-user-review.md` (register row 2).

**Work:**

- [ ] `branch-resume.md`: before the state check, `sync` a record carrying `execution: github-actions`; a failed `sync` is reported and the command stops. A remote record synced as `paused` with `pause_reason: killed` — a job that ended mid-run — is resumable exactly like any paused run: the watcher dispatches a resume from the committed ledger. The `RESUME` write is unchanged. The report says, for a remote record, that the watcher dispatches the resume to GitHub Actions and the local watcher must be running to do that.
- [ ] `branch-pause.md`: before the state check, `sync` a remote record, so a run that already finished is not "paused". The `PAUSE` write is unchanged. The report says, for a remote record, that the watcher relays the pause and the job honours it at its next clean checkpoint, exactly as a local run does. Add one sentence: to stop a remote run outright rather than pause it, `bash <scripts_dir>/remote-run.sh stop <branch>` cancels its job and its chain — a sentence the command reports, never runs.
- [ ] `branch-user-review.md`: before building the candidate set, `sync` each remote record whose status is not already `completed` or `failed`, so a remote run that completed since the last sync is a candidate. The round computation is unchanged and still correct: it reads the record's `worktree`, which for a remote run is its mirror, and every earlier round of a remote run was placed and committed in that same mirror by the watcher before it was dispatched (Task 11), so the mirror holds every round. The inbox write is unchanged. The report says, for a remote record, that the watcher commits the review, pushes it and dispatches the fix cycle to GitHub Actions.
- [ ] In all three, update the `## Resolved values` `<scripts_dir>` row and the scope fence as Task 22 did.

**Verification:**

- `bash scripts/check-command-spelling.sh` (gate 6d) exits 0.
- For each file, a local record's path is word-for-word unchanged apart from the `<scripts_dir>` row and the fence.
- `bash scripts/test.sh` exits 0.

**Deviations from plan:** In `branch-resume.md` and `branch-pause.md` the sync runs in step 2, before the candidate set is built as well as before the state check, following Task 22's `branch-answer.md` pattern: syncing only at the state check would leave a remote run that paused or started since the last sync out of the no-argument candidate set. A failed `sync` stops the command when the prefix named that record, and drops the record from the candidates otherwise. `bash scripts/test.sh` exited 1 in the implementing session with 18 gates passed and 2 failed. Neither failure involves this unit's files: gate 6a flagged absolute paths in the gitignored scratch file `harness-runs/scratch/t3-test.log`, and gate 11 failed because the docs-retrieval runtime is not installed. Gate 6d passed, and so did `bash scripts/check-command-spelling.sh` on its own.
