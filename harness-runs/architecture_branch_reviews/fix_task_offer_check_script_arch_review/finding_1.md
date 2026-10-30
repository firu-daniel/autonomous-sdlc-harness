### 1. `doctor` re-derives the generator's `permissions.allow` grading instead of asking it

**Severity:** Must Fix

**Sites:**
- `cli/src/doctor/checks.ts` → `taskOfferCheckFindings`: the block from `const permissions = isJsonObject(settings) ? settings[PERMISSIONS_KEY] : undefined;` through its three `findings.push(...)` arms. Also the helper `mergeReaches` (`/** Whether \`init\`'s missing-keys merge can add a key under \`value\` ... */`).
- `cli/src/generators/projectSettings.ts` → `existingAllowListWarning`, the one existing owner of the same classification.

**Problem.** The branch adds the fence's allow rule to `.claude/settings.json` → `permissions.allow` and grades it in two places, with two independent bodies:

- `projectSettings.ts` → `existingAllowListWarning` classifies an existing settings value five ways:
  - `permissions` is absent: the merge adds the rule.
  - `permissions` is not an object.
  - `allow` is absent: the merge adds the rule.
  - `allow` is not a list.
  - `allow` is a list without the rule.
- `doctor/checks.ts` → `taskOfferCheckFindings` makes the same classification again with its own code:
  - `Array.isArray(allow)` plus `stringsAt(allow).includes(rule)`.
  - `allow === undefined && mergeReaches(settings) && mergeReaches(permissions)`.
  - An `else` arm for "not a list or sits under a value that is not an object".

  `mergeReaches` is also a private restatement of `core/json.ts` → `mergeMissing`'s reach (*"it is absent or an object"*). Nothing ties it to that function.

The two bodies already differ in small ways. The generator uses `allow.includes(rule)`, while doctor uses `stringsAt(allow).includes(rule)`. Doctor also re-tests whether the top-level settings value is an object, which the generator does not. A later change to the merge contract or to the rule's shape would have to find both copies, and no compile error or test ties them together.

This breaks the cli layer's rule `.claude/context/cli.md` → `## How a module in this layer is written` → **`doctor` asks, grades and repairs nothing**: *"nothing it reports is re-derived from a second copy — the backend, the state-directory list, the ignore-rule spellings, the registry reader and the writability probe are all imported from the module that owns each"*. It also breaks the cross-layer monopoly rule `.claude/context/conventions.md` → `### Where a new responsibility goes`: *"A responsibility that already has a home does not get a second one"*, and *"Before adding a copy of anything, grep for it"*.

The settings generator's own header records the precedent for this exact pair of modules. `cli/src/generators/projectSettings.ts` → the header's marketplace paragraph says *"`doctor` no longer holds a copy: {@link marketplaceEntryDefect} is what it asks, so the next correction here reaches it."* The new key repeats the defect that paragraph records as fixed.

No justification for the second copy is declared at either site. The doctor comment explains why the rule is graded in `task-offer-rules` rather than `plugin-wiring`. That comment is about which check grades the rule, not about why the grading is duplicated.

**Fix.**
1. In `cli/src/generators/projectSettings.ts`, add one exported classifier beside `marketplaceEntryDefect`. It owns the whole classification, including the merge-reach question. For example:
   ```ts
   export type AllowRuleState =
     | 'present'              // permissions.allow is a list holding the rule
     | 'mergeable'            // settings / permissions / allow absent or objects the merge can descend into: init adds the rule
     | 'list-without-rule'    // permissions.allow is a list lacking the rule: init never edits it
     | 'allow-not-a-list'     // permissions.allow is present and not a list
     | 'permissions-not-object'; // permissions (or the top-level value) is present and not an object
   export function allowRuleState(settings: JsonValue | undefined, rule: string): AllowRuleState
   ```
   Decide the merge-reach arms the way `core/json.ts` → `mergeMissing` decides them (absent or `isJsonObject`), and state that in the function's doc comment. Pick one membership test (string elements only, as `stringsAt` does) and use only that one.
2. Re-express `existingAllowListWarning` as a mapping from `allowRuleState(...)` to its warning text. `present` and `mergeable` map to `undefined`, and each other state keeps its current sentence.
3. In `cli/src/doctor/checks.ts` → `taskOfferCheckFindings`, import `allowRuleState` and replace the inline `permissions` / `allow` descent and the three arms with a `switch` over its result. Keep the existing per-state remedy sentences as they are, with `mergeable` giving the "run `init`, which merges one in" remedy. Delete `mergeReaches`. Drop the `ALLOW_KEY` / `PERMISSIONS_KEY` imports if the remedy text no longer needs them. Keep the `readJsonFile` try/catch in doctor: the parse failure is a doctor-side condition and is not part of the classification.
4. Amend the `projectSettings.ts` header's new `## A third, independent key` paragraph with one sentence: `doctor` asks `allowRuleState` and holds no copy, mirroring the marketplace paragraph. Add a matching sentence to the `task-offer-rules` doc comment in `checks.ts`. This satisfies `.claude/context/cli.md` → `## What "done" means here` → *"A reviewer holds a change to its module's own header."*
5. The existing doctor and allow-rule suites (`cli/test/doctor.test.mjs`, `cli/test/task-offer-allow-rule.test.mjs`) already cover each state's observable message. The fix changes no message text, so no new test is required. If a state's wording changes, update the assertion that quotes it in the same suite.
