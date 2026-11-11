### Task 23 — Rename the variables in `docs/github-issue-trigger.md` and `docs/github-run-control.md`

**Goal:** The two GitHub-route guides name the allow-list, the trigger label, the bot list, the runner, the stop switch, the token secret, the pin and the agent stub by their `DEVSCENE_` names, including in their `gh variable set` and `gh secret set` commands.

**Depends on:** Task 2 (`RUN_ACTORS_VARIABLE`, `TRIGGER_LABEL_VARIABLE`, `TRIGGER_ALLOWED_BOTS_VARIABLE`, `RUNNER_VARIABLE`, `REMOTE_STOP_VARIABLE`, `GIT_TOKEN_SECRET`, `CLI_VERSION_VARIABLE`). Task 4 (`remote-run.sh`'s `${DEVSCENE_AGENT_CLI:-claude}` mention session). Task 6 (`devscene-trigger.yml`, `devscene-control.yml`).

**Rules for every document task (Tasks 19–25).** Replace only `## Context`'s table tokens. Add no sentence naming an old name or saying a name changed. Dated records are respelled silently. A command a reader runs stays in its fenced block. Kept names (`## Context`, *Names kept*) do not change. In `docs/github-run-control.md` that means `HARNESS_PR_TOKEN` and `HARNESS_MENTION_PLUGIN_DIR`.

### Targets

- `docs/github-issue-trigger.md`
- `docs/github-run-control.md`

**Work:**

- [ ] `github-issue-trigger.md`: `HARNESS_RUN_ACTORS` (10), `HARNESS_TRIGGER_ALLOWED_BOTS` (7), `HARNESS_TRIGGER_LABEL` (4), `HARNESS_RUNNER` (2), `HARNESS_GIT_TOKEN` and `HARNESS_REMOTE_STOP` (1 each).
- [ ] `github-run-control.md`: `HARNESS_GIT_TOKEN` (13), `HARNESS_RUN_ACTORS` (7), `HARNESS_TRIGGER_ALLOWED_BOTS` (3), `HARNESS_REMOTE_STOP` (2), `HARNESS_CLI_VERSION` and `HARNESS_AGENT_CLI` (1 each).

**Verification:**

- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- docs/github-issue-trigger.md docs/github-run-control.md` prints nothing.
- `git grep -cE 'HARNESS_(PR_TOKEN|MENTION_PLUGIN_DIR)' -- docs/github-run-control.md` is non-zero: kept names survived.
