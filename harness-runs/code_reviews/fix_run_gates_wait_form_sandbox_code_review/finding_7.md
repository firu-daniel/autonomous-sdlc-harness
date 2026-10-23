### 7. Two held-run cases leave their stub blocked forever if an assertion fails before the release

**File:** `cli/test/run-test-suite.test.mjs`, two cases:

- `test('a run that outlives the stale window keeps its heartbeat fresh'`, at "const run = wrapper(dir, ['task_round_1'], { STUB_RELEASE: release });"
- `test('a SIGTERM to the run form\'s PID alone leaves the label live until the gate returns, then no verdict'`, at the same line

**The problem.** Both cases start a run form whose stub waits in a loop until the release file exists. They write that file only after several assertions. If any assertion before the release fails, nothing writes the release file and nothing kills the run. The stub keeps polling for a file whose directory the fixture cleanup has already removed. The `node --test` process then hangs instead of reporting the failure.

The SIGINT case in the same file already avoids this. It starts its run through `runBash` with an `AbortController` and registers `t.after(() => controller.abort())`, which SIGKILLs the run's process group however the case ends.

**Fix.** In each of the two cases, replace the `wrapper(...)` start with the SIGINT case's form:

```js
const controller = new AbortController();
t.after(() => controller.abort());

const run = runBash(dir, [join(dir, WRAPPER), 'task_round_1'], { STUB_RELEASE: release }, { signal: controller.signal });
```

Leave every assertion as it is. In the SIGTERM case, delete the trailing `writeFileSync(release, '');` after the final `--wait` assertions. The release file was already written before `await run`, so that second write does nothing.

This fix edits only this one test file, so the only test it runs is `npm test --workspace cli -- test/run-test-suite.test.mjs`. The full suite runs in the Run gates phase.
