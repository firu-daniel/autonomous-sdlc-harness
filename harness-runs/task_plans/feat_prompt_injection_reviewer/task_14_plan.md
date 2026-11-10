### Task 14 — Run the screen in the docs engine, parking on `UNSAFE` with no record

**Goal:** Screen the docs checklist before `docs-writer`, which holds `Write` and `Bash`, acts on it. The docs engine has neither a ledger nor a clarification channel, so state plainly how its `UNSAFE` stop is recorded and surfaced.

**Depends on:**
- **Task 10.** `plugin/instructions/prompt_injection_screen.md` owns the step. Run it with engine `docs`.
  - For this engine the screened set is the checklist `<state_dir>/docs_catalog/<branch>_docs.md` alone.
  - Its step 4 commits a person's re-screened edit of the checklist, by exact path, before the loop reads it. Its step 5 records nothing for `docs`: there is no ledger, and the engine's own checkbox flips change the checklist's bytes, so the checklist is re-screened at every launch.
  - Its step 6 writes the park and ends the session. Its step 0 halts on any undocumented script outcome by writing a park itself, in this engine too: the screen does not use this command's own missing-input route (step 4's *"log a blocker and end the session"*), because a log line leaves nothing a person can act on.
- **Task 3.** The park is a `question_<n>.md` under `<state_dir>/clarifications/<branch>/`, which exists in every adopter's state tree whatever the phases.

### Targets

- `plugin/commands/branch-start-docs-autonomous.md` — `## Context` (the **No clarification channel** bullet) and `## Steps`.

**Work:**

- [ ] **The new step.** After step 4 (confirm the checklist exists) and before step 5 (the docs loop), add: *"Run the prompt-injection screen: read `${CLAUDE_PLUGIN_ROOT}/instructions/prompt_injection_screen.md` and follow it with engine `docs`; only on its pass does step 5 run."*
- [ ] **The `No clarification channel` bullet.** Add one sentence, keeping the bullet's existing claim about `docs-writer` byte-for-byte. The screen's `UNSAFE` stop, and its fail-closed halt, are the one exception:
  - each writes its park file in the clarification-channel format;
  - the watcher classifies any question file as `parked` for every engine, so `branch-status`, the notifications and the GitHub question comment surface it;
  - a resume relaunches this engine, whose first act screens the checklist again.

  The bullet then says why a park and not a log line: a log line would end the run with nothing a person could act on.
- [ ] **The `No flow-progress ledger` bullet.** Add one clause: the screen keeps no record here and re-screens the checklist at every launch.

**Verification:**

- `grep -n 'prompt_injection_screen.md' plugin/commands/branch-start-docs-autonomous.md` prints a line between step 4 and step 5.
- The sentence *"A writer that cannot verify a claim marks it `⚠️ unverified` and continues; it never parks to ask a human."* is still present verbatim.
