### Task 5 — Add the model interfaces, the fp32 sentence-transformers loader, the weight cache and its presence check (`models.py`)

**Goal:** Give the package the two interfaces every consumer takes (`Embedder`, `Reranker`) and the real models behind them: `BAAI/bge-small-en-v1.5` and `cross-encoder/ms-marco-MiniLM-L-6-v2`, the originals of the `Xenova/*` ONNX exports the TypeScript side runs. Both are loaded through `sentence-transformers` at full precision on CPU, from a separate local weight cache, and that cache is downloaded into only by `fetch_models`.

**Depends on:** Task 1 (`errors.py` → `ServiceError`; the `models` extra in `pyproject.toml`; `bash scripts/python-service.sh sync --with-models`).

**Ported from:** `cli/src/retrieval/models.ts`: `Embedder`, `Reranker`, `EMBEDDING_QUERY_PREFIX`, `MODEL_VERSION`, `EMBEDDING_DIMENSIONS`, `loadModels`, `fetchModels`, `modelFilesPresent`. The module's rule carries over unchanged: **a model is downloaded only by `fetch_models`, at setup time, and every other load runs with remote loading disabled, so a run never reaches the network.**

**Where this task stops.** The hash stubs and the `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` selector, including `resolve_models`, are Task 6's, and they call this task's `load_models(allow_remote=...)` when no stub is selected. The `fetch-models` sub-command that calls `fetch_models()` is Task 13's, and Task 13's self-check also reads `model_files_present`. The README's explanation of the precision and id decision is Task 17's, and this task states the decision in code and docstring only.

### Targets

- `docs-retrieval-service/src/harness_docs_retrieval/models.py` (new)
- `docs-retrieval-service/tests/model_cache.py` (new) — the test helper that plants a fake weight cache.
- `docs-retrieval-service/tests/test_models.py` (new)

**Work:**

- [ ] **Interfaces and ids.** `class Embedder(Protocol)` declares `id: str`, `dimensions: int`, `async def embed_documents(self, texts: Sequence[str]) -> list[list[float]]` and `async def embed_query(self, text: str) -> list[float]`. `class Reranker(Protocol)` declares `id: str` and `async def score(self, query: str, passages: Sequence[str]) -> list[float]`, where every score lies in `[0, 1]` and higher is better. Constants:
  - `EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"` and `RERANK_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"`;
  - `EMBEDDING_QUERY_PREFIX`, copied verbatim from `models.ts`;
  - `EMBEDDING_DIMENSIONS = 384`, `MODEL_PRECISION = "fp32"`, `MODEL_VERSION = 1` (bumped by hand when a loading parameter changes) and `ID_NAMESPACE = "py-st"`;
  - `EMBEDDER_ID = "py-st/BAAI/bge-small-en-v1.5:fp32:cls:384:v1"` and `RERANKER_ID = "py-st/cross-encoder/ms-marco-MiniLM-L-6-v2:fp32:sigmoid:v1"`, both composed from the constants above, never typed whole.

  The docstring states the decision: full precision is the normal Python path and the default here. The id is namespaced because nothing in this branch measures whether the two backends' vectors are interchangeable, and a shared id would claim they are. It encodes the precision the way the TypeScript id encodes `q8`. Deciding whether ids may ever be shared belongs to the comparison branch.
- [ ] **The weight cache and its presence check.** `MODEL_CACHE_ENV = "HARNESS_DOCS_RETRIEVAL_MODEL_CACHE"`. `model_cache_dir() -> Path` returns that variable when it is non-empty, otherwise `${XDG_CACHE_HOME}/harness-docs-retrieval/models` when `XDG_CACHE_HOME` is non-empty, otherwise `~/.cache/harness-docs-retrieval/models`. It is deliberately a separate location from the CLI's Xenova cache. The cache is in the Hugging Face hub layout (`models--<org>--<name>/snapshots/<revision>/…`) and carries a manifest, `MANIFEST_NAME = "harness-docs-retrieval-models.json"`, of shape `{"version": 1, "models": {<model id>: {"revision": <sha>, "files": [<snapshot-relative paths>]}}}`. Only `fetch_models` writes it, from what it actually downloaded, so the file list is a record rather than a guess. `@dataclass(frozen=True) class ModelFiles(present: bool, missing: tuple[str, ...])` and `model_files_present(cache_dir: Path) -> ModelFiles` test **file existence only**, loading nothing. A missing or unreadable manifest reports each model as `<model id>/<MANIFEST_NAME>`, and a missing snapshot file reports `<model id>/<file>`.
- [ ] **Loading and fetching.** `load_models(allow_remote: bool) -> tuple[Embedder, Reranker]` imports `sentence_transformers` (and `torch`) **lazily inside the function**, so importing `models.py` loads neither. That is the Python twin of the CLI's dynamic-import rule. If the import fails, it raises `ServiceError` naming `bash scripts/python-service.sh sync --with-models`. With `allow_remote` false it passes `local_files_only=True` and the manifest's `revision` to both loaders. It loads `SentenceTransformer(EMBEDDING_MODEL, cache_folder=…, device="cpu")`, encodes with `normalize_embeddings=True`, and checks that the loaded pooling module is CLS, raising if not, because the id claims `cls`. `embed_query` prepends `EMBEDDING_QUERY_PREFIX`. It loads `CrossEncoder(RERANK_MODEL, cache_folder=…, device="cpu")` with an **explicit** sigmoid activation (read the installed version's parameter name: `activation_fn` in sentence-transformers v4+). Each `encode` and `predict` call runs in `asyncio.to_thread`. `fetch_models() -> None` is the one function that sets `allow_remote=True`. It loads both models, runs each once (`embed_query("warm up")`, `score("warm up", ["warm up"])`), and then writes the manifest from each snapshot's `refs/main` revision and its file listing. To read the installed API, run `bash scripts/python-service.sh sync --with-models`, which is provisioning. If that cannot reach the network, write against sentence-transformers' v4 API, say so in your return, and **never** download a model or run `fetch_models`.
- [ ] `tests/model_cache.py` and `test_models.py`. `plant_model_files(cache_dir: Path) -> None` writes a manifest with a fixed fake revision and an empty file per listed path in the hub layout. Tasks 10, 13 and 15 use it to satisfy the presence check, which runs even under the stub. `test_models.py` opens with the module's rule and asserts:
  - the two ids exactly;
  - `model_cache_dir()` precedence, including that an empty `XDG_CACHE_HOME` is treated as unset;
  - `model_files_present` on an empty directory (every model missing, by manifest), on a planted cache (present), and with one planted file deleted (exactly that `<model id>/<file>` missing);
  - that `import harness_docs_retrieval.models` in a `sys.executable` subprocess leaves `sentence_transformers` and `torch` out of `sys.modules`.

  No test calls `load_models` or `fetch_models`.

**Verification:**

- `tests/test_models.py` passes (subject to the story index's test-run note), in an environment synced **without** `--with-models`. Re-run a plain `bash scripts/python-service.sh sync` before finishing if you added the extra.
- `grep -n "^import torch\|^from sentence_transformers\|^import sentence_transformers" docs-retrieval-service/src/harness_docs_retrieval/models.py` finds nothing. Both are imported inside `load_models` only.
- `grep -n "allow_remote=True\|local_files_only=False" docs-retrieval-service/src/harness_docs_retrieval/models.py` has every hit inside `fetch_models`'s body.

**Deviations from plan:**

- The installed sentence-transformers API could not be read. `bash scripts/python-service.sh sync --with-models` exited 1: `uv.lock` resolves the `models` extra to `sentence-transformers==2.2.2` with `tokenizers==0.10.3`, and that sdist failed to build (`Failed to build tokenizers==0.10.3`, Rust build under CPython 3.14). `load_models` is written against the v4 API (`cache_folder`, `revision`, `local_files_only` and `activation_fn` on `CrossEncoder`), which 2.2.2 does not accept. The lock needs a `sentence-transformers>=4` floor in `pyproject.toml`, which is Task 1's file and outside this task's targets. A plain `bash scripts/python-service.sh sync` was re-run afterwards (`Checked 53 packages`). No model was downloaded, and `fetch_models` was not run.
- `tests/test_models.py`, Python lint and mypy were not run. The story index's test-run note gives no single-file Python command, so all three are deferred to the Run gates phase. The verification bullet "`tests/test_models.py` passes" therefore rests on reading the code, not on running it.
- Additions beyond the plan's named symbols, all in `models.py`: `MODEL_IDS`, `MANIFEST_VERSION`, `ManifestEntry`, `read_manifest`, `write_manifest`, `hub_model_dir` and `snapshot_dir`. `tests/model_cache.py` reuses them, so the planted cache and the real one share one layout. A manifest entry whose file list is empty counts as malformed, and the model is reported as `<model id>/<MANIFEST_NAME>`.
