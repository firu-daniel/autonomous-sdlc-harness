### Task 1 — Read the anchor name from `MAIN_REPO_ANCHOR_VARIABLE` in the main-repo-resolution corpus guard

**Goal:** Make `cli/test/main-repo-resolution-corpus.test.mjs` build its two anchor clauses from the owning constant instead of the literal `printenv HARNESS_MAIN_REPO`. Then the guard follows the anchor's name wherever `cli/src/core/mainRepoAnchor.ts` sets it.

**Why this ships first.** That file is the tree guard for `plugin/**/*.md`. Task 15 renames `printenv HARNESS_MAIN_REPO` to `printenv DEVSCENE_MAIN_REPO` in the plugin's prose, and the unit loop runs this guard on that change. If the guard still spelled the old name, Task 15 would fail on a file outside its layer. This task changes no behaviour. At this commit the constant still holds `HARNESS_MAIN_REPO`, so the guard passes exactly as before. Task 2 renames the constant. From then on the guard expects `DEVSCENE_MAIN_REPO`, and the plugin follows in Task 15. Nothing runs this guard between Task 2 and Task 15, because no task in between changes a `plugin/**/*.md` file. The conventions rule this applies is `.claude/context/conventions.md` → *"An environment-variable name is a constant with an owner too … never retyped as a literal"*.

### Targets

- `cli/test/main-repo-resolution-corpus.test.mjs`

**Work:**

- [ ] Import `MAIN_REPO_ANCHOR_READ` from `'../dist/core/mainRepoAnchor.js'`. Its value is `` `printenv ${MAIN_REPO_ANCHOR_VARIABLE}` ``; check the export name in `cli/src/core/mainRepoAnchor.ts`. Rebuild `NEW_CLAUSE` and `OLD_CLAUSE` by concatenating that constant into the place where each now spells `printenv HARNESS_MAIN_REPO`. Keep every other byte of both clauses. Use string concatenation, not a template literal, because `NEW_CLAUSE` carries the literal text `${CLAUDE_PLUGIN_ROOT}`, which a template literal would interpolate.
- [ ] Respell any remaining literal `HARNESS_MAIN_REPO` in the file's header comment as the constant's name, `MAIN_REPO_ANCHOR_VARIABLE`, so no table token is left in the file.

**Verification:**

- Run this task's own test file, `npm test --workspace cli -- test/main-repo-resolution-corpus.test.mjs`: it passes, because at this commit the constant and the plugin both still say `HARNESS_MAIN_REPO`.
- `git grep -n 'HARNESS_MAIN_REPO' -- cli/test/main-repo-resolution-corpus.test.mjs` prints nothing.
