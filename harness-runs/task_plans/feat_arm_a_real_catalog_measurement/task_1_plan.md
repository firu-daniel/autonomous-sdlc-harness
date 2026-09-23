### Task 1 — Give `SearchResult` the uncensored top reranker score, `bestRerankScore`, without changing any rendered answer

**Goal:** Make the score the abstention threshold is actually tested against observable on every `fused-rerank` search, including the ones that abstain, as a new field of the library's `SearchResult` — so the eval can calibrate on observed negatives instead of the `null` an abstention records today — while `docs search`, the MCP server's answer and the query log stay byte-for-byte what they are.

**Where this layer stops.** This task adds the field to the library and proves it; it records nothing and renders nothing. Reading the field into the eval's per-query records is **Task 5's** (`evals/docs-retrieval/arms.mjs`, `metrics.mjs`), and nothing under `evals/` is edited here. The threshold constant's value is **Task 22's**; this task does not touch `ABSTAIN_SCORE_THRESHOLD` or its doc comment.

**The contract this task produces, which Task 5 consumes verbatim:**

```ts
export interface SearchResult {
  readonly abstained: boolean;
  readonly hits: readonly SearchHit[];
  /** The top reranker score `fused-rerank` compared against ABSTAIN_SCORE_THRESHOLD; null in every other mode, and when there were no candidates to rerank. */
  readonly bestRerankScore: number | null;
}
```

- `fused-rerank`, no candidates → `{ abstained: true, hits: [], bestRerankScore: null }` (the reranker never ran, so there is no score to observe).
- `fused-rerank`, `best < ABSTAIN_SCORE_THRESHOLD` → `{ abstained: true, hits: [], bestRerankScore: best }`.
- `fused-rerank`, otherwise → `{ abstained: false, hits, bestRerankScore: best }`, where `best === hits[0].score`.
- `lexical`, `vector`, `fused` → `bestRerankScore: null` (their scores are rank-derived fusion values, not the reranker's — the task prompt's `## Establish, do not assume` requires the field to be *"that same number, not a fusion score or a post-normalisation one"*).

`best` is the **existing local** in `searchDocs` — `reranked[0]?.score ?? 0`, the value the `if (best < ABSTAIN_SCORE_THRESHOLD)` line reads — assigned to the field unchanged. No second computation of it.

### Targets

- `cli/src/retrieval/search.ts` — the interface field, the four return sites of `searchDocs`, and the module header / `searchDocs` doc comment.
- `cli/test/docs-retrieval-rerank-score.test.mjs` (new) — the accompanying suite.

**Work:**

- [ ] `search.ts`: add `bestRerankScore` to `SearchResult` as specified above and set it at every return of `searchDocs`. Extend the `searchDocs` doc comment by one sentence saying what the field is and that no renderer reads it; extend the module header's rule paragraph by one sentence: *the score abstention tests is reported on the result whether or not it abstained, so the calibration can observe the distribution it cuts*. `renderResults` is **not edited** — it reads `abstained` and `hits` only.
- [ ] Confirm by reading, and leave untouched, the three consumers: `cli/src/commands/docs.ts` prints `renderResults(result)`; `cli/src/retrieval/server.ts` sends `renderResults(result)` and logs `bestScore: result.hits[0]?.score ?? null` with `abstained`; `cli/src/retrieval/queryLog.ts` declares the record fields. None of the three may change — the task prompt's item 3 makes *"that the shipped `docs search` output and the MCP server's answer do not change"* a fixed constraint.
- [ ] `docs-retrieval-rerank-score.test.mjs`: a header stating the rule it enforces (*the uncensored score is the one abstention compares, it is present on an abstention, it is absent outside `fused-rerank`, and it changes no rendering*). Open an in-memory store the way `cli/test/docs-retrieval-store.test.mjs` does (`openPgliteStore({ dataDir: undefined, dimensions })`, `upsertChunks` with locally generated vectors — read `cli/src/retrieval/store.ts` and that suite for the shapes), and hand `searchDocs` a plain embedder object and a plain reranker object whose `score` returns fixed numbers — constructor-style substitutes, no mocking framework (`.claude/context/conventions.md` → `## The testing bar`). Import from `cli/dist/retrieval/search.js`, never `src`.
- [ ] Cases: **(a)** a reranker whose highest score is below `ABSTAIN_SCORE_THRESHOLD` (import the constant; derive the fixed score from it, e.g. half of it, never a literal `0.32`) → `abstained: true`, `hits: []`, `bestRerankScore` equal to that highest score; **(b)** a reranker scoring above it → `bestRerankScore === hits[0].score`; **(c)** each of `lexical`, `vector`, `fused` → `bestRerankScore === null`; **(d)** an empty store in `fused-rerank` → `abstained: true`, `bestRerankScore === null`; **(e)** `renderResults` of each result above equals `renderResults` of the same object with `bestRerankScore` removed.

**Verification:**

- `bash scripts/typecheck.sh` exits 0, and `bash scripts/test.sh` prints no failure that was not already failing before this task — both run without a pipe. The known pre-existing failure is gate `6a no machine paths`, red in this self-adopted checkout by design (`docs/development.md` §5 → **"The `$HOME` half is a different matter, and self-adoption breaches it."**); it is not this task's to fix. The new suite's five cases pass and every existing `cli/test/docs-retrieval.test.mjs` case — the CLI's `docs search` output, the abstention cases under `stub-overlap`, and the MCP `serve` cases including the query log's record key set — passes unchanged.
- `git diff --stat` for this task lists `cli/src/retrieval/search.ts` and the new test file only: `docs.ts`, `server.ts` and `queryLog.ts` are untouched.
- Mutation check, reverted before the verification above: set the abstaining branch's field to `null` and confirm case (a) fails.
