"""The rule this file exists to enforce: a client must not be able to tell which backend answered
it. The tool listing and every argument refusal are compared against the running TypeScript server,
`docs serve` started over stdio, so the expected listing is whatever that server advertises at run
time and no tool definition is typed in here.

The Python side runs in memory over a `FakeSession`: listing and refusals precede any store access,
and the comparison of a successful search, which needs a database, is the container-gated
end-to-end case's.
"""

import asyncio
import os
import subprocess
import sys
from pathlib import Path
from typing import Any

from mcp import Client, types
from mcp.client.stdio import StdioServerParameters

from fakes import FakeSession
from harness_docs_retrieval.mcp_server import build_server
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
