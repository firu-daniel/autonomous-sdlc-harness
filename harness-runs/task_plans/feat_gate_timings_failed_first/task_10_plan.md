### Task 10 — Test the per-file timing reporter in `cli/test/test-timing-reporter.test.mjs`

**Goal:** A suite that pins the record the reporter writes, both from a real `node --test` run in a throwaway directory and from a synthetic event stream: one row per test file, its status, its top-level test count and failure count, durations summed, sorted slowest first, relative paths only, the closing `end` line, and the stdout reporter's output left intact beside it.

**Depends on:** Task 7, `scripts/lib/test-timing-reporter.mjs` — a default-exported async generator `(source)` for `--test-reporter`, which yields once at the end: the header `file\tstatus\tseconds\ttests\tfailed`, one row per file seen in a nesting-0 `test:pass` / `test:fail` event carrying `data.file` (`file` = `path.relative(process.cwd(), data.file)` with `/` separators; `status` `fail` when any such event failed, else `pass`; `seconds` = summed `data.details.duration_ms` / 1000 with one decimal; `tests` and `failed` counts), sorted by `seconds` descending then `file` ascending, and the last line `end`; events with no `data.file`, or with `nesting > 0`, contribute nothing. This task tests that contract and changes no script.

### Targets

- `cli/test/test-timing-reporter.test.mjs` (new).

**Work:**

- [ ] **Header.** Open with the rule this suite enforces — every reported file appears once, with its result and summed top-level duration, under a relative path, and the record ends `end` — and name what it does not cover: the per-version presence of `data.file` below the Node running the suite (stated in the reporter's own header), and the module's use inside `scripts/run-gates.sh`, which only a Run gates round runs. Reach the module as `join(WORKSPACE_ROOT, 'scripts', 'lib', 'test-timing-reporter.mjs')` (`cli/test/helpers/fixture.mjs` → `WORKSPACE_ROOT`), as `cli/test/check-machine-paths.test.mjs` reaches its script.
- [ ] **A real run.** In a directory under `os.tmpdir()` removed in process, write `test/alpha.test.mjs` (two passing top-level tests, one of them with a nested `t.test`) and `test/beta.test.mjs` (one passing and one failing top-level test). Spawn `process.execPath` with `--test --test-reporter=tap --test-reporter-destination=stdout --test-reporter=<absolute module path> --test-reporter-destination=<dir>/record.tsv test/alpha.test.mjs test/beta.test.mjs`, cwd that directory, and an environment **without `NODE_TEST_CONTEXT`** (the outer runner sets it, and a child that inherits it reports to its parent instead of running its own reporters). Assert: exit non-zero; stdout carries a `not ok` line (the `tap` reporter is intact); the record's first line is the header, its last line is `end`, it holds exactly one row for `test/alpha.test.mjs` (`pass`, `2` tests, `0` failed) and one for `test/beta.test.mjs` (`fail`, `2`, `1`), each `seconds` matches `^[0-9]+\.[0-9]$`, and the record contains neither the temporary directory's path nor any `/`-leading field.
- [ ] **A synthetic stream.** Import the module and drive it with an async iterable of hand-built events: rows sort by `seconds` descending with a tie broken by `file`; an event with no `data.file` and an event at `nesting: 1` add nothing; a missing `duration_ms` counts as 0; an empty stream yields the header then `end`.

**Verification:**

- `npm test --workspace cli -- test/test-timing-reporter.test.mjs` passes, run from the repository root as one plain foreground command.
- Each assertion fails against a deliberately broken scratch copy of the reporter (rows not sorted, nesting not filtered, absolute path written) — checked on a copy under the scratch directory, never by editing `scripts/lib/test-timing-reporter.mjs`, and recorded in the return.
- The suite builds nothing inside this checkout: `git status --short` after the run lists only the new test file.
