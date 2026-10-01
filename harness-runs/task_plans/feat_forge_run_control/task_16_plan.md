### Task 16 — Write the control workflow from `init` and print its GitHub steps

**Goal:** `init` writes `.github/workflows/harness-control.yml` exactly when it writes the trigger, under `config/model.ts` → `forgeTriggerApplies(config)`. Its closing report then names every GitHub step the coupling needs in order: commit and push the workflows, create the trigger label `sdlc-harness`, and switch on the pull-request setting or set `HARNESS_GIT_TOKEN`. That is the same one-time setup the adopter docs list (goal 9).

**Depends on:**

- Task 15's template `cli/templates/github/workflows/harness-control.yml`.
- Task 1's `WORKFLOW_CONTROL_FILE` and `WORKFLOW_CONTROL_PATH` in `cli/src/remote/githubActions.ts`.
- Task 2's `DEFAULT_TRIGGER_LABEL = 'sdlc-harness'`, which the existing `gh label create ${DEFAULT_TRIGGER_LABEL} …` line already prints.

**Where this task stops.** `doctor`'s grading is Tasks 17 and 18's. The adopter-facing setup text is Tasks 23 and 26's. The workflow is copied verbatim, as `harness-trigger.yml` and `harness-resume.yml` are (`cli/src/generators/githubWorkflows.ts` → choices 3 and 5): it carries no token and no pin.

### Targets

- `cli/src/generators/githubWorkflows.ts` — the enqueue, the module header's rule and its choice 5.
- `cli/src/core/writer.ts` — the re-run-contract table row.
- `cli/src/commands/init.ts` — `reportGithubSteps`.
- `cli/templates/README.md` — the `github/` row.
- `cli/test/trigger-workflow-init.test.mjs` — the control workflow's gating, idempotence and report lines.

**Work:**

- [ ] **`githubWorkflows.ts`**:
  - inside the existing `if (trigger)` block, enqueue `WORKFLOW_CONTROL_PATH` from the template `${WORKFLOW_TEMPLATE_DIR}/${WORKFLOW_CONTROL_FILE}`, `create-if-absent`, copied verbatim, with the label `workflow ${WORKFLOW_CONTROL_FILE}`, and push it onto `workflows`, so the report's `git add` line names it;
  - no `forceOverride` is ever set on it, upgrade mode included;
  - the header's rule and choice 5 name both forge workflows: gated on `forgeTriggerApplies`, no pin, never upgraded, sharing the scripts' re-run contract;
  - `GithubWorkflowsResult.trigger`'s doc says it also stands for the control workflow, since they are written together.
- [ ] **`writer.ts`**: a re-run table row for `.github/workflows/harness-control.yml`, `create-if-absent`, with the trigger row's wording — written only when `forge` is `github` and `execution.target` is `github-actions`; no pin, so `init --upgrade-workflows` leaves it; `--force` after a `.bak`. No managed `.gitignore` line is added, because no upgrade ever `.bak`s it, as for the trigger (`docs/cli.md` → `## 3.`).
- [ ] **`reportGithubSteps`**, in the `trigger` branch:
  - the label step's sentence also says the label `sdlc-harness` and the six `sdlc-harness: <state>` labels are distinct: the state labels are created on first use and must not be applied by hand;
  - a new numbered step follows it. A completed run opens a draft pull request with the job's token only once *Allow GitHub Actions to create and approve pull requests* is switched on under Settings → Actions → General → Workflow permissions, so switch it on, or set `HARNESS_GIT_TOKEN` (`GIT_TOKEN_SECRET`), which opens the pull request so the repository's CI runs on it without an approval click. The same step states the cost Task 6 decided: the pull request's author is then the token's owner, who cannot request changes on it, so a solo maintainer uses a token of a machine account or starts review rounds locally with `/autonomous-sdlc-harness:branch-user-review`. This step is prose with a settings path, and no command: a `gh api` that writes the setting would also overwrite the repository's default token permissions (research C3's measured call set both);
  - one more sentence names the comment commands — `@sdlc-harness answer`, `pause`, `resume`, `stop` and `clear` from `COMMAND_VERBS` and `COMMAND_HANDLE` — and that a review requesting changes on the run's pull request starts a user-review round;
  - the closing pointer names the harness documentation's `docs/github-run-control.md` beside `docs/remote-execution.md`.
- [ ] **`cli/templates/README.md`**: the `github/` row names `workflows/harness-control.yml` beside `harness-trigger.yml`, written under the same condition.
- [ ] **`trigger-workflow-init.test.mjs`**:
  - with `forge` `github` and `execution.target` `github-actions`, `init` writes `harness-control.yml` byte-identical to the template, and the report's `git add` line names it;
  - with `forge` `none` or unset, or with `execution.target` `local`, it is not written;
  - a second `init` changes nothing (idempotence), and `--force` takes a `.bak` of an edited copy;
  - `--upgrade-workflows` leaves an edited copy untouched;
  - the report carries `gh label create sdlc-harness`, the settings path *Allow GitHub Actions to create and approve pull requests*, `@sdlc-harness`, and the machine-account advice beside `HARNESS_GIT_TOKEN`;
  - the header names the control workflow.

**Verification:**

- `npm test -- test/trigger-workflow-init.test.mjs` from `cli/` passes; its `pretest` compile is the check that the generator still type-checks under `strict`.
- `git grep -n "harness-control.yml" -- cli/src` has every hit inside `cli/src/remote/githubActions.ts` or in a doc comment: the generator and the writer table read the constant.
