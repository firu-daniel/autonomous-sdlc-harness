### Task 4 — Repair a usage pause whose `usage_resume_at` was lost, and bound the job-mode usage wait by `REMOTE_WAIT_MAX_SECS`

**Goal:** A usage-paused record (`status paused`, `paused_by usage`) with no usable `usage_resume_at` must no longer be a state in which nothing happens. The watcher, locally and in job mode, repairs it with the gate's own one-hour fallback, logs it and reports it. The run then resumes on the wall clock and the launch hold comes down with it. Independently of any lost value, the job's in-job usage wait gets a bound, after which it ends with `wait-poller` and one notification naming the cause.

**Depends on:** Task 2, which writes `paused_by usage` and `usage_resume_at` in one `registry_set` call before `PAUSE` is dropped, and clears both in one call beside the gate's `RESUME`. A lost value is therefore no longer the common case, but a hand-edited, truncated or older-version record can still carry one, and this task makes it bounded. The cross-task contract this task relies on is the registry field meaning, unchanged. After the gate's own auto-resume, the record is `paused` with `paused_by ""`, `usage_resume_at ""` and a `RESUME` file in the working copy. That is a **legitimate** empty value, and it must never be "repaired".

**Where this task stops.**
- Tests are **Task 5's**, which drives exactly the record this task repairs, in both modes.
- Docs outside the watcher's own header are **Task 8's**.
- The gate's arm that leaves a paused, tagged run alone when its working copy or state directory cannot be reached (*"cannot reach the state directory of"*) is unchanged. It still holds `.usage_hold`, and that is a separate, pre-existing condition this branch does not take on.
- Re-deriving the reset from the stream is deliberately not done. After the pause the stream holds only the events the gate already read to compute the lost value, and `usage_assess` skips every record that is not `running`.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh`:
  - the usage tunables block (near `USAGE_RESUME_MARGIN_SECS=`);
  - `usage_gate` parts (1) and (2);
  - a new helper in the usage-gate section;
  - `job_usage_wait_ok` and its comment;
  - `run_job`'s supervision loop, `usage)` arm;
  - the header's `THE USAGE GATE` bullets, JOB MODE's `THE DECISION` bullet, and the `usage_resume_at` registry field comment.

**Work:**

- [ ] **One named fallback.**
  - Name the gate's one-hour fallback once, as an internal constant (for example `USAGE_FALLBACK_RESUME_SECS=3600`). It is not an environment value. Say beside it why no environment override exists: it is the time guessed for a missing reset, not a policy knob.
  - Use it at the pause side's existing `[ "$resume_at" -le 0 ] && resume_at=$((now + 3600))`.
  - Add a helper, `usage_resume_at_var <branch>`, called **unsubstituted**, because `log` writes to stdout through `tee`. It sets `USAGE_RESUME_AT` to the record's usable epoch and `USAGE_RESUME_REPAIRED=0`.
  - When the record is `paused` with `paused_by usage` and `usage_resume_at` is empty or non-numeric, it instead writes `usage_resume_at` = now + the fallback through `registry_set`, and logs `usage: '<branch>' is usage-paused with no usable usage_resume_at ('<raw>') — assuming the gate's fallback, resume ~<stall_human_time>`. It then sets `USAGE_RESUME_AT` to that value and `USAGE_RESUME_REPAIRED=1`.
  - A record without `paused_by usage` is never repaired and never re-tagged, so a hand pause is never auto-resumed.
- [ ] **`usage_gate` part (1), the resume side.** Replace the *"No usable resume time is not a reason to resume"* skip with a call to the helper.
  - When it repaired, send **one** `notify paused` naming the cause and the ways on: that the recorded reset was lost, the assumed resume time, and that dropping `<state_dir>/RESUME` resumes it sooner. Then `continue`. The repaired time is in the future, and the repair makes the value usable, so no later pass notifies again.
  - **In job mode (`JOB_MODE=1`), part (1) neither repairs nor notifies.** It leaves a lost value alone and `continue`s. The supervision loop's `usage)` arm owns the repair and the job's notifications (next bullets). Otherwise a gate pass in the `running` arm could repair first, and the job would send two `paused` notifications for one pause.
  - Rewrite the comment to say what now happens.
  - Part (3) needs no code change. `usage_paused_count` still counts the record while it waits, and it stops counting it on the pass whose part (1) drops `RESUME` and clears both tags. Update the part (3) comment to say the hold is therefore bounded by the recorded or repaired time.
- [ ] **`job_usage_wait_ok`.** Replace the comment *"An empty usage_resume_at means the gate has already dropped RESUME"* with the two cases it must tell apart:
  - `paused_by usage` still set with no usable time means the value was **lost**. Call the helper, then decide on the repaired epoch through the existing deadline, self-hosted and `REMOTE_WAIT_MAX_SECS` tests. With a one-hour fallback on a hosted runner, that is `wait-poller`.
  - `paused_by` empty means the gate **already dropped `RESUME`**. Return 0, and let the next `resume_paused_runs` relaunch the run.
- [ ] **`run_job`'s `usage)` arm.**
  - When `usage_waiting` is `0`, call `job_usage_wait_ok` **before** reading `ra`, so `when` and both `notify paused` details use the repaired time. When the helper repaired, those details say that the reset time was lost and is assumed.
  - Record the wait's start epoch and the `ra` it waits on, captured once, because the gate's own resume clears `usage_resume_at` later in the same wait.
  - On every later iteration, once `usage_gate` and `resume_paused_runs` have run and the record is still `paused`: if now is past max(captured `ra`, wait start) + `REMOTE_WAIT_MAX_SECS`, end the wait. Set `decision=wait-poller`, and set `detail` to say the in-job usage wait passed its bound without a resume. Send one `notify paused` naming that cause and `/autonomous-sdlc-harness:branch-resume <branch>` as the manual way on, then `break`.
  - Self-hosted runners are bounded too, by the same past-the-reset rule, so no runner waits forever.
- [ ] **The watcher's header.**
  - `THE USAGE GATE` bullets: a paused run whose reset time is missing is given the fallback and reported once, and the hold marker is bounded by that time.
  - JOB MODE `THE DECISION` bullet: the lost-time repair before the wait-or-poller choice, and the new bound on the in-job wait.
  - The `usage_resume_at` field comment: the value can be written by the repair as well as by the pause side.

**Verification:**

- Read `usage_gate` part (1): a `paused` record with `paused_by` empty is skipped exactly as before, whatever its `usage_resume_at`, so the hand-pause rule stands.
- Read `run_job`'s `usage)` arm: every path through it either relaunches, `break`s, or reaches a comparison against a bound derived from values captured at wait start. There is no path whose only exit is `status` changing on its own.
- Grep the watcher for `now + 3600` and find none outside the named constant's definition.
- `bash scripts/typecheck.sh` passes. The behaviour is exercised end to end by Task 5, which drives both the job-mode and the local `tick` paths through this helper.
