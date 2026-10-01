### 2. Turning the trigger on in an already-wired repository leaves scripts with no `trigger` verb, so the trigger job fails with no comment on the issue

> **Self-contained per-finding file** for the `feat_forge_run_triggers` skeptic-review index (`harness-runs/skeptic_reviews/feat_forge_run_triggers_skeptic_review.md`). The implementer reads only this file. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `docs/github-issue-trigger.md` → `## Turning it on, in short`, steps **2** ("**2. Write the trigger workflow.**") and **3** ("**3. Commit it and push it to GitHub's default branch.**").

**Problem.** The turn-on route tells an adopter to set `forge`, run a plain `npx autonomous-sdlc-harness init`, then commit and push `.github/workflows/harness-trigger.yml`. The trigger workflow's last step runs `bash "$SCRIPTS_DIR/remote-run.sh" trigger` against the scripts committed on the default branch (`cli/templates/github/workflows/harness-trigger.yml` → `Start the run`).

Those scripts are `create-if-absent`. `docs/cli.md` → `## 3. The re-run contract` says of them: "a fix shipped in the package reaches an already-wired repository only through `--force`". Every repository adopted before this release already has `<scriptsDir>/remote-run.sh` and `<scriptsDir>/lib/harness-run-lib.sh`, and neither carries anything this branch added: the `trigger`, `start` and `adopt` verbs, `hr_forge`, `hr_derive_branch` or the placement functions. Any adopter who turns the trigger on for an existing repository is in this position. That includes every adopter who already runs remote execution, since that shipped in the previous release.

What happens when the documented steps are followed on such a repository:

- The trigger job reaches `remote-run.sh`'s verb check, `case "$verb" in … *) usage "unknown verb '$verb'"`. That exits 1 before any event is read.
- No comment is posted and the label is not removed. The only trace is a red job on the Actions tab, so the person who labelled the issue sees nothing, which breaks acceptance 4.
- The local commands' `remote-run.sh adopt` fails the same way. The commands report it and carry on, so acceptance 5 is lost silently.
- `doctor`'s new `forge` check reads only the workflow file and `origin/<defaultBranch>`, so it still **passes**: "Labelling an issue with the HARNESS_TRIGGER_LABEL label (default `harness`) starts a task run".

`docs/remote-execution.md` → `### Upgrading` states the general rule ("It does not re-render the outer-loop scripts … `init --force` remains their route"). But `docs/github-issue-trigger.md` is the document of record for turning this feature on, and its steps never send the reader there.

**Fix.** These are prose edits only. Change no code.

- [ ] In `docs/github-issue-trigger.md` → `## Turning it on, in short`, directly after step 2's fenced `npx autonomous-sdlc-harness init` block, add this paragraph and fenced block:

  > **A repository wired by an earlier release also needs its scripts brought current.** The trigger job runs `remote-run.sh trigger` from the scripts on the default branch, and `init` keeps existing outer-loop scripts as they are ([`cli.md`](cli.md) → `## 3. The re-run contract`). Scripts written before this release have no `trigger`, `start` or `adopt` verb. On such scripts the job fails with `remote-run.sh: unknown verb 'trigger'` and posts no comment on the issue, and `doctor`'s `forge` check does not see it. `--force` replaces the scripts, each after a `.bak`. What else it regenerates is listed in [`remote-execution.md`](remote-execution.md) → `### Upgrading`.
  >
  > ```
  > npx autonomous-sdlc-harness init --force
  > ```

- [ ] In step 3, change "Add the two run workflows to the same commit when step 1 turned remote execution on." to "Add the two run workflows to the same commit when step 1 turned remote execution on, and every file under your scripts directory that `init --force` replaced in step 2, which this lists:". Add a fenced block holding only `git status --short` directly after that sentence, before the existing `git add .github/workflows/harness-trigger.yml` block.

Every command an adopter runs sits in its own fenced block, one command per line (`harness-runs/lessons.md` → `## Adopter-facing documentation`). No test covers this prose, so no test run is owed.

**Deviations from plan:** Step 3's paragraph continued past the edited sentence with "The `workflow` scope and `--no-verify` are explained in …". The `git status --short` block sits directly after the edited sentence, so "which this lists:" introduces it, and that remaining sentence now follows the block, before the existing `git add` block. Checked against the script before writing it: `remote-run.sh`'s `usage` prints `remote-run.sh: $1`, with `unknown verb '$verb'` as its argument, on both `dev` and this branch, so the quoted message is exact.
