### Task 12 — Run the screen in the task engine and record it on `P0`

**Goal:** Make the task engine's first act, on every launch, the prompt-injection screen. It must run before the run-mode grep, before the ledger is written and before `task-plan-writer`. A `SAFE` result lands on `P0` in the ledger, and no answer to a screen park ever reaches a writer.

**Depends on:**
- **Task 10.** `plugin/instructions/prompt_injection_screen.md` owns the whole step, so this task points at it and restates none of it. Its step 4 commits a re-screened edit of the task prompt before anything else, so the run-mode grep and the ledger write start from a clean tree. Its step 5 hands the planner fork every `SAFE` `(path, sha)` pair. Its step 6 ends the session on `UNSAFE`, and its step 0 halts on any undocumented outcome.
- **Task 11.** `autonomous_pause_and_ledger.md` §1.3 and §1.4 state the rest:
  - `- [ ] P0. Untrusted input screened (prompt-injection-reviewer SAFE)` is the first `## Planning` line, with record lines `  - screened: <path> sha256=<hex>`;
  - the creation write lays `P0` down `[x]` with the handed pairs;
  - a later launch appends pairs as a flip, inserting `P0` first on a ledger that has none;
  - the subject is `chore: Flow progress P0 for <branch>`.
- **Task 3.** A screen park's question file opens `Raised by: prompt-injection-reviewer (prompt-injection screen)`. Task 10's fail-closed halt writes its blocker under the same line, so the exclusion below covers both.

### Targets

- `plugin/commands/branch-start-plan-autonomous.md` — `## Steps` step 4.
- `plugin/instructions/task_plan_writing_instructions_autonomous.md` — `## Override 5 — pause/resume + flow-progress ledger (planning half)`, `## Override 2 — resumability` case (a), and `## Clarification channel — file format (canonical, single source of truth)` → the **Question file** bullet, the **Why one file per park** bullet and the **Consume-then-archive** bullet (its two statements of which pairs each flow reads).

**Work:**

- [ ] **The command's step 4.**
  - **Placement.** Keep the confirm-the-prompt-exists sentence first. Then add, before the run-mode grep: *"Then run the prompt-injection screen: read `${CLAUDE_PLUGIN_ROOT}/instructions/prompt_injection_screen.md` and follow it with engine `task`; only on its pass does this step continue."*
  - **Wording.** Keep the grep sentence and its literals byte-for-byte. They are wire text `run_mode_instructions.md` designates.
  - **`## Context`.** Add a clause naming the screen as the first act of planning.
- [ ] **Override 5 — creation.** In **"Create the ledger at Setup"**, add that the creation write lays `P0` down `[x]` with one record line per `SAFE` pair the screen handed this session, per canonical-doc §1.4. It is still the same one write and the same one commit.
- [ ] **Override 5 — the flip-point bullet.** Add a `- `P0`` bullet before the `P1` bullet in **"Flip the `## Planning` entries"**:
  - On a launch that found the ledger already present and whose screen handed pairs not yet recorded, append them under `P0`, inserting `P0` `[x]` first where the ledger has none.
  - Commit and push them through the §1.6 direct wrapper calls, before the first `task-plan-writer` dispatch.
  - `P0` is never `[-]` and never reverts.
- [ ] **Override 2(a).**
  - **The exclusion.** Beside the existing Phase G exclusion, add: a top-level answered pair whose `question_<n>.md` opens `Raised by: prompt-injection-reviewer (prompt-injection screen)` is **not** appended to any writer dispatch. Its answer was screened and decides nothing.
  - **Judging the origin.** Tell such a pair from its question file alone, never by reading its answer.
  - **Firing.** When only such pairs are pending, case (a) does not fire.
  - **A re-ask is not such a pair** unless its original was a screen park: Task 3's re-ask copies the original `question_<k>.md` verbatim at a new index, origin included, so case (a) or G.0 reads it through that origin with no new rule.
- [ ] **The channel's canonical statement — the screen as a writing site, and Consume-then-archive.** The single source of truth must not contradict the screen's park shape (Task 3: one screen park plus one re-ask per flagged answer, written in one launch).
  - **Question file** bullet. After its first clause, *"`question_<n>.md`, **one file per park**, holding every question that park raises"*, add one sentence: the prompt-injection screen (`${CLAUDE_PLUGIN_ROOT}/instructions/prompt_injection_screen.md`) is a further writing site, and its park may span **one screen park plus one re-ask per original question file whose answer was flagged**, each its own `question_<n>.md` at its own index and each keeping its own origin. A launch with nothing but flagged answers writes only the re-asks. Keep the index rule, the self-contained rule and the **names no answer channel** paragraph byte-for-byte.
  - **Why one file per park** bullet. Add, after *"this fork's headless reroute and the matching reroute in each of the other three autonomous forks"*: *"— and the prompt-injection screen, which writes its park, re-asks included, and its fail-closed halt at the moment it stops the engine"*. Then add one sentence at the bullet's end: a screen park that spans several files is still kept whole, because the watcher resumes only once **every** top-level `question_<n>.md` has its answer, so no part of it is consumed alone. Keep the sentence *"One file per question would let a watcher consume part of a park."* byte-for-byte.
  - **Consume-then-archive (single ordering contract for resume)** bullet: amend the two reading statements so the single source of truth names the screen-park exclusion this task and Task 13 add, and no second owner disagrees with it:
  - *"the task flow reads every pair whose question file does not name an origin that opens `Phase G` through Override 2(a) above"* → name, beside the `Phase G` exception, a pair whose question file opens `Raised by: prompt-injection-reviewer (prompt-injection screen)`: the task flow's Override 2(a) appends it to no writer, because its answer was screened and decides nothing.
  - *"the user-review-fix flow reads the fix-plan phase's through its own Override 2(a)"* → add that the same screen-park pair is excluded there too (`${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability`, which Task 13 amends).
  - Add one sentence after the archive sentences, so the channel's one owner states the screen's own moves: *an answer the prompt-injection screen flags `UNSAFE` is read by no flow — the screen removes it unread, moves its `question_<n>.md` under `answered/` when it sits at the top level, and re-asks that question verbatim at the next index, except where that question is itself a screen park, whose answer decides nothing and is removed with no re-ask (`${CLAUDE_PLUGIN_ROOT}/instructions/prompt_injection_screen.md` → `## Edit and resume`); the watcher's archive of that index then finds the files already gone.*
  - Keep every other literal of the three bullets byte-for-byte: the `Phase G` wording, the G.0 citation, the **On resume** citation, the archive sentences and the `park_loop` sentence.

**Verification:**

- `grep -n 'prompt_injection_screen.md' plugin/commands/branch-start-plan-autonomous.md` prints a line inside step 4, before the line carrying `grep -nE '^#+ *Run mode'`.
- `grep -c "grep -nE '^#+ \*Run mode'" plugin/commands/branch-start-plan-autonomous.md` is unchanged from before this task.
- `grep -n '`P0`' plugin/instructions/task_plan_writing_instructions_autonomous.md` shows the creation sentence and the new bullet above the `P1` bullet.
- `grep -n 'Raised by: prompt-injection-reviewer' plugin/instructions/task_plan_writing_instructions_autonomous.md` prints the case (a) exclusion, and a second hit on the line that opens `- **Consume-then-archive (single ordering contract for resume).**`, inside `## Clarification channel — file format`.
- `grep -n 'removes it unread' plugin/instructions/task_plan_writing_instructions_autonomous.md` prints the line that opens `- **Consume-then-archive (single ordering contract for resume).**`, and that line also carries `with no re-ask`.
- `grep -n 'one screen park plus one re-ask per original question file' plugin/instructions/task_plan_writing_instructions_autonomous.md` prints the line that opens `- **Question file:**`, and `grep -n 'and the prompt-injection screen, which writes its park' plugin/instructions/task_plan_writing_instructions_autonomous.md` prints the line that opens `- **Why one file per park:**`.
- `grep -c 'One file per question would let a watcher consume part of a park.' plugin/instructions/task_plan_writing_instructions_autonomous.md` is unchanged from before this task, and `git diff` of the **Question file** and **Why one file per park** lines shows only added text.
- The number of `` opens `Phase G` `` occurrences on that Consume-then-archive line is unchanged from before this task (compare `git diff` of the line: only added text, nothing removed).

- **Deviations from plan:** The **Question file** sentence was placed after the bullet's first full sentence (ending `→ `## The entry format`).`), not directly after the clause *"holding every question that park raises"*: that clause runs on into the index rule mid-sentence (`, where `<n>` is …`), so an insertion there would have split the index rule, which the plan keeps byte-for-byte. The Consume-then-archive amendments joined at `states;` → `states, …;` and `2(a)` → `2(a), …,`: punctuation moved to the end of the added text, no word removed (`git diff --word-diff=porcelain` shows only those two `-` tokens).
