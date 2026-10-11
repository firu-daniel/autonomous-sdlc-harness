### Task 6 — Pin the Python service's two models to immutable revisions in `models.py`

**Goal:** Make the Python backend's first fetch load a fixed commit, not `revision=None`, and make every later load use that same commit. Today `fetch_models` records whatever `refs/main` named at fetch time, so two machines can record different revisions. After this task the manifest records the pin, and a manifest at any other revision reads as unfetched.

**The pins** are each repository's `main` on 2026-10-11. They equal the revisions the planner's own provisioned manifest (`harness-docs-retrieval-models.json`) already records, so a machine that has fetched since 2026-08-09 needs no re-fetch:

- `BAAI/bge-small-en-v1.5` → `5c38ec7c405ec4b44b94cc5a9bb96e735b38267a`
- `cross-encoder/ms-marco-MiniLM-L-6-v2` → `233902d25c440f23af6f7d6e94d2946bac0bee0a`. The Hub now redirects this id to `cross-encoder/ms-marco-MiniLM-L6-v2`, and the revision resolves through the redirect. **The id is not changed here**, because swapping models is out of scope and the redirect is transparent to `huggingface_hub`. Task 9's drift notice reports the rename.

**Weights and code execution, verified by the planner.** The provisioned manifest lists `model.safetensors`, and no `pytorch_model.bin`, for both models. sentence-transformers prefers safetensors when the snapshot has it, and both pinned snapshots do: the Hub's sibling lists at those revisions include `model.safetensors`. Neither `SentenceTransformer` nor `CrossEncoder` is passed `trust_remote_code`, so it defaults to off. This task makes `trust_remote_code=False` explicit, so a future edit cannot turn it on silently.

**Where this task stops.** It changes the Python path only; the CLI's pins are **Task 2**'s. **Task 9**'s drift script reads this module's pins by matching these two exact source lines, so keep each on one line in this form:

```python
EMBEDDING_REVISION = "5c38ec7c405ec4b44b94cc5a9bb96e735b38267a"
RERANK_REVISION = "233902d25c440f23af6f7d6e94d2946bac0bee0a"
```

It also matches the existing `EMBEDDING_MODEL = "…"` and `RERANK_MODEL = "…"` lines, which this task leaves byte-identical. `MODEL_VERSION` stays `1` and neither id moves, because the pinned weights are the ones every current manifest records. The constants' comment states that a pin bump bumps `MODEL_VERSION`, as Task 2 states for the CLI.

### Targets

- `docs-retrieval-service/src/harness_docs_retrieval/models.py` — the pins, `model_files_present`, `load_models`, `_fetched_entry`, and the module docstring.
- `docs-retrieval-service/tests/model_cache.py` — `plant_model_files`.
- `docs-retrieval-service/tests/test_models.py` — the presence cases.

**Work:**

- [ ] `models.py`: add `EMBEDDING_REVISION`, `RERANK_REVISION` (the exact lines above) and `MODEL_REVISIONS: dict[str, str] = {EMBEDDING_MODEL: EMBEDDING_REVISION, RERANK_MODEL: RERANK_REVISION}`, each with a comment. Extend the module docstring: both loads name the pin, and the manifest records the pin rather than whatever `refs/main` named.
- [ ] `models.py` → `model_files_present`: a manifest entry whose `revision` is not `MODEL_REVISIONS[model_id]` is treated as no entry, reported as `<model id>/<MANIFEST_NAME>`. That is the shape an unfetched model already takes, so `self_check`'s `weights` line and `doctor`'s `retrieval-python-model-cache` need no new wording. Say so in the docstring.
- [ ] `models.py` → `load_models`: pass `revision=MODEL_REVISIONS[<id>]` and `trust_remote_code=False` to both `SentenceTransformer(...)` and `CrossEncoder(...)`, whether or not remote loading is allowed. When it is not allowed, keep the refusal for an unfetched model, and widen it to a manifest that records another revision: the `ServiceError` names the recorded and the pinned revision, and says to run `harness-docs-retrieval fetch-models` where an operator is present. Replace `_manifest_revision` with that check.
- [ ] `models.py` → `_fetched_entry`: read the snapshot at `snapshot_dir(cache_dir, model_id, MODEL_REVISIONS[model_id])` instead of reading `refs/main`. `huggingface_hub` writes no `refs/main` for a commit-hash revision. Keep the "holds no files" refusal, now naming the pinned snapshot. Update its docstring.
- [ ] Tests. In `tests/model_cache.py`, remove `FAKE_REVISION` and plant each model at `MODEL_REVISIONS[model_id]`, keeping the module's stated rule that a planted cache is shaped exactly like one `fetch_models` leaves. In `tests/test_models.py`, switch `test_one_deleted_file_is_reported_alone` to the pinned revision. Add `test_manifest_at_another_revision_reads_as_unfetched`: write a manifest whose entries carry `"0" * 40` and plant those files, then assert `missing == (f"{EMBEDDING_MODEL}/{MANIFEST_NAME}", f"{RERANK_MODEL}/{MANIFEST_NAME}")`. Add `test_pins_are_full_commit_hashes`: each `MODEL_REVISIONS` value matches `^[0-9a-f]{40}$`, and its keys equal `MODEL_IDS`.

**Verification:**

- `grep -nE '^(EMBEDDING|RERANK)_(MODEL|REVISION) = "' docs-retrieval-service/src/harness_docs_retrieval/models.py` prints exactly four lines: the two ids, unchanged, and the two pins. This is the exact match Task 9 makes.
- `grep -n 'refs' docs-retrieval-service/src/harness_docs_retrieval/models.py` finds no read of `refs/main`.
- The test files this task edits. No conventions document states a single-file command for the Python suite, so under the test-run rule this unit skips the run and records the skip. Phase G's gate 13 (lint, mypy strict, the whole suite) grades these files, including every e2e and self-check case that plants through `plant_model_files`.
- Where this machine's Python environment has the `models` extra synced (`bash scripts/python-service.sh sync --with-models` has been run), run `bash scripts/python-service.sh run fetch-models` once. The manifest it writes must then record exactly the two pins. If the extra is not synced, record this as not run; it downloads torch, which this task does not provision.
