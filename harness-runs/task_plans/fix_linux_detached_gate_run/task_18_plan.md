### Task 18 — Re-render the launcher's entries into the notes-app profile, and record that re-render in the notes-app README

**Goal:** The live notes-app fixture's `.claude/settings.autonomous.json` carries what `init` now renders for the launcher's row. `examples/notes-app/README.md` records that re-render in its running account of re-renders. `.claude/context/conventions.md` → `## Documents of record` makes that profile a **live** file, re-rendered whenever a token-carrying `cli/templates/` file changes. It is not part of the frozen capture.

**Depends on:** Task 3, which changed what `init` renders. The new row `launch-sandboxed-gates.sh` (`agentInvocable: true`, `runsUnsandboxed: true`) gives the profile five things:

- its repo-relative and repo-root-absolute `Bash(…:*)` allow forms;
- an `excludedCommands` entry `bash <repoRoot>/<scriptsDir>/launch-sandboxed-gates.sh:*`;
- a `denyWrite` path for the main checkout's copy, and its `Edit` deny rule;
- the generated write-protection `_README` line naming it;
- three rewritten `_README` lines: *"THE OUTER-LOOP SCRIPTS AN AGENT RUNS"*, where the orchestrating session now runs three; *"FOUR COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING"*; and *"CREDENTIALS ARE DENIED ON BOTH SIDES"*, which gains the sentence *"The gate launcher, also excluded, keeps it too, and for the gate worker it starts it unsets every `envVars` name below and masks every `files` path below again, inside its own `bwrap` sandbox."* after *"so the excluded wrappers above keep the environment an HTTPS push needs."*.

**This is a catch-all task** (`path` `"."`). Its implementer reads every configured layer's conventions document.

### Targets

- `examples/notes-app/.claude/settings.autonomous.json`: the entries and `_README` lines above. These are the story index's register rows 69–71 and 78. No other entry changes.
- `examples/notes-app/README.md` → **The one edit the kept artifacts carry, and where it landed.**, at its running list of re-renders, which ends *"… and changed no other entry. The file now carries …"*. This is register row 72. Every earlier branch that re-rendered the fixture recorded it there.

**Work:**

- [ ] **Render the changes, never hand-compose them.**
  - Under `$TMPDIR`, outside this checkout, build a scratch git repository whose directory basename is `notes-app`, holding a copy of the fixture's `harness.config.json`.
  - Run the built CLI's `node cli/dist/cli.js init --cwd <scratch> --non-interactive` against it.
  - From the scratch profile, take every entry, and the position of every entry, that names `launch-sandboxed-gates.sh`, plus the four `_README` strings above: the write-protection line and the three rewritten lines.
  - Apply the README's three substitution clauses, longest path first: the scratch root becomes `/workspace/notes-app`, its parent becomes `/workspace`, and any operator home directory and account name become `/workspace` and `adopter`.
  - Insert each entry at the position the scratch profile gives it, and replace the four `_README` strings.
  - Remove the scratch repository in the same step.
- [ ] **Change nothing else.** No existing entry of the fixture's profile is reordered, rewritten or removed.
- [ ] **The README's record.** Immediately before *"The file now carries"*, append one sentence in the paragraph's existing form: *"A later re-render of the wrapper allow rows, the excluded commands, the write-protection entries and four `_README` lines, through the same three clauses, added the main checkout's `scripts/launch-sandboxed-gates.sh` to `allow`, `sandbox.excludedCommands`, `denyWrite`, the `Edit` deny rules and the write-protection `_README` line, took the rewritten `THE OUTER-LOOP SCRIPTS AN AGENT RUNS`, `FOUR COMMANDS RUN OUTSIDE THE SANDBOX` and `CREDENTIALS ARE DENIED ON BOTH SIDES` lines, and changed no other entry."* The frozen-capture list's *"the three wrappers under `scripts/`"* (register row 81) names `start-dev-server.sh`, `test.sh` and `typecheck.sh`, not the excluded set, and is not edited.
- [ ] **Re-measure the figures.** Run the paragraph's own six fenced `grep` commands from `examples/notes-app/` against the edited profile, and compare each output to the figure the paragraph states for it. Change a figure only where its command's output moved. Change nothing else in the README.

**Verification:**

- `jq -e . examples/notes-app/.claude/settings.autonomous.json` exits 0.
- `git diff -U0 -- examples/notes-app/.claude/settings.autonomous.json`: every added line names `launch-sandboxed-gates.sh` or is one of the four `_README` strings, and no line is removed except those four strings' old text.
- `git diff -U0 -- examples/notes-app/README.md` shows hunks only inside the **The one edit the kept artifacts carry, and where it landed.** paragraph. Re-run the six fenced commands from `examples/notes-app/`. Invariant: each output equals the figure the edited paragraph states.
- `git status --porcelain` lists no path but the two targets: the scratch repository was never inside this checkout.

**Deviations from plan:**

- `excludedCommands`: appending the launcher after `refresh-branch.sh:*`, the array's former last element, adds a trailing comma to that line, so the diff shows `-…refresh-branch.sh:*"` / `+…refresh-branch.sh:*",`. That is a JSON separator only, and the entry's value is unchanged. It is the one removed line outside the four `_README` strings.
- "Remove the scratch repository in the same step": `rm -rf /private/tmp/claude-501/t18scratch` was refused by the session's permission layer ("Permission to use Bash with command rm -rf … has been denied"). The scratch repository is still on disk under `$TMPDIR`, outside this checkout, and the Verification bullet's `git status --porcelain` invariant still holds. A plain `rm` of the merge script `harness-runs/scratch/t18_rerender.py` was refused too. It is gitignored (`.gitignore:77` `harness-runs/scratch/*`) and is not committed.
- Before rendering, `bash scripts/typecheck.sh` (`commands.typecheck`) rebuilt `cli/dist/` from the current source, so `init` rendered Task 3's row. Its result was `PASS: typecheck`.
- Render evidence: the merge script read the scratch profile from `node cli/dist/cli.js init --cwd <scratch>/notes-app --non-interactive` and applied the three clauses longest path first (scratch root `<scratch>/notes-app`, its parent, `<home>`, then `<user>`). It placed each launcher entry after its scratch predecessor, and the four `_README` strings replace the old ones. It also reported **0** other `_README` differences and **no** other array differences between the substituted scratch profile and the fixture.
- Figures re-measured with the paragraph's six fenced commands. Before (on `HEAD`'s copy): 169 / 128 / 138. After: 174 / 132 / 143 / 36 / 30 / 1. Only the first three moved.
