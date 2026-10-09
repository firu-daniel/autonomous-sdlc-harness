### Task 10 — Pin the hardened workflow shapes in `workflow-templates.test.mjs`

**Goal:** The template suite asserts the hardened shapes Tasks 7–9 wrote, so a later edit that unpins an action, widens a grant or re-persists a credential fails a test, not only an audit. Its existing permission assertions, which today require a workflow-level block, move to the per-job shape.

**Depends on:** Tasks 7, 8 and 9. They leave the four templates in this shape:
- **Workflow-level permissions.** Each file declares `permissions: {}` at workflow level.
- **`harness-run.yml`'s jobs.** `wrong-ref` has `permissions: {}`. `run` has `contents`, `actions`, `issues` and `pull-requests` at `write`. `collect` and `warm` have the grants Task 7 derived and cited in that file's `# THE PERMISSIONS.` block — read them from the template, not from memory.
- **The single-job files.** `harness-resume.yml`'s `poll`, `harness-trigger.yml`'s `trigger` and `harness-control.yml`'s `control` each hold the set its file granted before this branch.
- **The pins.** Every `uses:` names `<owner>/<repo>[/<path>]@<40 lowercase hex>`, and the line directly above it is `# <action> v<major>.<minor>.<patch>`.
- **The checkouts.** `persist-credentials: false` is on the `warm` checkout (`harness-run.yml`) only. It is absent on the `run`, `collect`, `trigger` and `control` checkouts, whose jobs push, and on the `poll` checkout (`harness-resume.yml`), whose job runs `git ls-remote … origin` through it (`remote-run.sh` → `poll_branch` → `remote_branch_exists`), which a private repository refuses without the credential.
- **The header blocks.** `harness-run.yml` and `harness-control.yml` each carry a `# THE CLAUDE CLI.` block. All four carry a rewritten `# ACTION PINS.`. `harness-run.yml`, `harness-resume.yml` and `harness-control.yml` carry a `# THE CHECKOUT CREDENTIAL.` block; `harness-trigger.yml` carries the reason in `# THE CHECKOUT.`.
- **The upload steps, which no task on this branch moves** (Task 8 keeps every `run:` body byte-stable):
  - `harness-run.yml` has one `actions/upload-artifact` step, `Upload the state bundle`, whose `path:` is `${{ runner.temp }}/harness-state`. Its other two `path:` keys (`${{ env.HARNESS_RETRIEVAL_CACHE }}`) belong to the `actions/cache/restore` and `actions/cache` steps, not to an upload, and are out of the upload assertion's scope.
  - `harness-trigger.yml` and `harness-control.yml` carry no `actions/upload-artifact` step.
  - `harness-resume.yml` has one, `Upload the poller state`, whose `path:` is `${{ env.POLL_STATE_DIR }}`. `POLL_STATE_DIR` is **inside the workspace**: the job's configuration-reading step sets it with `echo "POLL_STATE_DIR=${state_dir%/}/autonomous_logs/poll_state/current"` into `$GITHUB_ENV`, where `state_dir` is `jq -r '.stateDir // "sdlc-harness"' harness.config.json`, a repo-relative path. So it resolves to `<stateDir>/autonomous_logs/poll_state/current` under the checkout. That checkout keeps its credential (Task 8), so what keeps the upload from carrying it is the upload's path: a subdirectory of the state directory, which does not contain `.git/`.

### Targets

- `cli/test/workflow-templates.test.mjs`

**Work:**

- [ ] **Rewrite the four permission tests** to the new shape: workflow-level `permissions: {}` plus the job-level sets above, each asserted exactly. The tests are `the run-name title, the runner line and the permissions`, `the poller: a schedule, a hand trigger, and exactly its four permissions`, `the trigger: exactly its three permissions` and `control: exactly its four permissions`. Update the file header's contract paragraph wherever it says "the permissions exactly …" at workflow level.
- [ ] **Add one test per file: every action is pinned to a commit.** Each `uses:` matches `@[0-9a-f]{40}$`, and its preceding line matches `^\s*# \S+ v\d+\.\d+\.\d+$`. The existing `uses:\s*actions\/checkout@` and `actions\/upload-artifact@` locators still match a SHA reference; confirm they do.
- [ ] **Add one test per file for the credential shape.**
  - **`persist-credentials: false`** is present under exactly one checkout, `warm`'s, and absent under the other five.
  - **The persisted ones.** Each checkout that keeps its credential has a `# THE CHECKOUT CREDENTIAL.` (run, collect, poll, control) or `# THE CHECKOUT.` (trigger) header block naming why.
  - **The upload path, scoped to the files whose checkout keeps its credential.** Locate `actions/upload-artifact` steps by their `uses:` line, not by every `path:` key. In `harness-run.yml`, every such step's `path:` starts with `${{ runner.temp }}`. In `harness-trigger.yml` and `harness-control.yml`, assert there is no `actions/upload-artifact` step at all.
  - **The resume upload.** `harness-resume.yml`'s upload stays workspace-relative (`POLL_STATE_DIR`, defined in the `**Depends on:**` block above), so do not assert it sits outside the workspace. Assert it on its path instead: the step's `path:` is exactly `${{ env.POLL_STATE_DIR }}`, and the line that sets `POLL_STATE_DIR` ends in `/autonomous_logs/poll_state/current"` — a state-directory subpath that cannot reach `.git/`. Name that reason in the test's message or comment.
- [ ] **Re-confirm the existing invariants still hold.** These tests stay unchanged and must still pass:
  - `no plain-scalar mapping value carries ': ' or ' #'` — this is why the version comment sits on the line above;
  - `every expression is spaced, and {{cliVersion}} is the only token`;
  - the poller's and the trigger's no-token tests;
  - `control: the claude CLI install mirrors harness-run.yml`.

**Verification:**

- `npm test --workspace cli -- test/workflow-templates.test.mjs`, from the repository root, as one foreground command — the file this task edits. It passes, with its counts read back.
- **A scratch mutation check.** In a copy under `harness-runs/scratch/`, revert one SHA to `@v5`, then delete the `warm` checkout's `persist-credentials: false`, then add one under the `poll` checkout. Run each new test's assertion against the copy through `bash scripts/scratch-run.sh <probe>`, and confirm each fails. Record the three outcomes in the return.

**Deviations from plan:**
- The existing per-file test `the ACTION PINS header names exactly the uses: values, each a major tag of an actions/ action` failed on all four files after Tasks 7–9 (it read `#   actions/<name>@v<major>` header lines and required `@v[0-9]+`). The plan does not name it; it is rewritten as `the ACTION PINS header names exactly the pinned actions and their versions`, comparing the header's `#   <action>   v<x.y.z>` lines with the `# <action> v<x.y.z>` comments above the `uses:` lines. The `actions/` owner restriction it carried is dropped, matching the plan's `<owner>/<repo>[/<path>]` pin shape.
- The pin test additionally asserts the version comment names the same action its `uses:` line pins.
- The credential test additionally asserts each file's checkouts sit in exactly the jobs listed, and that no non-comment `persist-credentials` line exists outside them.
