### Task 4 — The round library refuses a record crediting tests to a non-test file, and names why a record is unreadable

**Goal:** `scripts/lib/gate-round-lib.sh` reads the per-file record as Task 3 now writes it:

- A row whose file is outside `GR_TEST_FILE_PATTERN` is **readable when it carries `0` tests and `0` failed**. That is a helper or fixture module `node --test` loaded with no test of its own.
- A row there that carries tests is an **attribution error** and makes the record unreadable.
- `gr_slowest` names the first check an unreadable record failed, so the next regression shows in every round's log instead of reading `(the record is unreadable)` with no cause.

**Depends on:** Task 3, whose reporter writes `file\tstatus\tseconds\ttests\tfailed` rows in which a module that loaded cleanly and opened no test reads `pass`, its seconds, `0`, `0`. **Where this task stops:**

- `scripts/run-gates.sh` does not change. `GR_TEST_FILE_PATTERN` stays `^test/[A-Za-z0-9._/-]+\.test\.mjs$`, and `gr_slowest` is still called once after the last unit.
- `gr_previous_focus_var`'s selection is unchanged. It picks `fail` rows only, and a `0`-test row is always `pass`, so a helper is never a focus file.
- The executable cases are **Task 6's** (`cli/test/gate-round-lib.test.mjs`). That task restates the exact lines below.

### Targets

- `scripts/lib/gate-round-lib.sh`

**Work:**

- [ ] **One check program, two answers.** Replace the body of `gr__tests_record_ok` with a new `gr__tests_record_reason <file>`. It prints nothing and returns 0 for a readable record. For an unreadable one, it prints one line naming the **first** failed check and returns 1. `gr__tests_record_ok` becomes `gr__tests_record_reason "$1" >/dev/null`. Keep one `awk` program, so the two cannot drift apart. The reasons, byte-exact, with `<n>` the 1-based line number in the file:
  - `not a readable file`
  - `no test-file pattern is set`
  - `first line is not the header`
  - `last line is not end`
  - `line <n>: not five tab-separated fields`
  - `line <n>: <file> is absolute, has a . or .. segment, or contains a space`
  - `line <n>: status <status> is neither pass nor fail`
  - `line <n>: seconds, tests or failed is not a number`
  - `line <n>: <file> is outside the test-file pattern but carries <tests> tests and <failed> failed`
- [ ] **The pattern check moves last in a row and gains its exemption.**
  - The checks within a row run in this order: field count, path shape (absolute, `.` / `..` segment, space), status, numbers, and only then the pattern.
  - A file outside `GR_TEST_FILE_PATTERN` passes when `tests` and `failed` are both `0`. Otherwise it fails with the last reason above.
  - Every other check is unchanged.
- [ ] **`gr_slowest` prints the reason.** Its unreadable line becomes `== slowest test files: no per-file record (the record is unreadable: <reason>) ==`. The absent-file line and the readable-record output, heading and rows, are byte-for-byte unchanged.
  - `gr_previous_focus_var` keeps calling `gr__tests_record_ok`, and its outcome for an unreadable record is unchanged: return 1, so the round runs in full.
- [ ] **The header, amended in the same edit:**
  - `CONFIGURATION` → `GR_TEST_FILE_PATTERN` becomes "an ERE every recorded file carrying a test must match; a row outside it is read only with `0` tests and `0` failed".
  - `THE RECORDS` gains one sentence: a row outside the pattern that carries tests is an attribution error, which makes the record unreadable, and `gr_slowest` names the failed check.
  - The `REPRO` block stays valid, and its `gr_slowest "$t/none.tsv" full` line still prints the no-record line.

**Verification:**

- `bash scripts/typecheck.sh` passes, including its shell-parse step under `/bin/bash` 3.2.
- `grep -nE '^[[:space:]]*(set|shopt) ' scripts/lib/gate-round-lib.sh` prints nothing. The library still sets no shell option.
- `grep -n 'the record is unreadable' scripts/lib/gate-round-lib.sh` shows the single `gr_slowest` line carrying `: %s`, or the equivalent that appends the reason, and no other unreadable wording.
- `grep -c 'awk -F' scripts/lib/gate-round-lib.sh` counts the same number of `awk` programs as before the edit. The reason function replaced the old check rather than adding a second copy of it.
- Task 6 executes the behaviour.
