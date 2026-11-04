`feat_gate_timings_failed_first` records how long each test file takes in every Run gates round, makes every round after the first run the previously failing gates and test files first, stopping there when they still fail, and stops a resumed round from re-running gates that already finished on the same commit.

## What was observed

- A Run gates round of this repository takes 30–40 minutes inside the sandbox, about three times as long as outside it.
- `fix_linux_detached_gate_run` (2026-11-03) ran the gates five times: `task_round_1`, `task_round_2`, `review_1_round_1`, `review_1_round_2` and `review_1_round_3`. Most of the time a run spends on gates goes into the full re-runs of the fix rounds, not into the first round.
- `node --test` already runs test files concurrently (one process per core, minus one by default). More parallelism inside one machine was tried and did not help: the CPU is already the limit.
- A resumed session re-runs a round whose gates already finished. The ledger's `G.` / `RG.` entry is ticked only on `pass`, so a resume lands in Phase G, G.0 resolves the same round, and G.1 issues the run form again. The run form joins a run of that label only while it is still live (`run_alive`); when the run has finished, it deletes the label's `.verdict` and starts the whole suite again. A pause during the `--wait` loop, with the suite finishing while the run is paused, costs a second full run.
- No round records how long each test file took (a one-off measurement is below, under `## Measured`). `scripts/run-gates.sh` writes gate 4's output (`npm test`) to a temporary log that is deleted when the gate passes, so it is not known whether a few files take most of the time or the time is spread evenly.

## Measured: one sandboxed Run gates pass (2026-11-03)

`dev` at `78cb7a8b` · macOS 15.7.4, Apple M4 (10 cores, 16 GiB) · Claude Code 2.1.317 · Node 22.23.2. Taken inside the sandbox: a headless session on the watcher's launch line (`--settings <main>/.claude/settings.autonomous.json --permission-mode dontAsk`) started a detached worker through `scratch-run.sh`, which ran a copy of `scripts/run-gates.sh` from the main checkout. Its only change was gate 4, `npm run test --workspace cli -- --test-reporter=spec --test-reporter-destination=stdout --test-reporter=<per-file reporter> --test-reporter-destination=<file>`. Each output line was timestamped. Load was low, with no other run in flight.

**By gate:** 1856 s in all. **Gate 4 (`npm test`) took 1831 s, 98.6%.** Gates 1–3 together took 5 s, gate 6 16 s, gate 11 7 s, and gates 14 and 16 2 s. Gate 13 printed BLOCKED (Python environment not synced) and 14d printed SKIPPED, so a machine with both provisioned spends a little more. 6a failed only because the run was in the main checkout, whose untracked `.claude/settings.autonomous.json` names machine paths.

**By test file** (149 files; the sum of each file's top-level test durations, measured inside its own process). Together the files took 7638 s of test time in 1830 s of wall time, so only about 4.2 of the 9 worker processes were busy on average.

| # | File | Seconds | Tests |
|---|---|---|---|
| 1 | `watcher-stall-reset-payloads.test.mjs` | 1298 | 19 |
| 2 | `watcher-placeholder-host.test.mjs` | 504 | 27 |
| 3 | `watcher-review-drop-payloads.test.mjs` | 413 | 23 |
| 4 | suites opened with `concurrentSuite` (`helpers/concurrency.mjs`: `doctor*`, `init`, `stack-presets`) | 387 | 9 |
| 5 | `watcher-remote-job.test.mjs` | 326 | 27 |
| 6 | `remote-run.test.mjs` | 301 | 130 |
| 7 | `remote-control.test.mjs` | 267 | 83 |
| 8 | `watcher-remote-dispatch.test.mjs` | 264 | 14 |
| 9 | `remote-control-review.test.mjs` | 263 | 33 |
| 10 | `watcher-run-profile.test.mjs` | 253 | 20 |

Next come `watcher-keep-awake` 208, `remote-trigger` 198, `remote-control-mention` 195, `run-test-suite` 142 and `docs-retrieval` 121; everything else is under 115 s. The top 10 are 4276 s, 56% of the total.

What the numbers say:
- **One file sets the floor.** `watcher-stall-reset-payloads.test.mjs` runs its 19 cases one after another (plain `test()`, not `concurrentSuite`), about 68 s each, and finished last. However the suite is spread, the gates cannot take less than about 22 minutes in the sandbox until this file gets faster. Each case's stub session ends in `sleep 60` (`HUNG_BODY`) and `HUNG_WAIT_MS` is 60 s, so each case probably waits out the full 60 s rather than ending when the watchdog kills the session. That is a guess from the timings, not checked.
- Ideal spreading of 7638 s over 9 workers would be about 850 s (14 min), so removing that floor roughly halves a round even with no CI.
- Of the top 10, nine are `watcher-*` and `remote-*` suites, which spawn many processes. That is where the sandbox's per-process cost lands.
- Caveats: per-file sums leave out module load and hooks. Suites opened with `concurrentSuite` run cases in parallel, so their sum overstates their wall time. Node delivers each file's events in file order, so first/last-event wall spans per file are meaningless and were not used.

<details><summary>The per-file reporter used (a starting point for goal 1; its wall-span columns are not usable, see the caveats)</summary>

```js
// Per-file timing reporter for node:test. For each test file: the sum of its top-level
// tests' durations, the wall span between the first and last event seen for it, test count,
// failures. Sorted by wall span, slowest first.
export default async function* (source) {
  const per = new Map();
  const t0 = Date.now();
  const rec = (f) => { let r = per.get(f); if (!r) { r = { first: Date.now(), last: Date.now(), sum: 0, tests: 0, fail: 0 }; per.set(f, r); } return r; };
  for await (const e of source) {
    const f = e.data && e.data.file;
    if (!f) continue;
    const r = rec(f); r.last = Date.now();
    if ((e.type === 'test:pass' || e.type === 'test:fail') && e.data.nesting === 0) {
      r.sum += e.data.details.duration_ms || 0; r.tests++;
      if (e.type === 'test:fail') r.fail++;
    }
  }
  yield `total_wall_s\t${((Date.now() - t0) / 1000).toFixed(1)}\n`;
  yield `wall_span_s\tsum_top_level_s\ttests\tfail\tfirst_seen_s\tfile\n`;
  for (const [f, r] of [...per].sort((a, b) => (b[1].last - b[1].first) - (a[1].last - a[1].first)))
    yield `${((r.last - r.first) / 1000).toFixed(1)}\t${(r.sum / 1000).toFixed(1)}\t${r.tests}\t${r.fail}\t${((r.first - t0) / 1000).toFixed(1)}\t${f.replace(/.*\/cli\/test\//, '')}\n`;
}
```
</details>

> ⚠️ **Find every anchor in this prompt by its quoted text, heading or function name, never by line number.**

## What to read first

- `scripts/run-gates.sh`: the `gate` / `gate_silent` helpers, gate 4 (`npm test`), and how the summary at the end is built.
- `scripts/run-test-suite.sh` (and its template under `cli/templates/scripts/`): the header comments `OUTPUT CONTRACT`, `TWO GATES, ONE VERDICT`, `RUN BOTH, REPORT BOTH` and `THE LOG IS VERSIONED PER ROUND`, and the byte-exact marker lines `test-fix-plan-writer` reads.
- `plugin/instructions/plan_orchestration_instructions_core.md` → `## Phase G — Run gates`, `### G.0 Resolve the round` and `### G.1 Run the gates`: how a round's label (`<gate_key>_round_<gate_round>`) is formed and where its log lives.
- `plugin/agents/test-fix-plan-writer.md`: what it reads from the log.
- `cli/package.json` → the `test` script.

## The goal

1. **Per-file timings, every round.** Every Run gates round leaves, next to its log under `<state_dir>/test_run_logs/<sanitized branch>/`, a record of each test file's duration and result, whether the round passes or fails. The log names the ten slowest files and their durations in a short section a person can read. Node's built-in `tap` and `junit` reporters do not name the file a test came from. A custom reporter module passed to `--test-reporter` does: on Node 20.19 every `test:pass` / `test:fail` event carries `data.file`, `data.nesting` and `data.details.duration_ms`, and `--test-reporter` / `--test-reporter-destination` can be given more than once, so the existing output and the timing record are written in one run. Check that what you use also exists at the `engines` floor `>=20.11.0`.
2. **Gate timings.** Every gate line in the `run-gates.sh` output carries its duration (`ok    4 npm test (612 s)`), so the slow gates are visible without reading the test record.
3. **Previously failing first, from round 2 on.** When the round before this one (the same branch, the latest earlier round of any `<gate_key>`) recorded failures, this round first runs only the gates and test files that failed there. If any of them still fails, the round stops and returns `fail <log>` without running the rest. If they all pass, the rest of the gates and the full test suite run as they do today, and only that full run can give `pass`. A round with no earlier record, or with an unreadable one, runs as today.
4. **The log stays usable for `test-fix-plan-writer`.** A round that stops early says so in a plain line naming which files it ran and that the rest did not run, and the failures sit under the same marker lines as today. When the wire changes, `test-fix-plan-writer` and every other file that quotes it change with it.
5. **A finished round is collected, not re-run, on the same commit.** The worker records the commit it ran against next to the label's `.verdict`. The run form reuses a finished `.verdict` of its label, exactly as `--wait` would, when HEAD is still that commit and nothing the gates read has changed since; otherwise it runs as today. The plan states what "nothing changed" means given the run artifacts under `<state_dir>`, which the gates do not test. This lives in `scripts/run-test-suite.sh` and its template, so every adopter gets it, and the header comments `ONE RUN PER LABEL` and `THE LOG IS VERSIONED PER ROUND` say it.
6. **Tests** for: a first round (full run), a round whose previously failing files still fail (stops early, rest not run), a round whose previously failing files now pass (full run follows), and a missing or corrupt previous record (full run), a finished verdict reused on the same commit, and a finished verdict not reused after HEAD moved.

## Constraints

- `pass` is only ever given by a round that ran every gate and the whole suite. Nothing in this branch lets a round pass on fewer tests.
- An adopter's `commands.test` can be any command line, so the generic `run-test-suite.sh` cannot know test files. The plan's Context says whether a generic mechanism for adopters (for example an optional config key naming a focused-run command) is worth a later branch. This branch does not build one.
- The recorded files are run artifacts. They never land outside `<state_dir>/test_run_logs/`, and the self-containment gate (gate 6) still passes over them.
- Bash 3.2 floor. `bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass.
