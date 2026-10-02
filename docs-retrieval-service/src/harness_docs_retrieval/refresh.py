"""Bringing the docs-retrieval index in line with the corpus, incrementally; a port of
`cli/src/retrieval/refresh.ts`.

The rule this module exists to enforce, carried over from `refresh.ts`: the Markdown is the source
of truth and the index is always rebuildable from it, so nothing stored here is authoritative. A
refresh never keeps a chunk the corpus no longer has, and an embedder change discards every stored
vector rather than mixing two models' vectors in one index.

Expected cost, as `refresh.ts` records it: a document whose title changed re-embeds every one of its
chunks, because the title is part of each chunk's embedded `text`.
"""

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

from harness_docs_retrieval.chunk import DocChunk, chunk_markdown
from harness_docs_retrieval.corpus import corpus_files, read_corpus_file
from harness_docs_retrieval.models import Embedder
from harness_docs_retrieval.store import EMBEDDER_META_KEY, DocStore


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
    `EMBED_BATCH_SIZE` and upserted; (5) the rest count as unchanged."""
    rebuilt = False
    stored_embedder = await store.read_meta(EMBEDDER_META_KEY)
    if stored_embedder != embedder.id:
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
    await store.delete_chunks(gone)

    changed = [chunk for chunk in chunks if stored.get(chunk.key) != chunk.hash]
    for start in range(0, len(changed), EMBED_BATCH_SIZE):
        batch = changed[start : start + EMBED_BATCH_SIZE]
        embeddings = await embedder.embed_documents([chunk.text for chunk in batch])
        await store.upsert_chunks(batch, embeddings)

    return RefreshResult(
        files=len(corpus.files),
        chunks=len(chunks),
        embedded=len(changed),
        unchanged=len(chunks) - len(changed),
        deleted=len(gone),
        rebuilt=rebuilt,
        warnings=corpus.warnings,
    )
