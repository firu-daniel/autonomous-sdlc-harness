### 2. `watcher-remote-job.test.mjs` calls `scaleBound(100)` inside a loop condition instead of naming the budget

**File:** `cli/test/watcher-remote-job.test.mjs` (test *"a job killed mid-run leaves running / continue"*) — "for (let i = 0; i < scaleBound(100) && !seen; i += 1) {"

**The problem.** This is the only site on the branch that calls `scaleBound` inline, in a loop condition, so it runs again on every iteration. The result is the same each time, so behaviour is correct. But every other scaled poll budget on the branch is a named module-level constant with a one-line doc comment saying what it bounds and in what unit. In this file those are `WATCHER_RUN_TIMEOUT_MS`, `PAUSE_WAIT_TENTHS` and `REPEAT_PAUSE_WAIT_TENTHS`. The sibling suite's equivalent wait, `watcher-remote-park-sequence.test.mjs` → `KILL_WAIT_TENTHS`, is also named. Here a reader gets a bare `100`, with neither the unit (attempts at a 100 ms cadence) nor the reason it is scaled.

**Fix.** Directly below `const PAUSE_WAIT_TENTHS = scaleBound(100);` in `cli/test/watcher-remote-job.test.mjs`, add:

```js
/** How many 100 ms polls the killed-job case makes for its job's start record and launch, before failing. */
const START_WAIT_POLLS = scaleBound(100);
```

Then change the loop in *"a job killed mid-run leaves running / continue"* to:

```js
for (let i = 0; i < START_WAIT_POLLS && !seen; i += 1) {
```

The only test this fix runs is the file it edits: `npm test --workspace cli -- test/watcher-remote-job.test.mjs`, from the repository root, as one plain foreground command.
