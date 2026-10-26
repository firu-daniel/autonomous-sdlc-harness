### 6. The `doctor-tree-guards` suite header promises the absolute-`test` rule, but no case covers it

**File:** `cli/test/doctor-tree-guards.test.mjs` — the header sentence "An absolute `test`, or one carrying a `..` segment, resolves against nothing."

**Problem.** The suite header names two refusals in `treeGuardTestResolves`: an absolute `test` and one with a `..` segment. Only the `..` refusal has a case (*"a test carrying a .. segment warns even where the file exists"*). No case exercises the absolute-path refusal, which `docs/cli.md` → `## 7. \`doctor\`` also documents (*"an **absolute** value … resolves against nothing and is reported as missing"*). So nothing would catch a change that started resolving an absolute value directly, for example by swapping `join` for `resolve`, which honours an absolute second argument. `.claude/context/conventions.md` → `## The testing bar` asks a header to state the rule its cases enforce. Where a documented behaviour is deliberately left uncovered, the header has to say so. Here the behaviour is stated as covered but is not.

**Fix.** In `cli/test/doctor-tree-guards.test.mjs`, add this after the `..` subtest:

```js
  await t.test('an absolute test warns even where the file exists', async (subtest) => {
    const dir = await wiredFixture(subtest);
    plant(dir, 'test/absolute-guard.test.mjs');
    const absolute = join(dir, 'test/absolute-guard.test.mjs');
    await setGuards(dir, [{ test: absolute, covers: 'src/**' }]);

    const { line } = await doctorLine(dir, 'WARN');
    assert.ok(line.includes(absolute), line);
  });
```

This is the one test file the fix edits, so it is the only test the fix runs. The full suite runs in the Run gates phase.
