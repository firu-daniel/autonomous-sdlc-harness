### 3. `docs/retrieval.md` says `vector` moved "on PGlite", but the compose image's `vector` moved too

**File:** `docs/retrieval.md`, `## How it fits together`, the **An index older extension versions built.** list, its last bullet: "`vector` moved too, 0.8.1 to 0.8.7 on PGlite, so the same handling covers it."

The bullet limits the `vector` move to PGlite. On this branch the compose image's base also moved, from `pgvector/pgvector:0.8.1-pg18` to `0.8.7-pg18` (`docs-retrieval-service/postgres/Dockerfile`, `ARG PGVECTOR_IMAGE` and record 2). `docs-retrieval-service/README.md` item 4 records a 1.3.1-built database reading `vector` `0.8.1` against `0.8.7`, which `open_postgres_store` moved to `0.8.7`. A reader of this bullet alone would conclude that the Python backend's `vector` did not change and that its update covers only `pg_textsearch`.

**Fix:** replace the bullet with:

```markdown
- `vector` moved too, 0.8.1 to 0.8.7 on both engines (the compose image's base moved with it, `docs-retrieval-service/postgres/Dockerfile` record 2), so the same handling covers it.
```

This edits a document only, so the fix runs no test.
