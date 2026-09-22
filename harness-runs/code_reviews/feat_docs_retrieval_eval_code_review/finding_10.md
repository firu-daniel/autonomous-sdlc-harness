### 10. `store.ts` gains `CHUNKS_TABLE` and leaves six statements spelling `chunks` inline

**Site.** `cli/src/retrieval/store.ts` → the module header's paragraph *"The shapes the lexical plan's cost depends on are exported…"* and its concession *"The single-table statements below still spell `chunks` inline"*; the constant `CHUNKS_TABLE`; and the six statements inside `openPgliteStore` that name the table as a literal — `listChunkHashes`' `SELECT key, hash FROM chunks`, `upsertChunks`' `INSERT INTO chunks (...)`, `deleteChunks`' `DELETE FROM chunks WHERE key = ANY($1::text[])`, `clear`'s `DELETE FROM chunks`, `vectorSearch`'s `SELECT id FROM chunks ORDER BY embedding <=> $1::vector`, and `getChunks`' `SELECT id, key, path, anchor, heading, body FROM chunks WHERE id = ANY($1::int[])`.

**The problem.** After this change the table's name has two spellings inside the module that owns it: `${CHUNKS_TABLE}` in the DDL, the drop, the index creation and `lexicalSearch`, and the bare literal `chunks` in the six statements above. The header names the omission and argues it — *"they carry no shape a caller composes, and rewriting them would enlarge this change to no reviewer's benefit"* — which is the right instinct for a change under review and the wrong resting state for a constant: `.claude/context/conventions.md` → `## Configuration is the source of truth…` puts the rule as *"a value is imported from its owner rather than retyped"*, and the module is now its own owner and its own retyper.

Nothing is broken and nothing can break silently at one table: a rename that missed a literal fails at the first query. The cost is the reader's — the next person editing `openPgliteStore` has to know which half of the file interpolates and which does not, and the header is where they find out rather than the code.

**The fix.** Either finish it or drop the constant; finishing it is six one-line edits and keeps what the test needs:

- [ ] Turn each of the six statements into a template literal naming `${CHUNKS_TABLE}`, leaving the bound parameters and the SQL text otherwise byte-identical.
- [ ] Delete the header's concession sentence (*"The single-table statements below still spell `chunks` inline: they carry no shape a caller composes, and rewriting them would enlarge this change to no reviewer's benefit."*) — with the literals gone it describes a state the file is no longer in, and a header that reads as a guarantee is worth what the code under it does.

`cli/test/docs-retrieval-store.test.mjs` imports `CHUNKS_TABLE` already and is unaffected; `npm test` is the whole check for this one, since a missed rename cannot pass a query.
