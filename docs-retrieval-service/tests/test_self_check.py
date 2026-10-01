"""The rule this file exists to enforce: `self-check` gives three answers, one line each, in
`SELF_CHECK_QUESTIONS` order, and an exit status — and never a traceback, whatever fails. It also
pins the `index` result line, and that `fetch-models` under the stub downloads nothing.

No case downloads a model or reads the real weight cache: every case points `MODEL_CACHE_ENV` at a
temp dir.
"""

import json
import os
import subprocess
import sys
from pathlib import Path
from typing import NoReturn

import pytest

from fakes import InMemoryDocStore
from harness_docs_retrieval import cli, service
from harness_docs_retrieval.models import MODEL_CACHE_ENV
from harness_docs_retrieval.self_check import SELF_CHECK_QUESTIONS
from harness_docs_retrieval.service import CONFIG_FILENAME
from harness_docs_retrieval.store import DATABASE_URL_ENV, DocStore
from harness_docs_retrieval.stubs import RETRIEVAL_STUB_ENV
from model_cache import plant_model_files

UNREACHABLE_DATABASE_URL = "postgresql://127.0.0.1:1/none"

# One file, no preamble chunk (the title alone), two `##` sections.
DOC = "# A\n\n## One\n\nfirst body\n\n## Two\n\nsecond body\n"

RUN_MAIN = "import sys; from harness_docs_retrieval.cli import main; sys.exit(main(sys.argv[1:]))"


def _repo(root: Path) -> Path:
    repo = root / "repo"
    (repo / "docs").mkdir(parents=True)
    (repo / CONFIG_FILENAME).write_text(json.dumps({"docs": {"root": "docs"}}), encoding="utf-8")
    (repo / "docs" / "a.md").write_text(DOC, encoding="utf-8")
    return repo


def _subprocess_env(extra: dict[str, str]) -> dict[str, str]:
    env = {
        key: value
        for key, value in os.environ.items()
        if key not in (RETRIEVAL_STUB_ENV, DATABASE_URL_ENV, MODEL_CACHE_ENV)
    }
    return {**env, **extra}


def _run_self_check(repo: Path, env: dict[str, str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, "-c", RUN_MAIN, "self-check", "--repo", str(repo)],
        stdin=subprocess.DEVNULL,
        capture_output=True,
        env=env,
        check=False,
        text=True,
    )


def _questions(stdout: str) -> list[str]:
    return [line[5:].split(":", 1)[0] for line in stdout.splitlines()]


def test_an_empty_cache_and_no_database_fails_weights_and_skips_index(tmp_path: Path) -> None:
    repo = _repo(tmp_path)
    empty_cache = tmp_path / "cache"
    empty_cache.mkdir()
    # The stub keeps `packages` independent of whether the `models` extra is installed.
    env = _subprocess_env({MODEL_CACHE_ENV: str(empty_cache), RETRIEVAL_STUB_ENV: "hash-v1"})

    result = _run_self_check(repo, env)

    assert result.returncode == 1, result.stderr
    lines = result.stdout.splitlines()
    assert len(lines) == 3, result.stdout
    assert _questions(result.stdout) == list(SELF_CHECK_QUESTIONS)
    assert lines[1].startswith("FAIL weights: ")
    assert lines[2] == "FAIL index: not attempted, because weights failed"
    assert "Traceback" not in result.stdout
    assert "Traceback" not in result.stderr


def test_an_unreachable_database_fails_index_only(tmp_path: Path) -> None:
    repo = _repo(tmp_path)
    cache = tmp_path / "cache"
    plant_model_files(cache)
    env = _subprocess_env(
        {
            MODEL_CACHE_ENV: str(cache),
            RETRIEVAL_STUB_ENV: "hash-v1",
            DATABASE_URL_ENV: UNREACHABLE_DATABASE_URL,
        }
    )

    result = _run_self_check(repo, env)

    assert result.returncode == 1, result.stderr
    lines = result.stdout.splitlines()
    assert len(lines) == 3, result.stdout
    assert lines[0].startswith("ok   packages: ")
    assert lines[1].startswith("ok   weights: ")
    assert lines[2].startswith("FAIL index: ")
    assert "Traceback" not in result.stdout
    assert "Traceback" not in result.stderr


@pytest.fixture
def stubbed_store(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> InMemoryDocStore:
    cache = tmp_path / "cache"
    plant_model_files(cache)
    monkeypatch.setenv(MODEL_CACHE_ENV, str(cache))
    monkeypatch.setenv(RETRIEVAL_STUB_ENV, "hash-v1")
    monkeypatch.setenv(DATABASE_URL_ENV, UNREACHABLE_DATABASE_URL)
    store = InMemoryDocStore()

    async def fake_open(database_url: str, dimensions: int) -> DocStore:
        return store

    monkeypatch.setattr(service, "open_postgres_store", fake_open)
    return store


def test_a_reachable_index_passes_all_three(
    tmp_path: Path, stubbed_store: InMemoryDocStore, capsys: pytest.CaptureFixture[str]
) -> None:
    repo = _repo(tmp_path)
    assert cli.main(["self-check", "--repo", str(repo)]) == 0
    out = capsys.readouterr().out
    lines = out.splitlines()
    assert len(lines) == 3, out
    assert _questions(out) == list(SELF_CHECK_QUESTIONS)
    assert all(line.startswith("ok   ") for line in lines)
    assert lines[2] == "ok   index: 1 files, 2 chunks"
    assert stubbed_store.closed


def test_index_prints_the_summary_line_and_a_rerun_embeds_nothing(
    tmp_path: Path, stubbed_store: InMemoryDocStore, capsys: pytest.CaptureFixture[str]
) -> None:
    repo = _repo(tmp_path)
    assert cli.main(["index", "--repo", str(repo)]) == 0
    assert capsys.readouterr().out == (
        "index: 1 files, 2 chunks; embedded 2, unchanged 0, deleted 0\n"
    )
    assert stubbed_store.closed

    assert cli.main(["index", "--repo", str(repo)]) == 0
    assert capsys.readouterr().out == (
        "index: 1 files, 2 chunks; embedded 0, unchanged 2, deleted 0\n"
    )


def test_fetch_models_under_the_stub_downloads_nothing(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setenv(MODEL_CACHE_ENV, str(tmp_path / "cache"))
    monkeypatch.setenv(RETRIEVAL_STUB_ENV, "hash-v1")

    def must_not_download() -> NoReturn:
        raise AssertionError("fetch-models downloaded under the stub")

    monkeypatch.setattr(cli, "fetch_models", must_not_download)
    assert cli.main(["fetch-models"]) == 0
    assert capsys.readouterr().out == (
        f"fetch-models: stub models ({RETRIEVAL_STUB_ENV} set) need no download\n"
    )
