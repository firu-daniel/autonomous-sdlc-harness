"""The docs-retrieval index store on a real Postgres; a port of `cli/src/retrieval/store.ts`.

The rule this module exists to enforce, carried over from `store.ts`: every value reaches SQL as a
bound parameter, and the SQL stays plain Postgres plus the `vector` and `pg_textsearch` extensions.
A search query comes from an agent and is untrusted, so no input is ever spliced into a statement;
the two spliced tokens are the `vector(<dimensions>)` column type, taken from a checked integer, and
the constant index name inside `to_bm25query($1, 'chunks_bm25')`.

Every statement is `store.ts`'s, character for character, and lives in `statements`, which the
methods read. The connection's cursor is `psycopg.AsyncRawCursor`, which binds PostgreSQL-native
`$1` placeholders, so no statement is rewritten into psycopg's `%s` form.

Departures from store.ts:

- PGlite loads `vector` and `pg_textsearch` through `PGlite.create`'s `extensions` option. A real
  Postgres has no client-side equivalent: both extensions must be installed on the server, and any
  preload setting they need is the server's configuration. The `CREATE EXTENSION IF NOT EXISTS`
  statement itself carries over unchanged.
- `openPgliteStore` takes a `dataDir` and creates it; here the database is the server's, reached
  by connection string, and this module creates no directory. The index is therefore one per
  database rather than one per checkout: two checkouts sharing a connection string share one
  `chunks` table, and each refresh deletes the other's rows.
- `vectorLiteral` formats each value with JS `String(value)`; `_vector_literal` uses Python's
  shortest round-trip `repr`. The two parse to the same number (`1` against `1.0`, `1e-7` against
  `1e-07`), but the bound text is not always byte-identical.
- A programming error that `store.ts` throws through `internal(…)` raises `ValueError` here.
"""

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Any, Protocol

import psycopg

from harness_docs_retrieval.chunk import DocChunk
from harness_docs_retrieval.errors import ServiceError, one_line
from harness_docs_retrieval.jscompat import js_trim

CHUNKS_TABLE = "chunks"

# Spliced rather than bound: see the spliced-token clause above.
BM25_INDEX = "chunks_bm25"

# Everything after the index name in the BM25 index's `CREATE INDEX`. The `IF NOT EXISTS` is the
# open path's alone, so a caller building the index after its rows composes it without one.
BM25_INDEX_DEFINITION = f"ON {CHUNKS_TABLE} USING bm25 (text) WITH (text_config='english')"

# The lexical arm's ordering clause; `$1` is the bound query text.
BM25_ORDER_CLAUSE = f"text <@> to_bm25query($1, '{BM25_INDEX}')"

CHUNK_TEXT_COLUMN = "text text NOT NULL"

# The meta key recording the width the `chunks.embedding` column was created with.
DIMENSIONS_META_KEY = "dimensions"

# The meta key refresh compares against the embedder's id; cleared when the column is recreated.
EMBEDDER_META_KEY = "embedder"

DATABASE_URL_ENV = "HARNESS_DOCS_RETRIEVAL_DATABASE_URL"


def _check_dimensions(dimensions: object) -> int:
    # `bool` is an `int` subclass, and `True` would splice as `vector(True)`.
    if isinstance(dimensions, bool) or not isinstance(dimensions, int) or dimensions <= 0:
        raise ValueError(
            f"the store was given {dimensions!r} dimensions, which is not a positive integer"
        )
    return dimensions


def chunk_embedding_column(dimensions: int) -> str:
    """The embedding column's declaration; its width sets the rows per page a scan is costed on."""
    return f"embedding vector({_check_dimensions(dimensions)}) NOT NULL"


def statements(dimensions: int) -> Mapping[str, str]:
    """Every statement the store issues, keyed by its use; the methods read them from here."""
    embedding_column = chunk_embedding_column(dimensions)
    return {
        "create_extensions": (
            "CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS pg_textsearch;"
        ),
        "create_meta": (
            "CREATE TABLE IF NOT EXISTS meta (key text PRIMARY KEY, value text NOT NULL)"
        ),
        "read_meta": "SELECT value FROM meta WHERE key = $1",
        "write_meta": (
            "INSERT INTO meta (key, value) VALUES ($1, $2) "
            "ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value"
        ),
        "drop_chunks": f"DROP TABLE IF EXISTS {CHUNKS_TABLE}",
        "delete_meta": "DELETE FROM meta WHERE key = $1",
        "create_chunks": (
            f"CREATE TABLE IF NOT EXISTS {CHUNKS_TABLE} (id serial PRIMARY KEY, "
            "key text UNIQUE NOT NULL, path text NOT NULL, "
            "anchor text NOT NULL, heading text NOT NULL, body text NOT NULL, "
            f"{CHUNK_TEXT_COLUMN}, hash text NOT NULL, "
            f"{embedding_column})"
        ),
        "create_hnsw": (
            f"CREATE INDEX IF NOT EXISTS chunks_hnsw ON {CHUNKS_TABLE} "
            "USING hnsw (embedding vector_cosine_ops)"
        ),
        "create_bm25": f"CREATE INDEX IF NOT EXISTS {BM25_INDEX} {BM25_INDEX_DEFINITION}",
        "list_chunk_hashes": f"SELECT key, hash FROM {CHUNKS_TABLE}",
        "upsert_chunk": (
            f"INSERT INTO {CHUNKS_TABLE} (key, path, anchor, heading, body, text, hash, embedding) "
            "VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector) "
            "ON CONFLICT (key) DO UPDATE SET path = EXCLUDED.path, anchor = EXCLUDED.anchor, "
            "heading = EXCLUDED.heading, "
            "body = EXCLUDED.body, text = EXCLUDED.text, hash = EXCLUDED.hash, "
            "embedding = EXCLUDED.embedding"
        ),
        "delete_chunks": f"DELETE FROM {CHUNKS_TABLE} WHERE key = ANY($1::text[])",
        "clear": f"DELETE FROM {CHUNKS_TABLE}",
        "lexical_search": f"SELECT id FROM {CHUNKS_TABLE} ORDER BY {BM25_ORDER_CLAUSE} LIMIT $2",
        "vector_search": (
            f"SELECT id FROM {CHUNKS_TABLE} ORDER BY embedding <=> $1::vector LIMIT $2"
        ),
        "get_chunks": (
            f"SELECT id, key, path, anchor, heading, body FROM {CHUNKS_TABLE} "
            "WHERE id = ANY($1::int[])"
        ),
    }


@dataclass(frozen=True)
class StoredChunk:
    """A stored chunk as a search result cites it."""

    id: int
    key: str
    path: str
    anchor: str
    heading: str
    body: str


@dataclass(frozen=True)
class RankedId:
    """One arm's hit; `rank` is 1-based within that arm, as reciprocal rank fusion reads it."""

    id: int
    rank: int


class DocStore(Protocol):
    """The index as refresh and search see it, independent of the database behind it."""

    async def read_meta(self, key: str) -> str | None: ...

    async def write_meta(self, key: str, value: str) -> None: ...

    async def list_chunk_hashes(self) -> Mapping[str, str]:
        """key -> hash"""
        ...

    async def upsert_chunks(
        self, chunks: Sequence[DocChunk], embeddings: Sequence[Sequence[float]]
    ) -> None: ...

    async def delete_chunks(self, keys: Sequence[str]) -> None: ...

    async def clear(self) -> None:
        """Removes every chunk; meta is kept."""
        ...

    async def lexical_search(self, query: str, limit: int) -> list[RankedId]:
        """The best-scoring chunks for the query, lower-is-better score first, up to `limit`.

        **Not necessarily only matching chunks:** the filter to matching rows belongs to the BM25
        index scan rather than to the `<@>` operator, so a plan that falls back to a sequential
        scan, which a small corpus does, returns non-matching rows at score `0` after the matches.
        Measured in `docs/retrieval.md` → `## Measured, and how`, item (b).
        """
        ...

    async def vector_search(self, embedding: Sequence[float], limit: int) -> list[RankedId]:
        """Nearest chunks by cosine distance, best first."""
        ...

    async def get_chunks(self, ids: Sequence[int]) -> list[StoredChunk]:
        """The chunks with these ids, in the order the ids were given; an unknown id is skipped."""
        ...

    async def close(self) -> None: ...


def _vector_literal(embedding: Sequence[float]) -> str:
    """A vector as pgvector's text input form, bound as `$n::vector`."""
    return "[" + ",".join(repr(float(value)) for value in embedding) + "]"


def _ranked(rows: Sequence[tuple[Any, ...]]) -> list[RankedId]:
    return [RankedId(id=int(row[0]), rank=index + 1) for index, row in enumerate(rows)]


class _PostgresStore:
    def __init__(self, conn: psycopg.AsyncConnection[tuple[Any, ...]], dimensions: int) -> None:
        self._conn = conn
        self._dimensions = dimensions
        self._sql = statements(dimensions)

    async def read_meta(self, key: str) -> str | None:
        cursor = await self._conn.execute(self._sql["read_meta"], [key])
        row = await cursor.fetchone()
        return None if row is None else str(row[0])

    async def write_meta(self, key: str, value: str) -> None:
        await self._conn.execute(self._sql["write_meta"], [key, value])

    async def list_chunk_hashes(self) -> Mapping[str, str]:
        cursor = await self._conn.execute(self._sql["list_chunk_hashes"])
        return {str(key): str(hash_) for key, hash_ in await cursor.fetchall()}

    async def upsert_chunks(
        self, chunks: Sequence[DocChunk], embeddings: Sequence[Sequence[float]]
    ) -> None:
        if len(chunks) != len(embeddings):
            raise ValueError(
                f"upsert_chunks was given {len(chunks)} chunks and {len(embeddings)} embeddings"
            )
        async with self._conn.transaction():
            for chunk, embedding in zip(chunks, embeddings, strict=True):
                if len(embedding) != self._dimensions:
                    raise ValueError(
                        f"an embedding for {chunk.key} has {len(embedding)} dimensions "
                        f"where the index has {self._dimensions}"
                    )
                await self._conn.execute(
                    self._sql["upsert_chunk"],
                    [
                        chunk.key,
                        chunk.path,
                        chunk.anchor,
                        chunk.heading,
                        chunk.body,
                        chunk.text,
                        chunk.hash,
                        _vector_literal(embedding),
                    ],
                )

    async def delete_chunks(self, keys: Sequence[str]) -> None:
        if len(keys) == 0:
            return
        await self._conn.execute(self._sql["delete_chunks"], [list(keys)])

    async def clear(self) -> None:
        await self._conn.execute(self._sql["clear"])

    async def lexical_search(self, query: str, limit: int) -> list[RankedId]:
        if js_trim(query) == "":
            return []
        # pg_textsearch scores lower-is-better; a non-matching row scores 0, so matches sort first.
        # Filtering to matching rows alone is the index scan's behaviour, not the operator's: see
        # `DocStore.lexical_search`.
        cursor = await self._conn.execute(self._sql["lexical_search"], [query, limit])
        return _ranked(await cursor.fetchall())

    async def vector_search(self, embedding: Sequence[float], limit: int) -> list[RankedId]:
        cursor = await self._conn.execute(
            self._sql["vector_search"], [_vector_literal(embedding), limit]
        )
        return _ranked(await cursor.fetchall())

    async def get_chunks(self, ids: Sequence[int]) -> list[StoredChunk]:
        if len(ids) == 0:
            return []
        cursor = await self._conn.execute(self._sql["get_chunks"], [list(ids)])
        by_id = {
            int(row[0]): StoredChunk(
                id=int(row[0]),
                key=str(row[1]),
                path=str(row[2]),
                anchor=str(row[3]),
                heading=str(row[4]),
                body=str(row[5]),
            )
            for row in await cursor.fetchall()
        }
        return [by_id[id_] for id_ in ids if id_ in by_id]

    async def close(self) -> None:
        await self._conn.close()


async def open_postgres_store(database_url: str, dimensions: int) -> DocStore:
    """Opens the index on the Postgres `database_url` names.

    An existing index built at another width has its `chunks` table dropped and its embedder
    record removed, so the next refresh rebuilds rather than failing on the column type.
    """
    sql = statements(_check_dimensions(dimensions))
    try:
        conn = await psycopg.AsyncConnection.connect(
            database_url, autocommit=True, cursor_factory=psycopg.AsyncRawCursor
        )
    except psycopg.Error as error:
        # The connection string may carry a password, and a malformed one is quoted back whole.
        message = str(error).replace(database_url, "<connection string>")
        raise ServiceError(
            f"could not connect to the Postgres {DATABASE_URL_ENV} names: {message}"
        ) from None

    store = _PostgresStore(conn, dimensions)
    try:
        await conn.execute(sql["create_extensions"])
        await conn.execute(sql["create_meta"])
        width = str(dimensions)
        if await store.read_meta(DIMENSIONS_META_KEY) != width:
            await conn.execute(sql["drop_chunks"])
            await conn.execute(sql["delete_meta"], [EMBEDDER_META_KEY])
        await conn.execute(sql["create_chunks"])
        await conn.execute(sql["create_hnsw"])
        await conn.execute(sql["create_bm25"])
        await store.write_meta(DIMENSIONS_META_KEY, width)
    except psycopg.Error as error:
        await conn.close()
        raise ServiceError(
            f"the Postgres {DATABASE_URL_ENV} names could not hold the docs index: "
            f"{one_line(error)}; it needs the vector and pg_textsearch extensions installed "
            "and pg_textsearch in shared_preload_libraries"
        ) from None
    except BaseException:
        await conn.close()
        raise
    return store


def driver_message(error: BaseException) -> str:
    """`error`'s primary message on one line, matching what PGlite's `error.message` carries.

    `str()` of a `psycopg.Error` is libpq's whole message, which can add a `LINE` pointer, `DETAIL`
    and `HINT` lines, or a lost connection's tail; only the primary message is kept.
    """
    if isinstance(error, psycopg.Error):
        primary = error.diag.message_primary
        if isinstance(primary, str) and primary:
            return primary
    for line in str(error).splitlines():
        if line.strip():
            return line.strip()
    return type(error).__name__
