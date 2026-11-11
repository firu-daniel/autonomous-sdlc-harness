### Task 20 — Rename the variables in `docs/cli.md`, `docs/watcher.md` and `docs/guard-verification.md`

**Goal:** The adopter's reference for the CLI and the watcher names every variable an adopter sets or reads by its `DEVSCENE_` name. That includes the `gh variable set` and `gh secret set` lines, the `DEVSCENE_CLI_VERSION` pin, the dev-server port, the profile rule `Bash(printenv DEVSCENE_MAIN_REPO)`, and the by-hand `DEVSCENE_MAIN_REPO=… claude` launch.

**Depends on:** Task 2 (all `githubActions.ts` constants, `PUSH_URL_KEY`, `MAIN_REPO_ANCHOR_RULE` = `Bash(printenv DEVSCENE_MAIN_REPO)`). Tasks 3–6 (the templates). Task 14 (`hc_main_root` reads `DEVSCENE_MAIN_REPO`).

**Rules for every document task (Tasks 19–25).** Replace only `## Context`'s table tokens. Add no sentence naming an old name or saying a name changed. Dated records are respelled silently. A command a reader runs stays in its fenced block. Kept names (`## Context`, *Names kept*) do not change: `HARNESS_SELF_ADOPT`, `HARNESS_GITHUB_DEFAULT_COMMIT` and the excluded `HARNESS_DOCS_RETRIEVAL_*` and `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_*` stay in `docs/cli.md`.

### Targets

- `docs/cli.md`
- `docs/watcher.md`
- `docs/guard-verification.md`

**Work:**

- [ ] `docs/cli.md`: `HARNESS_CLI_VERSION`, `HARNESS_PUSH_URL`, `HARNESS_TRIGGER_LABEL`, `HARNESS_GIT_TOKEN`, `HARNESS_DEV_SERVER_PORT`, `HARNESS_MAIN_REPO`, `HARNESS_AGENT_CLI`, `HARNESS_RUN_ACTORS`, `HARNESS_REMOTE_STOP`, `HARNESS_RUNNER` and `HARNESS_TRIGGER_ALLOWED_BOTS`.
- [ ] `docs/watcher.md`: `HARNESS_MAIN_REPO` (including the fenced by-hand launch line), `HARNESS_PUSH_URL`, `HARNESS_GIT_TOKEN` and `HARNESS_REMOTE_STOP`.
- [ ] `docs/guard-verification.md`: `HARNESS_MAIN_REPO` (1).

**Verification:**

- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- docs/cli.md docs/watcher.md docs/guard-verification.md` prints nothing.
- The `Bash(printenv DEVSCENE_MAIN_REPO)` rule `docs/cli.md` quotes equals `MAIN_REPO_ANCHOR_RULE` in `cli/src/core/mainRepoAnchor.ts`.
