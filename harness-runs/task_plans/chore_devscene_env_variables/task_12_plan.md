### Task 12 — Rename the variables in the watcher and restart-watcher suites

**Goal:** The watcher suites set the `DEVSCENE_GH_CLI` and `DEVSCENE_AGENT_CLI` stubs and assert the `DEVSCENE_MAIN_REPO`, `DEVSCENE_PUSH_URL`, `DEVSCENE_GIT_TOKEN` and `DEVSCENE_CLI_VERSION` names the watcher now uses. The restart-watcher suites drive `DEVSCENE_CLI`.

**Depends on:** Task 3. It renamed the watcher (`export DEVSCENE_MAIN_REPO="$MAIN_REPO"`, `${DEVSCENE_AGENT_CLI:-claude}`, `${DEVSCENE_GH_CLI:-gh}`, `DEVSCENE_PUSH_URL` and `DEVSCENE_GIT_TOKEN` in `SESSION_ENV_STRIP_EXTRA`, `DEVSCENE_CLI_VERSION`), `restart-watcher.sh` (`DEVSCENE_CLI`, `DEVSCENE_AGENT_CLI`) and `cli/test/helpers/watcher.mjs`'s agent stub. Also Task 4, because the remote-job cases dispatch through `remote-run.sh`.

**A seam renamed on one side only launches the real binary.** Every stub assignment of `HARNESS_GH_CLI`, `HARNESS_AGENT_CLI` or `HARNESS_CLI` becomes the `DEVSCENE_` name. These names are kept and stay as they are: `HARNESS_JOB_MODE`, `HARNESS_JOB_STARTED_EPOCH`, `HARNESS_JOB_DEADLINE_EPOCH`, `HARNESS_JOB_USAGE_REPEAT`, `HARNESS_INPUT_CHAIN`, `HARNESS_REMOTE_SLUG`, `HARNESS_GITHUB_DEFAULT_BRANCH`, `HARNESS_GITHUB_DEFAULT_COMMIT`, `HARNESS_DEFAULT_BRANCH_COMMIT`, `HARNESS_TEST_TIME_SCALE` and `HARNESS_PR_TOKEN`. `watcher-session-env.test.mjs` asserts that `HARNESS_PR_TOKEN` is stripped; that assertion stays.

### Targets

- `cli/test/watcher-remote-job.test.mjs`, `cli/test/watcher-remote-park-sequence.test.mjs`, `cli/test/watcher-remote-dispatch.test.mjs`
- `cli/test/watcher-session-env.test.mjs`, `cli/test/watcher-run-profile.test.mjs`
- `cli/test/watcher-placeholder-host.test.mjs`, `cli/test/watcher-stall-reset-payloads.test.mjs`, `cli/test/watcher-push-refusal.test.mjs`, `cli/test/watcher-keep-awake.test.mjs`, `cli/test/watcher-review-drop-payloads.test.mjs`, `cli/test/watcher-sandbox-refusal.test.mjs`
- `cli/test/restart-watcher-cli.test.mjs`, `cli/test/restart-watcher-remote.test.mjs`

**Work:** literal substring replacement of `## Context`'s table tokens only.

- [ ] The remote-job trio: `HARNESS_GH_CLI` and `HARNESS_AGENT_CLI`.
- [ ] `watcher-session-env.test.mjs` (`HARNESS_PUSH_URL`, `HARNESS_GIT_TOKEN`, `HARNESS_GH_CLI`, `HARNESS_MAIN_REPO`) and `watcher-run-profile.test.mjs` (`$HARNESS_MAIN_REPO` in its wrapper line).
- [ ] The six other watcher suites: `HARNESS_GH_CLI`, plus `HARNESS_CLI_VERSION` in `watcher-placeholder-host` and `watcher-stall-reset-payloads`.
- [ ] `restart-watcher-cli.test.mjs` and `restart-watcher-remote.test.mjs`: `HARNESS_CLI` and `HARNESS_AGENT_CLI`, including the expected error text that names `DEVSCENE_CLI`.

**Verification:**

- This task's own test files pass, each run as `npm test --workspace cli -- test/<file>`: the thirteen files above.
- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- 'cli/test/watcher-*.test.mjs' 'cli/test/restart-watcher-*.test.mjs'` prints nothing.
