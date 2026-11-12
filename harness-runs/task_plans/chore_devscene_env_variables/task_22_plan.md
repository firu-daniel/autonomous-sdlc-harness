### Task 22 — Rename the variables in `docs/remote-execution.md`

**Goal:** The remote-execution guide, which is where an adopter learns which repository variables and secrets to set, names every one by its `DEVSCENE_` name. Its `gh variable set` and `gh secret set` commands carry the new names.

**Depends on:** Task 2 (the constants `init` and `doctor` print). Task 4 (`remote-run.sh` reads `DEVSCENE_MAX_CHAIN` and `DEVSCENE_POLL_*`). Task 6 (the workflow templates read `vars.DEVSCENE_RUNNER`, `DEVSCENE_REMOTE_STOP`, `DEVSCENE_RUN_ACTORS`, `DEVSCENE_MAX_CHAIN`, `DEVSCENE_POLL_MAX_DISPATCH_FAILURES`, `DEVSCENE_POLL_GIVE_UP_AFTER_MINUTES`, `DEVSCENE_STEP_TIMEOUT_MINUTES` and `DEVSCENE_SELF_PAUSE_AFTER_MINUTES`, and `secrets.DEVSCENE_GIT_TOKEN` and `DEVSCENE_PUSH_URL`, and pin `DEVSCENE_CLI_VERSION`).

**Rules for every document task (Tasks 19–25).** Replace only `## Context`'s table tokens. Add no sentence naming an old name or saying a name changed. Dated records are respelled silently. A command a reader runs stays in its fenced block. Kept names (`## Context`, *Names kept*) do not change. In this file that means `HARNESS_JOB_MODE`, `HARNESS_JOB_STARTED_EPOCH`, `HARNESS_GITHUB_DEFAULT_COMMIT` and `HARNESS_DEFAULT_BRANCH_COMMIT`. The `STALL_*`, `USAGE_*`, `REMOTE_*` and `PARK_LOOP_*` variables have no `HARNESS_` prefix and keep their names.

### Targets

- `docs/remote-execution.md`

**Work:**

- [ ] Replace `HARNESS_GIT_TOKEN` (18), `HARNESS_RUN_ACTORS` (12), `HARNESS_RUNNER` (9) and `HARNESS_PUSH_URL` (6).
- [ ] Replace `HARNESS_REMOTE_STOP`, `HARNESS_SELF_PAUSE_AFTER_MINUTES` (4 each), `HARNESS_STEP_TIMEOUT_MINUTES` and `HARNESS_POLL_MAX_DISPATCH_FAILURES` (3 each).
- [ ] Replace `HARNESS_MAX_CHAIN`, `HARNESS_POLL_GIVE_UP_AFTER_MINUTES` and `HARNESS_CLI_VERSION` (2 each), and `HARNESS_TRIGGER_LABEL` and `HARNESS_TRIGGER_ALLOWED_BOTS` (1 each).

**Verification:**

- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- docs/remote-execution.md` prints nothing.
- Every `vars.DEVSCENE_*` and `secrets.DEVSCENE_*` name the document lists appears in a `cli/templates/github/workflows/` template: `git grep -ohE '(vars|secrets)\.DEVSCENE_[A-Z_]+' -- docs/remote-execution.md` ⊆ `git grep -ohE '(vars|secrets)\.DEVSCENE_[A-Z_]+' -- cli/templates/github/workflows`.
