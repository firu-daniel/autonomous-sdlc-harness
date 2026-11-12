### 1. Respell the `Switch to the configured default branch` assertion to `devscene.config.json`

**Site:** `cli/test/sandbox-probe-runner-workflow.test.mjs` → test `"the job's own steps are copied, byte for byte"`, the last assertion of its body (around line 173):

```js
assert.match(step(SWITCH).run, /jq -r '\.defaultBranch[^']*' harness\.config\.json/);
```

**Failing test:** `cli/test/sandbox-probe-runner-workflow.test.mjs` — `the job's own steps are copied, byte for byte` (TAP `not ok 1604`).

**Failure, as the log reports it:**

```
not ok 1604 - the job's own steps are copied, byte for byte
  location: 'cli/test/sandbox-probe-runner-workflow.test.mjs:149:1'
  failureType: 'testCodeFailure'
  error: |-
    The input did not match the regular expression /jq -r '\.defaultBranch[^']*' harness\.config\.json/. Input:

    'gh_branch="$IN_GH_DEFAULT_BRANCH"\n' +
      "cfg=$(jq -r '.defaultBranch // empty' devscene.config.json)\n" +
      'if [ -z "$cfg" ]; then\n' +
      '  echo "::error::devscene.config.json names no defaultBranch, so the probe has no branch its preflight accepts."\n' +
  code: 'ERR_ASSERTION'
```

**Class:** first round — no earlier log to compare against.

**Diagnosis:** Task 16 (commit `e6ec3d11`, "Rename in this repository's sandbox-probe and Gate 12 scripts") respelled `scripts/sandbox-probe-runner.yml`'s `Switch to the configured default branch` step to read `devscene.config.json` (`cfg=$(jq -r '.defaultBranch // empty' devscene.config.json)`), which is the branch's intended rename — every template workflow under `cli/templates/github/workflows/` reads `devscene.config.json` too. The suite's regex for that step was not respelled with it and still requires `harness.config.json`, so the assertion fails on a workflow that is correct. The workflow is right; the test is stale. No other assertion in this file names `harness.config` (grep-verified: line 173 is the only `harness\.config` hit under `cli/test/*.mjs`).

**Fix:** in `cli/test/sandbox-probe-runner-workflow.test.mjs`, change the regex on that one line to name the new file:

```js
assert.match(step(SWITCH).run, /jq -r '\.defaultBranch[^']*' devscene\.config\.json/);
```

Leave `scripts/sandbox-probe-runner.yml` unchanged. Check the module header (lines 1–21) still reads true after the edit — it names neither config file, so no header change is expected.

- [x] Respell the regex at the `step(SWITCH).run` assertion.
- [x] Confirm `git grep -n 'harness\\.config' -- cli/test/sandbox-probe-runner-workflow.test.mjs` prints nothing.
