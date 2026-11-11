### Task 5 — Rename the variables in the remaining script templates

**Goal:** The rest of `cli/templates/scripts/` uses the `DEVSCENE_` names. That covers the run library's token source, the push wrapper's credential scan, the three adopter overrides (`DEVSCENE_FETCH_TIMEOUT`, `DEVSCENE_VERSION_MANAGER_INIT`, `DEVSCENE_DEV_SERVER_PORT`), and the comments that cite the main-checkout anchor.

**Depends on:** Task 2, which set `GIT_TOKEN_SECRET = 'DEVSCENE_GIT_TOKEN'` (`githubActions.ts`'s header declares `harness-run-lib.sh`'s `hr_credential_values_var` as its mirror) and `MAIN_REPO_ANCHOR_VARIABLE = 'DEVSCENE_MAIN_REPO'`. Also Task 3, which renamed the watcher's anchor export, so the `watcher-main-anchor` guard this change selects passes.

**Where this task stops.** The suites are `credential-scan-lib`, `push-branch-credential-scan`, `outer-loop-scripts` and `task-offer-fence` (Task 13), and `init.test.mjs`'s dev-server port case (Task 8). The self-adopted copies are Task 16's. `examples/notes-app/scripts/start-dev-server.sh` and `tools/dev-server.mjs` are Task 26's. In these files the anchor appears only in comments; the guard requires that.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh`
- `cli/templates/scripts/push-branch.sh`
- `cli/templates/scripts/cleanup-merged-worktrees.sh`, `cli/templates/scripts/setup-worktree.sh`, `cli/templates/scripts/start-dev-server.sh`
- `cli/templates/scripts/launch-sandboxed-gates.sh`, `cli/templates/scripts/run-analytics.sh`, `cli/templates/scripts/task-offer-check.sh`

**Work:** literal substring replacement of `## Context`'s table tokens only.

- [ ] `lib/harness-run-lib.sh`: `HARNESS_GIT_TOKEN` (7) and `HARNESS_MAIN_REPO` (1). `HARNESS_PR_TOKEN`, `HARNESS_INPUT_CHAIN` and `HARNESS_GITHUB_DEFAULT_COMMIT` stay.
- [ ] `push-branch.sh`: `HARNESS_GIT_TOKEN`. `HARNESS_PR_TOKEN` stays.
- [ ] The adopter overrides: `HARNESS_FETCH_TIMEOUT` in `cleanup-merged-worktrees.sh`, `HARNESS_VERSION_MANAGER_INIT` in `setup-worktree.sh`, and `HARNESS_DEV_SERVER_PORT` in `start-dev-server.sh`. Change both the header text and the read. `HARNESS_REPO_SLUG` in `cleanup-merged-worktrees.sh` stays.
- [ ] The anchor comments: `HARNESS_MAIN_REPO` in `launch-sandboxed-gates.sh`, `run-analytics.sh` and `task-offer-check.sh`.

**Verification:**

- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- cli/templates/scripts` prints nothing. Tasks 3 and 4 already cleared the other three scripts.
- `bash -n` on each edited script exits zero.
  - **Deviations from plan:** The per-file `bash -n <script>` runs were refused by the permission layer (`Permission to use Bash has been denied because Claude Code is running in don't ask mode`), so this claim was not executed as written. The evidence it rests on is the whole-tree `bash scripts/typecheck.sh` run: its `check-shell-parse` step reported `124 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`, followed by `PASS: typecheck`. The edits replace only identifiers inside comments, a quoted label, and `${…}` / `export` names. The `git grep` verification above printed nothing.
