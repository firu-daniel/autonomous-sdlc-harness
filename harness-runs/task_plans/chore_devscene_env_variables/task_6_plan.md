### Task 6 — Rename the variables in the four workflow templates and the two `.env.example` templates

**Goal:** A newly rendered workflow reads `vars.DEVSCENE_*` and `secrets.DEVSCENE_*` and pins `DEVSCENE_CLI_VERSION`. The two credential examples `init` writes carry `DEVSCENE_PUSH_*` and `DEVSCENE_QA_<n>_*` keys.

**Depends on:** Task 2, which set the constants these templates mirror: `RUNNER_VARIABLE`, `REMOTE_STOP_VARIABLE`, `TRIGGER_LABEL_VARIABLE`, `TRIGGER_ALLOWED_BOTS_VARIABLE`, `RUN_ACTORS_VARIABLE`, `PUSH_URL_SECRET`, `GIT_TOKEN_SECRET`, `CLI_VERSION_VARIABLE` (= `DEVSCENE_RUNNER`, `DEVSCENE_REMOTE_STOP`, `DEVSCENE_TRIGGER_LABEL`, `DEVSCENE_TRIGGER_ALLOWED_BOTS`, `DEVSCENE_RUN_ACTORS`, `DEVSCENE_PUSH_URL`, `DEVSCENE_GIT_TOKEN`, `DEVSCENE_CLI_VERSION`), plus `PUSH_URL_KEY` and `PUSH_CMD_KEY`. Also Task 4, whose `remote-run.sh` reads `DEVSCENE_MAX_CHAIN`, `DEVSCENE_POLL_MAX_DISPATCH_FAILURES` and `DEVSCENE_POLL_GIVE_UP_AFTER_MINUTES` from the environment these workflows set.

**Where this task stops.** `cli/test/workflow-templates.test.mjs`, `workflow-plugin-pin.test.mjs` and `trigger-workflow-init.test.mjs` (Task 8) assert the templates against the constants. The kept job plumbing stays byte-identical: `HARNESS_STOPPED`, `HARNESS_INPUT_*`, `HARNESS_JOB_*`, `HARNESS_REMOTE_SLUG`, `HARNESS_REPO_SLUG`, `HARNESS_PR_TOKEN` (its value becomes `${{ secrets.DEVSCENE_GIT_TOKEN }}`), `HARNESS_GITHUB_DEFAULT_BRANCH`, `HARNESS_GITHUB_DEFAULT_COMMIT`, `HARNESS_DEFAULT_BRANCH_COMMIT`, `HARNESS_MENTION_PLUGIN_DIR`, `HARNESS_HOSTED_JOB_LIMIT_MINUTES`, `HARNESS_SELF_HOSTED_JOB_LIMIT_MINUTES`, `HARNESS_STEP_ALLOWANCE_MINUTES` and `HARNESS_SELF_PAUSE_MARGIN_MINUTES`. The excluded `HARNESS_RETRIEVAL_CACHE` and the `harness-retrieval-` cache-key prefix stay as well.

### Targets

- `cli/templates/github/workflows/devscene-run.yml`
- `cli/templates/github/workflows/devscene-resume.yml`
- `cli/templates/github/workflows/devscene-trigger.yml`
- `cli/templates/github/workflows/devscene-control.yml`
- `cli/templates/claude/push-notify.env.example`, `cli/templates/claude/qa-accounts.env.example`

**Work:** literal substring replacement of `## Context`'s table tokens only. Comments, `::error::` and `::warning::` text and `run:` bodies are included.

- [ ] `devscene-run.yml`: `HARNESS_RUNNER`, `HARNESS_CLI_VERSION` (the job `env:` pins, the cache key and every `$HARNESS_CLI_VERSION`), `HARNESS_PUSH_URL`, `HARNESS_GIT_TOKEN`, `HARNESS_RUN_ACTORS`, `HARNESS_TRIGGER_ALLOWED_BOTS`, `HARNESS_REMOTE_STOP` and `HARNESS_MAX_CHAIN`. Also `HARNESS_STEP_TIMEOUT_MINUTES` and `HARNESS_SELF_PAUSE_AFTER_MINUTES`: the `vars.` reads, the `$GITHUB_ENV` writes, the `env.` reads in `timeout-minutes` and the `::error::` lines alike. They are set by adopters and passed internally, so they are renamed throughout.
- [ ] `devscene-resume.yml`: `HARNESS_RUNNER`, `HARNESS_REMOTE_STOP`, `HARNESS_MAX_CHAIN`, `HARNESS_POLL_MAX_DISPATCH_FAILURES`, `HARNESS_POLL_GIVE_UP_AFTER_MINUTES` and `HARNESS_PUSH_URL`.
- [ ] `devscene-trigger.yml`: `HARNESS_TRIGGER_LABEL`, `HARNESS_RUNNER`, `HARNESS_REMOTE_STOP`, `HARNESS_TRIGGER_ALLOWED_BOTS`, `HARNESS_RUN_ACTORS` and `HARNESS_GIT_TOKEN`.
- [ ] `devscene-control.yml`: `HARNESS_RUNNER`, `HARNESS_REMOTE_STOP`, `HARNESS_TRIGGER_ALLOWED_BOTS`, `HARNESS_RUN_ACTORS` and `HARNESS_CLI_VERSION`. The pin-reading `awk` pattern and its `::warning::` change too; it must match the `DEVSCENE_CLI_VERSION:` line `devscene-run.yml` now carries.
- [ ] The two `.env.example` templates: respell every key and the prefix sentence (`HARNESS_PUSH_` → `DEVSCENE_PUSH_`, `HARNESS_QA_<n>_` → `DEVSCENE_QA_<n>_`). **Replace the paragraph that says the keys "were renamed to that prefix" and tells the reader to rename keys carried over.** In `push-notify.env.example` that is lines 10–13, and in `qa-accounts.env.example` lines 10–12. A sentence saying a name changed is forbidden (`## Context`, first paragraph). The replacement is exactly, in push-notify:
  ```
  # Key names are the harness's own and are prefixed `DEVSCENE_PUSH_`; the reader
  # recognises these spellings and no others.
  ```
  and in qa-accounts:
  ```
  # Key names are the harness's own and are prefixed `DEVSCENE_QA_<n>_`; the reader
  # recognises these spellings and no others.
  ```
  Task 26's paste record for the `.claude/` renders copies these lines, so keep them byte for byte.

**Verification:**

- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- cli/templates/github cli/templates/claude` prints nothing.
- `git grep -nE 'renamed|earlier runner' -- cli/templates/claude/push-notify.env.example cli/templates/claude/qa-accounts.env.example` prints nothing.
- `git grep -cE 'HARNESS_(STOPPED|STEP_ALLOWANCE_MINUTES|SELF_PAUSE_MARGIN_MINUTES|PR_TOKEN|GITHUB_DEFAULT_COMMIT)' -- cli/templates/github/workflows/devscene-run.yml` is non-zero: kept names survived.
