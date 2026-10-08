### 7. `compareAbstention` reports a no-candidates abstention as inconsistent with the threshold

**File:** `evals/docs-retrieval/backend-comparison.mjs` (`compareAbstention`) — "entry.abstained !== (entry.bestRerankScore !== null && entry.bestRerankScore < threshold)"

**Problem.** Both backends abstain in `fused-rerank` in two cases. One is a best rerank score below the threshold. The other is no candidates at all, which returns `abstained: true` with `bestRerankScore: null`. See `cli/src/retrieval/search.ts` (`if (candidates.length === 0) return { abstained: true, hits: [], bestRerankScore: null };`) and `docs-retrieval-service/src/harness_docs_retrieval/search.py` (`if not candidates:`). The consistency predicate treats a `null` score as "should not abstain". So a legitimate no-candidates abstention would be listed under *"Entries whose abstention disagrees with the recorded threshold"*. A reader would then go looking for a threshold drift that does not exist. On the committed corpora, the vector arm always returns candidates, so the recorded comparison is unaffected. The predicate is still wrong for the rule both backends implement.

**Fix.** In `compareAbstention`, replace the filter predicate with:

```js
(entry) => entry.abstained !== (entry.bestRerankScore === null || entry.bestRerankScore < threshold),
```

In `fused-rerank` a non-abstaining result always carries a numeric `bestRerankScore`, so `null` now means "abstained on no candidates" on both sides. No test file covers this module, so no test runs.
