# Skeptic Review: feat_forge_run_control_pr_at_start

## Context

**Branch:** `feat_forge_run_control_pr_at_start`
**Date:** 2026-10-06
**Reviewed:** the whole branch diff against `dev` (38 files), reviewed adversarially. 27 run-artifact files were excluded from the reviewed diff. The review covered:

- the new `open` verb and `forge_open_pr`;
- `deliver`'s ready flip and `deliver_round_threads`, including the REST reply path, the GraphQL `reviewThreads` pagination, `resolveReviewThread`, the `git log -S` fix-commit lookup and the full-depth checkout it relies on;
- `report`'s `round` undo, `failed` and `stopped` wording, and `forge_progress`;
- the widened `forge_recognised` and its effect on `control_check_branch`;
- `hr_ledger_phases` against `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.3 Templates`;
- the watcher's `job_progress_pass`, both its wiring into `run_job` and its sourcing of the run library;
- the `harness-run.yml` open step, with its `chain == 0` gate against the `number` input, its token and its permissions;
- the `execution.progressComments` contract.

**De-duplicated against:** `harness-runs/code_reviews/feat_forge_run_control_pr_at_start_code_review.md` and its three findings. No parity review exists (`phases.parity` is `false`), and no architecture branch review exists for this branch. Nothing in the lessons ledger is re-flagged.

**Conclusion:** every new write path is reached from its caller, and every GitHub address the branch builds composes to a valid endpoint. One net-new defect remains. When a round starts and turning the pull request back to a draft is refused, the round comment still says it is a draft again. Refusal is the expected outcome on a plan without drafts, which the branch itself documents in `docs/github-run-control.md` → `## 8.`. The fix follows the precedent `deliver` already sets: run the flip, then word the comment by its outcome.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom, and the committing role flips each one to `[x]` as that fix's commit lands. **Only the committing role flips a marker.** That is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else, such as sub-step bullets inside the per-finding files, are informational only, and the committer never touches them.

Each entry resolves to `harness-runs/skeptic_reviews/feat_forge_run_control_pr_at_start_skeptic_review/finding_<K>.md` through its `**Finding K**` reference.

1. [ ] **Finding 1** — Word the round's start comment by the outcome of turning the pull request back to a draft _(layer: cli)_

---

## Must Fix

None.

---

## Should Fix

### 1. A round's start comment says the pull request is a draft again even when turning it back to a draft was refused
→ [finding_1.md](feat_forge_run_control_pr_at_start_skeptic_review/finding_1.md)

---

## Nice to Have

None.

---

## Intentional divergences (call-outs, not fixes)

`phases.parity` is `false`, so there is no reference implementation to diverge from. Two plan decisions were re-graded and stand:

- **The `failed` comment on a task run's pull request no longer offers a review requesting changes.** The code comment's reason is that a round would start over a run that never completed. A `failed` record has no resume path, so the comment's routes (close the pull request, or re-apply the trigger label) are the ones that exist. The task prompt's *"(close it, or resume)"* is met by the `stopped` wording.
- **A resume from the issue after the pull request was closed opens a second draft.** This is stated in `docs/github-run-control.md` → §4, *What opening at the start changes*.
