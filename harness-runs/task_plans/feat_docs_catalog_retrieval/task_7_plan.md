### Task 7 — Hybrid search with rerank and abstention, and `docs search`

**Goal:** Answer a query in four steps. Run BM25 and vector search, fuse them with reciprocal rank fusion, reorder the top candidates with the cross-encoder reranker, and return `path#heading` results with a snippet and a score, or abstain with `no confident match` below one named, provisional threshold. Expose the four modes the follow-up eval compares, and put a CLI face on them: `docs search`.

**Depends on:**

- **Task 3:** `interface Reranker { readonly id: string; score(query: string, passages: readonly string[]): Promise<number[]> }`, whose scores lie in `[0, 1]` (the stub's is token overlap), and `Embedder.embedQuery(text: string): Promise<number[]>`.
- **Task 5:** `DocStore.lexicalSearch(query, limit)` and `DocStore.vectorSearch(embedding, limit)`, each returning `{ id: number; rank: number }[]` with a 1-based `rank`, and `DocStore.getChunks(ids)` returning `StoredChunk { id, key, path, anchor, heading, body }`. BM25 returns only matching rows.
- **Task 6:** `cli/src/commands/docs.ts`, which this task extends with one sub-verb row, and `openRetrieval({ repoRoot, config, inMemory })` (`cli/src/retrieval/session.ts`), which returns `{ store, embedder, reranker, refresh(), close() }`. Also `cli/test/docs-retrieval.test.mjs` and its helpers `retrievalEnv`, `plantModelFiles` and `writeRetrievalConfig` (`cli/test/helpers/fixture.mjs`), with the fixture corpus of 3 files and 9 chunks.

**Where this task stops.** `search` renders results for a terminal. The MCP tool that returns the same rendering to an agent is Task 8's, and it calls `searchDocs` and `renderResults` exactly as named below.

### Targets

- `cli/src/retrieval/search.ts` (new).
- `cli/src/commands/docs.ts` — the `search` sub-verb.
- `cli/test/docs-retrieval.test.mjs` — the search and abstention cases.

**Work:**

- [ ] `search.ts`: open the module with a header comment, as every file under `cli/src/` does (`.claude/context/conventions.md` → `## What accompanies a new unit of each kind`, row *A module under `cli/src/`*). The header states what the module owns: hybrid search over the `DocStore` arms, reciprocal rank fusion, cross-encoder rerank, abstention and result rendering. It then states the module's rule in the words *"The rule this module exists to enforce"*: only `fused-rerank` abstains, and only below `ABSTAIN_SCORE_THRESHOLD`, a provisional constant; the other modes' scores are uncalibrated and never abstain. Then export these constants, each with a doc comment:
  - `RRF_K = 60`.
  - `ARM_CANDIDATES = 50`, the rows taken from each arm.
  - `RERANK_CANDIDATES = 20`, the fused rows sent to the reranker.
  - `DEFAULT_RESULTS = 5` and `MAX_RESULTS = 20`.
  - `SNIPPET_CHARS = 240`.
  - `ABSTAIN_SCORE_THRESHOLD`, whose doc comment starts **"PROVISIONAL"**. Set it from the fixture corpus: it must sit strictly between the lowest reranker score of the suite's matching queries and the highest score of its no-match query. Start at `0.3` and write the fixture scores you observed into the comment. The eval branch `feat_docs_retrieval_eval` calibrates it on a real catalog.
  - `ABSTAIN_MESSAGE = 'no confident match'`.
- [ ] `search.ts`: export `type SearchMode = 'lexical' | 'vector' | 'fused' | 'fused-rerank'`, the result type `interface SearchHit { readonly ref: string; readonly path: string; readonly anchor: string; readonly heading: string; readonly snippet: string; readonly score: number }` (where `ref` is `` anchor === '' ? path : `${path}#${anchor}` ``), and the entry point `searchDocs(options: { store: DocStore; embedder: Embedder; reranker: Reranker; query: string; k: number; mode: SearchMode }): Promise<{ abstained: boolean; hits: readonly SearchHit[] }>`. The modes behave like this:
  - **Scores.** `lexical` and `vector` score by `1 / (RRF_K + rank)` from their own arm. `fused` sums both arms' RRF terms. `fused-rerank` reranks the top `RERANK_CANDIDATES` fused chunks' `body` with the chunk heading, and scores by the reranker.
  - **Abstention** happens **only in `fused-rerank`**, when there are no candidates or the best reranker score is below `ABSTAIN_SCORE_THRESHOLD`. The other three modes never abstain, because their scores are not calibrated. State that in the doc comment.
  - **Arguments.** `k` is clamped to `[1, MAX_RESULTS]`, and an empty or whitespace-only query throws a `HarnessError`.
  - **Snippets** are the chunk's `body` with whitespace collapsed, cut at `SNIPPET_CHARS` on a word boundary with `...` appended.
- [ ] `search.ts`: export `renderResults(result): string`. It gives `ABSTAIN_MESSAGE` alone when abstained. Otherwise each hit is two lines, `` `${n}. ${ref} (score ${score.toFixed(3)})` `` and `` `   ${snippet}` ``, with no blank line between hits. The format is ASCII apart from the snippet, which is quoted document text.
- [ ] `docs.ts`: add `docs search <query> [--k <n>] [--mode <lexical|vector|fused|fused-rerank>]`. The default mode is `fused-rerank`, and an unknown mode is a refusal listing the four. It calls `openRetrieval({ inMemory: false })`, then `refresh()` (warnings go to `report.warn`), then `searchDocs`, then prints `renderResults` through `ctx.report.result`, then closes. An abstention exits `0`, because abstaining is an answer rather than an error.
- [ ] `docs-retrieval.test.mjs`: add cases on the Task 6 fixture corpus with `retrievalEnv`. (a) `docs search "work without a network"` exits 0, and its first line starts with `1. docs/guide.md#offline (score `. (b) `docs search "quantum chromodynamics lattice"` prints exactly `no confident match`. (c) `--mode lexical` on (a)'s query returns `docs/guide.md#offline` first, and case (b)'s query in `lexical` mode prints no hits and no abstain line. (d) `--k 1` prints exactly one hit. (e) `--mode nonsense` exits non-zero naming the four modes.

**Verification:**

- `bash scripts/test.sh` exits zero with cases (a) to (e) green. Case (b) is the abstention half of Acceptance 4 at the CLI; Task 8 proves it again over MCP.
- `ABSTAIN_SCORE_THRESHOLD`'s doc comment carries the word `PROVISIONAL` and the observed fixture scores, and `grep -rn "0.3" cli/src/retrieval` shows the value in that one constant only.
- No SQL in `search.ts`: every store access goes through the `DocStore` methods above.
- `search.ts` opens with its module header: it names what the module owns, and `grep -n "The rule this module exists to enforce" cli/src/retrieval/search.ts` hits inside that header, which states that only `fused-rerank` abstains, below `ABSTAIN_SCORE_THRESHOLD`.
