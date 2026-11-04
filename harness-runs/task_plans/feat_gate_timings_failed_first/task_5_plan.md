### Task 5 — The three supervised gate-run blocks say the wrapper may answer a reused verdict at once

**Goal:** The supervised flows' gate-run block states *"The command starts both gates detached from this session and prints `pending` at once."* After Task 1 that is false for a label whose run already finished on the same commit — the command then prints that run's verdict at once. Correct the sentence in all three copies, keeping them byte-identical to each other.

**Depends on:** Task 1, whose `<scripts_dir>/run-test-suite.sh` header paragraph opening `ONE RUN PER LABEL.` owns the reuse rule (a finished run of the label on the commit HEAD still names, with nothing outside `<state_dir>` changed, is answered with its verdict and not run again). Each block's verdict bullets already route a `pass` or `fail <log>` line however it arrives, so only this one sentence changes. Task 4 makes the matching change in `plan_orchestration_instructions_core.md` → `### G.1`; this task edits no file of Task 4's.

### Targets

- `plugin/instructions/code_review_fixes_instructions.md`
- `plugin/instructions/code_review_instructions.md`
- `plugin/instructions/user_review_fixes_instructions.md`

**Work:**

- [ ] In each file, the bullet opening *"The command starts both gates detached from this session and prints `pending` at once."*: add, in that sentence, that when a run of its label already finished on this commit with nothing changed since, it prints that run's verdict instead (`<scripts_dir>/run-test-suite.sh` → the header comment opening `ONE RUN PER LABEL`). Write the new sentence once and paste it byte-for-byte into the other two (`.claude/context/plugin.md` → *"A block several agents carry is one wording, copied byte-for-byte into every copy"*). Change nothing else in the block.

**Verification:**

- `grep -rn 'prints `pending` at once' plugin/` lists exactly these three files, and the three matching lines are byte-identical to each other (compare the `grep -h` output lines).
- `git diff --stat` touches only the three targets, one line each.
