# Task plan review — iteration 0

## Must Fix

1. **Task 2 exceeds the 5-bullet granularity ceiling** — `task_2_plan.md`.
   The `**Work:**` list has six bullets: **The floor.**, **The exit map in `job_control_poll`.**, **The overlapped bound.**, **One line per poll.**, **The text.** and **`watcher-remote-job.test.mjs`.** The ceiling is 20 points **or** 5 `**Work:**` bullets, whichever binds first. The 15 points are within budget, but the bullet count is not.
   **Fix:** Bring `task_2_plan.md` to five `**Work:**` bullets or fewer. Fold **The overlapped bound.** into **The exit map in `job_control_poll`.**, since both describe what a `0` / `5` answer does to `control_polled_at`. If you split the task instead, keep the split single-layer (`cli`), link the halves by `**Depends on:**`, and update the story index's readiness list and Task 11's `**Depends on:**` text to match.

2. **A first run whose job GitHub never started cannot be resumed, and the plan does not record that it declines this** — `task_8_plan.md` (and the story index's `## Context`).
   A trigger-started first run that no runner acquires has no older run carrying a bundle. Task 6 therefore classifies it as Case 5, `failed`. `control_resume` (`remote-run.sh` → `control_resume`) accepts only `paused` and refuses `failed`: "only a paused run can be resumed …". Its way on is "applying the trigger label to its issue again", which starts a new indexed branch. Task 8 then names the Run workflow form for every case except `paused`-with-engine. Two consequences:
   - Task 7's `started`-marker reading (`started` gives `task`) can never take effect on the path it exists for.
   - The prompt's requirements are left unmet, and the plan does not say so.

   The relevant prompt text:
   - Finding 3 **Expected**: *"a run that ended without its job ever running is reported, as `failed` or as `stopped`, with a `resume` hint"*.
   - Finding 6 **Expected**: *"Every recovery path (`resume`, the poller, the form) works even when the failed job left no bundle."*
   - Finding 6, suggested fix 1: *"comment `@sdlc-harness resume` to retry"*.

   The Context claims the branch fixes "the parts of finding 6 that its Expected line names". It lists no decline for this case. Task 13's "Not built" list covers only chained and poller dispatches.

   A pause resume of a branch with no bundle anywhere is safe. `verb_restore` treats "no previous bundle" as the branch's first job: `remote-run.sh: no previous bundle for $branch; this is its first job`.

   **Fix:** In `task_8_plan.md`, choose one of these and carry the choice into `task_6_plan.md`, `task_13_plan.md` and `task_14_plan.md`:
   - **(a) Make it resumable.** Have a never-started run with no bundle anywhere and a recovered engine map to a resumable state. For example, Task 6 or Task 7 classifies Case 5 plus `RS_NOT_STARTED=1` plus a non-empty engine as `paused` / `killed`, and `collect` names `@sdlc-harness resume`. Add an acceptance case for a never-started first run, on the issue only, that resumes with `engine=task` from the `started` marker.
   - **(b) Decline it explicitly.** Record a reasoned decline in the story index's `## Context` and in Task 13's **Not built** list, naming the Expected line it leaves unmet. Then drop the `started` mapping from Task 7, since it would be dead.

3. **Task 9 can relabel a finished run `failed` because of transient download errors** — `task_9_plan.md`.
   The new path counts every completed run whose bundle is listed but cannot be downloaded. That covers every branch's newest finished run, including delivered, parked and user-paused ones, and not only usage-paused ones. Two problems follow:
   - **The counter never resets.** It uses `poll_state_get "$branch" failures` with no reset after a successful download. A later success that reads "not usage-paused" returns 1 and leaves the entry in place. So sporadic, non-consecutive download failures on a long-lived branch add up over ticks.
   - **The bound's report is `failed`.** It sends `notify failed …`, which reaches `forge_report failed`. That posts *"The harness run on `<br>` failed. Its log is `run.log` …"* and sets `sdlc-harness: failed`. It can land on a pull request that was `done`, or on a run that is `parked` and waiting for an answer.

   The run's real state is unknown on this path; only the download failed. Finding 6 suggested fix 6 asks for the failure to be "waiting (or *failed*, reported)", not for the run itself to be declared failed.

   **Fix:** In `task_9_plan.md`:
   - reset the download-failure count when a later download of the same run succeeds, so that only consecutive failures count;
   - at the bound, report the unreadable bundle without asserting the run's state. Do not send `forge_report failed`. For example, send a push notification only, or a comment that sets no state label and names the download error and the manual way on.
   - add a case: a `completed`/delivered bundle whose download fails at the bound leaves the item's label unchanged.

4. **Scope register, disposition (i): D9 reaches a site that has no row** — the story index (`fix_forge_run_control_gate12_round8_findings_story_plan.md`), `## Scope register`.
   Re-walking D9 over `cli/templates/scripts/remote-run.sh`'s header, in file order, reaches the paragraph `WHAT IT NEVER DOES. It never launches a local session …`. It enumerates each verb's writes, and the plan makes three of its statements false:
   - *"`collect` writes its round file and its settledness directory under `RUNNER_TEMP` (removed), at most one comment on the pull request, plus what its `review` child writes"*. After Task 8, `collect` can post a `not_started` comment on the **issue**, set state labels on both items, and send a push notification. D9 rule (f) reaches this.
   - *"`start`'s writes are the prompt committed on `origin/<branch>` …"* and the matching `review` clause. After Task 4, `hr_push_landed` also fetches and force-writes `refs/remotes/origin/<branch>` after a failed landing. D9 rule (h) reaches this.
   - *"For `fetch`, <out_dir> only"* and *"`… list` and `status` write nothing"*. After Task 7, `remote_state` on a never-started run calls `forge_dispatch_engine_var`, which runs `forge_fetch_branch`, a `git fetch` that writes `refs/remotes/origin/<branch>` in the root checkout. D9 rule (f) reaches this.

   No row in the register names this paragraph. Row 13's `WHAT IT NEVER DOES` is `push-branch.sh`'s.
   **Fix:** Add a row for `remote-run.sh` header → `WHAT IT NEVER DOES` with disposition `change`. Assign each clause to its task:
   - Task 8: `collect`'s writes;
   - Task 4: the landed check's fetch in `start` and `review`;
   - Task 7: the fetch on the `fetch` / `status` / `sync` / `control` derivation paths.

   Add the paragraph to that task's or those tasks' `### Targets` lists and `**Work:**` bullets.

5. **Scope register, disposition (ii): no entry reaches the poller-bound descriptions that Task 9 makes false** — the story index (`fix_forge_run_control_gate12_round8_findings_story_plan.md`), `## Scope register`.
   Task 9 makes `HARNESS_POLL_MAX_DISPATCH_FAILURES` and the carried `failures` count also bound **download** failures. These sites still describe them as counting failed re-dispatches only:
   - `cli/templates/scripts/remote-run.sh` header → `` `continue` AND `poll` CLOSE THE LOOP WITHOUT THIS MACHINE `` → the `HARNESS_POLL_MAX_DISPATCH_FAILURES` entry ("`poll` only: failed re-dispatches of one paused run before it gives up");
   - `cli/templates/github/workflows/harness-resume.yml` header → `WHAT IT READS.` → `HARNESS_POLL_MAX_DISPATCH_FAILURES (failed re-dispatches of one paused run before the poller gives up on it …)`;
   - `harness-resume.yml` header → `WHAT IT WRITES.` ("the failed-dispatch count `poll` carries to the next tick");
   - `docs/remote-execution.md` → `## 7.` → `### Every secret and variable` → the `HARNESS_POLL_MAX_DISPATCH_FAILURES` table row ("failed re-dispatches of one paused run before the poller gives up on it").

   None is a row. D9's decision rule (f) reads "a run that left no bundle", which a listed-but-undownloadable bundle is not. D10 does not traverse `remote-execution.md` → `## 7.`.
   **Fix:**
   - Widen D9's decision rule with "(i) what the poller's failure count and its bound count".
   - Widen D10's traversal to include `remote-execution.md` → `## 7.` → `### Every secret and variable`, under the same rule (i). Alternatively, add a command entry: `git grep -nE "HARNESS_POLL_MAX_DISPATCH_FAILURES|failed-dispatch count" -- docs cli/templates`.
   - Add one row per site above, each `change`, owned by Task 9 for the templates and Task 13 for the doc. Add the sites to those tasks' `### Targets` lists.

6. **Task 8 puts the way on into `notify`'s `<forge_note>`, against `notify`'s header contract, and does not amend that header** — `task_8_plan.md`.
   The comment above `notify` in `remote-run.sh` states: *"<forge_note> is the comment's, naming no slash command and no shell command, and states only what happened, since `forge_report` adds the next action."* The header's `continue`/`poll` paragraph repeats it: *"with a note of its own that names no slash command and no shell command"*. Task 8's `verb_collect` step 3 instead passes `"<the reason from $BS_DETAIL, then the way on>"` as the note. Task 8's own `forge_report not_started` arm adds no next action: it is the fixed sentence, then the note, then the URL.

   `.claude/context/cli.md` → `## What "done" means here`: *"A reviewer holds a change to its module's own header. Where the header states a rule, the change either satisfies it or amends the header in the same edit."* The plan does neither.
   **Fix:** In `task_8_plan.md`, have the `not_started` arm of `forge_report` compose the way on, as every other arm does for its event. Pass the recovered engine and state through a job-global, alongside `REPORT_NOT_STARTED_STATE`. The note then carries only what happened: GitHub's reason. Alternatively, amend the `notify` header comment in the same task to state the exception, and list it in `### Targets`.

## Should Fix

- **Task 8's form route names an artifact that does not exist** — `task_8_plan.md`. With an empty `BS_ENGINE`, `hr_github_resume_route "$branch" ""` prints *"engine the run's own (the `engine` field of `status.json` in its `harness-state` artifact)"*. A run whose job never started has no such artifact. `control_resume_dispatch` already handles the empty-engine case by passing `"<task, user_review or docs: the one the run was started with>"`. Use the same text here.
- **`notify not_started` sends an event word outside `autonomous-notify.sh`'s vocabulary** — `task_8_plan.md`. That script's header calls its seven words a contract. An unknown word is delivered under the generic title `Run (not_started) — <branch>`. State in Task 8 that this is intended, or send the push notification under `failed` / `paused`, matching the label it sets, while `forge_report` keeps `not_started`.
- **Task 9's new failure accounting must honour `may_dispatch 0`** — `task_9_plan.md`. `poll_branch`'s header says *"With may_dispatch 0 nothing is sent and nothing notified"*, and `poll_recheck` calls it that way. Gate the new `poll_state_put` and `notify failed` on `may_dispatch -eq 1`, as the existing dispatch-failure path does through its `may_dispatch` checks.

## Nice to Have
