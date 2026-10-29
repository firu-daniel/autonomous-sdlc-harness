`fix_docs_retrieval_symlink_corpus_escape`: the docs-retrieval corpus can read and index a file outside the repository through a symlink, on both backends.

## What happens

The inside-repository check is lexical, but reading follows symlinks. So a `.md` file can be indexed, and its text served through `search_docs`, from anywhere the process can read. There are two routes:

- **A symlinked `.md` under `docs.root`.** The walker accepts a symlink whose target is a file:
  - TypeScript: `cli/src/retrieval/corpus.ts`, the `entry.isSymbolicLink() && statSync(full)…isFile()` branch;
  - Python: `docs-retrieval-service/src/harness_docs_retrieval/corpus.py` → `_markdown_under`, `symlinked_file = entry.is_symlink() and os.path.isfile(full)`.

  Neither resolves where the target lives.
- **A symlinked `layers[].conventions` file.** `insideRepo` / `inside_repo` checks the lexical path, then `statSync` / `os.path.isfile` follows the link.

The docstring of `inside_repo` ("lexical, so a symlink is not followed") is accurate for the check, but misleading about what is then read.

## Fix

- Resolve the real path (`realpathSync` / `os.path.realpath`) of every candidate file, and of the repository root. Then apply the inside-repository check to the resolved paths, on both routes and both backends.
- Keep a symlink whose target resolves inside the repository working.
- Report a link that escapes as a warning, like an out-of-repository path today.
- Add a test per backend for each route. The TypeScript↔Python corpus parity tests must still agree.

## Source

`docs/rag-extraction-research/03-sources-database-security.md` → `## 3` (local path), and its review's Nice to Have 1. Both are on `e4d847e7 ` commit that merged branch `chore_rag_extraction_research`.