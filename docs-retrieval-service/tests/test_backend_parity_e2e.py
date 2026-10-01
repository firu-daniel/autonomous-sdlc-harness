"""The rule this file exists to enforce (Acceptance 2): with the stub models, the same query over
the same corpus renders byte-identical `search_docs` output from both backends, abstention
included, and both servers advertise the same tool listing over the wire. The TypeScript server
runs on PGlite, the Python server on the Postgres named by
`HARNESS_DOCS_RETRIEVAL_TEST_DATABASE_URL`, and both read one fixture directory and one
`harness.config.json`.

A mismatch is first assumed to be a port defect and is fixed in the module that owns the rule. One
that traces to engine behaviour (tie order among equal scores, a planner choosing the BM25 index
scan where PGlite seq-scans) is reported as a blocker naming the query, both outputs and the trace.
Never change the query set, drop a query, normalise either output or loosen the comparison to pass.

Not covered here: a snippet cut that leaves a lone surrogate. `docs/snippet-edges.md`'s astral
character straddles the cut, but a space precedes it, so the rendered snippet stays well-formed: a
lone surrogate is not valid UTF-8 on the stdio transport, so a mismatch there would grade the MCP
SDKs' encoders rather than the port.
"""

import asyncio
import json
import os
import sys
from pathlib import Path

import pytest
from mcp import Client, types
from mcp.client.stdio import StdioServerParameters

from harness_docs_retrieval.jscompat import utf16_len
from harness_docs_retrieval.models import MODEL_CACHE_ENV
from harness_docs_retrieval.search import ABSTAIN_MESSAGE
from harness_docs_retrieval.store import DATABASE_URL_ENV
from harness_docs_retrieval.stubs import RETRIEVAL_STUB_ENV
from harness_docs_retrieval.wire import SEARCH_TOOL_NAME
from model_cache import plant_model_files
from ts_bridge import CHECKOUT_ROOT, ts_fixture

pytestmark = pytest.mark.container

_EVAL_DOCS = CHECKOUT_ROOT / "evals" / "docs-retrieval" / "corpora" / "fixture-catalog" / "docs"
_EVAL_QUERIES = CHECKOUT_ROOT / "evals" / "docs-retrieval" / "queries" / "fixture-catalog.jsonl"

_SNIPPET_UNITS = 240
_ASTRAL = "\U0001f4e6"

# Shares no token with the corpus, so the stub reranker scores every candidate 0 and
# `fused-rerank` abstains.
ABSTAINING_QUERY = "zebra quokka xylophone marmalade"
SNIPPET_EDGES_QUERY = "snippet edges whitespace astral boundary"

# The first this many queries are also asked with each explicit `k` below.
_K_VARIANT_QUERIES = 3
_K_VARIANTS = (1, 20)


def _snippet_edges() -> str:
    long_body = " ".join(["Every boundary word here pushes the body past the snippet cut."] * 6)
    assert utf16_len(long_body) > _SNIPPET_UNITS
    whitespace = (
        "\u00a0Whitespace\u00a0\u00a0edges\ufeffcollapse\u00a0\ufeff into\tsingle"
        "\u00a0spaces\ufeff before\u00a0the boundary.\ufeff"
    )
    # The astral pair sits at units 239-240, so the cut at 240 splits it.
    straddle_lead = "edge " * 47 + "edge"
    assert utf16_len(straddle_lead) == _SNIPPET_UNITS - 1
    straddle = f"{straddle_lead}{_ASTRAL} trailing words after the astral boundary"
    no_space = "nospaceboundary" * 20
    assert utf16_len(no_space) > _SNIPPET_UNITS
    return (
        "# Snippet edges\n\n"
        f"## Long body\n\n{long_body}\n\n"
        f"## Whitespace\n\n{whitespace}\n\n"
        f"## Astral straddle\n\n{straddle}\n\n"
        f"## No space\n\n{no_space}\n"
    )


def _corpus() -> dict[str, str]:
    files = {
        f"docs/{path.name}": path.read_text(encoding="utf-8")
        for path in sorted(_EVAL_DOCS.glob("*.md"))
    }
    assert files, f"no corpus files under {_EVAL_DOCS}"
    files["docs/snippet-edges.md"] = _snippet_edges()
    files["conventions.md"] = "# Conventions\n\nEvery module opens with the rule it enforces.\n"
    return files


def _queries() -> list[str]:
    lines = _EVAL_QUERIES.read_text(encoding="utf-8").splitlines()
    queries = [str(json.loads(line)["query"]) for line in lines if line.strip()]
    assert queries, f"no queries in {_EVAL_QUERIES}"
    return [*queries, ABSTAINING_QUERY, SNIPPET_EDGES_QUERY]


def _calls() -> list[dict[str, object]]:
    calls: list[dict[str, object]] = []
    for index, query in enumerate(_queries()):
        calls.append({"query": query})
        if index < _K_VARIANT_QUERIES:
            for k in _K_VARIANTS:
                calls.append({"query": query, "k": k})
    return calls


def _first_text(result: types.CallToolResult) -> str:
    block = result.content[0]
    assert isinstance(block, types.TextContent), block
    return block.text


def _tools(listed: types.ListToolsResult) -> list[dict[str, object]]:
    return [
        tool.model_dump(mode="json", by_alias=True, exclude_none=True) for tool in listed.tools
    ]


async def _compare(ts_client: Client, py_client: Client) -> None:
    ts_tools = _tools(await ts_client.list_tools())
    py_tools = _tools(await py_client.list_tools())
    assert py_tools == ts_tools

    abstained = False
    for arguments in _calls():
        # One call at a time, TypeScript first: each call refreshes its server's index.
        ts_result = await ts_client.call_tool(SEARCH_TOOL_NAME, arguments)
        py_result = await py_client.call_tool(SEARCH_TOOL_NAME, arguments)
        ts_text, py_text = _first_text(ts_result), _first_text(py_result)
        if py_text != ts_text or py_result.is_error != ts_result.is_error:
            k = arguments.get("k", "absent")
            pytest.fail(
                f"backends diverge on query {arguments['query']!r}, k={k}\n"
                f"--- TypeScript (isError={ts_result.is_error}) ---\n{ts_text}\n"
                f"--- Python (isError={py_result.is_error}) ---\n{py_text}",
                pytrace=False,
            )
        if arguments["query"] == ABSTAINING_QUERY:
            # Coverage `note: ` lines may precede the result; the abstention is the last line.
            abstained = ts_text.splitlines()[-1] == ABSTAIN_MESSAGE
        if arguments["query"] == SNIPPET_EDGES_QUERY:
            assert "docs/snippet-edges.md" in ts_text, ts_text
    assert abstained, f"{ABSTAINING_QUERY!r} did not abstain on either backend"


def _console_script() -> str:
    return str(Path(sys.executable).parent / "harness-docs-retrieval")


def test_both_backends_answer_byte_identically(fresh_database_url: str, tmp_path: Path) -> None:
    model_cache = tmp_path / "models"
    plant_model_files(model_cache)

    async def run() -> None:
        with ts_fixture(files=_corpus()) as fixture:
            ts_parameters = StdioServerParameters(
                command="node",
                args=[fixture.cli_entry, "docs", "serve"],
                cwd=fixture.dir,
                env={**os.environ, **fixture.env},
            )
            py_parameters = StdioServerParameters(
                command=_console_script(),
                args=["serve-mcp", "--repo", str(fixture.dir)],
                cwd=fixture.dir,
                env={
                    **os.environ,
                    RETRIEVAL_STUB_ENV: "hash-v1",
                    DATABASE_URL_ENV: fresh_database_url,
                    MODEL_CACHE_ENV: str(model_cache),
                },
            )
            async with Client(ts_parameters) as ts_client, Client(py_parameters) as py_client:
                await _compare(ts_client, py_client)

    asyncio.run(run())
