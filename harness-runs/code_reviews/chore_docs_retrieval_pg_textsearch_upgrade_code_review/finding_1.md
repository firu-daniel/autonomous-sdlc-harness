### 1. `openPgliteStore`'s doc comment justifies the conditional update with a stdout notice that PGlite never prints

**File:** `cli/src/retrieval/store.ts` (`openPgliteStore`, its doc comment): "a no-op open must not emit a notice on a process whose stdout is the MCP transport"

The new paragraph of the doc comment says the store issues `ALTER EXTENSION <name> UPDATE` only for a stale extension because "a no-op open must not emit a notice on a process whose stdout is the MCP transport". PGlite does not print a server notice anywhere unless the caller passes an `onNotice` handler, and `openPgliteStore` passes none. Measured on this branch's packages (`@electric-sql/pglite` 0.5.10, in memory, Node 22): running `CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS pg_textsearch;` twice and then a no-op `ALTER EXTENSION vector UPDATE` wrote 0 bytes to stdout and nothing to stderr. The store also already issues a notice-raising statement on every open: the second `CREATE EXTENSION IF NOT EXISTS` raises "extension … already exists, skipping". So the stated reason does not hold.

The code itself is correct. The conditional update is still the right shape, and the Python port's docstring states the same behaviour with no such reason. A maintainer who reads this comment, though, learns that PGlite notices reach the MCP transport, which is false, and may guard against it elsewhere or keep code for the wrong reason.

**Fix:** end the sentence at "none", so the paragraph matches `open_postgres_store`'s docstring:

```ts
 * An index an older `vector` or `pg_textsearch` built is brought to the loaded libraries' versions by
 * issuing {@link EXTENSION_UPDATE_STATEMENTS}' entry for each extension {@link STALE_EXTENSIONS_QUERY}
 * lists, before any other statement reads it, and nothing when it lists none.
```

This edits a comment only. No test file changes, so the fix runs no test. `commands.typecheck` covers the edit.
