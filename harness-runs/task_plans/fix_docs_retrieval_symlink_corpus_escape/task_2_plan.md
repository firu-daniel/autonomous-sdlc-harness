### Task 2 — Port the physical check to `corpus.py` and rewrite its symlink cases in `test_corpus.py`

**Goal:** Give the Python backend's `docs-retrieval-service/src/harness_docs_retrieval/corpus.py` → `corpus_files` the same physical inside-repository check Task 1 gave `corpus.ts`, with the same warnings in the same order. Then bring `tests/test_corpus.py` in line: one case per route, the in-repository link kept, and the existing case that asserts the escape rewritten.

**Depends on:** Task 1, which fixes the contract in `cli/src/retrieval/corpus.ts`. This task restates it so neither implementer guesses:

- **Real root.** `real_root = os.path.realpath(repo_root)`, computed once per call. It is non-strict, so it never raises, which matches TypeScript's fallback to the lexically resolved root.
- **Physical predicate.** A module-private helper, for example `_physically_inside(real_root, candidate) -> bool | None`. It returns `inside_repo(real_root, os.path.realpath(candidate, strict=True))`, or `None` when that raises `OSError`. Python's `os.path.realpath` and TypeScript's JS `realpathSync` both resolve one component at a time and fold no case. `Path.resolve` is still never used.
- **`docs.root` route.** After the existing lexical check and `os.path.isdir`, a non-`True` predicate on the directory emits the existing `docs.root {d} resolves outside the repository and was skipped` and skips the walk. Otherwise every collected candidate is checked. `False` drops it and adds `docs.root file {rel} resolves outside the repository and was skipped`, where `rel` is `_to_repo_relative(repo_root, candidate)`. `None` drops it silently. Those warnings are sorted with `key=utf16_sort_key` and appended before the conventions loop.
- **Conventions route.** After the existing lexical check and `os.path.isfile`, `False` emits the existing `_conventions_outside_warning(p, n)`, and `None` emits the existing `conventions document {p} of layer {n} is missing and was skipped`.
- **`files`** keeps each kept path's lexical repo-relative spelling, never the resolved target's.

Task 1 owns the TypeScript side. The cross-backend comparison that proves the two agree is **Task 3's**, and it calls `corpus_files(repo_root, config)` with the signature and `CorpusFiles` shape unchanged. This task's hand-written expectations prove Python against the contract above, not against the running TypeScript.

### Targets

- `docs-retrieval-service/src/harness_docs_retrieval/corpus.py`: the physical check, its module docstring and `inside_repo`'s docstring.
- `docs-retrieval-service/tests/test_corpus.py`: the rewritten symlink case and the new route cases.

**Work:**

- [ ] **The predicate and the two routes** (`corpus.py`). Add `_physically_inside` and the `real_root` computation, then apply them on the `docs.root` directory, on each walked candidate and on each conventions document, exactly as listed under **Depends on**. `_markdown_under` stays a lexical collector: its `is_dir(follow_symlinks=False)` and `symlinked_file` tests are unchanged, so a symlinked directory is still not descended into and a dangling link is still dropped there. Keep every warning literal on one line so a grep of `corpus.ts` finds it verbatim, as the existing comment in `corpus_files` requires. If the new `docs.root file` f-string exceeds the line-length limit, hoist it into a helper the way `_conventions_outside_warning` is hoisted, and say why in the same one-line comment form.
- [ ] **The docstrings** (`corpus.py`). The module docstring's last paragraph says *"nothing resolves a symlink (`Path.resolve` does, so it is never used)"*. Restate it: joins stay lexical as in Node, `os.path.realpath` is used **only** for the physical check, and `Path.resolve` is never used. Add that walk warnings are sorted so their order matches the TypeScript backend's whatever `os.scandir`'s order is, and record the enumeration-time residual Task 1 records in `corpus.ts`. Leave `inside_repo`'s docstring (*"lexical, so a symlink is not followed"*) true of the function, and add that `corpus_files` follows it with the physical check, so it no longer misleads about what is read.
- [ ] **The existing symlink case** (`test_corpus.py`). `test_symlinked_directory_is_not_descended_and_symlinked_file_is_kept` links `docs/linked.md` to `tmp_path/shared/target.md`, which is **outside** `repo`, so after this fix it is the escape. Rename it, for example `test_symlinked_directory_is_not_descended_and_escaping_file_is_skipped`. Assert `files == ("docs/real.md",)` and `warnings == ("docs.root file docs/linked.md resolves outside the repository and was skipped",)`, and keep its symlinked-directory and dangling-link halves. Amend the file's opening docstring only if its rule sentence no longer covers what the file asserts.
- [ ] **The new cases** (`test_corpus.py`), each built under `tmp_path` with `os.symlink` and each asserting `files` and `warnings` whole:
  - (a) A walked link inside the repository is kept under its link path, with no warning.
  - (b) A conventions document symlinked outside takes the existing `resolves outside` text, and one symlinked inside is kept.
  - (c) A `docs.root` that is itself a symlink to an outside directory takes the existing `docs.root docs resolves outside the repository and was skipped`.
  - (d) `repo_root` is passed through an alias symlink to the repository directory, and the in-repository link is still kept.
  - (e) Two escaping links, `docs/z.md` and `docs/B.md`, yield their warnings with `docs/B.md` first.

**Verification:**

- `tests/test_corpus.py` passes, run through `bash scripts/python-service.sh test tests/test_corpus.py` (the single-file form that wrapper's header documents), as one plain foreground command from the repository root.
- Each warning literal in `corpus.py` matches its `corpus.ts` template character for character, with `{d}` / `{rel}` / `{p}` / `{n}` in place of `${dir}` / `${rel}` / `${path}` / `${layer.name}`.
- `grep -n 'Path.resolve\|\.resolve(' docs-retrieval-service/src/harness_docs_retrieval/corpus.py` finds only the docstring's statement that it is never used.
- The changed code keeps the package's strict typing (`bool | None` annotated, no `Any` introduced) and its line-length limit.

**Deviations from plan:**

- **`tests/test_corpus.py` was not run (evidence downgrade).** `bash scripts/python-service.sh test tests/test_corpus.py`, run from the repository root, exited 3 with `python-service: not provisioned: no synced environment at <home>/.cache/harness-docs-retrieval/venvs/227539081; run bash scripts/python-service.sh sync`. Provisioning (`sync`) reaches the network and writes outside the run copy, so it was not attempted. A fallback probe under `harness-runs/scratch/`, run through `bash scripts/scratch-run.sh`, could not import the package either: the system `python3` predates 3.10 and failed on `jscompat.py`'s `int | None` annotation with `TypeError: unsupported operand type(s) for |: 'type' and 'NoneType'`. The cases' expectations therefore rest on reading `corpus.py` against `cli/src/retrieval/corpus.ts`, not on a run. Phase G's gate 13c (`bash scripts/python-service.sh test`, invoked by `scripts/run-gates.sh`) verifies them once the environment is provisioned. Until then it reports BLOCKED.
- **Strict typing and the line-length limit were checked by reading, not by mypy/ruff (evidence downgrade).** `bash scripts/python-service.sh typecheck` and `lint` are gate scripts `scripts/run-gates.sh` invokes (gates 13a/13b), deferred to the Run gates phase, and they are equally unprovisioned here. The line-length check ran as `awk 'length > 100'` over both files and printed nothing. The whole-tree `bash scripts/typecheck.sh` passed, but it covers only TypeScript and shell parsing, not this package.
- **Conventions route restructured, behaviour as specified.** The predicate is computed once, as `lexical` / `physical`, instead of nesting a third branch, so that the existing `is missing` literal stays on one line within 100 columns. The outcomes match the plan: lexical outside or a `False` predicate gives the `resolves outside` text, a non-file or a `None` predicate gives `is missing`.
