### Task 3 — Print upgrade-specific next steps from `init --upgrade-workflows` instead of the first-setup block

**Goal:** When `init --upgrade-workflows` replaces the run workflow, print one upgrade block: the diff against each `.bak`, then the commit and push of the upgrade with an upgrade commit message, then the in-flight sentence. Today the run also prints the five first-setup steps (`== remote execution`, `git commit -m "Add the harness workflows"`, the credential secret, the optional secrets and the runner variable), and those stop printing on an upgrade.

**Depends on:** Task 1 and Task 2.

- **Task 1** exports `IN_FLIGHT_RUNS_NOTE: string` from `cli/src/generators/githubWorkflows.ts`: one complete sentence ending in one `.`, carrying its own citation `(docs/remote-execution.md, section 7, Upgrading)`. Import and print it verbatim, and never re-spell any part of it.
- **Task 2** adds three lines to the managed `.gitignore` block: `.github/workflows/harness-run.yml.bak`, `.github/workflows/harness-resume.yml.bak` and `.claude/settings.autonomous.json.bak`. So the upgrade's `.bak` files are now ignored. The first upgrade after this release also merges those lines into an existing `.gitignore`, which is a change to a tracked file. That is why this task's `git add` must name `.gitignore` whenever the run merged into it (story index, first `Top risks:` entry). Task 2's test case in `cli/test/init.test.mjs` is already there. This task adds its own cases beside it and changes none of Task 2's.

**Where this task stops.** This task changes only `init`'s closing report. What the generator replaces, and when, stays `generators/githubWorkflows.ts` → choice 4's decision. The first-setup block (`reportGithubSteps`) is unchanged for every run that is not an upgrade that replaced something. The adopter-facing prose is Tasks 5 and 6's.

### Targets

- `cli/src/commands/init.ts`: `reportWorkflowUpgrade`, its call site at the end of the init command's body (the `workflows.upgrade !== undefined` block and the `freshWorkflows` call to `reportGithubSteps`), and the doc comments of both report functions.
- `cli/test/init.test.mjs`: new cases in the suite `'init --upgrade-workflows re-pins an older workflow after a .bak, and nothing else does'`.

**Work:**

- [ ] Call site: when `workflows.upgrade?.replaced === true`, call `reportWorkflowUpgrade` and **do not** call `reportGithubSteps`. When the upgrade replaced nothing, or no upgrade ran, keep today's behaviour exactly, including the first-setup block for a workflow this run created.

  Pass `reportWorkflowUpgrade` three new inputs:
  - `defaultBranch: string` (`effective.defaultBranch`);
  - `workflowPaths: readonly string[]`: today's `freshWorkflows`, meaning every workflow this run created or replaced, repo-relative;
  - `mergedPaths: readonly string[]`: the repo-relative path of every `applied` result whose `policy` is `merge-lines` or `merge-json`, whose `effect` is `merged` or `created`, and whose target is inside the repository. This is `.gitignore` after Task 2's lines arrive, and `.claude/settings.json` or `.mcp.json` when those merged.

  Build `mergedPaths` in the same repo-relative spelling the `workflows.workflows[].repoPath` values use, with forward slashes. Take the relative-path helper `cli/src/core/` already provides rather than a new one. Grep before adding.
- [ ] `reportWorkflowUpgrade` body, after the existing diff commands and cron line:
  - Replace `Do not commit the .bak files.` with a sentence saying the `.bak` files are ignored by the managed `.gitignore` block, so `git add -A` leaves them out, and can be deleted once compared.
  - Keep the runner and timeouts sentence.
  - Then print numbered steps in `reportGithubSteps`' layout, one pasteable command per line through the same `command()` indentation:
    1. `git status --short`
    2. `git add <workflowPaths and mergedPaths, space-joined>`
    3. `git commit -m "Upgrade the harness workflows to <upgrade.to>"`, the message `docs/remote-execution.md` → `### Upgrading` already prints
    4. `WORKFLOW_SCOPE_COMMAND`
    5. `defaultBranchPushCommand(defaultBranch)`

    The prose before them carries `WORKFLOW_SCOPE_REASON` and `defaultBranchPushReason(defaultBranch)`, both imported from `core/defaultBranchPush.ts` as `reportGithubSteps` does.
  - End with `IN_FLIGHT_RUNS_NOTE` on its own line.
  - Under `--dry-run`, keep the module's existing tense switch (`would re-render` / `would be`).
- [ ] Doc comments. `reportWorkflowUpgrade` currently "leaves the commit-and-push steps to `reportGithubSteps`". Rewrite it to say it owns the upgrade's steps, and why `mergedPaths` is in the `git add`: the job's own `init` fails its setup step on a changed tracked file. Rewrite `reportGithubSteps`' comment to say it is the first-setup block and is not printed for an upgrade that replaced a workflow.
- [ ] `init.test.mjs`, new case (a), from `agedWorkflowFixture`: `initOk(dir, [UPGRADE_WORKFLOWS])`.
  - stdout includes `git status --short`, `git add ` naming both workflow paths, `Upgrade the harness workflows to ${version}`, `gh auth refresh -s workflow`, `git push --no-verify origin ${defaultBranch}` and the fragment `finishes on the version it started with`.
  - stdout includes none of `Add the harness workflows`, `gh secret set`, `gh variable set` or `Do not commit the .bak files`.
- [ ] `init.test.mjs`, new case (b): from `agedWorkflowFixture`, first delete the three `.bak` lines Task 2 added from the fixture's `.gitignore`, to simulate a block written by an earlier release. Then run the upgrade.
  - The `git add` line names `.gitignore`.
  - In a second fixture whose block already carries the lines, the `git add` line does not name `.gitignore`.
  - Keep the existing `'--dry-run --upgrade-workflows leaves the tree byte-identical, with no .bak'` case green.

**Verification:**

- Run the edited `cli/test/init.test.mjs` under `unit_loop_core.md` → `## The test-run rule` (3). The two new cases pass, and so do the existing ones: the first-setup case `'turned on, init writes both files from their templates and reports the GitHub-side steps'` still sees `Add the harness workflows`, and the upgrade cases still see each `.bak` named in a diff command.
- Exercise the path end to end in a throwaway fixture under the system temp directory, never in this checkout:
  1. Wire the fixture with remote execution on.
  2. Age the pin to `0.0.1` and delete Task 2's lines from `.gitignore`.
  3. Run the built CLI's `init --upgrade-workflows`.
  4. Run the printed `git add` and `git commit` lines verbatim.
  5. Then `git status --porcelain --untracked-files=no` prints nothing, and `git status --porcelain` lists neither `.bak`. This is the property the remote job's setup step relies on.
- Grep `cli/src/commands/init.ts` for `finishes on the version it started with`. There is no hit: the sentence reaches the report only through the imported `IN_FLIGHT_RUNS_NOTE`.
