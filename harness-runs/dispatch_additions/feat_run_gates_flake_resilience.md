# Dispatch additions — feat_run_gates_flake_resilience

## [A2 · arch-review · iter 0] → architecture-reviewer  (#12)
- **added:** `context_notes:`
- **verbatim:** this checkout has no local `dev` ref; `origin/dev` exists at c7d4cec4 (source: `git rev-parse --verify -q dev` prints nothing, `git rev-parse --verify -q origin/dev` prints c7d4cec464f95ab8b8831fb3aa20ddc69e121c16)
- **why the agent could not derive it:** the dispatch block names `diff_base: dev`, and no file the reviewer reads states that the run copy carries only the remote-tracking ref; the Task 2 implementer's own `git diff dev` failed with `fatal: bad revision 'dev'` (recorded in `harness-runs/task_plans/feat_run_gates_flake_resilience/task_2_plan.md`)

## [B · review-plan · iter 0] → branch-reviewer  (#13)
- **added:** `context_notes:`
- **verbatim:** this checkout has no local `dev` ref; `origin/dev` exists at c7d4cec4 (source: `git rev-parse --verify -q dev` prints nothing, `git rev-parse --verify -q origin/dev` prints c7d4cec464f95ab8b8831fb3aa20ddc69e121c16)
- **why the agent could not derive it:** the B.1 dispatch block names no diff base and `harness.config.json` names `defaultBranch: dev`; no file the reviewer reads states that the run copy carries only the remote-tracking ref

## [C2 · skeptic-review · iter 0] → skeptic-reviewer  (#22)
- **added:** `context_notes:`
- **verbatim:** this checkout has no local `dev` ref; `origin/dev` exists at c7d4cec4 (source: `git rev-parse --verify -q dev` prints nothing, `git rev-parse --verify -q origin/dev` prints c7d4cec464f95ab8b8831fb3aa20ddc69e121c16)
- **why the agent could not derive it:** the C2.1 dispatch block names no diff base and `harness.config.json` names `defaultBranch: dev`; no file the reviewer reads states that the run copy carries only the remote-tracking ref
