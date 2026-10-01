"""The rule this file exists to enforce: `open_postgres_store` keeps the `DocStore` contract on a
real Postgres with `pgvector` and `pg_textsearch`, and an untrusted query reaches SQL only as a
bound parameter.

Every case runs against a throwaway database from `fresh_database_url`, and the module is skipped
loudly wherever `HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL` is unset. Vectors come from the
`hash-v1` stub embedder, so they are real 384-wide vectors with no weights.
"""

import asyncio
from collections.abc import Awaitable, Callable

import psycopg
import pytest

from harness_docs_retrieval.chunk import DocChunk, chunk_markdown
from harness_docs_retrieval.models import EMBEDDING_DIMENSIONS
from harness_docs_retrieval.store import (
    DIMENSIONS_META_KEY,
    EMBEDDER_META_KEY,
    DocStore,
    StoredChunk,
    open_postgres_store,
)
from harness_docs_retrieval.stubs import RETRIEVAL_STUB_ENV, resolve_models

pytestmark = pytest.mark.container

MARKDOWN = """# Guide

## Alpha

Zebras graze the savanna at dawn.

## Beta

Lighthouses warn ships off the rocks.

## Gamma

Glaciers carve valleys over centuries.
"""


def _chunks() -> list[DocChunk]:
    chunks = chunk_markdown("docs/guide.md", MARKDOWN)
    assert len(chunks) == 3
    return chunks


async def _vectors(chunks: list[DocChunk]) -> list[list[float]]:
    embedder, _ = resolve_models(allow_remote=False)
    return await embedder.embed_documents([chunk.text for chunk in chunks])


async def _id_of(store: DocStore, vector: list[float]) -> int:
    return (await store.vector_search(vector, 1))[0].id


def _run(
    monkeypatch: pytest.MonkeyPatch,
    url: str,
    scenario: Callable[[DocStore, list[DocChunk], list[list[float]]], Awaitable[None]],
) -> None:
    monkeypatch.setenv(RETRIEVAL_STUB_ENV, "hash-v1")

    async def main() -> None:
        chunks = _chunks()
        vectors = await _vectors(chunks)
        store = await open_postgres_store(url, EMBEDDING_DIMENSIONS)
        try:
            await store.upsert_chunks(chunks, vectors)
            await scenario(store, chunks, vectors)
        finally:
            await store.close()

    asyncio.run(main())


def test_an_upsert_lists_the_hashes(
    monkeypatch: pytest.MonkeyPatch, fresh_database_url: str
) -> None:
    async def scenario(store: DocStore, chunks: list[DocChunk], _: list[list[float]]) -> None:
        assert dict(await store.list_chunk_hashes()) == {c.key: c.hash for c in chunks}

    _run(monkeypatch, fresh_database_url, scenario)


def test_a_lexical_search_ranks_the_one_holder_first(
    monkeypatch: pytest.MonkeyPatch, fresh_database_url: str
) -> None:
    async def scenario(
        store: DocStore, chunks: list[DocChunk], vectors: list[list[float]]
    ) -> None:
        lighthouse = await _id_of(store, vectors[1])
        hits = await store.lexical_search("lighthouses", 10)
        assert hits[0].id == lighthouse
        assert hits[0].rank == 1
        assert await store.lexical_search(" \t\n", 10) == []

    _run(monkeypatch, fresh_database_url, scenario)


def test_a_vector_search_ranks_the_own_vector_first(
    monkeypatch: pytest.MonkeyPatch, fresh_database_url: str
) -> None:
    async def scenario(
        store: DocStore, chunks: list[DocChunk], vectors: list[list[float]]
    ) -> None:
        for chunk, vector in zip(chunks, vectors, strict=True):
            hits = await store.vector_search(vector, 3)
            assert [hit.rank for hit in hits] == [1, 2, 3]
            [first] = await store.get_chunks([hits[0].id])
            assert first.key == chunk.key

    _run(monkeypatch, fresh_database_url, scenario)


def test_get_chunks_keeps_the_given_order_and_skips_unknown_ids(
    monkeypatch: pytest.MonkeyPatch, fresh_database_url: str
) -> None:
    async def scenario(
        store: DocStore, chunks: list[DocChunk], vectors: list[list[float]]
    ) -> None:
        a = await _id_of(store, vectors[0])
        b = await _id_of(store, vectors[1])
        missing = max(a, b) + 1000
        got = await store.get_chunks([b, missing, a])
        expected = [
            StoredChunk(
                id=id_,
                key=chunk.key,
                path=chunk.path,
                anchor=chunk.anchor,
                heading=chunk.heading,
                body=chunk.body,
            )
            for id_, chunk in ((b, chunks[1]), (a, chunks[0]))
        ]
        assert got == expected

    _run(monkeypatch, fresh_database_url, scenario)


def test_an_injection_shaped_query_is_only_a_query(
    monkeypatch: pytest.MonkeyPatch, fresh_database_url: str
) -> None:
    async def scenario(store: DocStore, chunks: list[DocChunk], _: list[list[float]]) -> None:
        await store.lexical_search("'); DROP TABLE chunks; --", 10)
        assert set(await store.list_chunk_hashes()) == {c.key for c in chunks}

    _run(monkeypatch, fresh_database_url, scenario)


def test_delete_and_clear(monkeypatch: pytest.MonkeyPatch, fresh_database_url: str) -> None:
    async def scenario(store: DocStore, chunks: list[DocChunk], _: list[list[float]]) -> None:
        await store.delete_chunks([])
        assert len(await store.list_chunk_hashes()) == 3
        await store.delete_chunks([chunks[0].key])
        assert set(await store.list_chunk_hashes()) == {chunks[1].key, chunks[2].key}

        await store.write_meta(EMBEDDER_META_KEY, "stub-hash:hash-v1")
        await store.clear()
        assert dict(await store.list_chunk_hashes()) == {}
        assert await store.read_meta(EMBEDDER_META_KEY) == "stub-hash:hash-v1"
        assert await store.read_meta(DIMENSIONS_META_KEY) == str(EMBEDDING_DIMENSIONS)

    _run(monkeypatch, fresh_database_url, scenario)


def test_reopening_at_another_width_drops_the_chunks_and_the_embedder(
    monkeypatch: pytest.MonkeyPatch, fresh_database_url: str
) -> None:
    async def scenario(store: DocStore, chunks: list[DocChunk], _: list[list[float]]) -> None:
        await store.write_meta(EMBEDDER_META_KEY, "stub-hash:hash-v1")
        await store.close()

        narrow = await open_postgres_store(fresh_database_url, 8)
        try:
            assert dict(await narrow.list_chunk_hashes()) == {}
            assert await narrow.read_meta(EMBEDDER_META_KEY) is None
            assert await narrow.read_meta(DIMENSIONS_META_KEY) == "8"
            await narrow.upsert_chunks(chunks[:1], [[1.0] + [0.0] * 7])
            assert len(await narrow.list_chunk_hashes()) == 1
        finally:
            await narrow.close()

    _run(monkeypatch, fresh_database_url, scenario)


def _other_backends(url: str) -> int:
    with psycopg.connect(url) as conn:
        row = conn.execute(
            "SELECT count(*) FROM pg_stat_activity "
            "WHERE datname = current_database() AND pid <> pg_backend_pid()"
        ).fetchone()
        assert row is not None
        return int(row[0])


def test_close_releases_the_connection(
    monkeypatch: pytest.MonkeyPatch, fresh_database_url: str
) -> None:
    async def scenario(store: DocStore, _: list[DocChunk], __: list[list[float]]) -> None:
        assert _other_backends(fresh_database_url) == 1
        await store.close()
        with pytest.raises(psycopg.OperationalError):
            await store.read_meta(DIMENSIONS_META_KEY)
        # The server reaps a closed backend asynchronously, so the count is polled, not timed.
        for _attempt in range(100):
            if _other_backends(fresh_database_url) == 0:
                break
            await asyncio.sleep(0.05)
        assert _other_backends(fresh_database_url) == 0

    _run(monkeypatch, fresh_database_url, scenario)
