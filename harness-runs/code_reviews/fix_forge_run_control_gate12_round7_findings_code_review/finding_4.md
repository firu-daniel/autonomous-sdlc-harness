### 4. `UNPARSEABLE_CONTROL_IF_LINE` is exported, but nothing outside its own module imports it

**File:** `cli/src/generators/githubWorkflows.ts` (`UNPARSEABLE_CONTROL_IF_LINE`) — "export const UNPARSEABLE_CONTROL_IF_LINE =".

**Problem.** The other three new exports from this module each have an importer outside it:

- `UNPARSEABLE_CONTROL_RELEASES`: `cli/src/commands/init.ts` and `cli/test/trigger-workflow-init.test.mjs`;
- `unparseableControlRoute`: `init.ts` and `cli/src/doctor/checks.ts`;
- `ControlRepair`: `init.ts`.

A `git grep` over `cli`, `plugin`, `scripts` and `docs` finds `UNPARSEABLE_CONTROL_IF_LINE` only in its own module, where `classifyControl` and two doc comments use it. Its `export` widens the module's public surface for no consumer. `noUnusedLocals` does not catch this, because an exported binding never counts as unused.

**Fix.** In `cli/src/generators/githubWorkflows.ts`, drop the keyword. Leave the doc comment and the value unchanged:

```ts
const UNPARSEABLE_CONTROL_IF_LINE =
```

The two `{@link UNPARSEABLE_CONTROL_IF_LINE}` references in the same file still resolve. No test imports the symbol, so no test file changes. The typecheck in the gates phase covers the edit.
