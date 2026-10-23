# Dispatch additions — fix_run_gates_background_run_handling

## [A · Task 2 · cli · iter 0] → layer-implementer  (#3)
- **added:** `context_notes:`
- **verbatim:** context_notes: Task 1 (commit 03d1ab7c) recorded measured SIGNALS observations in its plan file's Deviations from plan note — sandboxed, a KILL to the worker PID alone left the label's heartbeat fresh in 6 of 8 runs, and INT did not stop the gate run (source: harness-runs/task_plans/fix_run_gates_background_run_handling/task_1_plan.md → **Deviations from plan:**, and the SIGNALS section of cli/templates/scripts/run-test-suite.sh).
- **why the agent could not derive it:** the measurements were written into `task_1_plan.md`'s deviation note during Task 1's implementation; Task 2's detail file (`task_2_plan.md`) predates them and does not name that note.

## [A · Task 11 · general · iter 0] → layer-implementer  (#21)
- **added:** `context_notes:`
- **verbatim:** context_notes: Task 1 (commit 03d1ab7c) and Task 2 (commit ccf46f5e) each appended a **Deviations from plan:** note with sandboxed measurements of the detached worker's signal and heartbeat behaviour, including a heartbeat that stopped refreshing with no signal sent in 1 of 6 runs (source: harness-runs/task_plans/fix_run_gates_background_run_handling/task_1_plan.md and task_2_plan.md → **Deviations from plan:**).
- **why the agent could not derive it:** both deviation notes were written during implementation, after `task_11_plan.md` was written; Task 11's detail file does not name them.

## [C · Item 1 · cli · iter 0] → layer-implementer  (#31)
- **added:** `context_notes:`
- **verbatim:** context_notes: This unit's readiness entry is tagged `_(layer: cli, general)_`; the orchestrator dispatches the `general` layer (path `.`) for this same unit immediately after this `cli` dispatch, and that dispatch owns `scripts/run-test-suite.sh` — the commit lands once, after both layers (source: harness-runs/code_reviews/fix_run_gates_background_run_handling_code_review.md → `## Phase 2 Readiness — Ordered Fix List`, entry 1).
- **why the agent could not derive it:** the finding file names both copies but not the layer split; dispatch #30 for the same unit, carrying no note, returned an unmarked blocker asking for exactly this split.

## [C · Item 1 · general · iter 0] → layer-implementer  (#32)
- **added:** `context_notes:`
- **verbatim:** context_notes: The preceding `cli` dispatch of this same unit already applied the fix to `cli/templates/scripts/run-test-suite.sh` (uncommitted in the working tree; its note is under **Deviations from plan:** in the finding file); this `general` dispatch owns `scripts/run-test-suite.sh` (source: harness-runs/code_reviews/fix_run_gates_background_run_handling_code_review.md → readiness entry 1, tagged `_(layer: cli, general)_`).
- **why the agent could not derive it:** the sibling layer's edit is uncommitted and the finding file does not record which dispatch owns which copy.

## [C · Item 2 · cli · iter 0] → layer-implementer  (#34)
- **added:** `context_notes:`
- **verbatim:** context_notes: This unit's readiness entry is tagged `_(layer: cli, general)_`; the orchestrator dispatches the `general` layer (path `.`) for this same unit immediately after this `cli` dispatch, and that dispatch owns `scripts/run-test-suite.sh` — the commit lands once, after both layers (source: harness-runs/code_reviews/fix_run_gates_background_run_handling_code_review.md → `## Phase 2 Readiness — Ordered Fix List`, entry 2).
- **why the agent could not derive it:** the finding file names both copies but not the layer split (same gap as #30/#31).

## [C · Item 2 · general · iter 0] → layer-implementer  (#35)
- **added:** `context_notes:`
- **verbatim:** context_notes: The preceding `cli` dispatch of this same unit already applied the fix to `cli/templates/scripts/run-test-suite.sh` (uncommitted in the working tree; its note is under **Deviations from plan:** in the finding file); this `general` dispatch owns `scripts/run-test-suite.sh` (source: harness-runs/code_reviews/fix_run_gates_background_run_handling_code_review.md → readiness entry 2, tagged `_(layer: cli, general)_`).
- **why the agent could not derive it:** the sibling layer's edit is uncommitted and the finding file does not record which dispatch owns which copy.

## [G · Item 1 · cli · iter 0] → layer-implementer  (#1)
- **added:** `context_notes:`
- **verbatim:** context_notes: An earlier dispatch on this finding returned a blocker (the prescribed lead change alone fails at cli/test/watcher-remote-job.test.mjs:895 because REMOTE_WAIT_MAX_SECS is pinned to '2'); the operator answered that park — question at harness-runs/clarifications/fix_run_gates_background_run_handling/question_2.md, answer at harness-runs/clarifications/fix_run_gates_background_run_handling/answer_2.md, verbatim: "Q1: (a), combined with Finding 1's lead change — add `RUNNER_ENVIRONMENT: 'self-hosted'` to the subtest's env AND use `rateLimitRejected(REPEAT_RESET_AHEAD_SECS)` with `seq 1 ${REPEAT_PAUSE_WAIT_TENTHS}`; keep `REMOTE_WAIT_MAX_SECS: '2'` and every assertion unchanged. Comment that the case asserts the post-reset bound (which applies self-hosted included), so self-hosted is used to bypass the hosted lead admission, which other cases cover."
- **why the agent could not derive it:** the operator's ruling exists only in the machine-local clarification answer file, which the finding file (`test_fix_plans/…_task_round_1/finding_1.md`) predates and does not name.

## [G · Item 2 · cli · iter 0] → layer-implementer  (#3)
- **added:** `context_notes:`
- **verbatim:** context_notes: This unit's readiness entry is tagged `_(layer: cli, general)_`; the orchestrator dispatches the `general` layer (path `.`) for this same unit immediately after this `cli` dispatch, and that dispatch owns the files outside `cli/` (e.g. `scripts/run-test-suite.sh`) — the commit lands once, after both layers (source: harness-runs/test_fix_plans/fix_run_gates_background_run_handling_task_round_1.md → `## Phase 2 Readiness — Ordered Fix List`, entry 2).
- **why the agent could not derive it:** the finding file names both copies but not the layer split (the same gap Phase C's dispatch #30 returned a blocker on).

## [G · Item 2 · general · iter 0] → layer-implementer  (#4)
- **added:** `context_notes:`
- **verbatim:** context_notes: The preceding `cli` dispatch of this same unit already applied the fix to `cli/templates/scripts/run-test-suite.sh` (uncommitted in the working tree; its note is under **Deviations from plan:** in the finding file); this `general` dispatch owns `scripts/run-test-suite.sh` (source: harness-runs/test_fix_plans/fix_run_gates_background_run_handling_task_round_1.md → readiness entry 2, tagged `_(layer: cli, general)_`).
- **why the agent could not derive it:** the sibling layer's edit is uncommitted and the finding file does not record which dispatch owns which copy.
