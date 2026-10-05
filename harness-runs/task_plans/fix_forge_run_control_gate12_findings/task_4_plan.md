### Task 4 — Multi-job park suite: the usage-pause and stop-then-resume sequences complete too

**Goal:** Finish item 7's acceptance criteria in the suite Task 3 created: *"The same with a budget pause and a usage pause in place of the user pause"* (the usage half) and *"A stop and resume in place of the pause."*

**Depends on:** Task 3, which created `cli/test/watcher-remote-park-sequence.test.mjs` with its header rule and the sequence helper. That helper runs a job, saves its bundle with `remote-run.sh save`, removes the registry, the clarification directory, `PAUSE_PROGRESS.md` and `remote_status.json`, and restores the bundle in `job` mode before the next job. This task adds cases through that helper and does not change it, except to add a hook for killing a job mid-run. Task 1's archive rule, the union of `resumed_for_index` and `launch_answered_set`, is what these cases assert.

**Where this task stops.** Cases only, in this one file. No production file changes.

### Targets

- `cli/test/watcher-remote-park-sequence.test.mjs` — two new cases, and the header's coverage list updated to name them.

**Work:**

- [ ] Case *"usage pause"*: job 1 parks and job 2 (`answer`) is paused by the usage gate. Use the `rateLimitRejected` stub pattern of `watcher-remote-job.test.mjs`, with a reset beyond the job's deadline (`HARNESS_JOB_DEADLINE_EPOCH`), so job 2 ends `paused` / `usage` / `wait-poller`. Job 3 (`pause`, the poller's re-dispatch) with a stub exiting 0 ends `completed`, with the pair archived.
- [ ] Case *"stop, then resume"*: job 2 (`answer`) is killed mid-session. Follow the existing case *"a job killed mid-run leaves running / continue"* — it spawns and kills its own process group. Save the bundle afterwards, as the workflow's `always()` save step does on a cancel, so its `status.json` still says `running`. Job 3 (`pause`, the user's `@sdlc-harness resume` after a stop) with a stub exiting 0 ends `completed`, with the pair archived.
- [ ] Extend the helper only as far as the stop case needs: an optional *"kill this job after the session has started"* hook, so the stop case still carries nothing but the bundle.
- [ ] Update the file's header so its coverage list names all four sequences, user, budget, usage and stop, and states that the stop case's kill is bounded and reaped by the case itself.

**Verification:**

- `npm test -- test/watcher-remote-park-sequence.test.mjs` from `cli/` passes, all four sequences included.
- In the stop case, the restored `remote_status.json` job 3 starts from says `running`: the assertion is made before job 3 runs, so the case cannot pass on a bundle that is not a stopped one.
- No case waits on the usage gate's fallback hour. The usage case reaches `wait-poller` through the deadline, as the existing *"a reset beyond the deadline"* case does.
