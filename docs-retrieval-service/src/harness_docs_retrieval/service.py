"""The service's config, its session and the one answer path both entry points share; a port of
`answer` and `parseArguments` in `cli/src/retrieval/server.ts` and of `openRetrieval` in
`cli/src/retrieval/session.ts`.

The rule this module exists to enforce: there is one answer path. The MCP server and the HTTP app
are two entry points over `answer()`, and its text is byte-compatible with `server.ts`'s tool
result. A session is opened only after the weight cache is found present, checked under the stub
too, and models load with remote loading disabled; nothing here passes `allow_remote=True`.

Departures from `server.ts` and `session.ts`:

- `queryLog.ts` is not ported: `answer()` writes no log record and reads no query-log variable.
- The service owns its config: it reads `harness.config.json` read-only, takes `docs.root` and
  `layers[]` alone, and applies no `phases.docs` / `docs.retrieval` gate.
- The store's meta layout is known here and to `store.py` only; `probe()` is how an entry point
  reaches it.
"""

import argparse
import asyncio
import copy
import json
import math
import os
import sys
import time
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

from harness_docs_retrieval.errors import ServiceError
from harness_docs_retrieval.jscompat import js_object_keys, js_trim, json_stringify_str
from harness_docs_retrieval.models import (
    Embedder,
    Reranker,
    model_cache_dir,
    model_files_present,
)
from harness_docs_retrieval.refresh import RefreshResult, refresh_index
from harness_docs_retrieval.search import (
    DEFAULT_RESULTS,
    MAX_RESULTS,
    SearchMode,
    SearchResult,
    render_results,
    search_docs,
)
from harness_docs_retrieval.store import (
    DATABASE_URL_ENV,
    DIMENSIONS_META_KEY,
    DocStore,
    driver_message,
    open_postgres_store,
)
from harness_docs_retrieval.stubs import resolve_models
from harness_docs_retrieval.wire import COVERAGE_NOTE_PREFIX, DOCS_SERVER_NAME, SEARCH_TOOL_NAME

CONFIG_FILENAME = "harness.config.json"


@dataclass(frozen=True)
class ServiceConfig:
    """`corpus_config` carries `harness.config.json`'s own keys, `docs.root` and `layers` only."""

    repo_root: str
    corpus_config: Mapping[str, Any]
    database_url: str


def add_service_options(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--repo",
        default=None,
        help="the repository whose harness.config.json is read (default: the current directory)",
    )
    parser.add_argument(
        "--docs-root",
        default=None,
        help="the documentation directory to index, overriding docs.root alone",
    )


def load_service_config(
    *, repo: str | None, docs_root: str | None, environ: Mapping[str, str]
) -> ServiceConfig:
    """Reads `<repo or cwd>/harness.config.json` read-only and the database URL from `environ`."""
    repo_root = os.path.abspath(repo) if repo else os.getcwd()
    path = os.path.join(repo_root, CONFIG_FILENAME)
    try:
        with open(path, encoding="utf-8") as handle:
            raw = handle.read()
    except OSError as error:
        raise ServiceError(
            f"the service config {path} could not be read: {error.strerror or error}"
        ) from None
    try:
        parsed = json.loads(raw)
    except ValueError as error:
        raise ServiceError(f"the service config {path} is not valid JSON: {error}") from None
    if not isinstance(parsed, dict):
        raise ServiceError(f"the service config {path} does not hold a JSON object")

    corpus_config: dict[str, Any] = {}
    docs = parsed.get("docs")
    if docs_root is not None:
        corpus_config["docs"] = {"root": docs_root}
    elif isinstance(docs, dict) and "root" in docs:
        corpus_config["docs"] = {"root": copy.deepcopy(docs["root"])}
    if "layers" in parsed:
        corpus_config["layers"] = copy.deepcopy(parsed["layers"])

    database_url = environ.get(DATABASE_URL_ENV, "")
    if database_url == "":
        raise ServiceError(
            f"{DATABASE_URL_ENV} is not set: set it to the connection string of the Postgres "
            "the docs index lives in"
        )
    return ServiceConfig(
        repo_root=repo_root, corpus_config=corpus_config, database_url=database_url
    )


class RetrievalSession:
    """An open index with the models it was opened for. `lock` serialises every use of the store,
    because one async Postgres connection must not be used concurrently."""

    def __init__(
        self,
        *,
        store: DocStore,
        embedder: Embedder,
        reranker: Reranker,
        repo_root: str,
        corpus_config: Mapping[str, Any],
    ) -> None:
        self.store = store
        self.embedder = embedder
        self.reranker = reranker
        self.lock = asyncio.Lock()
        self._repo_root = repo_root
        self._corpus_config = corpus_config

    async def refresh(self) -> RefreshResult:
        return await refresh_index(
            repo_root=self._repo_root,
            config=self._corpus_config,
            store=self.store,
            embedder=self.embedder,
        )

    async def probe(self) -> None:
        """The health check. Takes `lock` itself, which is not re-entrant, so no caller holds it;
        any exception the store raises propagates."""
        async with self.lock:
            await self.store.read_meta(DIMENSIONS_META_KEY)

    async def close(self) -> None:
        await self.store.close()


async def open_session(config: ServiceConfig) -> RetrievalSession:
    """Refuses before loading anything, in `session.ts`'s order: the weight cache, then the models,
    then the store."""
    cache_dir = model_cache_dir()
    models = model_files_present(cache_dir)
    if not models.present:
        raise ServiceError(
            f"the docs-retrieval model cache at {cache_dir} is missing "
            f"{', '.join(models.missing)}: run harness-docs-retrieval fetch-models where an "
            "operator is present, which downloads the models"
        )
    embedder, reranker = resolve_models(allow_remote=False)
    store = await open_postgres_store(config.database_url, embedder.dimensions)
    return RetrievalSession(
        store=store,
        embedder=embedder,
        reranker=reranker,
        repo_root=config.repo_root,
        corpus_config=config.corpus_config,
    )


def parse_arguments(args: object) -> tuple[str, int] | str:
    """The validated `(query, k)`, or the refusal text; `parseArguments` byte for byte."""
    if not isinstance(args, dict):
        return f'{SEARCH_TOOL_NAME}: arguments must be an object with a string "query"'
    keys = js_object_keys([key if isinstance(key, str) else str(key) for key in args])
    extra = [key for key in keys if key not in ("query", "k")]
    if extra:
        return (
            f"{SEARCH_TOOL_NAME}: unexpected argument {json_stringify_str(extra[0])}; "
            "expected query and k"
        )
    query = args.get("query")
    if not isinstance(query, str) or js_trim(query) == "":
        return f'{SEARCH_TOOL_NAME}: "query" must be a non-empty string'
    if "k" not in args:
        return query, DEFAULT_RESULTS
    k = args["k"]
    # `bool` is an `int` subclass, and JS's `typeof true` is not "number".
    is_number = isinstance(k, int | float) and not isinstance(k, bool)
    # `Number.isInteger` accepts an integral float such as 5.0. An `int` is never handed to
    # `math.isfinite`, which overflows on one too large for a float.
    non_integral = isinstance(k, float) and (not math.isfinite(k) or not k.is_integer())
    if not is_number or non_integral or not 1 <= k <= MAX_RESULTS:
        return f'{SEARCH_TOOL_NAME}: "k" must be a whole number from 1 to {MAX_RESULTS}'
    return query, int(k)


@dataclass(frozen=True)
class Answer:
    """`refused` is true for an argument refusal only, never for a refresh or search failure.
    `search_ms` is the duration of `search_docs` alone, and `None` when it did not complete."""

    text: str
    is_error: bool
    refused: bool
    result: SearchResult | None
    notes: tuple[str, ...]
    search_ms: float | None


def _failure(text: str) -> Answer:
    return Answer(text=text, is_error=True, refused=False, result=None, notes=(), search_ms=None)


async def answer(
    session: RetrievalSession, arguments: object, *, mode: SearchMode = "fused-rerank"
) -> Answer:
    """One call, answered under `session.lock`, so calls are answered one at a time: two
    interleaved refreshes would both embed the same changed chunks."""
    async with session.lock:
        parsed = parse_arguments(arguments)
        if isinstance(parsed, str):
            return Answer(
                text=parsed, is_error=True, refused=True, result=None, notes=(), search_ms=None
            )
        query, k = parsed

        try:
            refreshed = await session.refresh()
        except Exception as error:
            return _failure(
                f"{SEARCH_TOOL_NAME}: refreshing the docs index failed: {driver_message(error)}; "
                "run `npx autonomous-sdlc-harness doctor` in this repository"
            )
        for warning in refreshed.warnings:
            print(f"{DOCS_SERVER_NAME}: warning: {warning}", file=sys.stderr)

        started = time.perf_counter()
        try:
            result = await search_docs(
                store=session.store,
                embedder=session.embedder,
                reranker=session.reranker,
                query=query,
                k=k,
                mode=mode,
            )
        except Exception as error:
            return _failure(f"{SEARCH_TOOL_NAME}: the search failed: {driver_message(error)}")
        search_ms = (time.perf_counter() - started) * 1000

        # A truncated corpus is a degraded answer, not a failed call, so these are not an error.
        body = render_results(result)
        notes = tuple(f"{COVERAGE_NOTE_PREFIX}{warning}" for warning in refreshed.warnings)
        text = body if not notes else "\n".join(notes) + "\n\n" + body
        return Answer(
            text=text,
            is_error=False,
            refused=False,
            result=result,
            notes=notes,
            search_ms=search_ms,
        )
