### Task 4 — Give job mode an `unfinished` arm with a bounded auto-resume, and re-baseline the remote-job progress cases

**Goal:** A remote job whose session exits 0 over an unfinished ledger is resumed from the ledger inside the job, at most `REMOTE_AUTO_RESUME_MAX` times. Past that it ends `paused` / `stop` with one notification naming what happened and both resume routes. It is no longer mis-handled as an API-overload self-pause. The local watcher and the remote job both recover the failure, as `harness-runs/lessons.md` → *"A recovery for an unattended run's failure covers every execution mode the failure reaches"* requires.

**Depends on:** Task 1, which adds `unfinished` to `hr_remote_status_write`'s `pause_reason` vocabulary, so the bundle's `status.json` carries it and `remote-run.sh sync` copies it into the local record. Also Task 3, which makes `classify_run_exit` write `status paused` with `pause_reason unfinished` in one write, in job mode too, **without notifying in job mode**: `run_job` notifies once it has decided. **One exception:** in job mode, when `pause_reason` is already `user` (`job_control_poll` recorded a GitHub pause and dropped `PAUSE`), Task 3 writes `status paused` and **keeps `user`**. It logs the unfinished ledger and sends the "paused as you asked" notification itself, as its job-mode `PAUSE_ACK` arm does. `run_job`'s existing `user)` arm then stops the job (`detail="paused by the user"`, decision `stop`) with **no** auto-resume and no further notification. The `unfinished)` arm below is never reached for that record. This task restates that contract and changes neither.

**What job mode does today with a reason it does not know (verified).** `run_job`'s `paused)` case switches on `pause_reason`: `budget`, `user`, `usage`, then `*)`. The `*)` arm calls `job_auto_resume … "an overload self-pause"`, and on exhaustion notifies *"paused itself on API overload"*. So without this task an `unfinished` job is auto-resumed under the wrong name and reported as an overload.

**Where this task stops.** Local classification is Task 3's. `docs/remote-execution.md` is Task 8's. `remote-run.sh` is unchanged: `sync` copies the reason verbatim, `report paused` renders any reason as `paused (reason: \`unfinished\`)` with `@sdlc-harness resume`, the control `resume` accepts any reason, and `poll` acts on `usage` alone.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh` — `run_job`'s `paused)` case, and the header's `JOB MODE` block (`THE DECISION`, `THE BOUNDED AUTO-RESUME`, `NOTIFICATIONS`).
- `cli/test/watcher-remote-job.test.mjs` — new `unfinished:` cases, and the three existing `progress:` cases re-baselined.

**Work:**

- [ ] In `run_job`'s `paused)` case, add an `unfinished)` arm before `*)`:
  - `job_auto_resume "$branch" "$worktree" "$log_path" "$state_abs" "an unfinished session" && continue`;
  - otherwise set `detail="the session ended before its ledger finished; automatic resumes exhausted"`, then `notify paused "$branch" "$log_path" "the session ended before its ledger finished — run /autonomous-sdlc-harness:branch-resume $branch to continue; $(hr_github_resume_route "$branch" "$(registry_get "$branch" engine)")"`, then `break`, so the decision stays `stop`.
  - `job_auto_resume` counts `auto_resumes`, honours `REMOTE_AUTO_RESUME_DELAY_SECS` and the deadline, and re-drops the budget's `PAUSE`. Its `user` guard is a backstop only: a user's pause reaches the `user)` arm, not this one, because Task 3 keeps the `user` reason. Reuse it unchanged.
- [ ] Update the header's `JOB MODE` block:
  - `THE DECISION` gains *a zero exit over an unfinished ledger (`unfinished`) → auto-resume, else `stop`*;
  - `THE BOUNDED AUTO-RESUME` names it among the shapes that earn one;
  - `NOTIFICATIONS` adds the exhausted `unfinished` pause to the ones naming `/autonomous-sdlc-harness:branch-resume <branch>`.
  Add a `REPRO` sub-entry to `a job`: *a stub writing a task ledger with `D` `[ ]` and exiting 0, with `REMOTE_AUTO_RESUME_DELAY_SECS=0` → launched `1 + REMOTE_AUTO_RESUME_MAX` times, `job: paused stop`, `"$j"` with `pause_reason` `unfinished`*.
- [ ] Add `unfinished:` cases to `cli/test/watcher-remote-job.test.mjs`, reusing its `taskLedger` / `ledgerTicks` helpers:
  - a stub that writes `taskLedger(branch, [])` and exits 0, under `REMOTE_AUTO_RESUME_DELAY_SECS: '0'` and `REMOTE_AUTO_RESUME_MAX: '1'` → `job: paused stop`, two prompts (the second carrying the pause-resume clause), `remote_status.json` with `status` `paused`, `pause_reason` `unfinished` and `decision` `stop`, exactly one `paused` notification naming `/autonomous-sdlc-harness:branch-resume feat_x`, and **no** `completed` notification and no *API overload* text;
  - a stub that writes every task id `[x]` (`E` `[-]`) and exits 0 → `job: completed stop` and one `completed` notification.
  - **a user's pause survives an unfinished exit:** reuse the `control poll:` case's set-up (`HARNESS_JOB_STARTED_EPOCH`, `STUB_RUN_LIST: pauseRunList(start + 5)`). The stub waits until the control poll has dropped `sdlc-harness/PAUSE`, as `HONOUR_PAUSE` does, then writes `taskLedger(branch, [])` and exits 0 **without** writing `PAUSE_ACK`. Run it under `REMOTE_AUTO_RESUME_DELAY_SECS: '0'`. Expected: `job: paused stop`; `remote_status.json` with `pause_reason` `user` and `decision` `stop`; **one** prompt only (no auto-resume); exactly one `paused` notification, naming `/autonomous-sdlc-harness:branch-resume feat_x`; no `completed` notification; `watcher.log` carries `paused (unfinished)`.
  - Extend the file header with the rule: *a job ends `completed` only over a finished ledger. An unfinished one is auto-resumed under its own name, bounded, then reported, unless the user asked for the pause, which outranks it*.
  - Record each case's red mutation: the `unfinished)` arm removed → the overload wording reappears; `unfinished` left out of `hr_remote_status_write` → `pause_reason` written empty; Task 3's `unfinished` write made unconditional (overwriting `user`) → the user-pause case shows a second prompt and `pause_reason` `unfinished`. State each was run red once against the fixture's installed copy.
- [ ] Re-baseline the three existing `progress:` cases. Each ends on an unfinished task ledger and exits 0, so it is now an `unfinished` pause, and the default 300-second `REMOTE_AUTO_RESUME_DELAY_SECS` would hold the job.
  - Pass `REMOTE_AUTO_RESUME_MAX: '0'` in each `j.job(...)` environment.
  - Change each `lastLine(result.stdout)` expectation from `'job: completed stop'` to `'job: paused stop'`.
  - Leave every progress assertion (the POST, the `Planning: done` body, the opt-out, the two `report: the forge coupling is off` lines) as it is. The `paused` lifecycle report goes to the run log, not to `watcher.log`, so the count of two is unchanged. Confirm that, rather than adjusting the count.
  - Add one comment line above the helper saying why these cases now end paused.
  - The `phases.qa` case that loops over all three engines writes no ledger and keeps `job: completed stop`. Leave it unchanged.

**Verification:**

- `npm test --workspace cli -- test/watcher-remote-job.test.mjs` passes, every pre-existing case included.
- `bash -n cli/templates/scripts/autonomous-watcher.sh` exits 0.
- In `run_job`, `unfinished)` sits before `*)`, and `git grep -n 'paused itself on API overload' -- cli/templates/scripts/autonomous-watcher.sh` still shows only the `*)` arm's notification.
