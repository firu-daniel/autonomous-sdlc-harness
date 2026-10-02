"""The rule this file exists to enforce, carried over from `search.ts`: only `fused-rerank`
abstains, and only below `ABSTAIN_SCORE_THRESHOLD`; the `lexical`, `vector` and `fused` scores are
rank-derived and never abstain.

Each arm is scripted through `InMemoryDocStore`'s rankings, so fusion is asserted on exact ids and
exact floats. The `snippet_of` expectations are literals worked from `snippetOf`'s algorithm, not
from the port; the byte comparison against the running TypeScript is `test_render_parity.py`'s, and
`test_backend_parity_e2e.py` covers `snippet_of` against it end to end.
"""

import asyncio
import math
from collections.abc import Sequence

import pytest

from fakes import InMemoryDocStore, doc_chunk
from harness_docs_retrieval.errors import ServiceError
from harness_docs_retrieval.search import (
    ABSTAIN_SCORE_THRESHOLD,
    RRF_K,
    SearchMode,
    SearchResult,
    render_results,
    search_docs,
    snippet_of,
)


class _Embedder:
    def __init__(self) -> None:
        self.id = "fake-embedder"
        self.dimensions = 2
        self.queries: list[str] = []

    async def embed_documents(self, texts: Sequence[str]) -> list[list[float]]:
        return [[1.0, 0.0] for _ in texts]

    async def embed_query(self, text: str) -> list[float]:
        self.queries.append(text)
        return [1.0, 0.0]


class _Reranker:
    def __init__(self, scores: Sequence[float] = ()) -> None:
        self.id = "fake-reranker"
        self.scores = list(scores)
        self.passages: list[list[str]] = []

    async def score(self, query: str, passages: Sequence[str]) -> list[float]:
        self.passages.append(list(passages))
        return self.scores[: len(passages)]


def _store(
    count: int,
    lexical: Sequence[int] = (),
    vector: Sequence[int] = (),
) -> InMemoryDocStore:
    """`count` chunks with ids 1..count; `docs/1.md` is a preamble, the rest carry a heading."""
    store = InMemoryDocStore(
        lexical_ranking=lambda _query: list(lexical),
        vector_ranking=lambda _embedding: list(vector),
    )
    chunks = [
        doc_chunk("docs/1.md", body="preamble body")
        if index == 1
        else doc_chunk(f"docs/{index}.md", f"s{index}", f"Heading {index}", f"body {index}")
        for index in range(1, count + 1)
    ]
    asyncio.run(store.upsert_chunks(chunks, [[1.0, 0.0] for _ in chunks]))
    return store


def _search(
    store: InMemoryDocStore,
    mode: SearchMode,
    *,
    k: float = 5,
    query: str = "hybrid search",
    embedder: _Embedder | None = None,
    reranker: _Reranker | None = None,
) -> SearchResult:
    return asyncio.run(
        search_docs(
            store=store,
            embedder=embedder or _Embedder(),
            reranker=reranker or _Reranker(),
            query=query,
            k=k,
            mode=mode,
        )
    )


def _ids(result: SearchResult) -> list[str]:
    return [hit.path for hit in result.hits]


def test_an_id_in_both_arms_sums_both_terms() -> None:
    result = _search(_store(3, lexical=[2, 3], vector=[3, 1]), "fused")
    scores = {hit.path: hit.score for hit in result.hits}
    assert scores["docs/3.md"] == 0 + 1 / (RRF_K + 2) + 1 / (RRF_K + 1)
    assert scores["docs/2.md"] == 0 + 1 / (RRF_K + 1)
    assert scores["docs/1.md"] == 0 + 1 / (RRF_K + 2)
    assert _ids(result) == ["docs/3.md", "docs/2.md", "docs/1.md"]


def test_ties_keep_first_seen_order() -> None:
    # 3 and 2 each score 1/61 and 1 and 4 each 1/62; the lexical arm is seen first.
    result = _search(_store(4, lexical=[3, 1], vector=[2, 4]), "fused")
    assert _ids(result) == ["docs/3.md", "docs/2.md", "docs/1.md", "docs/4.md"]


def test_lexical_mode_never_touches_the_vector_arm() -> None:
    store = _store(2, lexical=[1, 2], vector=[2, 1])
    embedder = _Embedder()
    result = _search(store, "lexical", embedder=embedder)
    assert "vector_search" not in store.calls
    assert embedder.queries == []
    assert _ids(result) == ["docs/1.md", "docs/2.md"]


def test_vector_mode_never_touches_the_lexical_arm() -> None:
    store = _store(2, lexical=[1, 2], vector=[2, 1])
    embedder = _Embedder()
    result = _search(store, "vector", embedder=embedder)
    assert "lexical_search" not in store.calls
    assert embedder.queries == ["hybrid search"]
    assert _ids(result) == ["docs/2.md", "docs/1.md"]


@pytest.mark.parametrize(
    ("k", "count"),
    [(0, 1), (-3, 1), (99, 20), (2.7, 2), (math.nan, 5), (math.inf, 5), (-math.inf, 5)],
)
def test_k_is_clamped(k: float, count: int) -> None:
    ids = list(range(1, 31))
    result = _search(_store(30, lexical=ids), "lexical", k=k)
    assert len(result.hits) == count


@pytest.mark.parametrize("query", ["", " \t\n", " ﻿　"])
def test_an_empty_query_is_refused(query: str) -> None:
    store = _store(1, lexical=[1])
    with pytest.raises(ServiceError) as raised:
        _search(store, "fused-rerank", query=query)
    assert str(raised.value) == "docs search: the query is empty; give a non-empty query"
    assert store.calls == []


def test_fused_rerank_abstains_with_no_candidates() -> None:
    reranker = _Reranker([0.9])
    result = _search(_store(2), "fused-rerank", reranker=reranker)
    assert result == SearchResult(abstained=True, hits=(), best_rerank_score=None)
    assert reranker.passages == []


def test_fused_rerank_abstains_below_the_threshold_and_reports_the_best() -> None:
    result = _search(
        _store(3, lexical=[1, 2, 3]), "fused-rerank", reranker=_Reranker([0.1, 0.31, 0.2])
    )
    assert result == SearchResult(abstained=True, hits=(), best_rerank_score=0.31)
    assert render_results(result) == "no confident match"


def test_fused_rerank_does_not_abstain_at_the_threshold() -> None:
    assert ABSTAIN_SCORE_THRESHOLD == 0.32
    result = _search(
        _store(3, lexical=[1, 2, 3]),
        "fused-rerank",
        k=2,
        reranker=_Reranker([0.1, 0.32, 0.2]),
    )
    assert result.abstained is False
    assert result.best_rerank_score == 0.32
    assert [(hit.ref, hit.score) for hit in result.hits] == [
        ("docs/2.md#s2", 0.32),
        ("docs/3.md#s3", 0.2),
    ]


def test_fused_rerank_reads_a_missing_score_as_zero() -> None:
    result = _search(_store(3, lexical=[1, 2, 3]), "fused-rerank", reranker=_Reranker([0.5]))
    assert [(hit.ref, hit.score) for hit in result.hits] == [
        ("docs/1.md", 0.5),
        ("docs/2.md#s2", 0),
        ("docs/3.md#s3", 0),
    ]


@pytest.mark.parametrize("mode", ["lexical", "vector", "fused"])
def test_rank_derived_modes_never_abstain(mode: SearchMode) -> None:
    empty = _search(_store(2), mode, reranker=_Reranker([0.0, 0.0]))
    assert empty == SearchResult(abstained=False, hits=(), best_rerank_score=None)
    assert render_results(empty) == "no results"

    found = _search(_store(2, lexical=[1, 2], vector=[1, 2]), mode, reranker=_Reranker([0.0]))
    assert found.abstained is False
    assert found.best_rerank_score is None
    assert len(found.hits) == 2


def test_rerank_passages_compose_heading_and_body() -> None:
    reranker = _Reranker([0.9, 0.8])
    result = _search(_store(2, lexical=[2, 1]), "fused-rerank", reranker=reranker)
    assert reranker.passages == [["Heading 2\nbody 2", "preamble body"]]
    assert [hit.ref for hit in result.hits] == ["docs/2.md#s2", "docs/1.md"]
    assert result.hits[0].heading == "Heading 2"
    assert result.hits[0].anchor == "s2"


def test_snippet_collapses_js_whitespace() -> None:
    assert snippet_of(" ﻿one two \n three ") == "one two three"


def test_snippet_cuts_on_the_last_space() -> None:
    body = "  lead  in﻿\t" + "word " * 60
    assert snippet_of(body) == "lead in " + " ".join(["word"] * 46) + "..."


def test_snippet_counts_utf16_units() -> None:
    # 239 code points plus one astral character: 240 UTF-16 units, so no cut.
    fits = "a" * 238 + "\U0001f600"
    assert snippet_of(fits) == fits


def test_snippet_with_no_space_keeps_the_lone_surrogate_of_a_straddling_pair() -> None:
    # 240 code points but 241 UTF-16 units: the cut lands inside the pair.
    assert snippet_of("a" * 239 + "\U0001f600") == "a" * 239 + "\ud83d..."
    assert snippet_of("a" * 239 + "\U0001f600 tail") == "a" * 239 + "\ud83d..."


def test_snippet_with_a_space_drops_the_straddling_pair() -> None:
    assert snippet_of("x " + "a" * 237 + "\U0001f600z") == "x..."
