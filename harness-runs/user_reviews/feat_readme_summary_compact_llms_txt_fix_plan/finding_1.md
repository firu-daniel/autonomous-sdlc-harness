### 1. Adopter commands in `README.md` and `llms.txt` cannot be copied and run as written

**Files:**
- `README.md` — the opening checklist, lines starting "1. Install the plugin:" through "5. Start the daemon:"; the `### Adopting it in your own repository` steps "**A. Install the harness — once per machine (checklist step 1).**", "**B. Wire a project — once per repo (checklist step 2).**", "**D. Verify (checklist step 4).**", "**E. Run (checklist step 5).**"; the **Before you run it** bullet "**Published.**"; the step "**F. A teammate clones.**"
- `llms.txt` — the list under "The quick start, in five steps:"

**Problem.** Task 5 of this branch turned the quick start into a one-line-per-step checklist and removed "every code block the checklist line already carries" from the lettered steps. Two things broke for an adopter:

1. **Checklist steps 1 and 5 put two commands on one line**, as inline code spans joined by ", then":
   - `README.md` step 1: "`claude plugin marketplace add firu-daniel/autonomous-sdlc-harness`, then `claude plugin install autonomous-sdlc-harness@autonomous-sdlc-harness` (step A)."
   - `README.md` step 5: "`npx autonomous-sdlc-harness daemon install`, then `npx autonomous-sdlc-harness daemon start` (step E)."

   GitHub gives inline code no copy button. Selecting both by hand also picks up ", then", so the pasted text does not run. Steps 2 and 4 are single inline spans with the same missing copy button, and step 3's `/harness-analyze` is inline too.
2. **Steps A, B, D and E no longer show a command.** On `dev`, each carried a fenced ```` ```bash ```` block (A: the two `claude plugin` lines; B: `npx autonomous-sdlc-harness init`; D: `npx autonomous-sdlc-harness doctor`; E: `daemon install` and `daemon start` on two lines). The branch deleted all four, so the detail sections now describe a command without showing it.

`llms.txt` copies the checklist word for word, so its steps 1 and 5 have the same ", then" joins and steps 2 and 4 are inline spans too.

The rule the user set: **every command an adopter is meant to run is copiable, meaning one command per line in a fenced block.** This overrides Task 5's "one line each" checklist shape and its "drops every code block" instruction for the lettered steps.

**Fix.**

- [ ] **`README.md` checklist.** Keep the numbered list and each step's lead text and `(step X)` pointer. Move every command into a fenced block nested under its list item, indented three spaces so it stays inside the item on GitHub. Put one command on each line and remove ", then". Shell commands use ```` ```bash ````. Step 3's slash command is typed into Claude Code, not a shell, so it gets a fence with no language tag. Target shape:

  ````markdown
  1. Install the plugin (step A):

     ```bash
     claude plugin marketplace add firu-daniel/autonomous-sdlc-harness
     claude plugin install autonomous-sdlc-harness@autonomous-sdlc-harness
     ```

  2. Wire your repository (step B):

     ```bash
     npx autonomous-sdlc-harness init
     ```

  3. Teach it the codebase: type this in an **interactive** Claude Code session opened on the repository, not in the terminal (step C):

     ```
     /harness-analyze
     ```

  4. Verify (step D):

     ```bash
     npx autonomous-sdlc-harness doctor
     ```

  5. Start the daemon (step E):

     ```bash
     npx autonomous-sdlc-harness daemon install
     npx autonomous-sdlc-harness daemon start
     ```
  ````

- [ ] **`README.md` steps A, B, D, E.** Put back the fenced ```` ```bash ```` block each one had on `dev`, right after the step's paragraph and with the same lines as above (A: the two `claude plugin` lines; B: `init`; D: `doctor`; E: `daemon install` then `daemon start` on separate lines). Keep the paragraphs as they are now, including "(checklist step N)". Leave step C alone: its `/harness-analyze <target>` is a placeholder form, not a literal command.
- [ ] **`README.md`, the other commands an adopter runs.** Apply the same rule to the two commands that are still inline:
  - The **Published.** bullet: keep the sentence, but put `npm view autonomous-sdlc-harness version` in a fenced ```` ```bash ```` block nested under the bullet (two-space indent). The sentence can end "…answers with the published version and exits `0`:" before the block.
  - Step **F. A teammate clones.**: keep the arrow sequence as prose, but end it at the `/reload-plugins` clause. Then add "Then verify:" and a fenced ```` ```bash ```` block holding `npx autonomous-sdlc-harness doctor`, followed by the existing sentences about which keys are written and why no `init` re-run is needed.
- [ ] **`llms.txt` quick start.** Apply the same checklist change to the list under "The quick start, in five steps:": one fenced block per step, nested with a three-space indent, one command per line, no ", then". Keep each step's lead text as it is now, minus the inline commands. Add no links: `scripts/check-llms-txt.sh` grades every `](…)` target, and a fence line must not start with `> ` or `## `.

**Verify.**

- `grep -n ', then `' README.md llms.txt` prints nothing.
- `bash scripts/check-llms-txt.sh` exits `0`.
- Rendered on GitHub, each of the five checklist items shows its fenced block inside the numbered item and the numbering does not restart. Steps A, B, D, E and F each show a copy button on their command block. Copying any block and pasting it into a shell runs it line by line with no stray words.

**Deviations from plan:** The third Verify bullet (GitHub rendering, copy buttons, numbering continuity) was not executed: no GitHub render is reachable from this run. It rests on reading the edited Markdown, which nests every checklist fence at a three-space indent under its item with a blank line either side, and the **Published.** fence at a two-space indent under its bullet. The first two bullets were executed: the `grep` printed nothing and `bash scripts/check-llms-txt.sh` exited `0`.
