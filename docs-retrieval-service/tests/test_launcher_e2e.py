"""The rule this file exists to enforce: with `docs.retrievalBackend` set to `python`, the launcher
an adopter's `.mcp.json` names starts this package's server, and `search_docs` answers through it
in the TypeScript server's shape.

The launcher and its library are copied out of `cli/templates/scripts/` into each fixture, never
changed. Each case runs it with only the environment the agent runner would hand it, so the
launcher resolves `harness-docs-retrieval` off the venv's `bin` on `PATH`, not off this process.

Only the MCP-client case is `container`-marked, by its own decorator; a module-level marker would
also mark the exit-3 case, which needs no database and must run wherever 13c runs. Both cases
need `bash`, `git` and `jq` on this process's `PATH` and `npm run build`'s `cli/dist`; a missing one
fails the case rather than skipping it.
"""

import asyncio
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
from collections.abc import Iterator, Mapping
from contextlib import contextmanager
from pathlib import Path

import pytest
from mcp import Client, types
from mcp.client.stdio import StdioServerParameters

from harness_docs_retrieval.models import MODEL_CACHE_ENV
from harness_docs_retrieval.search import ABSTAIN_MESSAGE
from harness_docs_retrieval.service import CONFIG_FILENAME
from harness_docs_retrieval.store import DATABASE_URL_ENV
from harness_docs_retrieval.stubs import RETRIEVAL_STUB_ENV
from harness_docs_retrieval.wire import SEARCH_TOOL_NAME
from model_cache import plant_model_files
from test_backend_parity_e2e import SNIPPET_EDGES_QUERY, _corpus
from ts_bridge import CHECKOUT_ROOT, TsFixture, ts_fixture

_TEMPLATE_SCRIPTS = CHECKOUT_ROOT / "cli" / "templates" / "scripts"
_LAUNCHER = Path("scripts") / "docs-search-server.sh"
_LIBRARY = Path("scripts") / "lib" / "harness-run-lib.sh"

# The launcher's exit when the Python backend is selected but cannot serve.
_BACKEND_UNAVAILABLE_EXIT = 3
_LAUNCHER_TIMEOUT_SECONDS = 120


def _required(name: str) -> str:
    found = shutil.which(name)
    if found is None:
        pytest.fail(f"`{name}` is not on PATH; the launcher cases need it", pytrace=False)
    return found


def _launcher_path() -> str:
    """The venv's `bin`, where the console script lives, then the directories of `git` and `jq`."""
    directories: list[str] = []
    for directory in (
        str(Path(sys.executable).parent),
        str(Path(_required("git")).parent),
        str(Path(_required("jq")).parent),
    ):
        if directory not in directories:
            directories.append(directory)
    return os.pathsep.join(directories)


def _select_python_backend(repo: Path) -> None:
    path = repo / CONFIG_FILENAME
    config = json.loads(path.read_text(encoding="utf-8"))
    config["docs"]["retrievalBackend"] = "python"
    path.write_text(f"{json.dumps(config, indent=2)}\n", encoding="utf-8")


def _copy_launcher(repo: Path) -> None:
    for relative in (_LAUNCHER, _LIBRARY):
        target = repo / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(_TEMPLATE_SCRIPTS / relative.relative_to("scripts"), target)


@contextmanager
def _launcher_fixture(files: Mapping[str, str]) -> Iterator[tuple[TsFixture, Path]]:
    """A retrieval-on repository selecting the Python backend, with the launcher copied in, and a
    planted weight cache beside it."""
    with ts_fixture(files=files) as fixture, tempfile.TemporaryDirectory() as cache:
        _select_python_backend(fixture.dir)
        _copy_launcher(fixture.dir)
        model_cache = Path(cache).resolve()
        plant_model_files(model_cache)
        yield fixture, model_cache


@contextmanager
def _launcher_env(model_cache: Path, database_url: str) -> Iterator[dict[str, str]]:
    with tempfile.TemporaryDirectory() as home:
        yield {
            "HOME": home,
            "PATH": _launcher_path(),
            RETRIEVAL_STUB_ENV: "hash-v1",
            MODEL_CACHE_ENV: str(model_cache),
            DATABASE_URL_ENV: database_url,
        }


def _closed_loopback_url() -> str:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
    return f"postgresql://harness:harness@127.0.0.1:{port}/docs_retrieval"


def _only_text(result: types.CallToolResult) -> str:
    assert len(result.content) == 1, result.content
    block = result.content[0]
    assert isinstance(block, types.TextContent), block
    return block.text


@pytest.mark.container
def test_search_docs_answers_through_the_launcher_like_the_typescript_server(
    fresh_database_url: str,
) -> None:
    arguments: dict[str, object] = {"query": SNIPPET_EDGES_QUERY}
    bash = _required("bash")

    async def run() -> tuple[str, list[str], types.CallToolResult]:
        with (
            _launcher_fixture(_corpus()) as (fixture, model_cache),
            _launcher_env(model_cache, fresh_database_url) as env,
        ):
            ts_parameters = StdioServerParameters(
                command="node",
                args=[fixture.cli_entry, "docs", "serve"],
                cwd=fixture.dir,
                env={**os.environ, **fixture.env},
            )
            async with Client(ts_parameters) as ts_client:
                ts_text = _only_text(await ts_client.call_tool(SEARCH_TOOL_NAME, arguments))
            launcher_parameters = StdioServerParameters(
                command=bash,
                args=[str(fixture.dir / _LAUNCHER)],
                cwd=fixture.dir,
                env=env,
            )
            async with Client(launcher_parameters) as client:
                listed = await client.list_tools()
                result = await client.call_tool(SEARCH_TOOL_NAME, arguments)
            return ts_text, [tool.name for tool in listed.tools], result

    ts_text, tool_names, result = asyncio.run(run())

    assert tool_names == [SEARCH_TOOL_NAME]
    assert ts_text.splitlines()[-1] != ABSTAIN_MESSAGE, ts_text
    assert "docs/snippet-edges.md" in ts_text, ts_text
    assert result.is_error is False
    py_text = _only_text(result)
    if py_text != ts_text:
        pytest.fail(
            f"the launcher's answer diverges from the TypeScript server's on query "
            f"{SNIPPET_EDGES_QUERY!r}\n"
            f"--- TypeScript ---\n{ts_text}\n--- Python, through the launcher ---\n{py_text}",
            pytrace=False,
        )


def test_the_launcher_exits_3_when_the_python_backend_cannot_reach_its_store() -> None:
    bash = _required("bash")
    with (
        _launcher_fixture(_corpus()) as (fixture, model_cache),
        _launcher_env(model_cache, _closed_loopback_url()) as env,
    ):
        completed = subprocess.run(
            [bash, str(fixture.dir / _LAUNCHER)],
            cwd=fixture.dir,
            env=env,
            stdin=subprocess.DEVNULL,
            capture_output=True,
            timeout=_LAUNCHER_TIMEOUT_SECONDS,
            check=False,
        )

    stderr = completed.stderr.decode("utf-8", errors="replace")
    assert completed.returncode == _BACKEND_UNAVAILABLE_EXIT, stderr
    assert completed.stdout == b""
    lines = stderr.splitlines()
    connect_prefix = "harness-docs-retrieval: could not connect"
    assert any(line.startswith(connect_prefix) for line in lines), stderr
    launcher_prefix = "docs-search-server: "
    assert any(line.startswith(launcher_prefix) and "doctor" in line for line in lines), stderr
