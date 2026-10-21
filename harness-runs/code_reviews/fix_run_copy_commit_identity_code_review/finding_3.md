### 3. Case (u) never plants a signing key at the main checkout's own value, so "refused even at the main checkout's value" is shown only indirectly

**File:** `cli/test/clone-trust-check.test.mjs` (`test('(u) Signing keys the main checkout sets are neither listed nor written into the clone'`)

The story index's `Top risks:` says Task 1's tests prove that every signing and program key stays refused "even at the main checkout's own value". The suite shows this only indirectly. Case (k) plants each signing key into the clone with a `MARKER` path value, in a fixture whose main checkout sets no signing key. Case (u) sets the signing keys in the main checkout, then asserts that the spec and the created clone do not carry them. No case plants a signing key into the clone at the exact value the main checkout holds and asserts that the check refuses it. A later change could give signing keys a conditional exact-value rule the way the identity keys now have one, and that is precisely the case it would break. Today nothing in the suite would fail.

**Fix:** extend case (u) so that, after its existing acceptance assertion, it plants each key at the main checkout's value and asserts the refusal. Rename the case to say so:

```js
test("(u) Signing keys the main checkout sets are neither listed nor written into the clone, and are refused there at the main checkout's own value", async (t) => {
  const f = await fixture(t, { clone: false });
  const signing = { 'commit.gpgsign': 'true', 'gpg.format': 'ssh', 'user.signingkey': join(f.root, 'signing-key.pub') };
  for (const [key, value] of Object.entries(signing)) await runGit(f.main, ['config', key, value]);
  assert.equal(await f.create(BRANCH), f.clone);
  const spec = await readSpec(f);
  const held = await readHeld(f);
  for (const key of Object.keys(signing)) {
    assert.ok(!spec.has(key.toLowerCase()), `the spec lists ${key}`);
    assert.ok(!held.has(key.toLowerCase()), `the created clone sets ${key}`);
  }
  const g = await f.check(f.clone);
  assert.equal(g.status, '0', g.refusal);
  for (const [key, value] of Object.entries(signing)) {
    await f.config(key, value);
    await assertConfigRefused(f, key, /which the clone allow-list does not hold/);
    await f.config('--unset', key);
  }
});
```

This fix edits only `cli/test/clone-trust-check.test.mjs`, so that file is the only test it runs, as one plain foreground command from the repository root: `npm test --workspace cli -- test/clone-trust-check.test.mjs`. The full suite runs later, in the Run gates phase.
