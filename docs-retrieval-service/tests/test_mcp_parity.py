"""The rule this file exists to enforce: a client must not be able to tell which backend answered
it. The tool listing and every argument refusal are compared against the running TypeScript server,
`docs serve` started over stdio, so the expected listing is whatever that server advertises at run
time and no tool definition is typed in here.

The Python side runs in memory over a `FakeSession`: listing and refusals precede any store access,
and the comparison of a successful search, which needs a database, is the container-gated
end-to-end case's. The in-memory client bypasses the stdio writer, so the wire encoding of an
outgoing message is graded directly, through `_encode_outgoing`, the write stream it backs and the
`_stdio_transport` that `serve_mcp` enters.
"""

import asyncio
import json
import os
import subprocess
import sys
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import anyio
import pytest
from mcp import Client, types
from mcp.client.stdio import StdioServerParameters
from mcp.shared.message import SessionMessage

from fakes import FakeSession
from harness_docs_retrieval import mcp_server
from harness_docs_retrieval.jscompat import json_stringify
from harness_docs_retrieval.mcp_server import _encode_outgoing, _EncodingWriteStream, build_server
from harness_docs_retrieval.models import MODEL_CACHE_ENV
from harness_docs_retrieval.service import CONFIG_FILENAME
from harness_docs_retrieval.store import DATABASE_URL_ENV
from harness_docs_retrieval.stubs import RETRIEVAL_STUB_ENV
from harness_docs_retrieval.wire import SEARCH_TOOL_NAME
from ts_bridge import ts_fixture

CORPUS = {
    "conventions.md": "# Conventions\n\nEvery module opens with the rule it enforces.\n",
    "docs/retrieval.md": "# Retrieval\n\n## Hybrid search\n\nLexical and vector arms are fused.\n",
    "docs/setup.md": "# Setup\n\n## Installing\n\nRun init in the repository.\n",
    "docs/gates.md": "# Gates\n\n## Verifying a change\n\nEvery gate must exit zero.\n",
}

REFUSED_ARGUMENTS: list[dict[str, Any]] = [
    {"query": ""},
    {"query": "   "},
    {"k": 3},
    {"query": "x", "k": 0},
    {"query": "x", "k": 21},
    {"query": "x", "k": 2.5},
    {"query": "x", "k": "3"},
    {"query": "x", "k": True},
    {"query": "x", "extra": 1},
]

UNKNOWN_TOOL = "no_such_tool"

Observed = tuple[list[dict[str, Any]], list[tuple[list[str], bool]]]


def _texts(result: types.CallToolResult) -> list[str]:
    return [block.text for block in result.content if isinstance(block, types.TextContent)]


async def _observe(client: Client) -> Observed:
    listed = await client.list_tools()
    tools = [
        tool.model_dump(mode="json", by_alias=True, exclude_none=True) for tool in listed.tools
    ]
    calls: list[tuple[list[str], bool]] = []
    for arguments in REFUSED_ARGUMENTS:
        result = await client.call_tool(SEARCH_TOOL_NAME, arguments)
        calls.append((_texts(result), result.is_error))
    unknown = await client.call_tool(UNKNOWN_TOOL, {"query": "x"})
    calls.append((_texts(unknown), unknown.is_error))
    return tools, calls


async def _observe_typescript() -> Observed:
    with ts_fixture(files=CORPUS) as fixture:
        parameters = StdioServerParameters(
            command="node",
            args=[fixture.cli_entry, "docs", "serve"],
            cwd=fixture.dir,
            env={**os.environ, **fixture.env},
        )
        async with Client(parameters) as client:
            return await _observe(client)


async def _observe_python() -> Observed:
    async with Client(build_server(FakeSession())) as client:
        return await _observe(client)


def test_listing_and_refusals_match_the_typescript_server() -> None:
    ts_tools, ts_calls = asyncio.run(_observe_typescript())
    py_tools, py_calls = asyncio.run(_observe_python())

    assert len(ts_tools) == 1
    assert py_tools == ts_tools
    # Every refusal is an error on the TypeScript side, so equal results are equal refusals.
    assert all(is_error for _, is_error in ts_calls)
    for arguments, ts_call, py_call in zip(
        [*REFUSED_ARGUMENTS, UNKNOWN_TOOL], ts_calls, py_calls, strict=True
    ):
        assert py_call == ts_call, arguments


def _console_script() -> str:
    return str(Path(sys.executable).parent / "harness-docs-retrieval")


def test_an_empty_model_cache_is_refused_cleanly(tmp_path: Path) -> None:
    repo = tmp_path / "repo"
    repo.mkdir()
    (repo / CONFIG_FILENAME).write_text('{"docs": {"root": "docs"}}', encoding="utf-8")
    cache = tmp_path / "cache"
    env = {
        **os.environ,
        MODEL_CACHE_ENV: str(cache),
        RETRIEVAL_STUB_ENV: "hash-v1",
        DATABASE_URL_ENV: "postgresql://user@db.invalid/index",
    }

    result = subprocess.run(
        [_console_script(), "serve-mcp", "--repo", str(repo)],
        stdin=subprocess.DEVNULL,
        capture_output=True,
        env=env,
        check=False,
        text=True,
    )

    assert result.returncode == 1
    assert result.stdout == ""
    lines = result.stderr.splitlines()
    assert len(lines) == 1, result.stderr
    assert lines[0].startswith("harness-docs-retrieval: ")
    assert str(cache) in lines[0]
    assert "Traceback" not in result.stderr


# What `snippet_of` leaves when its cut splits a surrogate pair.
LONE_SURROGATE_TEXT = "a" * 239 + "\ud83d..."


def _tool_response(text: str) -> SessionMessage:
    # Built the way the server sends a tool result: the result dumped, then wrapped as a response.
    result = types.CallToolResult(content=[types.TextContent(type="text", text=text)])
    dumped = result.model_dump(by_alias=True, mode="json", exclude_none=True)
    return SessionMessage(types.JSONRPCResponse(jsonrpc="2.0", id=7, result=dumped))


def _wire_text(line: str) -> str:
    text = json.loads(line)["result"]["content"][0]["text"]
    assert isinstance(text, str)
    return text


def test_a_lone_surrogate_is_encoded_as_json_stringify_writes_it() -> None:
    line = _encode_outgoing(_tool_response(LONE_SURROGATE_TEXT))

    line.encode("utf-8")
    assert "\\ud83d..." in line
    assert _wire_text(line) == LONE_SURROGATE_TEXT


def test_the_write_stream_hands_the_stdio_writer_the_encoded_line() -> None:
    async def scenario() -> str:
        send, receive = anyio.create_memory_object_stream[SessionMessage](1)
        async with _EncodingWriteStream(send) as stream, receive:
            await stream.send(_tool_response(LONE_SURROGATE_TEXT))
            sent = await receive.receive()
        # The one call the SDK's stdio writer makes on an outgoing message.
        return sent.message.model_dump_json(by_alias=True, exclude_unset=True)

    assert _wire_text(asyncio.run(scenario())) == LONE_SURROGATE_TEXT


def test_the_stdio_transport_wraps_the_sdk_write_stream(monkeypatch: pytest.MonkeyPatch) -> None:
    message = _tool_response(LONE_SURROGATE_TEXT)

    async def scenario() -> str:
        send, receive = anyio.create_memory_object_stream[SessionMessage](1)
        incoming_send, incoming_receive = anyio.create_memory_object_stream[
            SessionMessage | Exception
        ](1)

        @asynccontextmanager
        async def fake_stdio_server() -> AsyncIterator[Any]:
            yield incoming_receive, send

        monkeypatch.setattr(mcp_server, "stdio_server", fake_stdio_server)
        async with incoming_send, receive, mcp_server._stdio_transport() as (_, write_stream):
            await write_stream.send(message)
            sent = await receive.receive()
        return sent.message.model_dump_json(by_alias=True, exclude_unset=True)

    expected = json_stringify(
        message.message.model_dump(mode="json", by_alias=True, exclude_unset=True)
    )
    assert asyncio.run(scenario()) == expected
