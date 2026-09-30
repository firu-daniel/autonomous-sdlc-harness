### Task 1 — Add the workflow pin reader and an upgrade mode to the workflow generator

**Goal:** Give the CLI one reader for the version a rendered `harness-run.yml` is pinned to, and teach the workflow generator a mode that re-renders both workflows at this CLI's version when that pin differs. The mode replaces each file only after a `.bak`, and carries the adopter's cron schedule into the new `harness-resume.yml`. Later tasks consume this: `init --upgrade-workflows` (Task 2) and `doctor` (Task 3).

**Where this task stops.** This task adds an option and a result field to the generator. It parses no flag and prints nothing: the `--upgrade-workflows` row, the wiring from flag to option and every report line are **Task 2's**, and the tests that drive the mode through the compiled CLI land there too. The end-to-end coverage of this task's upgrade path is therefore Task 2's, not a verification step of this task: the Task 2 test cases cover a planted older pin, the `.bak`, the carried cron and an idempotent second run. The version warning is **Task 3's**. It edits neither workflow template; the install step and both template headers are **Task 4's**, so the template's shape is read here and never changed.

### Targets

- `cli/src/remote/githubActions.ts` — the pin constant and its reader.
- `cli/src/generators/githubWorkflows.ts` — the flag constant, the route producer, the upgrade option, the cron carry and the result field.
- `cli/src/core/writer.ts` — the module header's re-run table rows for the two workflows, and its per-request override paragraph.

**Work:**

- [ ] `githubActions.ts`: declare the pin constant and its reader. Nothing else in `cli/src` may spell this variable as a literal after this task. Its doc comment names `cli/templates/github/workflows/harness-run.yml` as the mirror, which the module header already lists.
  - The constant is `export const CLI_VERSION_VARIABLE = 'HARNESS_CLI_VERSION';`.
  - The reader is `export function renderedCliVersions(text: string): readonly string[]`. It returns the value of every line of the form `<indent>HARNESS_CLI_VERSION: <value>`, where the value may be single-quoted, double-quoted or bare. Values are distinct, in file order, with the quotes stripped. The result is `[]` when no such line exists.
  - It is pure: it does no filesystem read, which keeps the module's *"It reads no configuration and writes nothing"* true.
- [ ] `githubWorkflows.ts`: add the flag constant and the one producer of the route string. Task 2's report and Task 3's warning both call this producer, so neither retypes the command.
  - `export const UPGRADE_WORKFLOWS_FLAG = '--upgrade-workflows';`
  - `export function upgradeWorkflowsCommand(version: string): string`, which returns `npx <name>@<version> init --upgrade-workflows`. `<name>` is `ownManifestString('name')`, the reader this module already uses for `version`, which gives `npx autonomous-sdlc-harness@0.5.0 init --upgrade-workflows` for this package.
- [ ] `githubWorkflows.ts`: add `readonly upgrade?: boolean` to `GithubWorkflowsOptions`. When it is true, remote execution applies (`remoteExecutionApplies(config)`) and `WORKFLOW_RUN_PATH` exists under `repoRoot`:
  - Read that file and take `pins = renderedCliVersions(text)`. The generator may read the tree, but never write it.
  - The run workflow **needs an upgrade** when `pins` is empty or any pin differs from `ownManifestString('version')`.
  - When it needs one: enqueue the run request with `forceOverride: 'always'`, which is the write engine's `.bak`-then-replace mechanism rather than a new policy. Build the resume request from the template with the cron carried (next bullet), and give it `forceOverride: 'always'` only when a resume file exists and its bytes differ from that render.
  - When it does not: add no override to either request, so both are `kept` and a second run changes nothing.
  - The result gains `readonly upgrade?: WorkflowUpgrade`, exported as `{ readonly renderedFor: readonly string[]; readonly to: string; readonly replaced: boolean; readonly cron: readonly string[] | undefined }`. It is present exactly when the option was true, remote execution applies and the run file existed. `replaced` is true when the run request carries the override. `cron` holds the carried expressions, or is `undefined` when none were read and the template's default stands.
- [ ] `githubWorkflows.ts`: the cron carry. Take every line of the existing `harness-resume.yml` matching `/^\s*- cron: /`, in order, and substitute them for the template's single `- cron:` line, re-indented to the template's indentation. With no existing file, or no such line, keep the template text unchanged. Add a fourth numbered choice to the module header:
  - why a per-request `'always'` rather than a fifth policy;
  - why the pin is the condition, which makes the mode idempotent;
  - what the cron carry buys, and that every other edit survives only in the `.bak`. The runner and the timeouts are repository variables the re-render does not touch.
- [ ] `writer.ts` header: amend the two workflow rows of `## The re-run contract, per artifact`. Each names `init --upgrade-workflows` as the upgrade path — after a `.bak`, only when the rendered pin differs, and for `harness-resume.yml` carrying its `- cron:` lines — and keeps `--force` as the blunt alternative. Add `generators/githubWorkflows.ts` to the paragraph that lists the callers that answer `forceOverride` per request, next to `generators/githooks.ts`.

**Verification:**

- `bash scripts/typecheck.sh` exits 0. `noUnusedLocals` passes because Task 2 is the first caller of `upgrade`, and this task exports everything it adds.
- `git grep -n "HARNESS_CLI_VERSION" -- cli/src` returns hits only in `cli/src/remote/githubActions.ts`, plus any doc comment that names the variable as prose.
- Every exported signature above appears in the source exactly as written here, because Tasks 2, 3 and 4 restate them.
