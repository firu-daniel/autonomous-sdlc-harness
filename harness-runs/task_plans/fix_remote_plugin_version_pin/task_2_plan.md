### Task 2 — Add `init --upgrade-workflows` and report what it re-rendered

**Goal:** Make upgrading one command: `npx autonomous-sdlc-harness@<version> init --upgrade-workflows`. It re-renders the two remote-execution workflows at that CLI's version when `harness-run.yml` was rendered for another, keeps a `.bak` of each replaced file, carries the cron schedule, and tells the adopter what changed and where their previous copy is.

**Depends on:** Task 1, which exports these from `cli/src/generators/githubWorkflows.ts`, named exactly so:

- `UPGRADE_WORKFLOWS_FLAG` (`'--upgrade-workflows'`).
- `upgradeWorkflowsCommand(version: string): string`.
- The option `upgrade?: boolean` on `GithubWorkflowsOptions`.
- The result field `upgrade?: WorkflowUpgrade`, where `WorkflowUpgrade` is `{ renderedFor: readonly string[]; to: string; replaced: boolean; cron: readonly string[] | undefined }`. It is present exactly when the option was true, remote execution applies and `harness-run.yml` existed.

This task owns the flag, the wiring and the report. What gets replaced, and when, is Task 1's decision, and this task does not re-derive it.

### Targets

- `cli/src/commands/init.ts` — the flag row, the `InitFlags` key, the wiring and the report.
- `cli/test/init.test.mjs` — the cases below.

**Work:**

- [ ] `init.ts`: add `readonly upgradeWorkflows?: boolean` to `InitFlags`, with a doc comment. Add an `INIT_OPTIONS` row: `{ key: 'upgradeWorkflows', flag: UPGRADE_WORKFLOWS_FLAG, kind: 'switch', summary: "Re-render the two remote-execution workflows at this CLI's version, after a .bak, when harness-run.yml was rendered for another" }`. Place it last and extend the table's ordering comment. It carries no `configValue`: it is a run-shape row, so add it to the `InitOption` type header's list of run-shape rows next to `PLUGIN_ROOT_ENTRIES_FLAG`.
- [ ] `init.ts`: pass `upgrade: flags.upgradeWorkflows === true` to the existing `writeGithubWorkflows({ repoRoot, config: effective, plan })` call.
- [ ] `init.ts`, after the plan is applied, report through `ctx.report`. Never use `console`. Stand each command on its own line, as `reportGithubSteps` does.
  - Flag given, but `remoteExecutionApplies(effective)` false: `ctx.report.warn(...)` saying there is no workflow to upgrade because `execution.target` is not `github-actions`.
  - `result.upgrade?.replaced`: an info line naming the old pin(s) and the new version. For each replaced workflow, name its `<path>.bak` and give the command `git diff --no-index <path>.bak <path>`. Say whether the cron was carried, naming the expressions, or the template's default stands. Say the `.bak` files are not to be committed. Say that the runner, the timeouts and the stop switch are repository variables and were not touched.
  - `result.upgrade` present but not replaced: one info line that the workflows are already rendered for this version, so nothing was upgraded.
  - The existing `reportGithubSteps` already prints the commit-and-push steps for a replaced workflow, because its effect is not `kept`. Leave it as it is, and use `would` wording under `--dry-run`, as it does.
- [ ] `init.test.mjs`: extend the header's statement of the rules it enforces, then add these cases. Each drives the compiled CLI against a throwaway fixture with `execution.target` `github-actions`.
  - **(a) An upgrade from a planted older pin.** Build the fixture with a first `init`, then rewrite every `HARNESS_CLI_VERSION` value in `harness-run.yml` to `'0.0.1'`, add a comment line of your own to it, and change `harness-resume.yml`'s cron to `'0 * * * *'`. Then run `init --upgrade-workflows` and assert:
    - every `HARNESS_CLI_VERSION` line carries the built CLI's version;
    - `harness-run.yml.bak` holds `'0.0.1'` and your comment line, and the new file lacks the comment;
    - `harness-resume.yml` carries `'0 * * * *'`;
    - the output names both `.bak` paths.
  - **(b) Idempotence.** A second `init --upgrade-workflows` leaves both workflows and both `.bak` files byte-identical.
  - **(c) Without the flag,** a planted older pin is kept (create-if-absent is unchanged).
  - **(d) Remote execution off:** the flag prints the warning and writes no workflow.
  - **(e) `--dry-run --upgrade-workflows`** leaves the tree byte-identical, with no `.bak` created.

**Verification:**

- `bash scripts/typecheck.sh` exits 0.
- Run `cli/test/init.test.mjs`, the file this task edits, through the single-file test command the conventions document gives, if it gives one. Cases (a)–(e) pass. Case (a) is the end-to-end exercise of Task 1's generator mode, and case (b) is the idempotence assertion `.claude/context/conventions.md` → `## What accompanies a new unit of each kind` requires of a written artifact.
- `node cli/dist/cli.js init --help`, run after `npm run build`, lists `--upgrade-workflows` with its summary. The row is the table's single source, so no other edit is needed for it to appear.

**Deviations from plan:**

- Case (a) also appends a comment line to `harness-resume.yml`. With only the cron retuned, the carried-cron re-render equals the file byte for byte, so Task 1's generator does not replace it and writes no `harness-resume.yml.bak`. Cases (a) and (b) both require that `.bak`.
- The "no workflow to upgrade" warning goes into `init`'s `warnings` list. `reportLines` then emits it through `ctx.report.warn` together with the run's other caveats, not as a separate `ctx.report.warn` call at the generator's call site.
- `.claude/context/conventions.md` → `## The testing bar` names the runner, `node --test`, but states no single-file command. `cli/test/init.test.mjs` was run as `node --test test/init.test.mjs` from `cli/`, which applies that runner to the one file this unit edited.
