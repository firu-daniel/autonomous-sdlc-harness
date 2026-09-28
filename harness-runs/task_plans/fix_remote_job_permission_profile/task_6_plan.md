### Task 6 — Run the job's preflight as `doctor --remote-job`

**Goal:** Make the run workflow's `Preflight with doctor` step invoke `doctor --remote-job`, so the failures Tasks 4 and 5 defined stop the job before the `Run the harness` step launches a session (task prompt → `## What is wrong`, finding 3: *"the job spends a session to discover what doctor already knew"*).

**Depends on:** Task 4, which added `doctor`'s own option `--remote-job` (refused as unknown by any earlier CLI), under which `profile-paths` fails when the profile covers no path in this checkout and `plugin-permissions` fails when a required `Read`/helper entry or a plugin root in `permissions.additionalDirectories` is missing, or when no plugin root resolves. Task 5, which added `profile-tracked`, failing under the same option when the profile is committed at `HEAD`. This task only passes the option; it grades nothing.

**Why the step's version pin makes this safe.** The step runs `npx --yes "autonomous-sdlc-harness@$HARNESS_CLI_VERSION" doctor`, and `HARNESS_CLI_VERSION` is the `{{cliVersion}}` token `init` renders — so a workflow rendered by this release always runs a CLI that knows the option, and a workflow rendered by 0.4.0 keeps running 0.4.0's `doctor` without it. An adopter reaches the new preflight by re-rendering the workflow with `init --force`, which the upgrade to a new version already requires to re-pin it (`docs/cli.md` → `## 3. The re-run contract`, the `harness-run.yml` row); Task 8 says so in `docs/remote-execution.md`.

**Where this task stops.** The step order is unchanged: `Generate the job's permission profile` (`init --plugin-root-entries`, then the changed-tracked-files check) still runs first, so on an untracked checkout the profile `doctor` grades is the one the job just generated. No other step changes, and `harness-resume.yml` runs no `doctor` and is not touched.

### Targets

- `cli/templates/github/workflows/harness-run.yml` → the `Preflight with doctor` step, and any header comment describing the preflight.
- `cli/test/workflow-templates.test.mjs` — one assertion, and its header's contract list.

**Work:**

- [ ] `harness-run.yml`: change the `Preflight with doctor` step's `run:` to `npx --yes "autonomous-sdlc-harness@$HARNESS_CLI_VERSION" doctor --remote-job`. Search the file's header for a description of the preflight and extend it with one sentence on what the option turns into failures. Keep `{{cliVersion}}` the only template token and add no expression inside the `run:` block (the suite's standing contract).
- [ ] `cli/test/workflow-templates.test.mjs`: add a test asserting the step named `Preflight with doctor` runs `doctor --remote-job` and comes after the step named `Generate the job's permission profile` and before `Run the harness`; add that contract to the file's header paragraph.

**Verification:**

- The new test in `cli/test/workflow-templates.test.mjs` passes, and the file's existing tests still do.
- `grep -n "doctor --remote-job" cli/templates/github/workflows/harness-run.yml` returns the preflight step.
- The argument the step passes is byte-identical to the option name `cli/src/commands/doctor.ts` declares (`REMOTE_JOB_FLAG`, Task 4) — compare the two by reading, since a misspelling here is refused by `doctor` as an unknown option and fails every job at the preflight. The end-to-end proof on a real runner is the Gate 12 re-run, which is out of this branch's scope.
