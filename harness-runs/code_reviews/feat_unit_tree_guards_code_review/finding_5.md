### 5. `tree-guards` never tries `appDir` as a base, so a guard relative to a package directory that is not itself a layer path gets a false warning

**File:** `cli/src/doctor/checks.ts` (`treeGuardTestResolves`, `TREE_GUARDS_CHECK`) — "return [repoRoot, ...layerPaths.map((path) => join(repoRoot, path))]"

**Problem.** The schema, the model and `docs/config.md` §5 all describe `treeGuards[].test` the same way: *"in a workspace whose command runs from a package directory, it is relative to that directory"*. The configuration already has a key for the application's package directory, `appDir`. `doctor` only tries the repository root and each `layers[].path` as bases. Consider the worked configuration's shape (`schemas/negative/tree-guard-without-covers.json` has it): `appDir` is `packages/storefront`, and the layers are `packages/storefront/src/data`, `…/src/domain` and `…/src/presentation`. A single-file command run from `packages/storefront` takes `test/x.test.mjs`. That path resolves against neither the root nor any layer path, so the check **warns** about a guard that is correct. The warning's remedy reads *"Correct or remove those entries"*. The entry cannot be corrected, because it is already right, so following the remedy means deleting a working guard and losing the protection the key exists to give.

**Fix.**

1. In `cli/src/doctor/checks.ts` → `TREE_GUARDS_CHECK.run`, read `appDir` defensively, the same way `layers` is read, and pass it as a base between the root and the layer paths:
   ```ts
   const appDir = typeof ctx.config.appDir === 'string' ? ctx.config.appDir : DEFAULTS.appDir;
   // …
   .filter((test) => !treeGuardTestResolves(test, repoRoot, [appDir, ...layerPaths]))
   ```
   Rename `treeGuardTestResolves`'s third parameter from `layerPaths` to `bases`. In its doc comment, change "joined to the repository root **or** to any configured `layers[].path`, in config order" to "joined to the repository root, to `appDir`, **or** to any configured `layers[].path`, in config order". In the warning text, change "under the repository root or any layers[].path" to "under the repository root, appDir or any layers[].path".
2. In `docs/cli.md` → `## 7. \`doctor\``, in the **`tree-guards` never fails.** bullet, change "joined to one of **two bases**: the repository root, for a single-file test command that runs from there; or any `layers[].path`" to "joined to one of **three bases**: the repository root, for a single-file test command that runs from there; `appDir`, the application's package directory; or any `layers[].path`".
3. In `cli/test/doctor-tree-guards.test.mjs`, change the header's "joined to the repository root or to any `layers[].path`" to "joined to the repository root, to `appDir` or to any `layers[].path`". Then add a subtest beside *"a test that exists only under a configured layers[].path passes"*: set `config.appDir = 'pkg'` by rewriting `harness.config.json` the way that subtest rewrites `layers`, `plant(dir, 'pkg/test/app-guard.test.mjs')`, `setGuards(dir, [{ test: 'test/app-guard.test.mjs', covers: 'pkg/src/**' }])`, and assert `await doctorLine(dir, 'PASS')`.

`cli/test/doctor-tree-guards.test.mjs` is the one test file this fix edits, so it is the only test the fix runs. The full suite runs in the Run gates phase.
