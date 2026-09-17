### Task 1 — Add `docs.retrieval` to the config model and the structural check

**Goal:** Give `harness.config.json` a boolean `docs.retrieval` (default `false`) that is legal only when `phases.docs` is `true`. Add one predicate, `retrievalApplies(config)`, which every later retrieval consumer reads instead of re-spelling the question.

**Where this task stops.** This task owns the in-memory model and the hand-written check. The **schema** property and its cross-field clause are Task 18's, since `schemas/` belongs to the `general` layer. `docs/config.md` §5's row is Task 19's. Those are the other two places of the "one contract in four places" rule (`.claude/context/conventions.md` → `### The order files are created…`, item 1). Task 18 adds this clause to the schema, verbatim:

```json
"allOf": [
  {
    "if": { "required": ["docs"], "properties": { "docs": { "required": ["retrieval"], "properties": { "retrieval": { "const": true } } } } },
    "then": { "required": ["phases"], "properties": { "phases": { "required": ["docs"], "properties": { "docs": { "const": true } } } } }
  }
]
```

This task's check must reject exactly what that clause rejects, and nothing else. `docs.retrieval: true` with `phases` absent, `phases.docs` absent or `phases.docs: false` is an error. `docs.retrieval: false`, or an absent key, is legal in every phase state.

### Targets

- `cli/src/config/model.ts` — `HarnessDocs.retrieval`, the `retrievalApplies` predicate.
- `cli/src/config/check.ts` — `DOCS_KEYS`, the boolean type check, the cross-field error, the header's "What it checks" paragraph.
- `cli/test/config-command.test.mjs` — the refusal and acceptance cases.

**Work:**

- [ ] `model.ts`: add `retrieval?: boolean` to `HarnessDocs`, with the schema's description condensed to one line: *"Turn on the local docs-retrieval search tool over `docs.root` and the conventions documents; legal only while `phases.docs` is true."* Leave `DEFAULTS` alone: the schema default `false` equals absence, and `DEFAULTS.phases`'s shape is not extended with a `docs` section.
- [ ] `model.ts`: export `retrievalApplies(config: HarnessConfig): boolean`, returning `config.phases?.docs === true && config.docs?.retrieval === true`. Its doc comment follows `browserWiringApplies`'s pattern. It is declared once because the `.mcp.json` generator, the permission-profile generator, the ignore-block generator, `init`'s setup step, the `docs` verbs and `doctor` all gate on it (Tasks 6, 10, 12, 13). A copy in one of them that drifted would register a server the profile never starts.
- [ ] `check.ts`: add `'retrieval'` to `DOCS_KEYS`, keeping `root` string-checked. Type-check `retrieval` with `checkBoolean(docs, 'retrieval', 'docs', problems)`. Add an **error**, not a warning, at path `docs.retrieval` when it is `true` and `phases.docs !== true`, with this message: `docs.retrieval is true but phases.docs is not: retrieval searches the documentation corpus the docs phase maintains, so it is legal only with that phase on. Set phases.docs true, or set docs.retrieval false`. Put the cross-field arm beside `checkPhaseSections`, not inside it, because that function's header limits it to warnings about an armed phase with an unfilled section. Extend the header's `## What it checks` paragraph by one clause naming this constraint and the schema's `allOf` clause it mirrors.
- [ ] `config-command.test.mjs`: add cases through the compiled CLI against a throwaway fixture. (a) `config set docs.retrieval true` on a config with `phases.docs` false is refused, and the file stays byte-identical with no `.bak` (the refusal is asserted on the bytes on disk, `.claude/context/cli.md` → `## What "done" means here`). (b) With `phases.docs` true, the same `set` succeeds and the file holds the boolean `true`. (c) `config set phases.docs false` on a file holding `docs.retrieval: true` is refused with the same message. Open with the rule the cases enforce, in the file's existing header style.

**Verification:**

- `bash scripts/typecheck.sh` and `bash scripts/test.sh` exit zero, run without a pipe.
- The three new cases pass. Case (c) is the one that shows the check is cross-field rather than a guard on the `set` path alone.
- `grep -rn "phases?.docs === true && " cli/src` reports only `retrievalApplies`. Later tasks must import the predicate.

**Deviations from plan:** `bash scripts/test.sh` exits 1, not 0: its sole failing gate is `6a no machine paths`, whose hits are this worktree's untracked `.git` pointer file and `harness-runs/improvement_observations/feat_readme_summary_compact_llms_txt.md` — neither touched by this task. Gate 4 (`npm test`) passed, and `node --test test/config-command.test.mjs` ran 29 passed, 0 failed, including the three new cases.
