### Task 5 — Drive the lost-reset record through job mode and through the local watcher's `tick`

**Goal:** Prove, with the exact record that stranded the fixture, that a usage-paused run with an empty `usage_resume_at` now resumes or stops within a bounded time in job mode. The record is `status paused`, `paused_by usage`, `pause_reason usage`, `usage_resume_at ""`, with `PAUSE` and `PAUSE_ACK` present and no `RESUME`. Under the local watcher the same record must be repaired and reported, and `.usage_hold` must come down once nothing is legitimately usage-paused. Also prove that the in-job wait bound fires even when the value was not lost.

**Depends on:** Task 4, which adds the helper `usage_resume_at_var <branch>` and three observable effects:
- A `paused` + `paused_by usage` record with an unusable `usage_resume_at` gets now + `USAGE_FALLBACK_RESUME_SECS` (3600). The repair logs `usage: '<branch>' is usage-paused with no usable usage_resume_at`.
- Locally, the repair sends **one** `paused` notification naming the lost reset. In job mode, only the supervision loop repairs and notifies, and the gate's part (1) leaves a lost value alone.
- In job mode, a lost value on a hosted runner ends as `job: paused wait-poller`, with a `paused` notification whose detail says the reset time was lost. An in-job wait that passes max(reset, wait start) + `REMOTE_WAIT_MAX_SECS` without a resume ends as `wait-poller`, with one `paused` notification naming the bound and `/autonomous-sdlc-harness:branch-resume <branch>`.

Assert on those effects and never on Task 4's internals. It also relies on Task 2's ordering: the gate writes `paused_by` and `usage_resume_at` before `PAUSE` exists, so a stub that reacts to `PAUSE` sees both.

### Targets

- `cli/test/watcher-remote-job.test.mjs`: new cases in the `usage:` group; the file header gains the rule for them.
- `cli/test/watcher-usage-resume.test.mjs` (new): the local-watcher cases, driven through `createWatcherFixture` → `tick`.

**Work:**

- [ ] **Job mode, lost value, hosted.** Add a case to `watcher-remote-job.test.mjs`.
  - The stub emits `rateLimitRejected(2)`. On seeing `PAUSE`, it blanks `usage_resume_at` **through the library writer**: `. <fixture>/scripts/lib/harness-run-lib.sh; hr_registry_set "$STATE/autonomous_logs/registry.json" feat_x usage_resume_at ""`. That simulates the lost write on the exact record. Only then does it write `PAUSE_ACK` and exit.
  - Env: `USAGE_CHECK_INTERVAL_SECS: '1'`, `USAGE_RESUME_MARGIN_SECS: '0'`, `RUNNER_ENVIRONMENT` empty.
  - Assert: `job: paused wait-poller`; `status().pause_reason === 'usage'`; `status().usage_resume_at` is numeric and at least now + 3600 − a small slack; exactly one `paused` notification, whose detail says the reset time was lost; one prompt only.
- [ ] **Job mode, the wait bound.** Add a case where the reset really is short, but the relaunch cannot happen.
  - The stub emits `rateLimitRejected(2)`, **not** `(1)`. On `PAUSE` it creates the kill switch `$STATE/AUTONOMOUS_STOP`, which makes `resume_paused_runs` defer (`kill_switch_active`), then acknowledges.
    - Why `(2)`: the stub emits at E + ~0.3 s (its `sleep 0.3`), where E is the whole second of the emit, so `resetsAt` = E + 2. `run_job`'s `running)` arm sleeps `POLL_INTERVAL_SECS` (1 s) **before** it calls `usage_gate`, so the gate's first read comes at least ~0.7 s after the emit, often in the next whole second. `usage_assess`'s invariant 1 (`if [ "$r" -gt 1 ] && [ "$horizon" -gt 0 ] && [ "$horizon" -le "$now" ]; then r=1; fi`) demotes the event to `allowed` once `now` (a whole-second `date +%s`) reaches the horizon. With `(1)` the horizon is E + 1, so any gate pass in the next whole second reads `allowed`, drops no `PAUSE`, never fires the kill-switch stub, and the job ends `completed stop` — a timing failure unrelated to Task 4. `(2)` gives a whole second of margin, the same margin the existing passing case *"a reset 2 seconds ahead"* uses.
  - Env: `USAGE_RESUME_MARGIN_SECS: '0'`, `REMOTE_WAIT_MAX_SECS: '2'`, `USAGE_CHECK_INTERVAL_SECS: '1'`. All three are pinned deliberately:
    - `USAGE_RESUME_MARGIN_SECS: '0'`, because the watcher default is 120 (`USAGE_RESUME_MARGIN_SECS="${USAGE_RESUME_MARGIN_SECS:-120}"`). With that default, `usage_resume_at` lands about 122 s ahead, `job_usage_wait_ok`'s `ra - now <= 2` test fails, and the job ends `wait-poller` through the **existing** path without ever waiting. The case would then prove nothing about the bound.
    - `REMOTE_WAIT_MAX_SECS: '2'` stays at 2 with the `(2)` emit: `job_usage_wait_ok` compares `ra - now <= 2` with `ra` = E + 2 and `now` ≥ E, so the in-job wait is still taken. If either value is widened, widen both together so that inequality still holds.
    - `USAGE_CHECK_INTERVAL_SECS: '1'`, not its default of 60. The **first** gate pass does not depend on it: it runs after the `running)` arm's one `POLL_INTERVAL_SECS` sleep. The reason for `'1'` is the **second** pass — the gate's own resume side — which has to fall inside the case's run; at 60 it would be a minute away. At `'1'`, the pass after the reset (E + 2) sees the reset has passed, drops `RESUME` and clears `paused_by` and `usage_resume_at` in one call (Task 2). This case drives that on purpose: `resume_paused_runs` then defers on the kill switch, so the record stays `paused` with both tags empty, and the bound fires at max(captured `ra`, wait start) + 2 s on that record. This is the "gate already resumed, relaunch held off" path, not the "value never cleared" path.
  - Assert, in this order:
    - `j.watcherLog()` matches `/is usage-paused — waiting in the job for/`, and that line comes **before** the bound's log line. A regression back to the immediate `wait-poller` path, which never logs *"waiting in the job"*, fails the case here instead of passing it.
    - A `paused` notification whose detail contains *"waiting in the job"* precedes the last one.
    - The job ends `job: paused wait-poller` within the case's run.
    - The last `paused` notification names the in-job wait bound and `/autonomous-sdlc-harness:branch-resume feat_x`, and does **not** carry the existing detail *"usage limit reached — resumes automatically after"*.
    - What the bundle carries on this path: `status().pause_reason === 'usage'`, and `status().usage_resume_at` and `status().paused_by` are both empty, because the gate's resume cleared them before the bound fired and Task 4's bound path does not rewrite them. If Task 4's bound path is later changed to write the captured `ra` back, this assertion changes with it.
  - Confirm the kill switch reaches job mode's `resume_paused_runs` by reading `kill_switch_active` and `GLOBAL_STOP`. If another way of holding the relaunch off is cleaner, use it and say why in the case's comment.
- [ ] **Local watcher, the lost value.** Create `cli/test/watcher-usage-resume.test.mjs`, opening with its rule: *a usage-paused run is never left without a resume time, a hand pause is never touched, and the launch hold is bounded by the recorded time*. Its first case:
  - Seed the record with `createWatcherFixture` → `seedRecord({ status: 'paused', paused_by: 'usage', usage_resume_at: '' })`, with `PAUSE` and `PAUSE_ACK` planted in the fixture's state directory.
  - Call `tick({ USAGE_CHECK_ENABLED: '1', USAGE_CHECK_INTERVAL_SECS: '0' })`.
  - Assert: `record().usage_resume_at` is numeric and in the future; exactly one `paused` notification naming the lost reset; `<state_dir>/autonomous_logs/.usage_hold` present.
  - A second `tick` sends no second notification.
- [ ] **Local watcher, the hold comes down; a hand pause is untouched.**
  - Second case, same file: rewrite `usage_resume_at` to `1` (the past) with the library writer, then `tick`. `RESUME` is dropped, both `paused_by` and `usage_resume_at` are empty, and `.usage_hold` is **absent** after that same pass.
  - Third case: a record `{ status: 'paused', paused_by: '', usage_resume_at: '' }`. After a `tick` the record is unchanged apart from `updated_at`, no `RESUME` exists, no notification is sent and no hold marker is created.

**Verification:**

- `cli/test/watcher-remote-job.test.mjs` and `cli/test/watcher-usage-resume.test.mjs` pass, run as the two files this task creates or edits.
- The lost-value job case exercises the path end to end: the gate's pause, the stub's ack, classification as `usage`, the repair, and the `wait-poller` hand-off. The assertions read the written `remote_status.json` and the notification recorder, not the watcher's internals.
- Every new case returns in seconds. None of them may wait on the one-hour fallback: a case that would is a Task 4 defect, and it is reported as one, not lengthened.
