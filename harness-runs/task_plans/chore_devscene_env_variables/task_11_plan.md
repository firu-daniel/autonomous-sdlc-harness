### Task 11 — Rename the variables in the `remote-run` suite and the smaller remote suites

**Goal:** The `remote-run.sh` subcommand cases set the `DEVSCENE_GH_CLI` stub and the `DEVSCENE_` variables. The poller cases read `DEVSCENE_MAX_CHAIN` and `DEVSCENE_POLL_*`, the deliver cases read `DEVSCENE_GIT_TOKEN`, and the notification recorder reads `DEVSCENE_PUSH_CMD`, `DEVSCENE_PUSH_TITLE` and `DEVSCENE_PUSH_URL`.

**Depends on:** Task 3, whose notifier hands the title over as `DEVSCENE_PUSH_TITLE` and reads `DEVSCENE_PUSH_CMD` and `DEVSCENE_PUSH_URL`. Task 4, whose `remote-run.sh` reads `${DEVSCENE_GH_CLI:-gh}`, `DEVSCENE_REMOTE_STOP`, `DEVSCENE_MAX_CHAIN`, `DEVSCENE_POLL_MAX_DISPATCH_FAILURES`, `DEVSCENE_POLL_GIVE_UP_AFTER_MINUTES`, `DEVSCENE_GIT_TOKEN` and `DEVSCENE_TRIGGER_LABEL`.

**A seam renamed on one side only launches the real binary.** Every `HARNESS_GH_CLI` stub assignment becomes `DEVSCENE_GH_CLI`. `HARNESS_INPUT_*`, `HARNESS_PR_TOKEN`, `HARNESS_REMOTE_SLUG`, `HARNESS_GITHUB_DEFAULT_COMMIT` and `HARNESS_TRIGGER_LOOKUP_SECS` are kept.

### Targets

- `cli/test/remote-run.test.mjs`
- `cli/test/remote-deliver.test.mjs`, `cli/test/remote-deliver-threads.test.mjs`, `cli/test/remote-open.test.mjs`
- `cli/test/remote-progress.test.mjs`, `cli/test/remote-report.test.mjs`, `cli/test/remote-review-payloads.test.mjs`, `cli/test/remote-save-links.test.mjs`, `cli/test/remote-start.test.mjs`
- `cli/test/prompt-injection-remote-route.test.mjs`, `cli/test/registry-writer.test.mjs`

**Work:** literal substring replacement of `## Context`'s table tokens only.

- [ ] `remote-run.test.mjs`: `HARNESS_GH_CLI`, `HARNESS_REMOTE_STOP`, `HARNESS_PUSH_CMD`, `HARNESS_MAX_CHAIN`, `HARNESS_PUSH_TITLE`, `HARNESS_PUSH_URL`, `HARNESS_POLL_MAX_DISPATCH_FAILURES` and `HARNESS_POLL_GIVE_UP_AFTER_MINUTES`.
- [ ] `remote-deliver.test.mjs` (`HARNESS_GH_CLI`, `HARNESS_GIT_TOKEN`), `remote-deliver-threads.test.mjs` and `remote-open.test.mjs` (`HARNESS_GH_CLI`).
- [ ] `remote-progress`, `remote-report` (`HARNESS_GH_CLI`, `HARNESS_TRIGGER_LABEL`), `remote-review-payloads`, `remote-save-links` and `remote-start`: `HARNESS_GH_CLI`.
- [ ] `prompt-injection-remote-route.test.mjs` (`HARNESS_GH_CLI`, `HARNESS_TRIGGER_LABEL`) and `registry-writer.test.mjs` (`HARNESS_GH_CLI`).

**Verification:**

- This task's own test files pass, each run as `npm test --workspace cli -- test/<file>`: the eleven files above.
- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- cli/test/remote-run.test.mjs cli/test/remote-deliver.test.mjs cli/test/remote-deliver-threads.test.mjs cli/test/remote-open.test.mjs cli/test/remote-progress.test.mjs cli/test/remote-report.test.mjs cli/test/remote-review-payloads.test.mjs cli/test/remote-save-links.test.mjs cli/test/remote-start.test.mjs cli/test/prompt-injection-remote-route.test.mjs cli/test/registry-writer.test.mjs` prints nothing.
