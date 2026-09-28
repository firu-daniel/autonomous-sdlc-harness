### 1. The hung-watcher case passes the runner's `NODE_TEST_CONTEXT` into its nested `node --test`, so the child never prints TAP naming its case

**Site:** `cli/test/test-timeout.test.mjs`, the `execResult(…)` call inside `test('a hung watcher case fails by name with a timeout and leaves no process behind', …)`. Its options argument reads `{ cwd: dir, env: { ...process.env, HUNG_FIXTURE_RECORD: recordPath } }` (near line 82).

**Failing test:** `cli/test/test-timeout.test.mjs`, case `a hung watcher case fails by name with a timeout and leaves no process behind`.

**Failure, quoted from the gate log (machine paths rewritten):**

```
  FAIL  4 npm test (exit 1)
        not ok 266 - a hung watcher case fails by name with a timeout and leaves no process behind
        ...
        # tests 1024
        # suites 3
        # pass 1023
        # fail 1
        # cancelled 0
        ...
        npm error path cli
        ...
        npm error command sh -c node --test --test-timeout=1800000
```

**Class:** persisting. Round 1 failed the same case (`not ok 260 - …`). Round 1's Finding 3 (commit f86996f) raised the child's `--test-timeout` from 30 000 to 240 000 ms. This round ran on top of that change and failed the same way, so the file timer was not the cause. Round 1's two file-level cancellations are gone this round.

**Diagnosis.**

*What the log shows.* The gate prints every line of the `npm test` output that matches `^[[:space:]]*not ok ` (`scripts/run-gates.sh` → `gate()`). The parent TAP reporter prints an assertion's message as an indented `|-` block. Every assertion in this case except the last two puts `child.stdout` into its message:

- `assert.notEqual(child.status, 0, …)`
- the two `assert.match(child.stdout, …)` calls

So if the child had printed TAP with a `not ok` line, either `not ok 1 - a watch loop that never returns` or `not ok 1 - <child file path>`, that line would appear indented in the gate output. It does not. The only `not ok` line in the log is the parent case's own. **So the nested run printed no TAP `not ok` line at all.**

*Why.* `node --test` runs each test file in a subprocess and sets `NODE_TEST_CONTEXT=child-v8` in that subprocess's environment. It uses that variable to tell the file it is a runner's child. This case runs inside such a subprocess. It builds the nested runner's environment as `{ ...process.env, … }`, so the nested `node --test` inherits `NODE_TEST_CONTEXT=child-v8` and does not act as a top-level runner. Depending on the Node 20 code path, it either:

- skips running files, warns that `run()` was called recursively within a test file, and exits 0; or
- reports through the v8 serializer rather than TAP.

In both cases the child's stdout carries no `^not ok \d+ - a watch loop that never returns$` line, and the case fails:

- on its first assertion (`the child run exited 0`), or
- on the case-name `assert.match`.

*Why the Task 6 probe passed.* The probe (`harness-runs/scratch/hung_watcher_probe.mjs`) built the same child and the same `{ ...process.env, HUNG_FIXTURE_RECORD }` environment. It ran as a plain `node` script through `scripts/scratch-run.sh`, outside any test runner, so `NODE_TEST_CONTEXT` was not set and the nested runner printed TAP.

Nothing else in `cli/test` spawns `node --test`, and nothing in the repository mentions `NODE_TEST_CONTEXT` (`git grep` finds nothing). So only this case is affected.

**Fix.**

- [ ] `cli/test/test-timeout.test.mjs`: build the nested runner's environment without `NODE_TEST_CONTEXT`. For example, add a small module-level helper beside `execResult`:

  ```js
  /** The parent's environment minus the runner's child marker, so the nested `node --test` runs as a top-level runner and prints TAP. */
  function topLevelRunnerEnv(extra) {
    const { NODE_TEST_CONTEXT: _childMarker, ...env } = process.env;
    return { ...env, ...extra };
  }
  ```

  Then change the call's options to `{ cwd: dir, env: topLevelRunnerEnv({ HUNG_FIXTURE_RECORD: recordPath }) }`. Leave `CHILD_TEST_TIMEOUT_MS` (240 000), `CHILD_BOUND_MS` (2 000), `REAP_GRACE_MS` and every assertion unchanged.
- [ ] Same file, module header: add one sentence saying the child runs under the parent's environment **minus `NODE_TEST_CONTEXT`**. The runner sets that variable in every test-file subprocess, and a nested `node --test` that inherits it does not run as a top-level TAP runner. That is why a probe outside the runner passes while the case fails inside it. The cli layer's rule on module headers (`.claude/context/cli.md` → `## What "done" means here`, last bullet) asks for this: the header states the rule, so it must name the condition the case depends on.
- [ ] Optional, informational: append `\n${child.stderr}` to the two `assert.match(child.stdout, …)` messages, as the `assert.notEqual` message already does. A future failure then shows the nested runner's stderr, including a recursion warning, in the gate output.
