### 1. Blank the main-repo anchor in `test-time-scale.test.mjs`'s child environment

**Site:** `cli/test/test-time-scale.test.mjs`, function `loadWith`, the line `const env = { ...process.env };` (around line 37).

**Failing test:** `cli/test/main-anchor-isolation.test.mjs` — `every process.env spread in a test source blanks the anchor in the same object`

**Failure (from the log, gate 4 `npm test`, gate `test` exited 1):**

```
FAIL  4 npm test (exit 1)
      not ok 288 - every process.env spread in a test source blanks the anchor in the same object
      # tests 2308
      # pass 2303
      # fail 1
      npm error command sh -c node --test --test-timeout=1800000
```

**Class:** new this round (first gate round; no earlier log).

**Diagnosis.** The failing test scans every `.mjs` under `cli/test/` for each `...process.env` spread and takes the text from the spread to the next `}`; that slice must mention `ISOLATED_ENV` or `MAIN_REPO_ANCHOR_VARIABLE`. Against the current tree, every spread does so except one: `cli/test/test-time-scale.test.mjs` (added on this branch by commit `b40f9b1c`, "Add the HARNESS_TEST_TIME_SCALE test-time helper (Task 1)") builds `const env = { ...process.env };` and then only deletes `TIME_SCALE_VARIABLE` and `NODE_TEST_CONTEXT`. The object therefore carries no anchor blank, so the child `node` it starts would inherit `HARNESS_MAIN_REPO` from a watcher-launched gate run — exactly the leak the isolation rule forbids. The rule is real, not a scanner false positive: the fix belongs in the new test file, not in the scanner.

**Fix.**

- [ ] In `cli/test/test-time-scale.test.mjs`, add the import `import { MAIN_REPO_ANCHOR_VARIABLE } from '../dist/core/mainRepoAnchor.js';` beside the existing imports (the same import `cli/test/main-anchor-isolation.test.mjs`, `cli/test/daemon.test.mjs` and `cli/test/outer-loop-scripts.test.mjs` use; `cli/src/core/mainRepoAnchor.ts` exports `MAIN_REPO_ANCHOR_VARIABLE = 'HARNESS_MAIN_REPO'`).
- [ ] In `loadWith`, change `const env = { ...process.env };` to `const env = { ...process.env, [MAIN_REPO_ANCHOR_VARIABLE]: '' };` — the blank must sit inside the same object literal as the spread, since the scanner reads only up to the first `}` after it. Leave the two `delete` lines and the conditional `TIME_SCALE_VARIABLE` assignment as they are.
- [ ] Extend the file's header comment sentence about the child's environment so it also says the child's environment blanks `HARNESS_MAIN_REPO`.
- [ ] Do not change `cli/test/main-anchor-isolation.test.mjs`.
