### 4. The `--upgrade-workflows` report sends every adopter to `init --force` for the forge workflows, including adopters who have none

**File:** `cli/src/commands/init.ts` (`reportWorkflowUpgrade`) — "carry the list into the trigger and the comment commands only once init --force has replaced them."

`reportWorkflowUpgrade` now prints two allow-list sentences on every upgrade that replaced a workflow. The second one names `harness-trigger.yml`, `harness-control.yml` and the scripts, and says only `init --force` carries the list into the trigger and the comment commands.

Those two workflows exist only where `forge` is `github` and `execution.target` is `github-actions`. On any other remote-execution setup, `init` never wrote them, and the trigger and comment commands do not exist. But the sentence still prints there, and the only remedy it names is `init --force`. That command regenerates every generated file after a `.bak`, `.claude/CLAUDE.md` and the analyzed conventions documents included (`docs/remote-execution.md` → `### Upgrading`). An adopter without forge workflows who follows the sentence pays that cost for nothing.

The caller already knows whether the forge workflows apply: `workflows.trigger` is what it passes to `reportGithubSteps`.

**Fix:**

- [ ] Add `readonly trigger: boolean;` to `reportWorkflowUpgrade`'s `options` type, with the doc comment `/** Whether the forge workflows apply, so the trigger and the comment commands exist. */`, and destructure it.
- [ ] At the `reportWorkflowUpgrade(ctx, { … })` call site, pass `trigger: workflows.trigger`.
- [ ] Print the second sentence only when `trigger` is true:

  ```ts
  if (trigger) {
    ctx.report.info(
      `${WORKFLOW_TRIGGER_FILE}, ${WORKFLOW_CONTROL_FILE} and the scripts carry the list into the trigger and the comment commands only once init --force has replaced them.`,
    );
  }
  ```

  Leave the first sentence and its `gh variable set` command unconditional.
- [ ] In `cli/test/trigger-workflow-init.test.mjs`, add a case beside the existing upgrade assertions. Build a fixture with `forge` absent and `execution.target` `github-actions`, run `init`, rewrite `harness-run.yml`'s pin to `0.0.1` the way the existing upgrade case does, and run `init --upgrade-workflows`. Assert that the `== workflow upgrade` block names `HARNESS_RUN_ACTORS` and names neither `harness-trigger.yml` nor `init --force`.

The only test file this fix edits is `cli/test/trigger-workflow-init.test.mjs`, so that is the only test it runs.
