### Task 3 — The timing reporter counts Node's file-level entry for a module with no tests as no test

**Goal:** Make `scripts/lib/test-timing-reporter.mjs` tell a real top-level test from Node's **file-level entry**. That is the one nesting-0 event Node emits for a test file that reported no test of its own, such as a helper module that `node --test` loads because it sits under `test/`. A passing file-level entry adds its duration and **no test**, so the row reads `tests 0`. A failing one is a load failure and counts as one failed test, as today. Every file still gets exactly one row, and no reading is dropped.

**Where this task stops.** It writes the record and nothing else, as its header's `WHAT IT OWNS` already says. Refusing a record that credits tests to a non-test file belongs to **Task 4** (`scripts/lib/gate-round-lib.sh`). The real-run evidence that Node emits the entry in the shape below belongs to **Task 5** (`cli/test/test-timing-reporter.test.mjs`). This task edits no test file.

### Targets

- `scripts/lib/test-timing-reporter.mjs`

**Work:**

- [ ] **The key.** Inside the loop, after the existing `nesting` / `file` filter, add the test: an event is a file-level entry when `typeof data.name === 'string'` and `path.resolve(data.name) === path.resolve(data.file)`. Use `path.resolve` on both sides, because Node may give the name as the absolute path or as the path relative to the runner's working directory, and the reporter runs in that same directory. Use no other field: no `line` / `column` test and no name pattern.
- [ ] **The count.**
  - A file-level `test:pass` creates or updates the file's entry, adds its `duration_ms` to `ms` exactly as today, and leaves `tests` and `failed` unchanged.
  - A file-level `test:fail` is counted exactly as today: `tests += 1`, `failed += 1`, and the duration added.
  - Every other event is counted exactly as today.
  - The row format, the sort, the header line and `end` do not change. A row with `tests` `0` prints `0`.
- [ ] **The header, amended in the same edit** (`.claude/context/cli.md` → *"A reviewer holds a change to its module's own header"* applies to this file too):
  - `THE RECORD`: `tests` is "the top-level tests counted, `0` for a file that loaded cleanly and opened no test of its own". The rule line *"every test file the run reported appears exactly once"* stays as it is.
  - `WHAT COUNTS`: add the file-level entry, its key (`data.name` resolving to `data.file`), what a pass and a fail each add, and why. `node --test` loads every module under a `test/` directory as a test file, and Node's entry for a module with none is not a case. Add the accepted residual too: a real top-level test whose name is its own file's path would be read as a file-level entry.
  - `THE FLOOR`: add feature **6**, `data.name` on `test:pass` / `test:fail`. State what was read, in the same plain terms as features 3–5. The planning session did not probe it. `cli/test/test-timing-reporter.test.mjs`'s real-run case is the evidence on the Node that runs the suite. Add no "added in" version that was not read. State the degraded outcome: without `data.name`, a file-level entry counts as one test, as before this change, and the round library then refuses the record and names the row (Task 4).

**Verification:**

- `git diff` on the file shows the new key used for `test:pass` and `test:fail` alike, with only the `tests` / `failed` increments made conditional on it. `HEADER`, the sort expression and the row template are unchanged.
- `bash scripts/typecheck.sh` passes.
- Read the three amended header paragraphs against the code. `tests 0` appears in `THE RECORD`, the key in `WHAT COUNTS` matches the expression in the loop, and `THE FLOOR` claims no version it did not read. Task 5 executes the behaviour.
