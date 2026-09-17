### 7. Five new retrieval symbols are exported with no reader outside their own module

**File:** `cli/src/retrieval/models.ts` (`loadModels`, `EMBEDDING_QUERY_PREFIX`, `MODEL_VERSION`), `cli/src/retrieval/search.ts` (`SNIPPET_CHARS`), `cli/src/retrieval/chunk.ts` (`headingSlug`)

The whole-branch caller sweep over every `layers[].path` — `cli`, `plugin` and the repository root — finds each of these five named only inside the file that declares it (plus, for none of them, a test or a template). Every one is genuinely used *within* its module: `loadModels` by `fetchModels` and `resolveModels`, `EMBEDDING_QUERY_PREFIX` and `MODEL_VERSION` by `loadModels`, `SNIPPET_CHARS` by `snippetOf`, `headingSlug` by `chunkMarkdown`. So nothing here is dead code — what is unused is the `export` keyword, which widens five module surfaces the area's other declarations keep narrow (`EMBEDDING_DIMENSIONS`, `MODEL_DTYPE`, `EMBED_BATCH_SIZE`, `DIMENSIONS_META_KEY` and the three specifier constants are all module-private for exactly this reason).

`ABSTAIN_MESSAGE` is deliberately left out of this list: Finding 2 gives it a reader in `cli/src/retrieval/server.ts`, and it stays exported.

**Fix:** drop `export` from the five declarations, leaving the doc comment and the body of each untouched.

- [ ] `cli/src/retrieval/models.ts`: `async function loadModels(`, `const EMBEDDING_QUERY_PREFIX =`, `const MODEL_VERSION =`
- [ ] `cli/src/retrieval/search.ts`: `const SNIPPET_CHARS =`
- [ ] `cli/src/retrieval/chunk.ts`: `function headingSlug(`

`{@link}` references to a module-private symbol from inside the same file stay valid, so the headers of `models.ts` and `search.ts` — both of which link `loadModels` and `SNIPPET_CHARS` — need no edit. `noUnusedLocals` is satisfied because each is still called. `docs/retrieval.md` names none of the five, so no document changes; run `bash scripts/typecheck.sh` to confirm nothing outside these modules referenced them.
