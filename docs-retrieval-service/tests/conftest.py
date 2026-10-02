"""Shared test plumbing: the container gate and a throwaway database per test.

The rule this module exists to enforce: a `container` test runs only against the Postgres named by
`HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL` and is skipped loudly when it is unset, and every
database a test creates is dropped on every exit path. No fixture is created inside this checkout.
"""

import os
import uuid
from collections.abc import Iterator

import psycopg
import pytest
from psycopg import sql
from psycopg.conninfo import make_conninfo

TEST_DATABASE_URL_ENV = "HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL"

CONTAINER_SKIP_REASON = (
    f"container gate: {TEST_DATABASE_URL_ENV} is unset; "
    "run bash scripts/python-service.sh container-test on a machine with Docker"
)


def pytest_collection_modifyitems(config: pytest.Config, items: list[pytest.Item]) -> None:
    if os.environ.get(TEST_DATABASE_URL_ENV):
        return
    skip = pytest.mark.skip(reason=CONTAINER_SKIP_REASON)
    for item in items:
        if item.get_closest_marker("container") is not None:
            item.add_marker(skip)


@pytest.fixture
def fresh_database_url() -> Iterator[str]:
    admin_url = os.environ.get(TEST_DATABASE_URL_ENV)
    if not admin_url:
        pytest.skip(CONTAINER_SKIP_REASON)
    database = f"hdr_test_{uuid.uuid4().hex}"
    name = sql.Identifier(database)
    try:
        with psycopg.connect(admin_url, autocommit=True) as admin:
            admin.execute(sql.SQL("CREATE DATABASE {}").format(name))
        yield make_conninfo(admin_url, dbname=database)
    finally:
        # A fresh connection, so a test that broke its own still has its database removed.
        with psycopg.connect(admin_url, autocommit=True) as admin:
            admin.execute(sql.SQL("DROP DATABASE IF EXISTS {} WITH (FORCE)").format(name))
