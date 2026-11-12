### Task 21 — Rename the variables in `docs/development.md`

**Goal:** The contributor guide names the adopter-facing variables by their `DEVSCENE_` names everywhere: in the gate descriptions, the Gate 12 rounds and the roadmap rows. Its own contributor switches keep their names.

**Depends on:** Tasks 2–6 and 16–17, the producers whose names this document records: `DEVSCENE_CLI`, `DEVSCENE_PUSH_URL`, `DEVSCENE_SELF_PAUSE_AFTER_MINUTES`, `DEVSCENE_CLI_VERSION`, `DEVSCENE_GIT_TOKEN`, `DEVSCENE_RUN_ACTORS`, `DEVSCENE_RUNNER`, `DEVSCENE_TRIGGER_ALLOWED_BOTS`, `DEVSCENE_MAIN_REPO` and `DEVSCENE_AGENT_CLI`.

**Rules for every document task (Tasks 19–25).** Replace only `## Context`'s table tokens. Add no sentence naming an old name or saying a name changed. Dated records are respelled silently. A command a reader runs stays in its fenced block. Kept names (`## Context`, *Names kept*) do not change. In this file that means `HARNESS_SELF_ADOPT`, `HARNESS_EVAL_CORPUS_ROOT`, `HARNESS_GATES_CONTAINERS`, `HARNESS_TEST_CONCURRENCY`, `HARNESS_TEST_TIME_SCALE`, `HARNESS_JOB_USAGE_REPEAT`, `HARNESS_PR_TOKEN`, `HARNESS_GITHUB_DEFAULT_BRANCH`, `HARNESS_GITHUB_DEFAULT_COMMIT`, `HARNESS_DEFAULT_BRANCH_COMMIT` and the excluded retrieval names.

### Targets

- `docs/development.md`

**Work:**

- [ ] Replace `HARNESS_RUN_ACTORS` (34) and `HARNESS_GIT_TOKEN` (13).
- [ ] Replace `HARNESS_PUSH_URL` (12), `HARNESS_SELF_PAUSE_AFTER_MINUTES` (6) and `HARNESS_CLI_VERSION` (4).
- [ ] Replace `HARNESS_CLI` (3), `HARNESS_RUNNER` (2), `HARNESS_TRIGGER_ALLOWED_BOTS`, `HARNESS_MAIN_REPO` and `HARNESS_AGENT_CLI` (1 each).

**Verification:**

- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- docs/development.md` prints nothing.
- `git grep -cE 'HARNESS_(SELF_ADOPT|EVAL_CORPUS_ROOT|GATES_CONTAINERS)' -- docs/development.md` is non-zero: kept names survived.
- `git diff -U0 -- docs/development.md` shows only lines whose sole change is a table token.
