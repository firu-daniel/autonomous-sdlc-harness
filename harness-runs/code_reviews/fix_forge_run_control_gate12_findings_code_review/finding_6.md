### 6. The new consume-then-archive justification says every top-level answered pair is consumed on re-entry, but the user-review-fix flow reads a Phase A/QA/D pair only when its fix-implementation phase reaches the blocked item

**Site anchor:** `plugin/instructions/task_plan_writing_instructions_autonomous.md`, `## Clarification channel — file format (canonical, single source of truth)`, the **Consume-then-archive (single ordering contract for resume).** bullet. The site is the sentence this branch added, starting *"Archiving every pair present at launch is safe because the re-launched engine consumes every top-level answered pair on re-entry (Override 2(a))"*.

**Problem.** `.claude/context/plugin.md` → `## The placeholder vocabulary` makes the `question_<n>.md` / `answer_<n>.md` shape a wire: changing it changes every reader of it. This bullet is the canonical owner of the contract, and the sentence the branch added says a pair present at launch has always been read by the time the session exits. One reader shows it has not:

- `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability`, the `(a)` bullet. On re-entry it consumes **only** pairs raised by the fix-plan phase. It says *"A pair whose question file was instead raised by the fix-implementation phase (it names a Phase `A`/`QA`/`D` origin) is NOT consumed here"*.
- `plugin/instructions/user_review_fixes_instructions_autonomous.md`, the **On resume** paragraph under the `<escalate>` / `<ask>` park-and-yield reroute. It reads such a pair by appending it *"to the next dispatch prompt for the blocked item/phase"*. That happens only once the session gets as far as that item.

So suppose a user-review-fix session launches with an answered Phase A/QA/D pair at the top level, then exits by some route other than a pause before its fix-implementation phase reaches the blocked item. For example, the fix-plan writer parks again on a new question, or the session fails. In that case the session has not read the pair. The watcher's `classify_run_exit` in `cli/templates/scripts/autonomous-watcher.sh` still archives every index in `launch_answered_set` on any exit that is not a pause.

The sentence as written is false for this flow. A maintainer reading the canonical contract would conclude that archive-at-exit can never drop an unread answer.

The other readers agree with the rewritten text:
- the task flow's own Override 2(a) in the same file reads every top-level pair;
- `plugin/instructions/clarification_digest_instructions.md` reads both the top level and `answered/`;
- `plugin/commands/branch-answer.md` only writes `answer_<n>.md` and defers the lifecycle to this contract.

The surrounding sentence *"The re-launched engine consumes **all** of them … (Override 2(a) above)"* is older than this branch and makes the same claim. It is replaced in the same edit, so the bullet does not state the claim twice.

**Fix.** In that bullet, make two replacements.

- [ ] Replace the sentence

  > The re-launched engine consumes **all** of them, each paired by index with its question (Override 2(a) above).

  with

  > The re-launched engine reads them, each paired by index with its question: the task flow reads all of them through Override 2(a) above; the user-review-fix flow reads the fix-plan phase's through its own Override 2(a) and a Phase `A`/`QA`/`D` pair only when its fix-implementation phase reaches the blocked item (`${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_autonomous.md`, its **On resume** paragraph).

- [ ] Replace the sentence

  > Archiving every pair present at launch is safe because the re-launched engine consumes every top-level answered pair on re-entry (Override 2(a)), so such a pair has been read whether the launch was a park resume, a pause resume or a fresh launch.

  with

  > Every pair present at launch is archived because the re-entered engine is expected to have read it, whether the launch was a park resume, a pause resume or a fresh launch. That holds for every pair in the task flow. In the user-review-fix flow it does not hold for a Phase `A`/`QA`/`D` pair when the session exits other than by a pause before its fix-implementation phase reaches the blocked item: the pair is then archived unread.

Change nothing else in the bullet, and nothing in any other file.
