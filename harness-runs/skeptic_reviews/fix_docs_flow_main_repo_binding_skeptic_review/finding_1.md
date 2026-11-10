### 1. The guard only checks `<MAIN_REPO>` binders that carry the resolution clause. A new `<MAIN_REPO>` row that inherits the value and omits the literal-spelling sentence passes every case

**File:** `cli/test/main-repo-resolution-corpus.test.mjs`. The relevant parts are the `CASES` row `main-repo-literal-spelling`, its `expected` (`[...ROW_BINDERS, 'plugin/instructions/prompt_injection_screen.md']`), and the test `every clause-carrier is a row binder or listed in EXEMPT, never both`.

**Problem.** Goal 4 of the task prompt (`harness-runs/task_prompts/fix_docs_flow_main_repo_binding_task_prompt.md` → `## The goal`, item 4) asks for a contract test that fails if an autonomous instruction or command "binds `<MAIN_REPO>` without the literal-spelling sentence". The suite only finds binders in one way: by searching for the resolution clause (`NEW_CLAUSE`). Three checks build on that:

- `main-repo-resolution-clause` finds every file that carries the clause.
- The classification test requires each such file to be in `ROW_BINDERS` or `EXEMPT`.
- `main-repo-literal-spelling` checks the sentence only in the files it lists by hand.

The branch itself adds a binder of a second shape, one that does not resolve `<MAIN_REPO>` but inherits it. `plugin/instructions/prompt_injection_screen.md` → `## Resolved values` row: "| `<MAIN_REPO>` | derived at runtime | The main checkout the citing engine command resolved per its own `## Resolved values` row. This file never resolves it again. …". A row of that shape does not carry `NEW_CLAUSE`. Suppose a later file adds such a row without the sentence, for example `| `<MAIN_REPO>` | derived at runtime | The main checkout the citing engine command resolved. |`. Then:

- `main-repo-resolution-clause`: no clause, so nothing changes. Green.
- `main-repo-resolved-values-row`: no full `MAIN_REPO_ROW`, and no forbidden pattern. Green.
- `main-repo-literal-spelling`: the file is not in `expected` and carries no sentence, so nothing is found for it. Green.
- The classification test compares constants only. Green.

That is the exact regression goal 4 names. The guard misses it, and an agent reading that file gets no rule on how to spell `<MAIN_REPO>` in a command. Under `dontAsk` that is the refused or sandboxed push the task prompt's `## Why it matters` describes.

**Proof.** Running `git grep -n -E '^\| `<MAIN_REPO>` \|' -- plugin` today prints exactly 16 files:

- the 14 in `ROW_BINDERS`
- `plugin/instructions/prompt_injection_screen.md`, which carries the sentence
- `plugin/instructions/main_repo_resolution.md`, line "| `<MAIN_REPO>` | derived at runtime | The main checkout's absolute path — what this file resolves, by `## The fallback`. |". The story plan exempts this file from the sentence, under "**Decisions this plan takes**": it produces the value and never spells a command with it.

So the set equality below holds on the current tree, and adding the test keeps the suite green.

**Fix.**

1. After the existing test `every clause-carrier is a row binder or listed in EXEMPT, never both`, add:

   ```js
   test('every `<MAIN_REPO>` table row carries the literal-spelling sentence, the resolution module excepted', () => {
     const spellers = Object.keys(CASES.find((c) => c.id === 'main-repo-literal-spelling').expected);
     const rowFiles = filesUnder('plugin', '.md').filter((file) =>
       readFileSync(join(WORKSPACE_ROOT, file), 'utf8')
         .split('\n')
         .some((line) => line.startsWith('| `<MAIN_REPO>` |')),
     );
     // `MODULE` produces the value and spells no command with it, so it carries no sentence.
     assert.deepEqual(rowFiles.sort(), [...spellers, MODULE].sort());
   });
   ```

2. In the module header, change the sentence that starts "Every autonomous binder also carries the byte-identical `<MAIN_REPO>` `## Resolved values` row (`MAIN_REPO_ROW`); every clause-carrier without that row is listed in `EXEMPT` with its reason;". Append this clause before the final "and no plugin file spells the push path …" clause: "every file with a `<MAIN_REPO>` table row carries the literal-spelling sentence, except `plugin/instructions/main_repo_resolution.md`;".

3. Add a `RED ONCE (inherited row)` record after the existing `RED ONCE (classification)` record, in the same style. The mutation, in the working tree only: append the line `| `<MAIN_REPO>` | derived at runtime | The main checkout the citing engine command resolved. |` to the end of `plugin/instructions/mode_contract.md`. Run this suite. Confirm that only the new test fails, with `plugin/instructions/mode_contract.md` present in the actual set and absent from the expected set. Restore the file and record the date, the mutation, the failing test and the extra file.

The only test file this fix edits is this one, so it is the only one the fix runs. From the repository root: `npm test --workspace cli -- test/main-repo-resolution-corpus.test.mjs`, once for the red run and once after the restore.
