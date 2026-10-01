"""The rule this file exists to enforce: `cli.main` is the only place an anticipated failure
becomes an exit status — a missing or unknown sub-command exits `2` with usage, and a
`ServiceError` exits `1` with exactly one stderr line and no traceback. It also pins the
sub-command table's rows.
"""

import argparse

import pytest

from harness_docs_retrieval import cli
from harness_docs_retrieval.errors import ServiceError


def _configure_nothing(parser: argparse.ArgumentParser) -> None:
    return None


def _raise_service_error(args: argparse.Namespace) -> int:
    raise ServiceError("x")


def test_missing_sub_command_exits_2_and_prints_usage(capsys: pytest.CaptureFixture[str]) -> None:
    assert cli.main([]) == 2
    assert "usage: harness-docs-retrieval" in capsys.readouterr().err


def test_unknown_sub_command_exits_2(capsys: pytest.CaptureFixture[str]) -> None:
    assert cli.main(["no-such-command"]) == 2
    assert "usage: harness-docs-retrieval" in capsys.readouterr().err


def test_service_error_exits_1_with_one_line_and_no_traceback(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    row = cli.SubCommand("boom", "raises ServiceError", _configure_nothing, _raise_service_error)
    monkeypatch.setattr(cli, "SUB_COMMANDS", [*cli.SUB_COMMANDS, row])
    assert cli.main(["boom"]) == 1
    err = capsys.readouterr().err
    assert err == "harness-docs-retrieval: x\n"
    assert "Traceback" not in err


def test_sub_command_table_rows() -> None:
    assert [row.name for row in cli.SUB_COMMANDS] == ["serve-mcp"]
