### Task 16 — Bring the self-adopted script copies to the renamed template bytes

**Goal:** This repository's own outer-loop scripts agree with the templates again, so its self-adoption reads the same `DEVSCENE_` names an adopter's does.

**Depends on:** Tasks 3, 4 and 5, which renamed the templates these files copy: `cli/templates/scripts/{autonomous-notify.sh, autonomous-watcher.sh, cleanup-merged-worktrees.sh, launch-sandboxed-gates.sh, lib/harness-run-lib.sh, push-branch.sh, remote-run.sh, restart-watcher.sh, run-analytics.sh, setup-worktree.sh, task-offer-check.sh}`.

**The copies are byte copies.** At this branch's base, each file below had the same blob id as its template (`git ls-files -s`). They differ in mode only: the copies are `100755` and the templates `100644`, except `scripts/lib/harness-run-lib.sh`, which is `100644` like its template. Replace each copy's **content** with its template's and keep each copy's **mode**. Do not edit them by hand, and do not use a copy that changes the mode. This run's own wrappers are invoked from the main checkout, not from this branch's `scripts/`, so replacing these files does not affect the running loop.

### Targets

- `scripts/autonomous-notify.sh`, `scripts/autonomous-watcher.sh`, `scripts/remote-run.sh`, `scripts/restart-watcher.sh`
- `scripts/lib/harness-run-lib.sh`, `scripts/push-branch.sh`, `scripts/cleanup-merged-worktrees.sh`, `scripts/launch-sandboxed-gates.sh`, `scripts/run-analytics.sh`, `scripts/setup-worktree.sh`, `scripts/task-offer-check.sh`

**Work:**

- [ ] Overwrite the four large scripts (`autonomous-notify.sh`, `autonomous-watcher.sh`, `remote-run.sh`, `restart-watcher.sh`) with their templates' content.
- [ ] Overwrite the seven others with their templates' content.

**Verification:**

- For each pair, `git hash-object scripts/<path> cli/templates/scripts/<path>` prints two equal ids.
- `git diff --summary -- scripts` reports no `mode change`.
- `git grep -nE 'HARNESS_(RUN_ACTORS|TRIGGER_LABEL|TRIGGER_ALLOWED_BOTS|RUNNER|REMOTE_STOP|MAX_CHAIN|POLL_MAX_DISPATCH_FAILURES|POLL_GIVE_UP_AFTER_MINUTES|STEP_TIMEOUT_MINUTES|SELF_PAUSE_AFTER_MINUTES|GIT_TOKEN|PUSH_|QA_|CLI|AGENT_CLI|GH_CLI|MAIN_REPO|DEV_SERVER_PORT|FETCH_TIMEOUT|VERSION_MANAGER_INIT)' -- scripts` lists only Task 17's files: `scripts/lib/sandbox-probe/*`, `scripts/sandbox-absent-path-check.sh` and `scripts/sandbox-probe-runner.yml`.
