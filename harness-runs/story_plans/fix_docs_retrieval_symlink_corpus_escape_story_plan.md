# Story: Docs-retrieval corpus refuses a symlink that escapes the repository

## Context

The docs-retrieval corpus can index a file outside the repository, and serve its text through `search_docs`, on both backends. The inside-repository check is lexical, but reading follows symlinks, so two routes get past it. The first is a symlinked `.md` under `docs.root`, which the walker accepts when its target is a file: `cli/src/retrieval/corpus.ts` → `markdownUnder` (`entry.isSymbolicLink() && statSync(full …)?.isFile()`) and `docs-retrieval-service/src/harness_docs_retrieval/corpus.py` → `_markdown_under` (`symlinked_file = entry.is_symlink() and os.path.isfile(full)`). The second is a symlinked `layers[].conventions` file, which passes `insideRepo` / `inside_repo` on its spelled path before `statSync` / `os.path.isfile` follows the link. The finding is `docs/rag-extraction-research/03-sources-database-security.md` → `## 3. Docs sources` (**Local path.**), together with its review's Nice to Have 1.

**The fix, the same on both backends.** Every candidate keeps today's lexical check. It also gets a **physical** check: the candidate's real path must lie inside the repository root's real path. Real paths come from `realpathSync` in TypeScript and from `os.path.realpath` in Python; both resolve one component at a time with `readlink`, and neither folds case. A link whose target resolves **inside** the repository still works, and it is listed under its own (link) path, as it is today. A link that escapes is dropped with a warning. `cli/src/core/paths.ts` → `insideRepo` is left unchanged: the write engine, detection and `init` call it as a lexical check, and its header says so. The physical check is the corpus module's own step, built on top of `insideRepo`.

**The contract both backends must emit, byte for byte.** Task 1 defines it in TypeScript, and Tasks 2 and 3 restate it and hold Python to it:

- **`docs.root` itself.** After the existing lexical and is-a-directory checks, a `docs.root` whose real path is outside the repository's real root emits the **existing** text `docs.root <dir> resolves outside the repository and was skipped` and is not walked.
- **A file found by the walk.** A candidate whose real path is outside the repository's real root is dropped with the **new** warning `docs.root file <rel> resolves outside the repository and was skipped`. `<rel>` is the candidate's repo-relative lexical path with forward slashes, the same spelling `files` uses. These warnings are emitted **after** the walk, sorted by `<rel>` in UTF-16 code-unit order (`a < b` in TypeScript, `utf16_sort_key` in Python). They sit where today's `docs.root` warnings sit: before any conventions-document warning. The sort is there because Node's `readdirSync` and Python's `os.scandir` do not promise the same entry order.
- **A conventions document.** After the existing lexical check and the existing is-a-file check, a document whose real path is outside the repository's real root emits the **existing** text `conventions document <path> of layer <name> resolves outside the repository and was skipped`.
- **A real-path lookup that fails** after its existence check passed (a race) is treated as a dangling link: a walked file is dropped silently, as a dangling link is today, and a conventions document takes the existing `… is missing and was skipped` warning. The repository root's own real path falls back to its lexically resolved path if it cannot be resolved. Nothing throws, which is the rule `corpus.ts`'s header states.

The check runs at enumeration. A link retargeted between enumeration and the read is not checked again. That residual is recorded in both module headers, not closed by this branch.

Task 1 is the `cli` layer. Tasks 2–4 are the catch-all `general` layer: `docs-retrieval-service/` and `docs/` sit under no other `layers[].path`. They ship in that order, so Python ports a TypeScript contract that has already landed, the parity case compares two finished implementations, and the documentation describes behaviour that exists.

**Top risks:** The first is the two backends drifting in warning text or warning order. Every word and the sort rule are fixed above. Task 3's parity case compares Python against the compiled TypeScript on a fixture that exercises both routes, so a hand-written expectation that agrees with itself on one side cannot hide a divergence. The second is breaking a symlink that resolves inside the repository, most likely when the repository root is itself reached through a symlinked ancestor (macOS's `/var` → `/private/var`). Tasks 1 and 2 each test an in-repository link with the root passed through an alias symlink. The third is Python's existing case `test_symlinked_directory_is_not_descended_and_symlinked_file_is_kept`. It asserts the escape this branch closes, and Task 2 rewrites it rather than leaving it failing.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top-to-bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else, such as sub-step bullets inside the per-task files, are informational progress markers only. They are never the iteration source, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_docs_retrieval_symlink_corpus_escape/task_<K>_plan.md`. They are ordered bottom-up by ship sequence, with the catch-all layer last.

1. [x] **Task 1** — Apply the physical inside-repository check in `corpus.ts`, with its own test suite _(layer: cli)_ _(points: 20)_
2. [x] **Task 2** — Port the physical check to `corpus.py` and rewrite its symlink cases in `test_corpus.py` _(layer: general)_ _(points: 20)_
3. [ ] **Task 3** — Add a `corpus-at` bridge sub-command and a symlink corpus parity case _(layer: general)_ _(points: 10)_
4. [ ] **Task 4** — State the symlink rule in `docs/retrieval.md` → `**Corpus.**` _(layer: general)_ _(points: 5)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"the docs-retrieval corpus can read and index a file outside the repository through a symlink, on both backends."* The site class is durable prose that states which files the docs-retrieval corpus admits, skips or warns on, or how a corpus path is confined to the repository. Application source and its comments, both backends' modules and tests included, are outside the register. Those are owned by Tasks 1–3.

**Derivation entry — corpus files (command).** Re-run verbatim from the checkout root: `git grep -l -E 'corpusFiles|corpus_files|corpus\.ts|corpus\.py' -- '*.md' '*.txt' ':!harness-runs'`. `harness-runs/` is excluded because its per-branch records describe other branches' runs, and the next entry covers its standing artifacts.

**Derivation entry — standing-artifact rows (procedure).** **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md harness-runs/improvement_suggestions.md`. **Artifact:** those two standing ledgers. **Traversal:** each file's topic headings in file order, then the one-line entries under each. **Decision rule:** an entry is reached when it states which files the docs-retrieval corpus admits, skips or warns on, or how a corpus path is confined to the repository. Re-walked while drafting, this entry reached no row. The `lessons.md` rule under `## Evidence and measurement` that mentions a *"fixture-sized corpus"* is about measurement, not corpus admission. The `## Ports and parallel implementations` rules are planning constraints this plan applies (Task 3), not sites it changes.

**Closure invariant:** every site either derivation entry reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/retrieval.md` → `**Corpus.**` ("A missing or out-of-repository path is a warning, and the rest is still indexed.") | — | command entry, `corpus.ts` / `corpusFiles` | `change` | Task 4 |
| 2 | `docs/rag-extraction-research/03-sources-database-security.md` → `## 3. Docs sources` ("The inside-repository check is lexical") | — | command entry, `corpus.py` | `no-change` | A research record of the tree at the commit it read, and this branch's source. Its finding stays true of that commit, and the branch closes it without editing the record. |
| 3 | `docs/rag-extraction-research/reviews/03-sources-database-security.md` → `## Nice to Have` item 1 | — | command entry, `corpus.py` | `no-change` | A review record of that research document, and this branch's second source. |
| 4 | `docs/rag-extraction-research/01-current-mechanism.md` (the `Corpus` row, "confined to the repo"; "Local files only, confined inside `--repo`") | — | command entry, `corpus.ts` / `corpus.py` | `no-change` | A dated research record of the mechanism as read then. "Confined" is truer after this branch, not falsified by it. |
| 5 | `docs/rag-extraction-research/reviews/01-current-mechanism.md` (the `corpus.py:39-52` citations) | — | command entry, `corpus.py` | `no-change` | A review record; it cites line coordinates of the commit it reviewed. |
| 6 | `docs/rag-extraction-research/reviews/07-extraction-plan.md` ("cites `harness_docs_retrieval/corpus.py`") | — | command entry, `corpus.py` | `no-change` | It is about the module's package path, which this branch does not move. |
| 7 | `docs/retrieval-eval-results.md` (the listing importing `corpusFiles` from `cli/dist/retrieval/corpus.js`) | — | command entry, `corpusFiles` | `no-change` | A measured record. The listing calls `corpusFiles(root, config).files`, whose signature and shape this branch keeps. |
| 8 | `docs/retrieval-eval.md` ("drives `corpusFiles` → `refreshIndex` → `searchDocs` directly") | — | command entry, `corpusFiles` | `no-change` | It states the call chain and who checks the gate. Neither changes. |
| 9 | `evals/docs-retrieval/README.md` → "The layer list is `harness.config.json`'s" | — | command entry, `corpus.ts` | `no-change` | It states which configuration the eval reads, not how a path is confined. |
