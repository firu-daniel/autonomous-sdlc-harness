### Task 19 — Rename the variables in `README.md` and `ARCHITECTURE.md`

**Goal:** The root documents name the allow-list variable `DEVSCENE_RUN_ACTORS` and the engine seam `${DEVSCENE_AGENT_CLI:-claude}`, and they cite the anchor as `DEVSCENE_MAIN_REPO`.

**Depends on:** Task 2 (`RUN_ACTORS_VARIABLE = 'DEVSCENE_RUN_ACTORS'`, `MAIN_REPO_ANCHOR_VARIABLE = 'DEVSCENE_MAIN_REPO'`) and Task 3 (the watcher's `${DEVSCENE_AGENT_CLI:-claude}`), which these documents describe.

**Rules for every document task (Tasks 19–25).** Replace only `## Context`'s table tokens. Add no sentence naming an old name or saying a name changed. Dated records are respelled silently. A command a reader runs stays in its fenced block. Kept names (`## Context`, *Names kept*) do not change.

### Targets

- `README.md`
- `ARCHITECTURE.md`

**Work:**

- [ ] `README.md`: `HARNESS_RUN_ACTORS` (1).
- [ ] `ARCHITECTURE.md`: `HARNESS_AGENT_CLI` (8, including the `grep -rnE 'HARNESS_AGENT_CLI|…'` command in §5, which becomes `DEVSCENE_AGENT_CLI`) and `HARNESS_MAIN_REPO` (4).

**Verification:**

- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- README.md ARCHITECTURE.md` prints nothing.
- Running `ARCHITECTURE.md`'s respelled §5 grep from the checkout root lists the three shipped scripts' `DEVSCENE_AGENT_CLI` reads, as the section says it does.
