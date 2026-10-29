### 1. The Python package README's byte-parity list says `test_chunk_parity.py` covers only chunk keys and hashes

**File:** `docs-retrieval-service/README.md` (`**Where byte parity is asserted.**` list) — "`tests/test_chunk_parity.py`: chunk keys and hashes;"

This branch adds `docs-retrieval-service/tests/test_chunk_parity.py` → `test_symlinked_corpus_matches_typescript`. It asserts that the TypeScript and Python backends enumerate the same corpus `files` with the same `warnings` in the same order, over a symlinked fixture, with the root spelled both by its real path and by an alias symlink. The file's header now states that rule too. The README's list of where byte parity is asserted still sums the file up as "chunk keys and hashes".

The reader this misleads is a contributor who changes `corpus.py` or `corpus.ts` and checks that list to find which test holds the two backends' corpus enumeration and skip warnings byte-identical. From the list they conclude that nothing does, because only chunking is listed. They then either write a duplicate parity case or treat a warning-text drift as unguarded. The enumeration comparison was already in the file before this branch, but the branch makes it a whole dedicated case covering the symlink contract. That makes the omission matter more.

**Fix:** in `docs-retrieval-service/README.md`, replace the bullet

```markdown
- `tests/test_chunk_parity.py`: chunk keys and hashes;
```

with

```markdown
- `tests/test_chunk_parity.py`: corpus files and warnings, a symlinked fixture corpus included, and chunk keys and hashes;
```

Change nothing else in that list. The lead-in "These five run without a container" stays true, because the new case builds its fixture under the system temp directory and needs no container. This is a prose-only edit, so it creates or edits no test file and runs none.
