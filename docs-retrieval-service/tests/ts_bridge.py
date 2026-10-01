"""The Python side of `ts_bridge.mjs`: the suite's one way to ask the running TypeScript code.

The rule this module exists to enforce: a parity case compares against the compiled TypeScript under
`cli/dist`, never against a copy of it, and a missing build or a bridge failure fails the test
rather than skipping it, because a skipped parity case reads as a passing one.

`ts_fixture` makes its directories under the system temp directory, never inside this checkout, and
removes both on every exit path.
"""

import json
import subprocess
import tempfile
from collections.abc import Iterator, Mapping
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pytest

CHECKOUT_ROOT = Path(__file__).resolve().parents[2]

_BRIDGE = Path(__file__).resolve().with_name("ts_bridge.mjs")
_BUILT_CLI = CHECKOUT_ROOT / "cli" / "dist" / "cli.js"


def run_bridge(sub_command: str, *args: str, stdin: object | None = None) -> Any:
    """Run one bridge sub-command and return its parsed JSON answer."""
    if not _BUILT_CLI.is_file():
        pytest.fail(f"ts_bridge: {_BUILT_CLI} is absent; run `npm run build` first", pytrace=False)
    payload = b"" if stdin is None else json.dumps(stdin).encode("utf-8")
    try:
        result = subprocess.run(
            ["node", str(_BRIDGE), sub_command, *args],
            input=payload,
            capture_output=True,
            check=False,
        )
    except FileNotFoundError:
        pytest.fail("ts_bridge: `node` is not on PATH", pytrace=False)
    if result.returncode != 0:
        stderr = result.stderr.decode("utf-8", errors="replace").strip()
        pytest.fail(
            f"ts_bridge {sub_command} exited {result.returncode}: {stderr}",
            pytrace=False,
        )
    return json.loads(result.stdout)


@dataclass(frozen=True)
class TsFixture:
    """A retrieval-on repository the TypeScript CLI can serve, with the environment to run it in."""

    dir: Path
    env: dict[str, str]
    cli_entry: str


@contextmanager
def ts_fixture(files: Mapping[str, str]) -> Iterator[TsFixture]:
    """A throwaway repository holding `files`, prepared by `prepare-ts-fixture`."""
    with (
        tempfile.TemporaryDirectory() as fixture_dir,
        tempfile.TemporaryDirectory() as cache_home,
    ):
        # Resolved, because the macOS temp directory is a symlink and git answers the physical path.
        directory = Path(fixture_dir).resolve()
        cache = Path(cache_home).resolve()
        answer = run_bridge(
            "prepare-ts-fixture", str(directory), str(cache), stdin={"files": dict(files)}
        )
        env = {str(name): str(value) for name, value in answer["env"].items()}
        yield TsFixture(dir=directory, env=env, cli_entry=str(answer["cliEntry"]))
