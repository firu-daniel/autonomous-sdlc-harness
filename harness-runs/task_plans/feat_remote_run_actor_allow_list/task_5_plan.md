### Task 5 — Pass `HARNESS_RUN_ACTORS` into `harness-trigger.yml` and `harness-control.yml`

**Goal:** The trigger job and the control job hand `remote-run.sh` the allow-list. Without it, `authorise_actor` (Task 2) reads the list as unset in those jobs, and every start and command is held to the owner-only default whatever the maintainer set.

**Depends on:**
- **Task 1.** `RUN_ACTORS_VARIABLE = 'HARNESS_RUN_ACTORS'` in `cli/src/remote/githubActions.ts`, which the test imports.
- **Task 4.** It owns the shared test file before this task: Task 4 adds its cases to `cli/test/workflow-templates.test.mjs`, and this task adds the trigger and control cases after them.
- **Task 2's contract.** The script reads `HARNESS_RUN_ACTORS` from its environment, and the repository owner from the event file, which the job already has, so neither job needs an owner line.

**Where this task stops.**
- `harness-run.yml` is Task 4's.
- Neither job gains a `secrets.` reference: both keep reading no repository secret (task prompt, *Constraints*).
- Neither job gains a gate step. Their actor is the event's sender, which `authorise_actor` already screens, and the dispatch they make names `github-actions[bot]`, which the run job's gate admits.

### Targets

- `cli/templates/github/workflows/harness-trigger.yml`: one `env:` line and two header edits.
- `cli/templates/github/workflows/harness-control.yml`: one `env:` line and two header edits.
- `cli/test/workflow-templates.test.mjs`: the trigger and control cases, and the contract paragraph.

**Work:**

- [ ] **`harness-trigger.yml`.**
  - In the `trigger` job's `env:`, add `HARNESS_RUN_ACTORS: ${{ vars.HARNESS_RUN_ACTORS }}` directly under `HARNESS_TRIGGER_ALLOWED_BOTS`.
  - In the header, `WHO CAN START A RUN.` names *"the labeller, bots and HARNESS_TRIGGER_ALLOWED_BOTS, the permission call"*. Add the allow-list `HARNESS_RUN_ACTORS` to it, and the `repository_dispatch` sender check.
  - In `DECLARED MIRRORS`, add `HARNESS_RUN_ACTORS` to the `cli/src/remote/githubActions.ts` entry.
- [ ] **`harness-control.yml`.**
  - In the `control` job's `env:`, add the same line directly under `HARNESS_TRIGGER_ALLOWED_BOTS`.
  - In `DECLARED MIRRORS`, add `HARNESS_RUN_ACTORS` to the `cli/src/remote/githubActions.ts` entry.
  - In `WHAT IT DOES.`, say that `control` authorises the actor against the allow-list as well as their write access.
  - Keep the job `if:` exactly as it is. The test pins it, and the file's third rule forbids a plain scalar carrying `: `.
- [ ] **`workflow-templates.test.mjs`.**
  - Add one case per file. Each asserts the job's `env:` carries `` `${RUN_ACTORS_VARIABLE}: \${{ vars.${RUN_ACTORS_VARIABLE} }}` `` on the line right after the `HARNESS_TRIGGER_ALLOWED_BOTS` line, and that the file's `DECLARED MIRRORS` block names `HARNESS_RUN_ACTORS`.
  - Extend the contract paragraph for the two files accordingly.
  - The existing *"references no secret"* cases for both files must still pass unchanged.

**Verification:**

- Run the edited `cli/test/workflow-templates.test.mjs` from `cli/` with `npm test -- test/workflow-templates.test.mjs`, under the conditions in `unit_loop_core.md` → `## The test-run rule` (3). The new cases pass, and the control `if:`, permission, secret and concurrency cases still pass.
- Neither file contains `secrets.`, and neither file's `if:` changed. Check with a `git diff` of the two templates.
- **`init`'s 0.6.1 repair.** `cli/test/fixtures/harness-control-0.6.1.yml` is untouched. The repair compares an adopter's copy with that release's bytes, never with this template, so the edit here cannot make `init` treat a current copy as the unparseable one. Confirm by reading `cli/src/generators/githubWorkflows.ts` → `UNPARSEABLE_CONTROL_RELEASES`.
