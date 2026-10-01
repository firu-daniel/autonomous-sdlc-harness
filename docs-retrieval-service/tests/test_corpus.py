"""The rule this file exists to enforce, quoted from `cli/src/retrieval/corpus.ts`: the corpus is
exactly every Markdown file under `docs.root` plus every conventions document `layers[]` names, and
nothing here throws on a missing path; each skip becomes a warning worded as `corpus.ts` words it.

Expectations are hand-written from reading `corpus.ts`; `test_chunk_parity.py` compares against
the running TypeScript. Every repository is built under `tmp_path`, never inside this checkout.
"""

import os
from pathlib import Path
from typing import Any

from harness_docs_retrieval.corpus import (
    corpus_files,
    inside_repo,
    normalize_repo_dir,
    read_corpus_file,
)


def _write(root: Path, rel: str, text: str = "# x\n") -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def _config(docs_root: str | None, *layers: dict[str, Any]) -> dict[str, Any]:
    config: dict[str, Any] = {"layers": list(layers)}
    if docs_root is not None:
        config["docs"] = {"root": docs_root}
    return config


def _layer(name: str, conventions: object) -> dict[str, Any]:
    return {"name": name, "path": ".", "conventions": conventions}


def test_normalize_repo_dir_matches_normalize_repo_dir() -> None:
    assert normalize_repo_dir("./docs/") == "docs"
    assert normalize_repo_dir("docs\\guide//") == "docs/guide"
    assert normalize_repo_dir("./") == "."
    assert normalize_repo_dir("") == "."
    assert normalize_repo_dir("../outside") == "../outside"


def test_inside_repo_is_lexical(tmp_path: Path) -> None:
    assert inside_repo(str(tmp_path), str(tmp_path))
    assert inside_repo(str(tmp_path), str(tmp_path / "a" / ".." / "b"))
    assert not inside_repo(str(tmp_path), str(tmp_path / ".." / "x"))
    assert inside_repo(str(tmp_path), str(tmp_path / "..x"))


def test_unset_docs_root_warns_and_keeps_conventions(tmp_path: Path) -> None:
    _write(tmp_path, ".claude/context/conventions.md")
    config = _config(None, _layer("general", ".claude/context/conventions.md"))
    result = corpus_files(str(tmp_path), config)
    assert result.files == (".claude/context/conventions.md",)
    assert result.warnings == ("docs.root is not set, so no documentation directory is indexed",)


def test_docs_root_outside_the_repository_warns(tmp_path: Path) -> None:
    repo = tmp_path / "repo"
    repo.mkdir()
    _write(tmp_path, "outside/a.md")
    result = corpus_files(str(repo), _config("../outside"))
    assert result.files == ()
    assert result.warnings == (
        "docs.root ../outside resolves outside the repository and was skipped",
    )


def test_docs_root_that_is_not_a_directory_warns(tmp_path: Path) -> None:
    _write(tmp_path, "README.md")
    result = corpus_files(str(tmp_path), _config("./README.md"))
    assert result.files == ()
    assert result.warnings == (
        "docs.root README.md is not a directory, so no documentation directory is indexed",
    )


def test_missing_and_outside_conventions_documents_warn(tmp_path: Path) -> None:
    repo = tmp_path / "repo"
    (repo / "docs").mkdir(parents=True)
    _write(tmp_path, "elsewhere.md")
    config = _config(
        "docs",
        _layer("cli", ".claude/context/cli.md"),
        _layer("plugin", "../elsewhere.md"),
    )
    result = corpus_files(str(repo), config)
    assert result.files == ()
    assert result.warnings == (
        "conventions document .claude/context/cli.md of layer cli is missing and was skipped",
        "conventions document ../elsewhere.md of layer plugin resolves outside the repository "
        "and was skipped",
    )


def test_conventions_document_under_docs_root_appears_once(tmp_path: Path) -> None:
    _write(tmp_path, "docs/conventions.md")
    _write(tmp_path, "docs/guide/intro.md")
    _write(tmp_path, "docs/notes.txt")
    config = _config("docs", _layer("general", "./docs/conventions.md"))
    result = corpus_files(str(tmp_path), config)
    assert result.files == ("docs/conventions.md", "docs/guide/intro.md")
    assert result.warnings == ()


def test_symlinked_directory_is_not_descended_and_symlinked_file_is_kept(tmp_path: Path) -> None:
    repo = tmp_path / "repo"
    _write(repo, "docs/real.md")
    _write(tmp_path, "shared/linked-dir/inner.md")
    _write(tmp_path, "shared/target.md")
    os.symlink(tmp_path / "shared" / "linked-dir", repo / "docs" / "linked-dir")
    os.symlink(tmp_path / "shared" / "target.md", repo / "docs" / "linked.md")
    os.symlink(tmp_path / "shared" / "absent.md", repo / "docs" / "dangling.md")
    result = corpus_files(str(repo), _config("docs"))
    assert result.files == ("docs/linked.md", "docs/real.md")


def test_layer_with_empty_or_non_string_conventions_is_skipped_silently(tmp_path: Path) -> None:
    (tmp_path / "docs").mkdir()
    config = _config("docs", _layer("a", ""), _layer("b", None), _layer("c", 7), {"name": "d"})
    result = corpus_files(str(tmp_path), config)
    assert result.files == ()
    assert result.warnings == ()


def test_order_is_utf16_code_unit_order(tmp_path: Path) -> None:
    # Code-point order would put U+FF5A before U+1F600; UTF-16 puts the surrogate 0xD83D first.
    for name in ("ｚ.md", "😀.md", "a.md", "B.md"):
        _write(tmp_path, f"docs/{name}")
    result = corpus_files(str(tmp_path), _config("docs"))
    assert result.files == ("docs/B.md", "docs/a.md", "docs/😀.md", "docs/ｚ.md")


def test_read_corpus_file_keeps_crlf_and_bom(tmp_path: Path) -> None:
    raw = "﻿# Title\r\nbody\r\n"
    (tmp_path / "doc.md").write_bytes(raw.encode("utf-8"))
    assert read_corpus_file(str(tmp_path), "doc.md") == raw
