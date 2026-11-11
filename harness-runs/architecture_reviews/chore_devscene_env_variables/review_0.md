# Architecture review — iteration 0

## Must Fix

1. **Task 2 retypes the runner variable's name as a literal in `doctor`'s `--help` text instead of reading it through `RUNNER_VARIABLE`** — `task_2_plan.md`, the `commands/doctor.ts` Work bullet; also `chore_devscene_env_variables_story_plan.md` → `## Context` → **Mirror pairs and constant owners.** Rule: `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time` → *"An environment-variable name is a constant with an owner too … each read through its constant and never retyped as a literal — including in the message that names it to a reader"*, together with *"The shared constants have owners, and a value is imported from its owner rather than retyped"* in the same section.

   `cli/src/commands/doctor.ts` → the `--help` string array, at the substring `'which runner HARNESS_RUNNER selects. A call that times out or cannot reach GitHub warns rather than'`, spells the repository-variable name as a literal. The owner of that name is `RUNNER_VARIABLE` in `cli/src/remote/githubActions.ts`, which the index's own **Mirror pairs and constant owners** paragraph names. Task 2's Work bullet says *"the `--help` line 'which runner HARNESS_RUNNER selects' becomes `DEVSCENE_RUNNER`"*. That writes a second, retyped copy of the constant's new value into a reader-facing message. The rule forbids this, and Task 1 cites the same rule to move the corpus guard off a literal. Neighbouring lines of the same array already interpolate owned constants (`${CHECK_GITHUB_FLAG}`, `${CHECK_REGISTRY_FLAG}`, `${REMOTE_JOB_FLAG}`), and `cli/src/commands/init.ts` and `cli/src/doctor/checks.ts` build every other runner-variable message from `${RUNNER_VARIABLE}`. So this line is the one message that drifts from the constant, and this branch's rename is what would expose that drift.

   The index's claim that *"Every `init` and `doctor` message … is built from these constants, so Task 2 changes their text"* is false for this line. The plan makes the claim and then plans a literal edit that keeps it false.

   **Fix:** In `task_2_plan.md`, replace the `commands/doctor.ts` half of the last Work bullet with this: import `RUNNER_VARIABLE` from `'../remote/githubActions.js'` into `cli/src/commands/doctor.ts`, and turn the help line into a template literal that interpolates it, `` `which runner ${RUNNER_VARIABLE} selects. A call that times out or cannot reach GitHub warns rather than` ``. Leave every other byte of the line as it is, so no table token is left as a literal in a `cli/src` message. Add a Verification bullet: `git grep -n 'RUNNER_VARIABLE' -- cli/src/commands/doctor.ts` lists the import and the help line. In the story index's **Mirror pairs and constant owners** paragraph, either keep the "every message is built from these constants" sentence true by citing this Task 2 change, or qualify it.

## Should Fix

_None._

## Nice to Have

_None._
