### Task 5 — Rename the Python package to `devscene_docs_retrieval` / `devscene-docs-retrieval` and regenerate `uv.lock`

**Goal:** Rename the Python distribution, its import package and its console script. Its wire constants must spell the names the TypeScript side (Task 1) already uses, so that both backends still answer under one server name, one tool and one set of variables.

**Depends on:** Task 1, whose values this package mirrors exactly:

- `DOCS_SERVER_NAME` = `devscene-docs`. This is also the prefix of the stderr timing line `devscene-docs: search_ms=…` that `evals/docs-retrieval/mcp-backend-pass.mjs` matches through `` `${DOCS_SERVER_NAME}: search_ms=` ``.
- `PYTHON_RETRIEVAL_COMMAND` = `devscene-docs-retrieval`. `cli.py`'s one-line error form `devscene-docs-retrieval: <message>` is what the launcher, `doctor` and the evals' `MESSAGE_PREFIX` read.
- `PYTHON_DATABASE_URL_VARIABLE` = `DEVSCENE_DOCS_RETRIEVAL_DATABASE_URL`.
- `RETRIEVAL_STUB_ENV` = `DEVSCENE_RETRIEVAL_STUB`.

**What this task produces for later tasks:**

- the package directory `docs-retrieval-service/src/devscene_docs_retrieval/`, which Task 6's imports and Task 8's `scripts/check-model-revisions.mjs` → `PYTHON_MODELS` path name;
- `models.py` → `MODEL_CACHE_ENV` = `DEVSCENE_DOCS_RETRIEVAL_MODEL_CACHE`, which Task 7's `Dockerfile` and `compose.yaml` set;
- the default weight cache `<XDG_CACHE_HOME or ~/.cache>/devscene-docs-retrieval/models`, which Task 7's compose volume default names;
- `models.py` → `MANIFEST_NAME` = `devscene-docs-retrieval-models.json`, read from the root of that cache directory. The story index's `Manual setup required:` model-weights step renames an existing manifest to it, because a cache still carrying the old name reports every model missing;
- the console script `devscene-docs-retrieval`, which Task 7's `Dockerfile` `ENTRYPOINT` and `scripts/python-service.sh run` invoke.

**Where this task stops.** It edits no test file: Task 6 owns `docs-retrieval-service/tests/`, and the suite imports the old module until Task 6 lands. It also leaves `Dockerfile`, `compose.yaml`, `README.md` and `scripts/python-service.sh` alone, because Task 7 owns them. The `test_lock.py` rule (a `sentence-transformers` ≥ 4 in `uv.lock`) is unaffected by a project rename and must stay true.

### Targets

- `docs-retrieval-service/src/harness_docs_retrieval/` → `docs-retrieval-service/src/devscene_docs_retrieval/` (moved with `git mv`, every module inside)
- `docs-retrieval-service/pyproject.toml`
- `docs-retrieval-service/uv.lock`

**Work:**

- [ ] **Move the package.** Run `git mv docs-retrieval-service/src/harness_docs_retrieval docs-retrieval-service/src/devscene_docs_retrieval`, so history follows each module. Then rename every `harness_docs_retrieval` import and reference inside the moved modules to `devscene_docs_retrieval`.
- [ ] **The wire and name constants.** Make these edits:
  - In `wire.py`, set `DOCS_SERVER_NAME = "devscene-docs"`.
  - In `cli.py`, set `PROG = "devscene-docs-retrieval"` and update its module docstring.
  - In `store.py`, set `DATABASE_URL_ENV = "DEVSCENE_DOCS_RETRIEVAL_DATABASE_URL"`.
  - In `stubs.py`, set `RETRIEVAL_STUB_ENV = "DEVSCENE_RETRIEVAL_STUB"`.
  - In `models.py`, set `MODEL_CACHE_ENV = "DEVSCENE_DOCS_RETRIEVAL_MODEL_CACHE"` and `MANIFEST_NAME = "devscene-docs-retrieval-models.json"`. Change the cache subdirectory in `model_cache_dir` (and its docstring) to `"devscene-docs-retrieval"`, and change both "run harness-docs-retrieval fetch-models" remedies.
  - In `service.py`, change the same remedy.
  - In `__init__.py`, change the package docstring.

  Leave no fallback that reads an old variable or an old cache path (`harness-runs/lessons.md` → *"A rename declared breaking ships no compatibility path"*).
- [ ] **`pyproject.toml`.** Make these edits:
  - Set `[project] name = "devscene-docs-retrieval"`.
  - Change the `[project.scripts]` entry to `devscene-docs-retrieval = "devscene_docs_retrieval.cli:main"`.
  - Set `[tool.hatch.build.targets.wheel] packages = ["src/devscene_docs_retrieval"]`.
  - Change the `container` pytest marker's text to name `DEVSCENE_DOCS_RETRIEVAL_TEST_DATABASE_URL`, the variable Task 6's `conftest.py` reads.
- [ ] **Regenerate `uv.lock`.** From the checkout root, run `bash scripts/python-service.sh lock`, which runs `uv lock` in `docs-retrieval-service/`. The editable root package must now appear as `name = "devscene-docs-retrieval"`. If the run's sandbox refuses the network, return a blocker naming this step. Do not hand-edit the lock. This is a `Manual setup required:` step in the story index.

**Verification:**

- `git grep -nE 'harness[-_]docs|HARNESS_(DOCS_)?RETRIEVAL|AUTONOMOUS_SDLC_HARNESS_RETRIEVAL' -- docs-retrieval-service/src docs-retrieval-service/pyproject.toml docs-retrieval-service/uv.lock` returns no hits.
- `docs-retrieval-service/src/harness_docs_retrieval` no longer exists, and `docs-retrieval-service/src/devscene_docs_retrieval/py.typed` does.
- `grep -n 'name = "devscene-docs-retrieval"' docs-retrieval-service/uv.lock` finds the root package entry, and `grep -n 'name = "sentence-transformers"' docs-retrieval-service/uv.lock` still finds its entry.

**Deviations from plan:**

- **Move mechanism.** The plan specified `git mv`. The layer implementer's output contract forbids `git mv` / `git add` / `git rm`, and the run's permission profile refused `mkdir` and `cp`. So each of the 15 modules plus `py.typed` was written under `src/devscene_docs_retrieval/` with the file tools, and each old path was removed with its own plain `rm`. The committer stages both halves. Evidence that only names changed: `git diff --no-index --word-diff=plain --unified=0` of the old directory against the new one, run before the removals, showed only `harness_docs_retrieval`→`devscene_docs_retrieval` import and name edits, plus the constant and remedy edits this plan lists. `jscompat.py` and `py.typed` were byte-identical. The file tools decode a `\uXXXX` escape into its literal character. The escapes in `jscompat.py` → `JS_WHITESPACE` and `chunk.py` → `_ATX_HEADING` were therefore restored by writing a placeholder after the backslash and then replacing only the placeholder. The re-diff confirmed both files carry the original escape bytes.
- **Empty old directory.** `rmdir docs-retrieval-service/src/harness_docs_retrieval` was refused by the permission profile. The directory is empty on disk and untracked, so no commit carries it. It remains in this run copy's working tree only.
- **`uv.lock` not regenerated — blocked.** `bash scripts/python-service.sh lock` exited 1 with `error: Failed to initialize cache at <home>/.cache/uv` / `cause: failed to open file <home>/.cache/uv/sdists-v9/.git: Operation not permitted (os error 1)`, with the home directory written here as `<home>`. The sandbox refused uv's write to its user cache, which is outside the run's writable paths. The lock was not hand-edited. So `uv.lock` still names the root package `harness-docs-retrieval` at its `[[package]]` entry. The first `**Verification:**` grep therefore still returns that one `uv.lock` hit, and the third bullet's `devscene-docs-retrieval` lock check is unmet. The `sentence-transformers` entry is untouched.
- **`uv.lock` regenerated by the operator (re-dispatch).** The operator answered the park on the blocker above (`harness-runs/clarifications/chore_devscene_docs_retrieval/answer_1.md`, Q1 (a)) by running `bash scripts/python-service.sh lock` and `bash scripts/python-service.sh sync` in this run copy outside the sandbox. The lock was therefore not produced by this unit, and this unit ran neither command. Verified on re-dispatch: `git diff -- docs-retrieval-service/uv.lock` shows the root `[[package]]` entry renamed from `harness-docs-retrieval` to `devscene-docs-retrieval` and re-sorted alphabetically ahead of `fastapi`, `filelock`, `fsspec` and `h11`; those four entries moved unchanged; no version, hash or dependency changed. The `uv.lock` bullet above is superseded.
- **Empty old directory, re-dispatch.** `rmdir docs-retrieval-service/src/harness_docs_retrieval` was refused again (`Permission to use Bash has been denied`). It is still empty and untracked: `git status --porcelain --untracked-files=all` lists no path under it except the 17 tracked deletions.
- **Verification on re-dispatch.** All three `**Verification:**` bullets are now met:
  - The first bullet's `git grep` over `docs-retrieval-service/src`, `pyproject.toml` and `uv.lock` exits 1 with no output. The same pattern run with `grep -rnE` over the working tree, which includes the untracked new package, also has no hit.
  - `src/devscene_docs_retrieval/py.typed` exists.
  - `grep -n` finds `name = "devscene-docs-retrieval"` at `uv.lock` line 324 and `name = "sentence-transformers"` at line 2031. The root package still declares `sentence-transformers` with specifier `>=4.0` under `extra == 'models'`.
  - `bash scripts/typecheck.sh` printed `PASS: typecheck`.
  - The tree guard `test/no-container-home-paths.test.mjs` was selected because this plan file matches `**/*.md`. It ran through `npm test --workspace cli -- test/no-container-home-paths.test.mjs` and reported `# pass 1`, `# fail 0`.
- **Verification run.** The first bullet's grep, run over `docs-retrieval-service/src` and `pyproject.toml`, returns no hit. The one remaining hit is in `uv.lock`, as described above. The second bullet holds: `src/devscene_docs_retrieval/py.typed` exists, and no tracked file remains under `src/harness_docs_retrieval`. The whole-tree `bash scripts/typecheck.sh` passed (`PASS: typecheck`). It covers shell parse and `tsc`, not the Python package's mypy. The Python package's mypy is `bash scripts/python-service.sh typecheck`, and no phase of this flow's unit loop runs it. Its `tests/` still import the old module until Task 6.
