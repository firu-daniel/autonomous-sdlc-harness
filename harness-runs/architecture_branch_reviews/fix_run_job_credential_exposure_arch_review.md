# Architecture review — fix_run_job_credential_exposure

## Context

Branch `fix_run_job_credential_exposure`, reviewed 2026-11-08 against `dev`. The diff was taken from `origin/dev...HEAD` because this run copy has no local `dev` ref. The review covered all 36 changed files in five segments:

- `cli/src`: `config/model.ts`, `config/check.ts`, `commands/init.ts`, `remote/githubActions.ts`.
- The outer-loop templates under `cli/templates/scripts/`: `lib/harness-run-lib.sh`, `push-branch.sh`, `autonomous-watcher.sh`, `remote-run.sh`, `launch-sandboxed-gates.sh`.
- `cli/templates/github/workflows/harness-run.yml`.
- `cli/test`.
- The `general` and `plugin` documents and schema: `schemas/`, `package.json`, `scripts/check-rendered-workflows.mjs`, `docs/`, `ARCHITECTURE.md`, `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`.

28 run-artifact files excluded from the reviewed diff.

**Headline.** The layering holds:

- Every file sits under the `layers[].path` its task's tag names.
- No new runtime edge crosses between `cli/` and `plugin/`.
- The new shared answers are in the shared shell library, and each has one home there: the credential predicate, the push-refusal record, the job push-credential marker, the profile's `envVars` read and the `sandbox.passEnv` reader. The mention reader and the gate launcher now call the library instead of keeping private copies.
- `sandbox.passEnv` lands in all four places of the configuration contract, with its negative fixture wired into `validate:config:negative`.
- The new GitHub-name mirrors are declared in `cli/src/remote/githubActions.ts`'s header.
- No new test reads a repository tree, so no tree-guard registration is owed.

One header-declaration gap remains. It is non-blocking.

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 1** — The owner of `CLAUDE_CONFIG_DIR` does not declare the watcher's new mirror of it _(layer: cli)_

## Must Fix

_None._

## Should Fix

### 1. The owner of `CLAUDE_CONFIG_DIR` does not declare the watcher's new mirror of it
→ [finding_1.md](fix_run_job_credential_exposure_arch_review/finding_1.md)

## Nice to Have

_None._
