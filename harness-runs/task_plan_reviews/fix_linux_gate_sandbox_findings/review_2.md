# Task plan review — iteration 2

## Must Fix

1. **Task 1's Verification limits the task's test runs, which leaves out the tree-guard run point 7 requires.** File: `task_1_plan.md`.
   The third Verification bullet now reads: *"The only test command this task runs is the plain one above, with no environment prefix, pipe or `cd`"*. Task 1 edits `cli/test/doctor-profile-sandbox.test.mjs`. That path matches the `treeGuards` entry `{ "test": "test/main-anchor-isolation.test.mjs", "covers": "cli/test/**/*.mjs" }` in `harness.config.json`, so the unit loop has to run that guard after the unit's own test run. `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 4 forbids this exact kind of sentence: *"no plan sentence limiting a unit's test runs (*"that is the only test file this task runs"*) cancels point 7: the guard run is the loop's, never the plan's"*. Every reviewer of a plan must raise a breach of point 4 as a Must Fix. This sentence came in with the revision that dropped iteration 0's env-prefixed run, and it went further than that fix needed.
   **Fix:** In `task_1_plan.md`, reword the bullet so that it constrains only the **shape** of the task's own test run and does not cap how many test runs there are. For example: *"The task's own test run is the plain command above, with no environment prefix, pipe or `cd` (`.claude/context/conventions.md` → `## The testing bar`)."* Keep the rest of the bullet: no intermediate tree state is run, and the cause stays read from the code. Do not add a sentence that names or excludes the tree guards. They run because the loop selects them, not because the plan says so.

## Should Fix

None.

## Nice to Have

1. Story index (`fix_linux_gate_sandbox_findings_story_plan.md`), `## Context` → **Order.**: add one line noting that the configured layer order (`cli`, `plugin`, then `general` last) gives way here to the script-then-test dependency. That is why the readiness list switches between `cli` and `general`, and only the final task is the catch-all's. This is carried over from iterations 0 and 1. It is optional, and the lessons entry that binds Should Fix items does not cover it.
