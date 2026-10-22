### 2. The service README's byte-parity list omits `tests/test_store_statements.py`, which now carries every statement-parity assertion

**File:** `docs-retrieval-service/README.md` (`## The seam, as found` → **Where byte parity is asserted.**) — "These four run without a container, against the TypeScript code through `cli/dist`:"

This branch rewrote the opening of `## The seam, as found` to say that **every SQL statement `store.ts` issues is issued unchanged**, with no exception left. Goal 1's statement-parity assertions landed in `tests/test_store_statements.py`:

- `test_constants_match_typescript` now compares `LEXICAL_SEARCH_STATEMENT`, `END_STATE_STATEMENTS` and the three `INDEX_STATE_*` constants through the bridge;
- `test_the_width_change_delete_is_store_ts_own` is new.

That file runs without a container and reaches the TypeScript code through `cli/dist` (`run_bridge("constants")`), so it belongs to exactly the class the paragraph lists. Yet the paragraph names four files, and `test_store_statements.py` is not one of them. No other line in the README or in `docs/` names it.

**The reader who gets it wrong:** a maintainer who changes a statement in `cli/src/retrieval/store.ts` reads this paragraph to learn which unmarked test catches drift on the Python side. They conclude that none does, because the list covers chunks, stubs, rendering and MCP only. In fact the unmarked `test_store_statements.py` fails on that drift.

**Fix:** in that paragraph, change `These four run without a container` to `These five run without a container`. Then insert this bullet between the `tests/test_render_parity.py` bullet and the `tests/test_mcp_parity.py` bullet:

```
- `tests/test_store_statements.py`: the store's constants and statements, `LEXICAL_SEARCH_STATEMENT`, `END_STATE_STATEMENTS` and the `index_state` constants among them, with the vector arm's ordering and the width-change `DELETE FROM meta` read from `cli/src/retrieval/store.ts`'s source because `store.ts` does not export them;
```

This is a prose-only edit, so no test file is touched and no test is run.
