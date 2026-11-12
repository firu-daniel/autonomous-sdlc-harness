### 1. The live notes-app permission profile still names the `harness-docs` server its template no longer names

**File:** `examples/notes-app/.claude/settings.autonomous.json`, in the `_README` array entry that begins "THE OUTER-LOOP SCRIPTS AN AGENT RUNS ARE LISTED THE SAME WAYS". The stale text is the quoted substring "`search_docs` on the `harness-docs` server". Navigation hint: line 11.

**Problem.** This branch edits the token-carrying template `cli/templates/claude/settings.autonomous.json`. In the same `_README` entry, "`search_docs` on the `harness-docs` server" becomes "`search_docs` on the `devscene-docs` server". `.claude/context/conventions.md` → `## Documents of record` classifies `examples/notes-app/.claude/settings.autonomous.json` as **live**: it is *"re-rendered whenever a token-carrying `cli/templates/` file changes"*. That makes the re-render part of what has to land with the template change. The rendered file still names the old server, so the template and its live render disagree.

This line is also the only hit of the task prompt's Done-when grep that is not excluded or keep-listed. The task prompt makes an empty result the condition for "Done when":

```
git grep -nE 'harness[-_]docs|HARNESS_(DOCS_)?RETRIEVAL|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL|harness:harness|POSTGRES_(USER|PASSWORD): harness'
```

Every other hit sits in `harness-runs/`, in the self-adopted `scripts/` copies, or on a research-record line that the story plan's `## Scope register` keeps. The register lists this file as a `change` row (row 4, owned by Task 8).

Task 8's `## Disposition` and the architecture review's Finding 1 disposition both record the same refusal. The tool layer refused the Edit at this `.claude/` path segment ("Permission to use Edit has been denied because Claude Code is running in don't ask mode."). The file is still unchanged at the branch tip.

**Fix.** In that one `_README` sentence, replace

```
`search_docs` on the `harness-docs` server
```

with

```
`search_docs` on the `devscene-docs` server
```

Change nothing else in the file. Afterwards the entry must equal the same entry of `cli/templates/claude/settings.autonomous.json` with one substitution, `{{scriptsDir}}` rendered as `scripts`. The file must still parse as JSON.

If the Edit tool is refused at this path again, an operator applies the same replacement by hand on branch `chore_devscene_docs_retrieval`. Run this from the checkout root:

```
node -e "const f='examples/notes-app/.claude/settings.autonomous.json',fs=require('fs'),s=fs.readFileSync(f,'utf8'),o='\`search_docs\` on the \`harness-docs\` server',n='\`search_docs\` on the \`devscene-docs\` server';if(s.split(o).length!==2)throw new Error('expected exactly one match');const t=s.replace(o,n);JSON.parse(t);fs.writeFileSync(f,t)"
```

Then confirm that this prints nothing:

```
git grep -nE 'harness[-_]docs' -- examples/notes-app/.claude
```

No test file covers this JSON file, so the fix runs no test. The full suite runs later, in the Run gates phase.

- [ ] Apply the one-sentence replacement.
- [ ] Confirm the `git grep` above prints nothing.
