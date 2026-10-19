### 1. Import `RUN_LOGS_DIR` in `repoRoot.ts` instead of retyping `'autonomous_logs'`

**Severity:** Should Fix. **Layer:** cli.

**Site:** `cli/src/generators/repoRoot.ts` → `const LOGS_DIR = 'autonomous_logs';` and the doc comment directly above it, which begins "The run daemon's log directory, whose contents are machine-local." (around line 145–154; the line number is only a navigation hint).

**Problem.** This branch made `cli/src/generators/stateDir.ts` the owner of the run-log directory's name. It exports `RUN_LOGS_DIR = 'autonomous_logs'`, uses it in `STATE_DIR_ENTRIES`, and removed the private copy `cli/src/doctor/checks.ts` used to carry (`doctor` now imports it). One retyped copy of the same literal is still in `cli/src`: `repoRoot.ts`'s `LOGS_DIR`. Its doc comment argues for naming the directory "as strings … rather than imported as rows", because `STATE_DIR_ENTRIES` has no machine-local column. That argument is against importing a *row*. It does not cover a *constant*, and a constant now exists. Importing `RUN_LOGS_DIR` adds no column to the table, and `treeDirectory`'s existence check still runs against `STATE_DIR_ENTRIES` either way.

Rules this breaks:
- `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`: "The shared constants have owners, and a value is imported from its owner rather than retyped".
- The same section → "a new persisted artifact joins the module that owns it rather than being named at its use site".
- `## The layers` → `### Where a new responsibility goes`: "Before adding a copy of anything, grep for it", with `cli/src/core/repoPaths.ts` as the worked cost of drifted copies.

With an owner now declared, a rename made through `RUN_LOGS_DIR` would leave this generator writing ignore rules for the old name. The existence check would catch that only as a thrown internal fault at `init` time, not as a compile error.

**Fix.**
1. In `cli/src/generators/repoRoot.ts`, extend the existing `import { STATE_DIR_ENTRIES } from './stateDir.js';` to `import { RUN_LOGS_DIR, STATE_DIR_ENTRIES } from './stateDir.js';`.
2. Replace `const LOGS_DIR = 'autonomous_logs';` with `const LOGS_DIR = RUN_LOGS_DIR;`. Alternatively, replace every use of `LOGS_DIR` in the file (the `CONTENTS_IGNORED` row `{ dir: LOGS_DIR, … }`, the `contentsIgnoredDirectory(stateDir, LOGS_DIR)` call, and the `{@link LOGS_DIR}` references in neighbouring doc comments) with `RUN_LOGS_DIR`. Either works, as long as no string literal `'autonomous_logs'` remains in `repoRoot.ts` code.
3. Amend the doc comment above it so it no longer says this directory is "named here as a string". State instead that its name is imported from `stateDir.ts`, which owns it, while `INBOX_DIR` (and any other directory still without an exported constant) stays a string checked against `STATE_DIR_ENTRIES` by `treeDirectory`, for the reason already given. `.claude/context/cli.md` → `## What "done" means here` holds a change to its module's own header.
4. No behaviour changes: the generated ignore rules are byte-identical. The existing `cli/test/` suites that assert the generated `.gitignore` rules for `autonomous_logs` cover the change. Run the one suite that asserts them, if this unit edits it. Otherwise this unit creates or edits no test file and runs none.
