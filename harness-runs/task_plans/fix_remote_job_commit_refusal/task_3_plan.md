### Task 3 — Classify a resumed, stall-restarted or previously parked run's ledger-less zero exit as `paused` / `unfinished`

**Goal:** In `classify_run_exit`, a zero exit whose ledger is `absent` or `unreadable` stops being `completed` when the session was not a first launch. It takes the existing `unfinished` arm instead, in local mode and in job mode alike. A first launch keeps today's `completed`.

**Where this task stops.** This task changes the watcher and its own classification suite only. The job-mode suite's cases, including the new ledger-less resume case in job mode and its `job: paused stop` line, are **Task 4's**. The other local watcher suites whose resumed stubs exit 0 with no ledger are **Task 5's**. Both depend on the contract stated in the second Work bullet below. The self-adopted copy is **Task 7's**, and the prose in `docs/` and `ARCHITECTURE.md` is **Task 8's**.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh` — `classify_run_exit` and its comment.
- `cli/test/watcher-ledger-classification.test.mjs` — re-cast and extended.

**Work:**

- [ ] **The signal, in `classify_run_exit`'s `elif [ "$rc" -eq 0 ]` arm.** The new code sits after `ledger_state` / `ledger_detail` are read and **before** `if [ "$ledger_state" = "unfinished" ]`. When `ledger_state` is `absent` or `unreadable`, compute a reason `why`, taking the first that holds:
  1. **A resume:** `resume_kind` is non-empty, which gives `why="a <resume_kind> resume"`. The local `resume_kind`, read earlier in the function by the park-loop guard, is still in scope after its registry clear. `begin_park_resume` sets `answer`. `begin_pause_resume` sets `pause`, for local pause resumes, `job_auto_resume`, the usage gate's resume and the job's `resume pause`.
  2. **A stall restart:** `registry_get "$branch" stall_restarts` is an integer above 0, which gives `why="a stall restart"`.
  3. **An earlier park:** `clar_dir` is non-empty and `max_question_index "$clar_dir"` is above 0, which gives `why="an earlier park"`. Top-level questions were ruled out by the `parked` test above, so this counts only the `answered/` archive.

  When `why` is set:
  - log `classify: '<branch>' has no readable ledger (<ledger_state>: <ledger_detail>) after <why> — not classifying it completed`;
  - set `ledger_detail="<ledger_state>: <ledger_detail>, after <why>"` and `ledger_state=unfinished`.

  The existing `unfinished` arm then runs unchanged. That gives the job-mode held `user` / `usage` / `budget` precedence, `status paused pause_reason unfinished pause_note_stale 1`, its `paused (unfinished)` log line and, locally, its one `paused` notification naming `/autonomous-sdlc-harness:branch-resume`.

  When `why` is empty, today's `classify: … — classifying on the exit code alone` line and the `completed` arm are kept byte for byte.
- [ ] **The contract Tasks 4 and 5 consume, stated in the function's comment.** Rewrite the `THE LEDGER SPLITS ONLY THE ZERO-EXIT ARM` paragraph above `classify_run_exit` so that it states:
  - **Absent or unreadable after a resume, a restart or a park.** An absent or unreadable ledger is `unfinished` after a resume (`resume_kind` `answer` or `pause`), a stall restart (`stall_restarts` > 0) or an earlier park (an archived question).
  - **The first launch keeps `completed`.** A first launch with none of these keeps `completed` and logs that it classified on the exit code alone.
  - **Which engine writes which ledger.** `task` and `user_review` write `flow_progress/<branch>_progress.md`, created by planner and fix-plan Setup before the first dispatch. `docs` writes `docs_catalog/<branch>_docs.md`, committed by the watcher before launch. So a ledger-less first launch is a pre-Setup halt.
  - **How it reaches `run_job`.** In job mode the record reaches `run_job`'s `paused)` → `unfinished)` arm, so it is auto-resumed through `job_auto_resume` up to `REMOTE_AUTO_RESUME_MAX` times. It then notifies, breaks with the default `decision=stop`, and the job prints `job: paused stop`.
  - **Why `paused` and not `failed`.** Name the measured case, Gate 12 round 13's job `41981613528`, as the reason for the rule.
- [ ] **Re-cast the two cases that encoded the defect** in `watcher-ledger-classification.test.mjs`. `task, absent` and `docs, absent` both launch through `resumeOnce`, a pause resume. Rename them `task, absent after a pause resume: paused unfinished, never completed` and `docs, absent after a pause resume: …`, and assert:
  - `assertUnfinished(f)`;
  - one `paused` notification whose detail carries `RESUME_COMMAND`;
  - the log matches `/'feat_x' has no readable ledger \(absent: .*\) after a pause resume — not classifying it completed/`.

  Update the header: its rule sentence becomes *"an absent ledger keeps `completed` only on a first launch; after a resume, a stall restart or an earlier park it is `paused` / `unfinished`"*. Replace the red-once bullet *"`absent` treated as `unfinished` → `task, absent` and `docs, absent` fail"* with the two mutations below, each run once against the fixture's installed copy, never the tracked template:
  - the resume signal ignored, which makes the resumed cases fail;
  - `absent` always treated as `unfinished`, which makes the first-launch cases fail.
- [ ] **New resumed cases, through the real resume passes.**
  - `task, absent after an answer resume`: `f.seedRecord()` (status `parked`), `writeQuestion(1)` and `writeAnswer(1)`, stub `:`, one `tick`. Assert `assertUnfinished`, the log's `after an answer resume`, the pair archived under `answered/`, and no `completed` notification.
  - `user_review, absent after a pause resume`: as the re-cast `task` case, with engine `user_review`.
- [ ] **New direct-classification cases.** For a first launch, a stall restart and an earlier park, the resume passes cannot isolate the input, so drive `classify_run_exit` itself. Use one `runBash` shell that sources the fixture's installed watcher as `helpers/watcher.mjs` → `tick` does (`. "$1" status >/dev/null`), then calls `classify_run_exit feat_x "<f.dir>" "<log>" 0`, with the record seeded by `f.seedRecord({ status: 'running' , … })` and no ledger written:
  - `task, absent on a first launch keeps completed`: `resume_kind` empty, `stall_restarts` `0`, no `answered/`. Assert `assertCompleted`, and that the log has `classifying on the exit code alone`.
  - `docs, absent on a first launch keeps completed`: as above, engine `docs`.
  - `task, absent after a stall restart`: `stall_restarts: '1'`. Assert `assertUnfinished` and `after a stall restart`.
  - `task, absent after an earlier park`: `answered/question_1.md` and `answered/answer_1.md` written, `resume_kind` empty. Assert `assertUnfinished` and `after an earlier park`.
- **Deviations from plan:** The signal's first bullet gives `why="a <resume_kind> resume"`, which renders `after a answer resume` for `resume_kind` `answer`; the new-cases bullet expects `after an answer resume`. Implemented with the article chosen by the kind's first letter (`an answer resume`, `a pause resume`). The red-once mutations ran through `harness-runs/scratch/ledgerless-resume-mutation.mjs`, which rewrites each fixture's installed watcher after `init`: resume signal ignored → the four resumed cases failed (15 pass / 4 fail); `absent` always `unfinished` → the two first-launch cases failed (17 pass / 2 fail).

**Verification:**

- `npm test --workspace cli -- test/watcher-ledger-classification.test.mjs`, from the repository root, as one plain foreground command: every case passes, the two re-cast cases included.
- `grep -n "classifying on the exit code alone" cli/templates/scripts/autonomous-watcher.sh` still prints the unchanged first-launch log line. `grep -n "not classifying it completed" cli/templates/scripts/autonomous-watcher.sh` prints the new one.
- `git diff -- cli/templates/scripts/autonomous-watcher.sh` touches only `classify_run_exit` and its comment block. `run_job`'s `unfinished)` arm is unchanged, because the reclassified record reaches it as an ordinary `unfinished` pause.
