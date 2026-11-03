## Task plans prescribed a verification run outside the sandbox, which no command in the autonomous run could reach
- **category:** agent-contract
- **evidence:** `harness-runs/task_plans/fix_stall_stub_release_marker/task_2_plan.md` and `task_3_plan.md` each asked for a release-removed simulation run outside the sandbox. Both `layer-implementer` returns (Task 2, Task 3) reported "no command in this run can leave the sandbox". Each ran the simulation inside the sandbox and appended a `**Deviations from plan:**` note to its task file, committed in e880f463 and e0dd0d88.
- **cost this run:** the outside-the-sandbox behaviour the plans named stayed unverified. Both implementers handed it back as an operator follow-up.
- **hypothesis:** the plan writer and the plan reviewers may not account for which verification environments an unattended run can reach.

## Temporary-edit commands refused during implementer simulations
- **category:** tooling-gap
- **evidence:** the Task 2 `layer-implementer` return reported that a bulk `perl -pi` rewrite (to mark cases `test.skip`) was refused, and it fell back to a temporary edit-tool wrapper. The Task 3 `layer-implementer` return reported that a `cp` backup command was refused, and it fell back to edit-tool temporary edits. Both are recorded as deviations in their task files (e880f463, e0dd0d88).
- **cost this run:** extra edit-and-revert round-trips in two units. Task 3 left three cases unrun in isolation under the skip setup.
