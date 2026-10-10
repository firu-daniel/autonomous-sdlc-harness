### 3. The wrapper's whitespace trim on the `<none>` sentinel has no test

**File:** `cli/test/run-test-suite.test.mjs` (the loop that builds the cases titled "commands.typecheck \`<none>\` runs nothing and is logged as not run"), against `cli/templates/scripts/run-test-suite.sh`: "typecheck_trimmed=\"${typecheck_line#"

The wrapper trims whitespace from `commands.typecheck` before it compares the value with `TYPECHECK_NONE_SENTINEL`. That trim is what makes the shell mirror agree with `isNoneSentinel` in `cli/src/config/model.ts`, which trims as well, and `model.ts`'s doc comment now names the wrapper as one of "the sides that must agree on this answer". Every `<none>` case in the suite seeds the bare string `'<none>'`, so nothing exercises the trim. If someone removes it or gets it wrong, a padded sentinel such as `' <none> '` stops being recognised and gets `eval`-ed. `init`, `doctor` and the config check would all still treat that value as "no type check", but the wrapper would refuse or fail on it, and no test would catch the drift.

**Fix:** add one case after the two existing `<none>` cases in `cli/test/run-test-suite.test.mjs`:

```js
test('commands.typecheck `<none>` padded with whitespace is still the sentinel, as isNoneSentinel reads it', async (t) => {
  const dir = await wiredFixture(t, { typecheck: '  <none> ' });

  const result = await wrapper(dir, ['task_round_1']);

  assert.equal(result.stdout, 'pass\n');
  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  const lines = text(dir, `${LOG_DIR}/task_round_1.log`).split('\n');
  assert.ok(lines.includes(GATE_MARKER.typecheckNotRun), 'the padded sentinel was not recognised');
  assert.deepEqual(counterLines(dir), ['ran'], 'the test did not run exactly once');
});
```

This fix edits only `cli/test/run-test-suite.test.mjs`, so that file is the only test it runs: `npm test --workspace cli -- test/run-test-suite.test.mjs`, from the repository root. The full suite runs later, in the Run gates phase.
