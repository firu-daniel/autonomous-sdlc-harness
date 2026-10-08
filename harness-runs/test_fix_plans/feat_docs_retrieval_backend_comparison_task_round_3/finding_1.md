### 1. mypy ignores `follow_imports = "skip"` for numpy because numpy ships `.pyi` stubs

**File:** `docs-retrieval-service/pyproject.toml`, in the `[[tool.mypy.overrides]]` table whose line is `module = ["sentence_transformers.*", "torch.*", "numpy", "numpy.*"]`. That table already carries `ignore_missing_imports = true` and `follow_imports = "skip"`.

**Failing test:** none — gate 13b, Python typecheck. The gate runs `bash scripts/python-service.sh typecheck`, which runs `uv run --frozen --no-sync mypy`.

**Failure, from the log** (machine paths rewritten):

```
  FAIL  13b Python typecheck (exit 1)
        <home>/.cache/harness-docs-retrieval/venvs/1297741952/lib/python3.14/site-packages/numpy/__init__.pyi:737: error: Type statement is only supported in Python 3.12 and greater  [syntax]
        Found 1 error in 1 file (errors prevented further checking)
```

Class: persisting. The error line is byte-identical in rounds 1, 2 and 3, so it has survived two fixes:

- Round 1 (commit "Stop mypy following imports into the optional models extra (Finding 1)") added `follow_imports = "skip"` for `sentence_transformers.*` and `torch.*`.
- Round 2 (commit "Add numpy to the skipped mypy override in pyproject (Finding 1)") added `"numpy"` and `"numpy.*"` to that override.

Neither fix changed the outcome. Both relied on `follow_imports = "skip"`, and that setting does not apply to this file.

**Diagnosis.**

- The per-checkout environment still has the `models` extra installed: numpy 2.5.3, torch 2.14.1 and sentence-transformers 6.1.0. Line 737 of `numpy/__init__.pyi` is `type _Falsy = L[False, 0] | bool_[L[False]]`, a PEP 695 `type` statement. mypy rejects it as a blocking syntax error under `[tool.mypy]` `python_version = "3.11"`.
- Round 2's diagnosis was correct about the route. `psycopg/types/numeric.py` imports numpy under `if TYPE_CHECKING:`, so mypy reaches numpy even though the service never imports it, and listing numpy in the override was the right step.
- **The cause is a mypy rule about stub files.** mypy applies `follow_imports` to `.pyi` stub files **only when `follow_imports_for_stubs` is true**. Otherwise a stub is always followed as `normal`, whatever `follow_imports` says.
  - The installed mypy (2.3.1) shows this in `mypy/build.py`. When it decides how to follow an import, it forces `follow_imports = "normal"` if `result.endswith(".pyi")  # Stubs are always normal` and `not options.follow_imports_for_stubs  # except when they aren't`.
  - numpy resolves to `numpy/__init__.pyi`, which is a stub. So the `"skip"` in the override has no effect on it, and mypy parses the file and fails on line 737.
  - `follow_imports_for_stubs` is a per-module option: it is listed in `PER_MODULE_OPTIONS` in `mypy/options.py`. Setting it in the same override table makes the existing `"skip"` apply to stubs too.
- This applies equally to any `.pyi` stubs that `torch` or `sentence_transformers` ship. The same setting covers all four module patterns.

**Fix.**

In `docs-retrieval-service/pyproject.toml`:

1. Add `follow_imports_for_stubs = true` to the existing override table.
2. Extend the comment above the table so it says why the setting is needed.

Leave the module list exactly as round 2 left it. The block becomes:

```toml
# The gate environment does not install the `models` extra, but a checkout whose environment was
# provisioned with `sync --with-models` (the backend-comparison protocol in docs/retrieval-eval.md)
# has it installed, and with it numpy, whose stubs use 3.12-only syntax. Skipping these modules
# keeps the typecheck the same either way: they type as `Any`, as they do when absent. numpy is
# listed as well as the two entry points because psycopg imports it under `TYPE_CHECKING`, which
# mypy would otherwise follow into those stubs. `follow_imports_for_stubs` is what makes the skip
# reach them at all: mypy follows a `.pyi` stub as `normal` regardless of `follow_imports` unless
# it is set.
[[tool.mypy.overrides]]
module = ["sentence_transformers.*", "torch.*", "numpy", "numpy.*"]
ignore_missing_imports = true
follow_imports = "skip"
follow_imports_for_stubs = true
```

- [ ] Put `follow_imports_for_stubs = true` in **this** override table, not in `[tool.mypy]`. In the global section it would apply to every stub mypy follows, including psycopg's own typing, and would widen the change beyond the four optional-extra modules.
- [ ] Keep `"numpy"` and `"numpy.*"` in the module list. Round 2's psycopg route still exists, and this fix only makes the skip effective on it.
- [ ] Do not raise `python_version`. `requires-python = ">=3.11"` and ruff's `target-version = "py311"` both set 3.11 as the floor.
- [ ] Do not uninstall the `models` extra from the per-checkout environment as a substitute. The tree must typecheck the same whether or not the extra is installed.
- [ ] Verification: re-read the edited table and confirm that `follow_imports = "skip"` and `follow_imports_for_stubs = true` are both in the one `[[tool.mypy.overrides]]` table that lists numpy. Do not invoke gate 13b's command yourself; the Run gates phase re-runs it.
