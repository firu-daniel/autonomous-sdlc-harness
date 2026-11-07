### Task 10 — Re-render the `notes-app` example profile's `_README` line and record the re-render

**Goal:** the live `examples/notes-app/.claude/settings.autonomous.json` carries the same `_README` wording Task 6 gave the template, and the example's README records that re-render as it records every earlier one.

**Depends on:** Task 6, which changes one string in `cli/templates/claude/settings.autonomous.json`'s `_README` array — the line opening *"FOUR COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING"* — from *"in a legacy worktree run, it cannot write the linked worktree's record"* to *"in a linked worktree a person made by hand, it cannot write that worktree's record"*, the measurement citation (rows G1 and G2) unchanged. This task copies that exact change into the rendered example; it changes no entry.

**How this task's implementer reads the conventions.** Catch-all layer: read every `layers[].conventions` document. `.claude/context/conventions.md` → `## Documents of record`: `examples/notes-app/.claude/settings.autonomous.json` is a **live** file re-rendered whenever a token-carrying template changes, while the capture under `examples/notes-app/sdlc-harness/` and the prose of its `.claude/CLAUDE.md` and `.claude/context/` are frozen and are not touched.

### Targets

- `examples/notes-app/.claude/settings.autonomous.json` — the same `_README` line.
- `examples/notes-app/README.md` — the **The one edit the kept artifacts carry, and where it landed.** paragraph.

**Work:**

- [ ] `examples/notes-app/.claude/settings.autonomous.json`: replace the same phrase in the rendered `_README` line with the template's new wording, byte for byte as Task 6 wrote it (that line carries no machine path, so the README's three substitution clauses change nothing in it). Change no other byte.
- [ ] `examples/notes-app/README.md`: append one sentence to the chain of *"A later re-render of …"* sentences: a later re-render of the `FOUR COMMANDS RUN OUTSIDE THE SANDBOX` `_README` line, through the same three clauses, replaced the legacy-worktree-run clause with the hand-made linked worktree and changed no entry. Then re-run the paragraph's six measuring commands from `examples/notes-app/` and confirm every figure it states is unchanged; correct a figure only if a command now prints a different one.

**Verification:**

- `grep -o 'in a linked worktree a person made by hand[^.]*' cli/templates/claude/settings.autonomous.json examples/notes-app/.claude/settings.autonomous.json` prints the same clause for both files.
- `git diff --stat -- examples/` lists exactly the two target files.
- `grep -n 'legacy worktree run' examples/notes-app/.claude/settings.autonomous.json` finds no match.

## Disposition

- **(a) Attempted:** an `Edit` of `examples/notes-app/.claude/settings.autonomous.json`, replacing `in a legacy worktree run, it cannot write the linked worktree's record` with `in a linked worktree a person made by hand, it cannot write that worktree's record` in the `FOUR COMMANDS RUN OUTSIDE THE SANDBOX` `_README` line. The companion `examples/notes-app/README.md` sentence was written, then reverted so the README records no re-render that did not happen; `git status --short` is empty after the revert.
- **(b) Refusal, quoted (twice, identical):** `Permission to use Edit has been denied because Claude Code is running in don't ask mode.` The same `Edit` call on `examples/notes-app/README.md` (outside any `.claude/` directory) succeeded in the same session, so the refusal follows the target's `.claude/` path segment.
- **(c) Why no permission entry lifts it:** the target sits under a `.claude/` directory, which the tool layer's guard on `.claude/**` writes covers; that guard is evaluated ahead of the permission profile, and no `permissions.allow` entry grants it. Profile read: `.claude/settings.json` holds only `permissions.allow: ["Bash(bash scripts/task-offer-check.sh)"]`; there is no `.claude/settings.local.json`. The per-run profile under `~/.local/state/autonomous-sdlc-harness/run-profiles/` could not be read (Read and Bash both refused in don't-ask mode), so its contents are not reported.
- **(d) Operator remedy, one paste:** run this from the checkout root in an interactive session, then commit both files:

  ```sh
  perl -0pi -e "s/in a legacy worktree run, it cannot write the linked worktree's record/in a linked worktree a person made by hand, it cannot write that worktree's record/" examples/notes-app/.claude/settings.autonomous.json
  perl -0pi -e 's/(`CREDENTIALS ARE DENIED ON BOTH SIDES` lines, and changed no other entry\.) The file now carries 174/$1 A later re-render of the `FOUR COMMANDS RUN OUTSIDE THE SANDBOX` `_README` line, through the same three clauses, replaced the legacy-worktree-run clause with the hand-made linked worktree and changed no entry. The file now carries 174/' examples/notes-app/README.md
  ```

  Then run the README's six measuring commands from `examples/notes-app/` (the edited phrase holds no `/workspace` path, so every figure should be unchanged) and this file's three `**Verification:**` commands.
