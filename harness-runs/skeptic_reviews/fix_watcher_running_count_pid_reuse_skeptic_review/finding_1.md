### 1. The two "resumed run ... drops its pid" tests pass with `classify_run_exit`'s `pid ""` reverted

**File:** `cli/test/watcher-running-count.test.mjs`, the `for (const [label, stub, status] of [...])` loop whose test is titled `` `a parked run resumed on its answer ends ${label} and drops its pid` ``, plus the helper `assertPidDropped` and the file's header paragraph opening "A session's terminal write can land before `spawn_engine`'s parent writes `pid "$!"`".

**Problem.** These two cases are the only ones in the suite that drive `classify_run_exit`'s terminal writes (`registry_set "$branch" status completed pid ""` and `registry_set "$branch" status failed pid ""` in `cli/templates/scripts/autonomous-watcher.sh`). Their titles say the run "drops its pid". The assertions cannot fail if that clear is removed:

- `f.tick()` runs `tick; wait` (`cli/test/helpers/watcher.mjs`, the `tick(` helper's script `... tick; wait`), so the session subshell has exited and been reaped before the record is read.
- `spawn_engine` ends `) &` followed by `registry_set "$branch" pid "$!"`. The record's `pid` is therefore always the subshell's `$!`, unless the session's own terminal write clears it after the parent's write lands.
- If the `pid ""` is reverted from `classify_run_exit`, the record ends holding `$!`. That subshell is dead, so `process.kill(pid, 0)` throws `ESRCH`, and `assertPidDropped` passes.
- The trailing `assert.equal(await runningCount(t, f), '0\n')` passes too, because the new status filter in `running_count` skips a `completed` or `failed` record whatever its pid.

So a maintainer who drops the `pid ""` from either `classify_run_exit` arm, which is the most common terminal write (every session that ends on its own), gets a green suite. The story plan's goal 2 ("A run that reaches a terminal status drops its `pid`") has no test that guards its main site. `reconcile_stale_runs`'s clear is the only one asserted strictly (`assert.equal(record.pid, '')`).

The tests accept a dead pid because of a real race: a session that ends before the parent's `pid "$!"` write lands. That race only exists for a session that ends within milliseconds. A stub that sleeps first takes the race out, so the strict assertion can be made.

**Fix.** In `cli/test/watcher-running-count.test.mjs`:

1. Change the loop's two stub bodies so the session outlives the parent's pid write:
   ```js
   for (const [label, stub, status] of [
     ['completed', 'sleep 1; :', 'completed'],
     ['failed', 'sleep 1; exit 3', 'failed'],
   ]) {
   ```
2. In that loop's test body, replace `assertPidDropped(record.pid);` with:
   ```js
   // The stub sleeps past spawn_engine's `pid "$!"` write, so the session's terminal write lands last.
   assert.equal(record.pid, '', f.watcherLog());
   ```
3. Delete the now-unused `assertPidDropped` helper and its doc comment.
4. Replace the header paragraph that opens "A session's terminal write can land before `spawn_engine`'s parent writes `pid "$!"`" with:
   ```
    * A session's terminal write can land before `spawn_engine`'s parent writes `pid "$!"`, leaving the
    * session's own dead subshell pid on the record. The resume cases' stubs sleep first so the parent's
    * write lands before the session's, and the cases assert `''` strictly.
   ```

Leave `cli/test/watcher-remote-dispatch.test.mjs` as it is: its relaxed pid assertion is not what that test is about.

This fix edits one test file. Run only that file per the test-run rule; the full suite runs in the Run gates phase.
