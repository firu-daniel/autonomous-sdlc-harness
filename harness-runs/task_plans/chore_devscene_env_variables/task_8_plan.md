### Task 8 — Rename the variables in the `init`, workflow-template and remote-names suites

**Goal:** These suites hold the mirror pairs together under the new names: `init`'s printed `gh variable set` and `gh secret set` lines, the rendered workflows against the `githubActions.ts` constants, the `DEVSCENE_CLI_VERSION` pin, and `remote-run.sh`'s shell names against the TypeScript ones.

**Depends on:** Task 2 (the constants: `DEVSCENE_RUN_ACTORS`, `DEVSCENE_TRIGGER_LABEL`, `DEVSCENE_TRIGGER_ALLOWED_BOTS`, `DEVSCENE_RUNNER`, `DEVSCENE_REMOTE_STOP`, `DEVSCENE_PUSH_URL`, `DEVSCENE_PUSH_CMD`, `DEVSCENE_GIT_TOKEN`, `DEVSCENE_GH_CLI`, `DEVSCENE_CLI_VERSION`). Task 4 (`remote-run.sh`, which `remote-names.test.mjs` reads). Task 5 (`start-dev-server.sh` exports `DEVSCENE_DEV_SERVER_PORT`, which `init.test.mjs` asserts). Task 6 (the four workflow templates and the two `.env.example` templates these suites render and read).

**Where this task stops.** `init.test.mjs` also carries `HARNESS_SELF_ADOPT`, `HARNESS_TEST_EXIT`, `HARNESS_TEST_RECORD`, `HARNESS_TEST_CONCURRENCY`, `HARNESS_TEST_TIME_SCALE` and the excluded `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB`. All of them stay. `workflow-templates.test.mjs` asserts the kept job plumbing (`HARNESS_STOPPED`, `HARNESS_INPUT_BRANCH`, `HARNESS_JOB_MODE`, `HARNESS_PR_TOKEN`, `HARNESS_GITHUB_DEFAULT_*`, `HARNESS_MENTION_PLUGIN_DIR`); those assertions stay as they are.

### Targets

- `cli/test/init.test.mjs`
- `cli/test/trigger-workflow-init.test.mjs`
- `cli/test/workflow-templates.test.mjs`
- `cli/test/workflow-plugin-pin.test.mjs`
- `cli/test/remote-names.test.mjs`

**Work:** literal substring replacement of `## Context`'s table tokens only, in strings, regexes, hand-written workflow fixtures and comments alike. A fixture deliberately built as a pre-allow-list or unpinned copy stays a copy without `vars.DEVSCENE_RUN_ACTORS` or a `DEVSCENE_CLI_VERSION:` line. Add no old-name case.

- [ ] `init.test.mjs`: `HARNESS_DEV_SERVER_PORT`, `HARNESS_PUSH_URL`, `HARNESS_PUSH_CMD`, `HARNESS_GIT_TOKEN`, `HARNESS_CLI_VERSION`, `HARNESS_RUN_ACTORS`, `HARNESS_RUNNER`, `HARNESS_TRIGGER_LABEL` and `HARNESS_TRIGGER_ALLOWED_BOTS`.
- [ ] `trigger-workflow-init.test.mjs`: `HARNESS_RUN_ACTORS`, `HARNESS_TRIGGER_LABEL`, `HARNESS_TRIGGER_ALLOWED_BOTS`, `HARNESS_GIT_TOKEN` and `HARNESS_CLI_VERSION`.
- [ ] `workflow-templates.test.mjs`: `HARNESS_GIT_TOKEN`, `HARNESS_PUSH_URL`, `HARNESS_TRIGGER_ALLOWED_BOTS`, `HARNESS_RUNNER`, `HARNESS_REMOTE_STOP` and `HARNESS_CLI_VERSION`.
- [ ] `workflow-plugin-pin.test.mjs`: `HARNESS_CLI_VERSION`.
- [ ] `remote-names.test.mjs`: `HARNESS_GH_CLI`, `HARNESS_TRIGGER_LABEL`, `HARNESS_TRIGGER_ALLOWED_BOTS`, `HARNESS_RUN_ACTORS` and `HARNESS_RUNNER`.

**Verification:**

- This task's own test files pass, each run as `npm test --workspace cli -- test/<file>`: `init.test.mjs`, `trigger-workflow-init.test.mjs`, `workflow-templates.test.mjs`, `workflow-plugin-pin.test.mjs` and `remote-names.test.mjs`.
- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- cli/test/init.test.mjs cli/test/trigger-workflow-init.test.mjs cli/test/workflow-templates.test.mjs cli/test/workflow-plugin-pin.test.mjs cli/test/remote-names.test.mjs` prints nothing.
