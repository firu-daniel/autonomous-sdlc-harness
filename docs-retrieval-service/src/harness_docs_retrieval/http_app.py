"""The HTTP app: `POST /search` and `GET /health`, for a human or a later caller to look through
the index. The stdio MCP server is what an agent runner starts.

The rule this module exists to enforce: one search module, two entry points. `POST /search`
reaches search only through `service.answer()`, so its `text` is byte-identical to the MCP tool's
for the same query, and it validates nothing but `mode`. `GET /health` reaches the store only
through `session.probe()`, which takes `session.lock` itself, so the endpoint never takes it.
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from harness_docs_retrieval.search import SEARCH_MODES, SearchMode
from harness_docs_retrieval.service import (
    RetrievalSession,
    ServiceConfig,
    answer,
    open_session,
)

DEFAULT_MODE: SearchMode = "fused-rerank"

MODE_REFUSAL = f'search: "mode" must be one of {", ".join(SEARCH_MODES)}'

BODY_REFUSAL = "search: the request body is not valid JSON"


def _error(status: int, text: str) -> JSONResponse:
    return JSONResponse({"error": text}, status_code=status)


def create_app(session: RetrievalSession) -> FastAPI:
    """The session is closed when the app shuts down."""

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        try:
            yield
        finally:
            await session.close()

    app = FastAPI(lifespan=lifespan)

    @app.post("/search")
    async def search(request: Request) -> JSONResponse:
        try:
            body: Any = await request.json()
        except ValueError:
            return _error(400, BODY_REFUSAL)

        mode: SearchMode | None = DEFAULT_MODE
        arguments: object = body
        if isinstance(body, dict) and "mode" in body:
            rest = dict(body)
            requested = rest.pop("mode")
            mode = next((m for m in SEARCH_MODES if m == requested), None)
            arguments = rest
        if mode is None:
            return _error(400, MODE_REFUSAL)

        got = await answer(session, arguments, mode=mode)
        if got.refused:
            return _error(400, got.text)
        if got.is_error or got.result is None:
            return _error(500, got.text)
        return JSONResponse(
            {
                "text": got.text,
                "mode": mode,
                "abstained": got.result.abstained,
                "best_rerank_score": got.result.best_rerank_score,
                "hits": [
                    {
                        "ref": hit.ref,
                        "path": hit.path,
                        "anchor": hit.anchor,
                        "heading": hit.heading,
                        "snippet": hit.snippet,
                        "score": hit.score,
                    }
                    for hit in got.result.hits
                ],
                "notes": list(got.notes),
                "search_ms": got.search_ms,
            }
        )

    @app.get("/health")
    async def health() -> JSONResponse:
        try:
            await session.probe()
        except Exception as error:
            return JSONResponse({"status": "unavailable", "error": str(error)}, status_code=503)
        return JSONResponse(
            {
                "status": "ok",
                "embedder": session.embedder.id,
                "reranker": session.reranker.id,
            }
        )

    return app


async def serve_http(config: ServiceConfig, *, host: str, port: int) -> None:
    """Opens the session before any socket, so a refusal is a `ServiceError` with nothing bound;
    the app's lifespan closes it."""
    session = await open_session(config)
    server = uvicorn.Server(uvicorn.Config(create_app(session), host=host, port=port))
    await server.serve()
