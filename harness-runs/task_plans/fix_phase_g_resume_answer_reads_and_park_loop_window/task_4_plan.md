### Task 4 — Keep the user-review fix flow's orchestrator out of Phase G answer files

**Goal:** Give the user-review fix engine the same no-read rule the task flow's planning fork gets, at both places its orchestrator meets a Phase G pair on a resume. The first is the fix-plan half's Override 2(a), which runs first. The second is the fix half's **On resume** paragraph. Run C (`docs/sandbox-verification.md` §7, AP6) observed the same read in this flow: the orchestrator opened the answer files and quoted earlier answers into new question files. The watcher's prompt reaches this engine too (Task 1).

**Depends on:** Task 3, for the wording only. Task 3 wrote **W3** into `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability` (a). This task writes the same two sentences, byte-identical, into the two user-review fix forks. `.claude/context/plugin.md` → `## Writing agent prose` requires one wording for a block several files carry. W3 is:

``Before Phase D, never open, quote or summarise a Phase G pair's `answer_<n>.md`: tell the pair's origin from its `question_<n>.md` alone. Phase D's clarification digest is the one later step that reads it, and it quotes it verbatim into its committed record.``

The "Before Phase D" scope and the digest sentence matter most in this flow. `plugin/instructions/user_review_fixes_instructions_autonomous.md` → `## Override J — clarification digest (autonomous fork only)` runs `plugin/instructions/clarification_digest_instructions.md` at Phase D, which quotes every answer file verbatim, Phase G pairs included. This task does not change that file or that override (story index `## Context` → **Decision — Phase D's clarification digest stays the one later reader**).

The paths-only rule for question files (W1) and the must-not bullet (W2) live in `plugin/instructions/plan_orchestration_instructions_core.md` → `### G.2 Write and review the test fix plan`, which this flow runs verbatim by reference. So this task does not restate them.

**Where this task stops.** This task does not change:

- the closed list of escalation paths, any binding row or the `<park_answer_lookup>` value;
- which pairs either half consumes.

Task 5 pins W3 in both of this task's sections.

### Targets

- `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability`, case **(a)**.
- `plugin/instructions/user_review_fixes_instructions_autonomous.md` → ``### `<escalate>` / `<ask>` — the park-and-yield clarification reroute``, the **On resume** paragraph.

**Work:**

- [ ] `user_review_fix_plan_writing_instructions_autonomous.md`, case **(a)**: find the sentence that opens **"A pair whose question file was instead raised by the fix-implementation phase"**. It runs through **Which Phase G answers G.0 consumes.** and ends at the citation of the fix fork's **On resume** paragraph. Append the W3 passage, both sentences, directly after it.
- [ ] `user_review_fixes_instructions_autonomous.md`, **On resume**: find the sentence that opens "A pair whose question file names a Phase `G` origin is **not** appended to any item or QA dispatch" and ends by citing **Which Phase G answers G.0 consumes.**. Insert the W3 passage, both sentences, directly after it, before "The pairs stay at the top level".

**Verification:**

- `` git grep -c -F "Before Phase D, never open, quote or summarise a Phase G pair's `answer_<n>.md`: tell the pair's origin from its `question_<n>.md` alone. Phase D's clarification digest is the one later step that reads it, and it quotes it verbatim into its committed record." -- plugin/instructions `` checks the full W3 passage, which must sit on one line in each file. It must list exactly the three autonomous forks this task and Task 3 edited, `task_plan_writing_instructions_autonomous.md`, `user_review_fix_plan_writing_instructions_autonomous.md` and `user_review_fixes_instructions_autonomous.md`, with one copy in each. That means the sentence is byte-identical everywhere it appears, which is the third `Top risks:` entry in the story index.
