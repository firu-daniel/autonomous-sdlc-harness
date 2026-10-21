### 1. `END_STATE_STATEMENTS` is a new export with no call site outside its defining file

**File:** `cli/src/retrieval/store.ts` (`END_STATE_STATEMENTS`): "export const END_STATE_STATEMENTS: readonly string[] = Object.freeze([`REINDEX INDEX ${BM25_INDEX}`]);"

Task 7 adds five exports to `store.ts`. Four of them have consumers outside the file: `LEXICAL_SEARCH_STATEMENT` (`cli/test/docs-retrieval-store.test.mjs`, `evals/docs-retrieval/bm25-history.mjs`) and the three `INDEX_STATE_*` constants (`cli/src/retrieval/refresh.ts`, `cli/test/docs-retrieval-refresh-end-state.test.mjs`). `END_STATE_STATEMENTS` has none. `git grep -n END_STATE_STATEMENTS -- cli evals scripts` returns only `store.ts` itself (the header's spliced-token clause, the `rebuildIndexes` doc comment, the declaration, and the `for … of END_STATE_STATEMENTS` loop inside `rebuildIndexes`), plus prose mentions in two comment headers. No module and no test imports it. The reference in `cli/test/docs-retrieval-refresh-end-state.test.mjs` issues its own raw `REINDEX INDEX ${BM25_INDEX}`, which is right for an independent oracle. The refresh-rule eval issues `bm25-history.mjs`'s `STATEMENTS.reindex`.

The behaviour is wired, through `DocStore.rebuildIndexes()`. What is dead is the public surface: an exported list that nothing composes from. Its existence suggests a second issuer that does not exist. A later change that adds a statement to it (the vector-index proposal Task 5 recorded, for instance) would look like it reaches every consumer, when the only consumer is the loop beside it. The header's paragraph on exported shapes names a caller-composes rationale for every other exported shape, and gives none for this one.

**Fix:** drop the `export` keyword and keep the constant and its doc comment as they are:

```ts
/**
 * The statements that bring every index to the state a rebuild over the stored rows leaves, issued in
 * order by {@link DocStore.rebuildIndexes}. No vector-index statement is among them.
 */
const END_STATE_STATEMENTS: readonly string[] = Object.freeze([`REINDEX INDEX ${BM25_INDEX}`]);
```

Change nothing else. The `{@link END_STATE_STATEMENTS}` references in the module header and in the `rebuildIndexes` doc comment still resolve inside the file. The documents that name it (`docs/retrieval.md`, `docs/retrieval-eval.md`, `docs/retrieval-eval-results.md`, `docs-retrieval-service/README.md`, and the two test and eval headers) cite it as a symbol in `cli/src/retrieval/store.ts`, and that citation still resolves. `rebuildIndexes` stays the one entry point. Verify with `bash scripts/typecheck.sh`. The fix creates and edits no test file, so it runs no test.
