### 1. The two documents listing what `store.py` no longer issues unchanged omit the widened width-change `DELETE FROM meta` and the new `rebuildIndexes` method

**Files:**

- `docs-retrieval-service/README.md` → `## The seam, as found`, the paragraph opening "The `DocStore` contract carried over method for method. **Every SQL statement `store.ts` issues is issued unchanged** except, on this branch, `LEXICAL_SEARCH_STATEMENT` and `END_STATE_STATEMENTS`"
- `docs/retrieval.md` → `## How it fits together` → **Store.**, the sentence containing "issues that same SQL, except on this branch for two statements `store.ts` carries"

**The problem.** This branch changed three things in `store.ts` that the Python store (`docs-retrieval-service/src/harness_docs_retrieval/store.py`) does not yet match. Both documents list only two of them, and the README also says something false about the method set:

1. **A third SQL statement changed, and neither document names it.** `cli/src/retrieval/store.ts` → `openPgliteStore`, on the width-change path (`if ((await readMeta(DIMENSIONS_META_KEY)) !== width)`), went from `DELETE FROM meta WHERE key = $1` with `[EMBEDDER_META_KEY]` to:
   ```ts
   await db.query('DELETE FROM meta WHERE key = ANY($1::text[])', [[EMBEDDER_META_KEY, INDEX_STATE_META_KEY]]);
   ```
   `store.py` still issues the old statement over the embedder key alone (`statements` → `"delete_meta": "DELETE FROM meta WHERE key = $1"`, issued as `await conn.execute(sql["delete_meta"], [EMBEDDER_META_KEY])`). So the README's "**Every SQL statement `store.ts` issues is issued unchanged** except … `LEXICAL_SEARCH_STATEMENT` and `END_STATE_STATEMENTS`" is false, and so is `docs/retrieval.md`'s "issues that same SQL, except … for two statements".
2. **The `DocStore` method set no longer matches.** `store.ts` → `DocStore` now has `rebuildIndexes(): Promise<void>`. `store.py`'s `DocStore` `Protocol` has no counterpart: `grep -rn "rebuild\|index_state" docs-retrieval-service/src` returns nothing. The README's first clause, "The `DocStore` contract carried over method for method.", is unqualified and is now false.

**Who reaches the wrong answer.** The section is the Python port's checklist. Its own text calls it "the places where something did not carry over unchanged", and the branch it names, `fix_docs_retrieval_bm25_index_state_python`, is the reader. An implementer who trusts the list would port the lexical statement and the end-state statement and leave the width-change delete as it is. The result would be a Python store whose `index_state` marker survives the `DROP TABLE` of a width change, even though the TypeScript store clears it there. That is a behaviour divergence, and the list was written to prevent exactly that kind. The consequence today is small: after a width change, a refresh re-embeds every chunk, so it writes and rebuilds anyway. That is why this is graded Should Fix rather than Must Fix. The document is still wrong in a place built to be exhaustive.

**Proof.**
- `git diff origin/dev...HEAD -- cli/src/retrieval/store.ts` shows the `DELETE FROM meta WHERE key = $1` → `DELETE FROM meta WHERE key = ANY($1::text[])` hunk and the added `rebuildIndexes()` member of `DocStore`.
- `docs-retrieval-service/src/harness_docs_retrieval/store.py` → `statements` still carries `"delete_meta": "DELETE FROM meta WHERE key = $1"`, and nothing under `docs-retrieval-service/src` names `rebuild` or `index_state`.

**Fix.** These are documentation-only edits in two files.

1. In `docs-retrieval-service/README.md` → `## The seam, as found`, replace the text from "The `DocStore` contract carried over method for method." up to and including "until `fix_docs_retrieval_bm25_index_state_python`." with:

   ```markdown
   The `DocStore` contract carried over method for method, except `rebuildIndexes`, which `store.py`'s `DocStore` does not carry yet. **Every SQL statement `store.ts` issues is issued unchanged** except three: `LEXICAL_SEARCH_STATEMENT`, `END_STATE_STATEMENTS`, and the width-change `DELETE FROM meta`, which `store.ts` issues as `DELETE FROM meta WHERE key = ANY($1::text[])` over the `embedder` and `index_state` keys. `store.py` still issues the shipped lexical statement, no end-state statement, and `DELETE FROM meta WHERE key = $1` over the `embedder` key alone, until `fix_docs_retrieval_bm25_index_state_python`.
   ```

   Leave the rest of the paragraph unchanged, from "Each statement it does issue goes through psycopg's `AsyncRawCursor`" onward.

2. In `docs/retrieval.md` → **Store.**, replace this span:

   > except on this branch for two statements `store.ts` carries, `LEXICAL_SEARCH_STATEMENT` and `END_STATE_STATEMENTS`: it still issues the shipped lexical statement, which selects `id` alone, and no end-state statement, until `fix_docs_retrieval_bm25_index_state_python`.

   with:

   ```markdown
   except for three statements `store.ts` carries, `LEXICAL_SEARCH_STATEMENT`, `END_STATE_STATEMENTS` and the width-change `DELETE FROM meta`, which also clears `index_state`: it still issues the shipped lexical statement, which selects `id` alone, no end-state statement, and a delete of the `embedder` key alone, until `fix_docs_retrieval_bm25_index_state_python`.
   ```

   Change nothing else in the paragraph.

The fix runs no test.
