### 1. Re-render the notes-app permission profile's `harness-docs` sentence to match its template

**Site:** `examples/notes-app/.claude/settings.autonomous.json`, in the `_README` array entry that begins "THE OUTER-LOOP SCRIPTS AN AGENT RUNS ARE LISTED THE SAME WAYS". The stale text is the quoted substring "`search_docs` on the `harness-docs` server". Navigation hint: line 11.

**Problem.** This branch changes the token-carrying template `cli/templates/claude/settings.autonomous.json`. In the same `_README` entry, "`search_docs` on the `harness-docs` server" becomes "`search_docs` on the `devscene-docs` server". `.claude/context/conventions.md` → `## Documents of record` classifies `examples/notes-app/.claude/settings.autonomous.json` as **live**: it is *"re-rendered whenever a token-carrying `cli/templates/` file changes"*. That re-render is therefore part of the set that has to land with the template change. The branch did not land it. The rendered file still names the old server, so the template and its live render now disagree.

This file is also the one remaining hit of the task prompt's Done-when grep outside the keep-listed research lines. The story plan's own `## Scope register` lists it as a `change` row (row 4, owned by Task 8). Task 8's `## Disposition` records why it did not happen: the tool layer refused the Edit under the `.claude/` path segment. That explains the gap, but the rule still holds and the file is still unchanged.

**Fix.** In that one `_README` sentence of `examples/notes-app/.claude/settings.autonomous.json`, replace "`search_docs` on the `harness-docs` server" with "`search_docs` on the `devscene-docs` server". Change nothing else in the file.

Afterwards, the entry must equal the same entry of `cli/templates/claude/settings.autonomous.json` with one substitution: `{{scriptsDir}}` rendered as `scripts`. The file must also still parse as JSON.

The edit sits under a `.claude/` path segment, which the run's tool layer refused once already. If the implementer's Edit is refused again, an operator has to apply this edit by hand on the branch. Task 8's `## Disposition` item (d) records the exact one-line command.

- [ ] Apply the one-sentence replacement.
- [ ] Confirm `git grep -nE 'harness[-_]docs' -- examples/notes-app/.claude` prints nothing.

## Disposition

- **(a) Attempted:** the one-sentence replacement of "`search_docs` on the `harness-docs` server" with "`search_docs` on the `devscene-docs` server" in the `_README` entry beginning "THE OUTER-LOOP SCRIPTS AN AGENT RUNS ARE LISTED THE SAME WAYS" of `examples/notes-app/.claude/settings.autonomous.json`, through the Edit tool. The file is unchanged; no other file was edited.
- **(b) Refusal, quoted (two identical attempts, same edit):** "Permission to use Edit has been denied because Claude Code is running in don't ask mode."
- **(c) Why no permission entry lifts it:** the run's profile (`~/.local/state/devscene/run-profiles/users-daniel-work-devscene/chore_devscene_docs_retrieval.json`, read this session) already holds `Edit(//<home>/Work/devscene-*/**)` in `allow`, and none of its `Edit(...)` `deny` rules names `examples/notes-app/` or a `.claude/settings.autonomous.json` under this run copy — the only `settings.autonomous.json` deny is the main checkout's own. The checkout's `.claude/settings.json` holds no Edit entry. A call the profile allows and does not deny was still refused, at a path under a `.claude/` segment: the tool layer's guard on `.claude/**` writes, evaluated ahead of the permission profile. Same refusal as `task_8_plan.md` → `## Disposition`.
- **(d) Operator remedy, one paste, from the checkout root on branch `chore_devscene_docs_retrieval` (portable, no `sed -i` dialect):**
  `node -e "const f='examples/notes-app/.claude/settings.autonomous.json',fs=require('fs'),s=fs.readFileSync(f,'utf8'),o='\`search_docs\` on the \`harness-docs\` server',n='\`search_docs\` on the \`devscene-docs\` server';if(s.split(o).length!==2)throw new Error('expected exactly one match');const t=s.replace(o,n);JSON.parse(t);fs.writeFileSync(f,t)" ; git grep -nE 'harness[-_]docs' -- examples/notes-app/.claude`
  The `git grep` must print nothing. Afterwards the entry equals the same entry of `cli/templates/claude/settings.autonomous.json` with `{{scriptsDir}}` rendered as `scripts`.
