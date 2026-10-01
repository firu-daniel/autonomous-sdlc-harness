"""The stdio MCP server exposing `search_docs`; a port of `serveDocs` in
`cli/src/retrieval/server.ts`.

The rule this module exists to enforce: a client must not be able to tell this server from
`server.ts`'s by what it advertises or by how it refuses. It lists `wire.SEARCH_TOOL` as the one
tool, every argument refusal comes from `service.parse_arguments` (the SDK validates no input on
the low-level server), and an unknown tool name is refused with `server.ts`'s text. Nothing but the
transport writes to stdout, and every refusal that precedes the transport — a missing cache, a bad
stub value, an unreachable database — is raised before it starts.

Departure from `server.ts`: after each call that searched, one stderr line carries the library-level
`search_docs` duration, `TIMING_LINE_PREFIX` followed by the milliseconds to three decimals.
"""

import asyncio
import signal
import sys
from typing import Any

import anyio
from mcp import types
from mcp.server import ServerRequestContext
from mcp.server.lowlevel import Server
from mcp.server.stdio import stdio_server

from harness_docs_retrieval import __version__
from harness_docs_retrieval.jscompat import js_to_fixed, json_stringify_str
from harness_docs_retrieval.service import (
    RetrievalSession,
    ServiceConfig,
    answer,
    open_session,
)
from harness_docs_retrieval.wire import DOCS_SERVER_NAME, SEARCH_TOOL, SEARCH_TOOL_NAME

TIMING_LINE_PREFIX = f"{DOCS_SERVER_NAME}: search_ms="


def _text_result(text: str, *, is_error: bool) -> types.CallToolResult:
    return types.CallToolResult(
        content=[types.TextContent(type="text", text=text)], is_error=is_error
    )


def build_server(session: RetrievalSession) -> Server[Any]:
    tool = types.Tool.model_validate(SEARCH_TOOL)

    async def list_tools(
        ctx: ServerRequestContext[Any], params: types.PaginatedRequestParams | None
    ) -> types.ListToolsResult:
        return types.ListToolsResult(tools=[tool])

    async def call_tool(
        ctx: ServerRequestContext[Any], params: types.CallToolRequestParams
    ) -> types.CallToolResult:
        if params.name != SEARCH_TOOL_NAME:
            return _text_result(
                f"unknown tool {json_stringify_str(params.name)}; "
                f"this server exposes {SEARCH_TOOL_NAME}",
                is_error=True,
            )
        result = await answer(session, params.arguments)
        if result.search_ms is not None:
            print(
                f"{TIMING_LINE_PREFIX}{js_to_fixed(result.search_ms, 3)}",
                file=sys.stderr,
                flush=True,
            )
        return _text_result(result.text, is_error=result.is_error)

    return Server(
        DOCS_SERVER_NAME,
        version=__version__,
        on_list_tools=list_tools,
        on_call_tool=call_tool,
    )


async def serve_mcp(config: ServiceConfig) -> None:
    """Serves until the client closes stdin or the process gets `SIGTERM`, then closes the
    session."""
    session = await open_session(config)
    loop = asyncio.get_running_loop()
    sigterm_installed = False
    try:
        server = build_server(session)
        with anyio.CancelScope() as scope:
            try:
                loop.add_signal_handler(signal.SIGTERM, scope.cancel)
                sigterm_installed = True
            except NotImplementedError:
                # Windows event loops take no signal handlers; stdin closing still ends the server.
                pass
            async with stdio_server() as (read_stream, write_stream):
                await server.run(read_stream, write_stream, server.create_initialization_options())
    finally:
        if sigterm_installed:
            loop.remove_signal_handler(signal.SIGTERM)
        await session.close()
