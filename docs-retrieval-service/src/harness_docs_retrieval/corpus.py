"""Enumerating the files docs retrieval indexes; a port of `cli/src/retrieval/corpus.ts`.

The rule this module exists to enforce, quoted from `corpus.ts`'s header: the corpus is exactly
every Markdown file under `docs.root` plus every conventions document `layers[]` names, and nothing
here throws on a missing path. An absent `docs.root`, a missing conventions document or a path
resolving outside the repository becomes a warning line and the rest of the corpus is still
returned. No gate is applied here.

Paths follow Node's `path` module, not `pathlib`: a join concatenates and normalizes lexically, and
nothing resolves a symlink (`Path.resolve` does, so it is never used).
"""

import os
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

from harness_docs_retrieval.jscompat import utf16_sort_key


@dataclass(frozen=True)
class CorpusFiles:
    """The files the corpus holds and what was skipped on the way.

    `files` is repo-relative, forward-slashed, de-duplicated and in UTF-16 code-unit order.
    """

    files: tuple[str, ...]
    warnings: tuple[str, ...]


def normalize_repo_dir(value: str) -> str:
    """`normalizeRepoDir` (`cli/src/core/repoPaths.ts`): a `..` is left where it was found."""
    forward_slashed = value.replace("\\", "/").rstrip("/")
    without_leading_dot = forward_slashed.removeprefix("./")
    return "." if without_leading_dot == "" else without_leading_dot


def inside_repo(repo_root: str, candidate: str) -> bool:
    """`insideRepo` (`cli/src/core/paths.ts`): lexical, so a symlink is not followed."""
    root = os.path.abspath(repo_root)
    target = os.path.abspath(candidate)
    if root == target:
        return True
    try:
        rel = os.path.relpath(target, root)
    except ValueError:
        # Different Windows drives: Node's `relative` answers with an absolute path there.
        return False
    if os.path.isabs(rel):
        return False
    return rel != ".." and not rel.startswith(".." + os.sep)


def _node_join(base: str, tail: str) -> str:
    # Node's `join` concatenates even an absolute `tail`, where `os.path.join` would discard `base`.
    return os.path.normpath(base + "/" + tail if tail else base)


def _to_repo_relative(repo_root: str, absolute: str) -> str:
    rel = os.path.relpath(os.path.abspath(absolute), os.path.abspath(repo_root))
    return rel.replace(os.sep, "/")


def _markdown_under(directory: str, out: list[str]) -> None:
    with os.scandir(directory) as entries:
        for entry in entries:
            full = os.path.join(directory, entry.name)
            if entry.is_dir(follow_symlinks=False):
                _markdown_under(full, out)
                continue
            if not entry.name.endswith(".md"):
                continue
            symlinked_file = entry.is_symlink() and os.path.isfile(full)
            if entry.is_file(follow_symlinks=False) or symlinked_file:
                out.append(full)


def _js_template_value(value: object) -> str:
    # How a `${…}` hole renders the values a hand-edited config can put in a layer's `name`.
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


def _conventions_outside_warning(p: str, n: str) -> str:
    # Hoisted only so the literal fits on one line under the line-length limit.
    return f"conventions document {p} of layer {n} resolves outside the repository and was skipped"


_MISSING = object()


def corpus_files(repo_root: str, config: Mapping[str, Any]) -> CorpusFiles:
    """The corpus of `config`, which carries `harness.config.json`'s own keys, at `repo_root`."""
    absolute: list[str] = []
    warnings: list[str] = []

    # Each warning is kept on one line so a grep of `corpus.ts` finds it verbatim.
    docs = config.get("docs")
    root: Any = docs.get("root", _MISSING) if docs is not None else _MISSING
    if root is _MISSING:
        warnings.append("docs.root is not set, so no documentation directory is indexed")
    else:
        d = normalize_repo_dir(root)
        full = _node_join(repo_root, d)
        if not inside_repo(repo_root, full):
            warnings.append(f"docs.root {d} resolves outside the repository and was skipped")
        elif not os.path.isdir(full):
            warnings.append(
                f"docs.root {d} is not a directory, so no documentation directory is indexed"
            )
        else:
            _markdown_under(full, absolute)

    for layer in config.get("layers") or []:
        conventions = layer.get("conventions")
        if not isinstance(conventions, str) or conventions == "":
            continue
        p = normalize_repo_dir(conventions)
        full = _node_join(repo_root, p)
        n = _js_template_value(layer["name"]) if "name" in layer else "undefined"
        if not inside_repo(repo_root, full):
            warnings.append(_conventions_outside_warning(p, n))
        elif not os.path.isfile(full):
            warnings.append(f"conventions document {p} of layer {n} is missing and was skipped")
        else:
            absolute.append(full)

    relative = dict.fromkeys(_to_repo_relative(repo_root, path) for path in absolute)
    files = tuple(sorted(relative, key=utf16_sort_key))
    return CorpusFiles(files=files, warnings=tuple(warnings))


def read_corpus_file(repo_root: str, path: str) -> str:
    """The one reader of a corpus file: `readFileSync(join(repoRoot, path), 'utf8')`.

    No newline translation and no BOM stripping; an invalid byte becomes U+FFFD.
    """
    with open(_node_join(repo_root, path), encoding="utf-8", errors="replace", newline="") as f:
        return f.read()
