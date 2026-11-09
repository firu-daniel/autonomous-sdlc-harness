### Task 7 — Correct `docs/development.md` on the per-file record and the helper's row

**Goal:** Make `docs/development.md` §5 say what the per-file record now holds and what an unreadable record now prints. Clarify the measurement paragraph's helper entry without rewriting what it measured. These are the story index's `## Scope register` rows 1 and 2. Row 3 is `no-change`.

**Depends on:**

- **Task 2**: `cli/test/helpers/concurrency.mjs` holds only `CASE_CONCURRENCY` and `HARNESS_TEST_CONCURRENCY`, and every concurrent suite is `describe(name, { concurrency: CASE_CONCURRENCY }, fn)` in its own file.
- **Task 3**: a module that `node --test` loads as a test file but that opens no test of its own has a row with `tests` `0`.
- **Task 4**: a row outside the test-file pattern that carries tests makes the record unreadable, and the slowest-files line reads `== slowest test files: no per-file record (the record is unreadable: <reason>) ==`.

This task documents those three facts and changes no code.

**How this task's implementer reads the conventions.** This is the catch-all task, so read `.claude/context/conventions.md`, `.claude/context/cli.md` and `.claude/context/plugin.md`. `## Documents of record` binds the measurement paragraph: a measured fact keeps what was measured, the command and the result. The lessons ledger's `Evidence and measurement` rules bind as well, so **no wall-clock figure is added**. Neither this task nor any other task in this branch measured one outside a session.

### Targets

- `docs/development.md`

**Work:**

- [ ] **§5, the paragraph in bold that begins *"A round times every gate, records what failed and runs that first."*** (scope register row 1):
  - Where it says gate 4 writes its two records *"one row per test file"*, add that a module `node --test` loads only because it sits under `cli/test/`, such as a helper, has a row with no tests, and that each case is credited to the file that opens its suite.
  - Where it says *"An absent or unreadable previous record runs the round in full."*, add two points. A record that credits tests to a file outside the test-file pattern is unreadable. The slowest-files line names the first check an unreadable record failed.
  - Cite `scripts/lib/test-timing-reporter.mjs` (`THE RECORD`) for the row format. Do not restate the format.
- [ ] **§5, the measurement paragraph beginning *"The four it adds are …"*** (scope register row 2):
  - Leave the measured sentence as recorded.
  - After it, add one sentence saying that the count is `node --test`'s, not the per-file timing record's. Until this change, the record credited every suite opened through the helper to the helper's own path. Each suite is now opened with `describe` in its own file, and the helper's own row carries no tests.
  - Give no figure.

**Verification:**

- Re-run the scope register's command entry verbatim. Its hits are a subset of the register's rows, and nothing is reached outside them.
- `git grep -n concurrentSuite -- docs` prints nothing.
- `git diff -- docs/development.md` adds no digit-bearing duration (`[0-9]+(\.[0-9]+)? s\b`) and changes no word of the measured sentence in row 2.
