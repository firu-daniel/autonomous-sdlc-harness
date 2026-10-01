### Task 6 — Port the hash stubs and the stub selector, with a stub-parity case against the TypeScript stubs (`stubs.py`)

**Goal:** Give the Python package the same stub seam the TypeScript suite uses, so no test ever downloads or loads a model. The stand-ins must produce **identical** vectors and scores to the TypeScript ones, so that Task 15's end-to-end byte comparison runs with no weights at all.

**Depends on:** Task 5 (`models.py`: the `Embedder` / `Reranker` protocols, `EMBEDDING_DIMENSIONS`, and `load_models(allow_remote: bool) -> tuple[Embedder, Reranker]`), Task 2 (`jscompat.py` → `json_stringify_str`) and Task 4 (`tests/ts_bridge.py` → `run_bridge("stub-models", stdin={...})` returning `{embedderId, rerankerId, dimensions, documentVectors, queryVector, scores}`, and `run_bridge("constants")["models"]["RETRIEVAL_STUB_ENV"]`).

**Ported from:** `cli/src/retrieval/models.ts`: `RETRIEVAL_STUB_ENV`, `stubEnvValue`, `stubModelsSelected`, `STUB_VERSIONS`, `stubTokens`, `stubEmbedder`, `STUB_RERANKER`, `resolveModels`.

**The variable name, decided.** The semantics are identical: unset or empty loads the real models, `hash-v1` / `hash-v2` select the stubs, and any other non-empty value is refused. So the Python package **reuses** `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` rather than minting a second name. The parity case asserts the Python constant equals the TypeScript export, so the two cannot drift.

**Where this task stops.** `resolve_models` is consumed by Task 10's `open_session` and by nothing else. The weight-cache presence check that runs **even under the stub** is Task 5's `model_files_present`, and Task 10 calls it before `resolve_models`, the order `cli/src/retrieval/session.ts` uses. This task adds no presence check.

### Targets

- `docs-retrieval-service/src/harness_docs_retrieval/stubs.py` (new)
- `docs-retrieval-service/tests/test_stubs.py` (new)

**Work:**

- [ ] **Selection.** `RETRIEVAL_STUB_ENV = "AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB"`, `STUB_VERSIONS = ("hash-v1", "hash-v2")`, and `stub_models_selected() -> bool`, true when the variable is set to a non-empty value. The variable is read in one function, mirroring `stubEnvValue`. `resolve_models(allow_remote: bool) -> tuple[Embedder, Reranker]` returns `models.load_models(allow_remote=allow_remote)` when no stub is selected and the stub pair for a legal version. For any other value it raises `ServiceError` with the TypeScript message reproduced exactly: `f"{RETRIEVAL_STUB_ENV} is set to {json_stringify_str(value)}; its legal values are hash-v1 and hash-v2, or unset it to load the real models"`.
- [ ] **The stubs, bit for bit.**
  - `stub_tokens(text, min_length)`: `text.lower()`, split on `[^a-z0-9]+`, and keep tokens of at least `min_length`.
  - The stub embedder: `id = f"stub-hash:{version}"` and `dimensions = 384`. Its salt is `"v2"` for `hash-v2` and `""` otherwise. Each token of length ≥ 2 adds `1` to bucket `int.from_bytes(sha256(salt + token as UTF-8).digest()[:4], "big") % 384`. The vector is divided by its Euclidean norm, unless that is zero.
  - **Accumulate the sum of squares with an explicit left-to-right loop from `0.0`.** Python 3.12+'s `sum()` over floats uses compensated summation, which is not what JS's `reduce` computes.
  - `STUB_RERANKER`: `id = "stub-overlap"`. The score is the count of unique query tokens (length ≥ 3, first-seen order) present among the passage's tokens (length ≥ 2), divided by the unique query-token count, and `0` for a query with none.
  - Both are `async`, to satisfy Task 5's protocols.
- [ ] `test_stubs.py`: opens with the rule (*the stubs are a test seam and must agree with the TypeScript stubs exactly, or Task 15's comparison measures the stubs instead of the backends*). For each of `hash-v1` and `hash-v2` it sends one fixed input through `run_bridge("stub-models", …)`. The input has documents with punctuation, digits, mixed case, non-ASCII letters, an empty string and a single-character string, plus a query and passages that include a no-overlap passage. The test asserts with `==`, not approximately, that the Python stubs give equal `documentVectors`, `queryVector` and `scores`, and equal `embedderId`, `rerankerId` and `dimensions`. It also asserts that `RETRIEVAL_STUB_ENV == run_bridge("constants")["models"]["RETRIEVAL_STUB_ENV"]`, that the refusal for `hash-v3` matches the message above byte for byte, and that with the variable unset `resolve_models` calls `models.load_models` (monkeypatched to a sentinel) with the `allow_remote` it was given.

**Verification:**

- `tests/test_stubs.py` passes (subject to the story index's test-run note). Exact float equality holds because the vectors cross the bridge as JSON, which round-trips every IEEE double.
- `grep -n "sum(" docs-retrieval-service/src/harness_docs_retrieval/stubs.py` finds no `sum()` over the vector.
- Every hit of `grep -rn "AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB" docs-retrieval-service/src` is the `RETRIEVAL_STUB_ENV` definition in `stubs.py`. Every reader and every message takes the name from that constant, the rule `.claude/context/conventions.md` states for an environment-variable name.
