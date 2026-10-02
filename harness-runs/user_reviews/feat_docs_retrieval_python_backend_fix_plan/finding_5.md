### 5. `fetch-models` under the stub exits 0 having provisioned nothing, while every stub run still needs a fetched cache

**Severity:** Should Fix. **Layer:** general (`docs-retrieval-service/` sits under the catch-all `path: "."`).

**Files (site anchors, grep-verified in the current tree):**
- `docs-retrieval-service/src/harness_docs_retrieval/cli.py` (`_run_fetch_models`) — "print(f\"fetch-models: stub models ({RETRIEVAL_STUB_ENV} set) need no download\")"
- `docs-retrieval-service/README.md` → `## Weights, precision and ids` → **Provisioning** — "With `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` set, `fetch-models` downloads nothing and writes no manifest, so unset it before fetching."
- `docs-retrieval-service/tests/test_self_check.py` (`test_fetch_models_under_the_stub_downloads_nothing`) — "assert cli.main([\"fetch-models\"]) == 0"

**Correction to the observation's location:** the user named `tests/test_cli.py` for the test expectation; the stub `fetch-models` expectation actually lives in `tests/test_self_check.py` → `test_fetch_models_under_the_stub_downloads_nothing`. `tests/test_cli.py` carries no `fetch-models` behaviour case (only the sub-command name list). The fix edits `test_self_check.py`.

## Problem

`cli/src/commands/docs.ts` (`docs fetch-models`) refuses under the stub before loading anything: *"docs fetch-models: refusing to download while AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB is set, because a stub run never downloads; unset it to fetch the real models"*. The Python sub-command instead prints `fetch-models: stub models (… set) need no download` and exits 0, with a code comment justifying it as *"a stub needs no weights, and the cache check is a separate step"*.

In this package that justification is false: `service.py` → `open_session` runs `model_files_present` before `resolve_models`, under the stub too, and the README says *"So a stub run still needs a fetched cache."* An operator who runs `fetch-models` with the stub variable still set gets exit 0 and a reassuring line, no manifest is written, and every later sub-command — stub or not — then refuses with a missing-cache error. That is exactly the outcome `docs fetch-models`'s refusal prevents. The README does note *"unset it before fetching"*, so this is Should Fix rather than Must Fix.

## Fix

- [x] In `cli.py` → `_run_fetch_models`, replace the exit-0 stub branch with a refusal:
  ```python
  if stub_models_selected():
      raise ServiceError(
          f"fetch-models: refusing to download while {RETRIEVAL_STUB_ENV} is set, because a "
          "stub run never downloads; unset it to fetch the real models"
      )
  ```
  `cli.main` already turns a `ServiceError` into one stderr line (`harness-docs-retrieval: <message>`) and exit `1`. Import `ServiceError` from `harness_docs_retrieval.errors` if `cli.py` does not already. Rewrite the comment above it: drop *"Where `docs fetch-models` refuses under the stub, this succeeds: a stub needs no weights, and the cache check is a separate step"* and state instead that it refuses under the stub, as `docs fetch-models` does, because a stub run still needs a fetched cache.
- [x] In `docs-retrieval-service/README.md` → **Provisioning**, replace the sentence "With `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB` set, `fetch-models` downloads nothing and writes no manifest, so unset it before fetching." with one stating that with the variable set `fetch-models` refuses with exit `1` and downloads nothing, so unset it before fetching.
- [x] In `tests/test_self_check.py`, rename `test_fetch_models_under_the_stub_downloads_nothing` to say it refuses (e.g. `test_fetch_models_under_the_stub_refuses_and_downloads_nothing`) and change its expectations: `cli.main(["fetch-models"]) == 1`, stdout is empty, and stderr is exactly `harness-docs-retrieval: fetch-models: refusing to download while AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_STUB is set, because a stub run never downloads; unset it to fetch the real models\n` (build it from `RETRIEVAL_STUB_ENV`). Keep the `must_not_download` monkeypatch.
