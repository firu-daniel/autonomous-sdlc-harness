### 6. `RepoRootResult.retrievalWired` has no consumer, and `mcpWritten` no longer means what its name says

**File:** `cli/src/generators/repoRoot.ts` (`RepoRootResult`) — "readonly retrievalWired: boolean;" and "readonly mcpWritten: boolean;"

`grep -rn "retrievalWired\|mcpWritten" cli/src cli/test` answers with this interface and the one `return` that fills it, and nothing else. `retrievalWired` is new surface the branch added with no reader, in a repository whose `cli` layer states **One string, one producer** and whose branch-level check for a new exported symbol is that something outside its defining file calls it.

`mcpWritten` already had no consumer on `dev`, so the precedent for an unread field is this module's own — which is why this is graded here rather than higher. What the branch does change is that `mcpWritten`'s *name* is now wrong: `.mcp.json` is written when `wiresBrowser || wiresRetrieval`, while `mcpWritten` is still `wiresBrowser` alone, so a retrieval-only adoption has a written `.mcp.json` and a `false` in the field that says otherwise. The doc comment was updated to describe the browser half and the field name was not.

**Fix:** either give the pair a reader or make the names true. The smaller edit, and the one that keeps the module's shape, is to rename and re-word:

- [x] Rename `mcpWritten` to `browserWired`, mirroring `retrievalWired`, and keep its comment's `browserWiringApplies` explanation.
- [x] Add one sentence to `RepoRootResult`'s own doc comment stating that `.mcp.json` is written when either flag is true, so a future caller reads the disjunction off the type rather than re-deriving it.
- [x] Update the single `return` site: `return { files, ignored, browserWired: wiresBrowser, retrievalWired: wiresRetrieval, notes };`

Nothing imports either field, so the rename compiles with no other edit and no test changes.
