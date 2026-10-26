# Code Review: feat_run_gates_flake_resilience

## Context

**Branch:** `feat_run_gates_flake_resilience`
**Date:** 2026-10-26
**Reviewed:** the whole branch diff against `origin/dev` (`defaultBranch` is `dev`; this checkout has no local `dev` ref, so the diff base is `origin/dev` at `c7d4cec4`). That covers 13 files:
- **Task 1:** the new helper `cli/test/helpers/timing.mjs` and its suite `cli/test/test-time-scale.test.mjs`.
- **Task 2:** the scaled bounds in `cli/test/helpers/watcher.mjs` (`TICK_TIMEOUT_MS`, now exported) and in the three watcher suites.
- **Task 3:** the scaled bounds in `docs-retrieval`, `init`, `outer-loop-scripts`, `run-copy-migration`, `run-test-suite` and `test-timeout`.
- **Task 4:** the Gate 4 paragraph in `docs/development.md`.

8 run-artifact files excluded from the reviewed diff. Pass 2 was a no-op: no per-task review folder exists under `harness-runs/task_plan_point_reviews/` for this branch.

**Headline conclusions.**
- **The helper matches the plan.** It reads `HARNESS_TEST_TIME_SCALE` once at load, defaults to `2`, caps at `5`, and refuses junk, `0`, the empty string and values over the cap by name. `scaleBound` always returns a positive integer.
- **Its suite covers what the prompt asks for.** It tests unset, `1`, a valid value, junk and over-the-cap, both directly and at load in a clean child. It also shows the scaling through `TICK_TIMEOUT_MS`.
- **Every `timeoutMs` passed to `runBash` / `tick` in `cli/test/` is now scaled, and so is every counted poll budget.** The fixed bounds the helper header lists were checked site by site and are untouched.
- **The cap argument holds.** The largest scaled bound is `CHILD_TEST_TIMEOUT_MS`, 1 200 000 ms at the cap, which stays below `--test-timeout=1800000`.
- **The outer-loop sweep case keeps its power to fail.** Its scaled slack, 103 s at the cap, is still below `HANGING_GIT`'s `sleep 300`.
- **The `docs/development.md` change (`general` layer) passes clean.** It was graded against `.claude/context/conventions.md` → `## Documents of record` and two `harness-runs/lessons.md` entries:
  - **No in-session figure.** The new **The time limits scale.** paragraph gives `2` as the default and `5` as the cap. Those are `cli/test/helpers/timing.mjs` → `DEFAULT_TIME_SCALE` and `MAX_TIME_SCALE`, and that header calls the default "a judgement, not a measurement". `--test-timeout=1800000` is configuration (`cli/package.json` → `scripts.test`). The paragraph cites no wall-clock figure a run measured, so the lesson *"A wall-clock figure in a document of record is never one a run measured inside its own session…"* is met.
  - **Commands are fenced.** Its one adopter command, `HARNESS_TEST_TIME_SCALE=4 npm test`, sits alone in its own fenced block, as the lesson *"Every command an adopter is meant to run sits in a fenced block, one command per line…"* requires.
  - **The rewritten text matches the code.** The two rewritten sentences of **A hung case cannot hold the gate.** agree with `cli/test/test-timeout.test.mjs`. There, `CHILD_BOUND_MS = 2_000` is a literal ("a fixed 2 seconds") and `CHILD_TEST_TIMEOUT_MS = scaleBound(240_000)` is scaled ("which `HARNESS_TEST_TIME_SCALE` scales"). They also agree with the watcher bounds. `TICK_TIMEOUT_MS = scaleBound(60_000)` and the watcher suites' `scaleBound` sites are scaled. The largest of them, `scaleBound(180_000)` in `watcher-stall-reset-payloads.test.mjs`, is 900 000 ms at the cap. That stays below `--test-timeout=1800000`, as the paragraph says.
- **One discriminating bound was scaled by mistake** (Finding 1). `init.test.mjs`'s post-signal pid poll shares `eventually`'s now-scaled budget, but it is measured against the 5-second dev-server stub's lifetime. That is the same reason `RETURNS_PROMPTLY_MS` stays fixed, and at the default scale the assertion can no longer reliably fail.
- **No tests were run.** This review runs no suite; whether the suite passes is the Run gates phase's to establish.
- `phases.parity` is `false`, so no parity review applies.
- Pass 0's grep half had no regexes (the sweep table is an unfilled stub). Its new-exported-symbol caller check found callers for every new export:
  - `TICK_TIMEOUT_MS` is imported by `cli/test/test-time-scale.test.mjs`.
  - `TIME_SCALE`, `parseTimeScale`, `DEFAULT_TIME_SCALE`, `MAX_TIME_SCALE`, `TIME_SCALE_VARIABLE` and `scaleBound` are each imported by the new suite or by the scaled suites.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 2** — Name the killed-job case's start-wait budget `START_WAIT_POLLS` instead of calling `scaleBound(100)` in the loop condition _(layer: cli)_
2. [x] **Finding 1** — Give `init.test.mjs`'s post-signal pid poll a fixed `PID_GONE_ATTEMPTS` budget and list it among `timing.mjs`'s fixed bounds _(layer: cli)_

---

## Must Fix

### 1. `init.test.mjs` scales the post-kill pid poll, which stops discriminating against the 5-second dev-server stub
→ [finding_1.md](feat_run_gates_flake_resilience_code_review/finding_1.md)

---

## Should Fix

_None._

---

## Nice to Have

### 2. `watcher-remote-job.test.mjs` calls `scaleBound(100)` inside a loop condition instead of naming the budget
→ [finding_2.md](feat_run_gates_flake_resilience_code_review/finding_2.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section has no parity call-outs.
