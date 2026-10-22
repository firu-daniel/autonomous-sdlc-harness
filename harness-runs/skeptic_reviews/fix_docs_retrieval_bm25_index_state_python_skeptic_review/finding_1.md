### 1. Gate 13a (`Python lint`) fails on the branch: one `E501` in `test_store_statements.py` and one `ruff format` change in `store.py`

> **Self-contained per-finding file** for the `fix_docs_retrieval_bm25_index_state_python` skeptic-review index (`harness-runs/skeptic_reviews/fix_docs_retrieval_bm25_index_state_python_skeptic_review.md`). The implementer reads only this file to apply the fix. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**Files:**

- `docs-retrieval-service/tests/test_store_statements.py` (the module docstring): "taken for those two strings. Nothing here needs a database: the refusals below fail before connecting,"
- `docs-retrieval-service/src/harness_docs_retrieval/store.py` (`statements`, the trailing dict splat): "_end_state_key(index): statement"

**The problem.** `scripts/run-gates.sh` runs gate `13a Python lint` as `bash scripts/python-service.sh lint`. That wrapper runs `uv run --frozen --no-sync ruff check` and `ruff format --check`, and it fails if either fails. The `noskip` gate does not need Docker, so it runs on every machine with the Python environment synced. The task prompt's `## Constraints` says *"`scripts/run-gates.sh` must pass with no Docker and no Python weights"*. Two lines this branch added break the gate.

1. **`ruff check` E501.** `docs-retrieval-service/pyproject.toml` sets `[tool.ruff] line-length = 100` and `[tool.ruff.lint] select = ["E", ...]`, which includes E501. Task 1 rewrapped the module docstring of `test_store_statements.py`, and the line beginning `taken for those two strings.` is now 102 characters long.
2. **`ruff format --check`.** In `store.py` → `statements`, Task 1 added the `**{ _end_state_key(index): statement for index, statement in enumerate(END_STATE_STATEMENTS) }` comprehension split over two lines. The formatter joins it onto one line because the joined line is exactly 100 characters.

**Why the earlier gates did not catch it.** The task plans kept every unit off the lint command (the story plan's *"No task runs `bash scripts/python-service.sh lint`"*), and the code review runs no gate. The first place this would surface is the Run gates phase, as a `FAIL 13a Python lint`. That would cost a full gate round and a G.4 fix loop.

**Proof.** I ran ruff `0.16.9`, the version `docs-retrieval-service/uv.lock` pins, from the uv cache in `docs-retrieval-service/` at `HEAD` (`7edad657`):

```
E501 Line too long (102 > 100)
  --> tests/test_store_statements.py:9:101
Found 1 error.
```

```
--- src/harness_docs_retrieval/store.py
+++ src/harness_docs_retrieval/store.py
@@ -178,8 +178,7 @@
         **{
-            _end_state_key(index): statement
-            for index, statement in enumerate(END_STATE_STATEMENTS)
+            _end_state_key(index): statement for index, statement in enumerate(END_STATE_STATEMENTS)
         },
1 file would be reformatted, 41 files already formatted
```

Neither line exists on `origin/dev`. Both come from Task 1 (`33f59858`).

**Fix.** These are two whitespace-only edits, and neither changes behaviour.

1. In `docs-retrieval-service/tests/test_store_statements.py`, in the module docstring, replace

   ```
   taken for those two strings. Nothing here needs a database: the refusals below fail before connecting,
   against a port nothing listens on, or against a fake connection.
   ```

   with

   ```
   taken for those two strings. Nothing here needs a database: the refusals below fail before
   connecting, against a port nothing listens on, or against a fake connection.
   ```

2. In `docs-retrieval-service/src/harness_docs_retrieval/store.py` → `statements`, replace

   ```
           **{
               _end_state_key(index): statement
               for index, statement in enumerate(END_STATE_STATEMENTS)
           },
   ```

   with

   ```
           **{
               _end_state_key(index): statement for index, statement in enumerate(END_STATE_STATEMENTS)
           },
   ```

   The joined line keeps the 12-space indentation and is exactly 100 characters long.

Change nothing else in either file. The fix edits `test_store_statements.py`, so that unmarked file is the one test the fix may run, through `bash scripts/python-service.sh test tests/test_store_statements.py`. Gate 13a's own run belongs to the Run gates phase.
