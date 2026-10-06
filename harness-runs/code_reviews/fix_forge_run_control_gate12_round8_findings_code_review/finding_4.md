### 4. On a re-run attempt the runner wait counts from the first attempt, and the `resumed` comment blames GitHub for hours it did not take

**File:** `cli/templates/scripts/autonomous-watcher.sh` (`job_runner_wait`) — "wait=$((JOB_START_EPOCH - JOB_RUN_CREATED_AT))"

`job_runner_wait` measures the wait as `HARNESS_JOB_STARTED_EPOCH` less the run's `createdAt`, read through `remote-run.sh run-created-at`. A re-run (**Re-run jobs** / **Re-run failed jobs**) keeps the run's original `createdAt`, while `HARNESS_JOB_STARTED_EPOCH` is the new attempt's start. A re-run is the natural way back from exactly the case this branch reports, a `run` job GitHub never started. On that path the "wait" is the whole gap since the first attempt was created, and the `resumed` comment then says, for example, "GitHub took 312 minutes to start this job, so nothing moved until then.", which is false. The code already tells re-runs apart elsewhere through `GITHUB_RUN_ATTEMPT` (`cli/templates/scripts/remote-run.sh` → `rerun_actor_listed`).

**Fix:** keep the `createdAt` read, which the control poll's starting bound reuses, but on an attempt above 1 log that the wait is not measured and set no note. In `job_runner_wait`, insert this right after the `if [ -z "$JOB_RUN_CREATED_AT" ]; then … fi` block and before `wait=$((JOB_START_EPOCH - JOB_RUN_CREATED_AT))`:

```bash
  if [ "${GITHUB_RUN_ATTEMPT:-1}" != 1 ]; then
    log "job: run attempt ${GITHUB_RUN_ATTEMPT} — this run's createdAt is its first attempt's, so the runner wait is not measured"
    return 0
  fi
```

- [ ] In the header's `THE RUNNER WAIT` bullet (the `JOB MODE` block), after "read once per job, the same read the control poll's starting bound takes.", add: "On a re-run attempt (`GITHUB_RUN_ATTEMPT` above 1) that `createdAt` is the first attempt's, so the wait is not measured and no note is added."
- [ ] In `docs/remote-execution.md` → `### Runs longer than a job` → **The runner wait is logged.**, after the sentence ending "is noted on the job's `resumed` comment.", add: "A re-run attempt keeps the run's first `createdAt`, so its wait is not measured and its `resumed` comment carries no note."
- [ ] In `cli/test/watcher-remote-job.test.mjs` → "runner wait: logged from the run createdAt, and noted on a resumed comment only when long":
  - pass `GITHUB_RUN_ATTEMPT: '1'` explicitly in the existing subtests, so a CI environment's own attempt number cannot leak in;
  - add a subtest with `GITHUB_RUN_ATTEMPT: '2'` and a `createdAt` well over `RUNNER_WAIT_NOTE_SECS` before the job start. Assert the `run attempt 2` log line, and that the `resumed` report carries no `--note`.

  Run `npm test --workspace cli -- test/watcher-remote-job.test.mjs` from the repository root. That is the only test this fix runs.
