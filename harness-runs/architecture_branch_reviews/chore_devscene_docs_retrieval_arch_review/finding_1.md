### 1. Re-render the notes-app permission profile's `harness-docs` sentence to match its template

**Site:** `examples/notes-app/.claude/settings.autonomous.json`, in the `_README` array entry that begins "THE OUTER-LOOP SCRIPTS AN AGENT RUNS ARE LISTED THE SAME WAYS". The stale text is the quoted substring "`search_docs` on the `harness-docs` server". Navigation hint: line 11.

**Problem.** This branch changes the token-carrying template `cli/templates/claude/settings.autonomous.json`. In the same `_README` entry, "`search_docs` on the `harness-docs` server" becomes "`search_docs` on the `devscene-docs` server". `.claude/context/conventions.md` → `## Documents of record` classifies `examples/notes-app/.claude/settings.autonomous.json` as **live**: it is *"re-rendered whenever a token-carrying `cli/templates/` file changes"*. That re-render is therefore part of the set that has to land with the template change. The branch did not land it. The rendered file still names the old server, so the template and its live render now disagree.

This file is also the one remaining hit of the task prompt's Done-when grep outside the keep-listed research lines. The story plan's own `## Scope register` lists it as a `change` row (row 4, owned by Task 8). Task 8's `## Disposition` records why it did not happen: the tool layer refused the Edit under the `.claude/` path segment. That explains the gap, but the rule still holds and the file is still unchanged.

**Fix.** In that one `_README` sentence of `examples/notes-app/.claude/settings.autonomous.json`, replace "`search_docs` on the `harness-docs` server" with "`search_docs` on the `devscene-docs` server". Change nothing else in the file.

Afterwards, the entry must equal the same entry of `cli/templates/claude/settings.autonomous.json` with one substitution: `{{scriptsDir}}` rendered as `scripts`. The file must also still parse as JSON.

The edit sits under a `.claude/` path segment, which the run's tool layer refused once already. If the implementer's Edit is refused again, an operator has to apply this edit by hand on the branch. Task 8's `## Disposition` item (d) records the exact one-line command.

- [ ] Apply the one-sentence replacement.
- [ ] Confirm `git grep -nE 'harness[-_]docs' -- examples/notes-app/.claude` prints nothing.
