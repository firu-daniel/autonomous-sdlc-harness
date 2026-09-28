### 5. `init` prints "This run wrote harness-run.yml and harness-resume.yml" when it kept both files

**File:** `cli/src/commands/init.ts` (`run`, and `reportGithubSteps`) — "if (workflows.written) reportGithubSteps(ctx, effective.defaultBranch, ctx.flags.dryRun);"

**Problem.** `writeGithubWorkflows` returns `{ written: true }` whenever remote execution applies, because it enqueues both files under `create-if-absent`. `init` gates the whole `remote execution` block on that flag. So every `init` over a repository that already has the workflows prints:

- "1. This run wrote .github/workflows/harness-run.yml and .github/workflows/harness-resume.yml. Commit and push both…";
- the `git add` / `git commit` / `git push` lines;
- the secret and variable steps.

The write engine has kept both files, and the action log above the block says so. The sentence is false, and it tells the adopter to commit and push files they have not changed. It is printed on every unforced re-run, and in every remote job, whose `Generate the job's permission profile` step runs `init --plugin-root-entries` over a checkout that already carries both workflows.

`plan.apply` already returns every request's `effect` (`cli/src/core/writer.ts` → `WriteResult.effect`, identical under `--dry-run`). `init` already reads it for the permission profile (`profileWrite`).

**Fix.** Report only the workflows this run created or replaced. Print nothing when both were kept.

- [ ] In `cli/src/generators/githubWorkflows.ts`, add a field to `GithubWorkflowsResult`:
  ```ts
  /** Each workflow enqueued — its absolute target and its repo-relative path — in the order written; empty when remote execution does not apply. */
  readonly workflows: readonly { readonly absolute: string; readonly repoPath: string }[];
  ```
  Return `{ written: false, workflows: [] }` on the early return. Bind the two `join(repoRoot, …)` values already passed to `plan.add` to `runPath` and `resumePath`, and end with `return { written: true, workflows: [{ absolute: runPath, repoPath: WORKFLOW_RUN_PATH }, { absolute: resumePath, repoPath: WORKFLOW_RESUME_PATH }] };`.
- [ ] In `cli/src/commands/init.ts` → `run`, replace the `if (workflows.written) reportGithubSteps(…)` line with:
  ```ts
  const freshWorkflows = workflows.workflows
    .filter(({ absolute }) => {
      const result = applied.find((r) => r.path === absolute);
      return result !== undefined && result.effect !== 'kept';
    })
    .map(({ repoPath }) => repoPath);
  if (freshWorkflows.length > 0) reportGithubSteps(ctx, effective.defaultBranch, ctx.flags.dryRun, freshWorkflows);
  ```
- [ ] Give `reportGithubSteps` a fourth parameter `workflowPaths: readonly string[]`. Build step 1's sentence and its `git add` line from it: `` `1. This run ${wrote} ${workflowPaths.join(' and ')}. Commit and push ${workflowPaths.length === 1 ? 'it' : 'both'} to GitHub's default branch …` `` (the rest of the sentence unchanged) and `` command(`git add ${workflowPaths.join(' ')}`) ``. Update its doc comment: "printed when this run created or replaced at least one of the two workflows". Drop the `WORKFLOW_RUN_PATH` / `WORKFLOW_RESUME_PATH` names from `init.ts`'s import from `../remote/githubActions.js` if they are no longer referenced, because `noUnusedLocals` fails the build otherwise.
- [ ] In `cli/test/init.test.mjs`, test `'the GitHub workflows arrive with execution.target github-actions, and only with it'`, subtest `'a second init changes nothing, keeps an edited workflow, and --force replaces it after a .bak'`: capture `stdout` from the second plain `initOk(dir)` and assert `!stdout.includes('--check-github')`, with the message "a re-run that kept both workflows printed the remote-execution block".
