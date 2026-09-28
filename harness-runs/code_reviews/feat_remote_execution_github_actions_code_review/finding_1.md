### 1. The resume poller never receives `HARNESS_PUSH_URL`, so its `failed` notifications reach no one

**File:** `cli/templates/github/workflows/harness-resume.yml` (job `poll`, its `env:` block) — "HARNESS_REMOTE_SLUG: ${{ github.repository }}"

**Problem.** `remote-run.sh poll` is the resume poller's whole body. Its `poll_branch` sends `failed` notifications through the sibling `autonomous-notify.sh` in three cases (`cli/templates/scripts/remote-run.sh` → `poll_branch`):

- "Not resumed by the poller: chain unreadable in status.json."
- "Not resumed by the poller: chain limit reached (…)."
- "Not resumed by the poller: engine '…' in status.json is not task, user_review or docs."

In each case the run is dropped from the waiting set. If it was the last branch waiting, the poller then disables itself, so nothing ever resumes that run.

`autonomous-notify.sh` pushes only through `HARNESS_PUSH_CMD` / `HARNESS_PUSH_URL` (its `env_cmd` / `env_url` lines) or the `pushEnvPath` files. That file is gitignored, so it is never in the poller's checkout. The run workflow passes the secret into its job's `env:` (`harness-run.yml` → `HARNESS_PUSH_URL: ${{ secrets.HARNESS_PUSH_URL }}`). The poller workflow does not: its `env:` carries only `GH_TOKEN`, `HARNESS_REMOTE_STOP`, `HARNESS_MAX_CHAIN` and `HARNESS_REMOTE_SLUG`. So every notification the poller sends goes nowhere, and the run stays stopped with nobody told.

This breaks the task prompt's Acceptance 8: a remote run's `failed` events must reach the user through the push notification. It is a gap between two units: Task 8 specified the poller's `failed` notifications, and Task 16's workflow never wired the secret they need. The docs repeat the gap. `docs/remote-execution.md` → `### Every secret and variable` lists `HARNESS_PUSH_URL` as read by "`autonomous-notify.sh` in the job" only.

**Fix.**

- [ ] In `cli/templates/github/workflows/harness-resume.yml`, add this line to the `poll` job's `env:` block, directly under `HARNESS_REMOTE_SLUG: ${{ github.repository }}`:
  ```yaml
      HARNESS_PUSH_URL: ${{ secrets.HARNESS_PUSH_URL }}
  ```
- [ ] In the same file's header:
  - Change `# WHAT IT READS.` so that a `Secrets: HARNESS_PUSH_URL (optional notifications: the poller's own failed notice when it cannot resume a run).` line comes before `Variables:`.
  - Add `HARNESS_PUSH_URL` to the `cli/src/remote/githubActions.ts` row of `# DECLARED MIRRORS`, so the row reads `WORKFLOW_RESUME_FILE, HARNESS_RUNNER, HARNESS_REMOTE_STOP, HARNESS_PUSH_URL`.
- [ ] In `cli/test/workflow-templates.test.mjs`, add a case after `'the poller runs remote-run.sh poll and nothing else of the family'`. The header's contract paragraph for `harness-resume.yml` should gain "`HARNESS_PUSH_URL` passed through `env:`" to match.
  ```js
  test('the poller passes the push secret through env, so its failed notice can be delivered', () => {
    assert.match(RESUME_TEXT, /^ {6}HARNESS_PUSH_URL: \$\{\{ secrets\.HARNESS_PUSH_URL \}\}$/m);
  });
  ```
- [ ] In `docs/remote-execution.md` → `### Every secret and variable`, change the `HARNESS_PUSH_URL` row's **Read by** cell to: "`autonomous-notify.sh` in the run job and in the resume poller: an endpoint that accepts a POST whose body is the message".
