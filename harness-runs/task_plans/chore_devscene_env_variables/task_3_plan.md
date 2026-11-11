### Task 3 — Rename the variables in the watcher, restart-watcher and notifier templates and the watcher test helper

**Goal:** The watcher exports `DEVSCENE_MAIN_REPO`, runs `${DEVSCENE_AGENT_CLI:-claude}` and `${DEVSCENE_GH_CLI:-gh}`, and strips `DEVSCENE_PUSH_URL` and `DEVSCENE_GIT_TOKEN` from the session. `restart-watcher.sh` reads `DEVSCENE_CLI` and `DEVSCENE_AGENT_CLI`. The notifier reads `DEVSCENE_PUSH_URL` and `DEVSCENE_PUSH_CMD` and hands the title over as `DEVSCENE_PUSH_TITLE`.

**Depends on:** Task 2, which set `MAIN_REPO_ANCHOR_VARIABLE` to `DEVSCENE_MAIN_REPO`, `CLI_VERSION_VARIABLE` to `DEVSCENE_CLI_VERSION`, `GH_CLI_VARIABLE` to `DEVSCENE_GH_CLI`, `PUSH_URL_KEY` and `PUSH_URL_SECRET` to `DEVSCENE_PUSH_URL`, `PUSH_CMD_KEY` to `DEVSCENE_PUSH_CMD`, and `GIT_TOKEN_SECRET` to `DEVSCENE_GIT_TOKEN`. This task's shell spells exactly those literals.

**Why the helper is in this task.** Changing any file under `cli/templates/scripts/` selects the tree guard `test/watcher-main-anchor.test.mjs`. That guard asserts that only the watcher's `export DEVSCENE_MAIN_REPO="$MAIN_REPO"` names the anchor outside comments. It also launches the watcher through `cli/test/helpers/watcher.mjs`, whose agent stub is passed in the agent-CLI variable. If the watcher read `DEVSCENE_AGENT_CLI` while the helper still set `HARNESS_AGENT_CLI`, the guard would launch the real agent binary. So this is the first template-scripts task, and it changes both sides.

**Where this task stops.** `remote-run.sh` is Task 4's, and the other script templates are Task 5's. The suites that drive these scripts are Task 12's (watcher and restart-watcher) and Task 11's (`remote-run.test.mjs`, which records the notifier's title). The self-adopted copies under `scripts/` are Task 16's. In the watcher, `HARNESS_REPO_SLUG`, `HARNESS_REMOTE_SLUG`, `HARNESS_JOB_*`, `HARNESS_INPUT_*`, `HARNESS_GITHUB_DEFAULT_BRANCH`, `HARNESS_GITHUB_DEFAULT_COMMIT` and `HARNESS_DEFAULT_BRANCH_COMMIT` are kept and do not change. In the stall-watchdog line that names several variables, only `HARNESS_CLI_VERSION` changes.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh`
- `cli/test/helpers/watcher.mjs`
- `cli/templates/scripts/restart-watcher.sh`
- `cli/templates/scripts/autonomous-notify.sh`

**Work:** literal substring replacement of `## Context`'s table tokens only.

- [ ] `autonomous-watcher.sh`: `HARNESS_AGENT_CLI`, `HARNESS_MAIN_REPO`, `HARNESS_CLI_VERSION`, `HARNESS_PUSH_CMD`, `HARNESS_GH_CLI`, `HARNESS_PUSH_URL` and `HARNESS_GIT_TOKEN` become their `DEVSCENE_` forms everywhere, comments included. That includes the `SESSION_ENV_STRIP_EXTRA` names and the export, which must read exactly `export DEVSCENE_MAIN_REPO="$MAIN_REPO"`.
- [ ] `cli/test/helpers/watcher.mjs`: the agent stub's variable becomes `DEVSCENE_AGENT_CLI`.
- [ ] `restart-watcher.sh`: `HARNESS_CLI` and `HARNESS_AGENT_CLI` become their `DEVSCENE_` forms, including the three error lines that tell the adopter to set `DEVSCENE_CLI`.
- [ ] `autonomous-notify.sh`: `HARNESS_PUSH_URL`, `HARNESS_PUSH_CMD` and `HARNESS_PUSH_TITLE` become their `DEVSCENE_` forms, including the header contract, the `REPRO` block and the stderr lines. `HARNESS_REPO_SLUG` stays.

**Verification:**

- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- cli/templates/scripts/autonomous-watcher.sh cli/templates/scripts/restart-watcher.sh cli/templates/scripts/autonomous-notify.sh cli/test/helpers/watcher.mjs` prints nothing.
- `git grep -c 'HARNESS_REPO_SLUG' -- cli/templates/scripts/autonomous-watcher.sh` is non-zero: a kept name survived.
- `bash -n` on each of the three scripts exits zero.
