# Skeptic Review: feat_remote_execution_github_actions

## Context

**Branch:** `feat_remote_execution_github_actions`
**Date:** 2026-09-26
**Reviewed:** the whole branch diff against `dev`, reviewed adversarially. 66 files were read in five segments:

- the workflow templates;
- `remote-run.sh`;
- the watcher's `job` mode and remote relays;
- the outer-loop library's bundle and registry sections;
- the CLI generators, the `doctor` checks and the plugin commands' remote arms.

56 run-artifact files excluded from the reviewed diff. The findings were de-duplicated against the committed code review (`harness-runs/code_reviews/feat_remote_execution_github_actions_code_review.md`, Findings 1–6) and the architecture review (`harness-runs/architecture_branch_reviews/feat_remote_execution_github_actions_arch_review.md`, Findings 1–4). `phases.parity` is `false`, so no parity review exists and check 2's parity leg is inert.

**What came back clean:**

- **Check 1.** Every new verb and pass has a caller:
  - `pause-requested` and `run-created-at` are called from job mode;
  - `continue`, `poll`, `restore` and `save` from the workflows;
  - the relays from `tick`;
  - `hr_execution_target` from the inbox pass and `remote-run.sh`.
- **Check 2, runtime-address leg.** These assemble into valid addresses:
  - the marketplace and plugin key `autonomous-sdlc-harness@autonomous-sdlc-harness`, against `.claude-plugin/marketplace.json`;
  - the `extraKnownMarketplaces` source path the job reads, against `projectSettings.ts`;
  - the retrieval cache path, against `machine/paths.ts` and `retrieval/runtime.ts`;
  - the plugin and CLI versions (both `0.3.0`).
- **Check 3.** No cited authorization failed to resolve.
- **Check 5, security gating.** Nothing is gated client-only. Every workflow input reaches a shell line through `env:`, and answer keys are digit-checked before becoming file names.

**Headline.** Two net-new runtime defects in job-side state handling, both on paths the branch's suites do not drive:

- **Finding 1, Must Fix.** Any exit between `restore` and job mode's first status write re-uploads the previous job's `status.json` verbatim. The chain count then never grows, so a deterministic failure after a budget pause re-dispatches forever without a notification. It generalises the one trigger code-review Finding 3 closed.
- **Finding 2, Should Fix.** An auto-resume after the hosted budget's PAUSE deletes that PAUSE and never re-drops it, so the job is killed by its step timeout instead of yielding.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 2** — Re-drop the hosted budget's PAUSE when job mode auto-resumes a run after it was dropped _(layer: cli)_
2. [ ] **Finding 1** — Make `save` move aside a restored `remote_status.json` whose `run_id` is not this job's, instead of re-uploading it _(layer: cli)_

---

## Must Fix

### 1. `save` re-uploads the restored previous job's `status.json` whenever job mode never wrote its own, so a deterministic pre-launch failure re-dispatches forever with a chain that never grows
→ [finding_1.md](feat_remote_execution_github_actions_skeptic_review/finding_1.md)

---

## Should Fix

### 2. A failed exit after the hosted budget's PAUSE is auto-resumed with that PAUSE deleted and never re-dropped, so the run is cut off by the step timeout instead of yielding cleanly
→ [finding_2.md](feat_remote_execution_github_actions_skeptic_review/finding_2.md)

---

## Nice to Have

None.

---

## Intentional divergences / call-outs

`phases.parity` is `false`, so there is no reference implementation to diverge from. The divergences the plan declares were re-graded under check 4 and none failed:

- local exit classification is unchanged;
- adopter-tuned `allow` entries do not travel to the job;
- the self-pause is disabled on self-hosted runners.
