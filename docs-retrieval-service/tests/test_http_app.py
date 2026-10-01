"""The rule this file exists to enforce: one search module, two entry points. `POST /search`
answers through `service.answer()`, so its `text` is the MCP tool's text for the same query, every
refusal but the `mode` one is `parse_arguments`' own, and `GET /health` reaches the store only
through `session.probe()`.

No duration is asserted: `search_ms` is checked for presence and type only. The app's lifespan
(closing the session at shutdown) is not driven here, because `httpx.ASGITransport` sends no
lifespan events.
"""

import asyncio
from collections.abc import Callable, Sequence
from typing import Any, NoReturn

import httpx
import pytest

from fakes import FakeSession, InMemoryDocStore, doc_chunk
from harness_docs_retrieval.http_app import create_app
from harness_docs_retrieval.refresh import RefreshResult
from harness_docs_retrieval.service import answer

QUERY = "hybrid search fusion"

MODE_REFUSAL = 'search: "mode" must be one of lexical, vector, fused, fused-rerank'
OBJECT_REFUSAL = 'search_docs: arguments must be an object with a string "query"'
QUERY_REFUSAL = 'search_docs: "query" must be a non-empty string'
K_REFUSAL = 'search_docs: "k" must be a whole number from 1 to 20'
EXTRA_REFUSAL = 'search_docs: unexpected argument "other"; expected query and k'

SUCCESS_FIELDS = {"text", "mode", "abstained", "best_rerank_score", "hits", "notes", "search_ms"}
HIT_FIELDS = {"ref", "path", "anchor", "heading", "snippet", "score"}


def _populated_store(
    *,
    lexical_ranking: Callable[[str], Sequence[int]] | None = None,
    vector_ranking: Callable[[Sequence[float]], Sequence[int]] | None = None,
) -> InMemoryDocStore:
    store = InMemoryDocStore(lexical_ranking=lexical_ranking, vector_ranking=vector_ranking)
    chunks = [
        doc_chunk("docs/a.md", "fusion", "Fusion", "hybrid search fusion explained"),
        doc_chunk("docs/b.md", "other", "Other", "nothing relevant here"),
    ]
    embedder = FakeSession(store).embedder
    vectors = asyncio.run(embedder.embed_documents([chunk.text for chunk in chunks]))
    asyncio.run(store.upsert_chunks(chunks, vectors))
    return store


async def _request(session: FakeSession, method: str, path: str, **kwargs: Any) -> httpx.Response:
    transport = httpx.ASGITransport(app=create_app(session))
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.request(method, path, **kwargs)


def _post(session: FakeSession, body: object) -> httpx.Response:
    return asyncio.run(_request(session, "POST", "/search", json=body))


# --- POST /search -----------------------------------------------------------------------------


def test_a_search_returns_every_field_and_the_mcp_text() -> None:
    warnings = ("docs.root docs is not a directory",)
    refreshed = RefreshResult(
        files=1, chunks=2, embedded=0, unchanged=2, deleted=0, rebuilt=False, warnings=warnings
    )
    session = FakeSession(_populated_store(), refresh=refreshed)

    response = _post(session, {"query": QUERY, "k": 1})
    expected = asyncio.run(answer(session, {"query": QUERY, "k": 1}))

    assert response.status_code == 200
    body = response.json()
    assert set(body) == SUCCESS_FIELDS
    assert expected.result is not None
    assert body["text"] == expected.text
    assert body["mode"] == "fused-rerank"
    assert body["abstained"] is False
    assert not expected.result.abstained
    assert body["best_rerank_score"] == expected.result.best_rerank_score
    assert body["notes"] == ["note: docs.root docs is not a directory"]
    assert len(body["hits"]) == 1
    hit = body["hits"][0]
    assert set(hit) == HIT_FIELDS
    expected_hit = expected.result.hits[0]
    assert hit == {
        "ref": expected_hit.ref,
        "path": expected_hit.path,
        "anchor": expected_hit.anchor,
        "heading": expected_hit.heading,
        "snippet": expected_hit.snippet,
        "score": expected_hit.score,
    }
    assert hit["ref"] == "docs/a.md#fusion"
    assert isinstance(body["search_ms"], float)
    assert body["search_ms"] >= 0


def test_the_mode_reaches_the_search() -> None:
    # Scripted arms: lexical ranks b first, vector ranks a first, so the hits show which ran.
    store = _populated_store(lexical_ranking=lambda query: [2], vector_ranking=lambda vec: [1])
    session = FakeSession(store)

    response = _post(session, {"query": QUERY, "mode": "lexical"})

    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "lexical"
    assert body["best_rerank_score"] is None
    assert [hit["ref"] for hit in body["hits"]] == ["docs/b.md#other"]
    assert store.calls == ["lexical_search", "get_chunks"]


@pytest.mark.parametrize("mode", ["semantic", 3, None, ["lexical"]])
def test_an_unknown_mode_is_refused_before_the_answer_path(mode: object) -> None:
    session = FakeSession()
    response = _post(session, {"query": QUERY, "mode": mode})
    assert response.status_code == 400
    assert response.json() == {"error": MODE_REFUSAL}
    assert session.refresh_calls == 0


@pytest.mark.parametrize(
    ("body", "refusal"),
    [
        ({"query": ""}, QUERY_REFUSAL),
        ({"query": "x", "k": 0}, K_REFUSAL),
        ({"query": "x", "other": 1}, EXTRA_REFUSAL),
        ({"query": "x", "mode": "lexical", "other": 1}, EXTRA_REFUSAL),
        ([{"query": "x"}], OBJECT_REFUSAL),
        ("x", OBJECT_REFUSAL),
        (3, OBJECT_REFUSAL),
    ],
)
def test_an_argument_refusal_is_parse_arguments_text(body: object, refusal: str) -> None:
    session = FakeSession()
    response = _post(session, body)
    assert response.status_code == 400
    assert response.json() == {"error": refusal}
    assert session.refresh_calls == 0


def test_a_body_that_is_not_json_is_refused() -> None:
    session = FakeSession()
    response = asyncio.run(
        _request(
            session,
            "POST",
            "/search",
            content=b"{not json",
            headers={"content-type": "application/json"},
        )
    )
    assert response.status_code == 400
    assert set(response.json()) == {"error"}
    assert isinstance(response.json()["error"], str)
    assert session.refresh_calls == 0


def test_a_refresh_failure_is_a_500() -> None:
    session = FakeSession(refresh=RuntimeError("the database went away"))
    response = _post(session, {"query": QUERY})
    assert response.status_code == 500
    assert response.json() == {
        "error": (
            "search_docs: refreshing the docs index failed: the database went away; "
            "run harness-docs-retrieval self-check in this repository"
        )
    }


# --- GET /health ------------------------------------------------------------------------------


def test_health_reports_both_model_ids() -> None:
    session = FakeSession()
    response = asyncio.run(_request(session, "GET", "/health"))
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "embedder": session.embedder.id,
        "reranker": session.reranker.id,
    }
    assert not session.lock.locked()


def test_health_is_503_when_the_probe_fails(monkeypatch: pytest.MonkeyPatch) -> None:
    session = FakeSession()

    async def unreachable(key: str) -> NoReturn:
        raise ConnectionError("the store is unreachable")

    monkeypatch.setattr(session.fake_store, "read_meta", unreachable)
    response = asyncio.run(_request(session, "GET", "/health"))
    assert response.status_code == 503
    assert response.json() == {"status": "unavailable", "error": "the store is unreachable"}
    assert not session.lock.locked()
