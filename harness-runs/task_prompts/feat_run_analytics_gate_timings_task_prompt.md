`feat_run_analytics_gate_timings` adds each Run gates round's gate durations and test-file durations to the run's committed analytics, `run-analytics.json` and `run-analytics.md`, so every run on `dev` keeps a record of which gates and test files took longest. The final goal (not this branch's) is to make this repository's gates and tests complete faster, and to choose what to optimise from measured history rather than from one round read by hand.

## Why

- Each Run gates round writes two timing records under `harness-runs/test_run_logs/<branch>/`: `<label>.gates.tsv`, the seconds each gate took (`scripts/lib/gate-round-lib.sh`), and `<label>.<phase>.tests.tsv`, the seconds each test file took, slowest first (`scripts/lib/test-timing-reporter.mjs`). Both are gitignored with the rest of that directory, so they are lost when the run copy is cleaned up after merge. Today no timing record exists anywhere.
- The run analytics are committed and pushed by the watcher after every session (`autonomous-watcher.sh` → `record_run_analytics`) and merge into `dev` with the branch. Today they record only how long the orchestrator waited on each round (`bash scripts/run-test-suite.sh --wait <label>`), not what took the time.
- That wait shows a trend nobody can explain from the analytics alone: rounds took about 25–34 min on 2026-11-04 and 11-05, then 30–40 min, and `chore_unattended_sandbox_record`'s round 2 took 58 min with no failure on 2026-11-07. In that run's records, read by hand before cleanup, gate 4 (`npm test`) took about 2420 s against about 1620 s on 2026-11-04. The same files led both times: `concurrentSuite` (`cli/test/helpers/concurrency.mjs`), `watcher-review-drop-payloads`, `watcher-remote-job`, `watcher-placeholder-host`, `remote-run`, `watcher-remote-dispatch`.
- `feat_ci_gates`, a later branch, assigns test files to shards by duration and picks the shard count from the total and the longest file. These records are its input.

> ⚠️ **Find every anchor in this prompt by its quoted text, heading or function name, never by line number.**

## What to read first

- `scripts/run-analytics.sh` and its template `cli/templates/scripts/run-analytics.sh`, all of the header: `THREE FILES, ONE DRIVER`, `WHERE IT STOPS`, `THE MERGE` and `PATHS IN THE RECORD`. Also `scripts/lib/run-analytics.jq` and `scripts/lib/run-analytics-report.jq`, with their templates.
- `harness-runs/run_analytics/README.md` and its template `cli/templates/state-dir/run_analytics/README.md`.
- `scripts/lib/gate-round-lib.sh` → the header's record contract: `<label>.gates.tsv` and `<label>.<phase>.tests.tsv`, the `end` line, and how a record is validated before it is read.
- `scripts/lib/test-timing-reporter.mjs` → `THE RECORD`.
- `scripts/run-test-suite.sh` → `THE LOG IS VERSIONED PER ROUND`, `ONE RUN PER LABEL`, `WHAT A GATE IS TOLD`, and the `.running` and `.verdict` files.
- `autonomous-watcher.sh` → `record_run_analytics`: when it runs and what it commits.
- A committed `run-analytics.json` and `.md` on `dev` under `harness-runs/run_analytics/`, for the current shape.

## The goal

1. **Record each finished round.** When the analytics are recorded, every round in `harness-runs/test_run_logs/<branch>/` that has finished (its `.verdict` is there) and is not yet in the analytics is added, keyed by its label: each gate's id, status and seconds, and every test file's path, status, seconds, tests and failed count, for each phase that wrote a record. A round still running is skipped and picked up after a later session. A record that fails validation is skipped and named, and never stops the analytics from being written.
2. **Keep the merge rules.** A recorded round is never rewritten, and a re-run over the same inputs leaves both files byte-identical, as `THE MERGE` requires for sessions. A resumed round runs under the same label, so the plan says what happens when a label's record changes after it was recorded.
3. **Show it in the Markdown.** The report gets a gates section: for each round, its wall time (already recorded), each gate's seconds, the total of the test files' seconds, and the slowest test files. The JSON keeps every row, and the report only the slowest N, with N stated.
4. **Applies to this repository only.** The two records are written only by this repository's own `scripts/run-gates.sh`, so an adopter's run has none and its analytics must be unchanged. The plan picks where the reading lives, either in `run-analytics.sh` and its jq libraries, reading the records only when present, or in a hook of this repository's own, and keeps each template and its self-adopted copy in step either way.
5. **Bump the schema** if the document's shape requires it, and say how an existing schema-1 document on `dev` is read and extended.
6. **Tests** for: a finished round recorded once; a running round skipped and recorded later; a malformed record skipped and named; byte-identical re-runs; a run with no records leaving the analytics as today; and the report's gates section.

## Constraints

- No change to how a round runs, what it writes, or how its verdict is decided. The two records' formats are read, not changed.
- The analytics stay best-effort: `record_run_analytics` still always returns 0 and cannot change a run's outcome.
- No machine path reaches the committed analytics: the records' paths are relative by `THE RECORD`, and anything else read from them goes through `PATHS IN THE RECORD`.
