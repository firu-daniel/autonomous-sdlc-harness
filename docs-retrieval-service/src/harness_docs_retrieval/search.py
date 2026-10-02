"""Hybrid search over the index, and its rendering; a port of `cli/src/retrieval/search.ts`.

The rule this module exists to enforce, carried over from `search.ts`: only `fused-rerank`
abstains, and only below `ABSTAIN_SCORE_THRESHOLD`. The `lexical`, `vector` and `fused` scores are
rank-derived and uncalibrated, so those modes never abstain. `ABSTAIN_SCORE_THRESHOLD` is taken
from `search.ts`, whose doc comment points at `docs/retrieval-eval-results.md` →
`## Threshold calibration`; it is not re-derived here, and `tests/test_render_parity.py` asserts it
against the TypeScript export. Every store access goes through `DocStore`; this module holds no SQL.

Every string and number operation the rendering performs goes through `jscompat`, so a terminal
and an agent read the same bytes from either backend. The one departure from `search.ts`: the
empty-query refusal raises `ServiceError` where `search.ts` throws `HarnessError`.
"""

import math
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Literal

from harness_docs_retrieval.errors import ServiceError
from harness_docs_retrieval.jscompat import (
    js_to_fixed,
    js_trim,
    js_trim_end,
    js_whitespace_runs,
    utf16_len,
    utf16_slice,
)
from harness_docs_retrieval.models import Embedder, Reranker
from harness_docs_retrieval.store import DocStore, RankedId, StoredChunk

# A hit at rank `r` contributes `1 / (RRF_K + r)`.
RRF_K = 60

# The rows taken from each arm before fusion.
ARM_CANDIDATES = 50

# The fused rows sent to the reranker in `fused-rerank`.
RERANK_CANDIDATES = 20

DEFAULT_RESULTS = 5
MAX_RESULTS = 20

# In UTF-16 code units, before the `...` a cut appends.
_SNIPPET_CHARS = 240

# Taken from `search.ts`; see the module header.
ABSTAIN_SCORE_THRESHOLD = 0.32

ABSTAIN_MESSAGE = "no confident match"

_NO_RESULTS_MESSAGE = "no results"

SearchMode = Literal["lexical", "vector", "fused", "fused-rerank"]

# The order a refusal lists them in.
SEARCH_MODES: tuple[SearchMode, ...] = ("lexical", "vector", "fused", "fused-rerank")


@dataclass(frozen=True)
class SearchHit:
    """One result. `ref` is `path#anchor`, or `path` alone for a preamble chunk."""

    ref: str
    path: str
    anchor: str
    heading: str
    snippet: str
    score: float


@dataclass(frozen=True)
class SearchResult:
    abstained: bool
    hits: tuple[SearchHit, ...]
    # The top reranker score `fused-rerank` compared against the threshold, abstention or not;
    # `None` in every other mode, and when there were no candidates to rerank.
    best_rerank_score: float | None


def _add_rrf(scores: dict[int, float], ranked: Sequence[RankedId]) -> None:
    """Adds each hit's RRF term to `scores`, keeping first-seen order."""
    for hit in ranked:
        scores[hit.id] = scores.get(hit.id, 0) + 1 / (RRF_K + hit.rank)


def snippet_of(body: str) -> str:
    """Whitespace collapsed, cut on a word boundary at 240 UTF-16 units with `...` appended."""
    text = js_trim(js_whitespace_runs(body, " "))
    if utf16_len(text) <= _SNIPPET_CHARS:
        return text
    cut = utf16_slice(text, 0, _SNIPPET_CHARS)
    # A space is one UTF-16 unit and never part of a pair, so the code-point index slices alike.
    space = cut.rfind(" ")
    return f"{js_trim_end(cut[:space] if space > 0 else cut)}..."


def _hit_of(chunk: StoredChunk, score: float) -> SearchHit:
    return SearchHit(
        ref=chunk.path if chunk.anchor == "" else f"{chunk.path}#{chunk.anchor}",
        path=chunk.path,
        anchor=chunk.anchor,
        heading=chunk.heading,
        snippet=snippet_of(chunk.body),
        score=score,
    )


async def search_docs(
    *,
    store: DocStore,
    embedder: Embedder,
    reranker: Reranker,
    query: str,
    k: float,
    mode: SearchMode,
) -> SearchResult:
    """Answers `query` in `mode`, with `k` clamped to `[1, MAX_RESULTS]`.

    An empty or whitespace-only query is refused. Only `fused-rerank` abstains: on no candidates,
    or on a best reranker score below `ABSTAIN_SCORE_THRESHOLD`.
    """
    if js_trim(query) == "":
        raise ServiceError("docs search: the query is empty; give a non-empty query")
    limit = min(MAX_RESULTS, max(1, math.trunc(k if math.isfinite(k) else DEFAULT_RESULTS)))

    scores: dict[int, float] = {}
    if mode != "vector":
        _add_rrf(scores, await store.lexical_search(query, ARM_CANDIDATES))
    if mode != "lexical":
        _add_rrf(
            scores, await store.vector_search(await embedder.embed_query(query), ARM_CANDIDATES)
        )
    # `sorted` is stable under `reverse=True` too, so ties keep first-seen order as JS's sort does.
    fused = sorted(scores.items(), key=lambda entry: entry[1], reverse=True)

    if mode != "fused-rerank":
        chunks = await store.get_chunks([id_ for id_, _ in fused[:limit]])
        return SearchResult(
            abstained=False,
            hits=tuple(_hit_of(chunk, scores.get(chunk.id, 0)) for chunk in chunks),
            best_rerank_score=None,
        )

    candidates = await store.get_chunks([id_ for id_, _ in fused[:RERANK_CANDIDATES]])
    if not candidates:
        return SearchResult(abstained=True, hits=(), best_rerank_score=None)
    passages = [
        chunk.body if chunk.heading == "" else f"{chunk.heading}\n{chunk.body}"
        for chunk in candidates
    ]
    rerank_scores = await reranker.score(query, passages)
    reranked = sorted(
        (
            (chunk, rerank_scores[index] if index < len(rerank_scores) else 0)
            for index, chunk in enumerate(candidates)
        ),
        key=lambda entry: entry[1],
        reverse=True,
    )
    best = reranked[0][1] if reranked else 0
    if best < ABSTAIN_SCORE_THRESHOLD:
        return SearchResult(abstained=True, hits=(), best_rerank_score=best)
    return SearchResult(
        abstained=False,
        hits=tuple(_hit_of(chunk, score) for chunk, score in reranked[:limit]),
        best_rerank_score=best,
    )


def render_results(result: SearchResult) -> str:
    """`ABSTAIN_MESSAGE` alone on an abstention, `"no results"` for no hits, otherwise two lines
    per hit — `n. ref (score s)` and the indented snippet — with no trailing newline.

    The score goes through `js_to_fixed`: Python's own fixed-point formatting rounds half-even and
    prints `0.0625` as `0.062` where JS prints `0.063`.
    """
    if result.abstained:
        return ABSTAIN_MESSAGE
    if not result.hits:
        return _NO_RESULTS_MESSAGE
    lines: list[str] = []
    for index, hit in enumerate(result.hits):
        lines.append(f"{index + 1}. {hit.ref} (score {js_to_fixed(hit.score, 3)})")
        lines.append(f"   {hit.snippet}")
    return "\n".join(lines)
