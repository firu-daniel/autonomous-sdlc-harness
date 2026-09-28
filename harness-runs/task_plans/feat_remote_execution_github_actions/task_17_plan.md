### Task 17 — Generate the two workflows from `init` when remote execution is on

**Goal:** Make `init` the way an adopter receives the workflows: with `execution.target` `github-actions`, `init` writes `.github/workflows/harness-run.yml` and `.github/workflows/harness-resume.yml`, `create-if-absent`, and its closing report lists the GitHub-side steps it cannot take; with the key absent or `local`, `init` writes exactly what it writes today.

**Depends on:** Task 16, which completed the templates under `cli/templates/github/workflows/` (`harness-run.yml` carries the one token `{{cliVersion}}`; `harness-resume.yml` carries none; every GitHub expression is written `${{ ` with a space, so the renderer's token pattern never matches one). Task 2's exports `WORKFLOW_TEMPLATE_DIR` (`github/workflows`), `WORKFLOW_RUN_FILE`, `WORKFLOW_RESUME_FILE`, `WORKFLOW_RUN_PATH`, `WORKFLOW_RESUME_PATH`, and the secret and variable names the report names. Task 1's `remoteExecutionApplies(config)`. And Task 14, which last edited `cli/src/commands/init.ts` (the `--plugin-root-entries` row and its note) and `cli/test/init.test.mjs`; this task edits both after it.

**The contract, stated once for every consumer** (Task 18's check tests for these paths; Task 27 documents them):

- A new generator `cli/src/generators/githubWorkflows.ts`, `writeGithubWorkflows({ plan, config, … })`, called by `init` **after the scripts and before the permission profile** (the workflows run outer-loop scripts, so they are planned after the files they name), and doing nothing unless `remoteExecutionApplies(config)`.
- `harness-run.yml` is rendered through `renderTemplate` with `{ cliVersion: <this CLI's own version> }` and `assertNoneSurvive` **on** — the one substituted value is a version string, which has no business carrying `{{…}}`; `harness-resume.yml` is copied verbatim. The header argues both, as `.claude/context/cli.md` → *"A generator that renders a template states and argues its `assertNoneSurvive` setting in its own header"* requires. The CLI's version is read from the one place this package already reads it (grep for the existing reader, e.g. the retrieval runtime's version match, and import it rather than re-reading `package.json`).
- Both files: policy `create-if-absent` (the adopter tunes the cron, the timeouts, the runner), upgraded by `--force` after a `.bak` like every other `create-if-absent` file; a row for each in `cli/src/core/writer.ts`'s re-run table.
- When the generator ran, `init`'s closing report adds one block listing, as commands in their own lines where they are commands, what only the adopter can do: commit and push both files to GitHub's default branch (a `workflow_dispatch` workflow must exist there to be dispatched); set the secret `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY` (billing follows the API key when both are set); optionally `HARNESS_PUSH_URL` and `HARNESS_GIT_TOKEN`; optionally the variable `HARNESS_RUNNER` for a self-hosted runner; then `doctor --check-github`. The block names `docs/remote-execution.md` by title for the rest.

### Targets

- `cli/src/generators/githubWorkflows.ts` (new).
- `cli/src/commands/init.ts` — the call in generator order and the closing-report block.
- `cli/src/core/writer.ts` — two rows in the re-run table.
- `cli/test/init.test.mjs` — the accompanying cases.

**Work:**

- [ ] Write the generator with its module header (what it owns; *"The rule this module exists to enforce"*: the workflows are written exactly when `remoteExecutionApplies`, and from the two templates only; the `assertNoneSurvive` argument; that no configured value is rendered into either file, only the CLI's version).
- [ ] Call it from `init` in the stated position, and add the closing-report block through the reporter.
- [ ] Add the two re-run table rows to `writer.ts`'s header table.
- [ ] Cases on a throwaway fixture: `init` with no `execution` key writes no `.github/` path and its action log names none; after `config set execution.target github-actions`, `init` writes both files, `harness-run.yml` carries this CLI's version where the template had `{{cliVersion}}` and no `{{` token survives, `harness-resume.yml` is byte-identical to its template, and the report block names both secrets and `doctor --check-github`; a second `init` changes nothing (idempotence); an edited `harness-run.yml` survives a plain re-run and is replaced after a `.bak` under `--force`.

**Verification:**

- `bash scripts/typecheck.sh` and `bash scripts/test.sh` exit 0.
- Every pre-existing `init` case passes unchanged — the evidence that a repository with the key absent gets exactly today's files.
- `grep -rn "'.github" cli/src` finds the directory only through Task 2's constants.

**Deviations from plan:**

- The report block names `docs/remote-execution.md` by path plus the title "Remote execution on GitHub Actions": that file does not exist yet (Tasks 28–29 write it) and no plan fixes its title, so Task 28 should either use that title or update the last line of `cli/src/commands/init.ts` → `reportGithubSteps`.
- `bash scripts/test.sh` exited 1 in this session on two gates outside this task's change: 6a (machine paths found in the untracked, gitignored `harness-runs/scratch/t3-test.log`, which this task did not write) and 11 (the retrieval runtime is not installed on this machine). Gate 4 (`npm test`, every `init` case including the new ones) passed; `bash scripts/typecheck.sh` passed.
