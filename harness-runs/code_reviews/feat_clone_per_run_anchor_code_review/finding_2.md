### 2. `doctor-main-anchor.test.mjs` states that a rule in `deny` warns, but no case puts the rule in `deny`

**File:** `cli/test/doctor-main-anchor.test.mjs` (the `concurrentSuite('doctor profile-main-anchor', …)` block) — "it('(c) warns when the rule is also in ask, naming ask'"

**Problem.** The suite header states the rule it enforces: *"a profile whose `permissions.allow` lacks the anchor read's rule, or whose `ask` or `deny` list carries it, is reported as a `warn`"*. `PROFILE_MAIN_ANCHOR_CHECK` in `cli/src/doctor/checks.ts` has three arms: missing from `allow`, present in `ask` ("is in its ask list, …"), and present in `deny` ("is in its deny list, which no allow overrides"). Cases (b) and (c) cover the first two. No case covers the `deny` arm, and the header does not say that this behaviour is left uncovered or why. `.claude/context/conventions.md` → `## The testing bar` requires that: *"where a documented behaviour is deliberately not covered, that header says which behaviour and why"*. Today, removing or breaking the `deny` arm would pass the suite.

**Fix.** Add a case after (c), in the same shape:

```js
  it('(f) warns when the rule is also in deny, naming deny', async (t) => {
    const dir = await wiredFixture(t);
    editProfile(dir, (profile) => {
      profile.permissions.deny = [...(profile.permissions.deny ?? []), MAIN_REPO_ANCHOR_RULE];
    });
    const { line } = await doctorLine(dir, 'WARN');
    assert.ok(line.includes('deny list'), line);
    assert.ok(!line.includes('missing from its allow list'), line);
  });
```

Leave the header unchanged: with this case it describes what the suite covers. Verify with that one file: `npm test --workspace cli -- test/doctor-main-anchor.test.mjs`, from the repository root.
