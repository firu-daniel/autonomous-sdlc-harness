### Task 2 — The job's control poll overlaps its bound, floors it at the job's start, and logs every poll

**Goal:** A `harness pause <branch>` run that GitHub's run listing shows a few seconds late is still seen by the running job's next poll. A pause marker from before the job is never seen again. Every poll leaves one line in the job log.

Gate 12 round 8, finding 1, is the evidence:
- `@sdlc-harness pause` was accepted, and its marker run was created at 18:14:01Z.
- Job `37352762524` kept polling with success and kept advancing `control_polled_at`. It never logged `dropped PAUSE`, and it ran to completion.
- Run afterwards with the job's own starting bound, the same verb found the marker: `bash scripts/remote-run.sh pause-requested feat_invoices_5 1791223257` gave rc `0`.

The suspect is in `job_control_poll`. It moves the bound to the epoch taken just before each query. A poll that runs while `gh run list` does not yet show a just-created run moves the bound past that run. Every later poll then filters it out with `createdAt >= since`.

**Depends on:** Task 1, which changes `remote-run.sh pause-requested`'s exits to exactly this contract:
- `0` — a `harness pause <branch>` run was created at or after `<since_epoch>`;
- `5` — the read succeeded and found none;
- `1` — usage error, or the library or configuration could not be resolved;
- `3` — `gh` failed, or its answer was not the expected JSON.

Task 1's header paragraph already describes the bound this task passes. The two must match.

**Where this task stops.** This task owns `job_start_control_bound` and `job_control_poll`, and the header and registry text that describe them. It does not measure the runner wait. **Task 11** adds that later in `run_job` and `job_start_control_bound`, and depends on this task.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh`:
  - a new constant, `CONTROL_POLL_OVERLAP_SECS=300`, next to `REMOTE_CONTROL_POLL_SECS`;
  - `job_start_control_bound`;
  - `job_control_poll`;
  - the header's `JOB MODE` → `TWO PASSES ONLY A JOB RUNS` bullet;
  - the registry-key list's `control_polled_at` entry.
- `cli/templates/scripts/lib/harness-run-lib.sh`: the bundle-schema block's `control_polled_at` line, a comment only.
- `cli/test/watcher-remote-job.test.mjs`: the `control poll:` cases.

**Work:**

- [ ] **The floor.** `job_start_control_bound` keeps its order:
  1. the restored bundle's value under `HARNESS_INPUT_CHAIN > 0`;
  2. else this run's `createdAt`;
  3. else `JOB_START_EPOCH`.

  It also stores the bound it chose in a job-global, `JOB_CONTROL_FLOOR`.

  `CONTROL_POLL_OVERLAP_SECS=300` is a plain constant, not a tunable. Its comment says two things. GitHub's run listing is eventually consistent, so the window re-reads the last five minutes. A marker seen twice is harmless, because `JOB_USER_PAUSE_DROPPED` drops `PAUSE` once per job.
- [ ] **The exit map and the overlapped bound in `job_control_poll`.** Capture the verb's combined output (`out=$(bash "$REMOTE_RUN" pause-requested … 2>&1)`, `rc=$?`), then append that output to `$WATCHER_LOG`, as today. Branch on `rc`:
  - `0` — a pause. Advance the bound, drop `PAUSE`, and log the existing `dropped PAUSE (reason user)` line.
  - `5` — no pause. Advance the bound.
  - anything else, `1` included — a failed poll. Keep the existing line `the control poll for '<branch>' failed (exit <rc>) — not pausing; control_polled_at stays <since>`. The bound does not move.

  "Advance the bound", on `0` or `5`, sets the new `control_polled_at` to `max(JOB_CONTROL_FLOOR, before - CONTROL_POLL_OVERLAP_SECS)`, where `before` is the epoch taken just before the query, as today. The bundle then carries that value, so a chained job starts from an overlapped bound and floors there.
- [ ] **One line per poll.** After each poll, call `log` with the verb's last non-empty output line and the exit, for example `job: control poll of '<branch>' since <since> (exit <rc>): <last line>`. `log` writes to `watcher.log` and to stdout, which is the job log. A missed pause can then be read from the job's own log. The full output still goes to `$WATCHER_LOG`.
- [ ] **The text.**
  - The header bullet: replace "Each successful poll advances it to the epoch taken just before its query; a failed poll advances nothing and pauses nothing" with the overlapped, floored rule, the `0` / `5` / other map, and the per-poll log line.
  - The registry-key entry: "the lower bound of the next control poll — set at start, and after each successful poll the larger of that starting bound and the epoch before the query less `CONTROL_POLL_OVERLAP_SECS`".
  - `harness-run-lib.sh`'s bundle-schema line for `control_polled_at`: "the lower bound of the next control poll, or empty".
- [ ] **`watcher-remote-job.test.mjs`.** Change and add these cases:
  - *"chain 1: a pause older than the restored bound is not seen again"* asserts `control_polled_at >= start` today. It now asserts the value equals the restored floor, `start - 5`, because `before - 300` is below it. It still asserts `job: completed stop`.
  - **The acceptance case.** The listing returns no `harness pause` run on the first poll, then a marker whose `createdAt` is before that poll's `before`. Use a stub that changes its answer after its first `run list` call, keyed on a counter file in the fixture. The job still pauses with reason `user`.
  - **A usage refusal is a failed poll.** Make the verb exit `1` by any means the fixture allows, for example a `REMOTE_RUN` copy that exits 1 for `pause-requested`. The log names `failed (exit 1)`, and `control_polled_at` stays at the starting bound.
  - **The log line.** At least one `job: control poll of 'feat_x' since ` line appears in the job's stdout.

  Amend the suite header if it states the bound's rule.

**Verification:**

- `npm test --workspace cli -- test/watcher-remote-job.test.mjs`, from the repository root, passes.
- `bash scripts/typecheck.sh` exits 0.
- Grep `job_control_poll` for `0 | 1)`: no case arm still treats `1` as success.
- End to end, a running job honours a pause the listing shows late. The acceptance case is that path, driven through the real `remote-run.sh pause-requested`, and a passing run is the evidence.
