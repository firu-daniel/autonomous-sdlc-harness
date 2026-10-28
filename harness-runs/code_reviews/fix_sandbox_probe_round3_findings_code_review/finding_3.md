### 3. `sp__cs8_line`, which turns CS8's two halves into the row's one verdict, is driven by no test

**File:** `cli/test/sandbox-probe-invalid-profile.test.mjs` (after the `test('sp__cs8b_check: …')` block). The function under test is `scripts/lib/sandbox-probe/legs-settings.sh` (`sp__cs8_line`), from "if [ \"$bv\" = fail ]; then".

**Problem.** The story plan's *"Interpretations"* fix CS8's row rule: *"`fail` when (b) fails. Otherwise `not run` when either half is `not run`. Otherwise `pass`. The evidence reads `(a) …; (b) …`."* Task 6 put that rule in `sp__cs8_line`. Task 11 tests `sp__cs8a_grade`, `sp__cs8b_grade` and `sp__cs8b_check` one at a time, but no case drives the combiner. That breaks the prompt's *"The probe's own tests drive every fix against recorded stream fixtures"*. The CS8 verdict the rerun prints comes from this function alone. One reordered arm would hide a watcher acceptance (b `fail`) behind an (a) `not run`, or print `pass` when (b) was `not taken`, and no test would catch either.

**Fix.** Add one `test(...)` to `cli/test/sandbox-probe-invalid-profile.test.mjs`, using the file's existing `sourced` and `caseDir` helpers. `sp_result_line` prints `departure="none"` for an empty departure and `claude="unknown"` because `sourced` sets `SP_VERSION` empty:

```js
test('sp__cs8_line: (b) failing fails the row, either half not run is not run, otherwise pass', async (t) => {
  async function line(t, ...args) {
    const run = await sourced(await caseDir(t), 'sp__cs8_line "$@"', args);
    assert.equal(run.status, 0, run.stderr);
    return run.stdout;
  }
  const expected = (result, evidence) =>
    `leg="invalid-profile" row="CS8" result="${result}" evidence="${evidence}" departure="none" claude="unknown"\n`;

  await t.test('both halves pass', async (t) => {
    assert.equal(
      await line(t, 'pass', 'A', 'CTL', 'pass', 'B', ''),
      expected('pass', '(a) recorded: A; CTL; (b) B'),
    );
  });

  await t.test('(b) failing fails the row even with (a) not run', async (t) => {
    assert.equal(await line(t, 'not run', 'A', '', 'fail', 'B', ''), expected('fail', '(a) not run: A; (b) B'));
  });

  await t.test('(a) not run with (b) passing is not run', async (t) => {
    assert.equal(await line(t, 'not run', 'A', '', 'pass', 'B', ''), expected('not run', '(a) not run: A; (b) B'));
  });

  await t.test('(b) not run with (a) recorded is not run', async (t) => {
    assert.equal(await line(t, 'pass', 'A', '', 'not run', 'B', ''), expected('not run', '(a) recorded: A; (b) B'));
  });

  await t.test('(b) not taken is not run', async (t) => {
    assert.equal(await line(t, 'pass', 'A', '', '', '', ''), expected('not run', '(a) recorded: A; (b) not taken'));
  });
});
```

Then add `sp__cs8_line` to the header's function list (the `` (`sp__cs8a_grade`, `sp__cs8b_check`, `sp__cs8b_grade` in `legs-settings.sh`) `` parenthesis), and add to the rule sentence: *"CS8's one line fails when (b) fails, is `not run` when either half is `not run` or (b) was not taken, and passes otherwise."*

This fix edits only `cli/test/sandbox-probe-invalid-profile.test.mjs`, so that file is the only test it runs (`npm test --workspace cli -- test/sandbox-probe-invalid-profile.test.mjs`). The full suite runs later, in the Run gates phase.
