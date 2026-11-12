### Task 10 — Rename the variables in the close, mention, needs-agent and review run-control suites

**Goal:** The run-control cases drive `remote-run.sh control` with the `DEVSCENE_` repository variables set, the `DEVSCENE_GH_CLI` and `DEVSCENE_AGENT_CLI` stubs, and the `DEVSCENE_CLI_VERSION` pin.

**Depends on:** Task 4, whose `remote-run.sh` reads `DEVSCENE_RUN_ACTORS`, `DEVSCENE_REMOTE_STOP`, `DEVSCENE_TRIGGER_LABEL`, `DEVSCENE_TRIGGER_ALLOWED_BOTS`, `DEVSCENE_CLI_VERSION`, `${DEVSCENE_GH_CLI:-gh}` and `${DEVSCENE_AGENT_CLI:-claude}`. Also Task 6, whose `devscene-control.yml` sets them.

**A seam renamed on one side only launches the real binary.** The mention and needs-agent cases set an agent stub. Each environment object setting `HARNESS_AGENT_CLI` or `HARNESS_GH_CLI` must set the `DEVSCENE_` name, or the case launches the real agent or `gh`. `HARNESS_MENTION_PLUGIN_DIR`, `HARNESS_TRIGGER_LOOKUP_SECS` and `HARNESS_REMOTE_SLUG` are kept.

### Targets

- `cli/test/remote-control-close.test.mjs`
- `cli/test/remote-control-mention.test.mjs`
- `cli/test/remote-control-needs-agent.test.mjs`
- `cli/test/remote-control-review.test.mjs`

**Work:** literal substring replacement of `## Context`'s table tokens only.

- [ ] `remote-control-close.test.mjs`: `HARNESS_RUN_ACTORS`, `HARNESS_GH_CLI`, `HARNESS_REMOTE_STOP`, `HARNESS_TRIGGER_ALLOWED_BOTS` and `HARNESS_TRIGGER_LABEL`.
- [ ] `remote-control-mention.test.mjs`: `HARNESS_GH_CLI`, `HARNESS_AGENT_CLI`, `HARNESS_REMOTE_STOP`, `HARNESS_TRIGGER_ALLOWED_BOTS`, `HARNESS_RUN_ACTORS`, `HARNESS_TRIGGER_LABEL` and `HARNESS_CLI_VERSION`.
- [ ] `remote-control-needs-agent.test.mjs`: `HARNESS_GH_CLI`, `HARNESS_AGENT_CLI`, `HARNESS_REMOTE_STOP`, `HARNESS_TRIGGER_ALLOWED_BOTS` and `HARNESS_RUN_ACTORS`.
- [ ] `remote-control-review.test.mjs`: `HARNESS_RUN_ACTORS`, `HARNESS_GH_CLI`, `HARNESS_REMOTE_STOP`, `HARNESS_TRIGGER_ALLOWED_BOTS` and `HARNESS_TRIGGER_LABEL`.

**Verification:**

- This task's own test files pass, each run as `npm test --workspace cli -- test/<file>`: the four files above.
- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- cli/test/remote-control-close.test.mjs cli/test/remote-control-mention.test.mjs cli/test/remote-control-needs-agent.test.mjs cli/test/remote-control-review.test.mjs` prints nothing.
