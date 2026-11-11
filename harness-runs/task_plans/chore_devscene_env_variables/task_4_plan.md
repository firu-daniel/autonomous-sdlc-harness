### Task 4 — Rename the variables in the `remote-run.sh` template

**Goal:** `remote-run.sh` reads and names `DEVSCENE_RUN_ACTORS`, `DEVSCENE_REMOTE_STOP`, `DEVSCENE_TRIGGER_LABEL`, `DEVSCENE_TRIGGER_ALLOWED_BOTS`, `DEVSCENE_GIT_TOKEN`, `DEVSCENE_CLI_VERSION`, `DEVSCENE_AGENT_CLI`, `DEVSCENE_MAX_CHAIN`, `DEVSCENE_POLL_MAX_DISPATCH_FAILURES`, `DEVSCENE_POLL_GIVE_UP_AFTER_MINUTES`, `DEVSCENE_GH_CLI`, `DEVSCENE_PUSH_CMD` and `DEVSCENE_MAIN_REPO`. Its notifications tell the adopter which `DEVSCENE_` repository variable to clear or fix.

**Depends on:** Task 2, whose `githubActions.ts` constants this script mirrors byte for byte (`RUN_ACTORS_VARIABLE = 'DEVSCENE_RUN_ACTORS'`, `REMOTE_STOP_VARIABLE = 'DEVSCENE_REMOTE_STOP'`, `TRIGGER_LABEL_VARIABLE = 'DEVSCENE_TRIGGER_LABEL'`, `TRIGGER_ALLOWED_BOTS_VARIABLE = 'DEVSCENE_TRIGGER_ALLOWED_BOTS'`, `GIT_TOKEN_SECRET = 'DEVSCENE_GIT_TOKEN'`, `GH_CLI_VARIABLE = 'DEVSCENE_GH_CLI'`, `CLI_VERSION_VARIABLE = 'DEVSCENE_CLI_VERSION'`). Also Task 3, which renamed the watcher this script is dispatched from. Task 3 is also what keeps the `watcher-main-anchor` tree guard, which this change selects, passing.

**Where this task stops.** The workflow templates that set these variables for this script are Task 6's. `cli/test/remote-names.test.mjs` (Task 8) holds the two sides together. The kept names in this file stay unchanged: `HARNESS_INPUT_*`, `HARNESS_REMOTE_SLUG`, `HARNESS_REPO_SLUG`, `HARNESS_PR_TOKEN`, `HARNESS_GITHUB_DEFAULT_COMMIT`, `HARNESS_TRIGGER_LOOKUP_SECS` and `HARNESS_MENTION_PLUGIN_DIR`.

### Targets

- `cli/templates/scripts/remote-run.sh`

**Work:** literal substring replacement of `## Context`'s table tokens only. Comments, `REPRO` blocks, usage text and notification text are all included.

- [ ] Repository-variable names: `HARNESS_RUN_ACTORS`, `HARNESS_REMOTE_STOP`, `HARNESS_TRIGGER_LABEL`, `HARNESS_TRIGGER_ALLOWED_BOTS`, `HARNESS_MAX_CHAIN`, `HARNESS_POLL_MAX_DISPATCH_FAILURES`, `HARNESS_POLL_GIVE_UP_AFTER_MINUTES`. This includes the backquoted names in the `notify paused` and `notify failed` texts (*"the repository variable \`HARNESS_REMOTE_STOP\` is set"*, *"\`HARNESS_MAX_CHAIN\`"*).
- [ ] Secret and token names: `HARNESS_GIT_TOKEN`, including the `deliver` `::warning::` line.
- [ ] Seams, pin and anchor: `HARNESS_GH_CLI`, `HARNESS_AGENT_CLI`, `HARNESS_CLI_VERSION`, `HARNESS_PUSH_CMD`, `HARNESS_MAIN_REPO`.

**Verification:**

- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- cli/templates/scripts/remote-run.sh` prints nothing.
- `git grep -cE 'HARNESS_(INPUT_ANSWERS|REMOTE_SLUG|PR_TOKEN|TRIGGER_LOOKUP_SECS|MENTION_PLUGIN_DIR)' -- cli/templates/scripts/remote-run.sh` is non-zero: kept names survived.
- `bash -n cli/templates/scripts/remote-run.sh` exits zero.
  - **Deviations from plan:** The free-standing `bash -n cli/templates/scripts/remote-run.sh` was refused by the permission layer ("Permission to use Bash has been denied because Claude Code is running in don't ask mode"), and so was a `perl -pi` substitution; the rename was applied instead as one `Edit` with `replace_all` per spelling-table token (the 13 tokens in **Goal**). The parse claim rests on `bash scripts/typecheck.sh`, whose `scripts/check-shell-parse.sh` runs `/bin/bash -n` over every `*.sh` that `git ls-files --cached --others --exclude-standard` lists (which includes this file), and reported `124 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`, followed by `PASS: typecheck`.
