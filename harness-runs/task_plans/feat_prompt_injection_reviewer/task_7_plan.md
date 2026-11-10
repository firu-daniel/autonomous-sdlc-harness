### Task 7 — Describe the new script and the screen park in the adopter-facing READMEs and the profile template's `_README`

**Goal:** Make the new outer-loop script and its two run artifacts legible to an adopter, in the files `init` writes or that describe what it writes:
- the verdict file in `scratch/`;
- the screen park in `clarifications/`.

**Depends on:** Tasks 1–4, which define what this task describes. Each line below is restated from the owning task so this file is self-contained:
- **The script.** `prompt-injection-screen.sh`, an `OUTER_LOOP_SCRIPTS` row with `agentInvocable: true` and no `runsUnsandboxed`. Its verbs are `prescan`, `plan`, `park` and `verdict`. The orchestrating session runs the main checkout's copy, sandboxed. It is a tripwire, not a boundary.
- **The verdict file.** `<state_dir>/scratch/prompt-injection-screen-<branch_fold>/verdict.md`. The orchestrator writes it, and `verdict` reads and removes it. `<branch_fold>` folds the branch the same way the fetch directories do.
- **The screen park.** A `question_<n>.md` opening `Raised by: prompt-injection-reviewer (prompt-injection screen)`. It is written by the script, not by an agent. Answering it never moves the run past it: the answer is itself screened, and the parked file stays `UNSAFE` until its bytes change.
- **The re-ask (Task 3).** When an answer is flagged, the script removes it unread, moves its question under `answered/`, and writes a new `question_<m>.md` holding that question verbatim, origin included, with the findings appended. It is answered the normal way, and that answer is screened in turn.

**Where this task stops.** This repository's own self-adopted copies of the two state-dir READMEs are Task 16's. The root documentation (`docs/cli.md`, `docs/watcher.md`, `README.md`) is Task 18's.

### Targets

- `cli/templates/scripts/README.md`
- `cli/README.md`
- `cli/templates/state-dir/scratch/README.md`
- `cli/templates/state-dir/clarifications/README.md`
- `cli/templates/claude/settings.autonomous.json` — the `THE OUTER-LOOP SCRIPTS AN AGENT RUNS …` `_README` string only.

**Work:**

- [ ] **`cli/templates/scripts/README.md` and `cli/README.md`.** Add `prompt-injection-screen.sh` to each enumeration of the outer-loop family.
  - In the templates README, the **"Two of them are run by the orchestrating session"** sentence becomes three, adding one clause on what it prints and that the main checkout's copy is the one run.
  - In `cli/README.md`, extend the parenthetical list only.
- [ ] **`scratch/README.md`.** Beside the paragraph on the GitHub route's fetch directories, add two sentences:
  - The unattended engines' prompt-injection screen writes the agent's verdict to `<state_dir>/scratch/prompt-injection-screen-<branch_fold>/verdict.md`, and its parser removes it once read.
  - It is the second named exception to *"nothing depends on a probe file's name"*.
- [ ] **`clarifications/README.md`.** After the sentence beginning *"A question file is written by the agent that reached decisions it must not take alone"*, add three sentences:
  - The screen writes the two question files no agent writes: a screen park, opening with its `Raised by:` line, and a re-ask.
  - A screen park's answer decides nothing: it is screened like any other input, and the run stays parked until the named file's bytes change.
  - An answer the screen flags is removed unread, and its question is asked again verbatim at the next index, beside the findings; that question is answered the normal way. The one exception is a flagged answer to a screen park, which is removed with no re-ask, since it decides nothing.
- [ ] **`settings.autonomous.json` `_README`.** In the `THE OUTER-LOOP SCRIPTS AN AGENT RUNS …` string, *"the orchestrating session runs three of them"* becomes four, naming the prompt-injection screen `prompt-injection-screen.sh` beside the flow walker. Change no key and no entry.

**Verification:**

- `node -e "JSON.parse(require('fs').readFileSync('cli/templates/claude/settings.autonomous.json','utf8'))"` exits 0.
- `git diff -U0 cli/templates/claude/settings.autonomous.json` changes exactly one line, inside `_README`.
- `grep -c 'prompt-injection-screen' cli/templates/scripts/README.md cli/README.md cli/templates/state-dir/scratch/README.md` reports a non-zero count for each file.
- `grep -n 'Raised by: prompt-injection-reviewer' cli/templates/state-dir/clarifications/README.md` prints one line.
