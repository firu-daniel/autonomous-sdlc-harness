### Task 20 — Keep the clarification digest and `branch-answer` true for a screen-discarded answer and a multi-file screen park

**Goal:** Two readers of the clarification channel assume what the screen changes. The Phase D digest writes *"resolved out of band"* for every question whose answer is absent. After this branch, the screen can be the reason the answer is gone: it removed the answer unread and either re-asked the question or, for a screen park, discarded the answer with no re-ask. Recording that as *resolved out of band* would put a false statement into a committed file. Both the digest and `branch-answer` also describe a park as one question file, and a screen launch can write several. This task makes both statements true again without changing any existing literal's meaning for an ordinary park.

**Depends on:**
- **Task 3**, the park writer. Two literals it writes are what this task keys on, restated here byte-for-byte:
  - a screen park's origin line, `Raised by: prompt-injection-reviewer (prompt-injection screen)`, the first non-blank line after the title;
  - a re-ask's appended heading, `` ## Prompt-injection screen: the answer to `question_<k>.md` was discarded ``, in the re-ask `question_<m>.md`, which otherwise holds `question_<k>.md`'s bytes verbatim.

  It also fixes the behaviour: a flagged answer is removed unread; its question is re-asked at the next index unless that question is itself a screen park, whose answer is removed with no re-ask. One screen launch may write a screen park plus one re-ask per original question file whose answer was flagged.
- **Task 12**, which amends `task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format (canonical, single source of truth)` so its **Question file**, **Why one file per park** and **Consume-then-archive** bullets name the screen as a writing site, its multi-file park and its discard. This task points at that section, which both edited files already cite, and restates none of it. It cites nothing in `plugin/instructions/prompt_injection_screen.md`, so it adds no member to that file's `## Who may cite this`.

**Where this task stops.** The digest's commit mechanics, push, ledger/resume and activation are unchanged, and so is its untrusted-input rule pointer. `branch-status.md` needs no edit: it already lists every top-level question file without its answer.

### Targets

- `plugin/instructions/clarification_digest_instructions.md` — `## What is digested` (the absent-answer bullet) and `## The entry format` (its lead sentence and the **answered:** arm).
- `plugin/commands/branch-answer.md` — the opening paragraph's park sentence, and step 4's list of why more than one question file can be open.

**Work:**

- [ ] **The digest's absent-answer arm.** In `## The entry format` → the **answered:** arm, keep *"exactly `no answer file on disk — resolved out of band`"* byte-for-byte as the arm for every other case, and add two arms ahead of it, each an exact literal:
  - where another question file in the source set carries the heading `` ## Prompt-injection screen: the answer to `question_<n>.md` was discarded `` for this `<n>`: exactly `no answer file on disk — discarded unread by the prompt-injection screen; re-asked as question_<m>`, `<m>` the index of the file carrying that heading;
  - else, where this `question_<n>.md` opens `Raised by: prompt-injection-reviewer (prompt-injection screen)`: exactly `no answer file on disk — a prompt-injection screen park, cleared by an edit to the screened file, never by an answer`.

  The **carries beyond this branch:** field stays `nothing beyond this branch` on all three absent-answer arms.
- [ ] **The digest's `## What is digested`.** In the absent-answer bullet, qualify *"The run reached Phase D, so the block was resolved out of band"*: add that the two screen arms of `## The entry format` are the exceptions, where the answer is absent because the prompt-injection screen removed it (`${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format (canonical, single source of truth)`, its **Consume-then-archive** bullet). Keep the rest of the bullet byte-for-byte.
- [ ] **The digest's block count.** In `## The entry format`'s lead sentence, replace *"one per park, however many questions it holds"* with *"one per question file, however many questions it holds — a park is normally one file, and a prompt-injection screen launch may write a screen park and its re-asks as several"*. Keep *"One block per `question_<n>` **file** in the source set"* and *"keyed by that index"* byte-for-byte; the key rule is unchanged.
- [ ] **`branch-answer.md`.**
  - In the opening paragraph, after *"it writes them together into one `question_<n>.md` — one `## Q<k> — <decision needed>` section per question — and **parks** (ends its session)"*, add one sentence: a prompt-injection screen launch may instead write a screen park and one re-ask per flagged answer, each its own question file, and the run resumes only once every one is answered.
  - In step 4, extend the parenthetical of open-file causes, *"a park written before one file held the whole park, or a question file added after the park"*, with *", or a prompt-injection screen launch that wrote a screen park and its re-asks together"*. Change nothing else in step 4: listing every open file and answering the target is already right for this case.

**Verification:**

- `grep -c 'no answer file on disk — resolved out of band' plugin/instructions/clarification_digest_instructions.md` is unchanged from before this task.
- `grep -n 'discarded unread by the prompt-injection screen; re-asked as question_' plugin/instructions/clarification_digest_instructions.md` and `grep -n 'a prompt-injection screen park, cleared by an edit to the screened file' plugin/instructions/clarification_digest_instructions.md` each print a line inside `## The entry format`.
- `grep -n 'was discarded' plugin/instructions/clarification_digest_instructions.md` prints the heading literal exactly as Task 3 writes it, backticks included.
- `grep -c 'one per park, however many questions it holds' plugin/instructions/clarification_digest_instructions.md` prints `0`, and `grep -c 'one per question file, however many questions it holds' plugin/instructions/clarification_digest_instructions.md` prints `1`.
- `grep -n 'prompt-injection screen launch' plugin/commands/branch-answer.md` prints the opening-paragraph sentence and the step-4 clause.
- `grep -cF 'prompt_injection_screen.md' plugin/instructions/clarification_digest_instructions.md plugin/commands/branch-answer.md` reports `0` for each file.
