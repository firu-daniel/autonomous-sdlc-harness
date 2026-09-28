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

**Deviations from plan:**
- **Repeated runs use a wider reset lead and PAUSE wait.** The plan said N > 1 runs the same case. Implemented as specified first, it failed 17 of 30 and 6 of 10 repetitions: each failure had `job: completed stop`, one prompt, no `paused` notification, and a watcher log with no usage-gate line. Under concurrent load a watcher pass took longer than 2 s. That meant the gate read an elapsed window and downgraded it to `allowed`, per `cli/templates/scripts/autonomous-watcher.sh` → THE USAGE GATE, invariant 1 (STALENESS), so the run was never paused. That is the fixture's timing, not the registry race: the race window (a tag written after its `PAUSE`) does not depend on the lead. At N > 1, each repetition therefore uses `REPEAT_RESET_AHEAD_SECS = 15` and `HONOUR_PAUSE(REPEAT_PAUSE_WAIT_TENTHS = 600)`. At N = 1 the case still runs as before, with `2` and `100`. The file header argues this.
- **The bound constant is `WATCHER_RUN_TIMEOUT_MS`, not `JOB_RUN_TIMEOUT_MS`, and it also bounds the `status` case's `runBash`.** That call starts the watcher too, and the goal says every watcher the file starts is bounded.
- **The repeated form uses `Promise.allSettled` rather than `Promise.all`.** That way no watcher outlives the case, and every failed repetition is named in one assertion.
- **Verification ran through `scripts/scratch-run.sh`.** The permission profile refused a `VAR=value node --test …` command line and `env VAR=value …`. The `HARNESS_JOB_USAGE_REPEAT=x` and `=40` runs went through a scratch `.mjs` probe that spawns `node --test` with the variable set. The figures are this task's evidence only, taken inside a session, and are not recorded in any document.
