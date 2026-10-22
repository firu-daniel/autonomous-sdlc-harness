### 2. Gate 4: `init.test.mjs` expects a `writeWrapperScripts` entry without the new `carried` field

**Site:** `cli/test/init.test.mjs`, test `'the command line writeWrapperScripts returns is the one it inlined into the wrapper'`. Its two closing assertions are `assert.deepEqual(byKey.typecheck, {` and `assert.deepEqual(byKey.deploy, {` (around lines 1429 and 1436).

**Failing test:** `cli/test/init.test.mjs`, `the command line writeWrapperScripts returns is the one it inlined into the wrapper`

**Failure (from the log, machine paths rewritten):**

```
FAIL  4 npm test (exit 1)
          not ok 19 - the command line writeWrapperScripts returns is the one it inlined into the wrapper
      not ok 268 - init
      # tests 2235
      # pass 2233
      # fail 1
      npm error path cli
      npm error command sh -c node --test --test-timeout=1800000
```

**Diagnosis:** new this round, and a regression from Task 1 (commit `126f8efd`, "carry wrapper command line forward in writeWrapperScripts"). That commit added a required field, `readonly carried: boolean`, to `WrittenWrapper` in `cli/src/generators/scripts.ts`. `writeWrapperScripts` now pushes every entry as `{ key, file, invocation, command: body, unresolved: unresolved === true, carried: carried === true }`. The test imports `node:assert/strict`, so its `assert.deepEqual` is a strict deep comparison. The two expected objects list only `key`, `file`, `invocation`, `command` and `unresolved`, so the extra `carried` key on the actual entry fails the first one (`byKey.typecheck`), and the test stops there. The test never sets `carryOnDiskCommandLines`, so both entries carry `carried: false`. The generator is behaving as Task 1 intended; the expectation is out of date. The round-trip loop earlier in the same test only compares `command` / `unresolved` and is not affected.

**Fix:** update the expectations to match the result's new shape. Do not drop the field or loosen the comparison.

- [ ] In the `assert.deepEqual(byKey.typecheck, { … })` expected object, add `carried: false,` after `unresolved: false,`.
- [ ] In the `assert.deepEqual(byKey.deploy, { … })` expected object, add `carried: false,` after `unresolved: true,`.
- [ ] Optionally, extend the test's doc comment just above it by one clause saying the entry also reports `carried`, which is `false` here because the test does not pass the self-adopt opt-in. The carry arm itself is covered by `cli/test/wrapper-carry-forward.test.mjs`.
- [ ] Leave `cli/src/generators/scripts.ts` unchanged.

Since this unit edits `cli/test/init.test.mjs`, it may verify the change by running that file alone as its own edited test file (`npm test --workspace cli -- test/init.test.mjs`, per `.claude/context/conventions.md` → `## The testing bar`).
