### 2. JSON dotted-path and list helpers are copied across `generators/` and `doctor/` instead of living in `core/json.ts`

**Severity:** Must Fix. **Layer:** cli.

**Sites:**
- `cli/src/generators/sandboxProfile.ts` → `objectAt`, `listAt(parent, key, where)`, `appendUnique`
- `cli/src/generators/writeProtection.ts` → `listAt(root, path)`, `appendUnique`
- `cli/src/generators/permissionProfile.ts` → `assertRunnable`, the two `where.split('.').reduce<JsonValue | undefined>(` traversals
- `cli/src/doctor/checks.ts` → `valueAtPath` and `stringMembers`, added above `PROFILE_SANDBOX_CHECK`

**Problem.** This branch adds five private copies of one behaviour: walking a `JsonObject` by a key path (dotted string or segment array) to an object, list or value, plus appending to a list without duplicates. Two `cli/src` areas need it, `generators/` and `doctor/`. `.claude/context/conventions.md` → `## Shared code, and where it lives` says: *"The CLI's shared modules are `cli/src/core/` — errors, output, the write engine, git, **JSON**, … A value or behaviour two `cli/src` areas need lives there, never duplicated into both."* `### Where a new responsibility goes` adds: *"Before adding a copy of anything, grep for it."*

That paragraph also warns about the exact shape these copies have reached. `cli/src/core/repoPaths.ts` exists *"because several modules had each carried a private copy of one normalisation, the copies had drifted, and two divergent bodies had been given the same name."* Here, `sandboxProfile.ts` → `listAt(parent, key, where)` and `writeProtection.ts` → `listAt(root, path)` are already two divergent bodies under one name: one takes a single key, the other a path. `appendUnique` is a byte-identical copy in both generators.

**Fix.**
1. In `cli/src/core/json.ts`, add exported helpers that cover every call site, each with a doc comment:
   - `valueAt(root: JsonObject, path: readonly string[]): JsonValue | undefined` — the shared walk;
   - `stringsAt(value: JsonValue | undefined): readonly string[]` — the `stringMembers` behaviour;
   - `appendUnique(list: JsonValue[], values: readonly string[]): void`.
   
   Keep the fault-raising (`internal(...)` naming where the template lost its shape) at the generator call sites, or add thin throwing wrappers in `core/json.ts` that take the description as a parameter. The fault wording is the caller's.
2. Delete `objectAt`, both `listAt`s and both `appendUnique`s from `sandboxProfile.ts` and `writeProtection.ts`, and rewrite their callers on the `core/json.ts` helpers. Each generator keeps its own `internal(...)` messages.
3. In `permissionProfile.ts` → `assertRunnable`, replace the two inline `split('.').reduce` traversals with `valueAt(profile, where.split('.'))`.
4. In `cli/src/doctor/checks.ts`, delete `valueAtPath` and `stringMembers` and import the `core/json.ts` helpers. `doctor` already imports `isJsonObject` from there.
5. Update the `core/json.ts` module header so it lists the path helpers among what it owns.
