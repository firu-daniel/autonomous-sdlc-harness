# Task plan review — iteration 0

## Must Fix

1. **Task 8 is left with a failing tree guard that it is forbidden to fix** — `task_8_plan.md` (and the story index's **Ordering** paragraph in `feat_prompt_injection_reviewer_story_plan.md`)
   `harness.config.json` → `treeGuards` selects `test/untrusted-input-corpus.test.mjs` for any `plugin/**/*.md` change. Task 8 adds the rule pointer to `plugin/agents/prompt-injection-reviewer.md` and a roster line to `untrusted_input.md` → `## Who may cite this`. After that edit, two checks in the guard fail: the `rule-pointer` row's `deepEqual` (an extra carrier) and the roster-equals-union check (an extra roster entry). Both failures name `plugin/agents/prompt-injection-reviewer.md`, which is a path Task 8 changed. Under `plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 7, that makes the failure Task 8's to fix, not an evidence downgrade. The same point says *"Never edit the guard file to make it pass unless the unit's detail file assigns that edit"*, and Task 8's file assigns no such edit and does not mention the failure. So Task 8's unit can only block, or "fix" the failure by undoing its own pointer or roster entry. Waiting for Task 9 does not help: the unit loop has no route that hands a failure on to a later task.
   The index says *"`#145` had the same plugin-then-cli shape"*. That is not accurate. The guard's own header says #145's Task 9 **created** the guard (*"Registered as a tree guard by Task 9 of `fix_untrusted_input_framing_subagents`"*), so no #145 plugin task ever ran against it.
   **Fix:** Move the one `'plugin/agents/prompt-injection-reviewer.md': 1` entry of the guard's `rule-pointer` `expected` map out of Task 9 and into Task 8's file. Assign it explicitly as the guard edit that point 7 permits, add the guard to Task 8's `### Targets` as a guard edit the task makes, and keep only the mirror case in Task 9. Alternatively, choose another structure, but it must leave no task facing a selected guard that fails on its own changed path without having that edit assigned. Then correct the index's **Ordering** paragraph, including the #145 claim.

2. **The "edit it and resume" route that goals 4 and 5 require is never planned** — story index (`## Context` → **Decisions**), `task_3_plan.md`, `task_10_plan.md`, `task_13_plan.md`
   Goal 4 tells the person to *"edit it and resume (the edited file is re-screened, goal 5)"*. Task 3 puts that sentence in every park, but no task makes the route work:
   - **The task prompt and the docs checklist are committed on the run branch** (`chore: add task prompt for <branch>`, `chore: add docs checklist for <branch>`). Editing one in the run copy leaves a tracked modification.
     - No planned commit point stages it. The `P0`/`R0` creation and flip writes (Tasks 11–13) commit the ledger only.
     - So the run continues with a dirty tracked file. That breaks the *"clean tree at every engine checkpoint … tolerates only untracked `<state_dir>/…` artifacts"* invariant (`plan_orchestration_instructions_autonomous.md` → **Autonomous-fork commit points — the clean-tree invariant**).
     - The branch would also be delivered with the original, parked prompt still committed.
   - **In the user-review engine, the edit never reaches the re-screen.** Task 13 places the screen *after* step 5 (**Tree-state precondition**: *"Halt if any tracked file is modified"*), so an edited, committed task prompt halts the engine before anything screens it.
   - **The GitHub route is not addressed at all.** No task states how an edited file reaches a remote run's state. The post-release check *"an edited prompt is screened again and the run proceeds"* has no planned mechanism to verify. Lesson: *"A recovery for an unattended run's failure covers every execution mode the failure reaches, the local watcher and the remote job alike. Leaving a mode out is a question to the user before the plan ships, never a documented residual."* (`harness-runs/lessons.md` → `## Unattended control loops`).
   - **The park does not say where to edit or how to resume.** Task 3's `## Q<k>` text does not say which copy to edit (the run copy, not the main checkout) or that the resume is still triggered by an answer.
   **Fix:** In the story index decisions and in `task_10_plan.md`, state the concrete edit-and-resume route for each engine and each execution mode (local watcher and remote job):
   - which copy the person edits;
   - how the edit is committed, for example by the `P0`/`R0` write staging the re-screened `SAFE` file by its exact path, or by an explicit statement that the person commits it;
   - what triggers the resume.

   Then:
   - re-order or adjust Task 13 so that an edited screened file reaches the screen rather than the step-5 halt;
   - have Task 3's park text name the copy to edit and the resume step;
   - where a mode cannot be supported, raise it as a question, as the lesson requires, rather than leaving it as a residual.

3. **The canonical clarification-channel definition will contradict Task 12's exclusion** — `task_12_plan.md`
   `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format (canonical, single source of truth)` → **Consume-then-archive** states two things about the flows that read answered pairs:
   - *"the task flow reads every pair whose question file does not name an origin that opens `Phase G` through Override 2(a)"*;
   - *"the user-review-fix flow reads the fix-plan phase's through its own Override 2(a)"*.

   Tasks 12 and 13 add a third exclusion: a pair whose question opens `Raised by: prompt-injection-reviewer (prompt-injection screen)` is never appended to a writer. That leaves the single source of truth wrong, and gives the channel a second, disagreeing owner. The section sits in the file Task 12 already edits, but Task 12's `### Targets` scope that file to Override 5 and Override 2(a) only.
   **Fix:** Add `## Clarification channel — file format` → the **Consume-then-archive** bullet to Task 12's `### Targets` and `**Work:**`. Amend both reading statements to name the screen-park exclusion, and keep every other literal byte-for-byte. Add a `**Verification:**` grep showing the screen-park origin named there.

4. **The scope register's derivation entries miss the plugin's count prose** — story index `## Scope register`
   I re-ran every command entry (D1, D3–D8) and re-walked D2 and D9. Every site they reach is a row. However, no entry reaches two corpus sites that this branch's new agent and new instruction file make false:
   - `plugin/instructions/README.md`, in its opening paragraph: *"Roadmap item 3 landed twenty-four of the thirty instruction files beside this README (… the run-mode, dispatch-discipline, clarification-digest, mention-reading, main-checkout resolution and untrusted-input files came later)"*. Task 10's `prompt_injection_screen.md` makes it thirty-one files, and that list of later files omits it.
   - `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`, in three places:
     - the table row **3. Instruction cores and their forks** (*"thirty instruction files"*);
     - the row **4. The agent fleet**, whose list of roles omits the new agent (*"twenty-two agent definitions"*);
     - the count paragraph after the table: *"returns twenty-two"*, *"thirty-one in `instructions/`"*, *"not one of the thirty"*, *"a twenty-third agent"*.

     Row 12 lists this file, but only for its containment paragraph. Task 15 edits nothing else in it.

   **Fix:**
   - Add a derivation entry for prose that counts or lists plugin agents and instruction files. It must be at least as wide as the following command, which I ran from the checkout root and which reaches both files above: ``git grep -lEi '(twenty|thirty)[-a-z]* (of the thirty )?(instruction files|agent definitions)|twenty-third agent|thirty-one in' -- ':!harness-runs/**' ':!examples/**'``
   - Add one row per reached site, anchored by quoted text.
   - Give the whiteboard count anchors to Task 15 (it already owns that file) and `plugin/instructions/README.md` to a plugin-layer task, with the counts and lists corrected.

5. **The screen step does not fail closed when a script call is refused or the script is missing** — `task_10_plan.md`
   Task 10's `## The steps` only defines what happens for exits 0, 1 and 2 of `plan` and `verdict` (exit 2 → halt, *"Never proceed"*). It says nothing about the outcome the story index itself predicts: *"Without this [profile regeneration], every unattended local run halts at the screen"*. That outcome is a call the `dontAsk` profile refuses, so there is no exit status and no output. The step also does not cover a scripts directory that predates the script, which gives exit 127 from `bash`, or any other status. With `plan` producing no output in those cases, nothing in the module stops an orchestrator from reading "no `unsafe` line" as a pass. That conflicts with the constraint *"Neither one halts silently, and neither one proceeds"* and with goal 1's fail-closed rule. So the "halts" claim in the story index's `Manual setup required:` list is not backed by any step.
   **Fix:** In `task_10_plan.md` → `## The steps`, state that any outcome of a `plan`, `park` or `verdict` call other than the documented exits halts and never proceeds. That includes a refused call, a missing script, any other exit status, and output that does not end in the documented `plan:` / `verdict:` / `parked:` line. Name the route it halts through, and say what the person sees. Add a `**Verification:**` grep showing that sentence.

## Should Fix

1. **`task_8_plan.md` — `## Resolved values` declares only `<state_dir>`, but the `foreign-execution` row names `<scripts_dir>`.** `.claude/context/plugin.md` → `## The sections an asset carries` requires every configuration-derived token to be declared once in that table. Declare `<scripts_dir>` too, as `config value`.
2. **`task_10_plan.md` / `task_3_plan.md` — interaction with the watcher's park-loop guard.** An answer to a screen park that comes without an edit re-parks with no progress. After `PARK_LOOP_MAX_CYCLES` (default 2) the watcher marks the run `park_loop`, and it then needs `PARK_LOOP_CLEAR` (`autonomous-watcher.sh` → THE PARK-LOOP GUARD). State this in the `## No override` section and in the park's `## Q<k>` text, so the person knows a second plain answer lands the run in `park_loop`.

## Nice to Have

1. **`task_18_plan.md`** — the plan keeps *"This release changes none of it"* directly above a new bullet that describes a change this release makes. Consider rewording that opening sentence, or saying in the new bullet that the screen leaves the listed limits as they are.
