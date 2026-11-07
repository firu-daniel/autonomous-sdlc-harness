### 2. No test exercises the new sibling `cd <stem>*/<appDir>` arm, so removing it would leave every suite green

**File:** `cli/test/path-anchored-arms.test.mjs` (the `keepers` array, and the header's "Not covered:" sentence): "the scoped-`appDir` and cost rows, which `docs/guard-verification.md` carries"

**The problem.** Task 2 added two arms to `hc_path_anchored_patterns`: `cd <work_root>/<project_name>-*/<appDir>` and `…/<stateDir>`, each with its own vetoes. Their only purpose is to keep a scoped `appDir` (one carrying a character outside `[A-Za-z0-9._/-]`, such as `packages/@acme/storefront`) allowed under a sibling. Without them, the stem arm's new class veto would refuse that `@`. That is §2.4 `(m)`'s keeper m39. It falls under the task prompt's constraint that "No ordinary shape loses its allow".

The suite's fixtures use `appDir: packages/storefront`, which is in-class. The stem arm therefore grants every keeper the suite drives (m31, m34), and the new arms are never the deciding arm. If a later change deletes the `sib` strings, or breaks their veto binding, m39 regresses to a prompt and no test goes red. The header names this exclusion, but its reason is "which `docs/guard-verification.md` carries", and a document of record does not detect a regression.

**Fix.** In `cli/test/path-anchored-arms.test.mjs`:

1. In the test body, after `const outside = join(root, 'outside');`, add a scoped fixture in a work root of its own:

   ```js
   const scopedWork = join(root, 'scoped-work');
   const scoped = join(scopedWork, 'scoped-shop');
   ```

   After `await seed(dotshop, configFor('dotshop', '.'));`, add:

   ```js
   await seed(scoped, configFor('scoped-shop', 'packages/@acme/storefront'));
   ```

2. Append to the `keepers` array:

   ```js
   ['m39', `git -C ${scoped} status && cd ${scopedWork}/scoped-shop-x/packages/@acme/storefront && ls`, scoped],
   ```

3. In the header's "Not covered:" sentence, remove "the scoped-`appDir` and", so it reads "…and the cost rows, which `docs/guard-verification.md` carries."

Run that file alone (`npm test --workspace cli -- test/path-anchored-arms.test.mjs`). It is the file this fix edits.
