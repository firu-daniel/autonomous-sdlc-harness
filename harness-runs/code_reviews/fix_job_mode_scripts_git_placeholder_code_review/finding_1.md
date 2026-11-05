### 1. The JS3 stall-body case discriminates on an unscaled 1000 ms wall-clock ceiling

**File:** `cli/test/gate12-sandbox-round-default-branch.test.mjs` (test `'JS3: the stall body waits S seconds once and prints nothing'`) — "assert.ok(second.ms < 1000"

The case proves the marker guard by timing two cold `node` runs of the planted stall body, with `S` overridden to 1 s. Its second assertion, `second.ms < 1000`, requires a second `node` process to spawn, load an ES module, find the marker and exit in under one second. That is a fixed bound that does not go through `scaleBound`.

`cli/test/helpers/timing.mjs` states *"every 'until X happens' ceiling in `cli/test/` goes through `scaleBound`, and nothing else does"*. Its choice 4 lists the only bounds allowed to stay fixed, and this one is not among them. That header also records why the rule exists: failures grow with host load, and a full run beside a second suite failed 52 cases. A cold Node start on a loaded host, inside the launcher's sandbox in Run gates, can come close to one second. When it does, this case fails even though the marker guard works. A fixed bound also cannot simply be scaled, because a scaled 1000 ms ceiling would exceed `S` and stop discriminating.

**Fix:** make the second run discriminate by a gap that a scaled ceiling cannot close. Give the second run a body whose stall is 600 s, and bound that run with an `execFileSync` `timeout` taken from `scaleBound`. A broken marker guard then hangs for ten minutes and is killed at the ceiling. A working one returns in milliseconds.

1. Add the import beside the other helper imports:

   ```js
   import { scaleBound } from './helpers/timing.mjs';
   ```

2. Replace the block from `const second = timed();` through the `second.ms` assertion with:

   ```js
   // The marker now exists, so a body that would stall 600 s must return at once; the ceiling is
   // an "until it exits" bound under helpers/timing.mjs's rule.
   await writeFile(file, body.replace('setTimeout(() => {}, 1 * 1000);', 'setTimeout(() => {}, 600 * 1000);'), 'utf8');
   const second = execFileSync(process.execPath, [file], { cwd, encoding: 'utf8', timeout: scaleBound(30_000) });
   assert.equal(second, '');
   ```

   `execFileSync` throws when the timeout kills the child, which fails the case with the cause named. Keep the first run (`first.ms >= 1000`) as it is: it is a floor, not a ceiling.

3. Update the case's comment `// S overridden to 1 so the case waits one second rather than 180.` so it also says the second run's body is overridden to 600 s and bounded by `scaleBound`.

This fix edits only this test file, so it is the one test file the fix runs.
