# Architecture review — iteration 2

Both of iteration 1's Must Fix items are resolved:
- `task_1_plan.md`'s **Floors** bullet now says "every `mktemp` call passes an explicit template".
- `task_10_plan.md` no longer names the corpus guard. Its **Where this module stops** bullet and its first Verification bullet now state the fact directly.

Iteration 1's Should Fix 1 (`plugin/instructions/README.md`) is resolved too. It is now in Task 15's Targets and is row 33 of the scope register.

This revision moves the corpus-guard edit from Task 9 into Task 8. That creates a new placement violation, raised below. The story index still has no `## Rejected findings` section, so each unapplied Should Fix from iteration 1 is raised again.

Every other target still sits in its tagged layer:
- Tasks 1–7 and 9 are under `cli/`.
- Tasks 10–15 are under `plugin/`.
- Tasks 16–18 are in the `general` catch-all.

## Must Fix

1. **Task 8 is tagged `plugin` but edits a `cli/` file.** Files: the story index (`feat_prompt_injection_reviewer_story_plan.md`, readiness entry 8 `_(layer: plugin)_` and `## Context` → **Ordering**) and `task_8_plan.md` (Targets, **Why this task edits a `cli/` file**, the **The guard edit this pointer requires** bullet, and the last two Verification bullets). Sources:
   - `.claude/context/conventions.md` → `## The layers`: "A change whose files sit under `cli/` or `plugin/` belongs to that layer".
   - `.claude/context/cli.md` → `## What this layer owns, and what it is not`, which lists `cli/test/` among what the `cli` layer owns.
   - `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## Layer routing table`: "A story-plan `**Task K**` entry always carries exactly one layer".
   - `${CLAUDE_PLUGIN_ROOT}/agents/layer-implementer.md` → `## Scope`: "Implement only inside the dispatched `layers[].path`. If the unit needs work outside it, stop".

   Task 8's Targets now include `cli/test/untrusted-input-corpus.test.mjs`, and its readiness entry routes it to the `plugin` layer with path `plugin`. When the loop dispatches the `plugin` implementer for Task 8, its `## Scope` rule makes it stop at the `cli/test/` edit and report a planning defect. As written, the run escalates at Task 8.

   The plan justifies the move with `unit_loop_core.md` → `## The test-run rule` point 7. That citation is real but does not license the move. Point 7 allows a unit to edit a guard file only when the unit's detail file assigns that edit. It says nothing about which layer's path the edit may sit in, and it does not override the one-layer-per-task routing rule or the implementer's path scope. Iteration 0 named this exact consequence: "a plugin-tagged task that edits it would break layer placement."

   The coupling behind this is real. A pointer in a `plugin/**/*.md` file and its `expected` entry in the `cli/test/` guard have to land together. With single-layer units, whichever lands first leaves the other's test red:
   - If the `cli` edit lands first, its own edited test fails because the pointer is not there yet.
   - If the `plugin` edit lands first, the selected guard fails and names that unit's own path.

   No ordering of single-layer tasks avoids this, so the plan cannot settle it by assertion. The decision belongs to the user.

   **Fix:**
   - Remove `cli/test/untrusted-input-corpus.test.mjs` from `task_8_plan.md`'s Targets.
   - Delete the **Why this task edits a `cli/` file** paragraph, the **The guard edit this pointer requires** bullet, and the last two Verification bullets.
   - Take the conflict to the user through the plan's `## Questions` route, and do not resolve it in the plan. Name the coupling stated above and the options the user may authorise. Two examples: the pointer and the guard entry as one explicitly authorised cross-layer unit, or the guard entry in a `cli`-tagged task placed directly after Task 8, with an authorised red interval for the guard.
   - Then rewrite Task 8, the cli task concerned, and the index's **Ordering** paragraph to match the answer, and quote the authorisation where the plan relies on it.
   - Do not give the edit to the `general` task. `conventions.md` → `## The layers` keeps `cli/` files out of `general`.

2. **Task 9 names a tree guard it neither creates nor edits.** File: `task_9_plan.md`. Source: `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`, point 4: "No plan names a tree guard the task neither creates nor edits … the guard run is the loop's, never the plan's". Point 4 makes a breach a Must Fix for every reviewer.

   - **Where this task stops** reads: "The untrusted-input corpus guard, `cli/test/untrusted-input-corpus.test.mjs`, is not this task's … This task neither edits nor names it as a test to run." That is a guard named in a sentence that limits the unit's test runs. Iteration 1 graded the same shape in `task_10_plan.md` as Must Fix.
   - The second Verification bullet names the same file as the format to copy: "in the form `cli/test/untrusted-input-corpus.test.mjs`'s header records its own".

   **Fix:** In `task_9_plan.md`:
   - Delete the **Where this task stops** paragraph's guard sentences. Keep only the line "This task is in the `cli` layer and comes after Task 8 because the mirror case reads the agent's table, which Task 8 creates."
   - In the Verification bullet, replace the file reference with the form itself: "in the `RED ONCE (<what was mutated>) — <date>, <what failed>` form".

## Should Fix

1. **Task 10's citer roster still names a fork that never points at the module.** This is partly resolved since iteration 1 and has not been recorded as rejected. Files: `task_10_plan.md` (`## Who may cite this`) and `task_13_plan.md`. Sources:
   - `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule`: "A policy file is activated by pointer and never restated".
   - `.claude/context/plugin.md` → `## What accompanies a new unit of each kind`, the shared instruction module row.

   `task_plan_writing_instructions_autonomous.md` now cites `${CLAUDE_PLUGIN_ROOT}/instructions/prompt_injection_screen.md` → `## Edit and resume`, through Task 12's Consume-then-archive sentence, so that roster entry is now correct. `user_review_fix_plan_writing_instructions_autonomous.md` is still on the roster, but Task 13's Override 4 and Override 2 edits only point at canonical-doc §1.4 and quote the `Raised by:` line. Neither edit cites the module.

   **Fix:** Pick one:
   - drop that fork from Task 10's roster; or
   - have Task 13's Override 2 exclusion bullet cite `${CLAUDE_PLUGIN_ROOT}/instructions/prompt_injection_screen.md` → `## Edit and resume` as the source of the discard-and-re-ask. Its Override 2 already relies on that rule.

2. **Task 10 still adds a narration line of its own.** It has been neither applied nor recorded as rejected. File: `task_10_plan.md`, `## The steps` step 3, the bullet "Print `[screen · <path>] → prompt-injection-reviewer`". Source: `.claude/context/plugin.md` → `## Wires: dispatch in, return out`: "Narration surfaces are prescribed, and an asset adds none of its own".

   **Fix:** Pick one:
   - drop the bullet; or
   - say that it is the entry core's safety-contract heartbeat, with `screen` as the phase and the path as the unit, and say why it carries no `(#N)` counter, citing the module's own `## No override` dispatch-cost bullet.

3. **Task 8's `## Resolved values` still declares the wrong token.** It has been neither applied nor recorded as rejected. File: `task_8_plan.md`, the **Frontmatter and frame** bullet ("**`## Resolved values`**, declaring `<state_dir>`"). Source: `.claude/context/plugin.md` → `## The sections an asset carries`.

   The planned body never uses `<state_dir>`. The `foreign-execution` row does use `<scripts_dir>` ("the wrappers in `<scripts_dir>`"), and nothing declares it.

   **Fix:** Declare `<scripts_dir>` (config value, `scriptsDir`) in place of `<state_dir>`.
