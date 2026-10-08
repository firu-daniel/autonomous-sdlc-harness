### 1. mypy follows the installed `models` extra into numpy stubs that need Python 3.12

**File:** `docs-retrieval-service/pyproject.toml` (`[[tool.mypy.overrides]]`): "module = [\"sentence_transformers.*\", \"torch.*\"]", under the comment "# The gate environment never installs the `models` extra."

**Failing test:** none: gate 13b, Python typecheck (`bash scripts/python-service.sh typecheck`, which runs `uv run --frozen --no-sync mypy`)

**Failure, from the log** (machine paths rewritten):

```
  FAIL  13b Python typecheck (exit 1)
        <home>/.cache/harness-docs-retrieval/venvs/1297741952/lib/python3.14/site-packages/numpy/__init__.pyi:737: error: Type statement is only supported in Python 3.12 and greater  [syntax]
        Found 1 error in 1 file (errors prevented further checking)
```

Class: new this round (first gate round on this branch; no earlier log to compare against).

**Diagnosis.**

- `docs-retrieval-service/pyproject.toml` → `[tool.mypy]` sets `strict = true` and `python_version = "3.11"`. The only mypy override covers `sentence_transformers.*` and `torch.*` with `ignore_missing_imports = true`. Its comment says this is safe because the gate environment never installs the `models` extra.
- That premise no longer holds in this checkout. `scripts/python-service.sh` keeps one virtual environment per checkout, outside the tree (`UV_PROJECT_ENVIRONMENT="$cache_root/venvs/$checkout_key"`). The branch's operator protocol in `docs/retrieval-eval.md` → `### Measuring the Python backend against the TypeScript one` uses `sync --with-models` to provision that environment. `typecheck` runs with `--no-sync`, so the extra stays installed. The environment now holds `sentence_transformers` 6.1.0, `torch` 2.14.1, `transformers` 5.18.0 and `numpy` 2.5.3.
- `docs-retrieval-service/src/harness_docs_retrieval/models.py` → `load_models` has `import torch` and `from sentence_transformers import CrossEncoder, SentenceTransformer`. These imports sit inside a function, but mypy still resolves them. Because the packages are now installed, `ignore_missing_imports` does not apply, and mypy follows the imports into the installed sources. Through them it reaches `numpy/__init__.pyi`, whose line 737 is `type _Falsy = L[False, 0] | bool_[L[False]]`. That is a PEP 695 `type` statement, and mypy rejects it as a syntax error under `python_version = "3.11"`. A syntax error stops all further checking.
- No module under `src/` or `tests/` imports numpy directly. numpy is reached only through the two modules the override already names.
- The typecheck therefore depends on whether the `models` extra happens to be installed in the per-checkout environment. The tree should make it independent of that.

**Fix.**

In `docs-retrieval-service/pyproject.toml`, add `follow_imports = "skip"` to the existing override. The block becomes:

```toml
# The gate environment does not install the `models` extra, but a checkout whose environment was
# provisioned with `sync --with-models` (the backend-comparison protocol in docs/retrieval-eval.md)
# has it installed. Skipping these modules keeps the typecheck the same either way: they type as
# `Any`, as they do when absent, and mypy never parses their sources or the numpy stubs behind them.
[[tool.mypy.overrides]]
module = ["sentence_transformers.*", "torch.*"]
ignore_missing_imports = true
follow_imports = "skip"
```

- [ ] Keep `ignore_missing_imports = true`. It still covers the usual gate environment, where the extra is absent.
- [ ] Do not raise `python_version`. `requires-python = ">=3.11"` and ruff's `target-version = "py311"` both state 3.11 as the floor. Raising it would let 3.12-only syntax into the service's own source.
- [ ] Do not add `numpy.*` to the override. Nothing in `src/` or `tests/` imports it, and skipping the two entry points already keeps mypy out of numpy.
- [ ] For verification, re-read the edited block and confirm `follow_imports = "skip"` sits in the same `[[tool.mypy.overrides]]` table as the two module patterns. `commands.typecheck` (`bash scripts/typecheck.sh`) does not run mypy over the Python service. Do not invoke gate 13b's command (`bash scripts/python-service.sh typecheck`) yourself, because the Run gates phase re-runs it.
