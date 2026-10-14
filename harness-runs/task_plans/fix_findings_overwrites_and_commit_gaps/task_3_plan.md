### Task 3 — Key the user-review fix-plan gates by next free index

**Goal:** Fix defect 1. Today steps 7 and 8 of the user-review fix-plan core reset `parity_iteration` / `arch_iteration` to `0` on every gate entry and pass that counter as `iteration:` into a findings folder that is flat per branch. A later round's `review_0.md`, and even a same-round re-entry's, therefore overwrites an earlier one. After this task, each gate passes the **next free `review_<n>.md` index** in its folder as `iteration:`, and the counter only caps the loop. That makes the autonomous fork's claim true: "a later round appends findings into the same folder and the wrapper stages the delta".

**Source:** `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` → `## Flow` steps 7 and 8.

### Targets

- `plugin/instructions/user_review_fix_plan_writing_instructions_core.md`
- `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` (only the **"Neither gate folder is round-suffixed, and both pass unconditionally."** paragraph of `## Override 3`; Task 4 owns this file's other edits and depends on this task)
- `plugin/agents/business-parity-reviewer.md` (`## Invocation contract` → `### Plan-review mode (insertion points 1 and 3)` → sub-case **(b) Insertion point 3** fenced block, its `iteration:` line only)
- `plugin/agents/architecture-reviewer.md` (`## Invocation contract` → `### Plan-review mode (insertion points 1, 3 and 4)` → sub-case **(b) Insertion point 3** fenced block, its `iteration:` line only; Task 5 edits the sub-case (c) block of this file and depends on this task)

**Quoting sites — option (a) of the review's choice, stated so no implementer re-decides it.** The renamed placeholder is interface (`.claude/context/plugin.md` → `## What this layer is`), and both receiving agents quote the caller's dispatch block verbatim. So this task renames the placeholder on **both** sides: the caller's block in the core and the quoted block in each agent. It does **not** keep the old name and redefine its value (option (b)), because `parity_iteration` / `arch_iteration` remain the cap counters and the escalate rows' names, and one name cannot be both.

**The wire this task fixes, stated for both gates.** The dispatch block's keys do not change: `story_path` / `task_files_dir` / `prompt_path` / `findings_folder` / `iteration`. Only the **value** of `iteration:` changes. It becomes the next free index in that block's `findings_folder`. Resolve it immediately before **every** dispatch of that gate's reviewer: list the folder (`ls <state_dir>/business_parity_user_review_reviews/<branch>/`, or `ls <state_dir>/architecture_user_review_reviews/<branch>/`) and take one past the highest `review_<n>.md`, or `0` when the folder is absent or holds none. Both reviewers already accept this: their `iteration` rows read *"Integer supplied by the caller — the index your findings file is named with and titled by; do not re-derive it. At the gates that resolve it that way, it is the next free index in `findings_folder`."*

**Work:**

- [ ] Step 7 (business-parity gate): make five changes.
  - Rewrite "Set `parity_iteration = 0`" so `parity_iteration` is explicitly the gate's **cap counter**. It is set to `0` when a revision chain begins, meaning a step-5 initial write or a step-11 revision, and it is **kept**, not reset, when a step-7/8 FAIL loops back through step 6.
  - Change the dispatch block's `iteration: <parity_iteration>` to the resolved next-free index. Name it so the reader cannot confuse it with the counter, e.g. `iteration: <parity_review_index>`, and define it in the sentence after the block.
  - Keep the `>= 5` cap on the counter.
  - Keep the `<findings_file>` the escalation names as the reviewer's returned `findings_file:`.
  - Bind the new name in this file's placeholder sentence (`## Mode contract` → the "`<findings_file>`, `<feedback>`, the round index `<N>` and the counters …" sentence) as a locally bound name.
- [ ] Step 8 (architecture gate): the same five changes for `arch_iteration` / `<arch_review_index>` over `<state_dir>/architecture_user_review_reviews/<branch>/`.
- [ ] Agent-side quotes: in `business-parity-reviewer.md`'s insertion-point-3 block change `iteration: <parity_iteration>` to `iteration: <parity_review_index>`, and in `architecture-reviewer.md`'s insertion-point-3 block change `iteration: <arch_iteration>` to `iteration: <arch_review_index>`, so each block stays byte-identical to the caller's. Leave both agents' insertion-point-1 blocks (`iteration: <iteration>`, walker-filled) and their `iteration` table rows unchanged: the rows already say the value is the next free index at the gates that resolve it that way.
- [ ] `user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 3`, the paragraph **"Neither gate folder is round-suffixed, and both pass unconditionally."**: keep its sentence, but give it its real cause. Each gate takes the next free index in its flat folder, so a later round adds files beside the earlier round's tracked ones, and the wrapper stages only that delta.

**Verification:**

- `git grep -n -e 'iteration = 0' -e 'iteration: <parity_iteration>' -e 'iteration: <arch_iteration>' -- plugin/instructions/user_review_fix_plan_writing_instructions_core.md`. Every remaining hit names a cap counter only; no dispatch block passes a counter as `iteration:`.
- Walk two rounds on paper and confirm both outcomes:
  - round 1: parity FAIL, writes `review_0.md`; then PASS;
  - round 2 (`_review_2.md`): parity FAIL, writes `review_1.md`, because `review_0.md` is present;
  - architecture gate in round 2, re-entered after a parity FAIL: continues its own folder's series, never `review_0.md` again.
- `git grep -n -e '<parity_review_index>' -e '<arch_review_index>' -- plugin cli/templates docs`: every hit is in `user_review_fix_plan_writing_instructions_core.md` (the binding sentence and the dispatch block) or in the insertion-point-3 block of `business-parity-reviewer.md` / `architecture-reviewer.md`, and each agent block is byte-identical to its caller's block. `git grep -n -e 'iteration: <parity_iteration>' -e 'iteration: <arch_iteration>' -- plugin cli/templates docs` returns nothing.
- `git grep -n 'parity_iteration\|arch_iteration' -- plugin`: the autonomous fork's `<escalate>` row (`parity_iteration >= 5` / `arch_iteration >= 5`) and the core's `<escalate>` row still read correctly as cap counters.
- `git grep -n 'same folder' -- plugin/instructions` shows only the Override 3 sentence, now true.
