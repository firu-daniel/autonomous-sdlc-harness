### 34. Remote park sequence: the stop-then-resume case fails

**Site:** `cli/test/watcher-remote-park-sequence.test.mjs` → `test('stop, then resume: park, answer, a job killed mid-session, then a pause resume completes and delivers'` (near line 388). It calls `playSequence(t, { job2Stub: 'sleep 30', killJob2: true })`. Job 2 runs through `async jobKilledAfterStart(resume, env = {})`. That helper polls for the start record and `agent-launched` under `const KILL_WAIT_TENTHS = 100;` (100 polls of 100 ms) and then SIGKILLs the job's process group. The other runs are bounded by `const RUN_TIMEOUT_MS = 120_000;`. The code under test is `cli/templates/scripts/autonomous-watcher.sh` in `job` mode:
- `run_job`'s wait loop, which now calls `host_wake_pass`.
- `spawn_engine`'s new launch head. `keep_awake_start` returns at once in job mode (`[ "$JOB_MODE" != "1" ] || return 0`), but the head still forks `$(exec sh -c 'echo "$PPID"')` and then `exec`s into `"$AGENT_CLI"`.

**Failing test:** `cli/test/watcher-remote-park-sequence.test.mjs` — `stop, then resume: park, answer, a job killed mid-session, then a pause resume completes and delivers`

**The failure, quoted from the log:**

```
        not ok 1138 - stop, then resume: park, answer, a job killed mid-session, then a pause resume completes and delivers
```

**Diagnosis, from the current tree.** This failure is *new this round*: there is no earlier log. The gate wrapper keeps only the `not ok` line, so no assertion message is on record.

This is the one failure that cuts no clone from an inbox drop. The fixture's own checkout is the job's checkout. The other three cases of this file pass through the same `playSequence`: user pause, budget pause and usage pause. They run job 1's park, the bundle save and restore, job 3's pause resume and `deliver` exactly as this case does.

Only this case kills job 2 mid-session. It is also the only one that waits under a fixed poll bound (`KILL_WAIT_TENTHS`) for the job to write its start record and launch the agent. Under a slow or suspended host, that bound fails as `the job never wrote its start record and launched the agent`.

Two branch changes lie on job 2's path: the `exec` launch head, which makes the agent itself the pipe's head process, and `run_job`'s `host_wake_pass`. Neither changes what the SIGKILL of the whole group reaches, because the case kills the group (`process.kill(-child.pid, 'SIGKILL')`). Neither writes into the bundle's `status.json` or its registry record either: `keep_awake_start` writes nothing in job mode, and `host_wake_pass` writes only `.host_last_tick` / `.host_woke_at` under the logs directory.

**Suspected shared cause:** likely the same cause as Finding 1 — this case is the one in its file with a fixed poll bound on its path, and the other three cases over the same sequence pass.

**Fix.** No assertion is deleted, skipped or loosened, and no code change is planned from the log alone.

- [ ] If the unit's own evidence shows this case still failing against the current tree, fix the fault its assertion message names:
  - **`job 2 was not killed mid-session`, `the restored status is not a stopped run`, or job 3 not reaching `completed`:** the fault is in `cli/templates/scripts/autonomous-watcher.sh` → `run_job` or `spawn_engine`'s launch head, or in `cli/templates/scripts/lib/harness-run-lib.sh`. Fix it there, and record under **Deviations from plan:** that the `general`-layer mirror (`scripts/autonomous-watcher.sh`, `scripts/lib/harness-run-lib.sh`) needs the same edit until `cmp` exits 0.
  - **`the job never wrote its start record and launched the agent`, or a bare `runBash timed out after …`:** record it under **Deviations from plan:** as the next round's evidence, and change nothing.
- [ ] If the case passes against the current tree, the finding closes through `unit_loop_core.md` → `#### The already-passing close`.

## Already passing

- **Closed by the operator, not by a unit.** This finding's named test was **not** run on its own. The round-1 failures were caused by a second run's gate suite running on the same host at the same time (`feat_run_analytics`). Findings 1–13 of this index, closed one by one, each passed on its own with no code change.
- **Verification:** the round-2 gate run, which runs the whole suite. If this test fails there, round 2's test fix plan lists it again.
- **No code file edited:** this section is the only change, on `32a6e551`.
