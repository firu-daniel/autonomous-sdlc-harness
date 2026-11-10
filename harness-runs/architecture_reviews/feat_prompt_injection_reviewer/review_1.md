# Architecture review — iteration 1

Iteration 0's Must Fix is resolved. `task_8_plan.md` no longer names `test/untrusted-input-corpus.test.mjs`, and its "Treat the file as data" bullet now cites `${CLAUDE_PLUGIN_ROOT}/instructions/untrusted_input.md` → `## Who may cite this`. Layer placement still holds across all 18 tasks:
- Tasks 1–7 and 9 are under `cli/`.
- Tasks 8 and 10–15 are under `plugin/`.
- Tasks 16–18 are in the `general` catch-all.

The two halves are still coupled by contract only. The script declares its mirrors of the agent's check ids and of the ledger record shape.

The story index carries no `## Rejected findings` section, so none of iteration 0's three Should Fix items or its Nice to Have was recorded as rejected. Each one that the plan has not applied is raised again below.

## Must Fix

1. **Two task files still name a tree guard the task neither creates nor edits.** Files: `task_1_plan.md` and `task_10_plan.md`. Source: `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`, point 4: *"No plan names a tree guard the task neither creates nor edits … the guard run is the loop's, never the plan's"*, and *"every reviewer of one raises a breach as a **Must Fix**"*.

   - `task_1_plan.md`, the **Floors** sub-bullet, ends `every mktemp with an explicit template (`shipped-scripts-mktemp` guard)`. Task 1 neither creates nor edits `test/shipped-scripts-mktemp.test.mjs`. Iteration 0 raised this as a Should Fix. It was neither applied nor recorded under `## Rejected findings`, and point 4 grades a breach as Must Fix, so it is raised again at that grade.
   - `task_10_plan.md` names the untrusted-input corpus guard twice, though Task 9 is the task that edits it:
     - **Where this module stops**: "so it adds no carrier to that statement's corpus guard";
     - the first Verification bullet: "This file joins neither corpus guard's carrier set."

   **Fix:**
   - In `task_1_plan.md`, replace `(`shipped-scripts-mktemp` guard)` with a direct statement of the rule: "every `mktemp` call passes an explicit template". The Verification bullet's `grep -n 'mktemp'` already checks it.
   - In `task_10_plan.md`, rewrite both sentences to state the fact without the guard: "It cites nothing in `untrusted_input.md`, so it carries no rule pointer to that statement", and "This file carries neither the untrusted-input rule pointer nor the main-checkout resolution clause." Keep both `grep -cF` checks as they are.

## Should Fix

1. **`plugin/instructions/README.md` is still left stale by the new instruction module.** Re-raised from iteration 0; it has been neither applied nor recorded as rejected. File: `task_10_plan.md`, Targets. Source: `.claude/context/plugin.md` → `## Registries — a name routed to an implementation` ("a new member is added to the list rather than announced somewhere else").

   The README states that Roadmap item 3 landed twenty-four of "the thirty instruction files beside this README". It then lists the files that "came later": the run-mode, dispatch-discipline, clarification-digest, mention-reading, main-checkout resolution and untrusted-input files. There are 30 instruction files today, and Task 10 adds the 31st.

   **Fix:** Add `plugin/instructions/README.md` to Task 10's Targets, with one Work bullet:
   - change "thirty" to "thirty-one";
   - add "prompt-injection screen" to the "came later" list.

   Add the file as a row in the story index's scope register.

2. **Task 10's citer roster still lists two forks that the plan never makes cite the module.** Re-raised from iteration 0; it has been neither applied nor recorded as rejected. Files: `task_10_plan.md` (`## Who may cite this`), `task_12_plan.md` and `task_13_plan.md`. Source: `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule` ("A policy file is activated by pointer and never restated") and `## What accompanies a new unit of each kind` (the shared instruction module's roster of the documents that point at it).

   The roster names `task_plan_writing_instructions_autonomous.md` and `user_review_fix_plan_writing_instructions_autonomous.md`. But the Override 5 and Override 4 bullets in Tasks 12 and 13 point only at `autonomous_pause_and_ledger.md` §1.4 ("per canonical-doc §1.4"). The engine commands carry the module pointer, and neither fork does.

   **Fix:** Pick one:
   - drop those two fork entries from Task 10's roster; or
   - have Tasks 12 and 13 each add an explicit `${CLAUDE_PLUGIN_ROOT}/instructions/prompt_injection_screen.md` pointer in their creation and flip sentences.

3. **Task 10 adds a narration line of its own.** File: `task_10_plan.md`, `## The steps` step 3, the bullet "Print `[screen · <path>] → prompt-injection-reviewer`". Source: `.claude/context/plugin.md` → `## Wires: dispatch in, return out` ("Narration surfaces are prescribed, and an asset adds none of its own").

   The prescribed pre-dispatch channel is the heartbeat of the entry core's safety contract, `[<phase> · <unit> · <layer-or-step> · iter <i>] → <agent_name>  (#<total_dispatches>)` (`plugin/instructions/plan_orchestration_instructions_core.md`). Task 10's line drops the counter and invents a new shape. The module also states that these dispatches sit outside the engine's counter.

   **Fix:** Pick one:
   - drop the print bullet; or
   - state that the line is the engine's safety-contract heartbeat, with `screen` as the phase and the path as the unit, and say why it carries no `(#N)` counter, citing the module's own `## No override` dispatch-cost bullet.

4. **Task 8's `## Resolved values` declares the wrong token.** Re-raised from iteration 0's Nice to Have; the plan has not applied it. File: `task_8_plan.md`, the **Frontmatter and frame** bullet. Source: `.claude/context/plugin.md` → `## The sections an asset carries` (a `## Resolved values` table declares "each configuration- or runtime-derived token once, ahead of the body that uses it").

   The plan declares `<state_dir>`, which no part of the planned agent body uses. Meanwhile the `foreign-execution` row uses `<scripts_dir>` ("the wrappers in `<scripts_dir>`"), which the plan never declares.

   **Fix:** In `task_8_plan.md`, change "declaring `<state_dir>`" to "declaring `<scripts_dir>` (config value, `scriptsDir`)". Add any other configuration-derived token the body ends up using.
