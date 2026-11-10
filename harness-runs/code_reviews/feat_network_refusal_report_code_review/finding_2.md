### 2. `run-analytics-network.test.mjs` claims a gate-log failure never stops the sessions, but no case causes one

**File:** `cli/test/run-analytics-network.test.mjs` (the module header) — "a failure on the log path never stops the sessions"

The suite header states its rule as: *"every refused call in a recorded session reaches both files, every finished round log is scanned once per change, a failure on the log path never stops the sessions, and no machine path reaches either file."* None of its cases makes the log path fail. The nearest is "a symlinked log is not followed and the sessions are still written". That case is the `[ -L ]` skip in `cli/templates/scripts/run-analytics.sh`'s lane loop, which sets no `gate_logs_err`. The failure arm sets `gate_logs_err`, prints `run-analytics: gate logs not read: …` on stderr and continues with the sessions, and it is never reached. `.claude/context/conventions.md` → `## The testing bar` requires a header to state the rule its suite enforces, and to say so when a documented behaviour is deliberately not covered. Here the header claims coverage the suite does not have.

**Fix:** add this case to `cli/test/run-analytics-network.test.mjs`, after "a symlinked log is not followed and the sessions are still written". Add `chmodSync` to the existing `node:fs` import.

```js
test('an unreadable round log is one stderr line, and the sessions are still written', async (t) => {
  if (typeof process.getuid === 'function' && process.getuid() === 0) {
    t.skip('root reads a mode-000 file, so the copy cannot be made to fail');
    return;
  }
  const f = await adopted(t);
  f.put(LABEL, 'log', [CONNECT]);
  f.put(LABEL, 'verdict', ['pass']);
  chmodSync(join(f.lane, `${LABEL}.log`), 0o000);
  const r = await f.run();
  assert.equal(r.status, 0, output(r));
  assert.ok(r.stderr.includes(`run-analytics: gate logs not read: cannot copy '${LABEL}.log' into the working copy`), output(r));
  const doc = f.doc();
  assert.equal(doc.schema, 1);
  assert.equal('gate_logs' in doc, false);
  assert.ok(doc.sessions.length > 0);
  assert.equal(r.stdout, `recorded ${doc.sessions.length} session(s) for ${BRANCH}\n`, output(r));
});
```

Do not restore the mode. The fixture's own cleanup, which `adopted` registers, removes the mode-000 log anyway: removing a file needs write access to its directory, not read access to the file. A restore hook registered after it would run against a file that is already gone, and fail. This test file is the one the fix edits, so it is the only test file the fix runs, through `npm test --workspace cli -- test/run-analytics-network.test.mjs`.
