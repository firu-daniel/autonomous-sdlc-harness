### Task 5 — Re-render the notes-app profile's `run-analytics.sh` entries and #224's three `_README` lines, and update its README record

**Goal:** Bring the live fixture `examples/notes-app/.claude/settings.autonomous.json` back in line with what `init` renders now. That means two things:
- **Run analytics.** Add the write protection `init` now generates for the main checkout's `scripts/run-analytics.sh`:
  - a `sandbox.filesystem.denyWrite` path;
  - an `Edit(//…/scripts/run-analytics.sh)` deny rule;
  - the `_README` segment *"…/scripts/run-analytics.sh - the run watcher, the remote job or a person runs the main checkout's run-analytics.sh outside the sandbox;"*.
- **#224's three `_README` lines.** Take the three lines #224 rewrote:
  - the write-protection line (*"WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN FROM INSIDE IT: …"*, from `cli/src/generators/writeProtection.ts` → `applyWriteProtection`);
  - *"THREE COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING: …"*;
  - *"TWO RESIDUALS, STATED RATHER THAN HIDDEN: …"*, both from `cli/templates/claude/settings.autonomous.json`.

Then record the re-render, and the new counts and description, in `examples/notes-app/README.md`.

**Depends on:** nothing on this branch. No earlier task changes a generator or a `cli/templates/` file that the profile render reads. It is last because the catch-all tasks ship last.

**How this task's implementer reads the conventions.** This is the catch-all layer, so read every configured layer's conventions document. `.claude/context/conventions.md` → `## Documents of record` decides this task:
- The fixture's `.claude/settings.autonomous.json` is **live** and is re-rendered whenever a token-carrying template changes.
- Its `.claude/CLAUDE.md`, its `.claude/context/` documents and its `sdlc-harness/` artifacts are a **frozen capture** and are not touched.

### Targets

- `examples/notes-app/.claude/settings.autonomous.json`
- `examples/notes-app/README.md` → the paragraph *"The one edit the kept artifacts carry, and where it landed."*: its chain of *"A later re-render …"* sentences, the *"The file now carries …"* figures, and the *"Every occurrence was substituted, **prose included** — the four `_README` sentences that quote a path …"* description

**Work:**

- [ ] **Render.** Build the CLI (`npm run build`).
  - Extract a `git archive HEAD:examples/notes-app` copy into a directory named `notes-app` under the system temp directory. Never put it inside this checkout. Make it a git repository.
  - Run `node <root>/cli/dist/cli.js init --non-interactive --no-analyze --force --quiet --cwd <that directory>`, where `<root>` comes from a bare `git rev-parse --show-toplevel`.
  - Pass the rendered `.claude/settings.autonomous.json` through the README's three substitution clauses, longest path first:
    1. the scratch root becomes `/workspace/notes-app`;
    2. its parent becomes `/workspace`;
    3. any home directory becomes `/workspace` and any account name becomes `adopter`.
  - Run any comparison script through `bash scripts/scratch-run.sh`.
- [ ] **Compare and take.** Compare the substituted render with the fixture, entry by entry and `_README` line by line. Take into the fixture exactly:
  - the `run-analytics.sh` `denyWrite` path;
  - its `Edit` deny rule;
  - the rendered write-protection `_README` line, which carries both the `run-analytics.sh` segment and #224's rewrite;
  - the rendered `THREE COMMANDS RUN OUTSIDE THE SANDBOX` line;
  - the rendered `TWO RESIDUALS` line.

  Put each where the render puts it, keeping the fixture's existing order and formatting. **Any other difference is reported, not taken.** List each one, with its key or `_README` line and both values, in this file's `Deviations from plan`.
- [ ] **README.** In the paragraph's chain, append one sentence after the *"…`scripts/task-offer-check.sh` … and changed no other entry."* sentence. It records that a later re-render, through the same three clauses:
  - added the main checkout's `scripts/run-analytics.sh` to `denyWrite`, to the `Edit` deny rules and to the write-protection `_README` line;
  - took the rewritten *"THREE COMMANDS RUN OUTSIDE THE SANDBOX"* and *"TWO RESIDUALS"* lines and the write-protection line's rewrite;
  - changed no other entry.

  Then re-run the paragraph's six measurement commands from `examples/notes-app/` and replace each figure in *"The file now carries … one bare `/workspace`"* with its new output. Re-check the *"four `_README` sentences that quote a path"* description against the edited file, and correct the count or the list if they changed.
- [ ] **Grade on disk.** After each write, judge the outcome by what reached the disk (`git diff -- examples/notes-app`), never by the tool call's exit. If the `.claude/**` guard refuses the fixture write, as it refused #212 twice in `dontAsk` mode:
  - leave **both** files unedited, so the README never records an edit that did not land;
  - append a `## Disposition` section to this file recording (a) the attempt, (b) the refusal quoted, (c) why no permission entry lifts it, and (d) a **one-paste operator remedy** run from the checkout root. The remedy applies the fixture edits and the README sentence and figures as literal strings, asserts each anchor occurs exactly once, and ends with `git diff --stat -- examples/notes-app` and `jq -e . examples/notes-app/.claude/settings.autonomous.json`. It follows the shape of #212's remedy (`harness-runs/task_plans/fix_linux_sandbox_deny_placeholders/task_10_plan.md` on commit `1a41540c`).

**Verification:**

- `git diff --stat -- examples/notes-app` lists exactly `.claude/settings.autonomous.json` and `README.md`, or nothing at all on the refused path, with the `## Disposition` remedy recorded instead.
- `git diff -U0 -- examples/notes-app/.claude/settings.autonomous.json` shows only the two `run-analytics.sh` entries and the three named `_README` lines.
- `jq -e . examples/notes-app/.claude/settings.autonomous.json` exits 0.
- `grep -nE '/Users/|/home/|/private/|/tmp/|/var/folders/' examples/notes-app/.claude/settings.autonomous.json` finds nothing.
- Each of the README's six measurement commands, re-run from `examples/notes-app/`, prints the figure the README now states.
- `git diff --stat` lists no file under `examples/notes-app/.claude/context/`, `examples/notes-app/.claude/CLAUDE.md` or `examples/notes-app/sdlc-harness/`.
