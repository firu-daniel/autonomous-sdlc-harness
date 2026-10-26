`feat_run_gates_flake_resilience` makes Phase G survive timing-sensitive test failures. Today a gate run on a loaded or slow host fails cases whose code is fine, the log keeps no reason for any failure, and `test-fix-plan-writer` turns every failing case into its own finding. The G.4 loop then spends an implementer and a committer on each one, only to find it passes when run alone. On 2026-10-26 that cost two runs 52 and 17 findings, and then 8 more on a round with no other suite running.

This branch does three things: it keeps each failure's reason in the gate log, it re-runs the failing test files once before a test fix plan is written, and it makes the timing-bound test cases tolerate a slow host. **It does not serialise gate runs across runs.** An earlier version of this issue proposed a host-wide lock. It was dropped because round 2 below failed with no other suite on the host, so a lock removes one source of load but does not fix the problem: a single run on a slow laptop or a 2-core CI runner fails the same way.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** The anchors were true at `4d24a212` (the tip of `fix_headless_run_host_sleep`; `origin/dev` was `c7d4cec4`). Re-verify each one in the merged code before planning on it.

There is no code dependency on another branch. If `fix_headless_run_host_sleep` or `feat_run_analytics` has merged, rebase onto it: the first adds the timing-bound `watcher-keep-awake` and `watcher-stall-host-sleep` suites that part 3 must cover.

## What was observed

**Round 1, two suites in parallel.** `fix_headless_run_host_sleep` and `feat_run_analytics` were both launched by the watcher on one 10-core, 16 GB machine and reached Phase G round 1 together:

| Branch | `# duration_ms` | Log written | `# fail` |
|---|---|---|---|
| `fix_headless_run_host_sleep` | 2757435 (~46 min) | 12:04:06 | 52 |
| `feat_run_analytics` | 2972559 (~50 min) | 12:11:13 | 17 |

- **Both branches failed the same families**: remote dispatch, review-drop L2/L3, run-profile, sandbox-refusal (b)/(d), the honest stall reset, keep-awake and stall-host-sleep. Each case runs git clones and bash watcher passes under fixed bounds: `cli/test/helpers/watcher.mjs` → `const TICK_TIMEOUT_MS = 60_000;`, the suites' `SESSION_TIMEOUT_MS = 180_000` / `RUN_TIMEOUT_MS`, and 20–30 s `WAIT_MS` polls, enforced by `cli/test/helpers/fixture.mjs` → `runBounded`.
- **The failures sit in one run of test numbers** (1075–1188 on `fix_headless_run_host_sleep`) and stop part-way through a file: in `watcher-review-drop-payloads.test.mjs` the first 10 cases failed, then later cases on the same drop path passed. Contention that eases does that; a defect fails every case that crosses it.
- **Every one of the 69 failing cases closed without a code change.** The G.4 loops ran 11 + 8 of them one file at a time, and each passed (for example `watcher-keep-awake.test.mjs` 9/9, `ok 3` in 9.8 s). The rest were closed by the operator.
- **The host did not sleep.** `pmset -g log` has no `Sleep` or `Wake` entry between 11:00 and 13:00.

**Round 2, one suite alone.** `fix_headless_run_host_sleep` re-ran its gates from 13:26 to 14:05 with `feat_run_analytics` paused and no other gate log written on the host. It failed **8** of 2369 cases: `watcher-keep-awake` (l), (e)–(h), (i), (k), `watcher-stall-host-sleep` (a)(b), (c), (d), and `a run form finding a stale heartbeat of its label starts a fresh run`. All but the last passed alone earlier the same day.

**No log carries a failure's reason.** `scripts/run-gates.sh` → `gate()` writes each gate's output to a `mktemp` file and, on failure, prints only the `not ok` lines (`grep -E '^[[:space:]]*not ok '`) and the last 25 lines. The TAP diagnostic block under each `not ok` (`error:`, `stack:`, `failureType:`) is discarded with the temp file. The round-1 test fix plan of `fix_headless_run_host_sleep` says so ("this log has no assertion message for any failure") and could only suspect a transient cause, so it planned 52 units anyway.

## The cause

Three gaps, each enough to turn a slow pass into hours of work:

1. **The evidence is thrown away.** `test-fix-plan-writer` cannot tell `runBash timed out after 60000 ms` from an assertion failure, so it cannot classify a failure as environmental, even though its contract has a `## Not fixable on this branch` section for exactly that.
2. **Phase G trusts one full-suite run.** `plugin/instructions/plan_orchestration_instructions_core.md` → `### G.1 Run the gates` sends every `fail <log>` straight to `### G.2 Write and review the test fix plan`. Nothing re-runs a failing case before a finding is written, and G.4 then re-runs each failing file one unit at a time, which is the same check done 52 times.
3. **The bounds assume a fast, idle host.** The watcher suites' wall-clock bounds are fixed constants. Under one full suite's own concurrency (`node --test` runs one file per spare core by default) a pass that takes ~10 s alone can exceed 60 s.

## The goal

1. **Keep each failure's reason in the gate log.**
   - In `scripts/run-gates.sh` → `gate()`, on failure, print each failing test's TAP diagnostic block with its `not ok` line (the indented YAML between `---` and `...`, holding `error:`, `failureType:` and the start of `stack:`), capped per case so a big stack cannot flood the log. Keep the `not ok` summary and the 25-line tail as they are.
   - Check what an adopter's `commands.test` gets: `cli/templates/scripts/run-test-suite.sh` and `cli/templates/scripts/test.sh`. If the adopter's full test output already reaches the round log, say so and change nothing there; if it is trimmed the same way, apply the same fix.
   - Update `plugin/agents/test-fix-plan-writer.md` so it reads the diagnostic blocks, and classes a failure whose only reason is a bound expiring (`runBash timed out after`, a `--test-timeout` cancel, a bounded poll giving up) as **timing-bound**, with the reason quoted.
2. **Re-run the failing files once before planning.** Add a step to Phase G between G.1 and G.2:
   - On `fail <log>`, re-run **only the test files that failed**, through `<test_file_cmd>`, one file at a time (no other file running), once. Run it through the same detached wrapper as G.1 (`run-test-suite.sh` gets a form for it, or a sibling does) so the session keeps the `--wait` pattern and none of G.1's forbidden waits (`Monitor`, `sleep`, ending the turn) comes back.
   - A failure that passes on the re-run is recorded as **flaky under load** in the round's record, with both results, and is not given a finding. A failure that fails again goes to G.2 as now, with both runs' diagnostics.
   - If every failure passes on the re-run, the round ends as a pass, and the Done summary's Run gates bullet says which cases were flaky and how many re-runs it took. Decide whether that pass may happen with the type check failing (it should not), and state it.
   - A typecheck failure is never re-run: it is not timing-bound.
   - `MAX_GATE_ROUNDS` counts gate runs, not re-runs. State how a re-run interacts with the cap, a pause and a stall-watchdog restart mid-re-run (G.0 must derive the same state from the tree).
3. **Make the timing-bound cases tolerate a slow host.**
   - Scale the fixed bounds by one environment multiplier read in one place (for example `HARNESS_TEST_TIME_SCALE`, default 1), applied to `TICK_TIMEOUT_MS`, the suites' session/run bounds and their `WAIT_MS` polls. A bound that guards a *liveness* claim (a hung run is killed) keeps its meaning: scale the time allowed, never the assertion.
   - And/or cap concurrency for the heavy watcher suites, for example by running them as their own group with `--test-concurrency`. Measure the cost on this repository's suite (about 39–46 min today) and choose; record the measurement.
   - `run-test-suite.sh`'s own stale-heartbeat case (`a run form finding a stale heartbeat of its label starts a fresh run`) failed in round 2 alone; check it for the same pattern.

## Constraints

- **No gate serialisation across runs**, and no host-wide lock.
- **The run form and `--wait`'s output contract are unchanged**: `pending` (exit 3), `pass` (exit 0), `fail <log>` (exit 1). Any new marker in the round log is a wire `test-fix-plan-writer` reads; add it to the wrapper header's marker list.
- **The re-run never runs the full suite** and never runs a file that did not fail. `unit_loop_core.md` → `## The test-run rule` point 1 says the suite runs only through Phase G's wrapper; amend that rule and every document its **Who may cite this** list names, if the re-run changes what it states.
- **The worker sends no signal** to a process another call started, per `run-test-suite.sh` → `WHY NOT A SIGNAL.`
- **Tests:** a failing gate's log carries the failing case's `error:` line; a re-run that passes ends the round as a pass with the flaky cases named; a re-run that fails reaches G.2 with both diagnostics; a typecheck failure is not re-run; the time-scale multiplier changes the bound a watcher case waits for. Model them on the existing `run-test-suite` suites, with short `RUN_TEST_SUITE_STALE` and `RUN_TEST_SUITE_WAIT_SLICE` values.
- `scripts/run-test-suite.sh`, `scripts/autonomous-watcher.sh` and `scripts/lib/harness-run-lib.sh` stay byte-identical mirrors of their `cli/templates/scripts/` sources (`cmp` exits 0).
- `scripts/run-gates.sh` passes.

## Out of scope, as follow-ups

- **A test fix plan that groups findings by shared cause.** When failures that fail again on the re-run still share one suspected cause, `test-fix-plan-writer` still plans one unit per case. Grouping them is a separate branch.
