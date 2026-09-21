### 2. `docs search` and `docs serve` ignore `--dry-run` and persist the index

**Severity:** Should Fix. It is a boundary of the declared write exception rather than a layer-placement violation. **Layer:** cli.

**Sites:**
- `cli/src/commands/docs.ts` → `search`: `const session = await openRetrieval({ repoRoot, config, inMemory: false });`
- `cli/src/commands/docs.ts` → `serve` → `serveDocs`, which leads to `cli/src/retrieval/server.ts` → `serveDocs`: `const session = await openRetrieval({ repoRoot, config, inMemory: false });`
- For contrast, `cli/src/commands/docs.ts` → `index` passes `inMemory: flags.has(IN_MEMORY_FLAG) || ctx.flags.dryRun`.

**Problem.** The branch adds exactly one write into an adopting repository outside `cli/src/core/writer.ts`: the index under `<stateDir>/docs_index/`, created by `retrieval/store.ts` → `openPgliteStore`. The `core/writer.ts` header declares that exception. It is legitimate only if the write stays inside what the CLI's global flags promise:
- `cli/src/commands/registry.ts` → `GlobalFlags.dryRun`: *"Print what would be written and write nothing."*
- The `docs` usage block in `cli/src/commands/docs.ts` → `usage()`: *"--dry-run builds the index in memory and writes nothing."*
- The module header: *"`--dry-run` builds in memory. The global flag promises that nothing is written."*

Only the `index` sub-verb honours the flag. `docs search --dry-run` opens the persistent store, so `mkdirSync` plus PGlite persistence create and write `<stateDir>/docs_index/` anyway. That breaks the "writes nothing" guarantee `.claude/context/cli.md` → `## How a module in this layer is written` states for the write plan: *"`--dry-run` cannot leak a write"*. So the declared exception is wider than the header that records it.

`docs serve` has the same gap. A dry-run server makes little sense, but the flag is global and is silently accepted.

**Fix.**
1. In `cli/src/commands/docs.ts` → `search`, pass `inMemory: ctx.flags.dryRun` to `openRetrieval`. A dry-run search then builds and queries an in-memory index and writes nothing.
2. In `cli/src/commands/docs.ts` → `serve`, refuse the flag before starting anything:
   ```ts
   if (ctx.flags.dryRun) {
     throw new HarnessError(`docs serve: --dry-run is not supported, because a server persists the index it refreshes; ${helpHint()}`);
   }
   ```
   Alternatively, thread an `inMemory` option through `serveDocs`. Either way, never persist under `--dry-run`.
3. Make the header sentence *"`--dry-run` builds in memory"* in `cli/src/commands/docs.ts` name both behaviours: `index` and `search` build in memory, and `serve` refuses.
4. In `cli/test/docs-retrieval.test.mjs`, add a case that runs `docs search <query> --dry-run` against a retrieval-on fixture. Assert on the bytes on disk: `<stateDir>/docs_index` must not exist afterwards (`.claude/context/cli.md` → `## What "done" means here`, *"A refusal is asserted on the bytes on disk"*). Add a case that `docs serve --dry-run` exits non-zero with its message on stderr and writes nothing.
