### Task 2 — Release the hung stub per case in `watcher-stall-reset-payloads.test.mjs`

**Goal:** Make every hung-stub case in `cli/test/watcher-stall-reset-payloads.test.mjs` release its stub right after the watchdog has done what the case checks. Inside the sandbox a case then costs its work rather than its work plus 60 s. Outside the sandbox nothing changes, and every case keeps its assertions.

**Depends on:** Task 1, which exports these from `cli/test/helpers/watcher.mjs`:
- `HUNG_BODY` — the release-aware session. Its first launch writes `hung`, echoes `{}` until `go`, writes `silent`, then waits silently for `$REC/release` up to `HUNG_RELEASE_BOUND_SECS`, and writes `$REC/release-missed` if the bound expires. Its relaunch copies `$REGISTRY` to `$REC/resumed-registry.json`.
- `HUNG_RELEASE` (`'release'`) and `HUNG_RELEASE_MISSED` (`'release-missed'`).
- `stallVerdictNotified(notifications, branch)` — true at the first `failed` or `resumed` notification for `branch` whose detail carries `stall-watchdog`.
- `assertHungReleased(rec)` — fails, naming the missing release, when `<rec>/release-missed` exists.

This task consumes those exports exactly as named and defines none of them. It does not touch `cli/test/watcher-placeholder-host.test.mjs`, which is **Task 3's**.

### Targets

- `cli/test/watcher-stall-reset-payloads.test.mjs` — the header, `HUNG_BODY`, `stalled()`, `localStall`, `jobStall`.

**Work:**

- [ ] Delete the file's private `HUNG_BODY` and import `HUNG_BODY`, `HUNG_RELEASE`, `stallVerdictNotified` and `assertHungReleased` from `./helpers/watcher.mjs`. `createStallFixture` keeps calling `w.setStub(HUNG_BODY)`, and `stallEnv` keeps supplying `REC` and `REGISTRY`. The body reads `$REC/release` itself, so no new variable is needed.
- [ ] `localStall`: in its pass script, insert `': > "$REC/release"'` between the second `'tick'` and `'wait'`, spelled with the `HUNG_RELEASE` name. Keep the order: `tick`, the wait for `silent`, the back-date, `tick`, the release, `wait`. This is the trigger for every local case: the honest case, S1, S2, S3, S4, S4c, S5, S6, S7, S8, S9, S10 and S4 legacy. When the second `tick` returns, `check_stalled_runs` has finished the kill, any refusal, the reset and the relaunch, so a release there can never come before the kill. `REC` is already in the pass's environment through `stallEnv`.
- [ ] `stalled()`: give it a `release` parameter, an async function or `null`, and keep its current wait for `hung`, its `plant()` and its write of `go`.
  - After writing `go`, when `release` is not `null`, poll every 100 ms until `release()` resolves true or the run has settled (`settled !== null`). Then create `join(rec, HUNG_RELEASE)`.
  - Once `await running` returns, call `assertHungReleased(rec)` **before** the existing `result.status` assertion, so a missing release is reported first and by name.
  - `localStall` passes `null`, because its script releases.
  - The poll needs no deadline of its own: the stub's bound guarantees the run ends, and `RUN_TIMEOUT_MS` bounds `runBash`.
- [ ] `jobStall`: pass `stalled()` the release trigger `async () => stallVerdictNotified(w.notifications(), w.branch)`. This is the trigger for J1–J6 (J4 and J5 only where they do not skip). `run_job` is a single call, so the watchdog's verdict notification is the first observable event that comes strictly after the kill. On the give-up arm (J1, J2, J4, J5, J6) that is `failed`. On the resume arm (J3) it is `resumed`, sent after the relaunch.
- [ ] Header: update the paragraph on the hung session. Instead of "writes `silent` and sleeps", it should say that it writes `silent` and waits for the test's release.
  - It names the trigger per mode: after the second `tick` in `localStall`, and at the watchdog's `failed` or `resumed` notification in `jobStall`.
  - It states that outside the sandbox the watchdog has already killed the stub, so the release frees nothing.
  - Add one `RED ONCE` entry under the local cases: *(release) `collect_descendants() { :; }` defined in `localStall`'s script after the sourcing line, which reproduces the sandbox's empty descendant list, with the release line removed → the honest case fails naming the missing release*. Record what you actually observed.

**Verification:**

- `npm test --workspace cli -- test/watcher-stall-reset-payloads.test.mjs` exits 0 with `fail 0`. No case is newly skipped: J4 and J5 skip only where no `npx` sits beside the test's `node`, as they do today.
- Sandbox simulation, outside the sandbox, applied temporarily and reverted:
  - Add `collect_descendants() { :; }` to `localStall`'s script after the sourcing line, and temporarily mark every case except the honest one `test.skip`.
  - The honest case passes, and its duration is well under the 60 s the old sleep cost. This shows the release frees a stub the kill missed.
  - With the release line also removed, the case fails with `assertHungReleased`'s message after about `HUNG_RELEASE_BOUND_SECS`, not with a status or resume assertion.
  - Revert all three edits and confirm with `git diff` that only the planned changes remain.
- Every existing assertion in the file is unchanged: `git diff` of the file touches no `assert…` line in any `test(…)` body.

**Deviations from plan:**
- The sandbox simulation ran **inside** the run's sandbox, not outside it: no Bash call in this run can leave it. That is the condition the release targets, so `collect_descendants() { :; }` changed nothing there. The evidence: with the stub defined and the release kept, the honest case passed in 12.6 s. With the release line also removed, it failed at 188.9 s with `the hung session was never released: no …/watcher-test/release within 180 s of \`silent\``, raised by `assertHungReleased` from `stalled`. `HUNG_RELEASE_BOUND_SECS` resolved to 180 s at this host's `HARNESS_TEST_TIME_SCALE`. The unmodified file also passed inside the sandbox: 19/19, 0 skipped, with the honest case at about 13 s.
- "Mark every other case `test.skip`" was applied as one temporary edit instead: `import test` became `nodeTest`, plus a local `test` that calls `nodeTest.skip` for every name except the honest case's. A bulk `perl -pi` rewrite was refused by the tool layer. The run reported `pass 1`, `skipped 18`. All three temporary edits were reverted. `git diff` then showed only the planned changes, and no `assert…` line inside a `test(…)` body changed.
- The release-removed simulation run's output was piped through `head -60`. Both verification runs of the file were plain foreground runs: the one before the simulation and the one after the revert.
