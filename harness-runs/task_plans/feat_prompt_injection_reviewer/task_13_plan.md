### Task 13 — Run the screen in the user-review engine and record it on `R0`

**Goal:** Make the user-review engine's first act after it confirms a review file exists, on every launch, the prompt-injection screen. It must run before the tree-state precondition (step 5), before the run-mode preflight, before the ledger's create or re-seed and before `user-review-fix-plan-writer`. A `SAFE` result lands on `R0`, earlier records carry forward across rounds, and no answer to a screen park reaches a writer.

**Why before step 5.** The task prompt and the review rounds are committed on the run branch (`chore: add task prompt for <branch>`, `chore: add user review for <branch>`). A person who takes the park's edit-and-resume route edits one of them in the run's working copy, which leaves a modified tracked file. Step 5 halts on any modified tracked file, so a screen placed after it would never see the edit. Placed before it, the screen re-screens the edited file and, once it passes, commits it by exact path (Task 10 step 4), and step 5 then finds a clean tree. A still-unsafe edit parks before step 5 runs. Any other modified tracked file still halts at step 5 exactly as today.

**Depends on:**
- **Task 10.** `plugin/instructions/prompt_injection_screen.md` owns the step. Run it with engine `user_review`.
  - Its `## Where and when it runs` places this engine's screen after the review-file check and before the tree-state precondition.
  - Its step 4 commits a re-screened edit to a tracked screened file, through `bash <MAIN_REPO>/<scripts_dir>/commit-on-branch.sh --repo <repo_root> <path>... -- "chore: Commit re-screened input edit for <branch>"` and `push-branch.sh`, and halts on a refusal or failure.
  - Its step 5 hands the fix-plan fork every `SAFE` `(path, sha)` pair, its step 6 ends the session on `UNSAFE`, and its step 0 halts on any undocumented outcome.
  - Its `## Edit and resume` states the discard-and-re-ask rule the fork's Override 2 exclusion cites by pointer, and its `## Who may cite this` roster lists that fork because of that pointer.
- **Task 11.** `autonomous_pause_and_ledger.md` §1.3 and §1.4 state the rest:
  - `- [ ] R0. Untrusted input screened (prompt-injection-reviewer SAFE)` is the first `## Fix planning` line, with record lines `  - screened: <path> sha256=<hex>`;
  - the create and re-seed writes lay `R0` `[x]` with this session's pairs **plus every `screened:` line of the ledger being replaced**;
  - a same-round resume appends as a flip, inserting `R0` first where absent;
  - the subject is `chore: Flow progress R0 for <branch>`.
- **Task 12.** The channel's canonical **Consume-then-archive** statement now names the screen-park exclusion for this flow's Override 2(a), pointing at this file's `## Override 2 — resumability`.
- **Task 3.** A screen park's question file opens `Raised by: prompt-injection-reviewer (prompt-injection screen)`.

### Targets

- `plugin/commands/branch-start-user-review-fix-autonomous.md` — `## Steps`, between step 4 (confirm a review file exists) and step 5 (the tree-state precondition), and step 5's own text.
- `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` — `## Override 4 — pause/resume + flow-progress ledger (fix-planning half)` and `## Override 2 — resumability`.

**Work:**

- [ ] **The command.** After step 4 and before step 5, add one paragraph: *"Prompt-injection screen — after step 4 and before step 5. Read `${CLAUDE_PLUGIN_ROOT}/instructions/prompt_injection_screen.md` and follow it with engine `user_review`; only on its pass does the flow continue."* Add one clause giving the reason: an edited screened file is a modified tracked file, which the screen commits once it passes and which step 5 would otherwise halt on.
  - In step 5, add one sentence: by the time it runs, the screen has committed any re-screened edit, so a modified tracked file here is one the screen did not pass or did not screen, and halts as before. Change none of step 5's other wording.
  - Leave the preflight's grep literal byte-for-byte, and the preflight's lead-in *"after step 5 and before step 6"* unchanged.
- [ ] **Override 4 — create and re-seed.** In **"Create OR re-seed the R-ledger at Setup"** and the **"Record the run mode on the create and re-seed paths"** bullets, add:
  - the create and re-seed writes lay `R0` down `[x]` with the screen's pairs plus every `screened:` line carried from the ledger being replaced, per canonical-doc §1.4;
  - they are the same one write.
  - The round comparison that decides create, re-seed or resume is unchanged.
- [ ] **Override 4 — the flip-point bullet.** Add a `- `R0`` bullet before the `R1` bullet:
  - On a same-round resume whose screen handed pairs not yet recorded, append them under `R0`, inserting `R0` `[x]` first where the ledger has none.
  - Commit and push through the §1.6 direct wrapper calls, before the first `user-review-fix-plan-writer` dispatch.
  - `R0` is never `[-]` and never reverts.
- [ ] **Override 2.** Where this fork's resumability appends answered pairs to the writer, exclude any pair whose `question_<n>.md` opens `Raised by: prompt-injection-reviewer (prompt-injection screen)`.
  - Judge it from the question file alone, never by reading its answer.
  - When only such pairs are pending, the answered-pairs case does not fire.
  - A re-ask of a flagged answer (Task 3 writes it: the original `question_<k>.md` copied verbatim at a new index, origin included) is not such a pair unless its original was a screen park. Add no rule for it: it is read through the original's own origin, which is the point of copying it verbatim.
  - Cite `${CLAUDE_PLUGIN_ROOT}/instructions/prompt_injection_screen.md` → `## Edit and resume` (Task 10) as the source of the discard-and-re-ask rule this bullet relies on — a pointer, never a restatement of that section. This is the pointer that puts this fork on Task 10's `## Who may cite this` roster.

**Verification:**

- `grep -n 'prompt_injection_screen.md' plugin/commands/branch-start-user-review-fix-autonomous.md` prints a line after the line opening `4. **Confirm at least one user-review file exists**` and before the line opening `5. **Tree-state precondition.**`.
- `grep -n "grep -nE '^#+ \*Run mode'" plugin/commands/branch-start-user-review-fix-autonomous.md` prints the same text as before this task.
- `grep -n '`R0`' plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` shows the create/re-seed sentence and the new bullet above the `R1` bullet.
- `grep -n 'Raised by: prompt-injection-reviewer' plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` prints the Override 2 exclusion, and `grep -n 'prompt_injection_screen.md' plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` prints a line inside that Override 2 exclusion naming `## Edit and resume`.
- `plugin/instructions/user_review_fixes_instructions_autonomous.md` is unchanged. Its **On resume** reads only Phase `A`/`QA`/`D` pairs, as the story index's scope register records.
