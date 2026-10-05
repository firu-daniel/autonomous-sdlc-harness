### 5. `doctor.test.mjs`'s `failing` table closes its array on the same line as its last row

**File:** `cli/test/doctor.test.mjs` (the `failing` table in `the remote-github check asks GitHub only under --check-github and grades e…`) — "'billing follows ANTHROPIC_API_KEY when both are set', 7],  ];".

**Problem.** When this branch changed the call count from 6 to 7, the closing `];` of the `failing` array was joined onto the last row, after two spaces. Every other table in the suite closes its array on a line of its own, at the indentation of the `const` that opens it. This is formatting only, and it changes no behaviour.

**Fix.** Split the line into these two:

```js
    ['neither credential secret is set', { secrets: { out: JSON.stringify([{ name: 'HARNESS_PUSH_URL' }]) } }, undefined, 'billing follows ANTHROPIC_API_KEY when both are set', 7],
  ];
```

Verify with `npm test -- test/doctor.test.mjs` from `cli/`. It is the one test file this fix edits.
