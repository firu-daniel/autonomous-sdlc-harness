### Task 5 — Scope the pause note to the run it belongs to in job mode

**Goal:** Fix item 12. In job mode, a session is never handed a `PAUSE_PROGRESS.md` written by another engine, another round, or a job that did not pause. A pause resume after a stop or a kill, or after a job of a different engine, is told so ("no pause note; continue from the ledger") instead of *"This is a RESUME from a PAUSE: read …/PAUSE_PROGRESS.md"*, **whether or not a note was carried**. Moving a carried note aside and choosing the clause are two separate decisions, stated below.

**Depends on:** Task 1, which edits `cli/templates/scripts/autonomous-watcher.sh` (`spawn_engine`, `classify_run_exit`) and `cli/test/watcher-remote-job.test.mjs` first. This task edits both files after it and touches none of Task 1's archive logic. It also depends on **Task 20**, which ships just before it and adds the library function this task calls for the aside move.

**The library call this task makes (produced by Task 20, restated here):** `hr_remote_move_aside <root> <rel_path>` in `cli/templates/scripts/lib/harness-run-lib.sh`, which the watcher already sources (`hr_lib`). It moves `<root>/<state_dir>/<rel_path>` with one `mv` to `<root>/<state_dir>/autonomous_logs/remote_superseded/<epoch>[-<n>]/<rel_path>` and never removes anything. On success, `HR_REMOTE_ASIDE` holds the destination. It exits `0` moved, `1` a bad argument or a failed `mkdir` / `mv`, `2` an unresolvable configuration, and `3` nothing at the source. The watcher builds no `remote_superseded` path and no free-name search of its own. That directory's writer list in the library header is Task 20's to keep.

**The rule, decided here.** `run_job` reads the restored `remote_status.json`'s `status` and `engine` **before** it writes its own (it already reads `pause_reason` there as `prev_reason`). The rule, stated once and restated word for word by Tasks 14 and 18:

> In job mode, a carried `PAUSE_PROGRESS.md` is kept only when the job's `resume` is `pause`, the restored `remote_status.json` says `status: paused`, and its `engine` equals the job's engine. In every other case — a fresh launch (`resume none`), an answer resume (`resume answer`), a pause resume whose previous job did not pause (a stop or a kill), or a different engine — it is moved aside, never deleted, to `<state_dir>/autonomous_logs/remote_superseded/<epoch>[-<n>]/PAUSE_PROGRESS.md`.

**The clause, decided separately from the move.** A job whose `resume` is `pause` is re-launched with the stop/kill clause (Work bullet 2) whenever the restored `remote_status.json`'s `status` is not `paused` or its `engine` differs from the job's engine, **whether or not a note was carried**. The move-aside rule above only governs what happens to a note that exists; the clause depends on the restored status alone, so a run stopped before it ever paused is never pointed at a `PAUSE_PROGRESS.md` that does not exist. Tasks 14 and 18 restate this sentence as well:

> A pause resume whose previous job did not pause, or paused for a different engine, is re-launched with a clause saying there is no pause note, whether or not a note was carried.

There is no exception outside those two sentences. The move goes through the library's `hr_remote_move_aside` (Task 20), the same function `hr_remote_bundle_restore` uses for its own aside moves, and the moved note never reaches the next bundle. **Why an answer resume moves it aside:** its prompt never names the note, so keeping it would serve only a later pause resume in the same round, and that resume must be handed the note its own previous job wrote. When the answer-resumed session later pauses, it appends to a fresh `PAUSE_PROGRESS.md`, so the following pause resume reads that session's note alone. A pause resume's restored status after a stop or a kill reads `running` (`run_job` writes `running` before the spawn, and a cancelled job writes nothing after), which is how "did not pause" is detected.

**Where this task stops.** Job mode only. A local launch prompt stays byte-identical, as the existing `remote_qa_clause` comment requires (*"Empty outside job mode, so a local launch prompt is byte-identical"*). The library function and its header fence (`cli/templates/scripts/lib/harness-run-lib.sh`) are **Task 20**'s, and this task does not edit that file. Item 11's "stopped" wording on GitHub is **Task 7**'s. The docs are **Task 18**'s.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh` — `run_job`, the launch-prompt builder's pause-resume clauses (task, user-review and docs engines), `classify_run_exit`'s job-mode pause arm, and the header's registry-field block and JOB MODE paragraph.
- `cli/test/watcher-remote-job.test.mjs` — new cases.

**Work:**

- [ ] In `run_job`, read `prev_status` and `prev_engine` from `$remote_status` beside `prev_reason`. Clear a new registry field, `pause_note_stale`, with the other fresh-launch defaults. Then take the two decisions separately:
  - **Clause.** When `resume` is `pause` and either `prev_status` is not `paused` or `prev_engine` differs from `$engine`, set `pause_note_stale` to `1` — **whether or not a note was carried** — and log one line naming the reason (`prev_status` / `prev_engine`).
  - **Move aside.** Apply the rule above, `answer` resumes included: unless `resume` is `pause`, `prev_status` is `paused` and `prev_engine` equals `$engine`, and **only when** `$state_abs/PAUSE_PROGRESS.md` exists, move it aside with `hr_remote_move_aside "$worktree" "$HR_REMOTE_PAUSE_FILE"` (Task 20's function; a non-zero exit other than `3` is one warning line in the log and never fails the job). Log one line naming the reason and `$HR_REMOTE_ASIDE` **only when a move happened** (exit `0`). With no note there is nothing to move and no aside path is logged.
- [ ] In the launch-prompt builder, when `pause_resume` is set **and** `pause_note_stale` is `1`, use a stop/kill clause in place of each engine's `PAUSE_PROGRESS.md` clause: *"This is a RESUME after the previous job was stopped or ended without pausing: there is no pause note — resume strictly from the committed flow-progress ledger … continue at the first phase entry still marked [ ] and SKIP every phase already marked [x]; do NOT restart completed phases."* The docs engine's variant names its checklist instead of the ledger, as its existing clause does.
- [ ] In `classify_run_exit`'s job-mode pause arm, clear `pause_note_stale`. The session just appended its own note, so a later relaunch in the same job (`job_auto_resume`) is handed it. Registry writes reach the subshell's parent, where a shell global would not.
- [ ] Document `pause_note_stale` in the header's registry-field block. Amend the JOB MODE paragraph with the rule, and say that the aside move is the library's `hr_remote_move_aside`, so the watcher writes nothing under `remote_superseded/` itself.
- [ ] `cli/test/watcher-remote-job.test.mjs`, six cases, each reading the prompt the agent stub records:
  - restored `status` `running` + a note, `resume pause`: the prompt carries the stop/kill clause and not `PAUSE_PROGRESS.md`, the note sits under `autonomous_logs/remote_superseded/`, and the top-level note is gone;
  - restored `paused` with the same engine + a note: the prompt names `PAUSE_PROGRESS.md`, and the note is in place and byte-identical;
  - restored `paused` with engine `task`, job engine `user_review`: moved aside, stop/kill clause;
  - `resume none` with a carried note: moved aside, and the fresh prompt unchanged;
  - `resume answer`, restored `status` `parked` with the same engine, a fully answered `question_1.md` / `answer_1.md` pair seeded, and a carried note: the note sits under `autonomous_logs/remote_superseded/` and the top-level note is gone, the prompt carries the park-resume clause and names neither `PAUSE_PROGRESS.md` nor the stop/kill clause, and `pause_note_stale` stays empty (it is set only for a `pause` resume);
  - restored `status` `running`, **no** carried note, `resume pause` (a run stopped before it ever paused): the prompt carries the stop/kill clause and never names `PAUSE_PROGRESS.md`, nothing exists under `autonomous_logs/remote_superseded/`, and the log carries no aside path.

**Verification:**

- `npm test -- test/watcher-remote-job.test.mjs` from `cli/` passes, Task 1's case included.
- The clause and the move are separate in `run_job`: the condition that sets `pause_note_stale` does not test for `PAUSE_PROGRESS.md`'s existence (the sixth case pins this), and the aside log line sits on the move's success path only.
- Nothing is removed: `grep -n "PAUSE_PROGRESS" cli/templates/scripts/autonomous-watcher.sh` shows no `rm` of the note on any new path.
- `grep -n "remote_superseded\|HR_REMOTE_SUPERSEDED_DIR" cli/templates/scripts/autonomous-watcher.sh` finds no path built in the watcher. Every hit, if any, is header prose naming the library's function. The aside move is the single `hr_remote_move_aside` call in `run_job`.
- Every new code path sits behind job mode (`JOB_MODE` / `run_job`). The local resume pass's handling of `PAUSE_PROGRESS.md` (kept byte-identical, per `docs/outer-loop-verification.md` → *Pause resume*) is untouched.
