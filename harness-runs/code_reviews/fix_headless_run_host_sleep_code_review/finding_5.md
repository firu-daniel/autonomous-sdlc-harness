### 5. The `keep-awake` sentence for a WSL1 host names the platform as `linux`

**File:** `cli/src/doctor/keepAwake.ts` (`assessKeepAwake`): "case 'wsl1':"

**What goes wrong.** `wsl1` and `unsupported` share one arm, which prints ``No sleep hold on this platform (`${facts.platform}`)``. On WSL1, `process.platform` is `linux`, so the warning reads *"No sleep hold on this platform (`linux`)"*. That is the platform where a hold is supported, and it says nothing about WSL1, the reason this host gets none.

**Fix.** Split the arm and keep the shared prefix, which `cli/test/keep-awake.test.mjs` matches for both rows:

```ts
    case 'wsl1':
      return result('cannot-hold', 'No sleep hold on this platform (WSL1); a run launches unheld.');
    case 'unsupported':
      return result('cannot-hold', `No sleep hold on this platform (\`${facts.platform}\`); a run launches unheld.`);
```

Both rows in `cli/test/keep-awake.test.mjs` assert the substring `No sleep hold on this platform`, so they need no change. To pin the new text, change the WSL1 row's expected fragments to `['No sleep hold on this platform (WSL1)']`, and run `npm test --workspace cli -- test/keep-awake.test.mjs`.
