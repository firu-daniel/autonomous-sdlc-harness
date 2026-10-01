"""The rule this file exists to enforce: over both corpora the eval commits, the Python backend
enumerates the same files with the same warnings, and produces the same chunk keys, and for each key
the same path, anchor, heading, embedded text, body and hash, as the running TypeScript code.

This is the cheapest insurance in the three-branch sequence: a chunk key or hash that differs makes
every later comparison between the backends measure two different indexes. The corpus composition
has one source, the eval's `corpora.mjs`, read through the bridge, and the Python side is handed that
same config. `self-docs` is this checkout's live `docs/` and conventions documents; both sides read
the same bytes in the same run, so a moving corpus moves both sides together.
"""

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
