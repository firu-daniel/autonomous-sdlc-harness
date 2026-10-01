"""The `harness-docs-retrieval` console entry point and its sub-command table.

The rule this module exists to enforce: `SUB_COMMANDS` is the single source for usage text and
dispatch, and `main` is the only place an anticipated failure becomes an exit status — a
`ServiceError` prints exactly one line, `harness-docs-retrieval: <message>`, on stderr and exits
`1`, with no traceback. Anything else propagates.

Exit statuses: `0` success, `1` a `ServiceError`, `2` a missing or unknown sub-command.
"""

import argparse
import asyncio
import os
import sys
from collections.abc import Callable, Sequence
from dataclasses import dataclass

from harness_docs_retrieval.errors import ServiceError
from harness_docs_retrieval.http_app import serve_http
from harness_docs_retrieval.mcp_server import serve_mcp
from harness_docs_retrieval.models import (
    EMBEDDING_MODEL,
    RERANK_MODEL,
    fetch_models,
    model_cache_dir,
)
from harness_docs_retrieval.refresh import RefreshResult
from harness_docs_retrieval.self_check import run_self_check
from harness_docs_retrieval.service import add_service_options, load_service_config, open_session
from harness_docs_retrieval.stubs import RETRIEVAL_STUB_ENV, stub_models_selected

PROG = "harness-docs-retrieval"


@dataclass(frozen=True)
class SubCommand:
    name: str
    summary: str
    configure: Callable[[argparse.ArgumentParser], None]
    run: Callable[[argparse.Namespace], int]


def _run_serve_mcp(args: argparse.Namespace) -> int:
    config = load_service_config(repo=args.repo, docs_root=args.docs_root, environ=os.environ)
    asyncio.run(serve_mcp(config))
    return 0


def _configure_serve_http(parser: argparse.ArgumentParser) -> None:
    # Task 14's compose file passes both flags; the defaults keep a bare run local-only.
    add_service_options(parser)
    parser.add_argument("--host", default="127.0.0.1", help="the address to bind")
    parser.add_argument("--port", type=int, default=8080, help="the port to bind")


def _run_serve_http(args: argparse.Namespace) -> int:
    config = load_service_config(repo=args.repo, docs_root=args.docs_root, environ=os.environ)
    asyncio.run(serve_http(config, host=args.host, port=args.port))
    return 0


async def _refresh_once(args: argparse.Namespace) -> RefreshResult:
    config = load_service_config(repo=args.repo, docs_root=args.docs_root, environ=os.environ)
    session = await open_session(config)
    try:
        return await session.refresh()
    finally:
        await session.close()


def _run_index(args: argparse.Namespace) -> int:
    # Mirrors the `docs index` result line in `cli/src/commands/docs.ts`.
    result = asyncio.run(_refresh_once(args))
    for warning in result.warnings:
        print(f"{PROG}: warning: {warning}", file=sys.stderr)
    line = (
        f"index: {result.files} files, {result.chunks} chunks; embedded {result.embedded}, "
        f"unchanged {result.unchanged}, deleted {result.deleted}"
    )
    if result.rebuilt:
        line += "; rebuilt for a new embedder"
    print(line)
    return 0


def _configure_fetch_models(parser: argparse.ArgumentParser) -> None:
    return None


def _run_fetch_models(args: argparse.Namespace) -> int:
    # The only call that downloads. Where `docs fetch-models` refuses under the stub, this
    # succeeds: a stub needs no weights, and the cache check is a separate step.
    if stub_models_selected():
        print(f"fetch-models: stub models ({RETRIEVAL_STUB_ENV} set) need no download")
        return 0
    fetch_models()
    print(f"fetch-models: {EMBEDDING_MODEL} and {RERANK_MODEL} cached in {model_cache_dir()}")
    return 0


SUB_COMMANDS: list[SubCommand] = [
    SubCommand(
        name="serve-mcp",
        summary="Serve search_docs over stdio MCP (the server an agent runner starts)",
        configure=add_service_options,
        run=_run_serve_mcp,
    ),
    SubCommand(
        name="serve-http",
        summary="Serve POST /search and GET /health over HTTP",
        configure=_configure_serve_http,
        run=_run_serve_http,
    ),
    SubCommand(
        name="index",
        summary="Bring the docs index in line with the corpus and print what changed",
        configure=add_service_options,
        run=_run_index,
    ),
    SubCommand(
        name="self-check",
        summary="Answer packages, weights and index, one line each; exit 0 only when all pass",
        configure=add_service_options,
        run=run_self_check,
    ),
    SubCommand(
        name="fetch-models",
        summary="Download both models into the weight cache (the one command that downloads)",
        configure=_configure_fetch_models,
        run=_run_fetch_models,
    ),
]


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog=PROG, description="Docs-catalog retrieval service.")
    subparsers = parser.add_subparsers(dest="command", metavar="<command>", title="commands")
    for row in SUB_COMMANDS:
        sub = subparsers.add_parser(row.name, help=row.summary, description=row.summary)
        row.configure(sub)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = _build_parser()
    arguments = list(sys.argv[1:] if argv is None else argv)
    try:
        args = parser.parse_args(arguments)
    except SystemExit as exc:
        # argparse exits 2 on usage errors and 0 on --help; return the status instead.
        return exc.code if isinstance(exc.code, int) else 2

    row = next((r for r in SUB_COMMANDS if r.name == args.command), None)
    if row is None:
        parser.print_usage(sys.stderr)
        print(f"{PROG}: missing sub-command", file=sys.stderr)
        return 2

    try:
        return row.run(args)
    except ServiceError as exc:
        print(f"{PROG}: {exc}", file=sys.stderr)
        return 1
