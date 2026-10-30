### Task 3 — Split the watcher's zero-exit arm on the ledger: `completed` when finished, `paused` / `unfinished` when not

**Goal:** A session that exits 0 is `completed`, and sends "branch ready for review", only when the run's own ledger says the run finished. A session that exits 0 over an unfinished ledger becomes a `paused` record with `pause_reason` `unfinished`. `/autonomous-sdlc-harness:branch-resume` and `resume_paused_run` already resume that record from the ledger, which is the same route `fix_task_offer_check_script` is being restarted by today by hand.

**Depends on:** Task 1, which adds `hr_run_ledger_state <state_abs> <branch> <engine>` to `lib/harness-run-lib.sh`. It prints `<state> <detail>` and returns 0 `finished`, 1 `unfinished`, 2 `absent` or 3 `unreadable`. An empty engine means `task`, and the docs engine's ledger is its checklist. Also Task 2, which edits the same file first (`spawn_engine`'s subshell and the header). This task calls the reader and restates nothing it decides.

**Where this task stops.** `classify_run_exit`'s new arm writes the record in both modes. In job mode it notifies only when it keeps a `user` reason. What `run_job` does with a `paused` / `unfinished` record is **Task 4's**. So are two things in `cli/test/watcher-remote-job.test.mjs`: the case that pins the kept `user` reason, and the three `progress:` cases. The `progress:` cases end on an unfinished task ledger and expect `job: completed stop`, and this task's change turns them into an `unfinished` pause. The docs and the `scripts/` copies are Tasks 7 and 9's.

**The order does not change.** `stall_killing`, then the clone sync, then `PAUSE_ACK`, then the answered-pair archival, then the park-loop guard and `parked`, then `rc`. The ledger check only splits the existing `elif [ "$rc" -eq 0 ]` arm. A paused or parked exit is classified exactly as today, whatever its ledger says.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh` — `classify_run_exit`, `launch_run`, `begin_pause_resume`, the registry field block (`status`, `pause_reason`), and the header's `REPRO` block.
- `cli/templates/scripts/autonomous-notify.sh` — the `paused` event's message and its vocabulary line.
- `cli/test/watcher-ledger-classification.test.mjs` (new) — the local classification suite.

**Work:**

- [ ] **`classify_run_exit`.** In the `rc -eq 0` branch, call `hr_run_ledger_state "$worktree/$state_rel" "$branch" "<engine>"`. The engine is `registry_get "$branch" engine`, and empty means `task`. Skip the call, and keep today's outcome, when `state_rel` was unresolvable: the function already logs `classifying … on the exit code alone`.
  - **`unfinished`:** do not touch `pid` or the watchdog counters (the `PAUSE_ACK` arm does not either). Log `run '<branch>' paused (unfinished) — the session exited 0 before its ledger finished (<detail>); resume with /autonomous-sdlc-harness:branch-resume <branch>` in every case below.
    - **Job mode, with `pause_reason` already `user`.** `job_control_poll` recorded a GitHub pause request and dropped `PAUSE`, and the session exited before honouring it. Write `registry_set "$branch" status paused` only, so the reason stays `user`, as the job-mode `PAUSE_ACK` arm keeps it (`if [ "$reason" != "user" ]`). Read the reason **before** the status write. Then send the same notification that arm sends for `user`: `notify paused "$branch" "$log_path" "paused as you asked — run /autonomous-sdlc-harness:branch-resume $branch to continue; $(hr_github_resume_route "$branch" "$(registry_get "$branch" engine)")"`. `run_job`'s `user)` arm notifies nothing, so this is the only notification. Leave the user's `PAUSE` file in place. Overwriting the reason would send the record to Task 4's auto-resume arm, and `begin_pause_resume` would delete that `PAUSE` (`harness-runs/lessons.md` → *Unattended control loops*, on re-checking an enable another actor can set).
    - **Otherwise:** `registry_set "$branch" status paused pause_reason unfinished`, in **one** write.
      - Outside job mode, `notify paused "$branch" "$log_path" "the session ended before its ledger finished (<detail>) — run /autonomous-sdlc-harness:branch-resume $branch to continue from the ledger"`.
      - In job mode, notify nothing: `run_job` decides and notifies (Task 4), as it already does for every reason but `user`.
  - **`finished`:** today's `completed` arm, byte for byte: counters cleared, `completed — branch ready for review`, one `completed` notification, the remote QA-skip detail unchanged.
  - **`absent` / `unreadable`:** the same `completed` arm, preceded by one `log` line: `classify: '<branch>' has no readable ledger (<state>: <detail>) — classifying on the exit code alone`.
- [ ] **`pause_reason` hygiene, now that a local record can carry one:**
  - in the local `PAUSE_ACK` arm, `registry_set "$branch" status paused pause_reason ""` (one write, replacing `status paused` alone), so a hand or usage pause never shows a stale `unfinished`;
  - in `launch_run`, add `pause_reason ""` to the reused-key resets beside `paused_by "" usage_resume_at ""`;
  - in `begin_pause_resume`, clear it in the write that sets `status running`. Job mode's later writes (`job_auto_resume` re-dropping `budget` after it, `job_control_poll`'s `user`) still land after that clear. Check `job_auto_resume` and `run_job`'s `pause)` case read no `pause_reason` between `begin_pause_resume` and their own write.
- [ ] **The registry field block and the header.**
  - `status`: `paused` is reached by a `PAUSE` honoured **or** a zero exit over an unfinished ledger.
  - `pause_reason`: add `unfinished`. `classify_run_exit` writes it in both modes when a session exits 0 before its ledger finished (task / user-review: the flow-progress ledger, with engine and round matching; docs: the checklist). In job mode it never replaces a `user` reason already recorded. Locally it waits for `/autonomous-sdlc-harness:branch-resume`, carrying no `paused_by`, so the usage gate never resumes it. In job mode, see JOB MODE. Say `pause_reason` is now also written locally, by this arm only, and cleared by the local pause arm, `launch_run` and `begin_pause_resume`.
  - Extend `classify_run_exit`'s comment: the ledger splits only the zero-exit arm, an absent or unreadable ledger keeps `completed`, and why. Planner and fix-plan Setup create the ledger before the first dispatch, and the watcher commits the docs checklist before launch, so a session cut short mid-dispatch always has one, while a ledger-less exit is a pre-Setup halt or a flow that writes none.
  - Add `REPRO` entries to the `a launch` family: a stub that writes a task ledger with `D` `[ ]` → `paused`, `pause_reason unfinished`, one `paused` notification naming `branch-resume`, no `completed`; all settled → `completed`; a docs checklist with a `[ ]` entry (`registry_set feat_x engine docs` first) → `paused` / `unfinished`.
- [ ] **`autonomous-notify.sh`.** The `paused` message becomes `Run '$BRANCH' is paused. $resume_hint`. Its vocabulary line becomes *`paused` — the run yielded at a clean checkpoint, or its session ended before its ledger finished — idle until RESUME*. The detail carries which, so `honored a PAUSE request` stops misdescribing the new pause and job mode's overload pause. No event word is added: the vocabulary stays seven words.
- [ ] **Create `cli/test/watcher-ledger-classification.test.mjs`** on `createWatcherFixture`. Each session is launched by `seedRecord({ status: 'paused', engine })` plus an empty `sdlc-harness/RESUME`, then one `tick`. The stub body writes its ledger into its own working copy (`$PWD/sdlc-harness/...`). The header opens with the rule: *a zero exit is `completed` only over a finished ledger; over an unfinished one it is `paused` with `pause_reason` `unfinished` and sends no `completed` notification; an absent ledger keeps `completed`; and a pause or a park outranks the ledger*. Cases:
  - **task, finished:** every id `[x]` (`E` `[-]`) → `completed`, one `completed` notification, empty `pause_reason`.
  - **task, unfinished:** every id `[ ]` → `paused`, `pause_reason` `unfinished`, one `paused` notification whose detail names `/autonomous-sdlc-harness:branch-resume feat_x`, **no** `completed` notification, and `watcher.log` carries `paused (unfinished)`.
  - **task, absent:** no ledger → `completed`, plus the `has no readable ledger (absent` line.
  - **user_review, stale round:** a round-1 ledger all `[x]` with `user_reviews/feat_x_review_2.md` present → `paused` / `unfinished`. The same with only `feat_x_review.md` → `completed`.
  - **docs:** the checklist all `[x]` → `completed`; one `[ ]` → `paused` / `unfinished` and no `completed`; no checklist → `completed`.
  - **order:** an unfinished ledger plus an unanswered `question_1.md` → `parked`, `pause_reason` empty. An unfinished ledger plus `PAUSE_ACK` → `paused` with `pause_reason` empty.
  - **hygiene:** after the unfinished case, drop `RESUME` and tick again with a stub that writes a finished ledger → `completed`, `pause_reason` empty.
  - The header records each case's red mutation and states each was run red once against the fixture's installed copy, never the tracked template: the reader's result ignored (always `completed`) → the unfinished, stale-round and docs-`[ ]` cases; `absent` treated as `unfinished` → both absent cases; the check moved above `PAUSE_ACK` → the order cases; the `begin_pause_resume` clear removed → the hygiene case.

**Verification:**

- `npm test --workspace cli -- test/watcher-ledger-classification.test.mjs` passes.
- `bash -n` exits 0 on both edited scripts.
- `git grep -n 'pause_reason unfinished' -- cli/templates/scripts/autonomous-watcher.sh` shows one `registry_set` write, in `classify_run_exit`, and `status paused pause_reason` appears in the same `registry_set` call. That write sits on the branch the job-mode `user` test does not take.
- Reading `classify_run_exit` top to bottom, the tests still run `stall_killing` → `PAUSE_ACK` → archival → park-loop / `parked` → `rc`, and the only new branch sits inside the `rc -eq 0` arm.

**Deviations from plan:**

- The docs `REPRO` entry says *launched with `docs` in place of `task`* rather than *`registry_set feat_x engine docs` first*: the `a launch` entry calls `launch_run … task`, and `launch_run` writes `engine` from that argument, which would overwrite a prior `registry_set`.
- `bash -n` on the two edited scripts was refused by the tool layer (twice, as single plain commands). The syntax claim rests on `bash scripts/typecheck.sh`, whose `check-shell-parse` step reported `97 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`, and on the new suite sourcing and running the edited watcher in all 11 cases. The notifier is replaced by a recorder in the watcher fixture, so its edit is covered by the parse check alone.
- The red mutations were run through `bash scripts/scratch-run.sh harness-runs/scratch/ledger-red-driver.mjs`, which patched each fixture's installed watcher (never the tracked template). Beyond the cases the plan names, *reader ignored* also reddens `hygiene` (its precondition is the unfinished pause) and *check moved above `PAUSE_ACK`* also reddens `task, unfinished` (the mutated arm sends no notification); the test header records both.
