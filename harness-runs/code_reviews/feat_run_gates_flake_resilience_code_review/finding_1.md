### 1. `init.test.mjs` scales the post-kill pid poll, which stops discriminating against the 5-second dev-server stub

**File:** `cli/test/init.test.mjs` (`eventually`, and its second caller in the case *"the dev-server wrapper starts the server detached and prints a live pid and a readable log"*) — "await eventually(() => !alive(pid), 'the process the wrapper printed outlived the signal sent to it');"

**The problem.** Task 3 changed `eventually` so its attempt budget is `EVENTUALLY_ATTEMPTS = scaleBound(100)`. This is fine for its first caller, which waits for the stub's log line to appear: that is a pure ceiling. The second caller is not a pure ceiling. It sends the printed pid a signal and then polls `!alive(pid)`, so that a pid which survives the signal fails the case. The pid it polls is `DEV_SERVER_STUB`'s `exec sleep ${DEV_SERVER_STUB_SECONDS}`, which dies by itself 5 s after it starts. So the poll can only fail if its budget runs out **before** the stub's natural death. A pid that ignores the signal must still be alive when the poll gives up.

- Before this branch the budget was 100 × 20 ms, about 2 s (a little more with timer overshoot). The signal is sent once the wrapper has returned (`RETURNS_PROMPTLY_MS`, 3 s at most) and the log poll has passed. That left the remaining stub lifetime, just under 5 s, above the budget, so a pid that ignored the signal failed the case.
- At the default scale of `2` the budget is 200 × 20 ms, about 4 to 5 s with overshoot. That is roughly the stub's remaining lifetime, so such a pid now usually dies naturally inside the budget and the case passes. At `3` and above (the cap is `5`), the case cannot fail on this assertion at all.

This is the same class of defect the story index names as its first top risk ("a discriminating bound such as `init.test.mjs` → `RETURNS_PROMPTLY_MS` is scaled, passing runs either slow down or stop being able to fail"). `cli/test/helpers/timing.mjs` → choice 4 keeps `RETURNS_PROMPTLY_MS` fixed for exactly this reason, measured against the same `DEV_SERVER_STUB_SECONDS`. The post-kill poll is bounded against that same stub lifetime, but it was scaled and does not appear in the list. So the helper header's rule (*"every 'until X happens' ceiling … goes through `scaleBound`, and nothing else does"*, with discriminating bounds listed as fixed) is not what the code does. `.claude/context/cli.md` → `## What "done" means here` holds a change to its module's own header.

**Fix.** Give the post-kill poll its own fixed budget. Keep the log poll scaled. Make no assertion change.

1. In `cli/test/init.test.mjs`, directly below `const EVENTUALLY_ATTEMPTS = scaleBound(100);`, add:

   ```js
   /**
    * The post-signal pid poll's attempt budget at its 20 ms cadence — fixed, not scaled. The pid is
    * `DEV_SERVER_STUB`'s `exec sleep ${DEV_SERVER_STUB_SECONDS}`, which dies by itself 5 s after it
    * starts, so a pid that ignored the signal is only caught if this budget ends well inside that
    * lifetime; scaled, it would not (`helpers/timing.mjs`, choice 4).
    */
   const PID_GONE_ATTEMPTS = 100;
   ```

2. Give `eventually` an optional third parameter, and update its doc comment to match:

   ```js
   /**
    * Poll a predicate for up to `attempts` × 20 ms — by default two seconds times
    * `HARNESS_TEST_TIME_SCALE`: the observable belongs to another process.
    */
   async function eventually(check, describe, attempts = EVENTUALLY_ATTEMPTS) {
     for (let attempt = 0; attempt < attempts; attempt += 1) {
       if (check()) return;
       await sleep(20);
     }
     assert.fail(describe);
   }
   ```

3. Pass the fixed budget at the post-kill call only:

   ```js
   await eventually(() => !alive(pid), 'the process the wrapper printed outlived the signal sent to it', PID_GONE_ATTEMPTS);
   ```

   Leave the log-line call (`` `nothing was written to ${logPath}` ``) on the default.

4. In `cli/test/helpers/timing.mjs` → the module header's choice 4 list, add this bullet directly after the `init.test.mjs` → `RETURNS_PROMPTLY_MS` bullet:

   ```
    *    - `init.test.mjs` → `PID_GONE_ATTEMPTS`: the post-signal pid poll, discriminating against the
    *      same 5 s stub lifetime; scaled, a pid that ignored the signal would die by itself inside it.
   ```

The only test this fix runs is the file it edits: `npm test --workspace cli -- test/init.test.mjs`, from the repository root, as one plain foreground command. The full suite runs later, in the Run gates phase.
