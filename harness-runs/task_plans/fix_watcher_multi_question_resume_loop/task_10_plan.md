### Task 10 — Commands: answer a whole park, and name the `park_loop` status and its clear action

**Goal:** Keep `/autonomous-sdlc-harness:branch-answer` a single command that answers a whole park — showing every question in it and saying how to answer only one of several — make `/autonomous-sdlc-harness:branch-status` report the `park_loop` status with its evidence and the operator action that clears it, and correct the two engine commands' one-line description of the channel.

**Depends on:** Task 2 and Task 7.

- From **Task 2**, restated: the watcher records the registry status `park_loop` for a run whose park-resumes made no progress `PARK_LOOP_MAX_CYCLES` times in a row, and resumes it no further. Its evidence is in `<MAIN_REPO>/<state_dir>/autonomous_logs/watcher.log`, on lines containing `resume made no progress (cycle` and `park loop —`. The clear action is creating the empty file `<worktree>/<state_dir>/clarifications/<branch>/PARK_LOOP_CLEAR`; the next watcher pass removes it, resets the count, sets the record back to `parked`, and resumes the run as soon as every open question file has its answer. `park_loop` is the only new status.
- From **Task 7**, restated: `question_<n>.md` is one file per park, holding every question as a `## Q<k> — <decision needed>` section; `answer_<n>.md` answers the whole park, addressing questions by `Q<k>`; a park of one question needs no label; a question the answer leaves unaddressed is parked again by the resumed run in a new question file. The watcher resumes only once every top-level question file has its answer. A park written before this layout may be several one-question files.

**Where this task stops.** Both commands stay read-and-write-one-file (`branch-answer`) and read-only (`branch-status`); neither touches `<scripts_dir>/autonomous-watcher.sh`, the engines or the instruction forks, and `branch-status` does **not** create the sentinel — it prints the command for the operator. The watcher's own documentation of the guard is Task 12's.

### Targets

- `plugin/commands/branch-answer.md`
- `plugin/commands/branch-status.md`
- `plugin/commands/branch-start-plan-autonomous.md` → entry point **(b) Watcher / headless**.
- `plugin/commands/branch-start-user-review-fix-autonomous.md` → entry point **(b) Watcher / headless**.

**Work:**

- [ ] `branch-answer.md`: the `description:` frontmatter and `## Context` say it shows the park's question file and writes your text as that park's answer. Step 2's registry candidates are records whose status is `parked` **or** `park_loop` (update the `jq` select). Step 4 targets the lowest-indexed top-level `question_<n>.md` without an answer (or the `#<n>` the user named); when **more than one** is open — a park written before this layout, or a question file added after the park — list them all, answer the target, and say the run resumes only once every one has its answer. Step 5 prints the whole question file, every `## Q<k>` section. Add to `## Context` how to answer one question of several: prefix each ruling with its label (`Q2: …`), and any question left unaddressed is asked again by the resumed run as a new park — so an answer is never partial by accident.
- [ ] `branch-answer.md` step 7: report that the watcher resumes once every open question file of the park has its answer; when the target record's status is `park_loop`, report instead that the answer is written but the watcher will not resume the run until the clear action is taken, and print that action as a fenced block holding the one `touch` command, with the real worktree, state directory and branch substituted.
- [ ] `branch-status.md`: step 4's "the outstanding `question_<n>.md` path" becomes the outstanding question file path(s). Step 6 gains the `park_loop` arm: say the watcher stopped resuming the run because its resumes made no progress; show the last lines of a **bounded, single** read of `<MAIN_REPO>/<state_dir>/autonomous_logs/watcher.log` that name this branch and contain `made no progress` or `park loop` (never `tail -f`); name the clear action as a fenced block holding exactly one command — `touch <worktree>/<state_dir>/clarifications/<branch>/PARK_LOOP_CLEAR`, substituted — and say that the run then resumes on the next pass once every open question file is answered (pointing at `/autonomous-sdlc-harness:branch-answer` when one is not).
- [ ] The two engine commands' entry point **(b)**: "Clarification questions are written to `<state_dir>/clarifications/<branch>/question_<n>.md`" becomes: a park's questions are written together to one `<state_dir>/clarifications/<branch>/question_<n>.md`, the run yields, and the watcher marks it `parked` and resumes once that file is answered. Keep the planning command's parenthetical pointer to the planning fork's `## Clarification channel — file format` as it is.

**Verification:**

- `grep -n "Clarification questions are written to" plugin/commands/branch-start-plan-autonomous.md plugin/commands/branch-start-user-review-fix-autonomous.md` prints nothing, and `grep -n "park_loop" plugin/commands/branch-answer.md` finds the widened candidate select and the step 7 arm.
- `grep -n "PARK_LOOP_CLEAR" plugin/commands/branch-status.md plugin/commands/branch-answer.md` finds the clear action in both, each time inside a fenced block with one command on its line (the lessons ledger's adopter-command rule).
- `branch-status.md` still carries no write instruction: its closing read-only fence is unchanged.
- `bash scripts/check-command-spelling.sh` exits 0, and `claude plugin validate --strict plugin` passes (the `description:` edit is frontmatter).
