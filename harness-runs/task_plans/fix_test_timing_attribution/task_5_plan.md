### Task 5 — Pin attribution with a real `node --test` run in `cli/test/test-timing-reporter.test.mjs`

**Goal:** Drive a real `node --test` run of a small fixture with the reporter beside `tap`, and assert that a suite opened the way this repository now opens one lands on its own file. A suite opened by a helper is the control, and its row lands on the helper. A helper loaded as a test file with no test of its own reads `tests 0`. Synthetic events cannot cover this, because the defect is in what Node reports (task prompt → `## The goal`, item 3).

**Depends on:**

- **Task 2**, after which `cli/test/helpers/concurrency.mjs` exports `CASE_CONCURRENCY` and `CONCURRENCY_VARIABLE`, imports nothing from `node:test`, and has no `concurrentSuite`. A concurrent suite is `describe(name, { concurrency: CASE_CONCURRENCY }, fn)` in the test file itself.
- **Task 3**, after which the reporter treats a nesting-0 event whose `path.resolve(data.name) === path.resolve(data.file)` as Node's file-level entry. On `test:pass` it adds the duration and no test. On `test:fail` it adds one test and one failure.

This task edits only the test file. If the real run shows Node emitting the file-level entry in another shape, this task's case fails and the cause is Task 3's key. Do not weaken the assertion to make it pass.

### Targets

- `cli/test/test-timing-reporter.test.mjs`

**Work:**

- [ ] **The fixture.** Add a real-run case beside the existing one, built the same way: `mkdtemp` under `os.tmpdir()`, removed in `t.after`, with the child spawned through the file's own `execResult` and `childEnv()`. Write these files:
  - `test/direct.test.mjs`. It imports `describe` and `it` from `node:test`, `assert` from `node:assert/strict`, and `CASE_CONCURRENCY` from the **real** helper, by the file URL of `cli/test/helpers/concurrency.mjs` that this suite computes, for example with `new URL('./helpers/concurrency.mjs', import.meta.url).href` interpolated into the fixture source. It opens `describe('direct', { concurrency: CASE_CONCURRENCY }, () => { it('passes', () => {}); it('fails', () => { assert.equal(1, 2); }); })`.
  - `test/helpers/opener.mjs`, the **control**, which is the shape this branch removed: `import { describe } from 'node:test'; export function openSuite(name, fn) { return describe(name, { concurrency: 2 }, fn); }`.
  - `test/via-helper.test.mjs`, which imports `it` and `openSuite` from `./helpers/opener.mjs` and calls `openSuite('via helper', () => { it('passes', () => {}); })`.
  - `test/helpers/inert.mjs`, containing only `export const VALUE = 1;`.
- [ ] **The run.** Use `process.execPath` with `--test`, `--test-reporter=tap`, `--test-reporter-destination=stdout`, `--test-reporter=<REPORTER>` and `--test-reporter-destination=<record>`. Then name all four files explicitly: the two `.test.mjs` files, then `test/helpers/opener.mjs` and `test/helpers/inert.mjs`. Naming the helpers makes them load as test files, which is what `node --test` with no path argument does for every module under `test/`. Set `cwd` to the fixture directory.
- [ ] **The assertions.**
  - The run exits non-zero, because of `direct`'s failing case.
  - The record keeps its header and its `end` line.
  - It holds exactly three rows:
    - `test/direct.test.mjs` with status `fail`, `tests` `1` and `failed` `1`. The suite is one top-level test and its cases are nested.
    - `test/helpers/opener.mjs` with `pass`, `1` and `0`. This is the control: Node credits the suite to the module that calls `describe`, and the helper's own file-level entry adds no test.
    - `test/helpers/inert.mjs` with `pass`, `0` and `0`.
  - No row names `test/via-helper.test.mjs`.
  - Every `seconds` field matches the file's `SECONDS` pattern.
  - Each assertion carries the record text as its message, as the existing real-run case does.
- [ ] **The synthetic stand-in carries the new field.** The file's `event()` helper sets `name` on every event it builds. The default is a case-like name such as `'a case'`, never the file's path, so that every existing synthetic case keeps its meaning (ledger: *"When a check moves to reading a field one producer writes, the same change makes every path that stands in for that producer … write the field too"*). Add one synthetic case: a file-level `test:pass` whose `name` is the event's absolute `file`, and one whose `name` is the relative `test/…` form, give rows with `tests` `0`. A file-level `test:fail` gives `1` test and `1` failed.
- [ ] **The header.** Restate the suite's rule so that it includes `tests 0` for a file that loaded with no test of its own. Add that the second real run pins attribution: a suite lands on the file whose code calls `describe`, with a helper-opened suite as the control. Under `Deliberately not covered`, keep the older-Node sentence and extend it to `data.name`.

**Verification:**

- `npm test --workspace cli -- test/test-timing-reporter.test.mjs` passes, with the new real-run case and the new synthetic case reported among its tests.
- The control row `test/helpers/opener.mjs … 1 0` and the `test/direct.test.mjs … fail … 1 1` row are each asserted by exact field values, not by a substring of the record.
