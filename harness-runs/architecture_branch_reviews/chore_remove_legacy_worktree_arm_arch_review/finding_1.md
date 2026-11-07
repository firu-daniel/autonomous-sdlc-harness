### 1. The notes-app example's rendered profile was not re-rendered with the token-carrying template it is rendered from

**Site anchor:** `examples/notes-app/.claude/settings.autonomous.json` → the `_README` line beginning `"FOUR COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING:`, at the clause `in a legacy worktree run, it cannot write the linked worktree's record`. Its source is `cli/templates/claude/settings.autonomous.json` → the same `_README` line, which this branch changed.

**Problem.** This branch changes `cli/templates/claude/settings.autonomous.json`, a token-carrying template (the changed line itself carries `{{scriptsDirAbs}}`). On the branch, that template's `FOUR COMMANDS RUN OUTSIDE THE SANDBOX` line says `in a linked worktree a person made by hand, it cannot write that worktree's record`. The example's render of the same line still says `in a legacy worktree run, it cannot write the linked worktree's record`. `git diff <diff_base>...HEAD --stat` lists no file under `examples/`.

`.claude/context/conventions.md` → `## Documents of record`, the `examples/notes-app/` bullet, makes this render a live file: *"every other file `init` rendered into it (`.claude/settings.autonomous.json` among them, re-rendered whenever a token-carrying `cli/templates/` file changes), are **live** and are maintained."* So the re-render belongs with this change. The branch's own scope register agrees: its row 2 marks this site `change`, owned by Task 10.

Task 10 was dispositioned rather than done. Its `## Disposition` records a tool-layer refusal of the `Edit` under the `.claude/` path segment (`Permission to use Edit has been denied because Claude Code is running in don't ask mode.`). The refusal is real, but it does not license the deviation. The rule has no carve-out, and the disposition itself hands the work to an operator rather than claiming the render may stay stale. Until it is applied, the example ships a profile line that describes the worktree run arm this branch removes. That contradicts both the template it claims to be rendered from and the `## Done when` predicate *"The documents above no longer describe a worktree arm that ships."*

**Fix.** Re-render the one clause, and record the re-render in the example's README. This requires a session whose tool layer permits writes under `examples/notes-app/.claude/` (an interactive session, per the Task 10 disposition). From the checkout root:

```sh
perl -0pi -e "s/in a legacy worktree run, it cannot write the linked worktree's record/in a linked worktree a person made by hand, it cannot write that worktree's record/" examples/notes-app/.claude/settings.autonomous.json
```

```sh
perl -0pi -e 's/(`CREDENTIALS ARE DENIED ON BOTH SIDES` lines, and changed no other entry\.) The file now carries 174/$1 A later re-render of the `FOUR COMMANDS RUN OUTSIDE THE SANDBOX` `_README` line, through the same three clauses, replaced the legacy-worktree-run clause with the hand-made linked worktree and changed no entry. The file now carries 174/' examples/notes-app/README.md
```

Then confirm the result:

- `grep -o 'in a linked worktree a person made by hand[^.]*' cli/templates/claude/settings.autonomous.json examples/notes-app/.claude/settings.autonomous.json` prints the same clause for both files.
- `grep -n 'legacy worktree run' examples/notes-app/.claude/settings.autonomous.json` finds no match.

Commit both files: `examples/notes-app/.claude/settings.autonomous.json` and `examples/notes-app/README.md`.
