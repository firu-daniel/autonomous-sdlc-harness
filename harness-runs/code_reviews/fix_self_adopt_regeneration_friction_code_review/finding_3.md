### 3. `WriteRequest.forceOverride`'s doc still says "Both classes" after a third per-request user was added

**File:** `cli/src/core/writer.ts` → `WriteRequest.forceOverride` (the doc comment), "only copy of it. Both classes stay `create-if-absent` above."

Before this branch, the per-request paragraph of this doc comment named two users, `generators/claudeContext.ts` and `generators/githooks.ts`, and closed with "Both classes stay `create-if-absent` above." This branch added a third user to the same paragraph ("`generators/stateDir.ts` sets `'never'` on a run-artifact README whose bytes already are its template"). It also changed the paragraph's opening from "The remaining **two** users" to "The remaining users". The closing sentence still counts two, so it no longer matches the list above it. The module header's own count was updated in the same commit ("**Four more** read the tree and answer **per request**"). Only this doc comment's closing sentence was missed. A reviewer reads a module header as a guarantee (`.claude/context/cli.md` → `## What "done" means here`), so the count has to agree with the list.

**Fix:** replace

```
   * only copy of it. Both classes stay `create-if-absent` above.
```

with

```
   * only copy of it. Every one of them stays `create-if-absent` above.
```

Change nothing else in the comment. No test file is edited, so the fix owes no per-unit test run.
