### 3. `schemas/negative/README.md` still describes four `flow-graph-schema-*` negatives; the new `flow-graph-schema-round-without-gates.json` is unlisted

**File:** `schemas/negative/README.md` — "has its own negatives here: the four `flow-graph-schema-*` documents"

This branch adds `schemas/negative/flow-graph-schema-round-without-gates.json` and wires it into `package.json` → `validate:flow-graph:negative`. `schemas/negative/` now holds five `flow-graph-schema-*` documents. The README paragraph still says "the four", and its list of what each one changes names only `unknown-binding`, `unknown-outcome`, `skip-construct-mixed` and `ask-without-resume`. The new fixture's one change is that its `plan_round` round node carries no `gates` key, which the format-2 schema's `roundNode` → `required` rejects. A reader of the README cannot tell what that fixture proves.

The story index records this item as a planning-round Should Fix deferred to issue #254 (`## Rejected findings` → "Task-plan review 1, Should Fix 1"). It is still stale in the branch as shipped. The fix is two words and one clause, and the file is this branch's own new unit's README entry.

**Fix:** in that paragraph, change `the four \`flow-graph-schema-*\` documents` to `the five \`flow-graph-schema-*\` documents`. Then change the end of the per-fixture list from

```
and `flow-graph-schema-ask-without-resume.json` an `<ask>` edge with no `resume`.
```

to

```
`flow-graph-schema-ask-without-resume.json` an `<ask>` edge with no `resume`, and `flow-graph-schema-round-without-gates.json` a `round` node carrying no `gates`.
```

Leave the sentences after it unchanged. They still hold: the new fixture is wired into `npm run validate:flow-graph:negative` and carries no `$schema` key. This is a prose-only fix and runs no test.
