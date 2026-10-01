### 1. The `models` extra locks a 2022 `sentence-transformers` that the loader's own API calls cannot run on

**File:** `docs-retrieval-service/pyproject.toml` (`[project.optional-dependencies]` → `models`) — `"sentence-transformers",`

The `models` extra declares `sentence-transformers` and `torch` with no version floor, and `huggingface_hub` sits unbounded in the base dependencies. When the lock was resolved, uv took the newest `huggingface_hub` (`2.0.0` in `docs-retrieval-service/uv.lock`, the `name = "huggingface-hub"` entry) and then backtracked the `models` extra onto releases with no upper bound on the hub. The resulting lock pins:

- `sentence-transformers` **2.2.2** (sdist only, uploaded 2022-06-26), the `name = "sentence-transformers"` entry;
- `transformers` **4.12.2**, the `name = "transformers"` entry;
- `tokenizers` **0.10.3**, the `name = "tokenizers"` entry, as an sdist only (2021), with no wheel for any interpreter this package supports.

The code is written against a much newer library. `docs-retrieval-service/src/harness_docs_retrieval/models.py` (`load_models`) passes `revision=`, `local_files_only=` and `activation_fn=` to `SentenceTransformer` / `CrossEncoder`. Its own comment states that `activation_fn` is "the sentence-transformers v4+ name". None of the three keywords exists in 2.2.2. Also, 2.2.2 imports `cached_download` from `huggingface_hub`, and the hub removed that function long before 2.0.0. So on the locked set:

- `import sentence_transformers` raises `ImportError`. `load_models` catches it and reports `_MODELS_EXTRA_HINT`, which says the extra is not installed even when it is. Every real-model path is therefore dead: `fetch-models`, and every `serve-*` / `index` / `self-check` run without the stub.
- `self-check`'s `packages` line still answers `ok`, because `_resolves` uses `importlib.util.find_spec` and never imports.
- The service image's `RUN uv sync --frozen --no-dev --extra models …` (`docs-retrieval-service/Dockerfile`) must build `tokenizers` 0.10.3 from source on `python:3.12.11-slim-bookworm`. That image has no Rust toolchain, so `docker compose up --build` (Acceptance 3) fails at the service image.

No gate can catch this. Gate 13 syncs without the `models` extra, and `mypy` ignores `sentence_transformers.*` and `torch.*` (`[[tool.mypy.overrides]]`). That is how it got through.

**Fix:**

- [ ] In `docs-retrieval-service/pyproject.toml`, give the extra the floor its code already requires:

  ```toml
  [project.optional-dependencies]
  models = [
      # v4 is where CrossEncoder takes `activation_fn`, which models.py → load_models passes.
      "sentence-transformers>=4.0",
      "torch",
  ]
  ```

  Leave `huggingface_hub` in the base dependencies unbounded. The floor alone makes the resolver pick a hub version that a v4+ `sentence-transformers` (and the `transformers` it requires) accepts.
- [ ] Re-resolve the lock from the repository root. This is a provisioning command that reaches the network, not a test or gate run:

  ```
  bash scripts/python-service.sh lock
  ```

  Then confirm in the rewritten `docs-retrieval-service/uv.lock` that the `name = "sentence-transformers"` entry's `version` is 4.0 or later.
- [ ] Add `docs-retrieval-service/tests/test_lock.py` to guard the lock from the source side. No behavioural test can reach this, because no gate installs the `models` extra, and the header says so:

  ```python
  """The rule this file exists to enforce: the `models` extra is locked to a `sentence-transformers`
  whose API `models.load_models` calls (`activation_fn`, `revision`, `local_files_only`), which is
  v4 or later.

  No gate installs the `models` extra, so no behavioural test can reach the real loader. This reads
  `uv.lock` instead, a last resort taken for that reason.
  """

  import tomllib
  from pathlib import Path

  _LOCK = Path(__file__).resolve().parents[1] / "uv.lock"


  def test_the_locked_sentence_transformers_has_the_v4_api() -> None:
      lock = tomllib.loads(_LOCK.read_text(encoding="utf-8"))
      versions = [
          package["version"]
          for package in lock["package"]
          if package["name"] == "sentence-transformers"
      ]
      assert versions, "uv.lock carries no sentence-transformers entry"
      for version in versions:
          assert int(version.split(".")[0]) >= 4, version
  ```

  `tests/test_lock.py` is the one test file this fix creates. No conventions document states a single-file command for a Python test file, so record the skip under `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`, point 3. The Run gates phase runs it.

**Deviations from plan:**

- `tests/test_lock.py` was not run: no conventions document states a single-file command for a Python test file, so the run is deferred to the Run gates phase (`unit_loop_core.md` → `## The test-run rule`, point 3).
- The re-lock resolved `sentence-transformers` 6.1.0, `transformers` 5.18.0, `tokenizers` 0.23.2 (manylinux wheels present) and `huggingface-hub` 1.33.0. That the three keywords `load_models` passes still exist in 6.1.0 rests on the `>=4.0` floor, not on an import: no gate installs the `models` extra.
