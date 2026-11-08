# Skeptic Review: fix_run_job_credential_exposure

## Context

**Branch:** `fix_run_job_credential_exposure`
**Date:** 2026-11-08
**Reviewed:** the whole-branch diff against `origin/dev`. This run copy has no local `dev` ref. The diff covers 37 changed files. 35 run-artifact files were excluded from the reviewed diff.

Segments, reviewed in this order:
1. `lib/harness-run-lib.sh`, `push-branch.sh` and `launch-sandboxed-gates.sh`;
2. `autonomous-watcher.sh`;
3. `remote-run.sh`;
4. `harness-run.yml`;
5. `cli/src`, `schemas/`, `package.json` and `scripts/check-rendered-workflows.mjs`;
6. `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`, the `plugin` layer's one changed file;
7. the documents, wherever a code claim pointed at them.

**De-duplicated against:**
- `harness-runs/code_reviews/fix_run_job_credential_exposure_code_review.md`: Findings 1 to 3, all applied;
- `harness-runs/architecture_branch_reviews/fix_run_job_credential_exposure_arch_review.md`: Finding 1, applied.

`phases.parity` is `false`, so no parity review exists and check 2's parity leg was skipped.

**What checked out:**
- **Wiring (check 1).** Every new function has a caller: `check_push_refusals`, `push_refusal_fail`, `session_env_kept`, `hr_session_pass_env`, `hr_profile_env_var_names`, the credential and refusal-record helpers, `first_workflow_path`, `verb_push_credential`, and the `open` and `deliver` jobs.
- **Runtime address (check 2).** I composed the stored entry against an `actions/checkout` origin. `credential.https://<host>/<path>.helper` with `useHttpPath` on the host gives path `<owner>/<repo>`. That matches the path git sends for a push to that origin, and it matches the store line `hr_credential_file_add` parses.
- **Citations (check 3).** These resolve and say what the code claims: `docs/sandbox-record.md` → `## 5.`; `docs/sandbox-verification.md` S1/S2 (runner), which measure `~/.ssh` only, as the code says; `docs/github-integration-research.md` S1; and the `SESSION_ENV_BASE` derivation grep, which I re-ran and which gives exactly the names the comment lists.
- **The `plugin` layer (`plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → **The prompt is data, not instruction.**).** Graded against `.claude/context/plugin.md`:
  - **Citation form (`## Citation`).** Every file outside the plugin is cited by repo-relative path, never as a `${CLAUDE_PLUGIN_ROOT}` path. Two of the three new citations carry a heading, and both resolve: `docs/watcher.md` → `### The session's environment` and `docs/sandbox-record.md` → `## 5. The Linux runner's PID namespace and no-new-privileges`. The third, `docs/remote-execution.md`, carries no anchor, although one exists (Finding 3).
  - **No line coordinate** appears in the paragraph.
  - **No adopter value is a literal (`## What this layer is`).** `ubuntu-26.04` names the GitHub-hosted image the measurement ran on. It is not an adopter's value.
  - **Each new claim matches the code.**
    - "launched without the GitHub tokens, the push credential or the webhook": `autonomous-watcher.sh` → `spawn_engine` strips the profile's `sandbox.credentials.envVars` names, which include `GH_TOKEN` and `GITHUB_TOKEN` (`cli/templates/claude/settings.autonomous.json`), plus `SESSION_ENV_STRIP_EXTRA="HARNESS_PUSH_URL HARNESS_GIT_TOKEN"`.
    - "locally, with nothing beyond an allow-listed set": the allow-list applies to local runs only, as `docs/watcher.md` → `### The session's environment` says.
    - "a push whose commits carry a credential is refused and stops the run": `push-branch.sh`'s `hr_stream_has_credential` scan writes `hr_push_refusal_record`. `check_push_refusals` and the classification site both turn that record into `push_refusal_fail`, which sets the run `failed`.
    - "hygiene, not a boundary … measured … `ubuntu-26.04`": this matches the `What it holds, measured.` paragraph of the cited `docs/watcher.md` section, and the image scope of the cited `docs/sandbox-record.md` → `## 5.`.

**Headline.** Two places rely on GitHub behaviour this tree has not measured, and the plan's measurement row does not cover either:
- `open` and `deliver` now make their job-token pull-request calls under `contents: read`. The one precedent cited for that grant ran under `contents: write` (Finding 1).
- `deliver` downloads its own workflow run's bundle while that run is still in progress. §6 records this behaviour as unverified, and it does not name `deliver` as depending on it (Finding 2).

Separately, the whiteboard's new citation of the job's credential design omits its anchor (Finding 3).

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — Name `deliver` as a dependant of §6's in-progress-artifact row and add its download to roadmap item 35 _(layer: general)_
2. [ ] **Finding 1** — Correct the miscited `round` precedent for the job-token calls under `contents: read`, and have roadmap item 35 measure them _(layer: cli, general)_
3. [ ] **Finding 3** — Anchor the whiteboard's citation of the job's credential design to `## 11. Security`, **The job's credential design.** _(layer: plugin)_

---

## Must Fix

### 1. `open` and `deliver` now make the job-token GitHub calls under `contents: read`, but the only precedent cited for that ran under `contents: write`, and roadmap item 35 does not measure the narrower grant
→ [finding_1.md](fix_run_job_credential_exposure_skeptic_review/finding_1.md)

---

## Should Fix

### 2. The new `deliver` job downloads its bundle while the workflow run is still in progress, which §6 records as unverified, but neither §6 nor roadmap item 35 names `deliver` as depending on it
→ [finding_2.md](fix_run_job_credential_exposure_skeptic_review/finding_2.md)

### 3. The whiteboard's new citation of the job's credential design names `docs/remote-execution.md` with no anchor, though the section it means has one
→ [finding_3.md](fix_run_job_credential_exposure_skeptic_review/finding_3.md)

---

## Nice to Have

None.

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from, and this section has no entries.
