### 2. `bm25-refresh-rule.mjs` carries its own copy of the probe's capture-line producer, `scoreLines`, despite its header's "imported and never copied"

**File:** `evals/docs-retrieval/bm25-refresh-rule.mjs` (`scoreLines`, and `stamp`) — "function scoreLines(stepId, state) {"

The `score <step> <qid> <key> <scan> <operator> <scanRaw> <operatorRaw>` capture line is a wire format. Its one consumer is `evals/docs-retrieval/bm25-history.mjs` → `compareBm25Captures`, which splits each line positionally and refuses a line that does not have this shape. The format now has two producers:

- `evals/docs-retrieval/bm25-history.mjs` → `scoreLines` (not exported);
- a private copy in `evals/docs-retrieval/bm25-refresh-rule.mjs` → `scoreLines`, with the same template literal.

`evals/docs-retrieval/README.md` and `docs/retrieval-eval.md` → `### The BM25 index-state probe` both say the refresh-rule capture is read by the probe's `--compare`, so the two copies must stay byte-identical, and nothing enforces it. The refresh-rule module's own header also says the opposite of what it does: *"Every engine, statement and reading is `evals/docs-retrieval/bm25-history.mjs`'s, imported and never copied."* `.claude/context/conventions.md` → `### Where a new responsibility goes` → **Before adding a copy of anything, grep for it.** forbids this kind of second copy. The `stamp` helper (`` `{ files: …, chunks: … }` ``) is duplicated the same way.

The probe's version, given a state with no `repeats`, emits exactly what the copy emits: the `state.scores` lines, then the `.forced` lines when `state.forced` is present. The refresh-rule module calls `readIndexState` with the default `repeat = 1`, so its states carry no `repeats`, and importing the probe's function changes no byte of any capture.

**Fix:**

1. In `evals/docs-retrieval/bm25-history.mjs`, export the two helpers without changing their bodies:

   ```js
   /** Every capture `score` line of one step: its recorded scoring, its later repetitions, and its forced readings. */
   export function scoreLines(stepId, state) {
   ```

   ```js
   export const stamp = (snapshot) => `{ files: ${snapshot.files}, chunks: ${snapshot.chunks} }`;
   ```

2. In `evals/docs-retrieval/bm25-refresh-rule.mjs`, add `scoreLines` and `stamp` to the existing import list from `./bm25-history.mjs`:

   ```js
   import {
     BM25_HISTORY_STATEMENTS,
     SCORE_COLUMNS,
     differencesByColumn,
     openPgliteEngine,
     openPostgresEngine,
     readIndexState,
     renderIndexState,
     scoreLines,
     spillAvailable,
     stamp,
   } from './bm25-history.mjs';
   ```

   Then delete the module's own `const stamp = (snapshot) => …` line and its whole `function scoreLines(stepId, state) { … }`. The call sites in `renderRefreshRule` stay as they are.

This fix edits no test file and runs no test. The modules have no suite, and `commands.typecheck` does not cover `evals/`.
