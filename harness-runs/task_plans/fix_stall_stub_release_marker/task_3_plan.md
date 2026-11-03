### Task 3 — Release the hung stub per case in `watcher-placeholder-host.test.mjs`

**Goal:** Apply the same release to `cli/test/watcher-placeholder-host.test.mjs`, which runs the same hung session with `sleep 60` in its stall cases. Each stub is freed right after the watchdog has done what its case checks. Outside the sandbox nothing changes, and every case keeps its assertions.

**Depends on:** Task 1, which exports these from `cli/test/helpers/watcher.mjs`:
- `HUNG_BODY` — the release-aware session. Its first launch writes `hung`, echoes `{}` until `go`, writes `silent`, then waits silently for `$REC/release` up to `HUNG_RELEASE_BOUND_SECS`, and writes `$REC/release-missed` if the bound expires. Its relaunch copies `$REGISTRY` to `$REC/resumed-registry.json`.
- `HUNG_RELEASE` (`'release'`) and `HUNG_RELEASE_MISSED` (`'release-missed'`).
- `stallVerdictNotified(notifications, branch)` — true at the first `failed` or `resumed` notification for `branch` whose detail carries `stall-watchdog`.
- `assertHungReleased(rec)` — fails, naming the missing release, when `<rec>/release-missed` exists.

This task consumes those exports exactly as named. It does not touch `cli/test/watcher-stall-reset-payloads.test.mjs`, which is **Task 2's**. It needs nothing Task 2 builds, so it depends on Task 1 alone.

### Targets

- `cli/test/watcher-placeholder-host.test.mjs` — the header, `HUNG_BODY`, `stalledPass`, `jobFixture` → `job`.

**Work:**

- [ ] Delete the file's private `HUNG_BODY` and import `HUNG_BODY`, `HUNG_RELEASE`, `stallVerdictNotified` and `assertHungReleased` from `./helpers/watcher.mjs`, alongside the names it already imports from there. `stalledPass` and the `job:` cases keep calling `f.setStub(HUNG_BODY)`. Both environments already carry `REC` and `REGISTRY`.
- [ ] `stalledPass`: in its pass script, insert `': > "$REC/release"'` between the second `'tick'` and `'wait'`, spelled with the `HUNG_RELEASE` name. This is the trigger for `(2) a recorded leftover .git/commondir is kept while its run is live and swept after the watchdog kill` and for `(7)` → `the stall-watchdog resume`. When the second `tick` returns, `check_stalled_runs` has finished: the kill, the up-to-10-s wait for the tree on a bubblewrap host, the sweep, and then the relaunch in `(2)` or the give-up in `(7)`. Once `await running` returns, call `assertHungReleased(rec)` **before** the existing `result.status` assertion.
- [ ] `jobFixture` → `job(host, env, plant)`: when `plant !== null`, after writing `go`:
  - Poll every 100 ms until `stallVerdictNotified(f.notifications(), f.branch)` is true or the job has settled (`settled !== null`), then create `join(rec, HUNG_RELEASE)`.
  - Once `await running` returns, call `assertHungReleased(rec)` before the `result.status` assertion.
  - This is the trigger for `job: (1) a stall kill in a job sweeps its recorded leftovers before the reset, and the run resumes` (a `resumed` notification, sent after the relaunch) and for `job: (2) a stall the watchdog gives up on leaves no leftover, …` (a `failed` notification, under `STALL_MAX_RESTARTS=0`).
  - Calls with `plant === null` (`job: (2b)`, `(3)`, `(4)`, `(5)`) run `PLANT_AND_CRASH` or the default body, not the hung session, and change in no way.
- [ ] Header: extend the paragraph *"The stall cases replay the watcher header's `a stall` REPRO row …"* to say three things. The hung session now waits for the test's release rather than sleeping. The local stall pass releases it after its second `tick`, and a `job:` stall case releases it at the watchdog's `failed` or `resumed` notification. Outside the sandbox the watchdog has already killed the stub, so the release frees nothing.

**Verification:**

- `npm test --workspace cli -- test/watcher-placeholder-host.test.mjs` exits 0 with `fail 0`.
- Sandbox simulation, outside the sandbox, applied temporarily and reverted:
  - Define `collect_descendants() { :; }` after the sourcing line in `stalledPass`'s script and in `job`'s script, which sources the watcher before `run_job`. Temporarily mark every case except `(2)`, `(7)`, `job: (1)` and `job: (2)` as `test.skip`.
  - Those four pass, each well under the 60 s the old sleep cost.
  - With the release write removed from `job`, `job: (1)` fails with `assertHungReleased`'s message after about `HUNG_RELEASE_BOUND_SECS`.
  - Revert everything and confirm with `git diff` that only the planned changes remain.
- Every existing assertion in the file is unchanged: `git diff` of the file touches no `assert…` line in any `test(…)` body.

**Deviations from plan:**
- The sandbox simulation ran **inside** the run's sandbox, not outside it, because no Bash call in this run can leave it. That is the condition the release targets, so `collect_descendants() { :; }` changed nothing there. The full-file run inside the sandbox passed with `tests 31`, `pass 31`, `fail 0`. The four stall cases took 15.9 s for `(2)`, 10.4 s for `(7)` → `the stall-watchdog resume`, 9.7 s for `job: (1)` and 5.8 s for `job: (2)`, all well under the old 60 s sleep.
- The release-removed simulation used temporary edits made with the edit tool, because the `cp` backup command was refused. Three edits: `import test` became `nodeTest` plus a local `test` that calls `nodeTest.skip` for every case except `job: (1)`; `collect_descendants() { :; }` was added to `job`'s script before `job_mode_enter`; and the release write was removed from `job`. Result: `pass 0`, `fail 1`, `skipped 26`. `job: (1)` failed at 182.3 s with `the hung session was never released: no …/watcher-test/release within 180 s of \`silent\``, raised by `assertHungReleased` from `job`. At this host's time scale `HUNG_RELEASE_BOUND_SECS` resolved to 180 s. The cases `(2)`, `(7)` and `job: (2)` were not run on their own under the skip wrapper. Their pass time rests on the full-file run above.
- All three temporary edits were reverted. `git diff` then showed only the planned changes, and no `assert…` line inside a `test(…)` body changed. The file was not run again after the revert. Its content is the same as the version that passed 31/31, as that `git diff` shows.
