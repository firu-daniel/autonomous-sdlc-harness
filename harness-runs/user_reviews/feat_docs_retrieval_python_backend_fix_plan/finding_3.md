### 3. The README's seam record omits that a lost database connection fails every later call

**Severity:** Should Fix. **Layer:** general (`docs-retrieval-service/` sits under the catch-all `path: "."`).

**File (site anchor, grep-verified in the current tree):** `docs-retrieval-service/README.md` → `## The seam, as found`, the numbered list — "7. **Async only, one call at a time.**" is the last item; item "3. **Connection by string, not by directory.**" is the nearest in subject.

## Problem

`cli/src/retrieval/store.ts` (`openPgliteStore`) opens an in-process PGlite; the `DocStore` it returns cannot lose its connection, and `cli/src/retrieval/server.ts` (`serveDocs`) opens it once for the server's lifetime.

`store.py` → `open_postgres_store` opens one `psycopg.AsyncConnection` for the session's lifetime and nothing reconnects. If the Postgres restarts or drops the connection while `serve-mcp` or `serve-http` runs, every later `search_docs` call fails with `refreshing the docs index failed: …`, and the stale `RetrievalSession` stays until the process restarts. That is a place where `DocStore`'s contract did not carry over unchanged — a store that can disconnect, with no recovery. The task prompt's deliverable 10 (`harness-runs/task_prompts/feat_docs_retrieval_python_backend_task_prompt.md`) requires `## The seam, as found` to record *"every place `DocStore`'s statements or contract did not carry over unchanged, each with its reason"*; the section does not mention this.

## Fix

- [ ] Append item 8 to the numbered list in `## The seam, as found` in `docs-retrieval-service/README.md`, in the list's existing style (bold lead phrase, then prose). It records: PGlite is in-process and cannot disconnect, while the Postgres store holds one connection for the server's lifetime with no reconnect, so a dropped connection (a server restart, a network drop) fails every later call with `refreshing the docs index failed: …` until the server process is restarted. Close it, as item 3 does, with the open question for the selection branch: selecting this backend has to settle recovery, either reconnect-on-failure in the store or a supervisor restart of the server.
- [ ] Do **not** change `store.py` in this unit. The finding is the missing record; adding reconnection is a design decision for `feat_docs_retrieval_backend_selection`.
