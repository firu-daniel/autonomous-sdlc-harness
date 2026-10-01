"""The rule this file exists to enforce, carried over from `store.ts`: every value reaches SQL as a
bound parameter, and the SQL is `store.ts`'s own, so the two arms that decide every relevance number
are the same text against a different engine.

The constants are compared against the running TypeScript through the bridge. The vector arm's
`ORDER BY embedding <=> $1::vector LIMIT $2` is not exported by `store.ts`, so no bridge can reach
it; it is guarded by reading `cli/src/retrieval/store.ts`'s source instead, a last resort taken for
that one string. Nothing here needs a database: the refusals below fail before connecting, or
against a port nothing listens on.
"""

import asyncio
from typing import Any

import pytest

from harness_docs_retrieval.errors import ServiceError
from harness_docs_retrieval.store import (
    BM25_INDEX,
    BM25_INDEX_DEFINITION,
    BM25_ORDER_CLAUSE,
    CHUNK_TEXT_COLUMN,
    CHUNKS_TABLE,
    DATABASE_URL_ENV,
    EMBEDDER_META_KEY,
    chunk_embedding_column,
    open_postgres_store,
    statements,
)
from ts_bridge import CHECKOUT_ROOT, run_bridge

VECTOR_ORDER = "ORDER BY embedding <=> $1::vector LIMIT $2"


def test_constants_match_typescript() -> None:
    ts_store: dict[str, Any] = run_bridge("constants")["store"]
    assert CHUNKS_TABLE == ts_store["CHUNKS_TABLE"]
    assert BM25_INDEX == ts_store["BM25_INDEX"]
    assert BM25_INDEX_DEFINITION == ts_store["BM25_INDEX_DEFINITION"]
    assert BM25_ORDER_CLAUSE == ts_store["BM25_ORDER_CLAUSE"]
    assert CHUNK_TEXT_COLUMN == ts_store["CHUNK_TEXT_COLUMN"]
    assert EMBEDDER_META_KEY == ts_store["EMBEDDER_META_KEY"]
    assert chunk_embedding_column(384) == ts_store["embeddingColumn384"]


def test_the_lexical_arm_orders_by_the_bm25_clause() -> None:
    assert "ORDER BY " + BM25_ORDER_CLAUSE in statements(384)["lexical_search"]


def test_the_vector_arm_orders_as_store_ts_does() -> None:
    assert VECTOR_ORDER in statements(384)["vector_search"]
    source = (CHECKOUT_ROOT / "cli" / "src" / "retrieval" / "store.ts").read_text(encoding="utf-8")
    assert VECTOR_ORDER in source


def test_no_statement_carries_a_psycopg_placeholder() -> None:
    for name, statement in statements(384).items():
        assert "%s" not in statement, name
        assert "%(" not in statement, name


@pytest.mark.parametrize("dimensions", [0, -1, True, 1.5])
def test_a_bad_width_is_refused_before_connecting(dimensions: Any) -> None:
    with pytest.raises(ValueError):
        asyncio.run(open_postgres_store("not a connection string", dimensions))
    with pytest.raises(ValueError):
        statements(dimensions)


@pytest.mark.parametrize(
    "database_url",
    [
        # Port 1 on loopback: refused at once, with no server needed.
        "postgresql://reader:s3cret-pw@127.0.0.1:1/docs?connect_timeout=5",
        # Malformed: libpq quotes a malformed string back in its message.
        "s3cret-pw-not-a-conninfo",
    ],
)
def test_a_connection_failure_names_the_variable_and_hides_the_string(database_url: str) -> None:
    with pytest.raises(ServiceError) as raised:
        asyncio.run(open_postgres_store(database_url, 384))
    assert DATABASE_URL_ENV in str(raised.value)
    assert "s3cret-pw" not in str(raised.value)
