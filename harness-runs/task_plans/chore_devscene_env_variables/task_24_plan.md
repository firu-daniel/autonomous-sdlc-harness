### Task 24 — Rename the variables in `docs/outer-loop-verification.md` and `docs/sandbox-verification.md`

**Goal:** The two verification records name the restart override `DEVSCENE_CLI`, the agent and `gh` stubs, the notification recorder's `DEVSCENE_PUSH_CMD` and `DEVSCENE_PUSH_TITLE`, the fetch bound `DEVSCENE_FETCH_TIMEOUT`, and the anchor `DEVSCENE_MAIN_REPO` in their rows and quoted commands.

**Depends on:** Task 3 (`restart-watcher.sh` reads `DEVSCENE_CLI`; the watcher reads `DEVSCENE_AGENT_CLI` and `DEVSCENE_GH_CLI` and exports `DEVSCENE_MAIN_REPO`; the notifier passes `DEVSCENE_PUSH_TITLE` to `DEVSCENE_PUSH_CMD`). Task 5 (`DEVSCENE_FETCH_TIMEOUT`). Task 17 (the sandbox probe's `DEVSCENE_MAIN_REPO=` launch line).

**Rules for every document task (Tasks 19–25).** Replace only `## Context`'s table tokens. Add no sentence naming an old name or saying a name changed. Dated records are respelled silently. A command a reader runs stays in its fenced block. Kept names (`## Context`, *Names kept*) do not change. In `docs/sandbox-verification.md` that means `HARNESS_PR_TOKEN` in the S4 rows, `HARNESS_SELF_ADOPT`, `HARNESS_GITHUB_DEFAULT_COMMIT` and `HARNESS_DEFAULT_BRANCH_COMMIT`.

### Targets

- `docs/outer-loop-verification.md`
- `docs/sandbox-verification.md`

**Work:**

- [ ] `outer-loop-verification.md`: `HARNESS_CLI` (12), `HARNESS_AGENT_CLI` and `HARNESS_PUSH_CMD` (2 each), and `HARNESS_FETCH_TIMEOUT`, `HARNESS_PUSH_TITLE`, `HARNESS_PUSH_URL` and `HARNESS_GH_CLI` (1 each).
- [ ] `sandbox-verification.md`: `HARNESS_MAIN_REPO` (14), `HARNESS_PUSH_CMD` and `HARNESS_RUNNER` (1 each).

**Verification:**

- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- docs/outer-loop-verification.md docs/sandbox-verification.md` prints nothing.
- `git grep -c 'HARNESS_PR_TOKEN' -- docs/sandbox-verification.md` is non-zero: the kept name survived.
