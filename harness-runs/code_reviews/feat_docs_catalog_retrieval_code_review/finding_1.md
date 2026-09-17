### 1. `DocStore.lexicalSearch` states a filtering contract the branch's own measurement disproves

**File:** `cli/src/retrieval/store.ts` (`DocStore`) — "/** Only chunks matching a query term, best first. */", and (`openPgliteStore` → `lexicalSearch`) — "// pg_textsearch scores lower-is-better and returns only rows matching a term."

Both comments state that the BM25 arm returns only rows that match a query term. `docs/retrieval.md` → `## Measured, and how`, item (b), records the re-measurement this branch made and reaches the opposite conclusion: *"the \"only matching rows\" behaviour belongs to the BM25 index scan, not to the operator"* — on a three-row table the planner chose `Seq Scan on chunks` and the same `ORDER BY … LIMIT` returned all three rows, the match at `-1.89` and the two non-matches at `0`. The same document carries it as an open question under `## Still open`: *"Whether the lexical arm filters to matching chunks on every index."*

So the interface's stated contract is false on exactly the corpus sizes an adopter's docs catalog is most likely to have, and `cli/src/retrieval/search.ts` → `searchDocs` consumes `lexicalSearch` as if it held: every returned row gets a reciprocal-rank-fusion term, so on a small index every chunk enters fusion, and `--mode lexical` returns non-matching chunks as results with no abstention to stop them (only `fused-rerank` abstains, by that module's own rule). The default `fused-rerank` mode still abstains on a low reranker score, which is why this is graded here rather than higher.

This finding is the **comment** half only: the two statements must say what was measured, so the next change to `search.ts` does not rest on a guarantee the store does not give. Whether to add a score filter is the eval branch's to settle and is already recorded as open — do not add one here.

**Fix:** replace the interface comment on `DocStore.lexicalSearch`:

```ts
  /**
   * The best-scoring chunks for the query, lower-is-better score first, up to `limit`.
   * **Not necessarily only matching chunks:** the filter to matching rows belongs to the BM25 index
   * scan rather than to the `<@>` operator, so a plan that falls back to a sequential scan — which a
   * small corpus does — returns non-matching rows at score `0` after the matches. Measured in
   * `docs/retrieval.md` → `## Measured, and how`, item (b), and open under `## Still open`.
   */
  lexicalSearch(query: string, limit: number): Promise<readonly RankedId[]>;
```

and the inline comment inside `lexicalSearch`:

```ts
      // pg_textsearch scores lower-is-better; a non-matching row scores 0, so matches sort first.
      // Filtering to matching rows alone is the index scan's behaviour, not the operator's — see the
      // interface comment above.
```

No other line of the module changes, and no test changes: `cli/test/docs-retrieval.test.mjs`'s existing search cases stay green because behaviour is untouched.
