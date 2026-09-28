`fix_registry_write_race` closes a lost-update race in the run registry that 0.4.0's remote execution made
reachable. A job-mode run that the usage gate pauses can lose its recorded reset time and then wait forever for a
resume that never comes. Under the local watcher, the same loss strands the run and holds every new launch for the
repository. The fault also hangs `cli/test/watcher-remote-job.test.mjs` indefinitely, and with it gate 4 of
`scripts/run-gates.sh` and a whole Run gates round. Three things are wrong and all three are in scope: the race itself,
how both the job-mode and the local watcher handle the empty value the race leaves behind, and a test suite with no
bound on a hung case.

> ⚠️ **Find every anchor in this prompt by its quoted text or function name, never by line number.** The fixes below
> are **candidate approaches, not instructions** — verify each against the real code and the real contracts before
> planning it, and say so in the plan if a better one exists or if one of them is wrong.

---

## Where it was seen

Run gates round 1 of `fix_remote_job_permission_profile`, 2026-09-28. Gates 1–3 passed. Gate 4 (`npm test`) then sat
for over ten minutes in one case: `watcher-remote-job.test.mjs` → *"usage: a short reset is waited out in the job, a
reset past the deadline goes to the poller"* → *"a reset 2 seconds ahead -> the run completes in the same job"*. The
fixture's watcher, `autonomous-watcher.sh job feat_x task none`, was looping on `sleep "$POLL_INTERVAL_SECS"` in the
job supervision loop's `paused` → `usage` arm. Killing that process let the gate finish (`# fail 2` of 1007).

The fixture's state when it was killed:

- Its `watcher.log` said, in order: `usage auto-pause (state=rejected, trigger=warning): dropped sdlc-harness/PAUSE …
  (auto-resume ~<epoch + 2 s>)`, then `run 'feat_x' paused (PAUSE honored, reason usage) — rc=0`, then `job: 'feat_x'
  is usage-paused — waiting in the job for the reset`. Nothing after that.
- The registry record `feat_x` held `status: paused`, `paused_by: usage`, `pause_reason: usage` — and
  **`usage_resume_at: ""`**, although the log line above shows the gate had computed and written a value.
- `sdlc-harness/PAUSE` and `PAUSE_ACK` were present, and `RESUME` was never dropped. The stub's launch counter stood
  at 1, so the relaunch the case expects never happened.

The case had passed on `feat_remote_execution_github_actions` before its hand merge of the Run gates and test-suite
run-time work (`a75f949`). It passed again in round 2 of the same Run gates phase, on a tree that changed nothing near the
registry writer or the job-mode usage wait. It passes and hangs on identical code, so a single green run proves
nothing about the fix. That merge changed none of the watcher or library code. It brought in concurrent test
execution (`cli/test/helpers/concurrency.mjs`, `cli/test/helpers/fixture.mjs`), whose CPU load widens the window
below. No suite ran on the merged tree before it reached `dev` in `925e6ca` (PR #33 had no checks).

## What is wrong

1. **`hr_registry_set` is an unlocked read-modify-write.** `cli/templates/scripts/lib/harness-run-lib.sh` →
   `hr_registry_set` reads the whole registry with `jq`, writes a temp file and `mv`s it over the registry. In job
   mode two processes write the same record at the same moment:
   - the supervision loop, through `usage_gate`'s pause side, writes `paused_by usage`, then `usage_resume_at`;
   - the engine's background subshell (`spawn_engine`'s `( … ) &`), through `classify_run_exit`'s job-mode pause
     branch, reads `paused_by`, then writes `pause_reason` and `status paused`.

   When the subshell's read lands after `paused_by` and before `usage_resume_at`, its `mv` puts back a copy without
   `usage_resume_at`. That is exactly the state above. The test stub exits within 0.1 s of seeing `PAUSE`, which puts
   its exit right inside the gate's write window, so the case hits it whenever the host is loaded. Job mode is not the
   only exposure:
   - **The local watcher** has the same pair of writers. `watch_loop` → `tick` → `usage_gate` writes the pause tags,
     while the run's background subshell runs `classify_run_exit`'s local pause branch, which writes `status
     paused`.
   - **`remote-run.sh`** writes the same registry through `hr_registry_set` from a separate process (for example
     `remote_stopped_at`, then `status failed`), concurrently with the local watcher.

   Check every concurrent writer, not only the pair above.
2. **Job mode waits forever on an empty `usage_resume_at`.** `job_usage_wait_ok` returns 0 when the value is not an
   integer, and the comment above it reads the empty value as *"the gate has already dropped RESUME"*. `usage_gate`'s
   resume side skips a paused record whose `usage_resume_at` is empty or non-numeric, by design (*"No usable resume
   time is not a reason to resume"*). Together, a usage-paused job with no recorded time neither resumes nor stops.
   With `HARNESS_JOB_DEADLINE_EPOCH` unset, as in the test, nothing bounds the loop. On a runner the only exit is the
   Actions job timeout, and it spends billed minutes waiting.

   **The local watcher strands the run too, and blocks the whole repository.** The same skip in `usage_gate`'s resume
   side leaves a local run `paused` with `paused_by: usage` until someone drops `RESUME` by hand. `usage_paused_count`
   still counts that record, so part (3) of `usage_gate` keeps `.usage_hold` up, and every new inbox drop for the
   repository waits behind it with no message saying why.
3. **Nothing bounds a hung test.** `node --test` runs with no per-test timeout, and the job fixture's `runBash` waits
   for the watcher without one. One hung case holds gate 4, and the Run gates phase's `run-test-suite.sh` call, until
   someone kills it by hand. The headless session's Bash call ran into its own timeout and moved to the background.
   The run could only wait on it.

## Candidate approaches

- **Finding 1:** serialize `hr_registry_set` with a lock around the read, write and `mv`. macOS has no `flock`, and
  the library already takes `mkdir`-based locks elsewhere, so follow that pattern, including its stale-lock handling.
  Reads through `hr_registry_get` can stay unlocked, because the `mv` swap is atomic. Consider a multi-key set, so
  that `paused_by` and `usage_resume_at` (and the other pairs written back to back) land in one write. A lock alone
  still lets a reader see one without the other.
- **Finding 2:** have job mode treat a usage pause with no usable `usage_resume_at` as its own state. Either re-derive
  the time from the stream the way `usage_assess` does, fall back to the gate's one-hour default, or stop with a
  decision and a notification naming the cause. Correct the comment above `job_usage_wait_ok`. Bound the `usage`
  arm's in-job wait by `REMOTE_WAIT_MAX_SECS` whether or not the value was lost. Give the local watcher's resume side
  the same treatment. A `paused_by: usage` record with no usable time must get a time or a notification, and must
  not hold `.usage_hold` up indefinitely. Keep the rule that a hand pause (no `paused_by`) is never auto-resumed.
- **Finding 3:** give the suite a per-test timeout (`node --test --test-timeout`, or `{ timeout }` on the watcher and
  job suites), sized well above the slowest honest case. Also give the fixture's `runBash` a kill-on-timeout, so a
  hung watcher and its children are reaped rather than left behind. A timed-out case must fail by name in the TAP
  output.

## Acceptance criteria

- A test drives many concurrent `hr_registry_set` calls from separate processes, each writing a different key of one
  record, and every key is present afterwards. It fails against the current writer.
- The job-mode usage case is run enough times under load to show the race closed, not just once. Record how that was
  measured.
- A job-mode run whose record is usage-paused with an empty `usage_resume_at` resumes or stops within a bounded time,
  and a test drives that exact record.
- The same record under the local watcher (`watch` / `tick`) is resumed or reported, and `.usage_hold` comes down
  once nothing is legitimately usage-paused. A test drives it.
- The concurrent-writer test covers the local watcher's pair and a `remote-run.sh` write racing a watcher write, not
  only job mode's.
- A deliberately hung watcher case fails with a timeout message naming the test, and leaves no watcher process behind.
- `docs/watcher.md` and the watcher's header, wherever they describe the registry writer, the job-mode usage wait or
  the local usage auto-resume and launch hold, say what the code now does.

## Out of scope

- Gate 6a's and gate 11's failures in a local run. They are host state, not this race.
- The version bump and its publication.
