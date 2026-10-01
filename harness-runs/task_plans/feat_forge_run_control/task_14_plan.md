### Task 14 — Give the run and resume workflows the report permissions and the `deliver` step

**Goal:** Wire the new verbs into the two workflows a remote run executes in.

- `harness-run.yml` opens the draft pull request and reports `completed` after the branch is pushed (`deliver`, Task 6), and reports a cancelled job.
- Both workflows gain the `issues` and `pull-requests` write permissions their comments, labels and pull request need. A workflow-level `permissions:` block sets every unlisted permission to `none` (research S1, quoting the syntax page), so without these grants every report would be refused.

This is the consumer that makes Tasks 6 and 8 reach GitHub end to end.

**Depends on:**

- Task 6's `remote-run.sh deliver <branch> <bundle_dir> [--repo <root>]`. It exits 0 on every path but a usage error. It creates the pull request with `HARNESS_PR_TOKEN` when that variable is non-empty, else with `GH_TOKEN`, and posts every comment with `GH_TOKEN`.
- Task 3's `remote-run.sh report <event> <branch> [--note <text>]`, which exits 0 always. On `failed` it posts nothing when the branch's newest `harness stop` run is newer than its newest `harness run`.
- Task 8's `continue` and `poll` notifications, which already call `forge_report` in-process and need only these permissions.

**Where this task stops.** The control workflow is Task 15's. Writing these templates into an adopter's repository is unchanged: `harness-run.yml` is re-rendered by `init --upgrade-workflows` at a new version, and `harness-resume.yml` with it (`docs/remote-execution.md` → `### Upgrading`). What an adopter must switch on for the pull request is Task 16's report and Task 18's `doctor` check.

### Targets

- `cli/templates/github/workflows/harness-run.yml` — `permissions:`, a new step, the cancelled-job step, and the header.
- `cli/templates/github/workflows/harness-resume.yml` — `permissions:` and the header.
- `cli/test/workflow-templates.test.mjs` — both templates' permission and step assertions.

**Work:**

- [ ] **`harness-run.yml` permissions**: `contents: write`, `actions: write`, `issues: write` and `pull-requests: write`. Add a header block, `THE PERMISSIONS`, stating why each is needed:
  - `contents` to push the branch;
  - `actions` to dispatch, poll and enable the poller;
  - `issues` to comment and set labels on the issue and the pull request, which both use the issues API;
  - `pull-requests` to open the draft pull request and label it.
- [ ] **The `deliver` step**, between *Upload the state bundle* and *Continue, wait or stop*:

  ```yaml
  - name: Open the pull request and report
    if: ${{ !cancelled() && env.SCRIPTS_DIR != '' }}
    continue-on-error: true
    env:
      HARNESS_PR_TOKEN: ${{ secrets.HARNESS_GIT_TOKEN }}
    run: bash "$SCRIPTS_DIR/remote-run.sh" deliver "$HARNESS_INPUT_BRANCH" "$RUNNER_TEMP/harness-state"
  ```

  It sits after the push so the pull request's head carries the run's last commit. `continue-on-error` is there because a repository that re-rendered this workflow without `init --force` still runs scripts with no `deliver` verb, and a finished run must not be marked failed for its report. The header says so. The secret reaches the shell only through `env:`, never a `run:` expression (`TWO RULES EVERY EDIT KEEPS`). The header's `WHAT IT READS` gains `HARNESS_GIT_TOKEN`'s second use: it also opens the pull request, so the adopter's CI runs on it without an approval click (research S3).
- [ ] **The cancelled-job step**: after its `autonomous-notify.sh failed …` line, add `bash "$SCRIPTS_DIR/remote-run.sh" report failed "$HARNESS_INPUT_BRANCH" --note "the job was cancelled: $GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID" || true`. A stop's cancellation posts nothing, because the stop already reported it (Task 3's check).
- [ ] **`harness-resume.yml` permissions**: `contents: read`, `actions: write`, `issues: write` and `pull-requests: write`, with a header line saying the last two serve `poll`'s reports, which comment on the waiting run's issue or pull request.
- [ ] **`workflow-templates.test.mjs`**:
  - the run workflow's permissions are exactly the four;
  - the poller's are exactly its four;
  - the run job's steps include *Open the pull request and report*, after *Upload the state bundle* and before *Continue, wait or stop*, with `continue-on-error: true` and `HARNESS_PR_TOKEN` drawn from `secrets.HARNESS_GIT_TOKEN`;
  - the cancelled-job step calls `remote-run.sh report failed`;
  - every expression is still spaced and none sits inside a `run:` block, using the file's existing helpers;
  - the header's contract paragraph names the new assertions.

**Verification:**

- `npm test -- test/workflow-templates.test.mjs` from `cli/` passes.
- `git grep -n "secrets\." -- cli/templates/github/workflows/harness-run.yml` has no hit on a `run:` line: secrets reach a shell only through `env:`.
- Exercising the path end to end — a completed job opening its pull request and commenting — needs GitHub, and is Gate 12 observation (xiv)'s (Task 31). The suites above drive each verb against a `gh` stub.
