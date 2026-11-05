### 5. `const job3 =await` is missing a space

**File:** `cli/test/watcher-remote-park-sequence.test.mjs` (`playSequence`) — "const job3 =await s.job('pause', job3Env);"

**The problem.** Task 5 replaced `setStub(':')` with `setStub(finishedLedgerBody(s.branch))`. In the same hunk it changed the next line from `const job3 = await …` to `const job3 =await …`, dropping the space after `=`. The change has no effect on behaviour, and nothing else in the suite is spelled this way.

**Fix.** Restore the space:

```js
  const job3 = await s.job('pause', job3Env);
```

This is whitespace only, so it owes no test run of its own.
