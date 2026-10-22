"""Bringing the docs-retrieval index in line with the corpus, incrementally; a port of
`cli/src/retrieval/refresh.ts`.

The rule this module exists to enforce, carried over from `refresh.ts`: the Markdown is the source
of truth and the index is always rebuildable from it, so nothing stored here is authoritative. A
refresh never keeps a chunk the corpus no longer has, and an embedder change discards every stored
vector rather than mixing two models' vectors in one index. The index's ranking state is derived
from the stored rows alone, not from the history of writes that produced them: every refresh that
wrote, and every index not marked `INDEX_STATE_REBUILT`, ends with `DocStore.rebuild_indexes`.

Expected cost, as `refresh.ts` records it: a document whose title changed re-embeds every one of its
chunks, because the title is part of each chunk's embedded `text`.
"""

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

from harness_docs_retrieval.chunk import DocChunk, chunk_markdown
from harness_docs_retrieval.corpus import corpus_files, read_corpus_file
from harness_docs_retrieval.models import Embedder
from harness_docs_retrieval.store import (
    EMBEDDER_META_KEY,
    INDEX_STATE_META_KEY,
    INDEX_STATE_PENDING,
    INDEX_STATE_REBUILT,
    DocStore,
)


@dataclass(frozen=True)
class RefreshResult:
    """What one refresh did."""

    files: int
    chunks: int
    embedded: int
    unchanged: int
    # Chunks whose file or heading is gone; rows a rebuild cleared are not counted.
    deleted: int
    # A stored embedder id differed from this one; a first build, none stored, is not a rebuild.
    rebuilt: bool
    warnings: tuple[str, ...]


EMBED_BATCH_SIZE = 32


async def refresh_index(
    *, repo_root: str, config: Mapping[str, Any], store: DocStore, embedder: Embedder
) -> RefreshResult:
    """`refreshIndex`: (1) an embedder id differing from the stored one, or none stored, clears the
    index and records the new id; (2) every corpus file is chunked; (3) every stored key not in that
    set is deleted; (4) chunks whose key is new or whose hash moved are embedded in batches of
    `EMBED_BATCH_SIZE` and upserted; (5) the rest count as unchanged; (6) a refresh that wrote, or
    whose index was not marked `INDEX_STATE_REBUILT` when it started, calls
    `DocStore.rebuild_indexes` and marks it rebuilt. `INDEX_STATE_PENDING` is recorded before the
    first write, so a refresh interrupted after one leaves an index the next refresh rebuilds."""
    index_state = await store.read_meta(INDEX_STATE_META_KEY)
    wrote = False

    async def before_write() -> None:
        nonlocal wrote
        if wrote:
            return
        wrote = True
        await store.write_meta(INDEX_STATE_META_KEY, INDEX_STATE_PENDING)

    rebuilt = False
    stored_embedder = await store.read_meta(EMBEDDER_META_KEY)
    if stored_embedder != embedder.id:
        await before_write()
        await store.clear()
        await store.write_meta(EMBEDDER_META_KEY, embedder.id)
        rebuilt = stored_embedder is not None

    corpus = corpus_files(repo_root, config)
    chunks: list[DocChunk] = [
        chunk
        for path in corpus.files
        for chunk in chunk_markdown(path, read_corpus_file(repo_root, path))
    ]

    stored = await store.list_chunk_hashes()
    current = {chunk.key for chunk in chunks}
    gone = [key for key in stored if key not in current]
    if gone:
        await before_write()
        await store.delete_chunks(gone)

    changed = [chunk for chunk in chunks if stored.get(chunk.key) != chunk.hash]
    for start in range(0, len(changed), EMBED_BATCH_SIZE):
        batch = changed[start : start + EMBED_BATCH_SIZE]
        embeddings = await embedder.embed_documents([chunk.text for chunk in batch])
        await before_write()
        await store.upsert_chunks(batch, embeddings)

    if wrote or index_state != INDEX_STATE_REBUILT:
        await store.rebuild_indexes()
        await store.write_meta(INDEX_STATE_META_KEY, INDEX_STATE_REBUILT)

    return RefreshResult(
        files=len(corpus.files),
        chunks=len(chunks),
        embedded=len(changed),
        unchanged=len(chunks) - len(changed),
        deleted=len(gone),
        rebuilt=rebuilt,
        warnings=corpus.warnings,
    )
