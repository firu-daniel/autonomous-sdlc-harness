### Task 11 — The job logs how long it waited for a runner, and notes a long wait on its `resumed` comment

**Goal:** A person can tell from the job log, and from the run's `resumed` comment when the wait was long, that GitHub kept a job waiting for a runner before it did anything. This is Gate 12 round 8, finding 6, suggested fix 5. Round 8 saw runner waits of 6 minutes (run `37359313663`), 10 minutes (round 3's `collect`), and one job that never got a runner. Each time nothing on the issue or pull request said why nothing moved.

**What already holds and stays.** The time budget is already measured from `HARNESS_JOB_STARTED_EPOCH`, which `harness-run.yml`'s first budget step takes once the job has a runner. A queue wait therefore never eats into the job's budget, and this task changes no budget arithmetic.

**Depends on:** Task 2, which owns `job_start_control_bound` in `cli/templates/scripts/autonomous-watcher.sh`. Task 2 makes it:
- choose the poll's starting bound: the restored bundle's value under `HARNESS_INPUT_CHAIN > 0`, else this run's `createdAt` read with `bash "$REMOTE_RUN" run-created-at "$GITHUB_RUN_ID"`, else `JOB_START_EPOCH`;
- store that bound in `JOB_CONTROL_FLOOR`.

This task adds the `createdAt` read on every path and reuses it there, so there is still at most one `run-created-at` call per job.

**Where this task stops.** This task adds a note to the job's own `resumed` report only. A chained budget continuation posts no `resumed`, by design, so its wait is logged and not commented. The trigger's `started` comment is posted before any job exists, so it cannot carry the wait. `remote-run.sh report` already accepts `--note <text>` and prints it after the event's text, so `remote-run.sh` is not edited.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh`:
  - `run_job`, or `job_start_control_bound` if the read fits there;
  - `job_report`;
  - two constants, `RUNNER_WAIT_NOTE_SECS=300` and `JOB_RUNNER_WAIT_NOTE=""` (the global);
  - a new bullet in the header's `JOB MODE` block.
- `cli/test/watcher-remote-job.test.mjs`: the runner-wait cases.

**Work:**

- [ ] **One `createdAt` read per job.** When `GITHUB_RUN_ID` is set, read this run's `createdAt` once, through the existing `run-created-at` verb, into `JOB_RUN_CREATED_AT`, before the control bound is chosen. `job_start_control_bound` uses that value instead of calling the verb again. Its order of choice stays exactly as Task 2 left it.
- [ ] **The log line.** When `JOB_RUN_CREATED_AT` is known, log `job: waited <n>s for a runner (run created <JOB_RUN_CREATED_AT>, job started <JOB_START_EPOCH>)`, where `<n>` is `JOB_START_EPOCH - JOB_RUN_CREATED_AT`, floored at 0. When it is unknown, log `job: this run's createdAt could not be read — the runner wait is unknown`.
- [ ] **The note.** When `<n> >= RUNNER_WAIT_NOTE_SECS`, set `JOB_RUNNER_WAIT_NOTE` to `GitHub took <m> minutes to start this job, so nothing moved until then.`, where `<m>` is `<n>` / 60 rounded up. `job_report` passes `--note "$JOB_RUNNER_WAIT_NOTE"` to `remote-run.sh report` when the event is `resumed` and the note is non-empty. Every other event, and a short wait, is reported exactly as today.
- [ ] **The header.** Add one `JOB MODE` bullet, `THE RUNNER WAIT`. It says three things:
  - the job logs `HARNESS_JOB_STARTED_EPOCH` less this run's `createdAt`;
  - a wait of at least `RUNNER_WAIT_NOTE_SECS` is noted on the job's `resumed` comment;
  - the budget already starts at `HARNESS_JOB_STARTED_EPOCH`, so a wait costs no budget.
- [ ] **`watcher-remote-job.test.mjs`.**
  - **A long wait on a user resume** (chain 0, `resume pause`). `GITHUB_RUN_ID: '77'`, `STUB_RUN_VIEW` with `createdAt` 600 s before `HARNESS_JOB_STARTED_EPOCH`, and `forge` `github`, as the suite's report case sets it. The stdout carries `job: waited 600s for a runner`. The `resumed` comment's body carries `GitHub took 10 minutes to start this job`.
  - **A short wait** (30 s). The log line names `30s`, and the `resumed` comment carries no `GitHub took` sentence.
  - **No `GITHUB_RUN_ID`.** The `runner wait is unknown` line.
  - **The existing chain-0 control-poll case** still makes exactly one `run view 77 --json createdAt` call. Assert the count, not just its presence.

**Verification:**

- `npm test --workspace cli -- test/watcher-remote-job.test.mjs`, from the repository root, passes.
- `bash scripts/typecheck.sh` exits 0.
- Grep `autonomous-watcher.sh` for `run-created-at`: one invocation site.
