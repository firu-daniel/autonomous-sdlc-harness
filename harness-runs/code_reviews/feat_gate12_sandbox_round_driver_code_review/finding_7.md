### 7. `INSTALL_STEP` is exported from the Gate 12 test helper, but no suite imports it

**File:** `cli/test/helpers/gate12-round.mjs` (`INSTALL_STEP`): "export const INSTALL_STEP = 'Install the sandbox prerequisites';"

Only `makeGate12Fixture`, in the same file, uses `INSTALL_STEP`. None of the seven `cli/test/gate12-sandbox-round-*.test.mjs` suites imports it. `cli/test/init.test.mjs` has an unrelated module-local `INSTALL_STEP` with a different value (`'claude plugin install'`). The export is unused surface, and it suggests that the step name has a shared owner the suites read, when `gate12-sandbox-round-full-run.test.mjs` and `gate12-sandbox-round-grade.test.mjs` each extract their step names from the shipped workflow instead.

**Fix:** drop the `export` keyword, and leave the constant in place for the helper's own use:

```js
/** The step name the preflight's last check looks for in the default branch's workflow. */
const INSTALL_STEP = 'Install the sandbox prerequisites';
```

This fix edits only `cli/test/helpers/gate12-round.mjs`, which is a helper and not a test file, so the fix itself runs no test. The loop's own tree-guard run and the Run gates suite cover the change.
