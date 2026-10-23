# Dispatch additions — fix_run_gates_background_run_handling

## [A · Task 2 · cli · iter 0] → layer-implementer  (#3)
- **added:** `context_notes:`
- **verbatim:** context_notes: Task 1 (commit 03d1ab7c) recorded measured SIGNALS observations in its plan file's Deviations from plan note — sandboxed, a KILL to the worker PID alone left the label's heartbeat fresh in 6 of 8 runs, and INT did not stop the gate run (source: harness-runs/task_plans/fix_run_gates_background_run_handling/task_1_plan.md → **Deviations from plan:**, and the SIGNALS section of cli/templates/scripts/run-test-suite.sh).
- **why the agent could not derive it:** the measurements were written into `task_1_plan.md`'s deviation note during Task 1's implementation; Task 2's detail file (`task_2_plan.md`) predates them and does not name that note.

## [A · Task 11 · general · iter 0] → layer-implementer  (#21)
- **added:** `context_notes:`
- **verbatim:** context_notes: Task 1 (commit 03d1ab7c) and Task 2 (commit ccf46f5e) each appended a **Deviations from plan:** note with sandboxed measurements of the detached worker's signal and heartbeat behaviour, including a heartbeat that stopped refreshing with no signal sent in 1 of 6 runs (source: harness-runs/task_plans/fix_run_gates_background_run_handling/task_1_plan.md and task_2_plan.md → **Deviations from plan:**).
- **why the agent could not derive it:** both deviation notes were written during implementation, after `task_11_plan.md` was written; Task 11's detail file does not name them.
