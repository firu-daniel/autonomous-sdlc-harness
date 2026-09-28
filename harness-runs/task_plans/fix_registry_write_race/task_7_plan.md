### Task 7 — Bound every job-suite watcher run, and add an opt-in repeat seam for the job-mode usage case

**Goal:** Every watcher that `cli/test/watcher-remote-job.test.mjs` starts is bounded and reaped, so the case that hung gate 4 can at worst fail by name. The job-mode usage case that exposed the race also gets an **opt-in, off-by-default** repeat seam behind an environment variable, so a maintainer can run it many times at once, under the load those concurrent watchers create. That shows the race closed rather than one lucky pass.

**Depends on:**
- **Task 6**, which exports `runBash(cwd, args, env = {}, { timeoutMs, signal } = {})` from `cli/test/helpers/fixture.mjs`. With `timeoutMs` or `signal` it runs `bash` as a process-group leader, `SIGKILL`s the whole group when the bound passes or the signal aborts, and rejects with an `Error` whose message begins `runBash timed out after <n> ms:` or `runBash aborted:`.
- **Task 5**, which added cases to this same file (the lost-value and wait-bound cases in the `usage:` group). This task takes the file as Task 5 left it and bounds those cases too.

**Where this task stops.** It records no figure anywhere. Task 8 writes the seam's command and pass criterion into `docs/development.md` → Gate 4, and the figure itself is a hand step outside any session (story index `## Context`).

### Targets

- `cli/test/watcher-remote-job.test.mjs` → `createJobFixture`'s `job` driver, the `usage:` group's *"a reset 2 seconds ahead -> the run completes in the same job"* case, and the file header.

**Work:**

- [ ] `createJobFixture(t)`: make `job(args, env)` call `runBash(w.dir, [watcher, 'job', ...args], jobEnv(env), { timeoutMs: JOB_RUN_TIMEOUT_MS, signal: t.signal })`.
  - `JOB_RUN_TIMEOUT_MS` is a file constant below the per-test timeout (`node --test --test-timeout=300000`) and well above the longest honest job here, which is a few poll intervals.
  - State the value's argument in the header. The spawned case *"a job killed mid-run leaves running / continue"* already kills its own group and stays as it is.
- [ ] Add the seam.
  - A file constant names the variable (for example `JOB_USAGE_REPEAT_VARIABLE = 'HARNESS_JOB_USAGE_REPEAT'`). It is read the way `cli/test/helpers/concurrency.mjs` → `caseConcurrency` reads its own: unset means 1, a positive integer means that count, and anything else fails the load with a message naming the variable.
  - At 1, the *"a reset 2 seconds ahead"* case runs exactly as today. At N > 1 it builds N independent job fixtures and runs them **concurrently** (`Promise.all`), asserting each one's `job: completed stop`, two prompts and `pause_reason ''`. A failure names which repetition failed.
- [ ] File header: add the seam and the bound to the rule block, covering what the variable does, why it is off by default, and why its figure is never taken inside a harness session (the lessons ledger's in-run-measurement rule). Also give the command a maintainer runs, from `cli/`:

  ```
  HARNESS_JOB_USAGE_REPEAT=40 node --test --test-timeout=300000 test/watcher-remote-job.test.mjs
  ```

**Verification:**

- `cli/test/watcher-remote-job.test.mjs` passes with the variable unset, run as the file this task edits.
- The same file, with `HARNESS_JOB_USAGE_REPEAT` set to a value in the tens, passes every repetition. Report the value used and the pass count in the return, as evidence for this task only. It is **not** written into any document: the recorded figure is a hand step.
- The file with the variable set to `x` fails to load, with a message naming `HARNESS_JOB_USAGE_REPEAT`.
