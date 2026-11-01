### 5. `cli/test/sandbox-probe-runner-workflow.test.mjs` imports `js-yaml`, which the `cli` workspace does not declare

**File:** `cli/test/sandbox-probe-runner-workflow.test.mjs` — "import { load } from 'js-yaml';". The workspace manifest is `cli/package.json` → `devDependencies`.

**Problem.** `js-yaml` is declared only in the root `package.json` → `devDependencies` (`"js-yaml": "^4.3.2"`), for Gate 14's root-level `scripts/check-rendered-workflows.mjs`. No other `cli/test` suite imports it. This one resolves only because npm hoists the root's dev dependencies into the shared `node_modules`. The suite runs as `npm test --workspace cli`, so a `cli`-only install would fail it with `ERR_MODULE_NOT_FOUND`, and so would any later change that stops the root from depending on `js-yaml`. Nothing in `cli/` records that the suite needs it.

The plan-stage architecture review raised exactly this (`harness-runs/architecture_reviews/feat_sandbox_probe_job_mode/review_0.md`, item 1: "Either follow that existing reader for both files … or have the task add `js-yaml` to `cli/package.json` → `devDependencies` and say so"). Task 22 did neither, and its plan cites the root entry instead.

**Fix.** Declare the dependency in the workspace that imports it.

1. In `cli/package.json` → `devDependencies`, add `"js-yaml": "^4.3.2"` as the last entry, after `"@modelcontextprotocol/sdk": "^1.31.0"`.
2. In `package-lock.json` → `"packages"` → `"cli"` → `"devDependencies"`, add the same entry, `"js-yaml": "^4.3.2"`. That object is sorted alphabetically, so it goes after `"@types/node": "^20.14.0"` and before `"typescript": "^5.6.0"`. The resolved package entry `"node_modules/js-yaml"` (4.3.2) is already in the lock, so no other lock entry changes and `npm ci` stays in sync.
3. In the suite's header comment, after "The canary name and the controls keys are read back by sourcing `legs-runner-isolation.sh` and `legs-runner.sh`, never retyped.", add: `It parses both files with js-yaml, a cli/package.json devDependency.`

The suite's own run, `npm test --workspace cli -- test/sandbox-probe-runner-workflow.test.mjs`, is the test file the fix runs.
