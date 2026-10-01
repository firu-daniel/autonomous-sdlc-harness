### Task 13 — Write the trigger workflow from `init` when `forge` is `github` and runs execute on GitHub Actions

**Goal:** Make `init` the first reader of `forge`. When `forgeTriggerApplies(config)` holds, meaning `forge` is `github` **and** `execution.target` is `github-actions`, `init` writes `.github/workflows/harness-trigger.yml` from Task 12's template, create-if-absent. Its closing report then tells the adopter what only they can do: commit and push it with the other workflows, and create the trigger label. In every other configuration `init` writes exactly what it writes today.

**Depends on:**

- Task 1's `forgeTriggerApplies(config: HarnessConfig): boolean` in `cli/src/config/model.ts`, and its names in `cli/src/remote/githubActions.ts`: `WORKFLOW_TRIGGER_FILE`, `WORKFLOW_TRIGGER_PATH`, `TRIGGER_LABEL_VARIABLE`, `DEFAULT_TRIGGER_LABEL` and `TRIGGER_ALLOWED_BOTS_VARIABLE`.
- Task 12's template at `cli/templates/github/workflows/harness-trigger.yml`, which carries no `{{…}}` token and is copied verbatim.

**Where this task stops.** The generator plans and `init` reports. `doctor`'s view of the file is Task 14's, and GitHub's view of it Task 15's. It adds **no** managed `.gitignore` line. `init --upgrade-workflows` never replaces this file, so no upgrade leaves a `harness-trigger.yml.bak` behind. And a new managed line would change the tracked `.gitignore` inside every run job whose `init --plugin-root-entries` runs at the new version, which that job's *Generate the job's permission profile* step refuses (`harness-run.yml`: *"init … changed tracked files"*). `--force`'s `.bak` of this file is an ordinary forced-run `.bak`, like the scripts' own.

### Targets

- `cli/src/generators/githubWorkflows.ts` — the third workflow, gated on `forgeTriggerApplies`.
- `cli/src/commands/init.ts` — `reportGithubSteps`' wording, and the label step.
- `cli/src/core/writer.ts` — the re-run table's row for the file.
- `cli/templates/README.md` — the `github/` row.
- `cli/test/trigger-workflow-init.test.mjs` (new).

**Work:**

- [ ] **`githubWorkflows.ts`**:
  - When `remoteExecutionApplies(config)` holds **and** `forgeTriggerApplies(config)` holds, `plan.add` the trigger at `WORKFLOW_TRIGGER_PATH` with policy `create-if-absent`. Its content is `readTemplate(\`${WORKFLOW_TEMPLATE_DIR}/${WORKFLOW_TRIGGER_FILE}\`)` verbatim, with no render (choice 3's reasoning for `harness-resume.yml`), and it never carries a `forceOverride`, in upgrade mode or otherwise.
  - Append `{ absolute, repoPath: WORKFLOW_TRIGGER_PATH }` to the result's `workflows`, and add `readonly trigger: boolean` to `GithubWorkflowsResult`, true exactly when it was enqueued.
  - In the header, add choice 5: *the trigger workflow is gated on `forgeTriggerApplies`, carries no pin and is not upgraded, because it calls the scripts on the default branch and shares their re-run contract*. Extend the rule sentence so it names the third file and its gate.
- [ ] **`init.ts` → `reportGithubSteps`**:
  - Make step 1's sentence and its `git add` line correct for three paths. It says *"it"* or *"both"* today; use the paths' count or a wording that holds for any count.
  - When the generator's `trigger` is true, add a step naming the label the trigger listens to and the command that creates it, each command on its own `command(...)` line as the existing steps do: `gh label create harness --description "Start a harness run from this issue"`, spelled from `DEFAULT_TRIGGER_LABEL`.
  - In the same step, say optionally set `HARNESS_TRIGGER_LABEL` to use another label and `HARNESS_TRIGGER_ALLOWED_BOTS` to let a listed bot start runs, spelled from their constants; and that only a person with write or admin access, or a listed bot, starts a run.
  - Keep the closing documentation line pointing at `docs/remote-execution.md` only. That document gains its pointer to the trigger's own document in Task 21, so this report never names a file that does not exist yet.
  - No literal the constants own is retyped.
- [ ] **The tables of record**:
  - `cli/src/core/writer.ts`'s re-run table gains a row: `.github/workflows/harness-trigger.yml` | `create-if-absent` | written only when `forge` is `github` and `execution.target` is `github-actions`; no pin, so `init --upgrade-workflows` leaves it; `--force` after a `.bak` is its upgrade path, as for the scripts it calls.
  - `cli/templates/README.md`'s `github/` row names `workflows/harness-trigger.yml` and its condition.
- [ ] **`cli/test/trigger-workflow-init.test.mjs`** opens with its rule: *the trigger workflow is written exactly when `forge` is `github` and remote execution is on, byte for byte from its template, never upgraded, and its presence changes nothing else `init` writes*. Against throwaway fixtures, through the compiled CLI (`cli/test/helpers/fixture.mjs`):
  - `forge: github` + `execution.target: github-actions` → the file exists, byte-identical to the template, and the report lists it on its `git add` line with the `gh label create harness` command;
  - a second `init` changes nothing;
  - `forge: github` with `execution.target` absent → not written;
  - `forge: none` with `github-actions` → not written;
  - `forge` absent with `github-actions` → not written, and the other two workflows written as today;
  - an adopter-edited trigger survives `init --upgrade-workflows` byte for byte, with no `.bak`;
  - `--force` replaces it after a `.bak`;
  - `.gitignore` after a `forge: github` init is byte-identical to one after a `forge`-absent init of the same fixture;
  - `--dry-run` writes no workflow.

**Verification:**

- `npm test -- test/trigger-workflow-init.test.mjs` from `cli/` passes.
- `commands.typecheck` (`bash scripts/typecheck.sh`) exits 0.
- `grep -n "harness-trigger" cli/src` finds the file name only in `cli/src/remote/githubActions.ts`, plus doc comments and table text elsewhere: no second spelling that is joined or resolved as a path.
