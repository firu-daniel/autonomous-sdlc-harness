# Code review — feat_gate_timings_failed_first

**Context.** Branch `feat_gate_timings_failed_first`, reviewed 2026-11-04 against `dev`. This checkout has no local `dev` branch, so the diff base was resolved as `origin/dev`. The review covered 20 files across all three layers.
- **cli:** the shipped `run-test-suite.sh` template, its run-library comment, the `scripts/` and `test_run_logs/` README templates, and three suites: `run-test-suite.test.mjs`, the new `gate-round-lib.test.mjs` and the new `test-timing-reporter.test.mjs`.
- **plugin:** `test-fix-plan-writer` and the four Phase G / supervised gate-run blocks.
- **general:** the restructured `scripts/run-gates.sh`, the new `scripts/lib/gate-round-lib.sh` and `scripts/lib/test-timing-reporter.mjs`, the root copies of the wrapper, library and README, and `docs/development.md` / `docs/watcher.md`.

17 run-artifact files were excluded from the reviewed diff.

**Conclusions.**
- **The branch meets its goals.** Every gate line carries its duration. A round in the lane writes `<label>.gates.tsv` and per-phase `<label>.<phase>.tests.tsv` records, which keep every file, and the log prints the ten slowest files. From round 2 on, a round runs the previous round's failures first, with prerequisite `2a` pulled in, and stops with `fail` if any still fails. Only the full phase can reach exit 0.
- **The reuse is generic.** It lives in `run-test-suite.sh` and its template, which are byte-identical to the root copies, as are the run library and the lane README. It covers the run form and the `--no-detach` form, and the `--no-detach` form restamps `.verdict` so the launcher's `started()` accepts it.
- **No gate name or grading arm was lost.** I checked the restructure line by line against the pre-change `run-gates.sh`. The `  FAIL  ` prefix that `sp__gate_log_failures` matches is unchanged.
- **Tests:** all six cases the task prompt asks for are present. Parity is not reviewed (`phases.parity` is `false`).
- **Pass 0:** the grep half is disabled because this agent's sweep list has no regexes filled for this stack (a configuration gap). The new-exported-symbol caller check found every new export wired: the reporter's default export is called by `run-gates.sh` and its suite, and the `gr_*` functions by `run-gates.sh` and their suite.
- **Pass 2:** the per-unit findings root does not exist, so there was nothing to reconcile.

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — G.1's "the label is never run again" is false as stated _(layer: plugin)_
2. [ ] **Finding 2** — A unit that runs without its gate's first unit prints under the wrong section heading _(layer: general)_

## Must Fix

_None._

## Should Fix

### 1. G.1's "the label is never run again" is false as stated
→ [finding_1.md](feat_gate_timings_failed_first_code_review/finding_1.md)

## Nice to Have

### 2. A unit that runs without its gate's first unit prints under the wrong section heading
→ [finding_2.md](feat_gate_timings_failed_first_code_review/finding_2.md)

## Reference-implementation divergences to confirm

_None: `phases.parity` is `false`._
