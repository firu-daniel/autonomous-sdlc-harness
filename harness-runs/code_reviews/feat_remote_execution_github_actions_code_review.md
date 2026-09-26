# Code Review: feat_remote_execution_github_actions

## Context

**Branch:** `feat_remote_execution_github_actions`
**Date:** 2026-09-26
**Reviewed:** the whole branch diff against `dev`, 66 files, reviewed in five segments:

- **The key and its owners:** `execution.target` in the model, the check and the schema; `cli/src/remote/githubActions.ts`; `core/git.ts` → `pathAtRef`; `core/paths.ts` → `ownManifest`.
- **What an adopter receives:** the two workflow templates, `generators/githubWorkflows.ts`, `init --plugin-root-entries`, and `doctor`'s `remote-execution` and `remote-github` checks.
- **The outer loop:** `remote-run.sh`, the watcher's `job` mode and remote relays, the outer-loop library's registry and state-bundle sections, and `restart-watcher.sh`.
- **The plugin:** the remote arms of the `branch-*` commands, the guard's new deny row, and the pause protocol and flow documents.
- **The general layer:** the schema fixture, `docs/remote-execution.md`, the other documents of record and `scripts/run-gates.sh`.

48 run-artifact files excluded from the reviewed diff. Two-pass mode was requested. The per-unit findings root `harness-runs/task_plan_point_reviews/feat_remote_execution_github_actions_task_plan/` does not exist, so Pass 2 had nothing to reconcile.

**Checks that came back clean:**

- Every unit's accompanying tests are present. The remote paths are exercised against a `gh` stub and the agent stub (`remote-run.test.mjs`, `watcher-remote-dispatch.test.mjs`, `watcher-remote-job.test.mjs`, `workflow-templates.test.mjs`, `remote-names.test.mjs`, and the `doctor`, `init` and `config` suites). The gates were not re-run for this review.
- The local path is gated on `execution.target` throughout.
- The configuration key is one contract in four places: schema, model, check and `docs/config.md` §5.
- The negative fixture is wired into `validate:config:negative`.
- The guard's fifth deny row is re-measured in `docs/guard-verification.md`.
- The Pass 0 sweeps found nothing on added lines: no `console`, `process.exit`, stray `git` invocation, line-number citation or machine-local path.
- Parity: `phases.parity` is `false`, so no parity review applies.

**The findings.** One cross-unit gap is Must Fix: the resume poller cannot deliver the `failed` notifications its own verb sends (Finding 1).

Four Should Fix items follow:

- three runtime and report defects (Findings 3, 4 and 5);
- one hardening: the artifact-name constant has no consumer, so no test pins its shell and YAML mirrors, which agree today (Finding 2).

One wording mismatch is Nice to Have (Finding 6).

Three further items need a decision nobody in the fix loop can take. They are in the return's `## Questions`, not here:

- a self-hosted job that outlives the `GITHUB_TOKEN`'s lifetime;
- the upgrade path for an adopter wired before this release;
- counter seeding on a fresh `--resume none` job.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 6** — Give `init`'s printed commit command the same subject as `docs/remote-execution.md` step 3 _(layer: cli)_
2. [x] **Finding 2** — Pin `STATE_ARTIFACT_NAME` to both of its mirrors in `workflow-templates.test.mjs` _(layer: cli)_
3. [x] **Finding 4** — Make `remote-run.sh stop` cancel only `harness run <branch>` runs, never the jobless markers _(layer: cli)_
4. [x] **Finding 5** — Print `init`'s remote-execution block only for workflows this run created or replaced _(layer: cli)_
5. [ ] **Finding 3** — Check `restore --resume answer`'s indexes against the downloaded bundle before restoring it _(layer: cli)_
6. [ ] **Finding 1** — Pass `HARNESS_PUSH_URL` to the resume poller, and record it in the header, the test and the secrets table _(layer: cli, general)_

---

## Must Fix

### 1. The resume poller never receives `HARNESS_PUSH_URL`, so its `failed` notifications reach no one
→ [finding_1.md](feat_remote_execution_github_actions_code_review/finding_1.md)

---

## Should Fix

### 3. A `restore --resume answer` refusal re-uploads the previous job's status, so the relayed answer is dropped with no notification
→ [finding_3.md](feat_remote_execution_github_actions_code_review/finding_3.md)

### 4. `remote-run.sh stop` also cancels the jobless marker runs, its own stop marker included, which can turn a successful stop into a "partial" one
→ [finding_4.md](feat_remote_execution_github_actions_code_review/finding_4.md)

### 5. `init` prints "This run wrote harness-run.yml and harness-resume.yml" when it kept both files
→ [finding_5.md](feat_remote_execution_github_actions_code_review/finding_5.md)

### 2. `STATE_ARTIFACT_NAME` is exported and nothing consumes it, so the artifact-name mirror is unguarded
→ [finding_2.md](feat_remote_execution_github_actions_code_review/finding_2.md)

---

## Nice to Have

### 6. `init`'s printed commit command and `docs/remote-execution.md` step 3 give the adopter two different commit subjects
→ [finding_6.md](feat_remote_execution_github_actions_code_review/finding_6.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`. There is no reference implementation to diverge from, so this section is empty.
