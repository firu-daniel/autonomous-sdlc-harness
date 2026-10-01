"""The `harness-docs-retrieval` console entry point and its sub-command table.

The rule this module exists to enforce: `SUB_COMMANDS` is the single source for usage text and
dispatch, and `main` is the only place an anticipated failure becomes an exit status — a
`ServiceError` prints exactly one line, `harness-docs-retrieval: <message>`, on stderr and exits
`1`, with no traceback. Anything else propagates.

Exit statuses: `0` success, `1` a `ServiceError`, `2` a missing or unknown sub-command.
"""

import argparse
import sys
from collections.abc import Callable, Sequence
from dataclasses import dataclass

from harness_docs_retrieval.errors import ServiceError

PROG = "harness-docs-retrieval"


@dataclass(frozen=True)
class SubCommand:
    name: str
    summary: str
    configure: Callable[[argparse.ArgumentParser], None]
    run: Callable[[argparse.Namespace], int]


SUB_COMMANDS: list[SubCommand] = []


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
