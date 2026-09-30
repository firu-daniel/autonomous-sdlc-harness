# Code Review: feat_forge_run_triggers

## Context

**Branch:** `feat_forge_run_triggers`
**Date:** 2026-09-30
**Reviewed:** the whole branch diff against `dev` (`defaultBranch`). That covers 44 files, +3892/−222, and 31 run-artifact files were excluded from the reviewed diff. The segments:

- **The issue-trigger names and switch:** `cli/src/remote/githubActions.ts`, `cli/src/config/model.ts` → `forgeTriggerApplies`, `cli/src/config/check.ts`.
- **The trigger workflow and its generation:** `cli/templates/github/workflows/harness-trigger.yml`, `cli/src/generators/githubWorkflows.ts`, `cli/src/commands/init.ts`, `cli/src/core/writer.ts`.
- **`doctor`:** the new `forge` check and the trigger reads added to `remote-github`.
- **The run library:** inbox routing, branch derivation, artifact placement, `hr_remote_record_init` and the GitHub-route producers.
- **`remote-run.sh`:** the `start`, `trigger` and `adopt` verbs.
- **`create-worktree.sh --no-bootstrap`**, and the watcher refactor onto the library.
- **The plugin:** five `branch-*` commands and two flow documents.
- **The general layer:** the schema, `docs/` (new `github-issue-trigger.md`; `remote-execution.md`, `cli.md`, `watcher.md`, `config.md`, `development.md` with Gate 12 observation (xiii)), `ARCHITECTURE.md`, `README.md`, `ROADMAP.md`, `llms.txt`.
- **The tests:** eleven suites.

**Conclusions:**

- **The watcher refactor preserves the inbox path.** The moved routing, placement, commit, landed-push test and remote-record initialisation keep every field, log line and exit path the watcher had (acceptance 6).
- **The trigger's refusal arms match the story plan's design.** They run in order, and event text reaches the shell only as `jq`-read data.
- **The `forge` key has its reader and its reporter,** and every document that stated its status was updated.
- **Every new exported symbol has a caller outside its defining file.** `TRIGGER_DISPATCH_EVENT_TYPE`'s callers are its declared shell and YAML mirrors and `cli/test/remote-names.test.mjs` / `workflow-templates.test.mjs`, the same shape as `STATE_ARTIFACT_NAME`.
- **Tests:** every accompanying test the conventions documents require is present. That covers a suite per new verb and per `init` / `doctor` change, and the idempotence case for the new `create-if-absent` workflow. This review ran no suite. Whether they pass is the Run gates phase's call.
- **Parity:** `phases.parity` is `false`, so no parity cross-check applies.
- **Carry-overs:** per-unit review was off (the per-unit findings root does not exist), so Pass 2 carried nothing over.

Four findings remain. Two are Must Fix: the GitHub route omits the engine, and adopt's local code execution is undisclosed.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top-to-bottom. Only the committing role flips a marker to `[x]`, as that fix's commit lands. That is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else (sub-step bullets inside per-finding files) are informational only.

Each entry resolves to `harness-runs/code_reviews/feat_forge_run_triggers_code_review/finding_<K>.md` via its `**Finding K**` reference. The list is sorted smallest and safest first, and the leading `N.` is fix order while `K` is the finding's stable identity.

1. [x] **Finding 3** — Tell the five `adopt`-running commands what to do on exit 1 _(layer: plugin)_
2. [x] **Finding 4** — Correct the watcher header's registry field list for adopted records and `remote_adopted_at` _(layer: cli)_
3. [x] **Finding 2** — Disclose that `adopt` runs each adopted branch's bootstrap on the maintainer's machine _(layer: general)_
4. [ ] **Finding 1** — Name the run's `engine` in the GitHub route every job-side notification prints _(layer: cli, general)_

---

## Must Fix

### 1. The GitHub route in job-side notifications omits `engine`, so following it resumes a user-review or docs run as a task run
→ [finding_1.md](feat_forge_run_triggers_code_review/finding_1.md)

### 2. `adopt` runs each adopted branch's own bootstrap on the maintainer's machine, and no document says so
→ [finding_2.md](feat_forge_run_triggers_code_review/finding_2.md)

---

## Should Fix

### 3. The five commands that run `adopt` or `adopt --list` give no instruction for exit 1
→ [finding_3.md](feat_forge_run_triggers_code_review/finding_3.md)

### 4. The registry's field list still says only `launch_remote_run` writes `execution`, and omits `remote_adopted_at`
→ [finding_4.md](feat_forge_run_triggers_code_review/finding_4.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section carries no divergence call-out.
