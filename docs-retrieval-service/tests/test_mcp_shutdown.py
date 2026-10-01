"""The rule this file exists to enforce: `SIGTERM` stops `serve_mcp`'s transport without cancelling
a call already in flight, so that call's refresh and search finish before the store closes, as
`serveDocs` in `cli/src/retrieval/server.ts` awaits its queue before closing the session.

The transport is an in-memory stream pair standing in for `stdio_server`, the session a
`FakeSession` whose refresh waits to be released, and the signal a real `SIGTERM` to this process,
handled by the loop handler `serve_mcp` installs. Event loops that take no signal handlers are not
covered: the signal would end the test process instead.
"""

import asyncio
import os
import signal
import sys
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager, suppress
from typing import Any

import anyio
import pytest
from mcp.client.session import ClientSession
from mcp.shared.memory import MessageStream, create_client_server_memory_streams

from fakes import EMPTY_REFRESH, FakeSession
from harness_docs_retrieval import mcp_server
from harness_docs_retrieval.refresh import RefreshResult
from harness_docs_retrieval.service import Answer, ServiceConfig, answer
from harness_docs_retrieval.wire import SEARCH_TOOL_NAME


class _BlockingRefreshSession(FakeSession):
    def __init__(self, events: list[str]) -> None:
        super().__init__()
        self.events = events
        self.refresh_started = asyncio.Event()
        self.release_refresh = asyncio.Event()

    async def refresh(self) -> RefreshResult:
        self.events.append("refresh started")
        self.refresh_started.set()
        await self.release_refresh.wait()
        self.events.append("refresh finished")
        return EMPTY_REFRESH

    async def close(self) -> None:
        self.events.append("store closed")
        await super().close()


@pytest.mark.skipif(sys.platform == "win32", reason="the event loop takes no signal handlers")
def test_sigterm_lets_an_in_flight_call_finish_before_the_store_closes(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    events: list[str] = []
    client_streams: list[MessageStream] = []
    connected = asyncio.Event()

    @asynccontextmanager
    async def fake_stdio_server() -> AsyncIterator[MessageStream]:
        async with create_client_server_memory_streams() as (client, server):
            client_streams.append(client)
            connected.set()
            yield server

    async def recording_answer(*args: Any, **kwargs: Any) -> Answer:
        result = await answer(*args, **kwargs)
        events.append("answer finished")
        return result

    async def scenario() -> None:
        session = _BlockingRefreshSession(events)

        async def fake_open_session(config: ServiceConfig) -> FakeSession:
            return session

        monkeypatch.setattr(mcp_server, "open_session", fake_open_session)
        monkeypatch.setattr(mcp_server, "stdio_server", fake_stdio_server)
        monkeypatch.setattr(mcp_server, "answer", recording_answer)
        config = ServiceConfig(repo_root="", corpus_config={}, database_url="")

        with anyio.fail_after(10):
            async with anyio.create_task_group() as tg:
                tg.start_soon(mcp_server.serve_mcp, config)
                await connected.wait()
                read_stream, write_stream = client_streams[0]

                async def client() -> None:
                    # The connection closes under the call, so its response is never read.
                    with suppress(Exception):
                        async with ClientSession(read_stream, write_stream) as client_session:
                            await client_session.initialize()
                            await client_session.call_tool(SEARCH_TOOL_NAME, {"query": "rule"})

                tg.start_soon(client)
                await session.refresh_started.wait()
                os.kill(os.getpid(), signal.SIGTERM)
                # Lets the loop run the signal handler, ending the transport, before the release.
                await asyncio.sleep(0.1)
                events.append("released")
                session.release_refresh.set()

    asyncio.run(scenario())

    assert events == [
        "refresh started",
        "released",
        "refresh finished",
        "answer finished",
        "store closed",
    ]
