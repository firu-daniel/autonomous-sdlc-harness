### Task 1 — Export `unresolvedRetrievalPeers()` from `cli/src/retrieval/runtime.ts`, the predicate for whether this installation resolves its own peers

**Goal:** Give the package one exported answer to *"which retrieval peers can this installation not resolve from its own location?"*. Today that answer exists only as the private `resolvesHere` closure inside `retrievalCliEntry`. Exporting it lets the docs-retrieval eval refuse on what it actually loads, the peers `loadRetrievalModule`'s bare `import()` reaches from `cli/dist/retrieval/`, without a second copy of the resolution loop (`.claude/context/conventions.md` → *"Before adding a copy of anything, grep for it."*).

**Where this task stops.** This task adds the predicate, makes `retrievalCliEntry` use it, and tests it. It changes no behaviour of any CLI verb: `retrievalCliEntry` answers exactly as before, and `retrievalRuntimeState`, `init`'s setup and `doctor`'s checks are untouched. **The eval's refusal is Task 2's** and **the gate's grading is Task 3's**. They consume this function from the compiled `cli/dist/retrieval/runtime.js`. Nothing under `evals/` or `scripts/` is edited here.

### Targets

- `cli/src/retrieval/runtime.ts` — the new export, `retrievalCliEntry` rewritten to use it, and the module header.
- `cli/test/retrieval-loading.test.mjs` — a fifth case, `(e)`, and the header's case list.

**Work:**

- [ ] `runtime.ts`: add `export function unresolvedRetrievalPeers(): readonly string[]`. It returns the `name` of every `retrievalPeers()` entry for which `import.meta.resolve(name)` throws, in the manifest order `retrievalPeers()` yields. **Any** throw counts as unresolved: not only `ERR_MODULE_NOT_FOUND`, but also a package-path error and a resolve hook's refusal. This matches the `try { import.meta.resolve(name); return true; } catch { return false; }` it replaces. It resolves only and loads nothing, so the module-header rule *"a retrieval package is loaded only by a dynamic `import()` in this module"* still holds. Its doc comment states four things:
  - The base it resolves from is this module's own location. That is the same base `loadRetrievalModule`'s `import()` resolves from, so an empty answer means the loader will find every package.
  - It is **not** the answer to *"is the runtime installed?"*. That is `retrievalRuntimeState`'s answer, and `doctor`'s `retrieval-dependencies` deliberately does not consult this one (`cli/src/doctor/checks.ts` → `RETRIEVAL_DEPENDENCIES_CHECK`'s doc comment).
  - Like `retrievalCliEntry`, it may be called only on a retrieval path, because a resolve hook sees `import.meta.resolve`.
  - Its consumers are `retrievalCliEntry` and, outside the package, the docs-retrieval eval's refusal: `evals/docs-retrieval/index-build.mjs` → `assertRealModelsAreAvailable` and `evals/docs-retrieval/check-floor.mjs` → `checkFloor`.
- [ ] `runtime.ts`: in `retrievalCliEntry`, replace the `resolvesHere` closure with `unresolvedRetrievalPeers().length === 0`. Its return values and doc comment are otherwise unchanged. Add the new predicate to the module header's opening inventory sentence (*"the one predicate for "is the runtime installed?", the loader and the entry resolver"*), without changing the header's rule paragraph.
- [ ] `retrieval-loading.test.mjs`: add `test('(e) unresolvedRetrievalPeers lists every peer a resolve hook refuses, and none without it', …)`, with two assertions.
  - **Hooked**, in a child: write a `probe.mjs` into a `scratchDir(t)` that imports `pathToFileURL(join(PACKAGE_ROOT, 'dist', 'retrieval', 'runtime.js')).href` and prints `JSON.stringify(unresolvedRetrievalPeers())`. Run it with `runCliFrom(probe, dir, [], { NODE_OPTIONS: await writeHook(dir) })` and `assert.deepEqual(JSON.parse(stdout), PEER_NAMES)`.
  - **Unhooked**, in process: import the same module and `assert.deepEqual(runtime.unresolvedRetrievalPeers(), [])`. A one-line comment says why that holds wherever this suite runs: `cli/package.json` repeats every peer under `devDependencies` (`.claude/context/conventions.md` → the docs-retrieval carve-out).
- [ ] `retrieval-loading.test.mjs` header: *"## Four cases, and why each is needed"* becomes five, with a bullet for **(e)** that states which property it guards. That property is that the predicate answers from resolution through the loader's own base, and that a refused resolution is reported by name rather than thrown.

**Verification:**

- `bash scripts/typecheck.sh` passes. It also builds `cli/dist`, which Tasks 2 and 3 import.
- Case `(e)` is this task's own test, so the unit runs it only through a single-file test command a conventions document states (`plugin/instructions/unit_loop_core.md` → `## The test-run rule`, point 3). None is stated, so its run is deferred to the Run gates phase and the return says so. The unit instead exercises the same two assertions through a scratch probe, `bash scripts/scratch-run.sh harness-runs/scratch/<probe>.mjs`. Unhooked, the probe prints `[]`. It then spawns a child under a peer-refusing `--import` hook, which prints all five peer names in manifest order. The probe file is deleted afterwards.
- `retrievalCliEntry()` from the rebuilt `cli/dist` still answers `source: 'this-installation'` in this workspace. That is the same answer it gave at the branch point, which shows the refactor changed nothing it returns.
- `grep -n "import.meta.resolve" cli/src/retrieval/runtime.ts` finds one call site, inside `unresolvedRetrievalPeers`, and none left in `retrievalCliEntry`.
