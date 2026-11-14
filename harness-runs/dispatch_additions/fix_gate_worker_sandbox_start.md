# Dispatch additions — fix_gate_worker_sandbox_start

## [A · Task 2 · cli · iter 0] → layer-implementer  (#3)
- **added:** `context_notes:`
- **verbatim:** context_notes: Task 1 landed with a deviation — the probe's fixture builds its `.git` by hand rather than with `git init -q`, and its in-session readings are recorded — see the `**Deviations from plan:**` note in harness-runs/task_plans/fix_gate_worker_sandbox_start/task_1_plan.md (commit 23f36416).
- **why the agent could not derive it:** task_2_plan.md, written before Task 1 ran, still describes the fixture as `git init -q`; the deviation exists only in task_1_plan.md, outside Task 2's read set.

## [A · Task 3 · cli · iter 0] → layer-implementer  (#5)
- **added:** `context_notes:`
- **verbatim:** context_notes: Task 2 (commit 8d09a353) removed `nohup` from the worker launch in cli/templates/scripts/run-test-suite.sh; its implementer reported that the existing case near line 568 of cli/test/run-test-suite.test.mjs fakes `nohup` to force the start-up refusal and so no longer refuses — see the `**Deviations from plan:**` note in harness-runs/task_plans/fix_gate_worker_sandbox_start/task_2_plan.md.
- **why the agent could not derive it:** the broken-seam fact was in Task 2's implementer return, not in task_3_plan.md.

## [A · Task 4 · cli · iter 0] → layer-implementer  (#7)
- **added:** `context_notes:`
- **verbatim:** context_notes: Task 1 landed with a deviation — the probe's fixture builds its `.git` by hand rather than with `git init -q` — see the `**Deviations from plan:**` note in harness-runs/task_plans/fix_gate_worker_sandbox_start/task_1_plan.md (commit 23f36416).
- **why the agent could not derive it:** task_4_plan.md predates Task 1's deviation; the deviation exists only in task_1_plan.md.

## [A · Task 6 · general · iter 0] → layer-implementer  (#11)
- **added:** `context_notes:`
- **verbatim:** context_notes: Task 1 landed with a deviation — the probe's fixture builds its `.git` by hand rather than with `git init -q` — and its in-session readings are recorded in the `**Deviations from plan:**` note of harness-runs/task_plans/fix_gate_worker_sandbox_start/task_1_plan.md (commit 23f36416); Task 2's pre-fix readings are in its note in harness-runs/task_plans/fix_gate_worker_sandbox_start/task_2_plan.md (commit 8d09a353).
- **why the agent could not derive it:** task_6_plan.md predates both deviations, which exist only in task_1_plan.md and task_2_plan.md.
