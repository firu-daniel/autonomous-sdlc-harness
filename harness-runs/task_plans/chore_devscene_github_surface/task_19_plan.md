### Task 19 — Respell the Gate 12 sandbox-round suites, their helper and the sandbox-probe runner suite

**Goal:** Make the cli suites that run this repository's own Gate 12 sandbox-round scripts, and the sandbox-probe runner suite, expect the new run workflow name.

**Depends on:**
- Task 18: `scripts/lib/gate12-sandbox-round/*.sh` now call `gh run list --repo <repo> --workflow devscene-run.yml --branch <b> …`, and `preflight.sh` reads `origin/<default>:.github/workflows/devscene-run.yml`.
- Task 17: `scripts/sandbox-probe-runner.yml`'s comments name `devscene-run.yml`.
- Task 16: `scripts/lib/harness-run-lib.sh` carries Task 4's `HR_REMOTE_WORKFLOW_RUN_FILE='devscene-run.yml'`. `gate12-sandbox-round-cli.test.mjs` copies it from this checkout.
- Task 2: the template `cli/templates/github/workflows/devscene-run.yml`.

These suites read files under this repository's `scripts/`, which is why this `cli` task ships after the `general` Tasks 16–18 (`## Context` → *Test files are edited by the task that can run them green*).

**Where this task stops.** `cli/test/helpers/gate12-round.mjs` is also imported by `gate12-sandbox-round-default-branch.test.mjs`, `gate12-sandbox-round-docs.test.mjs` and `gate12-sandbox-round-teardown.test.mjs`. Those three carry no old name and are not edited here. The helper's two values below are the only interface they read from it that changes.

### Targets

- `cli/test/helpers/gate12-round.mjs`
- `cli/test/gate12-sandbox-round-cli.test.mjs`
- `cli/test/gate12-sandbox-round-full-run.test.mjs`
- `cli/test/gate12-sandbox-round-grade.test.mjs`
- `cli/test/gate12-sandbox-round-plant.test.mjs`
- `cli/test/sandbox-probe-runner-workflow.test.mjs`

**Work:**

- [ ] `helpers/gate12-round.mjs`: set `WORKFLOW_TEMPLATE` to `join(WORKSPACE_ROOT, 'cli', 'templates', 'github', 'workflows', 'devscene-run.yml')`, and the fixture tree's key to `'.github/workflows/devscene-run.yml'`. These two values are what Task 18's `preflight.sh` reads.
- [ ] `gate12-sandbox-round-cli.test.mjs` and `gate12-sandbox-round-plant.test.mjs`: respell each expected `gh run list … --workflow devscene-run.yml …` line.
- [ ] `gate12-sandbox-round-full-run.test.mjs` and `gate12-sandbox-round-grade.test.mjs`: set `WORKFLOW = 'cli/templates/github/workflows/devscene-run.yml'`, and respell the header lines and every stubbed `run list … --workflow devscene-run.yml …` key.
- [ ] `sandbox-probe-runner-workflow.test.mjs`: respell the header's *"held to the `devscene-run.yml` job it reproduces"*.

**Verification:**

- `npm test --workspace cli -- test/gate12-sandbox-round-cli.test.mjs` passes.
- `npm test --workspace cli -- test/gate12-sandbox-round-full-run.test.mjs` passes.
- `npm test --workspace cli -- test/gate12-sandbox-round-grade.test.mjs` passes.
- `npm test --workspace cli -- test/gate12-sandbox-round-plant.test.mjs` passes.
- `npm test --workspace cli -- test/sandbox-probe-runner-workflow.test.mjs` passes.
- `grep -nE "harness-(trigger|run|control|resume)\.yml" cli/test/helpers/gate12-round.mjs cli/test/gate12-sandbox-round-cli.test.mjs cli/test/gate12-sandbox-round-full-run.test.mjs cli/test/gate12-sandbox-round-grade.test.mjs cli/test/gate12-sandbox-round-plant.test.mjs cli/test/sandbox-probe-runner-workflow.test.mjs` prints nothing.
