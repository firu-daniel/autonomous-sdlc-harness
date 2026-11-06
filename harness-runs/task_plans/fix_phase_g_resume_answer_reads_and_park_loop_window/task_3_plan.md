### Task 3 — Keep the task flow's orchestrator and the Phase G architecture reviewer out of Phase G answer files

**Goal:** State the no-read rule at every place in the task flow where an orchestrator or a reviewer meets a Phase G answer. In the observed runs, the orchestrator opened the answer as soon as the engine launched, during the planning half's Override 2(a), before the implementation core's rules were in front of it. It also quoted earlier answers into the next park's question file. The Phase G `architecture-reviewer` followed the index's pointer to the answer file. The contract is that before Phase D only `test-fix-plan-writer` reads a Phase G answer (`plugin/instructions/plan_orchestration_instructions_core.md` → `### G.0 Resolve the round` → **Which Phase G answers G.0 consumes.**). This task adds:

- the paths-only rule for question files to the core's G.2 and its must-not list;
- the no-open rule to the planning fork;
- the decision that the reviewer grades the quoted authorising sentence, not the file.

**Depends on:** nothing in this branch. Task 1 changed the watcher's resume prompt to say the same thing to the session ("Before Phase D, never open or quote an answer file whose question file names an origin that opens Phase G: Phase G's G.0 finds that pair and passes its paths to test-fix-plan-writer, its only reader until Phase D's clarification digest quotes it."). This task's wording is self-standing and cites no watcher text.

**Where this task stops.** The user-review fix flow's two forks get the same W3 sentence in **Task 4**. **Task 5** pins every string this task writes, so write each one byte-for-byte as given here. This task does not change:

- G.0's arms, the `Park answer:` clause, the `<park_answer_lookup>` binding or any fork's binding table;
- `plugin/agents/test-fix-plan-writer.md`, the one reader before Phase D, whose contract is unchanged;
- `plugin/instructions/clarification_digest_instructions.md`, Phase D's digest, which reads every question and answer file and quotes each answer verbatim, Phase G pairs included. It stays the one later reader. W2 and W3 open their prohibitions with "before Phase D" so that they never bind it, and W3 names it (story index `## Context` → **Decision — Phase D's clarification digest stays the one later reader**).

### Targets

- `plugin/instructions/plan_orchestration_instructions_core.md` → `### G.2 Write and review the test fix plan` (the paragraph opening `**The \`Park answer:\` clause**`) and `## What you must NOT do` (the bullet opening `Do NOT open a park's question or answer file`).
- `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability`, case **(a)**.
- `plugin/agents/architecture-reviewer.md` → `## Process`, step 2, the bullet **Plan-review mode, sub-case (c):**.

**Work:**

- [ ] **W1, the core's G.2.** In the paragraph opening `**The \`Park answer:\` clause**`, append this sentence after its last sentence (*"…you pass their paths to `test-fix-plan-writer`, and the answer reaches no other agent."*):
  `A later park's question file names an earlier park by its question and answer paths alone, never by quoting or summarising either file.`
  G.2 is where Phase G's escalations are raised, so the rule covers every Phase G park written by either flow that runs this section, the user-review fix flow included.
- [ ] **W2, the core's must-not list.** The bullet opening `Do NOT open a park's question or answer file` becomes exactly:
  ``- Do NOT open a park's question or answer file before Phase D, and never compose a dispatch or a question file from its content. Its paths travel only in G.2's `Park answer:` clause.``
  The must-not list binds the whole session, and Phase D's clarification digest reads both files in the two autonomous flows, so the scope is part of the bullet.
- [ ] **W3, the planning fork.** In `## Override 2 — resumability`, case **(a)**, find the sentence that opens **"A top-level answered pair whose `question_<n>.md` names an origin that opens `Phase G`"** and ends by citing **Which Phase G answers G.0 consumes.**. Insert these two sentences directly after it, before "When only Phase G pairs are pending":
  ``Before Phase D, never open, quote or summarise a Phase G pair's `answer_<n>.md`: tell the pair's origin from its `question_<n>.md` alone. Phase D's clarification digest is the one later step that reads it, and it quotes it verbatim into its committed record.``
  This is the half the session runs first on a resume, and it is where the observed read happened.
- [ ] **W4, the architecture reviewer.** Append this sentence to the end of the `**Plan-review mode, sub-case (c):**` bullet in `## Process` step 2:
  ``Never open an answer file that the index's `Park answer consumed:` line or a finding's `**Authorised by:**` line names: grade the quoted sentence, because `test-fix-plan-writer` is the answer's only reader.``
  Add nothing else to the definition. The rule's source is the core's G.2, which the bullet's own section already cites by dispatch (`.claude/context/plugin.md` → `## Writing agent prose`: *"An agent's growth is paid for by behaviour"*).

**Verification:**

- Each of the four strings appears exactly once, in its named section:
  - `git grep -c -F "never by quoting or summarising either file" -- plugin/instructions/plan_orchestration_instructions_core.md` prints `1`;
  - `git grep -c -F "never compose a dispatch or a question file from its content" -- plugin/instructions/plan_orchestration_instructions_core.md` prints `1`;
  - `git grep -c -F "tell the pair's origin from its" -- plugin/instructions/task_plan_writing_instructions_autonomous.md` prints `1`;
  - `git grep -c -F "is the answer's only reader" -- plugin/agents/architecture-reviewer.md` prints `1`.
- `git grep -n -F "Previous park" -- plugin` prints nothing. No plugin file asks for a quoted earlier answer.
- `plugin/agents/architecture-reviewer.md`'s frontmatter is unchanged, and its `tools:` line is byte-identical to `HEAD`.
