### 2. Gate 6a matches gitignored bytecode that a gate 13c test writes into `docs-retrieval-service/src/`

**Files:**
- `docs-retrieval-service/tests/test_launcher_e2e.py` → `def _launcher_env(model_cache: Path, database_url: str)`, the dict that yields `"HOME": home,` / `"PATH": _launcher_path(),`
- `scripts/run-gates.sh` → `machine_path_hits()`, the line containing `--exclude-dir=test_run_logs --exclude-dir=scratch`
- `docs/development.md` → **Gate 6 — self-containment**, the fenced `grep -rn "$HOME" .` command and the paragraph after it that begins `Those two must print nothing`

**Failing test:** none — gate 6a, no machine paths (`machine_path_hits` in `scripts/run-gates.sh`, graded on output)

**Failure, from the log:**

```
  FAIL  6a no machine paths (printed output, which is the finding)
        Binary file ./docs-retrieval-service/src/harness_docs_retrieval/__pycache__/chunk.cpython-314.pyc matches
        Binary file ./docs-retrieval-service/src/harness_docs_retrieval/__pycache__/self_check.cpython-314.pyc matches
        Binary file ./docs-retrieval-service/src/harness_docs_retrieval/__pycache__/corpus.cpython-314.pyc matches
        ...
        Binary file ./docs-retrieval-service/src/harness_docs_retrieval/__pycache__/store.cpython-314.pyc matches
```

The log lists 16 such lines, one for each module of the `harness_docs_retrieval` package: `chunk`, `self_check`, `corpus`, `http_app`, `refresh`, `mcp_server`, `search`, `service`, `errors`, `stubs`, `wire`, `jscompat`, `cli`, `models`, `__init__`, `store`.

Class: the gate persists from round 1, but these hits are new this round. Round 1's 6a hits were all under `harness-runs/scratch/`, and round 1's `--exclude-dir=scratch` fix cleared them. The `.pyc` files were written during round 1's gate 13 run, after round 1's gate 6a had already passed over the tree. So this is not a regression from round 1's fix. They show up now because round 2 is the first 6a run since those files were written.

**Diagnosis.**

- A `.pyc` file records its source's absolute path (`co_filename`). The package is installed editable into the per-checkout environment, which lives under the home directory, so every `.pyc` written beside `docs-retrieval-service/src/harness_docs_retrieval/` contains the checkout's absolute path. `grep -rn "$HOME"` matches that path. `__pycache__/` is in the root `.gitignore`, so these files can never be committed, but gate 6a greps the working tree, not the index.
- `scripts/python-service.sh` exports `PYTHONDONTWRITEBYTECODE=1` so that the wrapper's lint, typecheck and test runs write no bytecode. Most test subprocesses inherit it, because they build their environment as `{**os.environ, ...}`. `_launcher_env` in `tests/test_launcher_e2e.py` does not. It builds a fresh dict containing only `HOME`, `PATH`, `RETRIEVAL_STUB_ENV`, `MODEL_CACHE_ENV` and `DATABASE_URL_ENV`, so `PYTHONDONTWRITEBYTECODE` is dropped. `test_the_launcher_exits_3_when_the_python_backend_cannot_reach_its_store` has no `container` marker and runs in gate 13c. It starts `scripts/docs-search-server.sh`, which runs the `harness-docs-retrieval` console script, and that imports the whole package and writes a `.pyc` for every module. The files are timestamped 11 seconds before round 1's log was closed, during gate 13.
- Gate 6a's grep already excludes `test_run_logs` and `scratch`, because those directories are gitignored and machine-local by construction. `__pycache__` is in the same category. Any Python process run against the editable install without the wrapper's environment (a test with a scrubbed environment, or an operator's own `uv run`) will create these files again.

**Fix.**

1. In `docs-retrieval-service/tests/test_launcher_e2e.py` → `_launcher_env`, add `"PYTHONDONTWRITEBYTECODE": "1",` to the yielded dict, after `"PATH": _launcher_path(),`. If the function's docstring or a nearby comment lists what the scrubbed environment carries, add one clause to it: the launcher's Python child must write no bytecode into the editable source tree, as the wrapper's own runs do not.
2. In `scripts/run-gates.sh` → `machine_path_hits()`, append `--exclude-dir=__pycache__` after `--exclude-dir=scratch`:

   ```sh
   grep -rn "$HOME" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --exclude-dir=test_run_logs --exclude-dir=scratch --exclude-dir=__pycache__ | grep -v '^\./\.git:[0-9][0-9]*:'
   ```

   Extend the comment block above `machine_path_hits()` (the one ending `so 6a would otherwise fail on files that can never be committed.`) with: `` `__pycache__` holds Python bytecode, which records each source's absolute path: gitignored, never committed, and written by any Python run against the editable install that does not carry `PYTHONDONTWRITEBYTECODE`. ``
3. In `docs/development.md` → **Gate 6 — self-containment**, make the same change to the fenced `grep -rn "$HOME" .` command, so that it stays byte-identical to the one in `scripts/run-gates.sh`. In the paragraph beginning `Those two must print nothing`, after the `--exclude-dir=scratch` clause, add: `; --exclude-dir=__pycache__ skips Python bytecode, which records each source's absolute path and which the root .gitignore already keeps out of every commit`. Wrap the flag in backticks to match the clauses around it.

- [ ] Keep the exclusion a directory-name `--exclude-dir`, like its neighbours. Do not exclude `*.pyc` by file pattern or exclude `docs-retrieval-service/` as a whole.
- [ ] Leave the existing `.pyc` files on disk alone. Once step 2 is in place, gate 6a no longer reads them.
- [ ] Verification: confirm that the `grep` line in `scripts/run-gates.sh` and the fenced command in `docs/development.md` are identical, and that `_launcher_env`'s dict has the new key. Do not run gate 6a or gate 13c yourself, because the Run gates phase re-runs them.
