### Task 6 — Surface a refused or given-up push in `Push the branch` as an `::error::` annotation and a job-summary line

**Goal:** A reader of the run page sees a refused push. In `cli/templates/github/workflows/harness-run.yml`'s `run` job, the `Push the branch` step still runs `push-branch.sh`, which stays non-fatal per its header's **EVERY FAILURE PATH IS NON-FATAL (exit 0)**. The step then turns each refusal line, and each line where the wrapper gave up a push, into one `::error::` annotation and one `$GITHUB_STEP_SUMMARY` line, and still exits 0.

**Why an annotation and not a failed step.** GitHub lists an `::error::` annotation on the run page whatever the job's conclusion. Failing the step would instead change the job's conclusion, which the steps under `!cancelled()` and `remote-run.sh`'s run-state reads were not written for.

**Where this task stops.** The wrapper, its messages and its exit status are untouched. `harness-run.yml`'s `collect` job is untouched: its push runs inside `remote-run.sh review` through `hr_push_landed`, which already reports a refusal as `review_fail`. The other three templates, `harness-control.yml`, `harness-trigger.yml` and `harness-resume.yml`, carry no `Push the branch` step. The prose in `docs/remote-execution.md` is **Task 8's**.

### Targets

- `cli/templates/github/workflows/harness-run.yml` — the `Push the branch` step and the comment above it.
- `cli/test/workflow-templates.test.mjs` — one new case and its header sentence.

**Work:**

- [ ] **The step's `run:` body.** Keep the `name:` and the `if: always() && env.SCRIPTS_DIR != ''` line byte for byte.
  - **Capture and print.** Run `bash "$SCRIPTS_DIR/push-branch.sh"` with stdout and stderr captured to a file under `$RUNNER_TEMP`, then print that file unchanged, so the log reads as it did.
  - **Annotate.** For each captured line carrying the substring `refusing to push`, or beginning `push-branch.sh: push failed for ` and not containing `retrying in`, print one line `::error title=Push the branch::<line>`. Escape `%` as `%25` in the line, as the workflow command syntax requires.
  - **Summarise.** Append the same lines, under one `### Push the branch` heading, to `"$GITHUB_STEP_SUMMARY"`. Do this only when that variable is non-empty and at least one line matched.
  - **Exit 0** in every case: a capture or print that fails must not fail the step either.

  The body follows the file's own `# TWO RULES EVERY EDIT KEEPS.`: no GitHub expression inside `run:`, and every value through `env:` or the runner's own variables.
- [ ] **The comment above the step.** Extend it with one sentence: the step turns a refusal or a given-up push into an `::error::` annotation and a job-summary line, and still exits 0, because `push-branch.sh` must never fail the job. Cite Gate 12 round 13, where `Push the branch` printed `push-branch.sh: refusing to push: …` and concluded `success`.
- [ ] **The test case,** `Push the branch annotates a refusal or a given-up push, and never fails the job`, in `workflow-templates.test.mjs`.
  - **Extract the body.** Take the step's body with this file's own `stepCarrying` / `dedent` helpers.
  - **Run it under the shell GitHub uses.** Run it under `bash -e -o pipefail`, as the run-actor gate case runs its body. Set `SCRIPTS_DIR` to a temporary directory holding a stub `push-branch.sh` that prints a given line and exits 0, set `RUNNER_TEMP` to a temporary directory, and set `GITHUB_STEP_SUMMARY` to a temporary file.
  - **Assert, for each stub line:**
    - `push-branch.sh: refusing to push: <path>/.git/config.worktree sets core.sparsecheckout, …` → exit 0, the line printed, one `::error title=Push the branch::push-branch.sh: refusing to push: …` line, and the summary file holding it;
    - `push-branch.sh: push failed for feat_x after 3 attempts (see output above)` → one `::error` line;
    - `push-branch.sh: pushed feat_x to origin` → exit 0, no `::error` line, and no summary written;
    - `push-branch.sh: push failed for feat_x (attempt 1 of 3); retrying in 5s` → no `::error` line;
    - a line carrying `%` → the annotation carries `%25`.
- [ ] **The test file's header.** Extend its contract paragraph by one sentence: `Push the branch` keeps its `always()` condition and turns each refusing or given-up push line into an `::error::` annotation and a job-summary line, exiting 0.

**Verification:**

- `npm test --workspace cli -- test/workflow-templates.test.mjs`, from the repository root, as one plain foreground command: every case passes. That includes the existing ones asserting that the final push runs under `always()`, that no input or secret expression reaches a `run:` block, and that `{{cliVersion}}` is the only token.
- `git diff -- cli/templates/github/workflows/harness-run.yml` touches only the `Push the branch` step and its comment.

**Deviations from plan:**

- Each summary line is written as a `- <line>` list item under the heading, so consecutive lines render as separate items rather than one Markdown paragraph; the captured line itself is unchanged.
- The new case's `spawnSync` env blanks `MAIN_REPO_ANCHOR_VARIABLE`, as the run-actor gate case does; the plan did not name it, and the tree guard `cli/test/main-anchor-isolation.test.mjs` (selected by `cli/test/**/*.mjs`) failed until it was added.
