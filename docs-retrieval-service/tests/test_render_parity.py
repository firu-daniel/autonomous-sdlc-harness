"""The rule this file exists to enforce: a client must not be able to tell which backend answered
it. Every search constant is compared against the running TypeScript export, and each rendering
against the running `renderResults` byte for byte, so a recalibrated threshold or a reworded line on
the TypeScript side turns this suite red rather than silently diverging.

The multi-hit scores are chosen where Python's own fixed-point formatting would differ from
`toFixed` (`0.0625`, `0.1875`), at a rounding edge (`0.0005`), and at the ends (`1.0`, `0.0`).
"""

from typing import Any

import pytest

from harness_docs_retrieval.search import (
    ABSTAIN_MESSAGE,
    ABSTAIN_SCORE_THRESHOLD,
    ARM_CANDIDATES,
    DEFAULT_RESULTS,
    MAX_RESULTS,
    RERANK_CANDIDATES,
    RRF_K,
    SEARCH_MODES,
    SearchHit,
    SearchResult,
    render_results,
)
from ts_bridge import run_bridge


def _hit(path: str, anchor: str, snippet: str, score: float) -> SearchHit:
    return SearchHit(
        ref=path if anchor == "" else f"{path}#{anchor}",
        path=path,
        anchor=anchor,
        heading=anchor.replace("-", " "),
        snippet=snippet,
        score=score,
    )


RESULTS = {
    "abstention": SearchResult(abstained=True, hits=(), best_rerank_score=0.1),
    "empty": SearchResult(abstained=False, hits=(), best_rerank_score=None),
    "multi-hit": SearchResult(
        abstained=False,
        hits=(
            _hit("docs/retrieval.md", "setup", "Café naïve — Straße, 東京", 0.0625),
            _hit("docs/a.md", "emoji-heading", "Emoji \U0001f600 and \U0001d518\U0001d52b", 0.1875),
            _hit("docs/b.md", "edge", "Half a thousandth...", 0.0005),
            _hit("docs/c.md", "fused", "One over sixty-one", 1 / 61),
            _hit("README.md", "", "A preamble with no anchor", 1.0),
            _hit("docs/d.md", "zero", "Nothing scored", 0.0),
        ),
        best_rerank_score=1.0,
    ),
}


def _wire(result: SearchResult) -> dict[str, Any]:
    """The TypeScript `SearchResult` shape the bridge's `render` reads."""
    return {
        "abstained": result.abstained,
        "hits": [
            {
                "ref": hit.ref,
                "path": hit.path,
                "anchor": hit.anchor,
                "heading": hit.heading,
                "snippet": hit.snippet,
                "score": hit.score,
            }
            for hit in result.hits
        ],
        "bestRerankScore": result.best_rerank_score,
    }


def test_search_constants_match_typescript() -> None:
    ts_search: dict[str, Any] = run_bridge("constants")["search"]
    assert RRF_K == ts_search["RRF_K"]
    assert ARM_CANDIDATES == ts_search["ARM_CANDIDATES"]
    assert RERANK_CANDIDATES == ts_search["RERANK_CANDIDATES"]
    assert DEFAULT_RESULTS == ts_search["DEFAULT_RESULTS"]
    assert MAX_RESULTS == ts_search["MAX_RESULTS"]
    assert ABSTAIN_SCORE_THRESHOLD == ts_search["ABSTAIN_SCORE_THRESHOLD"]
    assert ABSTAIN_MESSAGE == ts_search["ABSTAIN_MESSAGE"]
    assert list(SEARCH_MODES) == ts_search["SEARCH_MODES"]


@pytest.mark.parametrize("name", list(RESULTS))
def test_rendering_matches_typescript_byte_for_byte(name: str) -> None:
    result = RESULTS[name]
    ts_text: str = run_bridge("render", stdin=_wire(result))["text"]
    py_text = render_results(result)
    assert py_text.encode("utf-8") == ts_text.encode("utf-8")
