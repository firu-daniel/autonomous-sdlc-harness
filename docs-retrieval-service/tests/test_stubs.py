"""The rule this file exists to enforce: the stubs are a test seam and must agree with the
TypeScript stubs exactly, or the end-to-end comparison measures the stubs instead of the backends.

Vectors and scores are compared with `==`, never approximately: they cross the bridge as JSON, which
round-trips every IEEE double, so any difference is a real one. The refusal message is asserted
literally, because the bridge exposes no TypeScript refusal to compare against.
"""

import asyncio
from typing import Any

import pytest

from harness_docs_retrieval import models
from harness_docs_retrieval.errors import ServiceError
from harness_docs_retrieval.models import Embedder, Reranker
from harness_docs_retrieval.stubs import RETRIEVAL_STUB_ENV, STUB_VERSIONS, resolve_models
from ts_bridge import run_bridge

STUB_INPUT: dict[str, Any] = {
    "documents": [
        "Hybrid search: BM25 + vectors, fused by RRF (k=60).",
        "Version 2.0.1 ships on 2026-10-01; see docs/retrieval.md#setup!",
        "MiXeD CaSe Tokens and UPPER lower Upper",
        "Ünïcödé café naïve Straße — 東京 résumé, KELVIN K and İstanbul",
        "",
        "x",
        "repeat repeat repeat token token",
    ],
    "query": "How does hybrid search fuse BM25 and vector results? hybrid",
    "passages": [
        "Hybrid search fuses BM25 and vector results with reciprocal rank fusion.",
        "Search the docs.",
        "Nothing in common at all here.",
        "",
    ],
}


async def _python_answer(embedder: Embedder, reranker: Reranker) -> dict[str, Any]:
    return {
        "embedderId": embedder.id,
        "rerankerId": reranker.id,
        "dimensions": embedder.dimensions,
        "documentVectors": await embedder.embed_documents(STUB_INPUT["documents"]),
        "queryVector": await embedder.embed_query(STUB_INPUT["query"]),
        "scores": await reranker.score(STUB_INPUT["query"], STUB_INPUT["passages"]),
    }


@pytest.mark.parametrize("version", STUB_VERSIONS)
def test_stubs_match_typescript(monkeypatch: pytest.MonkeyPatch, version: str) -> None:
    ts_answer: dict[str, Any] = run_bridge("stub-models", stdin={"version": version, **STUB_INPUT})
    monkeypatch.setenv(RETRIEVAL_STUB_ENV, version)
    embedder, reranker = resolve_models(allow_remote=False)
    py_answer = asyncio.run(_python_answer(embedder, reranker))

    for field in ("embedderId", "rerankerId", "dimensions"):
        assert py_answer[field] == ts_answer[field], field
    assert py_answer["documentVectors"] == ts_answer["documentVectors"]
    assert py_answer["queryVector"] == ts_answer["queryVector"]
    assert py_answer["scores"] == ts_answer["scores"]


def test_stub_env_name_matches_typescript() -> None:
    assert RETRIEVAL_STUB_ENV == run_bridge("constants")["models"]["RETRIEVAL_STUB_ENV"]


def test_an_illegal_version_is_refused(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(RETRIEVAL_STUB_ENV, "hash-v3")
    with pytest.raises(ServiceError) as raised:
        resolve_models(allow_remote=False)
    assert str(raised.value) == (
        f'{RETRIEVAL_STUB_ENV} is set to "hash-v3"; its legal values are hash-v1 and hash-v2, '
        "or unset it to load the real models"
    )


@pytest.mark.parametrize("allow_remote", [False, True])
@pytest.mark.parametrize("unset", [True, False])
def test_no_stub_loads_the_real_models(
    monkeypatch: pytest.MonkeyPatch, allow_remote: bool, unset: bool
) -> None:
    if unset:
        monkeypatch.delenv(RETRIEVAL_STUB_ENV, raising=False)
    else:
        monkeypatch.setenv(RETRIEVAL_STUB_ENV, "")
    sentinel: Any = object()
    calls: list[bool] = []

    def fake_load_models(allow_remote: bool) -> Any:
        calls.append(allow_remote)
        return sentinel

    monkeypatch.setattr(models, "load_models", fake_load_models)
    assert resolve_models(allow_remote=allow_remote) is sentinel
    assert calls == [allow_remote]
