### Task 9 — Rename the variables in the remote-trigger, remote-control and remote-collect suites

**Goal:** The trigger, command and collect cases drive `remote-run.sh` with `DEVSCENE_RUN_ACTORS`, `DEVSCENE_REMOTE_STOP`, `DEVSCENE_TRIGGER_LABEL` and `DEVSCENE_TRIGGER_ALLOWED_BOTS` set, through the `DEVSCENE_GH_CLI` stub.

**Depends on:** Task 4, whose `remote-run.sh` reads exactly those names (`DEVSCENE_RUN_ACTORS`, `DEVSCENE_REMOTE_STOP`, `DEVSCENE_TRIGGER_LABEL`, `DEVSCENE_TRIGGER_ALLOWED_BOTS`, `${DEVSCENE_GH_CLI:-gh}`) and prints them in its notifications. Also Task 6, whose `devscene-trigger.yml` sets them for this script.

**A seam renamed on one side only launches the real binary.** Every environment object that sets `HARNESS_GH_CLI` to the `gh` stub must set `DEVSCENE_GH_CLI`, or the case runs the real `gh`. `HARNESS_TRIGGER_LOOKUP_SECS`, `HARNESS_REMOTE_SLUG`, `HARNESS_INPUT_*` and the JavaScript constant `NOT_HARNESS_BRANCH_REFUSAL` are kept; leave them.

### Targets

- `cli/test/remote-trigger.test.mjs`
- `cli/test/remote-control.test.mjs`
- `cli/test/remote-collect.test.mjs`

**Work:** literal substring replacement of `## Context`'s table tokens only, in environment objects, expected-message regexes and comments alike.

- [ ] `remote-trigger.test.mjs`: `HARNESS_RUN_ACTORS`, `HARNESS_REMOTE_STOP`, `HARNESS_TRIGGER_LABEL`, `HARNESS_GH_CLI` and `HARNESS_TRIGGER_ALLOWED_BOTS`.
- [ ] `remote-control.test.mjs`: `HARNESS_RUN_ACTORS`, `HARNESS_REMOTE_STOP`, `HARNESS_GH_CLI`, `HARNESS_TRIGGER_ALLOWED_BOTS` and `HARNESS_TRIGGER_LABEL`.
- [ ] `remote-collect.test.mjs`: `HARNESS_RUN_ACTORS`, `HARNESS_GH_CLI`, `HARNESS_REMOTE_STOP` and `HARNESS_TRIGGER_ALLOWED_BOTS`.

**Verification:**

- This task's own test files pass, each run as `npm test --workspace cli -- test/<file>`: `remote-trigger.test.mjs`, `remote-control.test.mjs` and `remote-collect.test.mjs`.
- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- cli/test/remote-trigger.test.mjs cli/test/remote-control.test.mjs cli/test/remote-collect.test.mjs` prints nothing.
