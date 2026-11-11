### 1. The story's manual migration step re-renders only two of the four workflows and none of the scripts, so the migrated repository reads deleted `HARNESS_*` names

> **Self-contained per-finding file** for the `chore_devscene_env_variables` skeptic-review index (`harness-runs/skeptic_reviews/chore_devscene_env_variables_skeptic_review.md`). The implementer reads only this file to apply the fix. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `harness-runs/story_plans/chore_devscene_env_variables_story_plan.md`, `## Context` → **Manual setup required:**, the bullet that opens "**Before the next remote run or sandbox probe:**". The sentence to change is: "In that same repository, run `npx devscene@<merged version> init --upgrade-workflows`, because a workflow rendered before this branch reads only the old names (depends on Tasks 2, 6 and 17)."

**The problem.** That bullet is the maintainer's migration for every GitHub repository that runs a rendered `devscene-*.yml`, the Gate 12 sandbox repository included. It tells them to delete the `HARNESS_` variables and secrets and then run `init --upgrade-workflows`. But `--upgrade-workflows` re-renders only `devscene-run.yml` and `devscene-resume.yml`:

- `cli/src/generators/githubWorkflows.ts` → `writeGithubWorkflows`: the trigger and control workflows are enqueued `create-if-absent` with no `forceOverride`. The module header, choice 5, says: "The two forge workflows … carry no pin and are not upgraded … Neither is ever upgraded by pin."
- `docs/remote-execution.md` → section 7 *Upgrading* says: "**It does not re-render `devscene-trigger.yml` or `devscene-control.yml`.** … both share the scripts' route, `init --force`". It also says: "**It does not re-render the outer-loop scripts** under `<scriptsDir>`. … `init --force` remains their route."

The Gate 12 repository runs all four workflows: `docs/development.md` records `config set forge github` and "`init --force` replaced all four workflows". So a maintainer who follows the bullet as written ends up with a mixed repository:

1. **Old `devscene-trigger.yml` and `devscene-control.yml`** still pass `HARNESS_REMOTE_STOP: ${{ vars.HARNESS_REMOTE_STOP }}` and `HARNESS_RUN_ACTORS: ${{ vars.HARNESS_RUN_ACTORS }}` (the template lines this branch renamed). Those variables were just deleted, so both values arrive empty. The stop switch then refuses no issue-label start and no `@dev-scene` command. The refusal sites are `remote-run.sh`'s `trigger_refuse "the repository variable … is set"`, `control_close_ignore` and `CG_WHY`, all now reading `DEVSCENE_REMOTE_STOP` in the new scripts and `HARNESS_REMOTE_STOP` in the old ones, and neither name is set by those workflows. Every start and command is also held to the unset allow-list, which admits the repository owner alone, or nobody in an organisation-owned repository.
2. **Old scripts on the default branch, driven by the new `devscene-run.yml`.** The new job sets `DEVSCENE_RUN_ACTORS`, `DEVSCENE_REMOTE_STOP` and `DEVSCENE_CLI_VERSION`, while the old `remote-run.sh` and `autonomous-watcher.sh` read the `HARNESS_` spellings. For example, the old watcher's `stall_job_surfaces_ok` reads `HARNESS_CLI_VERSION` and returns 1 with "the job-surfaces check needs … set" on every call.

`doctor`'s `forge` check does warn about the old forge workflows and names `init --force` (`cli/src/doctor/checks.ts` → `FORGE_CHECK`, `listlessWarning`). But the bullet points the maintainer at the wrong command, and nothing in it says to run `doctor`.

**Proof.**
- `cli/templates/github/workflows/devscene-trigger.yml` (job `env:`) now reads `DEVSCENE_REMOTE_STOP: ${{ vars.DEVSCENE_REMOTE_STOP }}` and `DEVSCENE_RUN_ACTORS: ${{ vars.DEVSCENE_RUN_ACTORS }}`. A copy rendered before this branch carries the `HARNESS_` spelling of both, and `--upgrade-workflows` does not replace it.
- `writeGithubWorkflows`: `forceOverride: 'always'` is attached only to the run and resume entries (`upgradeResult?.replaced === true`, `replaceResume`). It is never attached to the trigger or control entry.

**Fix.** In `harness-runs/story_plans/chore_devscene_env_variables_story_plan.md`, in that bullet, replace this sentence:

```
In that same repository, run `npx devscene@<merged version> init --upgrade-workflows`, because a workflow rendered before this branch reads only the old names (depends on Tasks 2, 6 and 17).
```

with:

```
In that same repository, run `npx devscene@<merged version> init --force`, because a workflow or outer-loop script rendered before this branch reads only the old names: `--force` replaces all four `devscene-*.yml` workflows and the outer-loop scripts after a `.bak`, while `--upgrade-workflows` re-renders only `devscene-run.yml` and `devscene-resume.yml` (`docs/remote-execution.md` → section 7, *Upgrading*). Commit and push the result to the default branch, then run `npx devscene@<merged version> doctor --check-github` and confirm that the `forge` check names no workflow as written before `DEVSCENE_RUN_ACTORS` (depends on Tasks 2, 6 and 17).
```

Change nothing else in the file. Do not flip any checkbox in the story index's readiness list. This fix edits no test file and runs no test.
