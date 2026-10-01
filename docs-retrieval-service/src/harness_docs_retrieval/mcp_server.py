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

Every outgoing message is serialized by `jscompat.json_stringify`, as the TypeScript SDK's transport
does with `JSON.stringify`: the Python SDK's own `model_dump_json` refuses a lone surrogate, which a
snippet cut inside a surrogate pair carries.
"""

import asyncio
import signal
import sys
from collections.abc import AsyncIterable, AsyncIterator
from contextlib import asynccontextmanager
from types import TracebackType
from typing import Any, Self, cast

import anyio
from anyio.streams.memory import MemoryObjectSendStream
from mcp import types
from mcp.server import ServerRequestContext
from mcp.server.lowlevel import Server
from mcp.server.stdio import stdio_server
from mcp.shared._stream_protocols import ReadStream, WriteStream  # typing only; no public export
from mcp.shared.message import SessionMessage

from harness_docs_retrieval import __version__
from harness_docs_retrieval.jscompat import js_to_fixed, json_stringify, json_stringify_str
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
        # Shielded: the SDK cancels in-flight handlers when the incoming stream ends, and a started
        # call must finish its refresh writes before the store closes, as `serveDocs` awaits its
        # queue.
        with anyio.CancelScope(shield=True):
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


def _encode_outgoing(message: SessionMessage) -> str:
    """One outgoing message as a line of the wire, without its newline."""
    # The dump arguments are the ones the SDK's stdio writer passes to `model_dump_json`.
    dumped = message.message.model_dump(mode="json", by_alias=True, exclude_unset=True)
    return json_stringify(dumped)


class _EncodedMessage:
    """Stands in for the message model in the one call the SDK's stdio writer makes on it,
    `model_dump_json`, so that writer, and the stdout descriptor it alone holds, stay in use."""

    def __init__(self, line: str) -> None:
        self._line = line

    def model_dump_json(self, **_: object) -> str:
        return self._line


class _EncodingWriteStream:
    def __init__(self, inner: WriteStream[SessionMessage]) -> None:
        self._inner = inner

    async def send(self, item: SessionMessage, /) -> None:
        encoded = cast(types.JSONRPCMessage, _EncodedMessage(_encode_outgoing(item)))
        await self._inner.send(SessionMessage(encoded, item.metadata))

    async def aclose(self) -> None:
        await self._inner.aclose()

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> bool | None:
        await self.aclose()
        return None


@asynccontextmanager
async def _stdio_transport() -> AsyncIterator[
    tuple[ReadStream[SessionMessage | Exception], WriteStream[SessionMessage]]
]:
    async with stdio_server() as (read_stream, write_stream):
        yield read_stream, _EncodingWriteStream(write_stream)


async def _relay(
    source: AsyncIterable[SessionMessage | Exception],
    sink: MemoryObjectSendStream[SessionMessage | Exception],
) -> None:
    with sink:
        try:
            async for item in source:
                await sink.send(item)
        except anyio.ClosedResourceError:
            # `SIGTERM` closed the sink.
            pass


async def serve_mcp(config: ServiceConfig) -> None:
    """Serves until the client closes stdin or the process gets `SIGTERM`, then closes the
    session once any call already started has finished."""
    session = await open_session(config)
    loop = asyncio.get_running_loop()
    sigterm_installed = False
    stopped = False
    incoming_send, incoming = anyio.create_memory_object_stream[SessionMessage | Exception]()

    def stop() -> None:
        nonlocal stopped
        stopped = True
        incoming_send.close()

    try:
        server = build_server(session)
        try:
            loop.add_signal_handler(signal.SIGTERM, stop)
            sigterm_installed = True
        except NotImplementedError:
            # Windows event loops take no signal handlers; stdin closing still ends the server.
            pass
        with anyio.CancelScope() as transport_scope:
            async with (
                _stdio_transport() as (stdin_stream, write_stream),
                anyio.create_task_group() as relay_group,
            ):
                relay_group.start_soon(_relay, stdin_stream, incoming_send)
                await server.run(incoming, write_stream, server.create_initialization_options())
                if stopped:
                    # The stdin reader is still waiting on a line that may never come.
                    transport_scope.cancel()
    finally:
        if sigterm_installed:
            loop.remove_signal_handler(signal.SIGTERM)
        try:
            async with session.lock:
                pass
        finally:
            await session.close()
