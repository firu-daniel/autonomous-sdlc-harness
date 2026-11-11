### Task 17 — Respell the rendered-workflows gate, `run-gates.sh`, `tag-release.sh` and the sandbox-probe runner files

**Goal:** Make the gate that parses the rendered workflows expect the renamed set (task prompt, goal 2: *"`scripts/check-rendered-workflows.mjs` keeps checking the renamed set"*), and respell the other repository scripts that name a workflow file.

**Depends on:**
- Task 2: `init` now renders exactly `devscene-control.yml`, `devscene-resume.yml`, `devscene-run.yml` and `devscene-trigger.yml`, and that is the sorted order `readdirSync(dir).sort()` yields.
- Task 5: the fixture keeps its path `cli/test/fixtures/harness-control-0.6.1.yml`, so `NEGATIVE` does not change. Its job `if:` line is respelled but still unparsable.

**Where this task stops.** It does not run the gate; the Run gates phase does. The suite that reads `scripts/sandbox-probe-runner.yml` (`cli/test/sandbox-probe-runner-workflow.test.mjs`) is Task 19's. The Gate 14 prose in `docs/development.md` is Task 21's.

### Targets

- `scripts/check-rendered-workflows.mjs`
- `scripts/run-gates.sh`
- `scripts/tag-release.sh`
- `scripts/sandbox-probe-runner.yml`
- `scripts/lib/sandbox-probe/job.sh`
- `scripts/lib/sandbox-probe/preflight.sh`

**Work:**

- [ ] `check-rendered-workflows.mjs`:
  - set `EXPECTED = ['devscene-control.yml', 'devscene-resume.yml', 'devscene-run.yml', 'devscene-trigger.yml']`;
  - respell each `RESIDUAL` entry's file field (`'devscene-run.yml artipacked open'`, …, `'devscene-control.yml adhoc-packages control'`), keeping the audits and jobs byte-identical; zizmor reports a finding's file by its basename, and the rendered basenames are now `devscene-*.yml`;
  - respell the header's `0.6.1's devscene-control.yml` and its *"exactly the four harness workflows"*.
- [ ] `check-rendered-workflows.mjs`, the `negativePath` doc comment: reword it to say the fixture is the control workflow 0.6.1 shipped (git blob `1b4f0fc33200d876e4089ebe4013120e48a45335`, `cli/src/generators/githubWorkflows.ts` → `UNPARSEABLE_CONTROL_RELEASES`) with its job-level `if:` line respelled to the current names. It is no longer *"byte for byte"* that release's file, and the git-object note names no path that did not exist at that commit. Leave `NEGATIVE` unchanged.
- [ ] `run-gates.sh`: change gate 14b's label to `"14b 0.6.1's devscene-control.yml is refused"`. The command it runs is unchanged.
- [ ] `tag-release.sh`: respell the comment's `cli/templates/github/workflows/devscene-run.yml`. `scripts/sandbox-probe-runner.yml`: respell its three comment mentions of `harness-run.yml`, the cited template path included. Change no step, key or value.
- [ ] `scripts/lib/sandbox-probe/job.sh` and `scripts/lib/sandbox-probe/preflight.sh`: respell each header comment's `` `devscene-run.yml` job ``.

**Verification:**

- `grep -nE "harness-(trigger|run|control|resume)\.yml|@sdlc-harness|!-- ?sdlc-harness|sdlc-harness: " scripts/check-rendered-workflows.mjs scripts/run-gates.sh scripts/tag-release.sh scripts/sandbox-probe-runner.yml scripts/lib/sandbox-probe/job.sh scripts/lib/sandbox-probe/preflight.sh` prints nothing.
- `grep -n "harness-control-0.6.1.yml" scripts/check-rendered-workflows.mjs` still shows the `NEGATIVE` path.
- `node --check scripts/check-rendered-workflows.mjs` exits 0.
- `bash -n` exits 0 on `scripts/run-gates.sh`, `scripts/tag-release.sh`, `scripts/lib/sandbox-probe/job.sh` and `scripts/lib/sandbox-probe/preflight.sh`.
- Every `RESIDUAL` entry's first field is one of the four `EXPECTED` names.
- **Deviations from plan:** The `bash -n` bullet was not executed as written: each direct `bash -n <file>` call on `scripts/run-gates.sh`, `scripts/tag-release.sh`, `scripts/lib/sandbox-probe/job.sh` and `scripts/lib/sandbox-probe/preflight.sh` was refused by the permission layer ("Permission to use Bash has been denied because Claude Code is running in don't ask mode"). The claim rests instead on the configured `bash scripts/typecheck.sh`, whose `scripts/check-shell-parse.sh` step runs `bash -n` over every shell script git lists and reported `124 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`, followed by `PASS: typecheck`. All four files are tracked, so that run covers them. The edits in those files touch only comments and one double-quoted gate label.
