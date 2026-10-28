### 1. `sp__git_cs3_state`, the step that stops a permission-refused CS3 call from turning CS3 `fail`, is driven by no test

**File:** `cli/test/sandbox-probe-protection-legs.test.mjs` (the `test('sp__git_cl5_grade: …')` block, which the new case follows). The function under test is `scripts/lib/sandbox-probe/legs-protection.sh` (`sp__git_cs3_state`), from "case \"$unrun\" in".

**Problem.** The task prompt's constraint is *"The probe's own tests drive every fix against recorded stream fixtures."* The story plan's context turns that into: each fix puts its decision in a named grading function that a test sources and calls directly. Task 3 fixed CS3 in two parts:

1. `sp__git_cs3_call` grades one call refused at the permission layer `not run`.
2. `sp__git_cs3_state` skips the commit, stash and HEAD state checks that depend on a call graded `not run` (its `<unrun>` argument).

Task 9 tests only the first part. The second is the one that decides the row. In `sp_leg_git`, any entry in `fails` wins over `notrun`. So without the `<unrun>` skip, a `git add` refused at the permission layer leaves the ref unmoved, `commit: …` lands in `fails`, and CS3 prints `fail`. That is the PD3 shape the audit says this branch fixes. Task 3 checked this skip by hand through a scratch probe (its `**Verification:**` deviation note) and committed no test for it. A regression in the `case "$unrun"` arms, such as a misspelled word or a lost leading or trailing space in `unrun=" $7 "`, would bring back a false CS3 `fail`, and no test would catch it.

**Fix.** Add one `test(...)` after the `sp__git_cl5_grade` block in `cli/test/sandbox-probe-protection-legs.test.mjs`. It uses the file's existing `caseDir`, `sourced`, `seedRepository` and `runGit` helpers and no new import beyond `writeFile` and `mkdir`, which the file already imports:

```js
test('sp__git_cs3_state: a state check whose call did not run is skipped, never failed', async (t) => {
  async function state(t, unrun) {
    const dir = await caseDir(t);
    const clone = join(dir, 'clone');
    await mkdir(clone);
    await seedRepository(clone, { remote: false });
    await runGit(clone, ['checkout', '-q', '-b', 'sbx_probe']);
    await writeFile(join(clone, 'b.txt'), 'seed\n');
    await runGit(clone, ['add', 'b.txt']);
    await runGit(clone, ['commit', '--quiet', '-m', 'seed']);
    const ref = (await runGit(clone, ['rev-parse', 'refs/heads/sbx_probe'])).stdout.trim();
    const run = await sourced(
      dir,
      'sp__git_cs3_state "$@"; printf \'%s|%s\' "$SP__GIT_STATE_F" "$SP__GIT_STATE_P"',
      [ref, 'b.txt', 'b.txt', 'sandbox probe CS3', 'sbx_cs3_switch', '0', unrun],
      { SP_CLONE: clone, SP_BRANCH: 'sbx_probe' },
    );
    assert.equal(run.status, 0, run.stderr);
    return run.stdout.split('|');
  }

  await t.test('every dependent call not run: no failure, three not-checked parts', async (t) => {
    const [fails, parts] = await state(t, 'add commit push pop switch');
    assert.equal(fails, '');
    assert.equal(
      parts,
      'commit: not checked, git add or git commit did not run; ' +
        'stash: not checked, git stash push or git stash pop did not run; ' +
        'switch: not checked, git switch -c did not run',
    );
  });

  await t.test('every call ran: the unchanged state is three failures', async (t) => {
    const [fails] = await state(t, '');
    assert.match(
      fails,
      /^commit: .*; the stash pop did not restore the change to b\.txt; switch: HEAD is 'sbx_probe', not sbx_cs3_switch$/,
    );
  });

  await t.test('only switch not run: the commit and stash failures stay, no switch failure', async (t) => {
    const [fails] = await state(t, 'switch');
    assert.match(fails, /^commit: .*; the stash pop did not restore the change to b\.txt$/);
    assert.doesNotMatch(fails, /switch:/);
  });
});
```

Then add `sp__git_cs3_state` to the header's function list (the `` `sp__git_cs3_fetch`, `sp__wp_dd_grade`, `sp__git_cs3_call`, `sp__git_cl5_grade`, `sp__wp_tracked` `` sentence). Also extend the rule sentence's permission clause, *"a call refused at the permission layer never reached the layer CS1, CS2, CS7, CS3 and CL5 measure, and is `not run`"*, with *", and a CS3 state check depending on such a call is skipped rather than failed"*.

This fix edits only `cli/test/sandbox-probe-protection-legs.test.mjs`, so that file is the only test it runs (`npm test --workspace cli -- test/sandbox-probe-protection-legs.test.mjs`). The full suite runs later, in the Run gates phase.
