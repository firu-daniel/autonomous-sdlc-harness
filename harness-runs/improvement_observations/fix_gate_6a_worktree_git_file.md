## The configured test gate still exits 1 in a worktree run, now on gate 1a
- **category:** tooling-gap
- **evidence:** every `layer-implementer` dispatch (Tasks 1, 2 and 3) and the `branch-reviewer` / `skeptic-reviewer` reported `bash scripts/test.sh` / `bash scripts/run-gates.sh` exiting 1. Task 3's run printed `run-gates: 1 failed, 15 passed`, and the one failure was `1a plugin manifest`: `claude plugin validate --strict plugin` turns six warnings about an unquoted `${CLAUDE_PLUGIN_ROOT}` in `plugin/hooks/hooks.json` into errors. This branch touches neither manifest nor `hooks.json`.
- **cost this run:** `commands.test` did not go green on any unit, even after this branch fixed gate 6a. Each implementer and both end-of-branch reviewers diagnosed the same out-of-scope failure again.
- **hypothesis:** a newer `claude` CLI validator became stricter than the one the gate was written against.

## `bash -n` on a script is refused in an unattended run
- **category:** tooling-gap
- **evidence:** Task 1's `layer-implementer` reported that `bash -n scripts/run-gates.sh` was "refused (it needs approval)". It used two full runs of the edited script as its syntax evidence instead, and recorded that as a deviation in `harness-runs/task_plans/fix_gate_6a_worktree_git_file/task_1_plan.md`.
- **cost this run:** the plan's syntax check was replaced with indirect evidence.

## A bare `grep` in an agent's Bash tool skips gitignored files
- **category:** silent-failure
- **evidence:** the `task-plan-writer` reported that in the agent Bash tool a bare `grep` is a shell function that runs ugrep, which skips gitignored files, while `bash scripts/run-gates.sh` uses the real grep. This branch's question was which gitignored files gate 6a reads (`.claude/settings.autonomous.json`, `harness-runs/autonomous_logs/`), so every hand check in the three task files had to be written as `command grep`.
- **cost this run:** none measured. A hand check written as a bare `grep` would have hidden exactly the gitignored hits this branch had to establish.
