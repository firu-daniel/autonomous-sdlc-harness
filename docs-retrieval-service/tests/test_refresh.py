"""The rule this file exists to enforce, carried over from `refresh.ts`: the Markdown is the source
of truth and the index is always rebuildable from it, so a refresh never keeps a chunk the corpus no
longer has, re-embeds only a chunk whose key is new or whose hash moved, and an embedder change
discards every stored vector rather than mixing two models' vectors in one index. The end-state
rule, that every refresh that wrote and every index not marked rebuilt ends with
`rebuild_indexes()`, is asserted here on the fake, by call count, and on a real Postgres in
`tests/test_refresh_end_state_postgres.py`.

Each case builds a throwaway corpus under `tmp_path` and refreshes an `InMemoryDocStore` with the
`hash-v1` stub embedder, wrapped to record the size of every `embed_documents` batch.
"""

import asyncio
from collections.abc import Sequence
from pathlib import Path
from typing import Any

import pytest

from fakes import InMemoryDocStore, doc_chunk
from harness_docs_retrieval.chunk import DocChunk
from harness_docs_retrieval.models import Embedder
from harness_docs_retrieval.refresh import EMBED_BATCH_SIZE, RefreshResult, refresh_index
from harness_docs_retrieval.store import (
    EMBEDDER_META_KEY,
    INDEX_STATE_META_KEY,
    INDEX_STATE_PENDING,
    INDEX_STATE_REBUILT,
)
from harness_docs_retrieval.stubs import RETRIEVAL_STUB_ENV, resolve_models

CONFIG: dict[str, Any] = {
    "docs": {"root": "docs"},
    "layers": [{"name": "general", "path": ".", "conventions": "context/conventions.md"}],
}

ALPHA = "# Alpha\n\n## One\n\nfirst body\n\n## Two\n\nsecond body\n"
BETA = "# Beta\n\n## Three\n\nthird body\n"
CONVENTIONS = "# Conventions\n\n## Rule\n\nrule body\n"


class _RecordingEmbedder:
    def __init__(self, inner: Embedder) -> None:
        self.id = inner.id
        self.dimensions = inner.dimensions
        self.batches: list[int] = []
        self._inner = inner

    async def embed_documents(self, texts: Sequence[str]) -> list[list[float]]:
        self.batches.append(len(texts))
        return await self._inner.embed_documents(texts)

    async def embed_query(self, text: str) -> list[float]:
        return await self._inner.embed_query(text)


@pytest.fixture
def embedder(monkeypatch: pytest.MonkeyPatch) -> _RecordingEmbedder:
    monkeypatch.setenv(RETRIEVAL_STUB_ENV, "hash-v1")
    inner, _ = resolve_models(allow_remote=False)
    return _RecordingEmbedder(inner)


def _write(root: Path, path: str, text: str) -> None:
    target = root / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="utf-8", newline="")


def _corpus(root: Path) -> None:
    _write(root, "docs/a.md", ALPHA)
    _write(root, "docs/b.md", BETA)
    _write(root, "context/conventions.md", CONVENTIONS)


def _refresh(
    root: Path,
    store: InMemoryDocStore,
    embedder: _RecordingEmbedder,
    config: dict[str, Any] = CONFIG,
) -> RefreshResult:
    embedder.batches.clear()
    return asyncio.run(
        refresh_index(repo_root=str(root), config=config, store=store, embedder=embedder)
    )


def test_a_first_build_embeds_everything_and_is_not_a_rebuild(
    tmp_path: Path, embedder: _RecordingEmbedder
) -> None:
    _corpus(tmp_path)
    store = InMemoryDocStore()
    result = _refresh(tmp_path, store, embedder)
    assert result == RefreshResult(
        files=3, chunks=4, embedded=4, unchanged=0, deleted=0, rebuilt=False, warnings=()
    )
    assert embedder.batches == [4]
    assert store.meta[EMBEDDER_META_KEY] == embedder.id
    assert sorted(asyncio.run(store.list_chunk_hashes())) == [
        "context/conventions.md#rule",
        "docs/a.md#one",
        "docs/a.md#two",
        "docs/b.md#three",
    ]


def test_a_second_run_embeds_nothing(tmp_path: Path, embedder: _RecordingEmbedder) -> None:
    _corpus(tmp_path)
    store = InMemoryDocStore()
    _refresh(tmp_path, store, embedder)
    result = _refresh(tmp_path, store, embedder)
    assert (result.embedded, result.unchanged, result.deleted, result.rebuilt) == (0, 4, 0, False)
    assert embedder.batches == []


def test_editing_one_section_re_embeds_exactly_that_chunk(
    tmp_path: Path, embedder: _RecordingEmbedder
) -> None:
    _corpus(tmp_path)
    store = InMemoryDocStore()
    _refresh(tmp_path, store, embedder)
    before = dict(asyncio.run(store.list_chunk_hashes()))
    _write(tmp_path, "docs/a.md", ALPHA.replace("second body", "second body, edited"))
    result = _refresh(tmp_path, store, embedder)
    assert (result.embedded, result.unchanged, result.deleted) == (1, 3, 0)
    assert embedder.batches == [1]
    after = asyncio.run(store.list_chunk_hashes())
    assert [key for key in after if after[key] != before[key]] == ["docs/a.md#two"]


def test_changing_a_title_re_embeds_every_chunk_of_that_document(
    tmp_path: Path, embedder: _RecordingEmbedder
) -> None:
    # The expected cost `refresh.ts`'s header records: the title is part of each chunk's text.
    _corpus(tmp_path)
    store = InMemoryDocStore()
    _refresh(tmp_path, store, embedder)
    _write(tmp_path, "docs/a.md", ALPHA.replace("# Alpha", "# Alpha Prime"))
    result = _refresh(tmp_path, store, embedder)
    assert (result.embedded, result.unchanged, result.deleted) == (2, 2, 0)
    assert embedder.batches == [2]


def test_deleting_a_file_counts_its_chunks_as_deleted(
    tmp_path: Path, embedder: _RecordingEmbedder
) -> None:
    _corpus(tmp_path)
    store = InMemoryDocStore()
    _refresh(tmp_path, store, embedder)
    (tmp_path / "docs/a.md").unlink()
    result = _refresh(tmp_path, store, embedder)
    assert result == RefreshResult(
        files=2, chunks=2, embedded=0, unchanged=2, deleted=2, rebuilt=False, warnings=()
    )
    assert sorted(asyncio.run(store.list_chunk_hashes())) == [
        "context/conventions.md#rule",
        "docs/b.md#three",
    ]


def test_another_embedder_id_clears_the_store_and_rebuilds(
    tmp_path: Path, embedder: _RecordingEmbedder
) -> None:
    _corpus(tmp_path)
    store = InMemoryDocStore()
    store.meta[EMBEDDER_META_KEY] = "some-other-embedder"
    asyncio.run(store.upsert_chunks([doc_chunk("docs/a.md", "one")], [[1.0, 0.0]]))
    result = _refresh(tmp_path, store, embedder)
    # The cleared row is not counted as deleted, and its matching key is re-embedded, not kept.
    assert result == RefreshResult(
        files=3, chunks=4, embedded=4, unchanged=0, deleted=0, rebuilt=True, warnings=()
    )
    assert store.meta[EMBEDDER_META_KEY] == embedder.id
    hashes = asyncio.run(store.list_chunk_hashes())
    assert hashes["docs/a.md#one"] != doc_chunk("docs/a.md", "one").hash


def test_changed_chunks_are_embedded_in_batches_of_32(
    tmp_path: Path, embedder: _RecordingEmbedder
) -> None:
    assert EMBED_BATCH_SIZE == 32
    _corpus(tmp_path)
    store = InMemoryDocStore()
    _refresh(tmp_path, store, embedder)
    sections = "".join(f"## Section {n}\n\nbody {n}\n\n" for n in range(70))
    _write(tmp_path, "docs/many.md", f"# Many\n\n{sections}")
    result = _refresh(tmp_path, store, embedder)
    assert (result.embedded, result.unchanged) == (70, 4)
    assert embedder.batches == [32, 32, 6]


def test_a_missing_conventions_document_warning_is_passed_through(
    tmp_path: Path, embedder: _RecordingEmbedder
) -> None:
    _corpus(tmp_path)
    config: dict[str, Any] = {
        "docs": {"root": "docs"},
        "layers": [
            *CONFIG["layers"],
            {"name": "cli", "path": "cli", "conventions": "context/cli.md"},
        ],
    }
    result = _refresh(tmp_path, InMemoryDocStore(), embedder, config)
    assert result.warnings == (
        "conventions document context/cli.md of layer cli is missing and was skipped",
    )
    assert (result.files, result.chunks) == (3, 4)


class _FailingUpsertStore(InMemoryDocStore):
    async def upsert_chunks(
        self, chunks: Sequence[DocChunk], embeddings: Sequence[Sequence[float]]
    ) -> None:
        raise RuntimeError("upsert failed")


def test_a_first_build_rebuilds_once_and_marks_the_index_rebuilt(
    tmp_path: Path, embedder: _RecordingEmbedder
) -> None:
    _corpus(tmp_path)
    store = InMemoryDocStore()
    _refresh(tmp_path, store, embedder)
    assert store.rebuilds == 1
    assert store.meta[INDEX_STATE_META_KEY] == INDEX_STATE_REBUILT


def test_an_unchanged_refresh_over_a_rebuilt_index_does_not_rebuild(
    tmp_path: Path, embedder: _RecordingEmbedder
) -> None:
    _corpus(tmp_path)
    store = InMemoryDocStore()
    _refresh(tmp_path, store, embedder)
    store.rebuilds = 0
    _refresh(tmp_path, store, embedder)
    assert store.rebuilds == 0
    assert store.meta[INDEX_STATE_META_KEY] == INDEX_STATE_REBUILT


@pytest.mark.parametrize("index_state", [INDEX_STATE_PENDING, None])
def test_an_unchanged_refresh_over_an_index_not_marked_rebuilt_rebuilds_once(
    tmp_path: Path, embedder: _RecordingEmbedder, index_state: str | None
) -> None:
    # `None` is the database the shipped code left: rows and no index-state record.
    _corpus(tmp_path)
    store = InMemoryDocStore()
    _refresh(tmp_path, store, embedder)
    if index_state is None:
        del store.meta[INDEX_STATE_META_KEY]
    else:
        store.meta[INDEX_STATE_META_KEY] = index_state
    store.rebuilds = 0
    result = _refresh(tmp_path, store, embedder)
    assert (result.embedded, result.deleted) == (0, 0)
    assert store.rebuilds == 1
    assert store.meta[INDEX_STATE_META_KEY] == INDEX_STATE_REBUILT


def test_an_edit_rebuilds_once(tmp_path: Path, embedder: _RecordingEmbedder) -> None:
    _corpus(tmp_path)
    store = InMemoryDocStore()
    _refresh(tmp_path, store, embedder)
    store.rebuilds = 0
    _write(tmp_path, "docs/a.md", ALPHA.replace("second body", "second body, edited"))
    _refresh(tmp_path, store, embedder)
    assert store.rebuilds == 1
    assert store.meta[INDEX_STATE_META_KEY] == INDEX_STATE_REBUILT


def test_a_deletion_rebuilds_once(tmp_path: Path, embedder: _RecordingEmbedder) -> None:
    _corpus(tmp_path)
    store = InMemoryDocStore()
    _refresh(tmp_path, store, embedder)
    store.rebuilds = 0
    (tmp_path / "docs/a.md").unlink()
    result = _refresh(tmp_path, store, embedder)
    assert (result.embedded, result.deleted) == (0, 2)
    assert store.rebuilds == 1
    assert store.meta[INDEX_STATE_META_KEY] == INDEX_STATE_REBUILT


def test_an_embedder_change_rebuilds_once(tmp_path: Path, embedder: _RecordingEmbedder) -> None:
    _corpus(tmp_path)
    store = InMemoryDocStore()
    _refresh(tmp_path, store, embedder)
    store.meta[EMBEDDER_META_KEY] = "some-other-embedder"
    store.rebuilds = 0
    result = _refresh(tmp_path, store, embedder)
    assert result.rebuilt
    assert store.rebuilds == 1
    assert store.meta[INDEX_STATE_META_KEY] == INDEX_STATE_REBUILT


def test_a_refresh_interrupted_after_a_write_leaves_the_index_pending(
    tmp_path: Path, embedder: _RecordingEmbedder
) -> None:
    _corpus(tmp_path)
    store = _FailingUpsertStore()
    with pytest.raises(RuntimeError, match="upsert failed"):
        _refresh(tmp_path, store, embedder)
    assert store.rebuilds == 0
    assert store.meta[INDEX_STATE_META_KEY] == INDEX_STATE_PENDING
