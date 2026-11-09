### Task 1 — Open the five doctor-family concurrent suites with `describe` in their own files

**Goal:** Each of these five test files opens its concurrent suite or suites itself, as `describe(name, { concurrency: CASE_CONCURRENCY }, fn)`, instead of through `concurrentSuite`. Node then credits every case in them to the file it is written in, not to `cli/test/helpers/concurrency.mjs`.

**Where this task stops.** It leaves `cli/test/helpers/concurrency.mjs` untouched. `concurrentSuite` stays exported until **Task 2** converts the last two callers (`init.test.mjs` and `stack-presets.test.mjs`) and removes it. No case is added, removed, renamed or re-indented, and no case's body changes.

### Targets

- `cli/test/doctor.test.mjs`
- `cli/test/doctor-main-anchor.test.mjs`
- `cli/test/doctor-job-surfaces.test.mjs`
- `cli/test/doctor-sandbox-prerequisites.test.mjs`
- `cli/test/doctor-profile-sandbox.test.mjs`

**Work:**

- [ ] `doctor.test.mjs`:
  - Change the `node:test` import to `import test, { describe } from 'node:test';` and the helper import to `import { CASE_CONCURRENCY } from './helpers/concurrency.mjs';`.
  - Replace `concurrentSuite('doctor', () => { // body deliberately not re-indented: …` with `describe('doctor', { concurrency: CASE_CONCURRENCY }, () => { // body deliberately not re-indented: …`. Keep the trailing comment byte-identical.
  - In the header's numbered choice that reads *"The cases sit in one `concurrentSuite` and run `CASE_CONCURRENCY` at a time (`test/helpers/concurrency.mjs`)"*, say instead that they sit in one `describe` opened in this file with `{ concurrency: CASE_CONCURRENCY }`. Add the reason in one clause: Node credits a suite to the file that calls `describe`, so a suite opened by a helper is timed against the helper.
  - The four existing `{ concurrency: CASE_CONCURRENCY }` top-level `test(…)` calls do not change.
- [ ] `doctor-main-anchor.test.mjs`: import `{ describe, it }` from `node:test` and `{ CASE_CONCURRENCY }` from the helper. Replace `concurrentSuite('doctor profile-main-anchor', () => {` with `describe('doctor profile-main-anchor', { concurrency: CASE_CONCURRENCY }, () => {`.
- [ ] `doctor-job-surfaces.test.mjs`: make the same import change, and replace `concurrentSuite('doctor --job-surfaces', () => {` with `describe('doctor --job-surfaces', { concurrency: CASE_CONCURRENCY }, () => {`.
- [ ] `doctor-sandbox-prerequisites.test.mjs`: make the same import change, and replace `concurrentSuite('doctor sandbox-prerequisites', () => {` with `describe('doctor sandbox-prerequisites', { concurrency: CASE_CONCURRENCY }, () => {`.
- [ ] `doctor-profile-sandbox.test.mjs`: make the same import change, and convert **both** suites, `'doctor profile-sandbox'` and `'doctor profile-write-protection'`, in the same way.
  - If a file's header names `concurrentSuite`, correct it as in the first bullet. The grep below lists any that remain.

**Verification:**

- `git grep -n concurrentSuite -- cli/test/doctor.test.mjs cli/test/doctor-main-anchor.test.mjs cli/test/doctor-job-surfaces.test.mjs cli/test/doctor-sandbox-prerequisites.test.mjs cli/test/doctor-profile-sandbox.test.mjs` prints nothing.
- `git grep -n -F "{ concurrency: CASE_CONCURRENCY }, () => {" -- cli/test/doctor.test.mjs cli/test/doctor-main-anchor.test.mjs cli/test/doctor-job-surfaces.test.mjs cli/test/doctor-sandbox-prerequisites.test.mjs cli/test/doctor-profile-sandbox.test.mjs` prints one `describe(` line for each suite this task converted, and none of those lines is missing.
- Run each of the five edited files, one at a time, through `npm test --workspace cli -- test/<name>.test.mjs`. Each passes with the same case count it reported before the edit.
- `git diff --stat` shows only the import lines, the suite-opening lines and the header sentences changed in each file. No case body moves.
