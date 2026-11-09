### Task 6 — Pin the zero-test row, the attribution refusal and the named reason in `cli/test/gate-round-lib.test.mjs`

**Goal:** Pin Task 4's three behaviours in the round library's own suite:

- A record row outside the test-file pattern with `0` tests is readable and never becomes a focus file.
- A row there that carries tests makes the record unreadable, and the round runs in full.
- `gr_slowest` names the first failed check on its unreadable line.

**Depends on:** Task 4. These are the exact contracts this task asserts:

- `gr_slowest`'s unreadable line is `== slowest test files: no per-file record (the record is unreadable: <reason>) ==`.
- The reason for a record without a closing `end` is `last line is not end`.
- The reason for a row outside `GR_TEST_FILE_PATTERN` that carries tests is `line <n>: <file> is outside the test-file pattern but carries <tests> tests and <failed> failed`, with `<n>` the 1-based line in the file.
- A row outside the pattern with `tests` and `failed` both `0` is readable.
- `gr_previous_focus_var` selects `fail` rows only, and an unreadable gate-4 record still makes it return 1.

`GR_TEST_FILE_PATTERN` in this suite's driver stays `^test/[A-Za-z0-9._/-]+\.test\.mjs$`, the value `scripts/run-gates.sh` sets.

### Targets

- `cli/test/gate-round-lib.test.mjs`

**Work:**

- [ ] **Move the existing expectation.** In `gr_slowest prints the ten slowest rows under its heading, or a no-record line`, the record written to `unreadable.tests.tsv` has no `end` line. Its expected line becomes `== slowest test files: no per-file record (the record is unreadable: last line is not end) ==\n`. Nothing else in that case changes.
- [ ] **The attribution refusal, shown in `gr_slowest`.** Add a case that writes a record whose second line is `test/helpers/concurrency.mjs\tpass\t12.0\t8\t0` beside a `test/a.test.mjs` row. Call `gr_slowest` on it with the driver's pattern. Assert the exact stdout `== slowest test files: no per-file record (the record is unreadable: line 2: test/helpers/concurrency.mjs is outside the test-file pattern but carries 8 tests and 0 failed) ==\n` and an empty stderr.
- [ ] **A zero-test row is readable.** In the same case or a sibling, write a record whose rows include `test/helpers/fixture.mjs\tpass\t1.2\t0\t0` and `test/fixtures/x.mjs\tpass\t0.4\t0\t0` beside `.test.mjs` rows. Assert that `gr_slowest` prints the heading and the rows, sorted as for any record, with the helper row shown `(0 tests, 0 failed)`.
- [ ] **The focused phase with each record.**
  - Add a case: the previous round failed `4` and `6a`, and its full tests record holds `['test/a.test.mjs', 'fail', '1.5', '3', '1']` and `['test/helpers/fixture.mjs', 'pass', '1.2', '0', '0']`. Assert that the round prints the file's existing `FOCUS_LINE`, which names only `test/a.test.mjs`, and that the calls begin `focused 4 test/a.test.mjs`.
  - Add one entry to the `an unreadable previous record gives the first-round outcome` table, named `4 FAIL with a tests record crediting tests to a non-test file`. Its record holds that `a` row plus `['test/helpers/concurrency.mjs', 'pass', '12.0', '8', '0']`. Assert the full-round outcome through `assertFullRound`.
- [ ] **The header.** Add to the suite's rule that a row outside the test-file pattern is read only with no tests, and that an unreadable record is named with its first failed check.

**Verification:**

- `npm test --workspace cli -- test/gate-round-lib.test.mjs` passes, including the moved expectation and each new case.
- Every new stdout assertion is a full `assert.equal` on the exact line or lines, not `includes`, except where the case's existing siblings use `includes` for the focus line.
