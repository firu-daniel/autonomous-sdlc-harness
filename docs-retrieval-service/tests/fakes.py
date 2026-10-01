"""An in-memory `DocStore` the tests share, so a search or refresh case needs no database.

The rule this module exists to enforce: `InMemoryDocStore` satisfies the whole `DocStore` protocol
with the Postgres store's observable contract — ids are ascending integers a key keeps across
upserts and never reused, `get_chunks` answers in the order asked and skips an unknown id, and a
whitespace-only lexical query ranks nothing. Each arm can be scripted exactly with
`lexical_ranking` / `vector_ranking`; otherwise a token-overlap order and a cosine order stand in
for BM25 and pgvector, and neither claims to reproduce their scores.

`FakeSession` is a `RetrievalSession` over an `InMemoryDocStore` and the `hash-v1` stubs whose
`refresh` returns or raises what it was given, so an entry point's case needs no corpus and no
database.
"""

import math
import os
import re
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass
from unittest import mock

from harness_docs_retrieval.chunk import DocChunk
from harness_docs_retrieval.jscompat import js_trim
from harness_docs_retrieval.refresh import RefreshResult
from harness_docs_retrieval.service import RetrievalSession
from harness_docs_retrieval.store import DocStore, RankedId, StoredChunk
from harness_docs_retrieval.stubs import RETRIEVAL_STUB_ENV, resolve_models

_TOKEN = re.compile(r"[^\W_]+")


@dataclass(frozen=True)
class _Row:
    id: int
    chunk: DocChunk
    embedding: tuple[float, ...]


def _tokens(text: str) -> set[str]:
    return {token.lower() for token in _TOKEN.findall(text)}


def _cosine(a: Sequence[float], b: Sequence[float]) -> float:
    norm = math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b))
    return 0.0 if norm == 0 else sum(x * y for x, y in zip(a, b, strict=False)) / norm


def _ranked(ids: Sequence[int], limit: int) -> list[RankedId]:
    return [RankedId(id=id_, rank=index + 1) for index, id_ in enumerate(ids[:limit])]


def doc_chunk(path: str, anchor: str = "", heading: str = "", body: str = "") -> DocChunk:
    """A chunk for a fake store; `text` and `hash` are placeholders, not `chunk_markdown`'s."""
    return DocChunk(
        key=path if anchor == "" else f"{path}#{anchor}",
        path=path,
        anchor=anchor,
        heading=heading,
        text=f"{heading}\n{body}",
        body=body,
        hash=f"hash-of-{path}#{anchor}",
    )


class InMemoryDocStore:
    """`calls` records each search-path method name in call order, for a test to assert on."""

    def __init__(
        self,
        *,
        lexical_ranking: Callable[[str], Sequence[int]] | None = None,
        vector_ranking: Callable[[Sequence[float]], Sequence[int]] | None = None,
    ) -> None:
        self.meta: dict[str, str] = {}
        self.calls: list[str] = []
        self.closed = False
        self._rows: dict[str, _Row] = {}
        self._next_id = 1
        self._lexical_ranking = lexical_ranking
        self._vector_ranking = vector_ranking

    async def read_meta(self, key: str) -> str | None:
        return self.meta.get(key)

    async def write_meta(self, key: str, value: str) -> None:
        self.meta[key] = value

    async def list_chunk_hashes(self) -> Mapping[str, str]:
        return {key: row.chunk.hash for key, row in self._rows.items()}

    async def upsert_chunks(
        self, chunks: Sequence[DocChunk], embeddings: Sequence[Sequence[float]]
    ) -> None:
        if len(chunks) != len(embeddings):
            raise ValueError(
                f"upsert_chunks was given {len(chunks)} chunks and {len(embeddings)} embeddings"
            )
        for chunk, embedding in zip(chunks, embeddings, strict=True):
            existing = self._rows.get(chunk.key)
            if existing is None:
                id_ = self._next_id
                self._next_id += 1
            else:
                id_ = existing.id
            self._rows[chunk.key] = _Row(id=id_, chunk=chunk, embedding=tuple(embedding))

    async def delete_chunks(self, keys: Sequence[str]) -> None:
        for key in keys:
            self._rows.pop(key, None)

    async def clear(self) -> None:
        self._rows.clear()

    def _by_id(self) -> dict[int, _Row]:
        return {row.id: row for row in self._rows.values()}

    async def lexical_search(self, query: str, limit: int) -> list[RankedId]:
        self.calls.append("lexical_search")
        if js_trim(query) == "":
            return []
        if self._lexical_ranking is not None:
            return _ranked(self._lexical_ranking(query), limit)
        wanted = _tokens(query)
        scored = [
            (len(wanted & _tokens(row.chunk.text)), row.id) for row in self._rows.values()
        ]
        order = sorted((pair for pair in scored if pair[0] > 0), key=lambda p: (-p[0], p[1]))
        return _ranked([id_ for _, id_ in order], limit)

    async def vector_search(self, embedding: Sequence[float], limit: int) -> list[RankedId]:
        self.calls.append("vector_search")
        if self._vector_ranking is not None:
            return _ranked(self._vector_ranking(embedding), limit)
        order = sorted(
            self._rows.values(), key=lambda row: (-_cosine(embedding, row.embedding), row.id)
        )
        return _ranked([row.id for row in order], limit)

    async def get_chunks(self, ids: Sequence[int]) -> list[StoredChunk]:
        self.calls.append("get_chunks")
        by_id = self._by_id()
        return [
            StoredChunk(
                id=row.id,
                key=row.chunk.key,
                path=row.chunk.path,
                anchor=row.chunk.anchor,
                heading=row.chunk.heading,
                body=row.chunk.body,
            )
            for row in (by_id[id_] for id_ in ids if id_ in by_id)
        ]

    async def close(self) -> None:
        self.closed = True


def _check_protocol(store: InMemoryDocStore) -> DocStore:
    # mypy proves the fake satisfies the whole protocol here; nothing calls it.
    return store


EMPTY_REFRESH = RefreshResult(
    files=0, chunks=0, embedded=0, unchanged=0, deleted=0, rebuilt=False, warnings=()
)


class FakeSession(RetrievalSession):
    """`refresh_calls` counts every `refresh()`; `refresh` is returned, or raised when it is an
    exception. `fake_store` is the same store as `store`, typed as the fake."""

    def __init__(
        self,
        store: InMemoryDocStore | None = None,
        *,
        refresh: RefreshResult | BaseException = EMPTY_REFRESH,
    ) -> None:
        # Scoped to this call, so the stub selector's variable outlives no test.
        with mock.patch.dict(os.environ, {RETRIEVAL_STUB_ENV: "hash-v1"}):
            embedder, reranker = resolve_models(allow_remote=False)
        self.fake_store = InMemoryDocStore() if store is None else store
        super().__init__(
            store=self.fake_store,
            embedder=embedder,
            reranker=reranker,
            repo_root="",
            corpus_config={},
        )
        self.refresh_calls = 0
        self._refresh_outcome = refresh

    async def refresh(self) -> RefreshResult:
        self.refresh_calls += 1
        if isinstance(self._refresh_outcome, BaseException):
            raise self._refresh_outcome
        return self._refresh_outcome
