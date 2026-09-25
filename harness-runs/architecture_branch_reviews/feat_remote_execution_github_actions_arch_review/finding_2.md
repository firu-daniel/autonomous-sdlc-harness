### 2. Move this package's manifest reader out of `retrieval/` into `core/`

**Severity:** Must Fix · **Layer:** cli

**Site.**
- `cli/src/generators/githubWorkflows.ts`: `import { ownManifestString } from '../retrieval/runtime.js';` and the call `{ cliVersion: ownManifestString('version') }` in `writeGithubWorkflows`. Also header choice 1: *"it is read through `retrieval/runtime.ts` → `ownManifestString`, the one reader of this package's manifest"*.
- `cli/src/retrieval/runtime.ts`: the private `ownManifest()` and the exported `ownManifestString(key: 'name' | 'version')`.
- The other importer: `cli/src/commands/docs.ts`, `import { ownManifestString, retrievalModelCacheDir } from '../retrieval/runtime.js';`.

**Problem.** `ownManifestString` reads this package's own `package.json`, which identifies the package. It has nothing to do with retrieval. It sits in `retrieval/runtime.ts`, a module whose header scopes it to *"How the docs-retrieval packages reach this CLI: the optional peer set, the machine cache paths …, the loader and the entry resolver"*. Before this branch, its consumers were retrieval's own code and the `docs` command. This branch adds a consumer in a different area: the `generators/` workflow generator, which needs the version to pin the job's plugin install and its `npx autonomous-sdlc-harness@<version>`. It has no retrieval purpose. That gives the `generators/` area a static dependency on the `retrieval/` area, only to read a manifest field.

The rules violated:
- `.claude/context/conventions.md` → `## Shared code, and where it lives`: *"The CLI's shared modules are `cli/src/core/` … A value or behaviour two `cli/src` areas need lives there, never duplicated into both."*
- `.claude/context/cli.md` → `## Naming and file layout`: *"an area names one responsibility, and a module lives in the area whose responsibility it serves"*.

With two areas needing it, `retrieval/` and `generators/`, the manifest reader's home is `core/`. `core/paths.ts` already owns `packageRoot()`, which the reader is built on, and `readTemplate()`, which the same generator already imports.

**Fix.**
1. Move `ownManifest()` and `ownManifestString()` from `cli/src/retrieval/runtime.ts` to `cli/src/core/paths.ts`, next to `packageRoot()`. Keep both bodies unchanged, including their `internal(...)` throws. Import `internal` from `./errors.js` and `isJsonObject` / `readJsonFile` from `./json.js` there, both of which are already `core/` siblings. Give the function's doc comment the reason it is shared: the one reader of this package's own manifest, used by the retrieval runtime check, the `docs` command and the workflow generator.
2. In `cli/src/retrieval/runtime.ts`, import `ownManifestString` from `../core/paths.js` and delete the local definitions. Drop any import that becomes unused (`noUnusedLocals` makes an unused one a build failure).
3. In `cli/src/commands/docs.ts`, import `ownManifestString` from `../core/paths.js`, and `retrievalModelCacheDir` from `../retrieval/runtime.js` as before.
4. In `cli/src/generators/githubWorkflows.ts`, import `ownManifestString` from `../core/paths.js`, where `readTemplate` already comes from, and remove the `../retrieval/runtime.js` import. Update header choice 1 to name `core/paths.ts` → `ownManifestString`.
5. Run a grep to confirm that no `ownManifestString` import from `retrieval/runtime` remains. Then run `commands.typecheck` and `commands.test`. `cli/test/retrieval-loading.test.mjs` keeps guarding that non-retrieval verbs load no peer.
