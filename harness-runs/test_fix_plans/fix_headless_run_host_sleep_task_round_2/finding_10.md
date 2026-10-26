### 10. Run profile: the per-run copy launch case fails, with no cause in the log or the tree

**Site:** `cli/test/watcher-run-profile.test.mjs` → `test('a task drop launches on a per-run copy at hr_run_profile_file` (near line 196). After `await f.drop();` and `await f.tick();`, the case asserts the following:
- `assert.equal(settings, await f.profileFileFor(f.branch));`;
- `assert.equal(f.record().copy_kind, 'clone');`;
- `assert.equal(f.record().worktree, f.clone);`;
- `assertBasePlus(profile, base, cloneEntries(f.config, f.clone), { main: f.dir, copy: f.clone });`;
- the wrapper-twin loop.

`profileFileFor` is `adoptedFixture`'s `async profileFileFor(branch)` (near line 136). Its `runBash` call carries no `timeoutMs` and no `signal`.

**Failing test:** `cli/test/watcher-run-profile.test.mjs` — `a task drop launches on a per-run copy at hr_run_profile_file: the base plus the clone's exact entries`

**Failure (from the log):**

```
        not ok 1165 - a task drop launches on a per-run copy at hr_run_profile_file: the base plus the clone's exact entries
```

The wrapper kept no assertion message.

**Diagnosis:** This case is *persisting*: round 1 had it as `not ok 1162` under the same name. Round 1 attributed it to a second gate suite on the same host and closed it without a run.

This branch does not edit this suite or the profile renderer. The merged `968f982a` changed nothing on this case's route except the shared driver's bound, which is now `TICK_TIMEOUT_MS = scaleBound(60_000)`, or 120 000 ms. So unlike Findings 1–9, this case's one pass already ran under a scaled ceiling.

The other cases in this file that cut a clone through a drop all passed in this round. Those are the other-worktree case, the opt-out launch and the exit-sync case. So the clone-cutting launch path works under this run's load.

Neither the tree nor the log explains the failure:
- Several of the case's own assertions carry no message: the `settings` equality, `copy_kind` and `worktree`.
- `profileFileFor`'s unbounded `runBash` would surface a hang only as the per-test `--test-timeout`, not as a named command.

A recurrence would leave the next round in the same position.

**Fix:**

- [ ] Make this case's own failures name their cause, without changing what it asserts. Give `assert.equal(settings, await f.profileFileFor(f.branch))`, `assert.equal(f.record().copy_kind, 'clone')` and `assert.equal(f.record().worktree, f.clone)` a message carrying `f.watcherLog()` and `JSON.stringify(f.record())`. This follows the form the case's first assertion already uses (`` `the stub was never called:\n${f.watcherLog()}` ``).
- [ ] Bound `profileFileFor`'s `runBash` with `{ timeoutMs: TICK_TIMEOUT_MS, signal: t.signal }`, so that a hang fails naming its command. Add `TICK_TIMEOUT_MS` to the `./helpers/watcher.mjs` import. It is already scaled through `HARNESS_TEST_TIME_SCALE`, so do not scale it again. `adoptedFixture` already receives `t`.
- [ ] Change no assertion's expected value, add no retry or skip, and leave the watcher and the profile renderer (`cli/templates/scripts/autonomous-watcher.sh`, `cli/src/generators/`) unchanged. The tree shows no defect in them.
- [ ] If the unit's own run of this file reproduces the failure, fix the fault its now-named message points at:
  - If the fault is in the watcher's record, a log line or the launch, fix it in `cli/templates/scripts/autonomous-watcher.sh` (or `cli/templates/scripts/lib/harness-run-lib.sh`). Record under **Deviations from plan:** that the `general`-layer mirror under `scripts/` needs the same edit.
  - If the message is a bare `runBash timed out after …`, record it as the next round's evidence and change nothing more.
