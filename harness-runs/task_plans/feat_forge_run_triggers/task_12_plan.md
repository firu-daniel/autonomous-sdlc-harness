### Task 12 — Ship the `harness-trigger.yml` workflow template

**Goal:** Add the GitHub-side workflow that starts a run when an issue is labelled: `cli/templates/github/workflows/harness-trigger.yml`, written by `init` into an adopter's `.github/workflows/`. Its one job checks out the default branch and runs `remote-run.sh trigger`, which does everything else. The file is small on purpose: every decision lives in the script, where it is tested, and the YAML carries only the events, the permissions and the label filter.

**Depends on:**

- Task 8, whose `remote-run.sh trigger` handles `GITHUB_EVENT_NAME` `issues` and `repository_dispatch` from `GITHUB_EVENT_PATH`, and reads `HARNESS_REMOTE_STOP`, `HARNESS_TRIGGER_LABEL`, `HARNESS_TRIGGER_ALLOWED_BOTS`, `GITHUB_REPOSITORY`, `GITHUB_SERVER_URL` and `GITHUB_RUN_ID` from the environment. It uses `GH_TOKEN` for `gh`.
- Task 1's names, which this file mirrors byte for byte and declares in its header:
  - `WORKFLOW_TRIGGER_FILE` = `harness-trigger.yml`;
  - `TRIGGER_LABEL_VARIABLE` = `HARNESS_TRIGGER_LABEL`;
  - `DEFAULT_TRIGGER_LABEL` = `harness`;
  - `TRIGGER_ALLOWED_BOTS_VARIABLE` = `HARNESS_TRIGGER_ALLOWED_BOTS`;
  - `TRIGGER_DISPATCH_EVENT_TYPE` = `harness-task`;
  - plus the existing `RUNNER_VARIABLE` and `REMOTE_STOP_VARIABLE`.

**Where this task stops.** It writes the template and its test. The generator that copies it into an adopter's repository, and the choice of when, are Task 13's. What `doctor` says about it is Tasks 14 and 15's. The run it starts is `harness-run.yml`'s, which this task does not touch.

### Targets

- `cli/templates/github/workflows/harness-trigger.yml` (new).
- `cli/test/workflow-templates.test.mjs` — the template's contract.

**Work:**

- [ ] **The workflow.** `name: harness-trigger`, with `run-name: harness trigger ${{ github.event.issue.number || github.event.action }}`. That title is distinct from the `harness <action> <branch>` titles `remote-run.sh` matches `harness-run.yml`'s runs by, so no match can pick it up.
  - `on:` is `issues` with `types: [labeled]` only, plus `repository_dispatch` with `types: [harness-task]`.
  - `permissions:` is exactly `contents: write` (push the new branch), `actions: write` (dispatch `harness-run.yml`) and `issues: write` (comment and remove the label). They are declared explicitly because the default token may be read-only (research T2).
  - `defaults.run.shell: bash`, and no `concurrency:` key.
  - One job, `trigger`, with `if: github.event_name == 'repository_dispatch' || github.event.label.name == (vars.HARNESS_TRIGGER_LABEL || 'harness')`. Every other label then yields a skipped job, which runs no runner and bills nothing (`docs/remote-execution.md` → `### Verified in Gate 12 round 2`). It has `runs-on: ${{ vars.HARNESS_RUNNER || 'ubuntu-latest' }}`, and a job `env:` of `GH_TOKEN: ${{ github.token }}`, `HARNESS_REMOTE_STOP`, `HARNESS_REMOTE_SLUG: ${{ github.repository }}`, `HARNESS_TRIGGER_LABEL` and `HARNESS_TRIGGER_ALLOWED_BOTS` from `vars`.
- [ ] **The steps**, each guarded as needed:
  1. `actions/checkout@v5` with `token: ${{ github.token }}` and `fetch-depth: 0`. The token is the job's own and never `HARNESS_GIT_TOKEN`: a branch push made with `GITHUB_TOKEN` starts no workflow (round 3), so the prompt commit does not run the adopter's CI. A full fetch is used because the push of a new branch from a shallow clone is not measured anywhere; the header says so.
  2. The same *Check for jq and gh* step `harness-run.yml` runs.
  3. *Read the configuration*: `scriptsDir` into `SCRIPTS_DIR` through `GITHUB_ENV`, as `harness-run.yml` does.
  4. *Set the git identity* to `github-actions[bot]`, as `harness-run.yml` does.
  5. `run: bash "$SCRIPTS_DIR/remote-run.sh" trigger`.

  No secret is referenced anywhere. The trigger needs only the job token, so the credential secrets never reach the job that reads untrusted issue text.
- [ ] **The header**, in `harness-run.yml`'s style:
  - *WHO WRITES IT*: `init`, only when `forge` is `github` and `execution.target` is `github-actions`. Create-if-absent. Not re-rendered by `init --upgrade-workflows`: it carries no version pin and calls the scripts on the default branch, so it shares their re-run contract, `init --force` after a `.bak`.
  - *THE EVENTS*: why `labeled` and never `opened` (research T1: labelling at creation raises `labeled` too, and listening to both starts twice), and what a `repository_dispatch` of type `harness-task` carries.
  - *WHO CAN START A RUN*: a pointer to `remote-run.sh`'s `trigger` paragraph, which owns the check.
  - *THE PERMISSIONS*: why each of the three.
  - *NO CONCURRENCY GROUP*: a group keeps at most one pending run and cancels an earlier pending one, which would drop a trigger. A collision between two starts at once is caught by the refused push of an existing branch and reported on the issue instead.
  - *TWO RULES EVERY EDIT KEEPS*: event text and variables reach a shell only through `env:` and the event file; every expression has a space after its braces.
  - *DECLARED MIRRORS*.
  - *ACTION PINS*: `actions/checkout@v5`, with the same provenance sentence as `harness-run.yml`'s block.
- [ ] **`workflow-templates.test.mjs`**: extend the header's contract paragraph and add a `harness-trigger.yml` block asserting:
  - the two triggers and `labeled` as the only `issues` type, so `opened` is absent;
  - the permissions exactly `contents: write`, `actions: write` and `issues: write`;
  - the job's `if:` naming `TRIGGER_LABEL_VARIABLE` and `DEFAULT_TRIGGER_LABEL`, and `repository_dispatch` types naming `TRIGGER_DISPATCH_EVENT_TYPE`, both imported from `../dist/remote/githubActions.js`;
  - `remote-run.sh trigger` as its only call into the script family;
  - no `secrets.` reference and no `concurrency:` key;
  - no `{{` template token;
  - every expression spaced, and none inside a `run:` block;
  - the `# ACTION PINS.` header naming exactly the file's `uses:` set, each a major tag of an `actions/` action — reuse the file's existing helpers for the last three.

**Verification:**

- `npm test -- test/workflow-templates.test.mjs` from `cli/` passes, with the two existing templates' cases unchanged.
- `grep -n "secrets\.\|opened\|concurrency" cli/templates/github/workflows/harness-trigger.yml` finds each word only in the header's comments.
