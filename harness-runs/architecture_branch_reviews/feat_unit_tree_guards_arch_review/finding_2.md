### 2. `docs/config.md` §5's repo-relative paragraph still lists two exceptions, not three

**Severity:** Should Fix · **Layer:** general

**Site:** `docs/config.md` → `## 5. Key reference`, the paragraph under the key table that begins *"**Every path in this file is repo-relative**"* and ends *"Two values sit outside that rule and state their own frame in their own rows: `$schema` and `parity.referenceImplPath`."*

**Problem.** This branch makes `treeGuards[].test` a third value outside the repo-relative rule, and three of the contract's places already say so:
- `cli/src/config/model.ts` → its module header: *"except `$schema` …, `parity.referenceImplPath` …, and `treeGuards[].test`, which is the argument the single-file test command takes"*.
- `schemas/harness.config.schema.json` → `treeGuards.items.properties.test.description`.
- The new `treeGuards` row in this same table: *"**`test` is the one path-like value in this file that is not necessarily repo-relative**"*.

The paragraph under the table still says *two* values sit outside the rule and names only `$schema` and `parity.referenceImplPath`. The table row also contradicts it, since that row calls `test` "the one" such value. `.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`, item 1, makes the schema, `cli/src/config/model.ts`, `cli/src/config/check.ts` and `docs/config.md` §5 *"one contract in four places"*. The fourth place now disagrees with itself and with the other three.

**Fix.**
1. In `docs/config.md` → `## 5. Key reference`, change the closing sentence of the *"Every path in this file is repo-relative"* paragraph to: *"Three values sit outside that rule and state their own frame in their own rows: `$schema`, `parity.referenceImplPath` and `treeGuards[].test`."*
2. In the `treeGuards` row, reword *"the one path-like value in this file that is not necessarily repo-relative"* so it no longer claims to be the only one. For example: *"**`test` is not necessarily repo-relative**"*.
