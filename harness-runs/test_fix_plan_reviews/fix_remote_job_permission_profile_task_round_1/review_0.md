# Architecture review — iteration 0

Layer placement for both findings is correct. Finding 1 (`harness-runs/task_prompts/…`) is `general`. Finding 2's fix targets `scripts/run-gates.sh` (tracked at the root, with no `cli/templates/scripts/` source, so it is `general`), plus `cli/src/` / `cli/templates/` / `cli/test/`, which are `cli`. Its tag `cli, general` is bottom-up with the catch-all last. Neither the index nor the per-finding files quote a machine path. The one blocking problem is the test-run rule.

## Must Fix
1. **Finding 2 asks the unit to search for its failing tests among candidate test files by running them** — offending file: `finding_2.md` (the `**Failing test:**` line and the second and third `**Fix.**` sub-steps). Rule source: `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, points 1 and 4. The writer's own contract repeats the rule: `plugin/agents/test-fix-plan-writer.md` → the per-finding-files paragraph, *"No finding asks for a test run, gate run or test-file run"*.
   The `**Failing test:**` line says outright that the failing tests are "not named in the log". It lists four *candidate* files (`cli/test/doctor.test.mjs`, `cli/test/init.test.mjs`, `cli/test/watcher-remote-job.test.mjs`, `cli/test/workflow-templates.test.mjs`). The sub-step "**Find the two failing cases.** … For each one, read the assertion message the test reports" can only be done by running those files, because an assertion message exists only in a run's output. The diagnosis itself admits that reading the files statically "shows no mismatch" and that the answer "has to come from the tests' own output". Row `G.4`'s exception covers only the test file(s) the finding names, and point 1 says why that is safe: "the finding names the test and nothing is searched for". Here nothing is named and the unit is told to search, which is the case point 1 excludes. Point 4 makes a sub-step that asks for this a Must Fix.
   **Fix:** In `finding_2.md`, remove every instruction that needs a test file to run, including "read the assertion message the test reports" and anything that depends on it. Keep the gate-log change in `scripts/run-gates.sh` → `gate()` as the finding's actionable fix: it is what lets the next round's log name the two failing tests. For the two unnamed failures, pick one of these:
   - Make any source or test change conditional on a mismatch the unit can show by statically reading the candidate files against the source they exercise, with no run.
   - State plainly that this round's fix is the log change only, and that the two failures will be named, and then fixed, from the next round's log.
   Either way, rewrite the `**Failing test:**` line so it does not present the four candidates as the files the unit may run. Also drop the `**Resolved:**` sub-step's requirement to record "the names of the two failing tests found", which again assumes a run.

## Should Fix

## Nice to Have
