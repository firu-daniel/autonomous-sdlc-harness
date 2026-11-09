# Task plan review — iteration 1

## Must Fix
1. **Three Verification bullets limit the task's test runs in a way that excludes point 7's tree-guard run.** Files: `task_1_plan.md`, `task_2_plan.md`, `task_3_plan.md`.
   The rule is `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`, point 4: "no plan sentence limiting a unit's test runs … cancels point 7: the guard run is the loop's, never the plan's". Each of these three tasks edits a path that a `treeGuards` entry in `harness.config.json` covers, and each has a sentence that tells the implementer not to run other suites.
   - `task_1_plan.md`, **Verification**, the "No existing output changes (by reading)" bullet, says: "The existing suites over this program run at the Run gates round, not in this task." `cli/test/jq-floor.test.mjs` is a tree guard (`covers: cli/templates/scripts/**/*.jq`). It names this program in `REQUIRED_PROGRAMS = ['lib/run-analytics.jq', 'lib/run-analytics-report.jq']`, so it is an "existing suite over this program". Point 7 selects it whenever Task 1 edits `cli/templates/scripts/lib/run-analytics.jq`, and the sentence above tells the implementer not to run it.
   - `task_2_plan.md`, **Verification**, the "No other existing assertion breaks" bullet, says: "(by reading, not by running another suite) … Those suites run at the Run gates round." Task 2 edits `cli/templates/scripts/lib/run-analytics-report.jq`, so the same `jq-floor.test.mjs` guard is selected.
   - `task_3_plan.md`, **Verification**, the "Other suites" bullet, says: "(by reading, not by running another suite) … Those suites run at the Run gates round." Task 3 changes four paths, and each one selects at least one guard:
     - `cli/templates/scripts/run-analytics.sh` selects `test/shipped-scripts-mktemp.test.mjs` and `test/watcher-main-anchor.test.mjs`.
     - The new `cli/test/run-analytics-network.test.mjs` and the edited `cli/test/run-analytics-rounds.test.mjs` select `test/main-anchor-isolation.test.mjs`.
     - `cli/src/generators/outerLoopScripts.ts` selects `test/retrieval-loading.test.mjs`.
   **Fix:** In each of the three bullets, delete the clause that limits runs: "The existing suites over this program run at the Run gates round, not in this task." in Task 1, and "not by running another suite" with its trailing "Those suites run at the Run gates round." in Tasks 2 and 3. If the bullet still needs to say how the check is made, say only that this check is made by reading the named suites. Add no sentence about which test files the task runs, and do not name any guard.

2. **The previous review's Should Fix was neither applied nor recorded, which repeats a ledger lesson.** Files: `task_2_plan.md` (Work bullet 2) or the story index (`feat_network_refusal_report_story_plan.md`).
   The ledger entry in `harness-runs/lessons.md` → *Unattended control loops* reads: "**In a revision round, a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason. It is never held for a go-ahead the loop does not relay.**"
   `review_0.md`, Should Fix 1, reported that "`.run.network` cannot be computed inside `run_of` as `run_of` is called today". The revised plan still has that problem:
   - Task 2's Work bullet 2 is still headed "**`.run.network` in `run_of`**".
   - It still defines `gate_logs_scanned` as `(.gate_logs // []) | length`.
   - `cli/templates/scripts/lib/run-analytics-report.jq` still calls the function as `.run = (.sessions | run_of)`. Its comment says "Input: .sessions". `whole_run` also calls it over the sessions array.
   - So inside `run_of`, `.gate_logs` would index an array, which is an error in jq. The header's `Owns:` sentence ("recomputing a run-analytics document's `.run` from its `.sessions`") is still not among Work bullet 1's header edits.
   - The story index has no `## Rejected findings` section, so the finding was not recorded as rejected either.
   **Fix:** Do one of these two things.
   - **Apply it** in `task_2_plan.md`. State where `network` is built, for example `rollup` becomes `.run = ((.sessions | run_of) + {network: <computed from the whole document>})`, and `run_of`'s own keys stay unchanged. Retitle Work bullet 2 to match. Add the header's `Owns:` sentence to Work bullet 1's header edits, so that it names `.gate_logs` as an input to the roll-up.
   - **Or record it** as rejected, with its reason, in a trailing `## Rejected findings` section of the story index.

## Should Fix
1. **The "exactly three lines" sentence in `branch-status` becomes false.** File: `task_5_plan.md`, the network-lines Work bullet.
   Step 4's **Run analytics** bullet in `plugin/commands/branch-status.md` says "From the record read, print exactly three lines from its `.run` object". Task 5 adds the network lines "after the three lines" but leaves that sentence as it is, so the command would contradict itself. Its Targets line limits the edit to that bullet, which is the right scope.
   **Fix:** Add a sub-step that restates the sentence, for example "print these three lines from its `.run` object, then the network lines below", so it no longer claims exactly three.

2. **The call-state field for the raw command needs its own name.** File: `task_1_plan.md`, the Mode `sessions` Work bullet.
   `add_call` already stores a `command` in each call's state: the Bash command passed through `redact`, which cuts it to 160 characters. `finalize` groups the `polling` rows on it (`select(.tool == "Bash" and .command != null)`, `group_by([.context, .command])`). The bullet says "keeps the Bash call's raw `input.command` in the call's state" but gives the field no name. Writing the raw command into `.command` would change the `polling` output, which the bullet's own "no existing output changes" claim rules out.
   **Fix:** Name a new field, for example `raw_command`. State that the existing `command` field and the `polling` rows built from it stay unchanged.

## Nice to Have
1. **The ARCHITECTURE.md coupling row has a fourth cell.** File: `task_7_plan.md`. The fourth cell of the `autonomous-format-stream.sh` row says what an engine adapter would have to provide. Task 7 extends the second and third cells only. One clause there saying that the network report needs the engine's refusal text in each `tool_result` would keep the seam description complete.
