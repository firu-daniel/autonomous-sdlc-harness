### Task 6 — Give `node --test` a per-test timeout and `runBash` a process-group kill-on-timeout, proven by a deliberately hung watcher

**Goal:** Stop one hung case from holding gate 4 of `scripts/run-gates.sh`, and the Run gates phase's `run-test-suite.sh` call, until someone kills it by hand. Every test gets a per-test timeout, so a hung case fails **by name** in the TAP output. The shell runner the watcher suites use gets an opt-in bound that kills the whole process group, so a hung watcher and its engine subshells and `sleep`s are reaped rather than left running.

**Depends on:** Task 2, which rewrote `cli/test/helpers/watcher.mjs`'s header choice 1. This task edits the same helper to bound `tick`, and takes that file as Task 2 left it.

**The interface this task defines, for Task 7 to consume.** The signature is `runBash(cwd, args, env = {}, { timeoutMs, signal } = {})`, exported from `cli/test/helpers/fixture.mjs`:
- With neither option, it behaves exactly as today.
- With `timeoutMs` (a positive integer) or `signal` (an `AbortSignal`, typically a test's `t.signal`), it starts `bash` as a **process-group leader** (`detached: true`). When the bound passes or the signal aborts, it sends `SIGKILL` to the whole group (`process.kill(-pid, 'SIGKILL')`) and **rejects** with an `Error` whose message begins `runBash timed out after <n> ms:` (or `runBash aborted:`) followed by the argument vector. Because it rejects, the awaiting case fails, naming the command.

Task 7 passes both options from the job fixture's `job()` driver.

### Targets

- `cli/package.json` → `scripts.test`.
- `cli/test/helpers/fixture.mjs` → `runBash`, `run`, and a sixth entry in the module header's *"non-obvious choices"* list.
- `cli/test/helpers/watcher.mjs` → `createWatcherFixture`'s `tick`.
- `cli/test/test-timeout.test.mjs` (new): the deliberately hung case, run in a child `node --test`.

**Work:**

- [ ] `cli/package.json`: make `test` `node --test --test-timeout=300000`. `--test-timeout` is available from Node 20.11.0, which is exactly `engines.node`'s floor.
  - The value must sit well above the slowest honest case. `docs/development.md` → `**Run time, measured.**` records the **whole** suite finishing in 118 s on a 10-core host, so no single test comes near 300 s even on a runner several times slower.
  - Do not measure case durations in-session to size it: the lessons ledger bars in-run timing as evidence.
  - The number's argument is written down by Task 8 in `docs/development.md` → Gate 4, because `package.json` carries no comments.
- [ ] `cli/test/helpers/fixture.mjs`: implement the option pair above.
  - `execFile`'s own `timeout` kills only the direct child, and a non-interactive `bash`'s background jobs share its process group. So the bounded path spawns detached, collects stdout and stderr the way `run` does, and kills the negative pid.
  - A `SIGKILL` of the group that finds the group already gone is not an error.
  - The unbounded path stays `run` as it is, so no existing suite changes behaviour.
  - Add header choice 6: why the bound kills a group rather than a pid, and why it rejects rather than resolves. A timed-out command is not a result the command chose, which is choice 4's line.
- [ ] `cli/test/helpers/watcher.mjs`: have `tick` pass `{ timeoutMs: <a stated constant>, signal: t.signal }`, with `t` captured from `createWatcherFixture(t, …)`. State the constant and its argument in the module header: a pass plus its `wait` for a stub that sleeps under a second is far below it.
- [ ] Create `cli/test/test-timeout.test.mjs`, opening with its rule: *a hung watcher case fails by name with a timeout, and leaves no process of its fixture behind*. It is one case, which:
  - Writes a child test file into a directory from `createFixture`. The child file imports `createWatcherFixture` and `runBash` by absolute `file://` URL from `helpers/`. It builds a watcher fixture, writes the fixture's path to a file the parent names by env, and runs the written watcher's endless `watch` loop through `runBash(dir, [watcher, 'watch'], env, { signal: t.signal })`, with the usage gate and cleanup off. That is a real watcher that never returns.
  - Runs it with `execFile(process.execPath, ['--test', '--test-timeout=3000', <child>])`.
  - Asserts: non-zero exit; the TAP stdout carries `not ok` with the child's test name and a timeout message (`timed out` / `cancelled`, whichever the Node in use prints; match both); and `pgrep -f <child fixture path>`, run through `execFile` with a fixed argument vector, finds nothing after a short grace period.
  - If `t.signal` does not abort on a `--test-timeout` in the Node the suite runs on, the child also passes an explicit `timeoutMs` below the test timeout. Record which one did the reaping in the case's comment.

**Verification:**

- `cli/test/test-timeout.test.mjs` passes, run as the file this task creates. Its child run fails by name and reaps its watcher.
- The bound on `tick` is exercised by this task's own new file through the same `runBash` path. The suites that call `tick` are Phase G's to run.
- Read `run`: no existing caller's argument list or result shape changed.
- `bash scripts/typecheck.sh` passes.

**Deviations from plan:**
- `t.signal` does not abort on a `--test-timeout` expiry under Node v20.19.5 (the suite's host Node). Measured with two probes run through `bash scripts/scratch-run.sh` (`harness-runs/scratch/test_timeout_signal_probe.mjs`, `harness-runs/scratch/hung_watcher_probe.mjs signal`): the parent runner's file-level timer fires first and kills the child file's process, the TAP line is `not ok 1 - <child file path>` with `error: 'test timed out after 8000ms'` and `failureType: 'testTimeoutFailure'` (the case name does not appear), no abort listener runs, and `pgrep -fl <fixture>` afterwards found `bash <fixture>/scripts/autonomous-watcher.sh watch` still running (killed by hand afterwards). So, as the plan's fallback clause says, the child passes an explicit `timeoutMs` as well, and that is what does the reaping. `hung_watcher_probe.mjs bound` (`timeoutMs: 2000`, `--test-timeout=30000`) printed `not ok 1 - a watch loop that never returns` with `error: 'runBash timed out after 2000 ms: bash …/autonomous-watcher.sh watch'`, and `pgrep` then exited 1.
- The child's `--test-timeout` is `30000`, not `3000`, with the explicit bound at `2000`: the case's own timer covers the child fixture's `createFixture` + `init` too, so a 3000 ms test timeout would leave a bound under it with little margin on a loaded runner.
- For Task 8 (`docs/development.md` → Gate 4): on Node 20.19.5, `--test-timeout=300000` alone fails a hung case naming its **file**, not the case, and leaves a detached group running. A case fails by name, and its group is reaped, only when a `runBash` `timeoutMs` below the test timeout is set, which `tick` now does (`TICK_TIMEOUT_MS`, 60 000 ms) and Task 7's `job()` needs to do too.
- `cli/test/helpers/watcher.mjs` now exposes `watcherPath` and `watcherEnv(env)` on the fixture, taken out of `tick`, so the new file's child runs `watch` under the same environment as `tick` without copying it.
- Verification bullet 1 (running `cli/test/test-timeout.test.mjs`) was not run as a single file: neither `.claude/context/cli.md` nor `.claude/context/conventions.md` states a single-file test command, so it waits for the Run gates phase. The evidence is the `hung_watcher_probe.mjs bound` run above, which executes the same child source and the same assertions' inputs, not the file itself.
