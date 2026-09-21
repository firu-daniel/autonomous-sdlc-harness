### 1. Stub-selection predicate re-spelled in `commands/docs.ts` and `retrieval/setup.ts` instead of imported from `retrieval/models.ts`

**Severity:** Must Fix. **Layer:** cli.

**Sites:**
- `cli/src/retrieval/models.ts` → `resolveModels`: `const value = process.env[RETRIEVAL_STUB_ENV]; if (value === undefined || value === '') return loadModels(options);`. This is the owner. It owns `RETRIEVAL_STUB_ENV` and decides "stub or real models".
- `cli/src/retrieval/setup.ts` → `stubSelected`: `return (process.env[RETRIEVAL_STUB_ENV] ?? '') !== '';`. Its own doc comment admits it is a copy: *"Set to a non-empty value, the same reading `models.ts` → `resolveModels` takes."*
- `cli/src/commands/docs.ts` → `fetchModelsVerb`: `if ((process.env[RETRIEVAL_STUB_ENV] ?? '') !== '') {`

**Problem.** One question, "does this process run on the stub models?", now has three bodies in two areas (`retrieval/` and `commands/`). Only `models.ts` owns the answer. The two copies both read the variable through its constant, but each one re-derives what counts as "set".

These rules forbid the copies:
- `.claude/context/conventions.md` → `### Where a new responsibility goes`: *"A responsibility that already has a home does not get a second one."*
- The same section: *"Before adding a copy of anything, grep for it."* It cites the `repoPaths.ts` history, where private copies of one test drifted apart with no compile error and no test.
- `.claude/context/conventions.md` → `## Shared code, and where it lives`: a behaviour two `cli/src` areas need *"lives there, never duplicated into both"*.

The copies agree today. But the guarantee these three sites share is the rule in the `models.ts` header: stub runs never download. That rule depends on all three copies agreeing. Suppose `resolveModels` gains a stricter reading later, such as refusing an unknown value earlier or trimming whitespace. Then `setup.ts` could treat a process as real and run `npm install` or `docs fetch-models`, while `resolveModels` in the same process loads stubs, or the reverse. That drift is invisible until a test goes online.

**Fix.**
1. In `cli/src/retrieval/models.ts`, export one predicate beside `RETRIEVAL_STUB_ENV`:
   ```ts
   /** True when {@link RETRIEVAL_STUB_ENV} is set to a non-empty value — the one reading of "a stub run". */
   export function stubModelsSelected(): boolean {
     return (process.env[RETRIEVAL_STUB_ENV] ?? '') !== '';
   }
   ```
   Make `resolveModels` use it: `if (!stubModelsSelected()) return loadModels(options);`. Keep the existing unknown-value refusal after that line.
2. In `cli/src/retrieval/setup.ts`, delete the private `stubSelected` and its doc comment. Import `stubModelsSelected` from `./models.js` and call it at both current `stubSelected()` call sites (`setUpRuntime` and `setUpModels`). `RETRIEVAL_STUB_ENV` stays imported, because the warning and note messages still name it.
3. In `cli/src/commands/docs.ts` → `fetchModelsVerb`, replace the inline `(process.env[RETRIEVAL_STUB_ENV] ?? '') !== ''` test with `stubModelsSelected()`, imported from `../retrieval/models.js`. `RETRIEVAL_STUB_ENV` stays imported for the refusal message.
4. Check with `grep -rn "process.env\[RETRIEVAL_STUB_ENV\]" cli/src`, which must print only the line inside `stubModelsSelected`. Then `commands.typecheck` and `commands.test` must both exit zero. The existing stub-refusal and stub-setup cases in `cli/test/docs-retrieval.test.mjs` and `cli/test/init.test.mjs` cover the behaviour, which does not change.

**Deviations from plan:** Fix step 4 requires the `process.env[RETRIEVAL_STUB_ENV]` grep to print only a line inside `stubModelsSelected`, but `resolveModels` still needs the variable's value to pick the stub version. Implemented a private `stubEnvValue()` in `models.ts` as the one read; `stubModelsSelected` and `resolveModels` both call it. The grep prints one line, inside `stubEnvValue`.
