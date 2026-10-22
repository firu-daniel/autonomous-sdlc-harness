"""`refresh_index`'s end state on a real Postgres, read through the BM25 index scan's own ranking
score; a port of `cli/test/docs-retrieval-refresh-end-state.test.mjs`.

The rule this file exists to enforce: after a refresh, every ranking score equals the score a fresh
build of the final corpus ranks by, whatever the index's history. The reference is a refresh of the
final corpus into its own database followed by a raw `REINDEX INDEX chunks_bm25`.

Scores are `bm25_get_current_score()` read under `SET enable_seqscan = off`, which forces the index
scan and never disables it, and each comparison is exact. A query whose `negativeKind` is `far`
carries no corpus term by construction, so its reference is empty; it is still compared, and every
other query's reference must be non-empty.

Case (d) pins the marker's other two branches, which no score comparison can see.

The corpus is `evals/docs-retrieval/corpora/fixture-catalog/docs/*.md`, copied under `tmp_path`;
the queries are every `query` of `evals/docs-retrieval/queries/fixture-catalog.jsonl`. Vectors come
from the `hash-v1` stub, so no weights load. The module is skipped wherever
`HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL` is unset.
"""

import asyncio
import json
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any

import psycopg
import pytest

from harness_docs_retrieval.chunk import DocChunk, chunk_markdown
from harness_docs_retrieval.models import EMBEDDING_DIMENSIONS, Embedder
from harness_docs_retrieval.refresh import RefreshResult, refresh_index
from harness_docs_retrieval.store import (
    BM25_INDEX,
    BM25_ORDER_CLAUSE,
    CHUNKS_TABLE,
    INDEX_STATE_META_KEY,
    INDEX_STATE_PENDING,
    INDEX_STATE_REBUILT,
    DocStore,
    RankedId,
    StoredChunk,
    open_postgres_store,
)
from harness_docs_retrieval.stubs import RETRIEVAL_STUB_ENV, resolve_models
from ts_bridge import CHECKOUT_ROOT

pytestmark = pytest.mark.container

CONFIG: dict[str, Any] = {"docs": {"root": "docs"}, "layers": []}

_CORPUS_DIR = CHECKOUT_ROOT / "evals" / "docs-retrieval" / "corpora" / "fixture-catalog" / "docs"
_QUERIES_FILE = CHECKOUT_ROOT / "evals" / "docs-retrieval" / "queries" / "fixture-catalog.jsonl"

LABELS_APPENDIX = (
    "\n## Reprinting at the counter\n\n"
    "A shipper who brings a parcel to the depot counter with a damaged label can have the same "
    "barcode reprinted there; the identifier is kept, so the tracking stream is unbroken.\n"
)

ADDED_DOC = {
    "docs/returns.md": (
        "# Returns\n\n## Return to sender\n\n"
        "A parcel the recipient refuses travels back through the depot it left, and the shipper is "
        "charged the return leg at the rate of the original shipment.\n"
    ),
}

EXTRA_DOC = {
    "docs/customs.md": (
        "# Customs\n\n## Declarations\n\n"
        "A parcel crossing a border carries a declaration; the depot holds it until customs clears "
        "the parcel and its label.\n"
    ),
}

SCORE_SELECT = (
    f"SELECT key, bm25_get_current_score() AS scan FROM {CHUNKS_TABLE} "
    f"ORDER BY {BM25_ORDER_CLAUSE} LIMIT $2"
)

Scores = dict[str, list[tuple[str, float]]]


def _corpus() -> dict[str, str]:
    return {
        f"docs/{path.name}": path.read_text(encoding="utf-8")
        for path in sorted(_CORPUS_DIR.glob("*.md"))
    }


def _queries() -> list[tuple[str, bool]]:
    """Each query, with whether its reference must be non-empty."""
    rows = [json.loads(line) for line in _QUERIES_FILE.read_text(encoding="utf-8").splitlines()]
    return [(str(row["query"]), row.get("negativeKind") != "far") for row in rows if row]


def _write_tree(root: Path, files: Mapping[str, str]) -> None:
    for path, text in files.items():
        target = root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding="utf-8", newline="")


def _chunk_count(files: Mapping[str, str]) -> int:
    return sum(len(chunk_markdown(path, text)) for path, text in files.items())


def _embedder() -> Embedder:
    embedder, _ = resolve_models(allow_remote=False)
    return embedder


async def _refresh_into(root: Path, url: str) -> RefreshResult:
    store = await open_postgres_store(url, EMBEDDING_DIMENSIONS)
    try:
        return await refresh_index(
            repo_root=str(root), config=CONFIG, store=store, embedder=_embedder()
        )
    finally:
        await store.close()


def _read_scores(url: str, limit: int) -> Scores:
    """Every query's `(key, scan)` list through the forced index scan, after asserting the plan is
    that scan. Rows of equal score come back in heap order, which history moves, so they are
    ordered by key; no score is rounded."""
    scores: Scores = {}
    with psycopg.connect(url, cursor_factory=psycopg.RawCursor) as conn:
        conn.execute("SET enable_seqscan = off")
        for query, _ in _queries():
            plan = "\n".join(
                str(row[0])
                for row in conn.execute(
                    f"EXPLAIN (COSTS OFF) {SCORE_SELECT}", [query, limit]
                ).fetchall()
            )
            assert f"Index Scan using {BM25_INDEX}" in plan, (
                f'the score statement for "{query}" did not take the {BM25_INDEX} index scan:\n'
                f"{plan}"
            )
            rows = conn.execute(SCORE_SELECT, [query, limit]).fetchall()
            scores[query] = sorted(
                ((str(key), float(scan)) for key, scan in rows), key=lambda pair: (pair[1], pair[0])
            )
    return scores


async def _reference(files: Mapping[str, str], root: Path, url: str) -> Scores:
    _write_tree(root, files)
    await _refresh_into(root, url)
    with psycopg.connect(url, autocommit=True) as conn:
        conn.execute(f"REINDEX INDEX {BM25_INDEX}")
    return _read_scores(url, _chunk_count(files))


def _assert_scores_equal(actual: Scores, expected: Scores) -> None:
    for query, must_match in _queries():
        if must_match:
            assert expected[query], f'the reference matched nothing for "{query}"'
        assert actual[query] == expected[query], (
            f'"{query}" ranks differently from a fresh build of the final corpus'
        )


@pytest.fixture(autouse=True)
def _stub_embedder(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(RETRIEVAL_STUB_ENV, "hash-v1")


def test_a_refresh_with_deletes_ranks_as_a_fresh_build_does(
    tmp_path: Path, fresh_database_url: str, reference_database_url: str
) -> None:
    """(a)"""
    files = _corpus()
    root = tmp_path / "history"
    _write_tree(root, files)

    async def main() -> None:
        await _refresh_into(root, fresh_database_url)

        final = dict(files)
        final["docs/labels.md"] = files["docs/labels.md"] + LABELS_APPENDIX
        del final["docs/webhooks.md"]
        final.update(ADDED_DOC)
        _write_tree(root, final)
        (root / "docs" / "webhooks.md").unlink()
        result = await _refresh_into(root, fresh_database_url)
        assert result.embedded > 0 and result.deleted > 0, f"the second refresh: {result}"

        actual = _read_scores(fresh_database_url, _chunk_count(final))
        expected = await _reference(final, tmp_path / "reference", reference_database_url)
        _assert_scores_equal(actual, expected)

    asyncio.run(main())


def test_a_fresh_build_on_an_empty_database_ranks_as_a_rebuilt_one_does(
    tmp_path: Path, fresh_database_url: str, reference_database_url: str
) -> None:
    """(b)"""
    files = _corpus()
    root = tmp_path / "build"
    _write_tree(root, files)

    async def main() -> None:
        await _refresh_into(root, fresh_database_url)
        actual = _read_scores(fresh_database_url, _chunk_count(files))
        expected = await _reference(files, tmp_path / "reference", reference_database_url)
        _assert_scores_equal(actual, expected)

    asyncio.run(main())


def test_an_unchanged_refresh_brings_a_database_the_shipped_code_left_to_the_end_state(
    tmp_path: Path, fresh_database_url: str, reference_database_url: str
) -> None:
    """(c)"""
    files = _corpus()
    root = tmp_path / "shipped"
    _write_tree(root, {**files, **EXTRA_DOC})

    async def main() -> None:
        await _refresh_into(root, fresh_database_url)

        store = await open_postgres_store(fresh_database_url, EMBEDDING_DIMENSIONS)
        try:
            extra_keys = [
                key
                for key in await store.list_chunk_hashes()
                if any(key.startswith(path) for path in EXTRA_DOC)
            ]
            assert extra_keys, "the extra document produced no chunk"
            await store.delete_chunks(extra_keys)
        finally:
            await store.close()
        with psycopg.connect(fresh_database_url, cursor_factory=psycopg.RawCursor) as conn:
            conn.execute("DELETE FROM meta WHERE key = $1", [INDEX_STATE_META_KEY])
        for path in EXTRA_DOC:
            (root / path).unlink()

        result = await _refresh_into(root, fresh_database_url)
        assert result.embedded == 0, f"the refresh re-embedded: {result}"
        assert result.deleted == 0, f"the refresh deleted: {result}"

        actual = _read_scores(fresh_database_url, _chunk_count(files))
        expected = await _reference(files, tmp_path / "reference", reference_database_url)
        _assert_scores_equal(actual, expected)

    asyncio.run(main())


class _CountingStore:
    """`DocStore` with its `rebuild_indexes()` calls counted; every other method delegates."""

    def __init__(self, inner: DocStore) -> None:
        self.inner = inner
        self.rebuilds = 0

    async def read_meta(self, key: str) -> str | None:
        return await self.inner.read_meta(key)

    async def write_meta(self, key: str, value: str) -> None:
        await self.inner.write_meta(key, value)

    async def list_chunk_hashes(self) -> Mapping[str, str]:
        return await self.inner.list_chunk_hashes()

    async def upsert_chunks(
        self, chunks: Sequence[DocChunk], embeddings: Sequence[Sequence[float]]
    ) -> None:
        await self.inner.upsert_chunks(chunks, embeddings)

    async def delete_chunks(self, keys: Sequence[str]) -> None:
        await self.inner.delete_chunks(keys)

    async def clear(self) -> None:
        await self.inner.clear()

    async def lexical_search(self, query: str, limit: int) -> list[RankedId]:
        return await self.inner.lexical_search(query, limit)

    async def vector_search(self, embedding: Sequence[float], limit: int) -> list[RankedId]:
        return await self.inner.vector_search(embedding, limit)

    async def get_chunks(self, ids: Sequence[int]) -> list[StoredChunk]:
        return await self.inner.get_chunks(ids)

    async def rebuild_indexes(self) -> None:
        self.rebuilds += 1
        await self.inner.rebuild_indexes()

    async def close(self) -> None:
        await self.inner.close()


def test_an_unchanged_refresh_rebuilds_an_index_marked_pending_and_leaves_one_marked_rebuilt(
    tmp_path: Path, fresh_database_url: str
) -> None:
    """(d)"""
    root = tmp_path / "marker"
    _write_tree(root, _corpus())

    async def main() -> None:
        await _refresh_into(root, fresh_database_url)

        store = await open_postgres_store(fresh_database_url, EMBEDDING_DIMENSIONS)
        try:
            assert await store.read_meta(INDEX_STATE_META_KEY) == INDEX_STATE_REBUILT, (
                "a first build did not mark the index rebuilt"
            )

            quiet = _CountingStore(store)
            unchanged = await refresh_index(
                repo_root=str(root), config=CONFIG, store=quiet, embedder=_embedder()
            )
            assert unchanged.embedded + unchanged.deleted == 0, f"the refresh wrote: {unchanged}"
            assert quiet.rebuilds == 0, (
                "an unchanged refresh over an index marked rebuilt rebuilt it"
            )

            # The state a refresh interrupted after its first write leaves.
            await store.write_meta(INDEX_STATE_META_KEY, INDEX_STATE_PENDING)
            resumed = _CountingStore(store)
            await refresh_index(
                repo_root=str(root), config=CONFIG, store=resumed, embedder=_embedder()
            )
            assert resumed.rebuilds == 1, (
                "an unchanged refresh over an index marked pending did not rebuild it"
            )
            assert await store.read_meta(INDEX_STATE_META_KEY) == INDEX_STATE_REBUILT, (
                "the rebuild did not mark the index rebuilt"
            )
        finally:
            await store.close()

    asyncio.run(main())
