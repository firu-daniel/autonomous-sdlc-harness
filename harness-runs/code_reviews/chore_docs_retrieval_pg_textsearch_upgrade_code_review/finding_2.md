### 2. The before-handling measurement has two owners: the upgrade suite's header and `docs/retrieval.md`

**Files:**
- `cli/test/docs-retrieval-store-upgrade.test.mjs`, the module header, from "**What the new packages did with that directory before the handling**" through "every call's result unchanged."
- `docs/retrieval.md`, `## How it fits together`, the **An index older extension versions built.** paragraph, its **TypeScript backend.** bullet ("(`cli/test/docs-retrieval-store-upgrade.test.mjs`, its header)").

`.claude/context/conventions.md` → `### Where a new responsibility goes` sends "a measured fact or a decision of record" to "`docs/`, and nowhere else". This branch records the same measurement twice. The upgrade suite's header holds it: the dated Node 22.23.2 run, what the new packages did with the 1.3.1 archive before `STALE_EXTENSIONS_QUERY` existed, the raw re-open's `library_version` against `extversion` readings, the `bm25_summarize_index` counts, and the "With the handling" outcome. `docs/retrieval.md`'s **TypeScript backend.** bullet restates all of it except the `bm25_summarize_index` counts, and cites the test header as the source of its quoted phrase. The direction is backwards: the document of record defers to a test comment. The two copies also already differ, since only the test header carries the summary counts. A later re-measurement written into one copy leaves the other stale.

**Fix:**

1. In `docs/retrieval.md`, in the **TypeScript backend.** bullet, replace

   `— *"the 1.5.1 library serving a catalog that recorded 1.3.1"* (`cli/test/docs-retrieval-store-upgrade.test.mjs`, its header).`

   with

   `— the 1.5.1 library serving a catalog that recorded 1.3.1. `bm25_summarize_index('chunks_bm25')` on that re-open read `total_docs: 33`, `docs_persisted: 24`, memtable `documents: 9`, `Total: 1 segments`.`

   Leave the rest of the bullet, including "that suite pins the handling", as it is.

2. In `cli/test/docs-retrieval-store-upgrade.test.mjs`'s header, replace the whole block from `**What the new packages did with that directory before the handling**` through the sentence `With the handling, the same probe left both \`extversion\`s equal to their \`default_version\` and every call's result unchanged.` with one paragraph:

   ```js
    * **What the new packages did with that directory before the handling, and with it,** is recorded in
    * `docs/retrieval.md` → `## How it fits together`, **An index older extension versions built.**
   ```

   Keep the header's rule paragraph and its **No model, and nothing downloaded.** paragraph unchanged.

The fix edits `cli/test/docs-retrieval-store-upgrade.test.mjs`, so it runs that one file and nothing else: `npm test --workspace cli -- test/docs-retrieval-store-upgrade.test.mjs`, from the repository root.
