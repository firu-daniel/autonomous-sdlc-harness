`fix_test_timing_attribution` makes gate 4's per-file timing record name the test file a case lives in. Today every case opened through `concurrentSuite` is credited to the helper that opens the suite, `cli/test/helpers/concurrency.mjs`, so the record, the run-analytics report and the focused gate-4 re-run all point at a helper module instead of the suite that is slow or failing.

Found on 2026-11-08 while reading `run-analytics.md` for the run of `fix_run_job_credential_exposure`. Its two gate rounds listed `test/helpers/concurrency.mjs` as the slowest test file, 1,257.2 s and 1,209.9 s with "9 tests". The suites behind that row appear with almost nothing in their own rows (`test/init.test.mjs`: 2.7 s, 1 test) or not at all.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** The figures below were read from that run's records at `f3f48e82`; re-take them against the tree you plan on before relying on them.

---

## What is there today

- **The reporter.** `scripts/lib/test-timing-reporter.mjs` writes `<label>.<phase>.tests.tsv`, one row per file. Its header, **WHAT COUNTS.**, keys every row on `data.file` of a nesting-0 `test:pass` / `test:fail` event. `cli/test/test-timing-reporter.test.mjs` tests it with synthetic events only.
- **Why the attribution is wrong.** `cli/test/helpers/concurrency.mjs` → `concurrentSuite(name, fn)` calls `describe(name, { concurrency: CASE_CONCURRENCY }, fn)` inside the helper. Node reports a test's `file` as the location of the `describe` / `test` call, so a suite opened through the helper is reported against the helper's own path. As of `f3f48e82` the callers were `doctor.test.mjs`, `doctor-main-anchor.test.mjs`, `doctor-job-surfaces.test.mjs`, `doctor-sandbox-prerequisites.test.mjs`, `doctor-profile-sandbox.test.mjs` (two suites), `init.test.mjs` and `stack-presets.test.mjs`, which matches the "9 tests" on the helper's row. Confirm this mechanism on the installed Node before designing on it; it is inferred from the record and the code, not from Node's documentation.
- **What reads the record.**
  - `scripts/run-gates.sh` prints the ten slowest files after the last unit (`gr_slowest` in `scripts/lib/gate-round-lib.sh`).
  - `scripts/run-analytics.sh` renders **Slowest test files** in `run-analytics.md`.
  - `scripts/lib/gate-round-lib.sh` picks the focused phase's gate-4 files from the `fail` rows of the previous round's record. A failing case inside a concurrent suite therefore names `test/helpers/concurrency.mjs` as the file to re-run. That path exists, so it is kept, and the focused gate 4 runs a module with no tests in it and passes. The fail-fast stop the focused phase exists for is lost, and the full phase finds the failure again. Verify this reading of the focused path before relying on it.
- **`docs/development.md`** already explains that `node --test` counts the helper as a test file with no tests in it. That holds for the helper loaded on its own; it is not what the record shows.

## The goal

1. **Every row of the record names the test file its cases are written in.** No case is credited to a module under `cli/test/helpers/`. The record's contract in the reporter's header (`THE RECORD`) stays as it is unless the design needs a change, and if it does, every reader named above changes with it.
2. **The focused phase re-runs the right file.** A failing case in a concurrent suite makes the next round's focused gate 4 run the suite's own file.
3. **Tests pin it.** At least one test drives a real `node --test` run of a small fixture suite opened through `concurrentSuite` (or whatever replaces it) and asserts the row lands on the fixture's file, not the helper's. Synthetic events alone do not cover this, because the defect is in what Node reports.
4. **Docs.** Correct whatever `docs/development.md` and the reporter's and helper's headers say about the helper's row.

## Suggestions for the plan to weigh (not requirements)

The plan picks the design; these are starting points, not constraints.

- **Make `concurrentSuite` report its caller.** For example, the helper could take the caller's file (`import.meta.filename` passed in, or read from a stack frame) and open the suite so Node attributes it there. Alternatively each caller could call `describe(name, { concurrency: CASE_CONCURRENCY }, fn)` itself and keep only the bound in the helper, which removes the indirection entirely.
- **Attribute in the reporter instead.** If Node exposes another field that carries the test file (for example the test's location, or the file the runner was executing when the event fired), key the row on that, and fall back to `data.file` when it is absent. This keeps the helper unchanged but depends on what Node 20.11+ actually emits (the reporter's **THE FLOOR** section lists what was verified, and how little of it was).
- **Refuse helper paths.** A cheap guard either way: the reporter, or `gr__tests_record_ok`, treats a row under `test/helpers/` with tests in it as an attribution error that it reports, rather than silently keeping it.

## Out of scope

- Making the suite faster. This branch only makes the record show correctly where time goes.
- Changing `HARNESS_TEST_CONCURRENCY` or the case concurrency bound.

## Constraints

- `scripts/run-gates.sh` must pass.
