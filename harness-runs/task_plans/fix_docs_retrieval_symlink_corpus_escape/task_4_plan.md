### Task 4 — State the symlink rule in `docs/retrieval.md` → `**Corpus.**`

**Goal:** Make the project's statement of what the docs-retrieval corpus admits true of both backends after Tasks 1–3, in the one place it is stated. That place is the `**Corpus.**` paragraph of `docs/retrieval.md`, row 1 of the story index's `## Scope register`, whose other rows are all `no-change`.

**Depends on:** Tasks 1 and 2, which make both backends check every candidate lexically and then physically. A symlinked `.md` under `docs.root`, a symlinked `docs.root` or a symlinked conventions document whose target resolves outside the repository is skipped with a warning. A link resolving inside is indexed under its own path. Task 3's parity case is what holds the two backends to the same behaviour, so the prose may say "both backends" without qualification. This task changes no code and no test.

### Targets

- `docs/retrieval.md`: the `**Corpus.**` paragraph only.

**Work:**

- [ ] Extend the paragraph's second sentence (*"A missing or out-of-repository path is a warning, and the rest is still indexed."*). Say that a path counts as out-of-repository when it lies outside the repository either as spelled or after its symlinks are resolved. A symlinked document or conventions file whose target is outside is therefore skipped with a warning, while one resolving inside is indexed under the link's own path. Say that this holds on both backends: name `docs-retrieval-service/src/harness_docs_retrieval/corpus.py` → `corpus_files` beside `cli/src/retrieval/corpus.ts` → `corpusFiles`, which the paragraph already cites. Add one clause recording that the check runs when the corpus is enumerated. Cite by path and symbol only, with no line number, and keep the paragraph as one paragraph.

**Verification:**

- Every claim in the edited paragraph matches the two module headers Tasks 1 and 2 amended. Read `cli/src/retrieval/corpus.ts`'s header and `corpus.py`'s module docstring against the paragraph rather than from memory.
- Re-run the register's command entry, `git grep -l -E 'corpusFiles|corpus_files|corpus\.ts|corpus\.py' -- '*.md' '*.txt' ':!harness-runs'`. Its output is a subset of the register's rows, and `docs/retrieval.md` is the only file this task's diff touches.
