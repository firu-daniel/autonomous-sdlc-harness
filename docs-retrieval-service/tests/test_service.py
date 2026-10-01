"""The rule this file exists to enforce: there is one answer path, byte-compatible with
`cli/src/retrieval/server.ts`. The wire's names are compared against the running TypeScript; the
refusal texts are asserted literally, because the bridge exposes no TypeScript refusal to compare
against. A session opens only after the weight cache is found present, before any model or store is
touched, and calls are answered one at a time.

No duration is asserted anywhere: `search_ms` is checked for presence and type only.
"""

import asyncio
import json
from pathlib import Path
from typing import Any, NoReturn

import pytest

from fakes import FakeSession, InMemoryDocStore, doc_chunk
from harness_docs_retrieval import service, wire
from harness_docs_retrieval.errors import ServiceError
from harness_docs_retrieval.models import (
    EMBEDDING_DIMENSIONS,
    MANIFEST_NAME,
    MODEL_CACHE_ENV,
    MODEL_IDS,
)
from harness_docs_retrieval.refresh import RefreshResult
from harness_docs_retrieval.search import ABSTAIN_MESSAGE, render_results
from harness_docs_retrieval.service import (
    CONFIG_FILENAME,
    Answer,
    ServiceConfig,
    answer,
    load_service_config,
    open_session,
    parse_arguments,
)
from harness_docs_retrieval.store import DATABASE_URL_ENV, DIMENSIONS_META_KEY, DocStore
from harness_docs_retrieval.stubs import RETRIEVAL_STUB_ENV
from model_cache import plant_model_files
from ts_bridge import run_bridge

DATABASE_URL = "postgresql://user:secret@db.invalid/index"
ENVIRON = {DATABASE_URL_ENV: DATABASE_URL}

LAYERS: list[dict[str, Any]] = [
    {"name": "cli", "path": "cli", "conventions": "context/cli.md"},
    {"name": "general", "path": ".", "conventions": "context/conventions.md"},
]

CONFIG_FILE: dict[str, Any] = {
    "version": 1,
    "stateDir": "runs",
    "docs": {"root": "docs", "retrieval": True},
    "layers": LAYERS,
    "phases": {"docs": True},
}

OBJECT_REFUSAL = 'search_docs: arguments must be an object with a string "query"'
QUERY_REFUSAL = 'search_docs: "query" must be a non-empty string'
K_REFUSAL = 'search_docs: "k" must be a whole number from 1 to 20'

REFRESH_WARNINGS = ("docs.root docs is not a directory", "conventions document x is missing")


def _repo(root: Path, config: object = CONFIG_FILE) -> Path:
    (root / CONFIG_FILENAME).write_text(json.dumps(config), encoding="utf-8")
    return root


def _snapshot(root: Path) -> dict[str, bytes]:
    return {str(path): path.read_bytes() for path in sorted(root.rglob("*")) if path.is_file()}


# --- wire -------------------------------------------------------------------------------------


def test_the_wire_names_equal_the_typescript_exports() -> None:
    ts_server = run_bridge("constants")["server"]
    assert {
        "DOCS_SERVER_NAME": wire.DOCS_SERVER_NAME,
        "SEARCH_TOOL_NAME": wire.SEARCH_TOOL_NAME,
        "SEARCH_TOOL_PERMISSION": wire.SEARCH_TOOL_PERMISSION,
    } == ts_server


# --- config -----------------------------------------------------------------------------------


def test_config_copies_docs_root_and_layers_verbatim(tmp_path: Path) -> None:
    repo = _repo(tmp_path)
    before = _snapshot(repo)
    config = load_service_config(repo=str(repo), docs_root=None, environ=ENVIRON)
    assert config == ServiceConfig(
        repo_root=str(repo),
        corpus_config={"docs": {"root": "docs"}, "layers": LAYERS},
        database_url=DATABASE_URL,
    )
    assert _snapshot(repo) == before


def test_docs_root_overrides_docs_root_alone(tmp_path: Path) -> None:
    repo = _repo(tmp_path)
    config = load_service_config(repo=str(repo), docs_root="handbook", environ=ENVIRON)
    assert config.corpus_config == {"docs": {"root": "handbook"}, "layers": LAYERS}


def test_an_unset_repo_reads_the_working_directory(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    repo = _repo(tmp_path)
    monkeypatch.chdir(repo)
    config = load_service_config(repo=None, docs_root=None, environ=ENVIRON)
    assert Path(config.repo_root).samefile(repo)
    assert config.corpus_config == {"docs": {"root": "docs"}, "layers": LAYERS}


def test_a_missing_config_is_refused_naming_its_path(tmp_path: Path) -> None:
    with pytest.raises(ServiceError) as raised:
        load_service_config(repo=str(tmp_path), docs_root=None, environ=ENVIRON)
    assert str(tmp_path / CONFIG_FILENAME) in str(raised.value)


def test_an_unparseable_config_is_refused_naming_its_path(tmp_path: Path) -> None:
    (tmp_path / CONFIG_FILENAME).write_text("{ not json", encoding="utf-8")
    with pytest.raises(ServiceError) as raised:
        load_service_config(repo=str(tmp_path), docs_root=None, environ=ENVIRON)
    assert str(tmp_path / CONFIG_FILENAME) in str(raised.value)


@pytest.mark.parametrize("environ", [{}, {DATABASE_URL_ENV: ""}])
def test_an_unset_database_url_is_refused_by_name(tmp_path: Path, environ: dict[str, str]) -> None:
    repo = _repo(tmp_path)
    before = _snapshot(repo)
    with pytest.raises(ServiceError) as raised:
        load_service_config(repo=str(repo), docs_root=None, environ=environ)
    assert DATABASE_URL_ENV in str(raised.value)
    assert _snapshot(repo) == before


# --- opening a session ------------------------------------------------------------------------


def _config(repo_root: str = "/nonexistent") -> ServiceConfig:
    return ServiceConfig(repo_root=repo_root, corpus_config={}, database_url=DATABASE_URL)


def test_an_empty_cache_refuses_before_loading_anything(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    cache = tmp_path / "cache"
    monkeypatch.setenv(MODEL_CACHE_ENV, str(cache))
    monkeypatch.setenv(RETRIEVAL_STUB_ENV, "hash-v1")

    def must_not_load(*args: object, **kwargs: object) -> NoReturn:
        raise AssertionError("loaded past the cache refusal")

    monkeypatch.setattr(service, "resolve_models", must_not_load)
    monkeypatch.setattr(service, "open_postgres_store", must_not_load)

    with pytest.raises(ServiceError) as raised:
        asyncio.run(open_session(_config()))
    missing = ", ".join(f"{model_id}/{MANIFEST_NAME}" for model_id in MODEL_IDS)
    assert str(raised.value) == (
        f"the docs-retrieval model cache at {cache} is missing {missing}: "
        "run harness-docs-retrieval fetch-models where an operator is present, "
        "which downloads the models"
    )


def test_a_planted_cache_opens_under_the_stub(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    cache = tmp_path / "cache"
    plant_model_files(cache)
    monkeypatch.setenv(MODEL_CACHE_ENV, str(cache))
    monkeypatch.setenv(RETRIEVAL_STUB_ENV, "hash-v1")
    store = InMemoryDocStore()
    opened: list[tuple[str, int]] = []

    async def fake_open(database_url: str, dimensions: int) -> DocStore:
        opened.append((database_url, dimensions))
        return store

    monkeypatch.setattr(service, "open_postgres_store", fake_open)

    repo = tmp_path / "repo"
    (repo / "docs").mkdir(parents=True)
    (repo / "docs" / "a.md").write_text("# A\n\n## One\n\nbody\n", encoding="utf-8")

    async def scenario() -> RefreshResult:
        session = await open_session(
            ServiceConfig(
                repo_root=str(repo),
                corpus_config={"docs": {"root": "docs"}},
                database_url=DATABASE_URL,
            )
        )
        assert session.store is store
        assert session.embedder.id == "stub-hash:hash-v1"
        refreshed = await session.refresh()
        await session.close()
        return refreshed

    refreshed = asyncio.run(scenario())
    assert opened == [(DATABASE_URL, EMBEDDING_DIMENSIONS)]
    assert refreshed.files == 1
    assert store.closed


# --- parse_arguments --------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("arguments", "expected"),
    [
        (None, OBJECT_REFUSAL),
        ([], OBJECT_REFUSAL),
        (["query"], OBJECT_REFUSAL),
        ("x", OBJECT_REFUSAL),
        (
            {"query": "x", "b": 1, "1": 2},
            'search_docs: unexpected argument "1"; expected query and k',
        ),
        (
            {"query": "x", "mode": "fused"},
            'search_docs: unexpected argument "mode"; expected query and k',
        ),
        ({}, QUERY_REFUSAL),
        ({"query": 3}, QUERY_REFUSAL),
        ({"query": None}, QUERY_REFUSAL),
        ({"query": ""}, QUERY_REFUSAL),
        ({"query": " \t\n　﻿"}, QUERY_REFUSAL),
        ({"query": "x"}, ("x", 5)),
        ({"query": " x ", "k": 20}, (" x ", 20)),
        ({"query": "x", "k": 1}, ("x", 1)),
        ({"query": "x", "k": 5.0}, ("x", 5)),
        ({"query": "x", "k": True}, K_REFUSAL),
        ({"query": "x", "k": None}, K_REFUSAL),
        ({"query": "x", "k": "5"}, K_REFUSAL),
        ({"query": "x", "k": 2.5}, K_REFUSAL),
        ({"query": "x", "k": float("nan")}, K_REFUSAL),
        ({"query": "x", "k": float("inf")}, K_REFUSAL),
        ({"query": "x", "k": 0}, K_REFUSAL),
        ({"query": "x", "k": 21}, K_REFUSAL),
        ({"query": "x", "k": 10**400}, K_REFUSAL),
    ],
)
def test_parse_arguments(arguments: object, expected: object) -> None:
    assert parse_arguments(arguments) == expected


# --- answer -----------------------------------------------------------------------------------


def _populated_store() -> InMemoryDocStore:
    store = InMemoryDocStore()
    chunks = [
        doc_chunk("docs/a.md", "fusion", "Fusion", "hybrid search fusion explained"),
        doc_chunk("docs/b.md", "other", "Other", "nothing relevant here"),
    ]
    session = FakeSession(store)
    vectors = asyncio.run(session.embedder.embed_documents([chunk.text for chunk in chunks]))
    asyncio.run(store.upsert_chunks(chunks, vectors))
    return store


def _refreshed(warnings: tuple[str, ...]) -> RefreshResult:
    return RefreshResult(
        files=1, chunks=1, embedded=0, unchanged=1, deleted=0, rebuilt=False, warnings=warnings
    )


def test_a_refusal_is_refused_and_touches_nothing() -> None:
    session = FakeSession()
    got = asyncio.run(answer(session, {"query": " "}))
    assert got == Answer(
        text=QUERY_REFUSAL, is_error=True, refused=True, result=None, notes=(), search_ms=None
    )
    assert session.refresh_calls == 0
    assert session.fake_store.calls == []


def test_an_answer_without_warnings_is_the_rendering_alone() -> None:
    session = FakeSession(_populated_store())
    got = asyncio.run(answer(session, {"query": "hybrid search fusion", "k": 1}))
    assert got.result is not None
    assert not got.result.abstained
    assert len(got.result.hits) == 1
    assert got.text == render_results(got.result)
    assert got.text.startswith("1. docs/a.md#fusion (score ")
    assert (got.is_error, got.refused, got.notes) == (False, False, ())
    assert isinstance(got.search_ms, float)
    assert got.search_ms >= 0


def test_warnings_become_notes_ahead_of_the_body(capsys: pytest.CaptureFixture[str]) -> None:
    session = FakeSession(refresh=_refreshed(REFRESH_WARNINGS))
    got = asyncio.run(answer(session, {"query": "anything"}))
    assert got.notes == (
        "note: docs.root docs is not a directory",
        "note: conventions document x is missing",
    )
    assert got.text == (
        "note: docs.root docs is not a directory\n"
        "note: conventions document x is missing\n"
        "\n"
        f"{ABSTAIN_MESSAGE}"
    )
    assert not got.is_error
    assert capsys.readouterr().err == (
        "harness-docs: warning: docs.root docs is not a directory\n"
        "harness-docs: warning: conventions document x is missing\n"
    )


def test_a_refresh_failure_is_an_error_but_not_a_refusal() -> None:
    session = FakeSession(refresh=RuntimeError("the database went away"))
    got = asyncio.run(answer(session, {"query": "anything"}))
    assert got == Answer(
        text=(
            "search_docs: refreshing the docs index failed: the database went away; "
            "run harness-docs-retrieval self-check in this repository"
        ),
        is_error=True,
        refused=False,
        result=None,
        notes=(),
        search_ms=None,
    )


def test_a_search_failure_is_an_error_but_not_a_refusal(monkeypatch: pytest.MonkeyPatch) -> None:
    session = FakeSession()

    async def broken(query: str, limit: int) -> NoReturn:
        raise RuntimeError("the index is corrupt")

    monkeypatch.setattr(session.fake_store, "lexical_search", broken)
    got = asyncio.run(answer(session, {"query": "anything"}))
    assert got == Answer(
        text="search_docs: the search failed: the index is corrupt",
        is_error=True,
        refused=False,
        result=None,
        notes=(),
        search_ms=None,
    )


def test_the_mode_reaches_the_search() -> None:
    session = FakeSession(_populated_store())
    got = asyncio.run(answer(session, {"query": "hybrid search fusion"}, mode="lexical"))
    assert session.fake_store.calls == ["lexical_search", "get_chunks"]
    assert got.result is not None and got.result.best_rerank_score is None


def test_two_concurrent_answers_do_not_interleave() -> None:
    events: list[str] = []

    class SlowSession(FakeSession):
        async def refresh(self) -> RefreshResult:
            events.append("refresh-start")
            await asyncio.sleep(0.01)
            events.append("refresh-end")
            return await super().refresh()

    session = SlowSession()

    async def both() -> list[Answer]:
        first = answer(session, {"query": "first"})
        second = answer(session, {"query": "second"})
        return list(await asyncio.gather(first, second))

    answers = asyncio.run(both())
    assert events == ["refresh-start", "refresh-end", "refresh-start", "refresh-end"]
    assert [a.is_error for a in answers] == [False, False]


# --- probe ------------------------------------------------------------------------------------


def test_probe_reads_the_dimensions_key_under_the_lock(monkeypatch: pytest.MonkeyPatch) -> None:
    session = FakeSession()
    session.fake_store.meta[DIMENSIONS_META_KEY] = str(EMBEDDING_DIMENSIONS)
    reads: list[tuple[str, bool]] = []
    original = session.fake_store.read_meta

    async def recording(key: str) -> str | None:
        reads.append((key, session.lock.locked()))
        return await original(key)

    monkeypatch.setattr(session.fake_store, "read_meta", recording)
    assert asyncio.run(session.probe()) is None
    assert reads == [(DIMENSIONS_META_KEY, True)]
    assert not session.lock.locked()


def test_probe_propagates_a_store_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    session = FakeSession()

    async def unreachable(key: str) -> str | None:
        raise ConnectionError("the store is unreachable")

    monkeypatch.setattr(session.fake_store, "read_meta", unreachable)
    with pytest.raises(ConnectionError, match="the store is unreachable"):
        asyncio.run(session.probe())
    assert not session.lock.locked()
