### Task 5 — Document in `### Upgrading` what an upgrade does to a run in flight, and the route to move one on purpose

**Goal:** Make `docs/remote-execution.md` → `### Upgrading` say three things:

- an upgrade applies to runs dropped after the push, and a run in flight finishes on the version it started with;
- how to move one run in flight to the new version on purpose;
- what the upgrade's report and `doctor`'s warning now say about the `.bak` files, the `git add` and runs in flight.

**Depends on:** Tasks 1, 2 and 3, whose behaviour this section describes. It is the section the CLI's sentence points at.

- **Task 1:** `doctor`'s `remote-execution` warning for an older pin now carries the sentence *"An upgrade reaches only the runs dropped after it is pushed: each run's branch carries the workflows it was cut with, so a run already in flight finishes on the version it started with, and moving one on purpose is a separate step (docs/remote-execution.md, section 7, Upgrading)."*
- **Task 2:** the managed `.gitignore` block ignores `.github/workflows/harness-run.yml.bak`, `.github/workflows/harness-resume.yml.bak` and `.claude/settings.autonomous.json.bak`. Every other `--force` `.bak` stays visible.
- **Task 3:** `init --upgrade-workflows` prints, when it replaced the run workflow, `git status --short`, then a `git add` naming the replaced workflows plus every shared file the run merged into (`.gitignore` included when it changed), `git commit -m "Upgrade the harness workflows to <version>"`, `gh auth refresh -s workflow`, `git push --no-verify origin <default branch>`, and the sentence above. It no longer prints the first-setup steps.

**How this task's implementer reads the conventions.** This is the catch-all layer, so read `.claude/context/conventions.md` (its `## Documents of record`) and both `.claude/context/cli.md` and `.claude/context/plugin.md`. Also apply the lessons ledger rule on commands: every command an adopter is meant to run sits in its own fenced block, one command per line, never inline and never joined by prose. The section already follows that form.

### Targets

- `docs/remote-execution.md`, `### Upgrading` only.

**Work:**

- [ ] After **The model.** paragraph, add a paragraph **Runs already in flight.** stating the mechanism:
  - `remote-run.sh` dispatches every run with `--ref <branch>`, and GitHub runs the workflow file as that ref carries it (`cli/templates/scripts/remote-run.sh`, the `gh_call workflow run "$WORKFLOW_RUN_FILE" --ref "$branch"` line).
  - A run's branch is cut from the default branch when its task is dropped, so it keeps the workflows, and the pin, current then.
  - So an upgrade applies to runs dropped after the push. A run in flight keeps its version through every later dispatch: a self-pause continuation, a `/autonomous-sdlc-harness:branch-resume` and an answered park all clone that run's own tag, whatever the default branch carries.
  - Say that this is deliberate: the pin exists so that a run never changes plugin version under itself, which is why dispatching from the default branch was not taken.
- [ ] Add **Moving a run in flight to the new version, on purpose.** with the route as fenced blocks, one command each, in this order:
  1. `git fetch origin`
  2. `git switch <branch>`
  3. `git checkout origin/<default branch> -- .github/workflows/harness-run.yml .github/workflows/harness-resume.yml .gitignore`
  4. `git commit -m "Move <branch> to the harness workflows at <version>"`
  5. `gh auth refresh -s workflow`
  6. `git push origin <branch>`

  State the conditions around it:
  - **The path set is the upgrade commit's, not only the two workflows.** Say in prose, directly above the step-3 block, that the checkout takes the same paths the upgrade's printed `git add` named and you committed, and that `.gitignore` is in the block because the first upgrade after this release merges new ignore lines into it; tell the reader to append any other path that `git add` named to the same line. Give the reason: once the branch carries the new workflows, its next job runs the new version's `init` (`cli/templates/github/workflows/harness-run.yml`, step `Generate the job's permission profile`, `init --plugin-root-entries`), which would merge the missing lines into the branch's tracked `.gitignore`; that step's `git status --porcelain --untracked-files=no` test then fails the job on a changed tracked file (`init … changed tracked files`). Checking out only the two workflows therefore fails the run's very next job.
  - No `--no-verify`: the `pre-push` hook refuses only protected branches.
  - The next dispatch of that run then runs the new version.
  - **Warn** that this switches the plugin version mid-run. Work the run already did was written by the old version and is continued by the new one.
  - **Do it only while no job of that run is executing** (paused, parked or stopped). A job pushes the branch after every commit and at its end (`cli/templates/scripts/push-branch.sh`), and a push that fails because the remote moved is non-fatal by that script's own header ("EVERY FAILURE PATH IS NON-FATAL"). So a commit pushed beside a running job leaves the job's later commits off the remote without stopping it.
- [ ] Replace the sentence "Add any other tracked file `init` changed, because the job's own `init` refuses a changed tracked file." with one saying the report's printed `git add` already names every such file, `.gitignore` included when the run merged new ignore rules into it. Keep the reason (the job's own `init` refuses a changed tracked file). Replace "Carry over what you need by hand, and do not commit the `.bak` files." with: carry over what you need by hand; the managed `.gitignore` block ignores both workflow `.bak` files, so `git add -A` leaves them out; delete them once compared.
- [ ] Extend "**`doctor` says when you have not moved.**" to say the warning also states that a run already in flight keeps its version, and points back to this section.

**Verification:**

- Read the finished section against the three acceptance lines the story index's `## Scope register` quotes for it. It states the applies-after-the-push rule, the in-flight rule and the route, and warns about the mid-run version switch.
- The route's `git checkout origin/<default branch> -- …` block names `.gitignore` alongside both workflow paths, and the prose above it says to use the same path set the upgrade's `git add` named and gives the job-`init` changed-tracked-file reason.
- Every command in the new parts sits alone in its own fenced block. `grep -n 'git ' docs/remote-execution.md` finds none of the new route's commands inline in prose.
- The commit message and command spellings are the ones Task 3 prints (`Upgrade the harness workflows to <version>`, `gh auth refresh -s workflow`, `git push --no-verify origin <default branch>`). The parenthesised citation in Task 1's sentence (`section 7, Upgrading`) still names this section's `## 7.` and `### Upgrading` headings, so no heading was renamed.
