# Code Review: feat_run_analytics_gate_timings

## Context

**Branch:** `feat_run_analytics_gate_timings`
**Date:** 2026-11-08
**Reviewed:** the whole branch diff against the default branch `dev`. The run copy holds no local `dev` ref, so the base was `origin/dev...HEAD`. The diff covers:
- mode `rounds` and `redact_path` in `cli/templates/scripts/lib/run-analytics.jq` (Task 1)
- schema 2 and the `## Gate rounds` section in `cli/templates/scripts/lib/run-analytics-report.jq` (Task 2)
- the lane reader, the `--slurpfile known` route and the schema pick in `cli/templates/scripts/run-analytics.sh`, with the lane-owner comments in `cli/templates/scripts/lib/harness-run-lib.sh` (Task 3)
- the adopter READMEs under `cli/` (Task 4)
- `plugin/commands/branch-status.md` and `plugin/docs/AUTONOMOUS_FLOW.md` (Task 5)
- the self-adopted copies under `scripts/` and `harness-runs/`, and the producer headers in `scripts/lib/gate-round-lib.sh` and `scripts/lib/test-timing-reporter.mjs` (Task 6)
- `docs/watcher.md` and `docs/development.md` (Task 7)
- the three new suites `cli/test/run-analytics-rounds.test.mjs`, `cli/test/run-analytics-rounds-parse.test.mjs` and `cli/test/run-analytics-report-rounds.test.mjs`

20 run-artifact files excluded from the reviewed diff.

**Tests.** Every case the task prompt's goal 6 asks for is present:
- a finished round recorded once
- a running round skipped, then recorded on a later call
- a malformed record skipped and named
- byte-identical re-runs
- a run with no records writing today's bytes, with and without a lane of logs and verdicts
- the report's gates section

The suites also cover a resumed label as `<label>#2`, the stale per-phase record, schema-1 extension and the schema-3 refusal, redaction, and the past-`MAX_ARG_STRLEN` file route. Each new suite reads one fixed file or an `init` fixture, not a tree, so none owes a `treeGuards` entry. This review ran no suite, so whether they pass is the Run gates phase's to establish.

**Self-adopted copies.** Compared by content with `git diff --no-index`:
- `scripts/run-analytics.sh`, `scripts/lib/run-analytics.jq`, `scripts/lib/run-analytics-report.jq` and `scripts/lib/harness-run-lib.sh` match their templates byte for byte. `run-analytics.sh` differs only in its executable bit, which predates the branch.
- `harness-runs/run_analytics/README.md` and `harness-runs/test_run_logs/README.md` match theirs too.

**Behaviour checked against the prompt's constraints:**
- the producers' formats are read, never changed
- `record_run_analytics` in `cli/templates/scripts/autonomous-watcher.sh` is untouched and still ignores the script's stdout wording
- every rounds failure degrades to a named stderr line with the sessions still written
- a document with no round stays schema 1, byte for byte

**Parity.** `phases.parity` is `false`, so no parity review ran. The three findings below are durable prose and comments left behind by Task 1's header rename and by the new lane read.

**Pass 2.** The per-task findings root `harness-runs/task_plan_point_reviews/feat_run_analytics_gate_timings_task_plan/` does not exist, because per-unit review was off, so there was nothing to carry over.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Re-point `docs/watcher.md`'s two `lib/run-analytics.jq` → *Record* citations at *Session record* and mode `rounds` → *Round record* _(layer: general)_
2. [ ] **Finding 2** — Name `lib/run-analytics.jq` → mode `rounds` → *Round record* as the round entry's format of record in the `run_analytics/` README and its self-adopted copy _(layer: cli, general)_
3. [ ] **Finding 3** — Say in the two deny-list exemption comments that `run-analytics.sh` also appends the finished rounds it reads from the lane _(layer: cli, plugin)_

---

## Must Fix

### 1. `docs/watcher.md` cites `lib/run-analytics.jq` → *Record*, a header label this branch renamed
→ [finding_1.md](feat_run_analytics_gate_timings_code_review/finding_1.md)

---

## Should Fix

### 2. The `run_analytics/` README names `run-analytics.sh` → `GATE ROUNDS` as the round entry's format of record, but that paragraph does not state the entry's keys
→ [finding_2.md](feat_run_analytics_gate_timings_code_review/finding_2.md)

### 3. The two comments explaining why `run-analytics.sh` has no deny-list entry still say it "only appends sessions"
→ [finding_3.md](feat_run_analytics_gate_timings_code_review/finding_3.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section is empty.
