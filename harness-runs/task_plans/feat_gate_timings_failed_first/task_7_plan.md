### Task 7 — Add the per-file timing reporter `scripts/lib/test-timing-reporter.mjs`

**Goal:** A custom `node:test` reporter module that, given to `--test-reporter` beside the stdout reporter, writes one tab-separated record of every test file's duration and result for the run — the record each Run gates round leaves next to its log, and that the next round reads to know which test files failed.

**Where this file stops.** It writes the record and nothing else: it prints nothing to stdout (the `tap` reporter beside it does that), decides nothing about rounds, and knows no lane path — its destination is whatever `--test-reporter-destination` names. `scripts/run-gates.sh` (Task 9) passes it and its destination; `scripts/lib/gate-round-lib.sh` (Task 8) reads the record and prints the slowest ten; `cli/test/test-timing-reporter.test.mjs` (Task 10) tests it. Its output format is the contract those three share, stated below and in the story index's `## Context`.

### Targets

- `scripts/lib/test-timing-reporter.mjs` (new).

**Work:**

- [ ] **The module.** A default-exported async generator `(source)`, as `node:test` custom reporters are, with a header comment stating what it owns and *"The rule this module exists to enforce"*: every test file the run reported appears exactly once, with no absolute path. For each event whose `type` is `test:pass` or `test:fail`, whose `data.nesting === 0` and whose `data.file` is a string: add `data.details.duration_ms` (treating a missing value as 0) to that file's sum, count it in `tests`, and on `test:fail` count it in `failed`. Ignore every other event, and every event with no `data.file`. Count a file-level failure Node reports at nesting 0 for a file that failed to load the same way.
- [ ] **The output, yielded once at the end of the stream.** First line `file\tstatus\tseconds\ttests\tfailed`; then one row per file, sorted by `seconds` descending then by `file` ascending: `file` is `path.relative(process.cwd(), data.file)` with `/` separators (`test/<name>.test.mjs` when run by `npm run test --workspace cli`), `status` is `fail` when `failed > 0` else `pass`, `seconds` is the sum divided by 1000 with exactly one decimal; last line `end`. Never write an absolute path: a file whose relative form is still absolute is left out — it cannot arise here, and the reader would refuse the record. Every row is kept; truncation is the reader's display (the lessons ledger, *"truncation belongs to a display, never to the record"*).
- [ ] **The floor.** The header records, for each feature used — a custom reporter module passed to `--test-reporter`, `--test-reporter` / `--test-reporter-destination` given more than once, and the `test:pass` / `test:fail` fields `data.file`, `data.nesting` and `data.details.duration_ms` — the Node version that added it and where that was read (Node's own documentation history for `node:test`, corroborated by the `TestPass` / `TestFail` declarations of the installed `@types/node`), checked against `cli/package.json` → `engines` (`>=20.11.0`). Where a field cannot be shown present at 20.11, say so in the header and keep the degraded outcome: an event without `data.file` contributes no row, and the reader then finds no failing file and runs the round in full. Use only `node:` builtins.

**Verification:**

- `grep -nE "from '[^n.]" scripts/lib/test-timing-reporter.mjs` prints nothing: every import is a `node:` builtin.
- `grep -n 'process.cwd' scripts/lib/test-timing-reporter.mjs` shows the one relative-path computation, and no line writes `data.file` unrelativized.
- The header names the version evidence for each of the five features listed above.
- `bash scripts/typecheck.sh` passes (the module is outside `tsc`'s include; this is the whole-tree check every unit runs). The module's behaviour is executed by Task 10's suite.
