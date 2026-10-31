### 1. The jq-floor suite's test title and rule sentence claim "parses on jq 1.5 and 1.6", more than the scanner checks

**File:** `cli/test/jq-floor.test.mjs` (the header block and the last `test(...)`) — "every shipped .jq program parses on jq 1.5 and 1.6"

The scanner checks two syntax classes only: a jq keyword used as a `$` variable, a `.` field or an object key, and an `if` with no `else`. It does not check builtins newer than 1.5, and it does not show that a program parses on any jq. The suite's own header says so further down (*"Not covered here … Builtins newer than jq 1.5"*), and so does `docs/development.md` → Gate 4 → **The suite under jq 1.6, by hand.** (*"… and nothing more"*).

Two places in the same file still state the wider claim:

- The header's first sentence: *"The rule this suite exists to enforce: every shipped `.jq` program parses on jq 1.5 and 1.6, so no jq keyword is …"*. This puts the conclusion first and the checked property after it, so the rule reads as a parse guarantee.
- The case title `'every shipped .jq program parses on jq 1.5 and 1.6'`. This is the line a Gate 4 run prints as `ok`, and the line a reader of the TAP output sees.

Someone who reads a green run (the pull request's `# pass` record, or a later branch that edits a `.jq` program) concludes that the floor was verified by parsing. That conclusion is wrong, and it is exactly the one the by-hand leg exists to prevent. `.claude/context/cli.md` → `## What "done" means here`: *"a header a review reads as a guarantee is worth exactly what the code under it still does."*

**Fix:** state the property the scanner checks, in both places. Change no logic.

1. Replace the header's first sentence:

   ```js
    * The rule this suite exists to enforce: every shipped `.jq` program parses on jq 1.5 and 1.6, so
    * no jq keyword is a `$` variable, a `.` field or an object key, and every `if` has an `else`.
   ```

   with:

   ```js
    * The rule this suite exists to enforce: no shipped `.jq` program uses the syntax jq 1.7 relaxed
    * and jq 1.5 and 1.6 reject — a jq keyword as a `$` variable, a `.` field or an object key, or an
    * `if` with no `else`. It reads the source; it does not show that a program parses on any jq.
   ```

2. Replace the case title:

   ```js
   test('every shipped .jq program parses on jq 1.5 and 1.6', () => {
   ```

   with:

   ```js
   test('no shipped .jq program uses the syntax jq 1.7 relaxed and jq 1.5/1.6 reject', () => {
   ```

`harness.config.json` → `treeGuards` names this file by path, not by title, so the registration needs no change. Verify with this file's own run, which is the only test this fix runs: `npm test --workspace cli -- test/jq-floor.test.mjs`.
