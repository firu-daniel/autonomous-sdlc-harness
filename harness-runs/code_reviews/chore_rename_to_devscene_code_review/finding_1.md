### 1. `examples/notes-app/.mcp.json` still names the CLI `autonomous-sdlc-harness`, so the done-when search lists a hit none of its three allowances admits

**File:** `examples/notes-app/.mcp.json` (the `"_comment"` value) — "written by `autonomous-sdlc-harness init` and merged rather than overwritten"

The task prompt's done-when requires `git grep -n 'autonomous-sdlc-harness' -- . ':!harness-runs'` to return only the captured example artifacts, recorded-release fixtures and the one historical-name line in `examples/notes-app/README.md`. On the branch tip it also prints `examples/notes-app/.mcp.json:2`. That file is not part of the capture. The story index's scope register (row 130) classes it as a **live** render owned by Task 27, and `examples/notes-app/README.md` (the paragraph that says *"the shipped copy is semantically identical to `cli/templates/repo/mcp.json`"*) holds it to its template. Task 3 renamed that template, so the example now disagrees with it. The `_comment` carries the old name twice: in "written by `autonomous-sdlc-harness init`" and in "`npx autonomous-sdlc-harness doctor --check-registry` answers it beforehand".

Task 27 was meant to make this edit. Its `**Deviations from plan:**` records that the `Edit` was refused, and it moved the line into its `## Paste record` as span (4). The story index's `**Manual setup required:**` bullet, though, tells the maintainer to apply that paste record only "to `examples/notes-app/.claude/`". `.mcp.json` sits outside `.claude/`, so a maintainer who follows that bullet leaves this hit in place and merges a branch that misses its own done-when.

**Fix:** in `examples/notes-app/.mcp.json`, change only the `"_comment"` line. Replace each of its two occurrences of `autonomous-sdlc-harness` with `devscene` and leave every other byte as it is, including this copy's own `args` arrays at one element per line. After the edit that line equals line 2 of `cli/templates/repo/mcp.json` byte for byte. It begins:

```
  "_comment": "Browser wiring for the interactive test phase, written by `devscene init` and merged rather than overwritten on a re-run:
```

and ends:

```
fails at that first dispatch rather than at setup; `npx devscene doctor --check-registry` answers it beforehand.",
```

Check the result with these two commands, each run once from the checkout root:

```
git grep -n -F 'autonomous-sdlc-harness' -- examples/notes-app/.mcp.json
```

It must print nothing.

```
node -e "JSON.parse(require('fs').readFileSync('examples/notes-app/.mcp.json','utf8'))"
```

It must exit 0. This fix creates or edits no test file, so it runs no test.

- **Deviations from plan:** The edit was made by the operator by hand, per `harness-runs/clarifications/chore_rename_to_devscene/answer_3.md` Q1 option (a), because the run's unattended profile refused every agent `Edit` of this file. The implementer edited no code file and only verified the result. `git grep -n -F 'autonomous-sdlc-harness' -- examples/notes-app/.mcp.json` printed nothing. The `node -e "JSON.parse(...)"` check exited 0. Line 2 was read against line 2 of `cli/templates/repo/mcp.json` and matches it; the `args` arrays are still one element per line. `bash scripts/typecheck.sh` printed `PASS: typecheck`.
