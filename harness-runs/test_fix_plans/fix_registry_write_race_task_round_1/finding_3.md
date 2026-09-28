### 3. The hung-watcher case's child file timeout (30 s) can expire before the 2 s `runBash` bound

**File:** `cli/test/test-timeout.test.mjs`: `const CHILD_TEST_TIMEOUT_MS = 30_000;` (near line 25), used in `['--test', \`--test-timeout=${CHILD_TEST_TIMEOUT_MS}\`, childPath]`

**Failing test:** `cli/test/test-timeout.test.mjs`, case `a hung watcher case fails by name with a timeout and leaves no process behind`.

**Failure, quoted from the gate log (machine paths rewritten):**

```
        not ok 260 - a hung watcher case fails by name with a timeout and leaves no process behind
        ...
        # fail 1
        ...
        # duration_ms 475287.694083
```

The gate prints only the `not ok` line and the log's last 25 lines, so the assertion message is not in the log. The diagnosis below comes from the source and from Task 6's recorded probe behaviour.

**Class:** first round (no earlier log to compare). This branch's Task 6 created the file.

**Diagnosis.** The case writes a child test file and runs it with `node --test --test-timeout=30000`. The child's one case calls `createWatcherFixture(t)`, which does a lot of work before the bounded run starts:

- Builds a fresh fixture. The child is a new process, so it seeds its own fixture template rather than reusing the parent's.
- Runs the compiled CLI's `init` against it.
- Writes the recorder stubs.

Only after all that does it start `runBash(…, { timeoutMs: 2000, signal: t.signal })` on the watcher's endless `watch` loop.

Under Node 20.19.5 the child runner's **file-level** timer is also bounded by `--test-timeout` (`cli/test/helpers/fixture.mjs` → module header choice 6, and Task 6's measured deviation). So the 30 seconds covers child start-up, fixture seeding, `init` **and** the 2-second bound. Gate 4 runs this under full parallel load: the same run took 475 seconds and killed two other files on their file timeout (Findings 1 and 2).

If setup takes more than about 28 seconds, the file timer fires before the 2-second bound. Task 6 recorded what follows: the child's TAP names the **file** (`not ok 1 - <child path>`), not `a watch loop that never returns`, so the `^not ok \d+ - a watch loop that never returns$` assertion fails. The child's process is killed without aborting `t.signal`, and if the watcher had already started, its detached group is left running, so the `pgrep -f <fixtureDir>` assertion fails too.

The case is meant to prove the `runBash` bound. Its result should not depend on how fast fixture setup runs on a loaded host.

**Fix.**

- [ ] `cli/test/test-timeout.test.mjs`: change `const CHILD_TEST_TIMEOUT_MS = 30_000;` to `const CHILD_TEST_TIMEOUT_MS = 240_000;`. Leave `CHILD_BOUND_MS` at `2_000`. The 2-second `runBash` bound stays what reaps, and the child's file timer is now far out of reach of any honest setup time. 240 000 also stays below the parent suite's own `--test-timeout` (300 000 today, or 1 800 000 if Finding 1 has landed), so the parent file is not killed while the child is still running.
- [ ] Same file, the doc comment on `CHILD_TEST_TIMEOUT_MS` (currently *"The child runner's per-test timeout, over the child fixture's `init` plus the bound below it."*): state why it is large. Under Node 20.19.5 it bounds the child **file's** whole run, including its fixture seeding and `init` on a loaded gate host, and it must never fire before `CHILD_BOUND_MS`. If it did, the child's TAP would name the file and leave the watcher group running, which is exactly what this case asserts cannot happen.
- [ ] `docs/development.md` → the paragraph beginning `**A hung case cannot hold the gate.**`: change the parenthetical *"`cli/test/test-timeout.test.mjs` bounds its hung child at 2 seconds, inside its own 30-second `--test-timeout`"* to say *"240-second"*.
- [ ] Optional, informational: the case's assertion messages already include the child's stdout. No change is needed to make a future failure diagnosable from the full `npm test` output.
