### Task 3 — Have `doctor`'s `remote-execution` check warn on a workflow rendered for another version

**Goal:** When `harness-run.yml` is pinned to a version other than the CLI running `doctor`, `doctor` reports it as a warning, with the upgrade route and the way to stay on the pinned version. The finding is a warning and never a failure: the job installs exactly the version it names (Task 4), so nothing is broken, and moving is the adopter's choice.

**Depends on:** Task 1, which exports these, named exactly so:

- From `cli/src/remote/githubActions.ts`: `renderedCliVersions(text: string): readonly string[]`, which returns the distinct `HARNESS_CLI_VERSION` values in file order, or `[]` when there is none.
- From `cli/src/remote/githubActions.ts`: `CLI_VERSION_VARIABLE` (`'HARNESS_CLI_VERSION'`), the owning constant for the variable's name. Task 1 makes it the only spelling of that name in `cli/src`, so this task reads the name through it — never retyped as a literal, including in a message that names it to a reader (`.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`).
- From `cli/src/generators/githubWorkflows.ts`: `upgradeWorkflowsCommand(version: string): string`, which returns `npx autonomous-sdlc-harness@<version> init --upgrade-workflows`.

This task grades and repairs nothing. `doctor` only reports: the re-render is Task 2's `init` flag.

### Targets

- `cli/src/doctor/checks.ts` — `REMOTE_EXECUTION_CHECK` and its doc comment.
- `cli/test/doctor.test.mjs` — the cases below.

**Work:**

- [ ] `REMOTE_EXECUTION_CHECK`, inside the existing `if (runPresent)` branch: read `WORKFLOW_RUN_PATH`'s text, take `pins = renderedCliVersions(text)`, and compare them with `ownManifestString('version')` (from `core/paths.ts`, not retyped).
  - If any pin differs, push onto `warnings` a finding that names:
    - the pin(s) and this CLI's version;
    - the route, `upgradeWorkflowsCommand(<this CLI's version>)`, followed by committing the two workflows and pushing them with `defaultBranchPushCommand(branch)`. Reuse the `WORKFLOW_SCOPE_*` / `defaultBranchPushReason` helpers the check already calls, rather than spelling that push again;
    - the alternative of staying where it is: run `doctor` at the pinned version, `npx autonomous-sdlc-harness@<pin> doctor`.
  - If `pins` is empty, push a `notes` entry saying which version the workflow was rendered for could not be read, because it carries no `${CLI_VERSION_VARIABLE}` line. The message names the variable through the imported `CLI_VERSION_VARIABLE`, never as a literal.
  - A file that cannot be read is a note too, never a throw.
- [ ] Extend the pass text to say the workflow is rendered for this CLI's own version.
- [ ] Update the check's doc comment. The count of `warn`s grows by one, and the comment states why it is a `warn` and never a `fail`: the job installs its pin, and the adopter may stay on it deliberately. Under `--remote-job` the job runs `doctor` at the pinned version, so the finding cannot arise there.
- [ ] `doctor.test.mjs`: add cases against a throwaway fixture with remote execution on and `harness-run.yml` written by `init`:
  - with its pins rewritten to `'0.0.1'`, the `remote-execution` line is a warning that contains `init --upgrade-workflows` and `0.0.1`;
  - unmodified, no such warning appears;
  - with the `HARNESS_CLI_VERSION` lines removed, the check does not fail on that account.

**Verification:**

- `bash scripts/typecheck.sh` exits 0.
- `git grep -n "HARNESS_CLI_VERSION" -- cli/src/doctor` returns no hits outside doc comments: every spelling in code, messages included, goes through `CLI_VERSION_VARIABLE`.
- Run `cli/test/doctor.test.mjs`, the file this task edits, through the single-file test command the conventions document gives, if it gives one. The new cases pass.
- End-to-end with Task 2: in a fixture whose pin was rewritten, `doctor` warns and names the route. Run that route (`init --upgrade-workflows`), then `doctor` again, and the warning is gone. Assert this sequence as one case in `doctor.test.mjs`.
