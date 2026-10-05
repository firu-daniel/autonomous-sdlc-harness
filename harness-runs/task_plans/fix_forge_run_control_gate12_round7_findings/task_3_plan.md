### Task 3 — `init` reports the control-workflow repair, and warns on an edited unparseable copy

**Goal:** Make the repair Task 2 performs, and the edited copy Task 2 recognises, visible in `init`'s own output. That output is the first place a 0.6.1 adopter who upgrades the CLI looks. It must say:
- what was wrong;
- what was done;
- how to compare the result;
- the exact commands to commit and push the fixed file.

The last point matters because a repaired file left uncommitted fails the next run job. That job's own `init` step (`harness-run.yml`, the `init --plugin-root-entries` step) refuses a changed tracked file with `init <version> changed tracked files.`

**Depends on:** Task 2. This task consumes the following, all from `cli/src/generators/githubWorkflows.ts`:
- **`GithubWorkflowsResult.controlRepair`**, with this type:
  ```ts
  { readonly kind: 'replaced'; readonly release: string } | { readonly kind: 'edited' } | undefined
  ```
  - `'replaced'` means the plan replaces `.github/workflows/harness-control.yml` after a `.bak`, `release` naming whose copy it was (`'0.6.1'`).
  - `'edited'` means the file carries 0.6.1's unparseable `if:` line and was kept.
- **`unparseableControlRoute(version: string): string`**, the one sentence naming the route. It is complete sentences ending in one `.`, with no line break.
- **`pinnedCliCommand(version)`**.

This task restates that contract so it never re-derives the decision. Which file is replaced, and when, is Task 2's; this task only reports it. Task 2 also owns `cli/test/trigger-workflow-init.test.mjs`, and this task adds cases to it, after Task 2's.

**Where this task stops.** It changes no write decision and no file `init` writes, and it does not touch `doctor`: `doctor`'s failure is Task 4's.

### Targets

- `cli/src/commands/init.ts`: a report function for the repair and the warning, and the first-setup filter beside `freshWorkflows`.
- `cli/test/trigger-workflow-init.test.mjs`: the report cases.

**Work:**

- [ ] **`init.ts`, a new `reportControlRepair` beside `reportWorkflowUpgrade`.** Give it a doc comment in the same style, and output written through `ctx.report` only.
  - **`kind: 'replaced'`** prints:
    - one `step('workflow repair')`;
    - an `info` line saying that `.github/workflows/harness-control.yml` was the copy `<release>` wrote, which GitHub cannot parse, so no comment, review, close or deletion reached the harness. The line goes on to say that this run re-rendered it, or would re-render it under `--dry-run`, and that the previous copy is kept beside it as a `.bak`;
    - the `git diff --no-index <path>.bak <path>` command on its own line, through the file's `command()` indentation helper;
    - a sentence that the `.bak` is not ignored, so delete it once compared.
  - **Then the commit-and-push commands.** When no upgrade block owns the commit, it prints them each on its own line:
    - `git add .github/workflows/harness-control.yml`;
    - `git commit -m "Repair the harness control workflow"`;
    - `WORKFLOW_SCOPE_COMMAND`;
    - `defaultBranchPushCommand(defaultBranch)`.

    It ends with the reason sentence those steps already carry elsewhere: `WORKFLOW_SCOPE_REASON` and `defaultBranchPushReason`, imported, never re-spelled. When `workflows.upgrade?.replaced === true`, the upgrade block already prints a `git add` that names this path (its `workflowPaths`), so this block prints only its explanation and the diff line.
  - **`kind: 'edited'`** prints one `ctx.report.warn` line. It names the file and says it carries the job `if:` 0.6.1 wrote, which GitHub cannot parse, so the workflow runs for no event. It says this run kept the edited copy. It then appends `unparseableControlRoute(version)` with `version` from `ownManifestString('version')`. A warning prints under `--quiet` too, as every `warn` does.
- [ ] **`init.ts`, the call site.** Call the new function after `applied` is known, and after `reportWorkflowUpgrade` when that runs. Remove the repaired control path from the list handed to `reportGithubSteps`, so a repair alone never prints the first-setup block (secrets, label, runner). A path this run freshly created still goes to that block as today. A replaced control file must stay in `freshWorkflows` for `reportWorkflowUpgrade`'s `git add` line.
- [ ] **`trigger-workflow-init.test.mjs`.** Use Task 2's fixture `cli/test/fixtures/harness-control-0.6.1.yml` to plant 0.6.1's copy. Add these cases:
  1. **Plain `init` over 0.6.1's copy.** Stdout carries the repair explanation, the `git diff --no-index … .bak …` line, and `git add .github/workflows/harness-control.yml` on its own line. It does **not** carry `gh secret set` (no first-setup block).
  2. **`init --upgrade-workflows` over 0.6.1's copy, with `harness-run.yml`'s pin planted as an older version.** The upgrade block's `git add` line names `.github/workflows/harness-control.yml`, and the repair block prints no second `git add`.
  3. **`init --upgrade-workflows` with the pin already current.** The repair block prints its own `git add`.
  4. **`--dry-run`.** The text says "would", and the tree is unchanged.
  5. **An edited copy.** Exit 0. Stderr carries one warning naming `.github/workflows/harness-control.yml`, `if: >-` and `init --force`. Nothing is replaced.
  6. **The current template on disk.** No repair or warning text at all.

**Verification:**

- From `cli/`, run `npm test -- test/trigger-workflow-init.test.mjs`. It passes with Task 2's cases and these.
- `bash scripts/typecheck.sh` exits 0.
- The story index's first `Top risks:` entry is an uncommitted repair. Cases 1 to 3 together show that every printed route to a commit names `.github/workflows/harness-control.yml`, whichever block prints it. Read their assertions for that, not only for the explanation text.
- Grep `cli/src/commands/init.ts` for the route sentence's words (`if: >-`, `init --force`), and find them only through `unparseableControlRoute`.
