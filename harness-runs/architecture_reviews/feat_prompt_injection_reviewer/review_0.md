# Architecture review — iteration 0

Layer placement across all 18 tasks is sound. Every target sits inside the `layers[].path` of the layer its `_(layer: …)_` tag names:
- Tasks 1–7 and 9 are under `cli/`.
- Tasks 8 and 10–15 are under `plugin/`.
- Tasks 16–18 are in the root `general` catch-all.

The cross-half coupling stays contract-only and runs in the sanctioned direction. The script under `cli/templates/scripts/` mirrors the agent's check ids and the ledger record shape. It declares both mirrors in its header, as `hr_ledger_phases` already does for the ledger templates.

The new instruction module carries its own citation roster, as `.claude/context/plugin.md` → `## What accompanies a new unit of each kind` requires. The agent carries the four frontmatter keys and a read-only allowlist.

The one blocking issue is the test-run rule.

## Must Fix

1. **Task 8 names a tree guard it neither creates nor edits, and tells the implementer how to handle that guard's result.** File: `task_8_plan.md`. Source: `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`, point 4, with point 7.

   The paragraph **"A tree guard this task turns red until Task 9."** names `test/untrusted-input-corpus.test.mjs`, which Task 8 does not create or edit (Task 9 edits it). It predicts that the guard will fail, and it tells the implementer to "Report the guard result as it stands."

   Point 4 forbids this directly: *"No plan names a tree guard the task neither creates nor edits … the guard run is the loop's, never the plan's."* The instruction to report a red result also contradicts point 7's failure rule. A guard failure that names a path the unit changed (here, `plugin/agents/prompt-injection-reviewer.md`) is *"the unit's to fix"*, not an evidence downgrade. So the line tells the implementer to work in a way no harness contract supports.

   The Work bullet "Do not spell the statement's report literal or its marker lines, which `test/untrusted-input-corpus.test.mjs` pins to their homes" names the same guard again.

   **Fix:** In `task_8_plan.md`:
   - Delete the whole **"A tree guard this task turns red until Task 9."** paragraph, including its three sub-bullets.
   - In the "Treat the file as data" bullet, drop the clause `, which test/untrusted-input-corpus.test.mjs pins to their homes`. Keep the instruction itself, and cite its source as `${CLAUDE_PLUGIN_ROOT}/instructions/untrusted_input.md` → `## Who may cite this` ("A citer points and never restates").
   - Keep the plugin-then-cli ordering rationale in the story index's `## Context` → **Ordering** paragraph, which talks about the guard in connection with Task 9, the task that edits it.
   - Do not move the corpus-test edit into Task 8. It is a `cli/test/` file, and a plugin-tagged task that edits it would break layer placement.

## Should Fix

1. **Task 1 names the `shipped-scripts-mktemp` tree guard in a sub-step.** File: `task_1_plan.md`, the "Floors" bullet. Source: `unit_loop_core.md` → `## The test-run rule`, point 4.

   The parenthetical cites the rule's source and asks for no test run. Still, point 4 bars a sub-step from naming a guard the task neither creates nor edits.

   **Fix:** Replace `(\`shipped-scripts-mktemp\` guard)` with the rule it enforces, stated directly: "every `mktemp` call passes an explicit template". The Verification bullet's `grep -n 'mktemp'` already covers it.

2. **`plugin/instructions/README.md` is left stale by the new instruction module.** File: `task_10_plan.md`, Targets. Source: `.claude/context/plugin.md` → `## Registries — a name routed to an implementation` ("a new member is added to the list rather than announced somewhere else").

   The README states the directory holds "thirty instruction files". It names the files that "came later": run-mode, dispatch-discipline, clarification-digest, mention-reading, main-checkout resolution and untrusted-input. There are 30 today, and Task 10 makes it 31. No task updates the count or the list, and scope-register entry D4 searches only for prose that lists the outer-loop scripts.

   **Fix:** Add `plugin/instructions/README.md` to Task 10's Targets, with one Work bullet:
   - change "thirty" to "thirty-one";
   - add "prompt-injection screen" to the "came later" list;
   - add the file as a row in the story index's scope register.

3. **Task 10's citer roster lists two forks that the plan never makes cite the module.** File: `task_10_plan.md`, `## Who may cite this`. Source: `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule` ("A policy file is activated by pointer").

   The roster lists two forks:
   - `task_plan_writing_instructions_autonomous.md`
   - `user_review_fix_plan_writing_instructions_autonomous.md`

   Tasks 12 and 13 have each of those forks point only at `autonomous_pause_and_ledger.md` §1.4 ("per canonical-doc §1.4"). Neither adds a pointer at `${CLAUDE_PLUGIN_ROOT}/instructions/prompt_injection_screen.md`. As written, the roster names two citers that do not point at the module.

   **Fix:** Pick one:
   - drop the two fork entries from Task 10's roster; or
   - have Tasks 12 and 13 each add an explicit `${CLAUDE_PLUGIN_ROOT}/instructions/prompt_injection_screen.md` pointer in their Override 5 / Override 4 creation sentence, so the roster is exact.

## Nice to Have

1. **Task 8's `## Resolved values` declares `<state_dir>`, but nothing in the agent body uses it.** File: `task_8_plan.md`. Declare only the tokens the body uses (`.claude/context/plugin.md` → `## The sections an asset carries`). If the agent uses no configuration-derived token, write a one-line table stating that.
