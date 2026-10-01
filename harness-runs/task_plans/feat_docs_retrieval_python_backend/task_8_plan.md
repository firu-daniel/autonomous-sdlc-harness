### Task 8 — Port hybrid search, abstention and rendering, with the byte-for-byte render case (`search.py`)

**Goal:** Port `cli/src/retrieval/search.ts` intact: the BM25 and vector arms, reciprocal rank fusion, the cross-encoder rerank, the abstention rule, and the rendering a terminal and an agent both read. Prove the rendering byte for byte against the running TypeScript `renderResults`, abstention included.

**Depends on:** Task 7 (`store.py` → `DocStore`, `StoredChunk(id, key, path, anchor, heading, body)`, `RankedId(id, rank)`), Task 5 (`models.py` → `Embedder`, `Reranker`), Task 2 (`jscompat.py` → `js_whitespace_runs`, `js_trim`, `js_trim_end`, `utf16_len`, `utf16_slice`, `js_to_fixed`) and Task 4 (`tests/ts_bridge.py` → `run_bridge("render", stdin=<SearchResult as {abstained, hits, bestRerankScore}>)` returning `{text}`, and `run_bridge("constants")["search"]`).

**Ported from:** `cli/src/retrieval/search.ts`: every export plus `addRrf`, `snippetOf`, `hitOf` and `NO_RESULTS_MESSAGE`. Its rule survives intact and is the reason the module exists: **only `fused-rerank` abstains, and only below `ABSTAIN_SCORE_THRESHOLD`**. The `lexical`, `vector` and `fused` scores are rank-derived and uncalibrated, so those modes never abstain. `ABSTAIN_SCORE_THRESHOLD = 0.32` is **taken** from `search.ts`, whose doc comment points at `docs/retrieval-eval-results.md` → `## Threshold calibration`. **Do not re-derive it, and tune nothing.** The parity case below asserts the value against the TypeScript export, so a later recalibration there turns this suite red rather than silently diverging.

**Where this task stops.** `search_docs` is the library-level call. Timing it, refreshing before it and adding the coverage `note: ` lines are Task 10's `answer()` path, which calls `search_docs(store=…, embedder=…, reranker=…, query=…, k=…, mode=…)` and `render_results(result)` exactly as declared here. The four modes all exist because the comparison branch measures each as an arm. The MCP tool always runs `fused-rerank`, and Task 12's HTTP endpoint exposes the others.

### Targets

- `docs-retrieval-service/src/harness_docs_retrieval/search.py` (new)
- `docs-retrieval-service/tests/fakes.py` (new) — the in-memory `DocStore` later test files share.
- `docs-retrieval-service/tests/test_search.py` (new)
- `docs-retrieval-service/tests/test_render_parity.py` (new)

**Work:**

- [ ] **Constants and records.** `RRF_K = 60`, `ARM_CANDIDATES = 50`, `RERANK_CANDIDATES = 20`, `DEFAULT_RESULTS = 5`, `MAX_RESULTS = 20`, a module-private `_SNIPPET_CHARS = 240`, `ABSTAIN_SCORE_THRESHOLD = 0.32`, `ABSTAIN_MESSAGE = "no confident match"` and a module-private `_NO_RESULTS_MESSAGE = "no results"`. `SearchMode = Literal["lexical", "vector", "fused", "fused-rerank"]` and `SEARCH_MODES: tuple[SearchMode, ...]`, in that order. Frozen dataclasses `SearchHit(ref: str, path: str, anchor: str, heading: str, snippet: str, score: float)`, where `ref` is `path#anchor`, or `path` for a preamble chunk, and `SearchResult(abstained: bool, hits: tuple[SearchHit, ...], best_rerank_score: float | None)`.
- [ ] **`async search_docs(*, store, embedder, reranker, query: str, k: float, mode: SearchMode) -> SearchResult`, step for step.**
  - An empty query by `js_trim` raises `ServiceError("docs search: the query is empty; give a non-empty query")`.
  - `k = min(MAX_RESULTS, max(1, math.trunc(k if math.isfinite(k) else DEFAULT_RESULTS)))`.
  - RRF goes into an insertion-ordered `dict`, lexical arm first unless `mode == "vector"`, then the vector arm unless `mode == "lexical"`. The embedder is called only when the vector arm runs. Each term is added as `scores.get(id, 0) + 1 / (RRF_K + rank)`, in that order.
  - Fused order is a **stable** descending sort on the score, so ties keep first-seen order, as JS's stable `sort` does.
  - Non-rerank modes take the top `k` ids, call `get_chunks`, and score each chunk from the map, with `best_rerank_score=None`.
  - `fused-rerank` calls `get_chunks` on the top `RERANK_CANDIDATES`. With none it returns `abstained=True` with `best_rerank_score=None`. Passages are `body` when `heading == ""` and `f"{heading}\n{body}"` otherwise. A missing score reads as `0`, and the results take a stable descending sort. The best is the first score, or `0`. It abstains when `best < ABSTAIN_SCORE_THRESHOLD`, still reporting `best`. Otherwise it returns the top `k` with `best_rerank_score=best`.
- [ ] **`snippet_of(body: str) -> str` and `render_results(result: SearchResult) -> str`.** `snippet_of` collapses whitespace runs with `js_whitespace_runs(body, " ")` and then applies `js_trim`. If `utf16_len` ≤ 240 it returns that. Otherwise it cuts with `utf16_slice(…, 0, 240)`, keeps up to the last space when that index is `> 0`, applies `js_trim_end`, and appends `...`. `render_results` returns `ABSTAIN_MESSAGE` alone on abstention and `"no results"` for no hits. Otherwise it renders two lines per hit, `f"{n}. {ref} (score {js_to_fixed(score, 3)})"` and `"   " + snippet`, joined with `"\n"` and with no trailing newline. **Never** format the score with Python's `:.3f`, which rounds half-even and turns `0.0625` into `0.062` where JS prints `0.063`.
- [ ] `tests/fakes.py` and `test_search.py`. `fakes.py` declares `InMemoryDocStore`, which satisfies the whole `DocStore` protocol: meta in a dict, chunks keyed by `key` with ascending integer ids, upsert, delete and clear. It takes optional `lexical_ranking` / `vector_ranking` callables returning id lists, so a test can script each arm exactly, and otherwise falls back to a simple token-overlap lexical order and a cosine vector order. Tasks 9–12 reuse it unchanged, and Task 10 adds a fake session beside it. `test_search.py` opens with the module's rule and asserts:
  - the RRF sum for an id in both arms against one arm;
  - first-seen tie order;
  - `lexical` mode never calls `vector_search` or `embed_query`;
  - the `k` clamp (`0 → 1`, `99 → 20`, `2.7 → 2`, `nan` and `inf` → `5`);
  - the empty-query refusal;
  - `fused-rerank` abstaining on no candidates (with `None`) and below the threshold (reporting the best);
  - `fused-rerank` **not** abstaining at exactly `0.32`;
  - `lexical`, `vector` and `fused` never abstaining, even at zero scores;
  - the heading-and-body passage composition;
  - `snippet_of` on a body longer than 240 UTF-16 units that contains ` `, `﻿`, an astral character straddling the cut, and a first 240 units with no space. The expected strings are derived from `snippetOf`'s algorithm and written into the test as literals. Task 15's end-to-end case proves it against the running code.
- [ ] `test_render_parity.py` opens with its rule (*a client must not be able to tell which backend answered it*). It asserts that each search constant above, and `SEARCH_MODES`, equals `run_bridge("constants")["search"]`'s value. It then sends each of these hand-built `SearchResult`s through both `render_results` and `run_bridge("render", …)` and asserts **byte equality**: an abstention, an empty non-abstained result, and a multi-hit result. The multi-hit result's scores include `0.0625`, `0.1875`, `0.0005`, `1/61`, `1.0` and `0.0`, it includes a preamble `ref` with no anchor, and its snippets carry non-ASCII and astral characters.

**Verification:**

- `tests/test_search.py` and `tests/test_render_parity.py` pass (subject to the story index's test-run note).
- `grep -n ":.3f\|round(" docs-retrieval-service/src/harness_docs_retrieval/search.py` finds nothing. Scores render through `js_to_fixed` only.
- `grep -n "SELECT\|INSERT\|ORDER BY" docs-retrieval-service/src/harness_docs_retrieval/search.py` finds nothing. Like `search.ts`, this module holds no SQL.

**Deviations from plan:**

- Deferred to the Run gates phase: `tests/test_search.py`, `tests/test_render_parity.py`, Python lint and Python type-check were not run. No conventions document states a single-file Python command (story index `## Context`, the test-run note). Evidence downgrade: the `snippet_of` literals and the `toFixed(3)` values of the parity scores (`0.063`, `0.188`, `0.001`, `0.016`, `1.000`, `0.000`) rest on an executed scratch probe (`harness-runs/scratch/task8_snippet_probe.mjs`, run through `scripts/scratch-run.sh`), which ran `snippetOf`'s body copied from `search.ts` on the test inputs. That the Python port produces the same strings rests on reading only. The two plan greps were run and found nothing.
- `tests/fakes.py` also declares `doc_chunk(path, anchor, heading, body)`, a `DocChunk` builder with placeholder `text` and `hash`, and `InMemoryDocStore.calls`, the search-path method names in call order, which the lexical-mode and empty-query cases assert on. `lexical_ranking` takes the query and `vector_ranking` the query embedding; each returns ids, truncated to `limit` and ranked from 1.
- `test_search.py` adds cases beyond the list: vector mode never calls `lexical_search`, a missing rerank score reads as `0`, `k = -3` and `-inf`, and a 238-unit-plus-astral body that fits at exactly 240 UTF-16 units.
