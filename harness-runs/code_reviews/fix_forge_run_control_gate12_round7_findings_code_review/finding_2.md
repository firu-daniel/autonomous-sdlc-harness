### 2. Under `--upgrade-workflows`, the upgrade block also lists the repaired control workflow and says its `.bak` is ignored, which contradicts the repair block

**File:** `cli/src/commands/init.ts` (`run`, the `if (workflows.upgrade !== undefined)` block) — "const replacedWorkflows = workflows.workflows"; and `reportWorkflowUpgrade` — "The .bak files ${dryRun ? 'would be' : 'are'} ignored by the managed .gitignore block, so git add -A leaves them out".

**Problem.** The case is `init --upgrade-workflows` with an older `harness-run.yml` pin over 0.6.1's unedited `harness-control.yml`. The plan replaces `harness-control.yml` through the repair's `forceOverride: 'always'`, so its effect is `backed-up-and-replaced`. That puts it in `replacedWorkflows`, and `reportWorkflowUpgrade` then:

- prints `git diff --no-index .github/workflows/harness-control.yml.bak .github/workflows/harness-control.yml` under "Each previous copy is kept beside it as a .bak; compare it with:";
- states, for every one of those `.bak` files, that "The .bak files are ignored by the managed .gitignore block, so git add -A leaves them out".

`reportControlRepair` then prints the same diff line a second time, followed by "The .bak is not ignored by the managed .gitignore block, so delete it once compared." One run's output therefore makes two contradictory claims about one file. The upgrade block's claim is the false one: `cli/src/generators/repoRoot.ts` ignores only the two remote-execution workflows' `.bak` files, and choice 6 in `cli/src/generators/githubWorkflows.ts` keeps the repair's `.bak` deliberately un-ignored. An adopter who trusts the upgrade block and runs `git add -A` commits `harness-control.yml.bak`.

The existing case `--upgrade-workflows with an older pin: the upgrade block's git add names the control file, the repair prints none` in `cli/test/trigger-workflow-init.test.mjs` checks the `git add` lines. It does not check the diff line or the `.bak` sentence, so it passes over this.

**Fix.**

- [ ] In `cli/src/commands/init.ts` → `run`, leave the repaired control workflow out of the list the upgrade block reports. The repair block already prints its own diff line and its own `.bak` note. Keep `workflowPaths: freshWorkflows` unchanged, so the upgrade's `git add` still names the file:

  ```ts
      const replacedWorkflows = workflows.workflows
        .filter(({ absolute }) => applied.find((r) => r.path === absolute)?.effect === 'backed-up-and-replaced')
        .map(({ repoPath }) => repoPath)
        // A repaired control workflow's diff line and its un-ignored .bak are reportControlRepair's to print.
        .filter((path) => !(workflows.controlRepair?.kind === 'replaced' && path === WORKFLOW_CONTROL_PATH));
  ```

- [ ] In `cli/test/trigger-workflow-init.test.mjs`, the case `--upgrade-workflows with an older pin: the upgrade block's git add names the control file, the repair prints none`: after the existing assertions, add an assertion that the control workflow's diff line is printed exactly once:

  ```js
      assert.equal(
        stdout.split('\n').filter((line) => line.trim() === DIFF_LINE).length,
        1,
        `the control workflow's diff line is not printed exactly once:\n${stdout}`,
      );
  ```

  `DIFF_LINE` is already declared in that test's scope.

Verify with `npm test -- test/trigger-workflow-init.test.mjs` from `cli/`. It is the one test file this fix edits; the full suite runs later, in the gates phase.
