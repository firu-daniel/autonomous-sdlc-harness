### 1. Point 7's downgrade clause lets the acceptance case slip through, because two of the three seeded guards print paths relative to their own root

**File:** `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, point 7, the **A failure** bullet — "A failure naming no path in the changed-path set is an evidence downgrade, as point 2 grades one."

**Problem.** Point 7 defines the changed-path set as **repo-relative** paths, for example `cli/test/new-suite.test.mjs`. It then treats a guard failure as an **evidence downgrade**, not the unit's to fix, whenever the failure names "no path in the changed-path set". Two of the three guards this branch seeds in `harness.config.json` never print a repo-relative path:

- `cli/test/main-anchor-isolation.test.mjs` → `every process.env spread in a test source blanks the anchor in the same object` reports each offence as `${p}: …`, where `p` comes from `readdirSync(root, { recursive: true })` with `root = import.meta.dirname`. That path is relative to `cli/test/`, so it prints `new-suite.test.mjs: …process.env…` and never `cli/test/new-suite.test.mjs`.
- `cli/test/retrieval-loading.test.mjs` → `sourceFiles` reports paths relative to the package root (`src/…`), not `cli/src/…`.

The task prompt's first acceptance criterion is a unit whose diff adds a `cli/test/*.mjs` file with a bare `{ ...process.env }`. In that case the guard is selected and fails, but its failure names `new-suite.test.mjs`, which is not a member of the changed-path set. An implementer applying point 7 as written records an evidence downgrade instead of fixing the spread. The break then surfaces at Run gates, which is exactly the outcome this branch exists to prevent. The clause also drops point 2's second condition (*"and no symbol it defined or changed"*), so a failure that names a symbol rather than a file is downgraded too.

**Fix.** In `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, point 7, **A failure** bullet, replace the last sentence:

> A failure naming no path in the changed-path set is an evidence downgrade, as point 2 grades one.

with:

> A failure is an evidence downgrade, as point 2 grades one, only when it names no symbol the unit defined or changed and no path that equals a changed path or matches its trailing segments — a guard may print paths relative to its own directory rather than the repository root (`new-suite.test.mjs` for `cli/test/new-suite.test.mjs`). A failure that names no path at all is the unit's.

Change nothing else in point 7. Every citer only points at the section, so no other file needs an edit. This fix edits no test file, so it runs no test. The full suite runs in the Run gates phase.
