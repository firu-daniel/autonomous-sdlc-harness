### 3. The `docs/config.md` §5 `treeGuards` row restates points 7 and 8 of the test-run rule, and its copy of point 8 already disagrees with the owner

**File:** `docs/config.md` → `## 5. Key reference`, the `treeGuards` row — "After a unit's own test run, the unit loop runs every guard" and "**A new test that reads a tree of source files as text adds itself here in the same change**"

**Problem.** `docs/config.md` is a roster member of `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, and the roster rule is *"A citer **points and never restates**"*. The `treeGuards` row restates two points of that rule:

- **Point 7.** *"After a unit's own test run, the unit loop runs every guard whose `covers` matches a path in the unit's change, through the single-file test command its conventions document states, and handles a failing guard as it handles a failing own test"* — then it cites point 7.
- **Point 8, without citing it.** *"A new test that reads a tree of source files as text adds itself here in the same change"*. The owner says something different: *"has its `<tree_guards>` entry added to `harness.config.json` in the same change, **or by a later catch-all-layer task the adding task names**"*, and its scope is *repository* files, not *source* files. The two copies now disagree. A reader of this row would grade this branch's own plan as non-compliant, since Tasks 1–2 add tests and Task 8 registers the guards later.

The architecture review's Finding 1, step 3, asked for exactly this re-pointing. Its recorded deviation says the step was left undone because it was outside the `plugin` layer, and no `general`-layer unit picked it up.

**Fix.** In that row, make two replacements and leave everything else in the row unchanged:

1. Replace *"After a unit's own test run, the unit loop runs every guard whose `covers` matches a path in the unit's change, through the single-file test command its conventions document states, and handles a failing guard as it handles a failing own test — the selection and the run are owned by `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, point 7."* with:
   > Which guards a unit runs after its own test run, and how a failing one is handled, is owned by `plugin/instructions/unit_loop_core.md` → `## The test-run rule`, point 7.
2. Replace *"**A new test that reads a tree of source files as text adds itself here in the same change**; a guard missing from the list"* with:
   > **When a tree-reading test must add its entry here** is owned by point 8 of the same section; a guard missing from the list

This fix edits no test file, so it runs no test.
