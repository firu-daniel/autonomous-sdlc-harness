### Task 22 — Test the runner workflow against the job's template

**Goal:** A new suite holding `scripts/sandbox-probe-runner.yml` to the job it reproduces and to the prompt's guards:

- **Same runner:** it runs where a job would run.
- **Same steps:** it does what the job does, step for step, where it copies a step.
- **Same pins:** it uses only the action pins the job uses.
- **Nothing leaks:** it keeps no response body and echoes no secret.
- **Only its evidence leaves:** it uploads exactly the probe's evidence, with the retention the plan names.
- **Never here:** it never runs in this repository.

It reads two fixed files, the workflow and `cli/templates/github/workflows/harness-run.yml`, and no tree, so it is not a tree guard and owes no `treeGuards` entry.

**Depends on:**

- **Task 14's workflow:**
  - `name: sandbox-probe-runner`; the only trigger `workflow_dispatch`, with required inputs `probe_commit` and `cli_version`;
  - one job, `runs-on: ${{ vars.HARNESS_RUNNER || 'ubuntu-latest' }}`;
  - the copied steps by their template names: `Check for jq and gh`, `Set up Node`, `Read the configuration`, `Install the claude CLI when absent`, `Set the git identity`, `Install the pinned plugin`, `Generate the job's permission profile`, `Install the sandbox prerequisites`, `Bootstrap the checkout`;
  - the new steps `Switch to the configured default branch` (between `Read the configuration` and `Install the claude CLI when absent`; it reads `harness.config.json` → `defaultBranch` and refuses naming it beside GitHub's default branch), `Check the OAuth credential`, `Take the probe from the marketplace repository`, `Record the runner and the controls`, `Record the readings after the install step`, `Run the probe in job mode`, `Upload the evidence` and `Report the probe's exit status`;
  - the artifact `sandbox-probe-evidence`, `retention-days: 3`, with paths `${{ runner.temp }}/sandbox-probe-out/` and `${{ runner.temp }}/sandbox-probe-tmp/sandbox-probe-evidence.*`.
- **Task 8:** `SP_RUNNER_CANARY_NAME=SBX_PROBE_CANARY` in `scripts/lib/sandbox-probe/legs-runner-isolation.sh`, read back by sourcing that file, never retyped.
- **Task 7:** the controls keys, from `scripts/lib/sandbox-probe/legs-runner.sh`'s header.
- **The template's step bodies:** read as `cli/test/workflow-sandbox-install.test.mjs` reads them, through `WORKFLOW_TEMPLATE_DIR` and `WORKFLOW_RUN_FILE` from `../dist/remote/githubActions.js`. Its `stepBody(name)` is a file-local helper, so this suite carries its own copy, as that file's header says of its own.

**Where this task stops.** One new suite. It parses YAML with `js-yaml`, the root `devDependencies` entry Gate 14 uses, and runs no workflow step.

### Targets

- `cli/test/sandbox-probe-runner-workflow.test.mjs` (new)

**Work:**

- [ ] **The header** opens with the rule above. Its left-out note: no step runs, and Gate 12's run is the evidence that the workflow works on a runner.
- [ ] **`test('it runs where a job runs, and only when dispatched')`**:
  - the file parses with `js-yaml`'s `load`;
  - `on` has the single key `workflow_dispatch`, with exactly the two required inputs;
  - `runs-on` equals the template's `run` job's `runs-on` string;
  - the file sits under `scripts/`, and no path under `.github/` in this checkout names it.
- [ ] **`test('the job's own steps are copied, byte for byte')`**:
  - for each copied step name, the workflow's `run:` body, de-indented, equals the template step's of the same name;
  - every `uses:` value in the workflow is one the template carries;
  - `Install the sandbox prerequisites` comes before `Run the probe in job mode`, and `Generate the job's permission profile` before both;
  - `Switch to the configured default branch` comes after `Read the configuration` and before `Install the claude CLI when absent`, and its `run:` body reads `.defaultBranch` from `harness.config.json`.
- [ ] **`test('it keeps no body and prints no secret')`**:
  - the controls step's `curl` line carries `-o /dev/null` and `-w '%{http_code}'`, and no `Metadata` header;
  - no `run:` body echoes or prints `IN_OAUTH`, `CLAUDE_CODE_OAUTH_TOKEN` or `secrets.`, and none sets `-x`;
  - the secret reaches only `Check the OAuth credential` and `Run the probe in job mode`, through `env:`;
  - the run step's `env:` sets the variable named by `SP_RUNNER_CANARY_NAME`, to a value built from `github.run_id` and no secret;
  - the controls step writes every key Task 7's header lists, through one tab-and-newline-sanitising function.
- [ ] **`test('only the evidence leaves the runner')`**:
  - `Upload the evidence` runs under `if: always()`, is named `sandbox-probe-evidence`, keeps `retention-days: 3`, and lists exactly the two paths above;
  - the run step invokes `scripts/sandbox-probe.sh run --job "$GITHUB_WORKSPACE" --runner-controls` from `$RUNNER_TEMP/sandbox-probe-src`, with `TMPDIR` under `$RUNNER_TEMP`.

**Verification:**

- This suite passes: `npm test --workspace cli -- test/sandbox-probe-runner-workflow.test.mjs`, from the repository root, as one plain foreground command.
- Read the counts and the exit status, not a summary line.
</content>
</invoke>
