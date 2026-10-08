### 1. mypy still reaches numpy's 3.12-only stubs, through psycopg's type-only import

**File:** `docs-retrieval-service/pyproject.toml` → the `[[tool.mypy.overrides]]` table whose line is `module = ["sentence_transformers.*", "torch.*"]` (it already carries `follow_imports = "skip"`)

**Failing test:** none — gate 13b, Python typecheck (`bash scripts/python-service.sh typecheck`, which runs `uv run --frozen --no-sync mypy`)

**Failure, from the log** (machine paths rewritten):

```
  FAIL  13b Python typecheck (exit 1)
        <home>/.cache/harness-docs-retrieval/venvs/1297741952/lib/python3.14/site-packages/numpy/__init__.pyi:737: error: Type statement is only supported in Python 3.12 and greater  [syntax]
        Found 1 error in 1 file (errors prevented further checking)
```

Class: persisting. The error line is identical in round 1's log. Round 1's fix (commit "Stop mypy following imports into the optional models extra (Finding 1)") assumed numpy was reachable only through `sentence_transformers` and `torch`, and it is not.

**Diagnosis.**

- The per-checkout environment (`UV_PROJECT_ENVIRONMENT`, outside the tree) still has the `models` extra installed, so `numpy` 2.5.3 is present. Its `numpy/__init__.pyi` line 737 is `type _Falsy = L[False, 0] | bool_[L[False]]`, a PEP 695 `type` statement. mypy rejects it as a syntax error under `[tool.mypy]` `python_version = "3.11"`, and a syntax error stops all checking.
- Round 1 added `follow_imports = "skip"` for `sentence_transformers.*` and `torch.*`. That closes those two routes, but there is another one. `psycopg` ships `py.typed`, and the service imports it (`import psycopg`, `from psycopg import sql`, `from psycopg.conninfo import make_conninfo`). In the installed package, `psycopg/types/numeric.py` contains:

  ```python
  if TYPE_CHECKING:
      import numpy
  ```

  mypy treats `TYPE_CHECKING` as true, so it follows that import into `numpy/__init__.pyi`. When numpy is absent (the usual gate environment), the import resolves to nothing and mypy reports nothing, because the error falls inside a third-party module. When numpy is present, mypy parses the stub and the syntax error is fatal.
- Round 1's diagnosis said "No module under `src/` or `tests/` imports numpy directly". That is still true: the service code has no `import numpy`. But numpy is reached transitively through psycopg as well as through the two skipped modules, so it has to be skipped itself.

**Fix.**

In `docs-retrieval-service/pyproject.toml`, add numpy to the existing skipped override, and extend its comment to name the psycopg route. The block becomes:

```toml
# The gate environment does not install the `models` extra, but a checkout whose environment was
# provisioned with `sync --with-models` (the backend-comparison protocol in docs/retrieval-eval.md)
# has it installed, and with it numpy, whose stubs use 3.12-only syntax. Skipping these modules
# keeps the typecheck the same either way: they type as `Any`, as they do when absent. numpy is
# listed as well as the two entry points because psycopg imports it under `TYPE_CHECKING`, which
# mypy would otherwise follow into those stubs.
[[tool.mypy.overrides]]
module = ["sentence_transformers.*", "torch.*", "numpy", "numpy.*"]
ignore_missing_imports = true
follow_imports = "skip"
```

- [ ] List both `"numpy"` and `"numpy.*"`, so that the package itself and its submodules are both matched explicitly.
- [ ] Keep `ignore_missing_imports = true` and `follow_imports = "skip"`. Do not raise `python_version`, because `requires-python = ">=3.11"` and ruff's `target-version = "py311"` both state 3.11 as the floor.
- [ ] Do not uninstall the `models` extra from the per-checkout environment as a substitute. The tree has to typecheck the same whether or not the extra is installed.
- [ ] Verification: re-read the edited table and confirm that the module list and `follow_imports = "skip"` are in the same `[[tool.mypy.overrides]]` table. Do not invoke gate 13b's command yourself, because the Run gates phase re-runs it.
