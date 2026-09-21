### 3. The new suite retypes `store.ts`'s BM25 index and lexical ordering SQL

**Site.** `cli/test/docs-retrieval-store.test.mjs`, test case
`'(b) the index-scan crossover, bisected on a stats-informed plan'` → the `filtersAt` closure. Three
statements in that closure are second copies of SQL owned by `cli/src/retrieval/store.ts`:

- `` CREATE TABLE chunks (id serial PRIMARY KEY, text text NOT NULL, embedding vector(${DIMENSIONS}) NOT NULL) ``
  — a reduced copy of the `chunks` table `openPgliteStore` creates.
- `` "CREATE INDEX chunks_bm25 ON chunks USING bm25 (text) WITH (text_config='english')" `` — byte-for-byte
  the index `store.ts` creates, minus the `IF NOT EXISTS`.
- `` "SELECT id FROM chunks ORDER BY text <@> to_bm25query($1, 'chunks_bm25') LIMIT $2" `` — byte-for-byte
  the statement `DocStore.lexicalSearch` issues.

The owning sites in `cli/src/retrieval/store.ts` are the `CREATE TABLE IF NOT EXISTS chunks (…)` and
`` CREATE INDEX IF NOT EXISTS chunks_bm25 ON chunks USING bm25 (text) WITH (text_config='english') ``
statements inside the store-open path, and the `SELECT id FROM chunks ORDER BY text <@> to_bm25query…`
statement inside `lexicalSearch`.

**Rules it violates.** `.claude/context/conventions.md` → `### Where a new responsibility goes`:
*"**A responsibility that already has a home does not get a second one.**"* and, in the same section,
*"**Before adding a copy of anything, grep for it.** `cli/src/core/repoPaths.ts` exists because several
modules had each carried a private copy of one normalisation, the copies had drifted, and two divergent
bodies had been given the same name — so a caller moved between those two files silently changed
behaviour, with no compile error and no test."* `cli/src/retrieval/store.ts`'s own header claims the SQL
for this index as its own — *"the SQL stays plain Postgres plus the `vector` and `pg_textsearch`
extensions … the two spliced tokens are the `vector(<dimensions>)` column type … and the constant index
name inside `to_bm25query($1, 'chunks_bm25')`"* — and `cli/src/retrieval/search.ts`'s header states the
consequence for every consumer above it: *"Every store access goes through the {@link DocStore} methods;
this module holds no SQL."* `.claude/context/cli.md` → `## What "done" means here` adds *"A reviewer holds
a change to its module's own header,"* which is the lens this finding is read through.

**Why it matters, and why the case's own justification does not waive it.** The case's comments argue
convincingly that it *cannot* run through `openPgliteStore` — the index must be built **after** the rows
for the planner to have statistics, and the store builds it on an empty table. That argument is accepted:
this finding does not ask the case to go through `DocStore`. What it asks is that the three retyped
statements stop being a **second source** for a surface `store.ts` owns.

The exposure is concrete and silent. The case's stated purpose is to record the row count at which the
planner starts choosing the BM25 index scan **for the lexical arm**, and `docs/retrieval.md` → `## Still
open` now cites its answer (63 rows) as a property of the shipped store. But the planner's choice depends
on precisely the three things retyped here: the indexed column and its `text_config`, the row width the
`embedding vector(384)` column sets, and the `<@>` ordering. Change `text_config` in `store.ts`, rename
`chunks_bm25`, add or widen a column, or move the ordering operator, and this case keeps measuring the old
configuration — still passing inside its ±8-row band, still printing `lexical-arm index-scan crossover: N
rows`, and now describing a store that no longer exists. Nothing fails, and `docs/retrieval.md` keeps
citing the stale number.

**The fix.** Make `cli/src/retrieval/store.ts` the one declaration of these three shapes and have the case
read them:

1. In `cli/src/retrieval/store.ts`, lift the three literals to exported constants beside the existing
   `INDEX_DIR_NAME` export — the chunks-table column list (or at minimum the `text` and
   `embedding vector(<dimensions>)` columns the ordering's cost depends on), the BM25 index name and its
   `WITH (…)` option string, and the lexical ordering clause — parameterised over the table and index name
   where the existing statements splice them, and issue the store's own statements from those constants so
   there is no third copy inside the owner. Amend the module header in the same edit, per
   `.claude/context/cli.md`: state that the SQL shapes are exported for measurement and that a caller
   composes them rather than retyping them.
2. In `cli/test/docs-retrieval-store.test.mjs`, import those constants and compose `filtersAt`'s
   `CREATE TABLE`, `CREATE INDEX` and `SELECT … ORDER BY` from them, so the only thing the case still owns
   is the ordering of its operations — index after rows — which is the property it exists to measure.
3. Keep the case's existing comments explaining why it does not run through `openPgliteStore`; after the
   change they are accurate and no longer stand in for a missing owner.

If step 1 is judged too wide a change to `store.ts`'s public surface, the acceptable alternative is a
narrower export of the two BM25 strings alone (the index-options string and the ordering clause), since
those are the two the store's header already names as its spliced tokens; the `CREATE TABLE` copy may then
stay, with a comment in the case naming the owning statement and the columns it deliberately omits. What is
not acceptable is leaving all three as unattributed retypings.
