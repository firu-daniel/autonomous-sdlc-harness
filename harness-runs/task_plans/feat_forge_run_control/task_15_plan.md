### Task 15 — Ship the `harness-control.yml` workflow template

**Goal:** Add the GitHub-side workflow that runs `remote-run.sh control` when someone comments on an issue or pull request, or submits a pull-request review. The file is small on purpose: every decision lives in the script, where it is tested. The YAML carries the events, the permissions and a cheap prefilter that skips a runner for the ordinary comments and reviews that can never be commands. It is a separate file from `harness-trigger.yml`, so an adopter can disable comment control on its own: disabling a workflow file disables every trigger in it (research A3).

**Depends on:**

- Task 13, whose `remote-run.sh control` handles `GITHUB_EVENT_NAME` `issue_comment` and `pull_request_review` from `GITHUB_EVENT_PATH`. It reads `HARNESS_REMOTE_STOP`, `HARNESS_TRIGGER_ALLOWED_BOTS`, `GITHUB_REPOSITORY`, `GITHUB_SERVER_URL`, `GITHUB_RUN_ID` and `RUNNER_TEMP` from the environment, uses `GH_TOKEN` for `gh`, and pushes a review round through `create-worktree.sh` and `push-branch.sh`.
- Task 1's names, which this file mirrors byte for byte and declares in its header:
  - `WORKFLOW_CONTROL_FILE` = `harness-control.yml`;
  - `COMMAND_HANDLE` = `@sdlc-harness`;
  - `COMMENT_MARKER` = `<!-- sdlc-harness`;
  - `REVIEW_ROUND_STATE` = `changes_requested`;
  - plus the existing `RUNNER_VARIABLE`, `REMOTE_STOP_VARIABLE` and `TRIGGER_ALLOWED_BOTS_VARIABLE`.

**Where this task stops.** It writes the template and its test. The generator that copies it into an adopter's repository is Task 16's, and what `doctor` says about it is Tasks 17 and 18's. The prefilter is not the authority: `control` re-checks every rule, so a hand-run or an edited copy cannot bypass one.

### Targets

- `cli/templates/github/workflows/harness-control.yml` (new).
- `cli/test/workflow-templates.test.mjs` — the template's contract.

**Work:**

- [ ] **The workflow.**
  - `name: harness-control` and `run-name: harness control ${{ github.event.issue.number || github.event.pull_request.number }}`. This title never equals a `harness <action> <branch>` title that `remote-run.sh` matches runs by.
  - `on:` is `issue_comment` with `types: [created]`, and `pull_request_review` with `types: [submitted]`. It never uses `pull_request_target` (the *Fork pull requests* lead; C2), and never `pull_request_review_comment`, because one review raises one such event per inline comment and the round is built from the review event alone (C1).
  - `permissions:` is exactly:
    - `contents: write` — push a review round;
    - `actions: write` — dispatch, pause, stop, cancel, and read runs and artifacts;
    - `issues: write` — reply and label;
    - `pull-requests: write` — read the pull request and its comments, and label it.
  - `defaults.run.shell: bash`, and no `concurrency:` key, for the trigger's reason: a group keeps one pending run and cancels an older one, which would drop a command.
- [ ] **The job `control`**:
  - **Its `if:`, the prefilter:**
    - an `issue_comment` whose body `contains` `'@sdlc-harness'` and does not `contains` `'<!-- sdlc-harness'`; or
    - a `pull_request_review` whose `github.event.review.state == 'changes_requested'` and whose `github.event.pull_request.head.repo.full_name == github.repository`.

    A fork's review is never run, because its token is read-only and the job could not even reply (C2). Every other comment or review yields a skipped job, which runs no runner and bills nothing (`docs/remote-execution.md` → `### Verified in Gate 12 round 2`, a skipped `harness pause` run's billing).
  - `runs-on: ${{ vars.HARNESS_RUNNER || 'ubuntu-latest' }}`.
  - Its `env:` holds `GH_TOKEN: ${{ github.token }}`, `HARNESS_REMOTE_STOP`, `HARNESS_REMOTE_SLUG: ${{ github.repository }}` and `HARNESS_TRIGGER_ALLOWED_BOTS`, the last from `vars`.
  - No secret is referenced. The job's own token is all it needs, so the credential secrets never reach a job that reads untrusted comment text. Every reply it posts is `github-actions[bot]`'s, and starts no workflow (S3).
- [ ] **The steps**, as `harness-trigger.yml`'s:
  1. `actions/checkout@v5` with `ref: ${{ github.event.repository.default_branch }}`, `token: ${{ github.token }}` and `fetch-depth: 0`. The scripts that run are the default branch's, never the pull request's merge commit: a `pull_request_review` workflow otherwise checks out that merge commit (C2), and nothing from a pull request's head is ever run.
  2. *Check for jq and gh*.
  3. *Read the configuration* into `SCRIPTS_DIR`.
  4. *Set the git identity* to `github-actions[bot]`.
  5. `run: bash "$SCRIPTS_DIR/remote-run.sh" control`.
- [ ] **The header**, in `harness-trigger.yml`'s style:
  - *WHO WRITES IT*: `init`, only when `forge` is `github` and `execution.target` is `github-actions`; create-if-absent; no pin, so `init --upgrade-workflows` leaves it and `init --force` replaces it after a `.bak`.
  - *THE EVENTS* and why `pull_request_review_comment` is not one.
  - *THE PREFILTER*: why it is a saving and not the authority. That `contains()` is case-insensitive is GitHub's documented behaviour, not verified here, and a mixed-case handle the filter missed would only go unanswered, never be obeyed.
  - *THE PERMISSIONS*.
  - *FORK PULL REQUESTS*: never `pull_request_target`, a fork's review skipped here, and a fork's comment refused by `control`.
  - *NO CONCURRENCY GROUP*.
  - *TWO RULES EVERY EDIT KEEPS*.
  - *DECLARED MIRRORS*.
  - *ACTION PINS*: `actions/checkout@v5`, with the trigger's provenance sentence.
- [ ] **`workflow-templates.test.mjs`**: extend the header's contract paragraph, and add a `harness-control.yml` block asserting:
  - the two events, each with its one type, and no `pull_request_target` or `pull_request_review_comment` anywhere outside comments;
  - the permissions exactly the four;
  - the job's `if:` carrying `COMMAND_HANDLE`, `COMMENT_MARKER` and `REVIEW_ROUND_STATE`, each imported from `../dist/remote/githubActions.js`, and comparing the head repository with `github.repository`;
  - the checkout's `ref` being the default branch;
  - `remote-run.sh control` as its only script call;
  - no `secrets.` reference and no `concurrency:` key;
  - no `{{` template token;
  - every expression spaced and none inside a `run:` block;
  - the `# ACTION PINS.` header naming exactly the file's `uses:` set.

  Reuse the file's existing helpers for the last three.

**Verification:**

- `npm test -- test/workflow-templates.test.mjs` from `cli/` passes, with the other three templates' cases unchanged.
- `git grep -n "secrets\.\|pull_request_target\|concurrency" -- cli/templates/github/workflows/harness-control.yml` finds each word only in the header's comments.
