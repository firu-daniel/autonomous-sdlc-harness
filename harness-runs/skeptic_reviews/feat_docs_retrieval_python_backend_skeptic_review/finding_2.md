### 2. Durable comments cite plan units, and one says the compose file passes flags it does not

**Files and sites:**
- `docs-retrieval-service/src/harness_docs_retrieval/cli.py` (`_configure_serve_http`): `# Task 14's compose file passes both flags; the defaults keep a bare run local-only.`
- `docs-retrieval-service/tests/test_cli.py` (module docstring): `` `serve-http`'s `--host` / `--port`, which Task 14's compose file`` / `passes.`
- `docs-retrieval-service/tests/test_search.py` (module docstring): `` Task 15's end-to-end case covers `snippet_of` against it.``
- `docs-retrieval-service/tests/test_corpus.py` (module docstring): `` Task 4 compares against the running``
- `docs-retrieval-service/tests/test_chunk.py` (module docstring): `` Task 4 compares against the running TypeScript.``

**Problem.**

*A false claim.* `cli.py` and `test_cli.py` both say the compose file passes `serve-http`'s `--host` and `--port`. It does not. `docs-retrieval-service/compose.yaml`'s `service` entry has no `command:` key. The flags come from the service image's default command in `docs-retrieval-service/Dockerfile`: `CMD ["serve-http", "--host", "0.0.0.0", "--port", "8080", "--repo", "/repo"]`. The wrong file matters to one reader in particular: someone who changes the bind address or port. Reading the comment, they edit `compose.yaml` and find nothing there to change. Or they add a `command:` that silently drops `--repo /repo`, since a compose `command:` replaces the whole `CMD`.

*Unresolvable pointers.* "Task 4", "Task 14" and "Task 15" are unit numbers of this branch's plan, `harness-runs/task_plans/feat_docs_retrieval_python_backend/task_<N>_plan.md`. That is a point-in-time run artifact. Nothing in the comment says which branch's plan it means, and the next branch's plan reuses the same numbers. A maintainer reading these files later cannot resolve them. The test files each name refers to are in this package:
- Task 4 is `tests/test_chunk_parity.py`. Its docstring: *"the Python backend enumerates the same files with the same warnings, and produces the same chunk keys … as the running TypeScript code"*.
- Task 15 is `tests/test_backend_parity_e2e.py`, whose `docs/snippet-edges.md` corpus entry exercises the snippet cut.

**Fix.** Edit comment text only. No code changes.

- [ ] `cli.py` → `_configure_serve_http`: replace the comment line with
  `# The service image's CMD (Dockerfile) passes both flags; the defaults keep a bare run local-only.`
  If that exceeds 100 characters with its indentation, wrap it onto two `#` lines.
- [ ] `tests/test_cli.py` module docstring: replace `which Task 14's compose file` / `passes.` with `which the service image's` / `` `CMD` in `Dockerfile` passes.``, rewrapping the docstring at 100 characters.
- [ ] `tests/test_search.py` module docstring: replace `` Task 15's end-to-end case covers `snippet_of` against it.`` with `` `test_backend_parity_e2e.py` covers `snippet_of` against it end to end.``, rewrapping at 100 characters.
- [ ] `tests/test_corpus.py` module docstring: replace `Task 4 compares` with `` `test_chunk_parity.py` compares``, rewrapping at 100 characters.
- [ ] `tests/test_chunk.py` module docstring: replace `Task 4 compares` with `` `test_chunk_parity.py` compares``, rewrapping at 100 characters.
- [ ] Confirm no plan-unit pointer remains. `grep -rnE "Task [0-9]+" docs-retrieval-service/src docs-retrieval-service/tests` must print nothing.
