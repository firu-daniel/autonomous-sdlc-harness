# Story: Gate 4's per-file timing record names the file a case is written in

## Context

Gate 4's per-file timing record (`<label>.<phase>.tests.tsv`, written by `scripts/lib/test-timing-reporter.mjs`) is meant to show where the suite's time goes and which file failed. Today it credits every suite opened through `cli/test/helpers/concurrency.mjs` → `concurrentSuite` to that helper. Node reports a case's `data.file` as the place the `describe` / `test` call sits. The helper makes the call, so its own path is reported.

**What the record does today, read off the code and the committed records rather than assumed.** The task prompt's reading of the focused path does not hold, and the plan is built on what does. `scripts/run-gates.sh` sets `GR_TEST_FILE_PATTERN='^test/[A-Za-z0-9._/-]+\.test\.mjs$'`. `scripts/lib/gate-round-lib.sh` → `gr__tests_record_ok` refuses a whole record when any row's file falls outside that pattern (`if (f[1] !~ pat …) exit 1`). Every gate-4 record has such rows. `node --test` with no path argument (`cli/package.json` → `scripts.test`) loads every module under `cli/test/`. Node then reports each module that opens no test of its own as one file-level entry at nesting 0. Each of the three full-phase records in `harness-runs/run_analytics/fix_run_job_credential_exposure/run-analytics.json` therefore carries nine non-`.test.mjs` rows: the eight `test/helpers/*.mjs` modules and `test/fixtures/docs-index-pg-textsearch-1.3.1.mjs`. Each shows `tests 1`, except `test/helpers/concurrency.mjs`, which shows `9`: eight suites plus its own entry. This has two consequences:

- `gr_slowest` prints `== slowest test files: no per-file record (the record is unreadable) ==` on every round, with no reason given.
- `gr_previous_focus_var` returns 1 whenever gate 4 failed in the previous round, so the focused phase does not run at all. The round never re-runs `test/helpers/concurrency.mjs`, as the prompt guessed. It loses the fail-fast stop for every gate-4 failure, not only for failures in concurrent suites.

`scripts/run-analytics.sh` does not check the test-file pattern, which is why its `#### Slowest test files` tables showed the helper row.

**The design.** It has three parts, and each is needed for goals 1 and 2:

1. **Suites are opened in their own files.** Every caller writes `describe(name, { concurrency: CASE_CONCURRENCY }, fn)` itself. That is already the idiom `doctor.test.mjs` and `stack-presets.test.mjs` use for their top-level `test(…, { concurrency: CASE_CONCURRENCY }, …)` cases. The helper keeps only the bound and opens nothing (Tasks 1–2). Node then credits each suite to its own file.
2. **A file-level entry counts no test.** The reporter recognises Node's file-level entry for a module that opened no test: a nesting-0 event whose `data.name`, resolved against the working directory, is the same path as `data.file`. On `test:pass` it adds the entry's duration and **no test**, so a helper's row reads `tests 0`. A file-level `test:fail` is a load failure and still counts one failed test (Task 3). Every reading stays in the record. Nothing is dropped, which follows the ledger rule *"truncation belongs to a display, never to the record"*.
3. **A record that credits tests to a non-test file is refused, and the refusal says why.** The round library accepts a row outside `GR_TEST_FILE_PATTERN` only when it carries `0` tests and `0` failed. A row there carrying tests is an attribution error. The record is refused, and `gr_slowest` names the first failed check on its unreadable line (Task 4). This is the prompt's "refuse helper paths" guard. It costs no new configuration key, and it makes the next regression visible in every round's log.

**The record's contract after this branch** (`scripts/lib/test-timing-reporter.mjs` → `THE RECORD`): the header line, the sort and `end` are unchanged. A row still appears for every file the run reported. `tests` still counts top-level tests, but a file that loaded cleanly and opened none now reads `tests 0`. None of the readers needs a code change for the new value. `gr_previous_focus_var` selects only `fail` rows, and a `tests 0` row is always `pass`. `scripts/lib/run-analytics.jq` already accepts any digits. `scripts/lib/gate-round-lib.sh` changes only for part 3.

**Ship order, and why the catch-all tasks are not last.** Tasks 1–2 (`cli`) move the suites. Tasks 3–4 (`general`) change the reporter and the round library under `scripts/lib/`. Tasks 5–6 (`cli`) pin those two in `cli/test/`. Task 7 (`general`) corrects `docs/development.md`. The two test tasks depend on the `scripts/lib/` code they pin, and no task may depend on a later one. That rule is why a `general` task sits before a `cli` task here. `feat_gate_timings_failed_first` shipped its reporter, its round library and their suites in the same order. Between Task 4 and Task 6, the existing `gr_slowest` case in `cli/test/gate-round-lib.test.mjs` still expects the old unreadable line, and Task 6 moves it. No Run gates round falls between them.

**Not in scope** (task prompt → `## Out of scope`): making the suite faster, and changing `HARNESS_TEST_CONCURRENCY` or the case concurrency bound. `CASE_CONCURRENCY` and `CONCURRENCY_VARIABLE` keep their values and their owner, `cli/test/helpers/concurrency.mjs`. The shipped `run-analytics.sh` and its two `.jq` programs, in both `scripts/` and `cli/templates/scripts/`, are not touched: they accept the new record already, and they know no test-file pattern.

**Top risks:**

- **The file-level entry's shape is inferred, not probed.** That `data.name` resolves to `data.file` on that entry is read from Node's test runner (`FileTest`, which reports itself only when no child test reported). The probe could not be run in the planning session. Task 5's real `node --test` run pins it on the Node that runs the suite, with a helper loaded as a test file and an inert module beside it. A different shape fails that case rather than passing silently.
- **A converted suite loses its concurrency or a case.** Tasks 1 and 2 carry the options object verbatim. Each runs the files it edited. Task 2's closing grep checks that no `concurrentSuite` survives anywhere under `cli/`, `scripts/` or `docs/`.
- **Another non-test row carrying tests keeps every record unreadable.** Task 4's reason line names that row in the round's own log. Task 6 pins the line for the helper case and for a readable `tests 0` row.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, or the orchestrator itself in the supervised flow, which dispatches none. An implementer never changes a marker here, and never edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else, such as sub-step bullets inside per-task files, are informational only. They are never the iteration source, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_test_timing_attribution/task_<K>_plan.md`.

1. [x] **Task 1** — Open the five doctor-family concurrent suites with `describe` in their own files _(layer: cli)_ _(points: 10)_
2. [x] **Task 2** — Open the `init` and `stack presets` suites in their own files, and reduce `cli/test/helpers/concurrency.mjs` to the bound _(layer: cli)_ _(points: 10)_
3. [x] **Task 3** — The timing reporter counts Node's file-level entry for a module with no tests as no test _(layer: general)_ _(points: 10)_
4. [ ] **Task 4** — The round library refuses a record crediting tests to a non-test file, and names why a record is unreadable _(layer: general)_ _(points: 15)_
5. [ ] **Task 5** — Pin attribution with a real `node --test` run in `cli/test/test-timing-reporter.test.mjs` _(layer: cli)_ _(points: 15)_
6. [ ] **Task 6** — Pin the zero-test row, the attribution refusal and the named reason in `cli/test/gate-round-lib.test.mjs` _(layer: cli)_ _(points: 15)_
7. [ ] **Task 7** — Correct `docs/development.md` on the per-file record and the helper's row _(layer: general)_ _(points: 8)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Correct whatever `docs/development.md` and the reporter's and helper's headers say about the helper's row."*

The reporter's and the helper's headers are source comments and are owned by Tasks 3 and 2, so the register covers only the durable corpus text. That is `docs/` and the root prose, the plugin corpus, the adopter-facing templates and this repository's standing run-artifact READMEs.

**Derivation entry — corpus files (command).** Re-run it verbatim from the checkout root:

```
git grep -n -E 'concurrentSuite|helpers/concurrency\.mjs|one row per test file|test file with no tests|record is unreadable|unreadable previous record' -- docs README.md ARCHITECTURE.md plugin cli/templates harness-runs/test_run_logs/README.md harness-runs/run_analytics/README.md
```

**Derivation entry — standing-artifact rows (procedure).**

- **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`.
- **Artifact:** the lessons ledger.
- **Traversal:** its topic headings in file order, then the one-line rules under each heading.
- **Decision rule:** a rule is reached when it names the per-file test record, the timing reporter, the gate-round library or the concurrency helper.

When this plan was written, the walk reached no rule. The ledger's `Evidence and measurement` rules constrain Tasks 3 and 7, but none of them names one of these four, so none is a site.

**Closure invariant:** every site either entry reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/development.md` → §5 **A round times every gate, records what failed and runs that first.** ("gate 4 writes `<label>.focused.tests.tsv` and `<label>.full.tests.tsv`, one row per test file"; "An absent or unreadable previous record runs the round in full.") | — | command, `one row per test file` / `unreadable previous record` | `change` | Task 7 |
| 2 | `docs/development.md` → §5, the measurement paragraph ("one entry for the new helper `helpers/concurrency.mjs`, which `node --test` counts as a test file with no tests in it") | — | command, `helpers/concurrency\.mjs` / `test file with no tests` | `change` | Task 7. The measured statement stays as it was recorded, and a clarifying sentence is added after it |
| 3 | `docs/development.md` → §5 **Where the time goes.** ("run their cases concurrently under one bound (`cli/test/helpers/concurrency.mjs`)") | — | command, `helpers/concurrency\.mjs` | `no-change` | Still true after this branch: the bound and its switch stay in that helper, and only the suite-opening wrapper goes |
