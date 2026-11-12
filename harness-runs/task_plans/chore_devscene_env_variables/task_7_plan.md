### Task 7 — Rename the variables in the `doctor` suites

**Goal:** The `doctor` suites assert the `DEVSCENE_` names that `doctor`'s messages now carry, and they set the `DEVSCENE_GH_CLI` and `DEVSCENE_AGENT_CLI` stub seams that the CLI and the daemon checks now read.

**Depends on:** Task 2, the producer of every name these suites assert: `GH_CLI_VARIABLE = 'DEVSCENE_GH_CLI'`, `AGENT_CLI_VARIABLE = 'DEVSCENE_AGENT_CLI'`, `RUNNER_VARIABLE`, `RUN_ACTORS_VARIABLE`, `REMOTE_STOP_VARIABLE`, `TRIGGER_LABEL_VARIABLE`, `TRIGGER_ALLOWED_BOTS_VARIABLE`, `GIT_TOKEN_SECRET`, `PUSH_URL_SECRET`/`PUSH_URL_KEY` (`DEVSCENE_PUSH_URL`), `PUSH_CMD_KEY` (`DEVSCENE_PUSH_CMD`) and `CLI_VERSION_VARIABLE` (`DEVSCENE_CLI_VERSION`). Also Task 6, whose rendered workflows carry `DEVSCENE_CLI_VERSION:` pins and `vars.DEVSCENE_RUN_ACTORS`, which these suites' fixtures render and grade.

**A seam renamed on one side only launches the real binary.** Every environment object here that sets `HARNESS_GH_CLI` or `HARNESS_AGENT_CLI` to a stub must set the `DEVSCENE_` name, or `doctor` would run the real `gh` and reach the network. Hand-written workflow text in a fixture that is meant to read as *current* uses `DEVSCENE_`. A fixture deliberately built as a copy lacking the allow-list keeps lacking `vars.DEVSCENE_RUN_ACTORS`: add no case for an old-named copy, because there is no compatibility path to test.

### Targets

- `cli/test/doctor.test.mjs`
- `cli/test/doctor-branch-protection.test.mjs`

**Work:** literal substring replacement of `## Context`'s table tokens only, in strings, regexes, stub scripts and comments alike.

- [ ] `doctor.test.mjs`: `HARNESS_RUN_ACTORS`, `HARNESS_PUSH_URL`, `HARNESS_PUSH_CMD`, `HARNESS_AGENT_CLI`, `HARNESS_GH_CLI`, `HARNESS_RUNNER`, `HARNESS_CLI_VERSION`, `HARNESS_REMOTE_STOP`, `HARNESS_GIT_TOKEN`, `HARNESS_TRIGGER_LABEL` and `HARNESS_TRIGGER_ALLOWED_BOTS`.
- [ ] `doctor-branch-protection.test.mjs`: `HARNESS_GH_CLI`.

**Verification:**

- This task's own test files pass: `npm test --workspace cli -- test/doctor.test.mjs` and `npm test --workspace cli -- test/doctor-branch-protection.test.mjs`.
- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- cli/test/doctor.test.mjs cli/test/doctor-branch-protection.test.mjs` prints nothing.
