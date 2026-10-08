### Task 4 — Rebuild the BM25 index after a refresh that leaves a dead row, in the TypeScript store and refresh

**Goal:** Make a refresh of the TypeScript persistent index (`<repoRoot>/<stateDir>/docs_index`) give the same BM25 scores as a fresh index of the same corpus, whatever the index held before. Do it by rebuilding the BM25 index at the end of any refresh that left a dead heap tuple behind. That is goal 3's fix, under the rule the story index's `## Context` states. Do not change search behaviour in any other way (task prompt → `## Constraints`, first bullet).

**Depends on:** Task 2, whose recorded `#### Through the refresh, before the fix` part shows the TypeScript persistent index carrying the dependence. If it shows none, this task does not run (Task 2's verification).

**Where this layer stops.** This task changes `cli/src/retrieval/store.ts` and `cli/src/retrieval/refresh.ts` only. The test that pins it is **Task 5's**. The Python port of the same rule is **Task 6's**, and it reads the constant this task exports. The documents describing refresh are **Task 8's**. `RefreshResult` keeps its shape: no field is added, so `docs index`'s summary line, the query log's refresh counts and the Python wire stay as they are.

### Targets

- `cli/src/retrieval/store.ts`: the exported statement constant and the new `DocStore` member.
- `cli/src/retrieval/refresh.ts`: the call, under the rule.

**Work:**

- [ ] `store.ts`: export `BM25_REINDEX`, composed from `BM25_INDEX` as `` `REINDEX INDEX ${BM25_INDEX}` ``. Add it to the module header's list of exported shapes a caller composes rather than retypes, because Task 6's statement-parity test reads it through the bridge.
- [ ] `store.ts`: add `rebuildLexicalIndex(): Promise<void>` to `DocStore`. Its doc comment states what it is for: `pg_textsearch` keeps corpus statistics that a `DELETE` or an `UPDATE` does not decrement, and `VACUUM` does not fully restore. It cites `docs/retrieval-eval-results.md` → `### The index's history, measured`. Implement it in `openPgliteStore` as `db.exec(BM25_REINDEX)`.
- [ ] `refresh.ts`: track whether this refresh left a dead tuple, which is true when **any** of these holds: `store.clear()` ran; `gone.length > 0`; or some chunk in `changed` has a key already in `stored`. Then, after the last upsert batch, call `store.rebuildLexicalIndex()` exactly once if it is true. An insert-only or no-op refresh does not call it.
- [ ] `refresh.ts` header and `refreshIndex`'s doc comment: add the step to the numbered list, (6), and state the rule and why in one place. Amend `store.ts`'s header where it states what the module guarantees, so the header still describes the code (`.claude/context/cli.md` → `## What "done" means here`, last bullet).

**Verification:**

- `npm run build` passes under `strict` and `noUnusedLocals`, and `DocStore` has no other implementer that now fails to compile (`grep -rn 'listChunkHashes' cli/src` finds only `store.ts` and `refresh.ts`).
- `npm test --workspace cli -- test/docs-retrieval.test.mjs` and `npm test --workspace cli -- test/docs-retrieval-store.test.mjs` pass unchanged. Case (a)–(e)'s refresh summary lines are untouched, which is evidence that `RefreshResult` did not move.
- Grep `refresh.ts` for the three trigger conditions, and find each stated once, in code, with the rule in the doc comment.
