### Task 13 — Rename the variables in the remaining cli-only suites and the timing helper

**Goal:** The remaining suites that read only `cli/` producers assert the `DEVSCENE_` names. They cover the credential scan's token source, the push destination, the cleanup sweep's fetch bound and the task-offer fence's anchor case. The headers that cite the anchor follow too.

**Depends on:** Task 2 (`PUSH_URL_KEY = 'DEVSCENE_PUSH_URL'`, `MAIN_REPO_ANCHOR_VARIABLE = 'DEVSCENE_MAIN_REPO'`). Task 5 (`harness-run-lib.sh` and `push-branch.sh` read `DEVSCENE_GIT_TOKEN`; `cleanup-merged-worktrees.sh` reads `DEVSCENE_FETCH_TIMEOUT`; `task-offer-check.sh` cites `DEVSCENE_MAIN_REPO`). Also Task 3 (the watcher's anchor export, which `test-time-scale.test.mjs`'s header cites).

**Where this task stops.** `main-anchor-isolation.test.mjs` is the tree guard over `cli/test/**/*.mjs`. It reads the anchor through `MAIN_REPO_ANCHOR_VARIABLE`; only its header comment spells the literal. `HARNESS_TEST_TIME_SCALE` (in `helpers/timing.mjs` and `test-time-scale.test.mjs`) is a kept suite switch.

### Targets

- `cli/test/credential-scan-lib.test.mjs`, `cli/test/push-branch-credential-scan.test.mjs`
- `cli/test/push-destination.test.mjs`
- `cli/test/outer-loop-scripts.test.mjs`, `cli/test/helpers/timing.mjs`
- `cli/test/task-offer-fence.test.mjs`, `cli/test/test-time-scale.test.mjs`, `cli/test/main-anchor-isolation.test.mjs`

**Work:** literal substring replacement of `## Context`'s table tokens only.

- [ ] `credential-scan-lib.test.mjs` and `push-branch-credential-scan.test.mjs`: `HARNESS_GIT_TOKEN`. `HARNESS_PR_TOKEN` stays.
- [ ] `push-destination.test.mjs`: `HARNESS_PUSH_URL`.
- [ ] `outer-loop-scripts.test.mjs` and `helpers/timing.mjs`: `HARNESS_FETCH_TIMEOUT`.
- [ ] `task-offer-fence.test.mjs`, `test-time-scale.test.mjs` and `main-anchor-isolation.test.mjs`: `HARNESS_MAIN_REPO`. In `main-anchor-isolation.test.mjs` that is the header comment only.

**Verification:**

- This task's own test files pass, each run as `npm test --workspace cli -- test/<file>`: `credential-scan-lib.test.mjs`, `push-branch-credential-scan.test.mjs`, `push-destination.test.mjs`, `outer-loop-scripts.test.mjs`, `task-offer-fence.test.mjs`, `test-time-scale.test.mjs` and `main-anchor-isolation.test.mjs`.
- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- cli/test ':!cli/test/qa-user-locks.test.mjs' ':!cli/test/main-root-fallback.test.mjs' ':!cli/test/sandbox-probe-git-and-legs.test.mjs'` prints nothing. Those three are Task 18's.
- **Deviations from plan:** Evidence downgrade: `outer-loop-scripts.test.mjs` case "the sweep releases its output pipe on a bounded fetch when a terminal is attached" (the second `DEVSCENE_FETCH_TIMEOUT` site) self-skipped because the run's sandbox refused a pseudo-terminal (`script: openpty: Operation not permitted`). That site's rename therefore rests on the passing sibling sweep case, which sets the same variable the same way, and on the empty `git grep` probe. The file ran 76 pass, 0 fail, 3 skipped.
