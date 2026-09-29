### Task 4 — Install the plugin from the release tag in `harness-run.yml`, with a test that drives two versions

**Goal:** A job rendered for version N installs plugin version N while the marketplace's default branch carries N+1, and runs instead of refusing. The `Install the pinned plugin` step does this by cloning the marketplace repository at the release tag `autonomous-sdlc-harness--v<N>` and installing from that clone as a `directory`-sourced marketplace. The version check stays as the guard, and both of the step's refusals name the upgrade route.

**Depends on:** Task 1, which declares `CLI_VERSION_VARIABLE = 'HARNESS_CLI_VERSION'` in `cli/src/remote/githubActions.ts` and `UPGRADE_WORKFLOWS_FLAG = '--upgrade-workflows'` in `cli/src/generators/githubWorkflows.ts`. This template spells both literally, so its header declares them as mirrors. It also depends on Task 2, which makes `npx autonomous-sdlc-harness@<version> init --upgrade-workflows` a real command, so the refusal message names something that exists.

**Two contracts this file cites but does not own.** The tag is created by each release: `autonomous-sdlc-harness--v<version>`, annotated, on the `main` commit that first carries that plugin version. Task 5's script creates it, and Task 9 documents the step under `docs/development.md` → `## 7. Releasing`. Cite that as "docs/development.md, section 7". The adopter-facing route is documented by Task 7 under `docs/remote-execution.md` → `### Upgrading`, inside `## 7. Turning it on`. Cite that as "docs/remote-execution.md, section 7, Upgrading", in the style this header already uses for "docs/remote-execution.md, section 8".

### Targets

- `cli/templates/github/workflows/harness-run.yml` — the step body and the header.
- `cli/templates/github/workflows/harness-resume.yml` — the header only.
- `cli/test/workflow-plugin-pin.test.mjs` (new) — the behavioural test of the step.

**Work:**

- [ ] `harness-run.yml`, step `Install the pinned plugin`. Keep the step's name, its `if:` and the existing `source_repo` read and its refusal. Replace the two `claude plugin` lines and the check that follows with:
  1. Set `tag="autonomous-sdlc-harness--v$HARNESS_CLI_VERSION"` and `marketplace_dir="$RUNNER_TEMP/harness-marketplace"`.
  2. Run `git clone --quiet --depth 1 --branch "$tag" "https://github.com/$source_repo.git" "$marketplace_dir"`. If it fails, print `::error::`: `$source_repo` has no release tag `$tag`, so the plugin this workflow was rendered for cannot be installed. If that version was released, its release is missing the tag; otherwise, name the upgrade route (below). Then `exit 1`.
  3. Run `(cd "$RUNNER_TEMP" && claude plugin marketplace add ./harness-marketplace)`. The `./path` form is the one `docs/development.md` §1 measured.
  4. Run `claude plugin install autonomous-sdlc-harness@autonomous-sdlc-harness`.
  5. Keep the existing `installed=$(claude plugin list --json | jq …)` read. On a mismatch, print `::error::` naming the installed version, `$HARNESS_CLI_VERSION` and `$tag`, followed by the upgrade route, then `exit 1`.

  The route, word for word in both messages: *to run another version, re-render this repository's workflows with 'npx autonomous-sdlc-harness@<version> init --upgrade-workflows', then commit both and push them to the default branch (docs/remote-execution.md, section 7, Upgrading)*.

  Keep the template's two rules: no `${{` inside `run:`, and every value through `env:`.
- [ ] `harness-run.yml` header:
  - **`WHO WRITES IT.`** Keep create-if-absent and "yours to tune". Add that `init --upgrade-workflows` re-renders it at that CLI's version after a `.bak`, and only when the version below differs.
  - **`THE PLUGIN PIN.`** Rewrite it to say:
    - the job clones the marketplace repository at the release tag and adds the clone as a directory source, so what it installs is the tag's plugin whatever the default branch carries;
    - the clone is the plugin's runtime root and the runner's cache is its install root; `init --plugin-root-entries` grants both and `doctor --remote-job` grades both;
    - the check stays as the guard;
    - what the agent-runner CLI was measured to accept is recorded in docs/remote-execution.md, section 6.
  - **`DECLARED MIRRORS.`** Add `HARNESS_CLI_VERSION` against `cli/src/remote/githubActions.ts` and `--upgrade-workflows` against `cli/src/generators/githubWorkflows.ts`.
- [ ] `harness-resume.yml` header, **`WHO WRITES IT.`**: add that `init --upgrade-workflows` re-renders it together with the run workflow, after a `.bak`, carrying its `- cron:` lines. Keep the schedule as the single `- cron: '…'` line shape, because Task 1's carry matches `/^\s*- cron: /`.
- [ ] `cli/test/workflow-plugin-pin.test.mjs` (new). Its header states the rule it enforces: *the install step installs the plugin at the workflow's version, whatever the marketplace's default branch carries, and refuses naming the upgrade route when it cannot*. It says the step is run from the template's own text with a stub `claude`, and that no case reaches the network.
  - **Extract** the step's `run: |` body from the template text, as `cli/test/workflow-templates.test.mjs` → `blockUnder` does, and run it with `bash` in a throwaway directory.
  - **Environment.** The run directory carries a `.claude/settings.json` naming `extraKnownMarketplaces["autonomous-sdlc-harness"].source.repo` as `acme/harness`. Set `HARNESS_CLI_VERSION`, `RUNNER_TEMP` (a temp directory) and a `PATH` whose first entry holds the stub `claude`.
  - **Clone redirect.** Pass `GIT_CONFIG_COUNT` / `GIT_CONFIG_KEY_0` / `GIT_CONFIG_VALUE_0` so that `url.file://<fixtures>/.insteadOf` is `https://github.com/`. The clone then reads a local bare repository at `<fixtures>/acme/harness.git`.
  - **The fixture repository** carries `.claude-plugin/marketplace.json` (`{"name":"autonomous-sdlc-harness","plugins":[{"name":"autonomous-sdlc-harness","source":"./plugin"}]}`) and `plugin/.claude-plugin/plugin.json`. It has two commits: version `9.0.0`, tagged `autonomous-sdlc-harness--v9.0.0`, and then version `9.1.0` at the tip of its default branch.
  - **The stub `claude`:**
    - `plugin marketplace add <path>` records the path, resolved against its working directory;
    - `plugin install …` reads the recorded marketplace's plugin `source` and that plugin's `version`;
    - `plugin list --json` prints `[{"id":"autonomous-sdlc-harness@autonomous-sdlc-harness","scope":"user","version":"<that version>"}]`, or the version in `STUB_REPORTED_VERSION` when that variable is set.
  - **Cases:**
    - (a) `HARNESS_CLI_VERSION=9.0.0` exits 0 while the default branch carries `9.1.0`; the stub recorded a local directory, not the `acme/harness` slug, and the installed version is `9.0.0`.
    - (b) `HARNESS_CLI_VERSION=9.2.0`, which has no tag, exits non-zero with `autonomous-sdlc-harness--v9.2.0` and `init --upgrade-workflows` in its output.
    - (c) `HARNESS_CLI_VERSION=9.0.0` with `STUB_REPORTED_VERSION=9.1.0` exits non-zero with `9.1.0`, `9.0.0` and `init --upgrade-workflows` in its output.

**Verification:**

- Run `cli/test/workflow-plugin-pin.test.mjs`, the file this task creates, through the single-file test command the conventions document gives, if it gives one. All three cases pass. Case (a) is the acceptance criterion *"a job rendered for version N installs plugin version N while this repository's `main` carries version N+1"*, driven by a real clone of a two-version repository.
- `git grep -n '\${{' -- cli/templates/github/workflows/harness-run.yml` shows no expression inside the changed step's `run:` body, and the step names no input or secret expression.
- The step's own refusal text and Task 2's `upgradeWorkflowsCommand` name the same command, `npx autonomous-sdlc-harness@<version> init --upgrade-workflows`. Check this by reading both, never from memory.

**Deviations from plan:**

- The run of `cli/test/workflow-plugin-pin.test.mjs` was not made: neither `.claude/context/cli.md` nor `.claude/context/conventions.md` states a single-file test command, so it is deferred to the Run gates phase. What it rests on instead: `node --check` on the file, and a scratch probe (`harness-runs/scratch/pin_step_syntax.mjs`) that extracted the step's `run: |` body from the template and passed `bash -n`. The three cases themselves are unexecuted.
- `docs/remote-execution.md` → `## 6. What is not verified here`, row *"The plugin cannot be pinned by a ref at install"*, still cites the `--help` measurement as "recorded in `harness-run.yml`'s header"; the header now points to section 6 for it instead, as this plan asks. That row is outside the `cli` layer; Task 7's `**§6.**` sub-step rewrites it.
