### 2. The `models.py` comment says the drift check parses "these two lines", but it also parses the two `_MODEL` lines

**File:** `docs-retrieval-service/src/harness_docs_retrieval/models.py` (the comment above `EMBEDDING_REVISION`) — "The supply-chain drift notice reads these two lines by exact match"

`scripts/check-model-revisions.mjs` → `pythonPins` reads the Python pins with `/^(EMBEDDING|RERANK)_(MODEL|REVISION) = "([^"]+)"$/gm`. So it depends on **four** lines keeping the exact `NAME = "value"` form: `EMBEDDING_MODEL`, `RERANK_MODEL`, `EMBEDDING_REVISION` and `RERANK_REVISION`. The comment protects only the two `_REVISION` lines.

The reader who gets this wrong is a maintainer editing `EMBEDDING_MODEL` or `RERANK_MODEL` in this module, for example adding a `: str` annotation as `MODEL_REVISIONS: dict[str, str]` already has. The comment tells them only the revision lines are parsed. Their edit then makes the nightly `model-revisions` job refuse with `expected 2 CLI and 2 Python pins, read 2 … and 0 …` and exit 1. The failure is loud but avoidable. The comment also does not name the script that does the parsing.

**Fix:** replace the first two comment lines above `EMBEDDING_REVISION`:

```python
# Each repository's `main` on 2026-10-11. A pin bump bumps `MODEL_VERSION`. The supply-chain drift
# notice reads these two lines by exact match, so each stays on one line in this form.
```

with:

```python
# Each repository's `main` on 2026-10-11. A pin bump bumps `MODEL_VERSION`. The supply-chain drift
# notice (`scripts/check-model-revisions.mjs`) reads `EMBEDDING_MODEL`, `RERANK_MODEL` and these two
# lines by exact match, so each of the four stays on one line in the form `NAME = "value"`.
```

Leave the comment on `RERANK_REVISION` (the Hub redirect note) and the `MODEL_REVISIONS` comment unchanged. This is a comment-only edit, so no test needs to run.
