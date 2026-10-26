### 7. The `check.ts` header's "What it deliberately does not re-implement" bullet was left with a ragged wrap

**File:** `cli/src/config/check.ts` → the module header, `## What it deliberately does not re-implement`, the **Anything about the filesystem** bullet — "`doctor`'s job, not a shape check's,"

**Problem.** The edit that added `treeGuards[].test` to the bullet broke its line wrap. One continuation line now holds only "`doctor`'s job, not a shape check's," and the bullet then resumes on the next line. The text reads correctly but looks like an editing artefact.

**Fix.** Re-wrap the bullet to the header's width:

```ts
 * - **Anything about the filesystem** — whether a configured directory exists, is writable, or
 *   whether a `conventions` document or a `treeGuards[].test` file is really there. That is
 *   `doctor`'s job, not a shape check's, and a shape check that touched the disk could not be run
 *   against a config held in memory.
```

This fix edits no test file, so it runs no test.
