# Code Review: feat_forge_run_control_pr_at_start

## Context

**Branch:** `feat_forge_run_control_pr_at_start`
**Date:** 2026-10-06
**Reviewed:** the whole branch diff against `dev` (38 files, +2507/−384). That covers `execution.progressComments` across the schema, `cli/src/config/model.ts`, `cli/src/config/check.ts` and `docs/config.md`; `hr_progress_comments` and `hr_ledger_phases` in `cli/templates/scripts/lib/harness-run-lib.sh`; and, in `cli/templates/scripts/remote-run.sh`, the widened `forge_recognised`, the new `open` verb with its `forge_open_pr`, `deliver`'s ready flip and `deliver_round_threads`, `report`'s `round` undo and `failed`/`stopped` wording, and `report progress` (`forge_progress`). It also covers the `harness-run.yml` open step, the watcher's `job_progress_pass`, the `doctor`/`init` message rewording, the fix-plan writer's `**Review comments:**` wire and its samples, the docs, and the six new or extended `cli/test` suites. 23 run-artifact files excluded from the reviewed diff. Pass 2 reconciliation was a no-op: the per-unit findings root holds no review files.

Every behaviour the plan adds lands with a stub-driven suite (`remote-open`, `remote-progress`, `remote-deliver-threads`, `ledger-phases`, plus extended `remote-deliver`, `remote-report`, `watcher-remote-job`, `workflow-templates`, `config-command`). This review ran none of them; whether they pass is the Run gates phase's to establish. The four-place contract for `execution.progressComments` is closed. `hr_ledger_phases`'s id sets and header forms match `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.3 Templates`, which now names the shell reader. The fix-plan writer, its samples and `test-fix-plan-writer`'s exclusion agree with the `deliver` header's *THE REVIEW-COMMENT LINE*. `phases.parity` is `false`, so no parity cross-check ran. Finding 1 is the one behavioural defect: thread dedupe is scoped to the branch, not the round, so a later round cannot resolve a thread an earlier round replied to. Findings 2 and 3 are a contradictory comment and an incomplete pointer.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below from top to bottom, and the committing role flips each one to `[x]` as that fix's commit lands. **Only the committing role flips a marker**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else, such as sub-step bullets inside the per-finding files, are informational only, and the committer never touches them.

Each entry resolves to `harness-runs/code_reviews/feat_forge_run_control_pr_at_start_code_review/finding_<K>.md` through its `**Finding K**` reference. The leading `N.` is the fix order and `K` is the finding's stable number.

1. [ ] **Finding 3** — Name the `open` paragraph and the open step in `docs/github-run-control.md`'s code-of-record sentence _(layer: general)_
2. [ ] **Finding 2** — Make the issue's `completed` comment say the pull request is still a draft when the ready flip was refused _(layer: cli)_
3. [ ] **Finding 1** — Scope the review-thread reply marker to the round so a later round still replies to and resolves a thread _(layer: cli, general)_

---

## Must Fix

### 1. A thread the harness replied to in an earlier round is never replied to or resolved in a later round
→ [finding_1.md](feat_forge_run_control_pr_at_start_code_review/finding_1.md)

---

## Should Fix

### 2. When the ready flip is refused, the issue's `completed` comment still says the pull request is ready for review
→ [finding_2.md](feat_forge_run_control_pr_at_start_code_review/finding_2.md)

---

## Nice to Have

### 3. `docs/github-run-control.md` names `open` among the verbs it governs but leaves its header paragraph out of the code of record
→ [finding_3.md](feat_forge_run_control_pr_at_start_code_review/finding_3.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so this review has no reference implementation to diverge from and no divergence call-outs.
