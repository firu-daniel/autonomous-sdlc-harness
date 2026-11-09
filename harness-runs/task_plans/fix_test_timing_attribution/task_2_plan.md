### Task 2 — Open the `init` and `stack presets` suites in their own files, and reduce `cli/test/helpers/concurrency.mjs` to the bound

**Goal:** Convert the last two callers of `concurrentSuite` to `describe(name, { concurrency: CASE_CONCURRENCY }, fn)` in their own files. Then remove `concurrentSuite` from the helper, so no module under `cli/test/helpers/` opens a suite. The helper keeps exactly the bound and the switch that turns it off.

**Depends on:** Task 1, which converts the five doctor-family files to the idiom this task finishes: `import { describe } from 'node:test'`, `import { CASE_CONCURRENCY } from './helpers/concurrency.mjs'`, and `describe(<same name>, { concurrency: CASE_CONCURRENCY }, () => { … })`. After this task, no file imports `concurrentSuite`. Task 5 imports `CASE_CONCURRENCY` from this helper into a fixture suite and relies on the helper importing nothing from `node:test`. Task 3, not this task, makes the helper's own file-level row read `tests 0`.

### Targets

- `cli/test/init.test.mjs`
- `cli/test/stack-presets.test.mjs`
- `cli/test/helpers/concurrency.mjs`

**Work:**

- [ ] `init.test.mjs`:
  - Change the `node:test` import to `import test, { describe } from 'node:test';` and the helper import to `import { CASE_CONCURRENCY } from './helpers/concurrency.mjs';`.
  - Replace `concurrentSuite('init', () => { // body deliberately not re-indented: …` with `describe('init', { concurrency: CASE_CONCURRENCY }, () => { // body deliberately not re-indented: …`. Keep the comment byte-identical.
  - Correct the header's sentence *"they sit in one `concurrentSuite` and run `CASE_CONCURRENCY` at a time (`test/helpers/concurrency.mjs`)"* to name the `describe` opened in this file with `{ concurrency: CASE_CONCURRENCY }`. Keep its `HARNESS_TEST_CONCURRENCY=1` clause.
- [ ] `stack-presets.test.mjs`: make the same import change, keeping `CASE_CONCURRENCY`, which its two top-level `test(…)` calls already use.
  - Replace `concurrentSuite('stack presets', () => { // body …` with `describe('stack presets', { concurrency: CASE_CONCURRENCY }, () => { // body …`.
  - Correct the header's *"The cases sit in one `concurrentSuite`"* sentence in the same way.
- [ ] `helpers/concurrency.mjs`: delete `concurrentSuite` and the `import { describe } from 'node:test';` line. Keep `CONCURRENCY_VARIABLE`, `caseConcurrency()` and `CASE_CONCURRENCY` unchanged in value and behaviour (task prompt → `## Out of scope`). Rewrite the header:
  - The rule this module exists to enforce stays *one file-wide bound on concurrent cases, and one way to turn it off*.
  - Replace the *"A suite opened with {@link concurrentSuite}"* sentence. A concurrent suite is `describe(name, { concurrency: CASE_CONCURRENCY }, fn)`, written **in the test file itself**.
  - Add a second numbered choice: **this module opens no suite and no test**. Node credits a case to the file whose code calls `describe` / `test` / `it`, and the per-file timing record (`scripts/lib/test-timing-reporter.mjs`) keys its rows on that location. A wrapper here once credited every concurrent suite to this file.
  - The paragraph saying `node --test` loads this module as a test file of its own stays. Add that the record shows this module as a row with `0` tests.

**Verification:**

- `git grep -n concurrentSuite -- cli scripts docs` prints nothing.
- `git grep -n "from 'node:test'" -- cli/test/helpers/` prints nothing. The JSDoc `import('node:test')` type references in `run-copy-layouts.mjs` and `watcher.mjs` do not match this pattern.
- `git grep -n -F "{ concurrency: CASE_CONCURRENCY }, () => {" -- cli/test/init.test.mjs cli/test/stack-presets.test.mjs` prints the two converted `describe(` lines.
- Run `npm test --workspace cli -- test/init.test.mjs` and `npm test --workspace cli -- test/stack-presets.test.mjs`. Each passes with the case count it reported before the edit. Then run `npm test --workspace cli -- test/helpers/concurrency.mjs`, which loads the edited helper as a test file. It passes with no test of its own, and the import-time refusal of a bad `HARNESS_TEST_CONCURRENCY` value is unchanged.
