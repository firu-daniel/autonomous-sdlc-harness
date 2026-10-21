### 1. `docs/retrieval.md` says "that suite pins the handling", but no longer names any suite

**File:** `docs/retrieval.md`, `## How it fits together`, the **An index older extension versions built.** list, its **TypeScript backend.** bullet: "every call's result unchanged; that suite pins the handling."

**Problem.** The bullet ends with "that suite pins the handling", but nothing in the bullet, its paragraph or the rest of `docs/retrieval.md` names a suite for "that" to refer to. Before the code-review fix for Finding 2 (commit `50390e53`, "Keep before-handling measurement in docs/retrieval.md only"), the bullet cited `cli/test/docs-retrieval-store-upgrade.test.mjs` in parentheses after its quoted phrase. That fix replaced the citation with the `bm25_summarize_index` counts. Its own instruction was to "Leave the rest of the bullet, including 'that suite pins the handling', as it is", so the antecedent was removed and the pointer to it was kept.

The test file now points only to this document: its header reads "**What the new packages did with that directory before the handling, and with it,** is recorded in `docs/retrieval.md` → `## How it fits together`, **An index older extension versions built.**" So the link runs in one direction only. Someone reading the document of record to find which test guards the old-index handling, for example before changing `STALE_EXTENSIONS_QUERY` or bumping the PGlite packages again, is sent to a suite the document never names.

**Proof.**
- `grep -n "docs-retrieval-store-upgrade" docs/*.md docs-retrieval-service/README.md` returns no hit on this branch.
- The only "suite" in lines 19–25 of `docs/retrieval.md` is the phrase "suite pins the handling".

**Fix.** In `docs/retrieval.md`, in the **TypeScript backend.** bullet, replace

`every call's result unchanged; that suite pins the handling.`

with

``every call's result unchanged; `cli/test/docs-retrieval-store-upgrade.test.mjs` pins the handling.``

Change nothing else in the bullet. This edits a document only, so the fix runs no test.
