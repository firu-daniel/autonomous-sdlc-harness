# Code Review: fix_run_job_credential_exposure

## Context

**Branch:** `fix_run_job_credential_exposure`
**Date:** 2026-11-08
**Reviewed:** the whole branch diff against the default branch (`origin/dev`; there is no local `dev` ref in this checkout, and the merge base is `77f386db`). 37 files changed. The diff covers:
- the `sandbox.passEnv` key: model, check, schema, negative fixture and `docs/config.md` row (Tasks 1 and 9);
- the shared credential check, the push-refusal record and the job push-credential marker in `cli/templates/scripts/lib/harness-run-lib.sh` (Task 2);
- `push-branch.sh`'s credential scan and its job workflow-file refusal (Task 3);
- `spawn_engine`'s strip set and local allow-list, and the watcher's push-refusal passes (Task 4);
- `remote-run.sh`'s shared mention check, its `push-credential` verb and its `HARNESS_GIT_TOKEN` ready flip and re-toggle (Task 5);
- `harness-run.yml`'s agent-free `open` and `deliver` jobs and the `run` checkout's `persist-credentials: false` (Task 6), with the `init` step-3 wording (Task 13);
- the documentation rows (Tasks 7, 8, 10, 11 and 12) and the five new test suites.

30 run-artifact files were excluded from the reviewed diff.

The accompanying tests the conventions documents require are present, and each new suite opens with the rule it enforces. This review ran no suite, so whether they pass is the Run gates phase's to establish. `phases.parity` is `false`, so no parity review applies. Pass 0's grep half has no configured regexes. Its caller check found one new export with no caller (Finding 3). The cited document anchors were checked and resolve, including `docs/watcher.md` → `### The session's environment`, `docs/remote-execution.md` → **The job's credential design.**, **CI on the final tip.** and **The issue trigger**, `docs/sandbox-record.md` → `## 5. The Linux runner's PID namespace and no-new-privileges`, and roadmap rows 21 and 35. Pass 2 had nothing to reconcile: the supplied `per_task_findings_root`, `harness-runs/task_plan_point_reviews/fix_run_job_credential_exposure_task_plan/`, does not exist, so per-unit review was off.

The required accompanying sets in `.claude/context/conventions.md` → `## What accompanies a new unit of each kind` were checked member by member, and both are complete. For the new configuration key `sandbox.passEnv`: the schema property (`schemas/harness.config.schema.json` → `passEnv`), the model field (`cli/src/config/model.ts` → `HarnessSandbox.passEnv`), the check-module entry (`cli/src/config/check.ts` → `SANDBOX_KEYS` and `checkSandbox`'s `sandbox.passEnv` branch), and the `docs/config.md` §5 row `sandbox.passEnv` are all present. Its consumer is `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_session_pass_env`, which `autonomous-watcher.sh` → `spawn_engine` calls. For the new negative fixture `schemas/negative/sandbox-pass-env-not-a-name.json`: its chained `--invalid` assertion is in `package.json` → `validate:config:negative`.

The diff touches three `harness-runs/lessons.md` rules, and each one is satisfied:
- **Trust checks**, "An unsandboxed script takes its mode and the path of every trust input from a record the session cannot write…". `push-branch.sh` takes its job mode from `lib/harness-run-lib.sh` → `hr_push_credential_is_job_token`. That function reads the `harness.pushCredential` marker from the main checkout's `.git/config` and never from the environment.
- **Unattended control loops**, "A recovery for an unattended run's failure covers every execution mode the failure reaches…". A push-refusal record is acted on in both modes. `autonomous-watcher.sh` → `check_push_refusals` runs from the local tick loop and from `run_job`'s supervision loop, and `classify_run_exit` checks the session's own branch at exit in both.
- **Unattended control loops**, "A process that turns off a shared switch another actor can turn on must … switch it back on if needed". `remote-run.sh` → `deliver` turns a ready pull request back to a draft only when `HARNESS_PR_TOKEN` is set, and always attempts to mark it ready again: first with `HARNESS_GIT_TOKEN`, then, on refusal, once more with the job's token ("retrying once with the job's token"). A final refusal is printed as a `::warning::`.

Two failure paths turn the branch's design against goal 2 and against a fresh run. A `store` that writes no credential still lets the session run, and none of its commits can be pushed (Finding 1). A push refusal recorded while no session was running fails the branch's next launch (Finding 2).

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top to bottom, and the committing role flips each one to `[x]` as that fix's commit lands. Each entry resolves to `harness-runs/code_reviews/fix_run_job_credential_exposure_code_review/finding_<K>.md` through its `**Finding K**` reference.

1. [x] **Finding 3** — Remove the uncalled `sandboxPassEnv` export and its doc-comment link _(layer: cli)_
2. [ ] **Finding 1** — Make a `push-credential store` that writes no usable credential exit 1, so the `run` job stops before its session _(layer: cli)_
3. [ ] **Finding 2** — File push-refusal records that predate a launch as handled in `spawn_engine`, so they cannot fail the new session _(layer: cli)_

---

## Must Fix

### 1. A `push-credential store` that writes nothing exits 0, so the `run` job starts a session that can never push and its commits are lost with the runner
→ [finding_1.md](fix_run_job_credential_exposure_code_review/finding_1.md)

### 2. A push-refusal record written while the branch has no running session fails that branch's next launch at its first tick
→ [finding_2.md](fix_run_job_credential_exposure_code_review/finding_2.md)

### 3. `sandboxPassEnv` is a new export with no caller
→ [finding_3.md](fix_run_job_credential_exposure_code_review/finding_3.md)

---

## Should Fix

None.

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from, and this section has no entries.
