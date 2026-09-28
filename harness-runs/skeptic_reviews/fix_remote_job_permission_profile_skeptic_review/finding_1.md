### 1. The §7 upgrade step says a plain `init` "touches nothing else" and commits only the workflows, but `init` also rewrites `.gitignore`, so the next job fails at its setup step

**File:** `docs/remote-execution.md` (`## 7. Turning it on`, the paragraph that opens "It lands on the default branch because every run's branch is cut from …", after the three fenced untrack commands). The quoted text is "Delete them and run a plain `init`, which re-creates each one under create-if-absent at this CLI's version and touches nothing else. Re-apply any timeout, runner or cron tuning from the deleted copies in git history, then commit and push them as above."

This sentence came in with code-review Finding 4's fix (commit `c3ca11d`), which that review did not raise. It is aimed at a repository adopted with 0.4.0 or earlier, and in that repository it is false.

**Why it is false.** This branch adds a rule and its comment to the managed `.gitignore` block (`cli/templates/repo/gitignore` → `{{permissionProfilePath}}` and the `# The unattended run's permission profile. …` comment lines; `cli/src/generators/repoRoot.ts` → `permissionProfilePath: PROFILE_PATH`, ungated). It also rewords an existing comment line in that block: `# The per-machine settings file the agent runner writes beside the committed profiles.` becomes `# The per-machine settings file the agent runner writes.`. The block is written under `merge-lines` (`cli/src/generators/repoRoot.ts` → `policy: 'merge-lines'`). That policy adds every payload line not already present anywhere in the file, comment lines included (`cli/src/core/writer.ts` → `planMergeLines`: `const missing = wanted.filter((line) => !present.has(line))`, then effect `'merged'`). A `.gitignore` written by 0.4.0 has none of those lines. So a plain 0.4.1 `init` in that repository changes the tracked file `.gitignore` as well as re-creating the two workflows.

**The runtime symptom, and why it is reachable.** The paragraph's "commit and push them as above" points back to step 3, whose commit is `git add .github/workflows/harness-run.yml .github/workflows/harness-resume.yml`, which does not include `.gitignore`. An adopter who follows the text pushes the re-rendered workflows and leaves `.gitignore` uncommitted. The next job checks out `origin/<default branch>`, which still has the 0.4.0 `.gitignore`. Its `Generate the job's permission profile` step then runs `init --plugin-root-entries` at the workflow's newly pinned 0.4.1 version (`cli/templates/github/workflows/harness-run.yml`). That run merges the same lines into `.gitignore`, and the step's own guard stops it:

```
changed=$(git status --porcelain --untracked-files=no)
if [ -n "$changed" ]; then … echo "::error::init $HARNESS_CLI_VERSION changed tracked files. …"; exit 1
```

So the job ends at setup with `M .gitignore`. The upgrade procedure exists to get the job to `doctor --remote-job`, and following it as written means the job never reaches that step. Every repository this paragraph is written for is in this state, because by definition none of them has the 0.4.1 ignore lines. The doctor-printed untrack route (`cli/src/doctor/checks.ts` → `profileUntrackRemedy`) runs no `init` and does not repair this.

**Fix:** state the `.gitignore` change and commit it with the workflows. In that paragraph of `docs/remote-execution.md`, replace

> Delete them and run a plain `init`, which re-creates each one under create-if-absent at this CLI's version and touches nothing else. Re-apply any timeout, runner or cron tuning from the deleted copies in git history, then commit and push them as above.

with

> Delete them and run a plain `init`, which re-creates each one under create-if-absent at this CLI's version. It also merges this release's ignore rule for the profile, with its comment, into the managed `.gitignore` block, and nothing it already carries changes. Commit `.gitignore` with the workflows: left uncommitted, the job's own `init` makes the same change, and its setup step fails on any changed tracked file. Re-apply any timeout, runner or cron tuning from the deleted copies in git history, then stage all three and commit and push as above.

Leave the sentence that follows (`init --force` would re-render them too, …) and the two fenced blocks after it (`git rm .github/workflows/harness-run.yml .github/workflows/harness-resume.yml` and `npx autonomous-sdlc-harness init`) unchanged. Directly after the `npx autonomous-sdlc-harness init` fenced block, add one fenced block of its own, following the one-command-per-block form the rest of §7 uses:

> ```
> git add .github/workflows/harness-run.yml .github/workflows/harness-resume.yml .gitignore
> ```

This is a documentation change only. No test pins this paragraph.
