### 1. Poller-upload test loops forever once the ACTION PINS header names `actions/upload-artifact`

**File:** `cli/test/workflow-templates.test.mjs`, in the test `'the poller uploads its state under POLL_STATE_ARTIFACT_NAME, the name remote-run.sh downloads, always'`. Look for `RESUME_LINES.findIndex((line) => line.includes('actions/upload-artifact'))` and the loop right after it, `while (!/^\s*- name:/.test(RESUME_LINES[start])) start--;`. Near line 155 (a navigation hint only).

**Failing test:** `cli/test/workflow-templates.test.mjs`. The log reports the whole file as test 33, `cli/test/workflow-templates.test.mjs`, and cancelled it at the file level.

**Failure (from the log, machine paths rewritten):**

```
  FAIL  4 npm test (exit 1)
        not ok 33 - cli/test/workflow-templates.test.mjs
          ---
          duration_ms: 1800032.993333
          location: 'cli/test/workflow-templates.test.mjs:1:1'
          failureType: 'testTimeoutFailure'
          error: 'test timed out after 1800000ms'
          code: 'ERR_TEST_FAILURE'
          ...
        # tests 1015
        # pass 1014
        # fail 0
        # cancelled 1
        npm error command sh -c node --test --test-timeout=1800000
```

**Diagnosis.** New this round: there is no earlier-round log, and the cause was added on this branch. Task 3 (commit `2d80e79`, "Move workflow templates to Node 24 action majors") added a `# ACTION PINS.` block to the header of `cli/templates/github/workflows/harness-resume.yml`. That block includes the comment line `#   actions/upload-artifact@v6` (near line 65), and it sits well above the first step (`- name: Check out the default branch`, near line 107). The upload step's real `uses: actions/upload-artifact@v6` line is further down, near line 134.

The existing poller-upload test finds the upload with `RESUME_LINES.findIndex((line) => line.includes('actions/upload-artifact'))`, so it now matches the header comment instead of the `uses:` line. It then walks backwards to the step's `- name:` line with `while (!/^\s*- name:/.test(RESUME_LINES[start])) start--;`, and that loop has no lower bound. No `- name:` line sits above the header, so `start` goes below 0. `RESUME_LINES[-1]` is `undefined`, the regex tests the string `"undefined"`, never matches, and the loop keeps decrementing forever. The loop is synchronous, so it blocks the test file's process until the runner's `--test-timeout=1800000` cancels the whole file. That is why the log shows `cancelled 1` and a file-level `testTimeoutFailure`, not an assertion failure.

The `harness-run.yml` counterpart is safe: `stepCarrying('actions/upload-artifact')` searches only inside `- name:` step blocks, so a header comment never reaches it. The template is correct as it stands: the new `ACTION PINS header names exactly the uses: values` test needs that header line. The fix belongs in the test's locator.

**Fix.** In `cli/test/workflow-templates.test.mjs`, in the poller-upload test only:

- [ ] Change the locator so it matches the upload step's `uses:` line and not any line that mentions the action. For example, replace `RESUME_LINES.findIndex((line) => line.includes('actions/upload-artifact'))` with `RESUME_LINES.findIndex((line) => /^\s*(?:- )?uses:\s*actions\/upload-artifact@/.test(line))`. A comment line starting with `#` can then never match.
- [ ] Put a lower bound on the walk back, so a future locator mistake fails fast and cannot hang the file: `while (start >= 0 && !/^\s*- name:/.test(RESUME_LINES[start])) start--;`, followed by `assert.ok(start >= 0, 'the upload-artifact uses: line sits inside a named step');`.
- [ ] Keep every other assertion in that test unchanged: the `name: POLL_STATE_ARTIFACT_NAME` match, the `if: always()` match and the `remote-run.sh` `POLL_STATE_ARTIFACT_NAME=` match.

Do not change `cli/templates/github/workflows/harness-resume.yml`. Its `# ACTION PINS.` header is exactly what the `ACTION PINS header names exactly the uses: values` test requires.

**Deviations from plan:**

- Evidence downgrade: the row-`G.4` single-file run of `cli/test/workflow-templates.test.mjs` was not executed, because neither `.claude/context/cli.md` nor `.claude/context/conventions.md` states a single-file test command. Took the fix-site fallback instead: reading the fix site showed the locator still used `line.includes('actions/upload-artifact')` and the walk back had no lower bound, so the fix was not yet in place and was implemented as specified. That the named test now passes rests on reading the code (the locator now matches only `harness-resume.yml`'s `uses: actions/upload-artifact@v6` line, not the `#   actions/upload-artifact@v6` header comment). The run is deferred to the Run gates phase.
