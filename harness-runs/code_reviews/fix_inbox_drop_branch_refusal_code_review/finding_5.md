### 5. The unresolvable-set watcher case drops its pass's exit status and diagnostics

**File:** `cli/test/watcher-remote-dispatch.test.mjs` (the case `while the protected set cannot be resolved any drop is refused at intake`) — "await runBash("

This case composes its own pass instead of calling `f.tick()`, because it has to swap the configuration after the watcher is sourced. `f.tick()` (`cli/test/helpers/watcher.mjs`) asserts `result.status === 0` and puts the pass's stdout and stderr into the failure message; the inline copy discards `runBash`'s result. If the pass dies part-way (a sourcing error, a probe override that no longer matches), the case fails later on `assertRefusedAtIntake` with a message that carries none of the shell's output, which is what a maintainer needs to see why.

**Fix:** keep the result and assert on it as `tick` does:

```js
const result = await runBash(
  f.dir,
  ['-c', script, '_', f.watcherPath, brokenPath, join(f.dir, 'harness.config.json')],
  f.watcherEnv(),
  { timeoutMs: TICK_TIMEOUT_MS, signal: t.signal },
);
assert.equal(result.status, 0, `the watcher pass exited ${result.status}\n${result.stdout}\n${result.stderr}`);
```

This file is the one the fix edits, so it is the one test to run: `npm test --workspace cli -- test/watcher-remote-dispatch.test.mjs`, from the repository root, as one plain foreground command.
