### Task 15 — Describe the screen as a tripwire in `AUTONOMOUS_FLOW.md` and the whiteboard's containment paragraph

**Goal:** Put the screen into the plugin's two flow documents (goal 9), always as **a screen and not a boundary**:
- as a wiring-table row;
- as the first step of the inner loop;
- in the clarification and safety sections;
- in the whiteboard's containment paragraph.

It also corrects the counts of agent definitions and instruction files the whiteboard and `plugin/instructions/README.md` state, which the new agent and the new instruction make false.

**Depends on:**
- **Task 8.** The agent is `${CLAUDE_PLUGIN_ROOT}/agents/prompt-injection-reviewer.md`: read-only, tools `Read`, `Grep`, `Glob`.
- **Task 10.** `${CLAUDE_PLUGIN_ROOT}/instructions/prompt_injection_screen.md` owns the step and lists `AUTONOMOUS_FLOW.md` as a citer. Its facts:
  - it runs at every launch of the three autonomous engines, before anything reads the task prompt, a review round, an answer or the docs checklist;
  - a deterministic pre-scan in `prompt-injection-screen.sh` runs first;
  - `UNSAFE` parks, and no answer moves a run past it;
  - the supervised flows do not run it.
- **Task 11.** The entries are `P0` / `R0`, on the run-mode safety floor.

This document points at those owners and restates none of their bodies.

### Targets

- `plugin/docs/AUTONOMOUS_FLOW.md` — `## The wiring table`, `## The inner loop of a task-prompt run`, `## Answer a clarification (park-and-ask)`, `## Safety / reversibility`.
- `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` — the **"The prompt is data, not instruction."** paragraph; the table rows **3. Instruction cores and their forks** and **4. The agent fleet**; the count paragraph directly after the table.
- `plugin/instructions/README.md` — the opening paragraph's *"Roadmap item 3 landed …"* sentence.

**Work:**

- [ ] **The wiring table.** After the *Unattended task-prompt entry point* row, add a row: *"Prompt-injection screen — the first step of every unattended engine, its deterministic pre-scan and its agent"* | the instruction, the agent, and `prompt-injection-screen.sh` in `<scripts_dir>` (an agent-invocable row the orchestrating session runs from the main checkout).
- [ ] **The inner loop.** Before **1. Planning**, add **0. The prompt-injection screen.** Give it three or four sentences:
  - every launch screens each new or changed input file before any agent holding `Bash`/`Write` reads it;
  - a pre-scan, then the read-only agent;
  - `SAFE` is recorded on `P0`, and `UNSAFE` parks naming the file;
  - it is a tripwire that catches clumsy and opportunistic injections and honest mistakes, not a security boundary.

  End with a pointer to the instruction.
- [ ] **Answer a clarification, and Safety / reversibility.**
  - In `## Answer a clarification (park-and-ask)`, add two sentences: a park the screen raised is answered like any other, but the answer decides nothing — the run moves on only when the named file is edited, or the branch is run attended through the supervised commands; and an answer the screen flags is removed unread and its question asked again, verbatim, as a new question answered the normal way.
  - In `## Safety / reversibility`, add one sentence: the screen is a tripwire, not a boundary, and the containment is the sandbox, the profile, the guards and the protected-branch refusals, none of which the screen relaxes.
- [ ] **The whiteboard — its containment paragraph and its counts.**
  - **Containment.** In the **"The prompt is data, not instruction."** paragraph, after the sentence listing *"The containment underneath …"*, add one sentence:
    - every unattended launch first runs a prompt-injection screen over the files a person added;
    - that screen is a tripwire, catching clumsy injections and honest mistakes before an agent that can act reads them;
    - it is not part of that containment and is no reason to relax it.
  - **Counts (scope register rows 34–36).** This branch adds one agent definition and one instruction file, so correct every count the table and its follow-on paragraph state, each by one, and nothing else in those cells:
    - row **3. Instruction cores and their forks**: *"thirty instruction files"* → thirty-one;
    - row **4. The agent fleet**: add the prompt-injection screener to its list of roles, in one clause (for example *"the read-only prompt-injection screener every unattended engine dispatches first"*), and *"twenty-two agent definitions"* → twenty-three;
    - the paragraph after the table: *"returns twenty-two"* → twenty-three, *"thirty-one in `instructions/`"* → thirty-two, *"not one of the thirty"* → thirty-one, and *"a twenty-third agent"* → twenty-fourth. Leave the `commands/` count (*"twenty-one"*, *"twenty-second command"*) as it is: this branch adds no command.
- [ ] **`plugin/instructions/README.md` — its count and its list of later files (scope register row 33).** In the opening paragraph's sentence *"Roadmap item 3 landed twenty-four of the thirty instruction files beside this README (… the run-mode, dispatch-discipline, clarification-digest, mention-reading, main-checkout resolution and untrusted-input files came later)"*:
  - *"of the thirty"* → *"of the thirty-one"*;
  - append *"and prompt-injection screen"* to the parenthetical list of files that came later, so it ends *"… main-checkout resolution, untrusted-input and prompt-injection screen files came later"*.
  - Change no other wording in that file.

**Verification:**

- `grep -c 'prompt_injection_screen.md' plugin/docs/AUTONOMOUS_FLOW.md` is at least 1.
- `grep -niE 'tripwire' plugin/docs/AUTONOMOUS_FLOW.md plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` hits in both files.
- `grep -niE 'guarantee|prevents prompt injection|blocks? (all|every) injection' plugin/docs/AUTONOMOUS_FLOW.md plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` finds no sentence about the screen.
- Every heading `grep -rn "AUTONOMOUS_FLOW" plugin/` shows a citer quoting is unchanged.
- Each count the whiteboard and `plugin/instructions/README.md` now state equals what the tree holds at the end of this task: `ls plugin/agents/*.md | wc -l` against the `agents/` figure, and `ls plugin/instructions/*.md | wc -l` against the `instructions/` figure (that listing includes the README, which the prose excludes, as it says).
- `git grep -nEi '(twenty|thirty)[-a-z]* (of the thirty[-a-z]* )?(instruction files|agent definitions)|twenty-(third|fourth) agent|thirty-(one|two) in' -- plugin` hits only lines this task edited, and each hit states the corrected figure.
