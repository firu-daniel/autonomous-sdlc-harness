### 3. `sandbox1h` §2's fresh-`init` check is assigned to step 4, which runs no fresh `init`

**File:** `docs/development.md` (**Gate 12** → **The sandbox series round (#170 step 4) — not yet run.** → **The steps.**, step 4, "**Upgrade locally.**"). Also `docs/cli.md` (`## 3. The re-run contract`, the `.gitignore` row): "taken by the same step 4".

**The problem.** The task prompt's `sandbox1h` §2 includes "Also: a fresh `init` writes the managed `.gitignore` block's comment with the two new exception lines." The round records this check against step 4 in three places:

- the `docs/cli.md` `.gitignore` row: "it is `sandbox1h` §2, taken by the same step 4";
- the `docs/development.md` **Regenerating…** paragraph: "and the managed `.gitignore` block's comment a fresh `init` writes";
- the `sandbox1h` §2 owed-check bullet.

Step 4 runs only `init --force` (twice, once with `--quiet`) and `init --upgrade-workflows`, all on the repository adopted at 0.6.7 in step 3. None of them is a fresh `init`. On an existing `.gitignore`, the managed block is `merge-lines` and adds only the lines not already present (`docs/cli.md` §3, the `.gitignore` row). So a forced run over a 0.6.7 adoption does not show what a fresh `init` writes.

A maintainer following the steps either never takes this check, or grades it on the wrong surface. A fresh `init` at `<version>` in the scratch repository itself would also destroy the 0.6.7 adoption that §2 needs, so the check has to run in a separate directory.

**Fix.** In `docs/development.md`, step 4 of the round, insert the text below immediately before the paragraph that begins "Then re-render the workflows". Keep the indentation of the step's other fenced blocks.

````
   Then, for §2's fresh-`init` row, in a new directory outside the scratch repository, so the 0.6.7 adoption is left as it is:

   ```
   git init <scratch-fresh>
   git -C <scratch-fresh> commit --allow-empty -m "Seed"
   npx --yes autonomous-sdlc-harness@<version> init --cwd <scratch-fresh> --non-interactive
   ```

   Read the managed block's comment in `<scratch-fresh>/.gitignore`, record it, and delete `<scratch-fresh>` by hand afterwards.
````

`docs/cli.md`'s "taken by the same step 4" is then correct as written. These are documentation edits only, so no test runs for this fix.
