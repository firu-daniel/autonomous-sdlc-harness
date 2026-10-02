### Task 1 — Add `docs.retrievalBackend` to the config model and the structural check

**Goal:** Give `harness.config.json` a `docs.retrievalBackend` key that selects the docs-retrieval backend, `"typescript"` (the default, and what an absent key means) or `"python"`. It is declared in `cli/src/config/model.ts` with a predicate every consumer imports, and graded in `cli/src/config/check.ts`. Its schema property and its `docs/config.md` §5 row are Tasks 8 and 11.

**This order departs from the conventions document, deliberately.** `.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`, item 1, orders the schema **first**: `schemas/harness.config.schema.json`, then `cli/src/config/model.ts`, then `cli/src/config/check.ts`, then `docs/config.md` §5. This plan ships the model and check first because the task-plan writer's ship order is bottom-up with the catch-all `general` layer last (`plugin/agents/task-plan-writer.md` → the `## Phase 2 Readiness — Ordered Fix List` bullet), and the schema edit is a `general`-layer task (Task 8). `feat_docs_catalog_retrieval`'s Tasks 1 (`cli`) and 18 (`general`) record the same departure; they are a record of it, not its licence. **The transient window this opens:** from this task's commit until Task 8's, a configuration carrying `docs.retrievalBackend` passes `check.ts` (and `config set docs.retrievalBackend python`, which this task's own test exercises, writes one) but fails schema validation in the `npm run validate:config` style, because `properties.docs` is `"additionalProperties": false`. Item 1's header names exactly this case (*"a key in the model that is not in the schema is a key no configuration may legally carry"*). Task 8 closes the window; no task between them may commit a configuration file carrying the key.

**Where this task stops.** It reads nothing at run time and changes no behaviour. The launcher's shell reader is Task 3, `doctor`'s use is Task 5, and `init`'s note is Task 7. **No generator may write the key**: `init`'s generated config must stay byte-identical, which Task 7 asserts. So do **not** add the key to `DEFAULTS` or to any generator's output.

### Targets

- `cli/src/config/model.ts`
- `cli/src/config/check.ts`
- `cli/test/config-command.test.mjs`

**Work:**

- [ ] `model.ts`: add, beside `EXECUTION_TARGETS` and in its doc-comment style ("mirrored verbatim", "one list, imported, not restated"):
  - `export const RETRIEVAL_BACKENDS = ['typescript', 'python'] as const;`
  - `export type HarnessRetrievalBackend = (typeof RETRIEVAL_BACKENDS)[number];`
  - `export const DEFAULT_RETRIEVAL_BACKEND: HarnessRetrievalBackend = 'typescript';`, the schema's `default`.

  The doc comment names the shell mirror `hr_docs_retrieval_backend` in `cli/templates/scripts/lib/harness-run-lib.sh` (Task 3), as `FORGE_KINDS`' comment names `hr_forge`. Add `retrievalBackend?: HarnessRetrievalBackend;` to `HarnessDocs`, with the schema description condensed to one line: *"Which docs-retrieval backend the launcher starts and `doctor` grades when retrieval is on; absent means `typescript`."*
- [ ] `model.ts`: under `retrievalApplies`, which stays **unchanged**, add two exports with "declared once, import it" doc comments:
  - `retrievalBackend(config: HarnessConfig): HarnessRetrievalBackend`, which returns `config.docs?.retrievalBackend ?? DEFAULT_RETRIEVAL_BACKEND`;
  - `pythonRetrievalApplies(config: HarnessConfig): boolean`, which returns `retrievalApplies(config) && retrievalBackend(config) === 'python'`.

  Its comment states that the key is read **only inside** the `retrievalApplies` gate, and that a `python` value with retrieval off selects nothing.
- [ ] `check.ts`:
  - add `'retrievalBackend'` to `DOCS_KEYS`;
  - grade it with `checkEnum(docs, 'retrievalBackend', 'docs', RETRIEVAL_BACKENDS, <consequence>, problems)`, with `RETRIEVAL_BACKENDS` imported, not restated. The consequence sentence: the key is optional and leaving it out keeps the TypeScript backend; the launcher refuses a value outside the set rather than guessing, so the search server would not start.
  - extend the header's enum list to name `docs.retrievalBackend`.
- [ ] `check.ts`: add `checkRetrievalBackend(docs, phases, problems)`, called after `checkRetrievalPhase`. It is a **warning**, not an error, at path `docs.retrievalBackend`, issued when the key holds a legal value but `phases.docs` and `docs.retrieval` are not both `true`. Message: `docs.retrievalBackend is set but docs retrieval is off (it needs phases.docs and docs.retrieval both true), so it selects nothing until both are on`. It reports nothing for an illegal value, which `checkEnum` already reports. Its doc comment argues warning over error: the combination is harmless and the schema accepts it. Add the rule to the header's `## What it checks` paragraph.
- [ ] `config-command.test.mjs`: cases driving the compiled CLI against a throwaway fixture, beside the existing `execution.target` / `docs.retrieval` cases:
  - `config set docs.retrievalBackend python` with retrieval on is accepted and written;
  - `"java"` is refused, naming both legal values, and the tree is left byte-identical (`.claude/context/cli.md` → *"A refusal is asserted on the bytes on disk"*);
  - a non-string (`true`) is refused;
  - `python` with `phases.docs` off is written and warns with the message above.

**Verification:**

- `npm test -- test/config-command.test.mjs` from `cli/` passes.
- Grep `cli/src` for a second spelling of the enum: `git grep -n "'typescript', 'python'" -- cli/src` returns only `model.ts`.
- `retrievalApplies`'s body is unchanged: `git diff dev...HEAD -- cli/src/config/model.ts` shows no edit inside that function.
