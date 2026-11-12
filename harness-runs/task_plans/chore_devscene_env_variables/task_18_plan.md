### Task 18 — Rename the variables in the suites that read the plugin and this repository's scripts

**Goal:** The three suites whose subjects live outside `cli/` assert the renamed producers. `qa-user-locks` writes `DEVSCENE_QA_<n>_*` credentials for `reserve-qa-user.sh`. `main-root-fallback` covers `hc_main_root` with and without `DEVSCENE_MAIN_REPO`. `sandbox-probe-git-and-legs` expects the probe's parity line to launch with `DEVSCENE_MAIN_REPO=`.

**Depends on:** Task 14 (`reserve-qa-user.sh` parses `^DEVSCENE_QA_[0-9]+_EMAIL=`; `harness-config-lib.sh` reads `DEVSCENE_MAIN_REPO`) and Task 17 (`scripts/lib/sandbox-probe/session.sh` prints `DEVSCENE_MAIN_REPO=<main> claude --settings …`). This is why this `cli` task ships after the `plugin` and `general` script tasks.

### Targets

- `cli/test/qa-user-locks.test.mjs`
- `cli/test/main-root-fallback.test.mjs`
- `cli/test/sandbox-probe-git-and-legs.test.mjs`

**Work:** literal substring replacement of `## Context`'s table tokens only.

- [ ] `qa-user-locks.test.mjs`: the four credential lines `HARNESS_QA_1_EMAIL=`, `HARNESS_QA_1_PASSWORD=`, `HARNESS_QA_2_EMAIL=` and `HARNESS_QA_2_PASSWORD=` become `DEVSCENE_QA_…`.
- [ ] `main-root-fallback.test.mjs`: the header's `HARNESS_MAIN_REPO`. The cases already use the constant.
- [ ] `sandbox-probe-git-and-legs.test.mjs`: `HARNESS_MAIN_REPO` in the header and in the expected launch line.

**Verification:**

- This task's own test files pass, each run as `npm test --workspace cli -- test/<file>`: `qa-user-locks.test.mjs`, `main-root-fallback.test.mjs` and `sandbox-probe-git-and-legs.test.mjs`.
- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- cli` prints nothing.
