### 1. `vector-agreement.mjs` retypes `EMBED_BATCH_SIZE` instead of importing it from its owner

**Severity:** Must Fix. **Layers:** cli, general.

**Site.**

- `evals/docs-retrieval/vector-agreement.mjs` → the constant declared under the comment ``/** `cli/src/retrieval/refresh.ts` → `EMBED_BATCH_SIZE`, which that module does not export. */``, i.e. `const EMBED_BATCH_SIZE = 32;`, read by `embedChunks`.
- `cli/src/retrieval/refresh.ts` → `const EMBED_BATCH_SIZE = 32;` (module-private), the owner.

**Problem.** The value has one owner, `cli/src/retrieval/refresh.ts`, and the eval keeps a second, hand-typed copy of it. The copy's own comment says the owner does not export it, so the copy is deliberate.

This breaks `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time` → *"The shared constants have owners, and a value is imported from its owner rather than retyped"*. It also breaks `### Where a new responsibility goes` → *"A responsibility that already has a home does not get a second one"* and *"Before adding a copy of anything, grep for it."*

The copy matters because the module depends on it. `vector-agreement.mjs`'s header states the rule the module exists to enforce: the TypeScript side is embedded *"in corpus order and in batches of the same size, as a cold refresh batches them"*. If someone changes the batch size in `refresh.ts`, that rule becomes false and nothing fails: no compile error and no refusal.

This branch already took the right route for the same problem. Task 13 exported `EMBEDDING_EXTRACT_OPTIONS` from `cli/src/retrieval/models.ts` *"so that Task 7's matched-precision leg imports them rather than copying them"* (story plan → `## Context`). The batch size is the same kind of value, read by the same module, and it was left as a copy.

**Fix.**

1. `cli/src/retrieval/refresh.ts`: change `const EMBED_BATCH_SIZE = 32;` to `export const EMBED_BATCH_SIZE = 32;`. Give it a doc comment saying it is exported for `evals/docs-retrieval/vector-agreement.mjs`, which must embed in the same batches a cold refresh uses. Also change the doc comment of the refresh function, which says *"embedded in batches of 32"*, to say *"in batches of {@link EMBED_BATCH_SIZE}"*, so the number is written only once. Keep every value unchanged.
2. `evals/docs-retrieval/vector-agreement.mjs`: delete the local `EMBED_BATCH_SIZE` declaration and its comment. Add `import { EMBED_BATCH_SIZE } from '../../cli/dist/retrieval/refresh.js';` beside the other `cli/dist/retrieval/` imports. `embedChunks` stays as it is.
3. Run `commands.typecheck`. It runs `npm run build`, so it also refreshes `cli/dist/retrieval/refresh.js` before the eval imports it.
