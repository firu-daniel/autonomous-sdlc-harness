### Task 19 — State in `harness-run.yml` why the `run` job cuts no copy, and hold it with a test over the rendered template

**Goal:** Settle goal 1's third bullet. **The `run` job cuts no run copy.**
- `Check out the run's branch` checks the branch out into `$GITHUB_WORKSPACE`, and `Run the harness` runs `autonomous-watcher.sh job` there. In job mode the main checkout and the run's working copy are that one directory (`cli/templates/scripts/autonomous-watcher.sh` → the anchors comment; *JOB MODE* in its header).
- So the session's cwd is the main checkout. A clone would add a copy and a sync for a checkout nothing else shares, on an ephemeral runner that runs exactly one run.

State that in the template's header. Then add a test over the rendered template that fails if any step of the `run` job creates a copy.

**Where this task stops.** It changes the workflow template's comments only. The job's profile is generated in the job by `init --plugin-root-entries`, and with Task 5 it write-denies the job checkout's whole `.git`. That settlement — the flows issue no sandboxed git write in a job — is stated in `docs/cli.md` §6 by Task 22 and measured by Task 23's row, not here. The real GitHub job is a post-release follow-up (story index, **Manual setup required** 4).

### Targets

- `cli/templates/github/workflows/harness-run.yml` (header comment only)
- `cli/test/workflow-templates.test.mjs`

**Work:**

- [ ] Add one header paragraph to `harness-run.yml`, beside the existing job-description paragraphs. It says:
  - the `run` job's session runs in the job's own checkout, which is the main checkout, so no run copy is cut and none needs the clone layout;
  - its profile, generated in the job, write-denies that checkout's whole `.git`, and the flows issue no sandboxed git write: commits and pushes go through the excluded wrappers, reverts use the file tool. Name `docs/cli.md` §6 as the owner;
  - the plugin clone in `Install the pinned plugin` is the marketplace checkout, not a run copy.
- [ ] `workflow-templates.test.mjs`: add a case over the rendered `harness-run.yml`, rendered the way the suite already renders it. Across every `run:` body of the `run` job, assert it:
  - never names `create-worktree.sh`;
  - never runs `git worktree add`;
  - runs no `git clone` other than the one in `Install the pinned plugin`, matched by that step's name;
  - runs `autonomous-watcher.sh job` with its working directory the checkout (`--cwd "$GITHUB_WORKSPACE"` or the step's default).

  Open the case with the rule it enforces, and say what would make it fail.
- [ ] Add the case's perturbation: the same assertion over a copy of the rendered text with a `bash "$SCRIPTS_DIR/create-worktree.sh"` line inserted fails. Run it in-process on a string, never on a file in this checkout.

**Verification:**

- `npm test --workspace cli -- test/workflow-templates.test.mjs` passes.
- `git diff --stat` for the template shows comment lines only: no step, `run:` body or expression changed.
- **Deviations from plan:** The suite renders nothing: it reads `harness-run.yml` as raw template text. To test the rendered template as the task asks, the new case renders it in-process with `renderTemplate` from `cli/src/core/templating.ts`, with the same `cliVersion` token and `assertNoneSurvive: true` that `cli/src/generators/githubWorkflows.ts` passes. It writes no file.
