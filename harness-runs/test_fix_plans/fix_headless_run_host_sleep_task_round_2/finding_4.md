### 4. Keep-awake (e)-(h): the Linux logind session case fails in the full suite

**Site:** `cli/test/watcher-keep-awake.test.mjs` → `test('(e)-(h) Linux: the logind hold waits on the engine` (near line 356). It calls:
- `f.session(LINUX_PROBE)`;
- `session.next()` twice, each through `session()` → `const reached = (n) =>`;
- `f.holderGone(first)` and `f.holderGone(second)`.

All of these run under `const WAIT_MS = 20_000;`, inside one session script bounded by `const SESSION_TIMEOUT_MS = 180_000;`.

**Failing test:** `cli/test/watcher-keep-awake.test.mjs` — `(e)-(h) Linux: the logind hold waits on the engine, follows mains power pass by pass, and ends with the session`

**Failure (from the log):**

```
        not ok 1083 - (e)-(h) Linux: the logind hold waits on the engine, follows mains power pass by pass, and ends with the session
```

The wrapper kept no assertion message.

**Diagnosis:** This case is *persisting*: round 1 had it as `not ok 1080` under the same name. Round 1 closed it because the file passed when run alone.

This is one of the two longest sessions in the file, with three passes and two holder-gone polls. Every wait it makes goes through `waitFor` under the unscaled 20 000 ms `WAIT_MS`. That includes pass 1, which cuts the clone and launches the engine and its `systemd-inhibit` holder. The shared driver allows one such pass `TICK_TIMEOUT_MS`, 120 000 ms at the default scale. The whole script runs under an unscaled 180 000 ms.

The case's assertions about the hold (the two recorded `systemd-inhibit` calls, the battery release, the mains retake) are deterministic once each pass has returned. The pass and poll budgets are the load-sensitive part. The log cannot confirm which wait ran out.

**Suspected shared cause:** likely the same cause as Finding 1 — every wait this case makes is one of the `session()` / `waitFor` bounds Finding 1 rebinds and scales.

**Fix:**

- [ ] Make sure `cli/test/watcher-keep-awake.test.mjs` has all of these: `WAIT_MS = scaleBound(20_000)`, `session()`'s `reached(n)` and launch wait under `TICK_TIMEOUT_MS` (imported from `./helpers/watcher.mjs`, already scaled), and `SESSION_TIMEOUT_MS = scaleBound(240_000)`. If Finding 1 has landed, they are already in place: confirm them with a grep and change nothing more for this case.
- [ ] A single-file run that passes before that change lands is not evidence that this finding is cleared.
- [ ] Do not change the power-supply stubs or the recorded-argv assertions, and add no retry.

## Already passing

- **(a)** Named test `(e)-(h) Linux: the logind hold waits on the engine, follows mains power pass by pass, and ends with the session`, in `cli/test/watcher-keep-awake.test.mjs`. I ran the file after Finding 1's commit `d2acb123`. I also read the fix site: `const WAIT_MS = scaleBound(20_000);`, `const SESSION_TIMEOUT_MS = scaleBound(240_000);`, and `session()`'s `reached(n)` and the launch `waitFor` both passing `TICK_TIMEOUT_MS`, imported from `./helpers/watcher.mjs` (`export const TICK_TIMEOUT_MS = scaleBound(60_000);`). `f.holderGone` runs under the scaled `WAIT_MS` default of `waitFor`. The last commit touching the file is `d2acb123`.
- **(b)** `npm test --workspace cli -- test/watcher-keep-awake.test.mjs`, run from the repository root: `ok 6 - (e)-(h) Linux: …` (duration_ms 23393); file summary `# tests 9`, `# pass 9`, `# fail 0`. Because the run came after `d2acb123`, it is evidence under this finding's second Fix bullet.
- **(c)** No code file was edited; the power-supply stubs and recorded-argv assertions were left untouched, and no retry was added.
