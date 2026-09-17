### Task 8 — The other three autonomous forks write and consume one exchange per park

**Goal:** Bring the implementation fork, the fix-implementation fork and the fix-plan fork into line with the channel Task 7 redefines: each writes every question of a park into one question file, and each consumes every answered pair the watcher resumed for.

**Depends on:** Task 7, which owns the channel, restated so this file stands alone. In `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format (canonical, single source of truth)`: `question_<n>.md` is one file **per park**, opening with the raising agent/phase (and the latest findings path where one applies), then one `## Q<k> — <decision needed>` section per question; `answer_<n>.md` answers the whole park, addressing questions by `Q<k>`, and a question it leaves unaddressed is parked again by the resumed run in a new question file; the watcher resumes only when every top-level question file is answered, names every answered pair in the resume prompt, and archives exactly that set on exit. `## Override 2 — resumability` case (a) now consumes **every** top-level answered pair. These forks **reference** that section and restate none of it — the single-owner rule (`plugin/instructions/mode_contract.md` rule (5)).

**Where this task stops.** The planning fork itself is Task 7's; the digest module and the ledger's §1.7 sentence are Task 9's. No heading in any of the three files is renamed: ``### `<escalate>` — the clarification reroute``, ``### `<escalate>` / `<ask>` — the park-and-yield clarification reroute`` and `## Override 2 — resumability` are all cited by name elsewhere.

### Targets

- `plugin/instructions/plan_orchestration_instructions_autonomous.md`
- `plugin/instructions/user_review_fixes_instructions_autonomous.md`
- `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md`

**Work:**

- [ ] `plan_orchestration_instructions_autonomous.md` → ``### `<escalate>` — the clarification reroute``, headless bullet: "write the blocker as one or more self-contained … `question_<n>.md` files" becomes writing every blocker of this park into **one** self-contained `question_<n>.md` in the canonical format; "resumes it … when an `answer_<n>.md` lands" becomes when the park's question file is answered. The pointer to the canonical section stays as it is.
- [ ] `user_review_fixes_instructions_autonomous.md` → ``### `<escalate>` / `<ask>` — the park-and-yield clarification reroute``: the headless bullet writes **one** park file that names the phase (`A` / `QA` / `D`) once and, per `## Q<k>` section, the item or finding it arose on and the latest findings-file path; the **On resume** paragraph reads every top-level answered pair whose question file this fork raised (not "a top-level `answer_<n>.md`"), appends each question file and its answer to the next dispatch prompt for the blocked item or phase, and leaves the pairs where they are for the watcher to archive per the canonical contract.
- [ ] `user_review_fix_plan_writing_instructions_autonomous.md`: the `<ask>` row ("writes the question file(s)" → the park's question file); the `<existing_artifact_decision>` row and `## Override 2 — resumability` case (a) (every pending top-level answered pair whose question file was raised by the fix-plan phase; the raising phase is read once per park file); the channel-reference paragraph's parenthetical (add "one file per park" beside the self-containment, indexing and consume-then-archive items it lists); and the headless bullet ("write self-contained … `question_<n>.md` file(s)" → one park file, "resumes it when an `answer_<n>.md` lands" → when the park's question file is answered).

**Verification:**

- `grep -n "one or more self-contained\|question file(s)\|file(s) in the canonical format" plugin/instructions/plan_orchestration_instructions_autonomous.md plugin/instructions/user_review_fixes_instructions_autonomous.md plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` prints nothing.
- No fork restates the question-file body format: `grep -n "## Q<k>" plugin/instructions/plan_orchestration_instructions_autonomous.md plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` prints nothing (the fix-implementation fork's per-section content list names what its own park file carries and is the one permitted mention).
- `git grep -in "override 2"` and `git grep -in "clarification channel"` return the same set of files as before the edit, so no citer lost its anchor.
- `bash scripts/check-command-spelling.sh` exits 0.
