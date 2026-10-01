"""The hash stubs and the stub selector; a port of the stub half of `cli/src/retrieval/models.ts`.

The rule this module exists to enforce: the stubs are a test seam, and they produce the same ids,
vectors and scores as the TypeScript stubs bit for bit, so the end-to-end comparison runs with no
weights and measures the backends rather than the stubs. `RETRIEVAL_STUB_ENV` reuses the TypeScript
variable because its semantics are identical, and it is the only spelling of that name in this
package; `_stub_env_value` is the only read of it.
"""

import hashlib
import math
import os
import re
from collections.abc import Sequence

from harness_docs_retrieval import models
from harness_docs_retrieval.errors import ServiceError
from harness_docs_retrieval.jscompat import json_stringify_str
from harness_docs_retrieval.models import EMBEDDING_DIMENSIONS, Embedder, Reranker

RETRIEVAL_STUB_ENV = "AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB"

STUB_VERSIONS = ("hash-v1", "hash-v2")

_NON_ALPHANUMERIC = re.compile(r"[^a-z0-9]+")


def _stub_env_value() -> str:
    return os.environ.get(RETRIEVAL_STUB_ENV, "")


def stub_models_selected() -> bool:
    """True when `RETRIEVAL_STUB_ENV` is set to a non-empty value."""
    return _stub_env_value() != ""


def stub_tokens(text: str, min_length: int) -> list[str]:
    """Lower-cased alphanumeric runs of at least `min_length` characters."""
    return [token for token in _NON_ALPHANUMERIC.split(text.lower()) if len(token) >= min_length]


class _StubEmbedder:
    def __init__(self, version: str) -> None:
        self.id = f"stub-hash:{version}"
        self.dimensions = EMBEDDING_DIMENSIONS
        self._salt = "v2" if version == "hash-v2" else ""

    def _embed(self, text: str) -> list[float]:
        vector = [0.0] * EMBEDDING_DIMENSIONS
        for token in stub_tokens(text, 2):
            digest = hashlib.sha256((self._salt + token).encode("utf-8")).digest()
            vector[int.from_bytes(digest[:4], "big") % EMBEDDING_DIMENSIONS] += 1
        # A plain left-to-right loop from 0.0, as JS `reduce` computes it: Python 3.12+'s builtin
        # float summation is compensated and can round differently.
        squares = 0.0
        for value in vector:
            squares = squares + value * value
        norm = math.sqrt(squares)
        return vector if norm == 0 else [value / norm for value in vector]

    async def embed_documents(self, texts: Sequence[str]) -> list[list[float]]:
        return [self._embed(text) for text in texts]

    async def embed_query(self, text: str) -> list[float]:
        return self._embed(text)


class _StubReranker:
    def __init__(self) -> None:
        self.id = "stub-overlap"

    async def score(self, query: str, passages: Sequence[str]) -> list[float]:
        query_tokens = list(dict.fromkeys(stub_tokens(query, 3)))
        scores: list[float] = []
        for passage in passages:
            if not query_tokens:
                scores.append(0.0)
                continue
            passage_tokens = set(stub_tokens(passage, 2))
            hits = len([token for token in query_tokens if token in passage_tokens])
            scores.append(hits / len(query_tokens))
        return scores


STUB_RERANKER: Reranker = _StubReranker()


def resolve_models(allow_remote: bool) -> tuple[Embedder, Reranker]:
    """The stubs when `RETRIEVAL_STUB_ENV` names one of `STUB_VERSIONS`, a refusal for any other
    non-empty value, and otherwise `models.load_models`."""
    if not stub_models_selected():
        return models.load_models(allow_remote=allow_remote)
    value = _stub_env_value()
    if value not in STUB_VERSIONS:
        raise ServiceError(
            f"{RETRIEVAL_STUB_ENV} is set to {json_stringify_str(value)}; "
            f"its legal values are {' and '.join(STUB_VERSIONS)}, "
            "or unset it to load the real models"
        )
    return _StubEmbedder(value), STUB_RERANKER
