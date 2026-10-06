### Task 5 — Run `open` from `harness-run.yml` before the harness step of every person-started job

**Goal:** Wire the `open` verb into the run workflow, so a run's draft pull request opens when its first job starts and not when the run completes. The step runs before `Run the harness`, carries `HARNESS_GIT_TOKEN` as `HARNESS_PR_TOKEN` as the `deliver` step already does, and never fails the job.

**Depends on:** Task 4, which adds `remote-run.sh open <branch> [--repo <root>]`. That verb is job-side, self-gated on `forge` `github` and `execution.target` `github-actions`, and always exits 0 except on a usage error. It reuses an open pull request and opens one only when none is open. It reads `HARNESS_PR_TOKEN` for the create alone.

**Where this task stops.** It edits the workflow template and its suite only. The verb's behaviour is Task 4's. Re-rendering the template into an adopter's repository is `init --upgrade-workflows`, already shipped, which re-renders `harness-run.yml` because the file carries `HARNESS_CLI_VERSION`. Documenting that is **Task 17's** (`docs/remote-execution.md`).

### Targets

- `cli/templates/github/workflows/harness-run.yml` — a new step in the `run` job, and the header paragraphs that describe the token, the permissions and the `continue-on-error` steps.
- `cli/test/workflow-templates.test.mjs` — assertions on the new step.

**Work:**

- [ ] Add the step **`Open the draft pull request`** to the `run` job, after `Restore the previous job's state` and before `Run the harness`. It needs `jq`/`gh` and `SCRIPTS_DIR`, which the earlier steps set, and nothing the harness step produces. Its fields: `if: env.HARNESS_STOPPED != '1' && inputs.chain == 0`; `continue-on-error: true`; `env: HARNESS_PR_TOKEN: ${{ secrets.HARNESS_GIT_TOKEN }}`; `run: bash "$SCRIPTS_DIR/remote-run.sh" open "$HARNESS_INPUT_BRANCH"`. Keep both rules the header states for every edit: the input reaches the shell through `env:` only, and every expression has a space after its opening braces.
- [ ] Header: add a paragraph **`WHY THE OPEN STEP RUNS ONLY WHEN chain IS 0.`** `chain` counts automatic dispatches since the last user action, so `0` is a job a person's action started: the first job, a resume, an answer, a round. An automatic continuation therefore never retries a create that failed, and the attempts per run stay bounded by people's actions. `deliver`'s fallback at completion is the last attempt, and its `completed` comment names the error. Say why the step is `continue-on-error`, as the report step's paragraph does: scripts older than this file carry no `open` verb, and a run must not fail for its pull request.
- [ ] Header, `WHAT IT READS` and `THE PERMISSIONS`: `HARNESS_GIT_TOKEN` now opens the draft pull request when the run starts, and `deliver` opens one only when none is open at completion. Reword the `pull-requests` line to *to open the run's pull request, update it and label it*. That wording stays true as later tasks add the draft flips and the thread replies on the same permission, and it names no behaviour this task does not ship. The permission set itself is unchanged, since `pull-requests: write` is already declared.
- [ ] `cli/test/workflow-templates.test.mjs`: in that suite's own style, assert on the rendered `run` job that a step named `Open the draft pull request` exists and sits after `Restore the previous job's state` and before `Run the harness`. Assert its `if:` is exactly `env.HARNESS_STOPPED != '1' && inputs.chain == 0`, that it is `continue-on-error: true`, that its `env` maps `HARNESS_PR_TOKEN` to `${{ secrets.HARNESS_GIT_TOKEN }}`, and that its `run:` line names `remote-run.sh" open "$HARNESS_INPUT_BRANCH"`. Assert also that no expression inside its `run:` line interpolates an input.

**Verification:**

- `npm test --workspace cli -- test/workflow-templates.test.mjs` passes, run once from the repository root as one plain foreground command.
- `bash scripts/typecheck.sh` passes.
- Read the rendered step against Task 4's verb: the step passes `<branch>` and no bundle directory, which is the verb's whole argument list. Exercising the open end to end on GitHub is Gate 12 (xiv) leg (a), which Task 19 writes.
