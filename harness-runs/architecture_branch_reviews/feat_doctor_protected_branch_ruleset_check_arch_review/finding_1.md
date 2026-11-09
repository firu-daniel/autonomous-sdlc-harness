### 1. `checks.ts` retypes the protection-needs phrase that `branchProtection.ts` owns

**Site:** `cli/src/doctor/checks.ts` → `const PROTECTED_BRANCH_NEEDS = 'direct pushes, force pushes and deletion';` (declared just above `BRANCH_PROTECTION_CHECK`; around line 3490 as a navigation hint), and its three uses inside `BRANCH_PROTECTION_CHECK`: the `title`, the `not checked, because forge is …` warning, and the `not checked — run \`${CLI} doctor --check-github\` …` warning.

**Problem.** This branch makes `cli/src/doctor/branchProtection.ts` the single owner of what a protected branch needs blocked and how each need is named: `PROTECTION_NEEDS` (the set and its order) and `PROTECTION_NEED_LABEL` (`push: 'direct pushes'`, `'force-push': 'force pushes'`, `deletion: 'deletion'`), joined into a sentence by its private `needsPhrase` / `joinWords`. `describeCoverage` prints that phrase on every graded line (`a ruleset or branch protection blocks ${needsPhrase(PROTECTION_NEEDS)} on …`).

`checks.ts` then hand-writes the same phrase a second time as the literal `PROTECTED_BRANCH_NEEDS` and prints it in the check's title and in its two `not checked` arms. That is a second producer of one string: rename a label, or add a need to `PROTECTION_NEEDS`, and the check's title and its default-run warning go on naming the old set while the graded line names the new one — with no compile error and no test, since `cli/test/doctor-branch-protection.test.mjs` asserts on the output rather than on the source of the phrase.

Rules this breaks:

- `.claude/context/conventions.md` → `## Configuration is the source of truth, and it is read at run time`: *"The shared constants have owners, and a value is imported from its owner rather than retyped"*; and `### Where a new responsibility goes`: *"A responsibility that already has a home does not get a second one"* / *"Before adding a copy of anything, grep for it."*
- `.claude/context/cli.md` → `## How a module in this layer is written`, **One string, one producer**, and **`doctor` asks, grades and repairs nothing**: *"nothing it reports is re-derived from a second copy"*.
- `BRANCH_PROTECTION_CHECK`'s own doc comment, item 4: *"What each answer counts for and how a branch grades is `doctor/branchProtection.ts`'s."*

**Fix.**

- [ ] In `cli/src/doctor/branchProtection.ts`, export the phrase from its owner — e.g. `export const ALL_PROTECTION_NEEDS_PHRASE = needsPhrase(PROTECTION_NEEDS);` declared after `needsPhrase` (or export `needsPhrase` itself) with a one-line doc comment, and use it in `describeCoverage`'s pass sentence in place of the inline `needsPhrase(PROTECTION_NEEDS)`.
- [ ] In `cli/src/doctor/checks.ts`, delete `const PROTECTED_BRANCH_NEEDS = …` and its doc comment, add the exported name to the existing `from './branchProtection.js'` import block, and substitute it at the three use sites in `BRANCH_PROTECTION_CHECK` (the `title` and the two `not checked` warnings). The rendered text is unchanged byte for byte, so no test expectation moves.
