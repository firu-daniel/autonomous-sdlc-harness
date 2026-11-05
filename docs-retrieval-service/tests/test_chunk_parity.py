"""The rule this file exists to enforce: over both corpora the eval commits, the Python backend
enumerates the same files with the same warnings, and produces the same chunk keys, and for each key
the same path, anchor, heading, embedded text, body and hash, as the running TypeScript code. It
also covers a symlinked fixture corpus built under the system temp directory, never inside this
checkout, on which both backends must enumerate the same files with the same warnings in the same
order, whether the root is spelled by its real path or by an alias symlink.

This is the cheapest insurance in the three-branch sequence: a chunk key or hash that differs makes
every later comparison between the backends measure two different indexes. The corpus composition
has one source, the eval's `corpora.mjs`, read through the bridge, and the Python side is handed
that same config. `self-docs` is this checkout's live `docs/` and conventions documents; both sides
read the same bytes in the same run, so a moving corpus moves both sides together.
"""

import os
from pathlib import Path
from typing import Any

import pytest

from harness_docs_retrieval.chunk import chunk_markdown
from harness_docs_retrieval.corpus import corpus_files, read_corpus_file
from ts_bridge import run_bridge

CORPORA = ("fixture-catalog", "self-docs")

RECORD_FIELDS = ("path", "anchor", "heading", "text", "body", "hash")


def _python_chunks(repo_root: str, files: tuple[str, ...]) -> list[dict[str, str]]:
    chunks: list[dict[str, str]] = []
    for path in files:
        for chunk in chunk_markdown(path, read_corpus_file(repo_root, path)):
            record = {"key": chunk.key}
            record.update({field: getattr(chunk, field) for field in RECORD_FIELDS})
            chunks.append(record)
    return chunks


@pytest.mark.parametrize("corpus", CORPORA)
def test_chunks_match_typescript(corpus: str) -> None:
    answer: dict[str, Any] = run_bridge("corpus", corpus)
    repo_root: str = answer["repoRoot"]

    python_corpus = corpus_files(repo_root, answer["config"])
    assert list(python_corpus.files) == answer["files"]
    assert list(python_corpus.warnings) == answer["warnings"]

    ts_chunks: list[dict[str, str]] = answer["chunks"]
    py_chunks = _python_chunks(repo_root, python_corpus.files)
    ts_by_key = {chunk["key"]: chunk for chunk in ts_chunks}
    py_by_key = {chunk["key"]: chunk for chunk in py_chunks}

    only_ts = sorted(ts_by_key.keys() - py_by_key.keys())
    only_py = sorted(py_by_key.keys() - ts_by_key.keys())
    assert not only_ts and not only_py, (
        f"{corpus}: keys only TypeScript produced: {only_ts}; keys only Python produced: {only_py}"
    )

    differences: list[str] = []
    for key in sorted(ts_by_key):
        for field in RECORD_FIELDS:
            if ts_by_key[key][field] != py_by_key[key][field]:
                differences.append(
                    f"{key}: {field} differs; TypeScript {ts_by_key[key][field]!r}, "
                    f"Python {py_by_key[key][field]!r}"
                )
                break
    assert not differences, f"{corpus}: " + "\n".join(differences)

    # Equal key sets can still hide a duplicated key or a reordered chunk.
    assert [chunk["key"] for chunk in py_chunks] == [chunk["key"] for chunk in ts_chunks]


def _write(root: Path, rel: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("# x\n", encoding="utf-8")


def test_symlinked_corpus_matches_typescript(tmp_path: Path) -> None:
    repo = tmp_path / "repo"
    shared = tmp_path / "shared"
    _write(repo, "docs/real.md")
    _write(repo, "other/target.md")
    _write(repo, "real/in.md")
    for rel in ("B.md", "z.md", "out.md", "linked-dir/inner.md"):
        _write(shared, rel)
    os.symlink(repo / "other" / "target.md", repo / "docs" / "inside.md")
    os.symlink(shared / "B.md", repo / "docs" / "B.md")
    os.symlink(shared / "z.md", repo / "docs" / "z.md")
    os.symlink(shared / "absent.md", repo / "docs" / "dangling.md")
    os.symlink(shared / "linked-dir", repo / "docs" / "linked-dir")
    (repo / ".claude" / "context").mkdir(parents=True)
    os.symlink(shared / "out.md", repo / ".claude" / "context" / "out.md")
    os.symlink(repo / "real" / "in.md", repo / ".claude" / "context" / "in.md")
    alias = tmp_path / "alias"
    os.symlink(repo, alias)
    config = {
        "docs": {"root": "docs"},
        "layers": [
            {"name": "cli", "path": "cli", "conventions": ".claude/context/out.md"},
            {"name": "general", "path": ".", "conventions": ".claude/context/in.md"},
        ],
    }

    for root in (os.path.realpath(repo), str(alias)):
        answer: dict[str, Any] = run_bridge("corpus-at", root, stdin=config)
        python_corpus = corpus_files(root, config)
        assert list(python_corpus.files) == answer["files"], root
        assert list(python_corpus.warnings) == answer["warnings"], root

        # Two empty answers agree too; these keep the fixture exercising both skip routes.
        assert any(w.startswith("docs.root file ") for w in answer["warnings"]), root
        assert any(
            w.startswith("conventions document ") and "resolves outside" in w
            for w in answer["warnings"]
        ), root
