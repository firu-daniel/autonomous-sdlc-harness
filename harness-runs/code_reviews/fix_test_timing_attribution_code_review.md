# Code Review: fix_test_timing_attribution

## Context

**Branch:** `fix_test_timing_attribution`
**Date:** 2026-11-09
**Reviewed:** the whole branch diff against the default branch `dev`. This run copy has no local `dev` branch, so the diff base was its remote-tracking ref `origin/dev`. The review covered 13 files:
- the seven concurrent suites now opened with `describe(name, { concurrency: CASE_CONCURRENCY }, fn)` in their own files, and `cli/test/helpers/concurrency.mjs` reduced to the bound (Tasks 1–2);
- the timing reporter's file-level-entry rule in `scripts/lib/test-timing-reporter.mjs` (Task 3);
- the round library's attribution refusal and named reason in `scripts/lib/gate-round-lib.sh` (Task 4);
- the cases that pin those two in `cli/test/test-timing-reporter.test.mjs` and `cli/test/gate-round-lib.test.mjs` (Tasks 5–6);
- the `docs/development.md` corrections (Task 7).

10 run-artifact files excluded from the reviewed diff.

**Headline conclusions:**
- **The design is wired end to end, and its readers stay consistent.** No `concurrentSuite` survives anywhere under `cli/`, `scripts/`, `docs/`, `plugin/`, `examples/` or `evals/`. `gr__tests_record_ok` keeps its one caller, `gr_previous_focus_var`, and now delegates to `gr__tests_record_reason`, the only copy of the checks. `gr_slowest`'s new `(the record is unreadable: <reason>)` line is quoted byte-for-byte by its two test cases and by `docs/development.md`. `run-analytics.sh` and both `.jq` copies take any digits in `tests`, so a `0` row needs no change there.
- **Tests.** Every accompanying test the touched layers require is present:
  - a real `node --test` run that puts a `describe`-opened suite on its own file, with the helper-opened shape as the control and an inert helper reading `tests 0`;
  - a synthetic file-level-entry case, covering the absolute and relative name forms and a load failure;
  - a focused-phase case showing that a zero-test non-test row is readable and never a focus file;
  - an unreadable-previous-record case for a non-test row carrying tests;
  - a `gr_slowest` case for both the refusal and the zero-test display.

  Whether they pass is for the Run gates phase to establish; this review ran no suite.
- **No tree guard is owed.** The branch adds no tree-reading test, and the new real-run case imports one module by URL.
- The lessons-ledger checks were applied. The reporter reads the new field `data.name`, and every synthetic producer, the test's `event()` helper, now writes it. No row is dropped from the record. No figure was measured in-session.
- **Parity:** `phases.parity` is `false`, so no parity cross-check runs.
- **Findings:** two, both small prose fixes.

---

## Phase 2 Readiness — Ordered Fix List

1. [ ] **Finding 2** — Reflow `cli/test/doctor.test.mjs`'s header choice 4 so "the three slowest — the" is not broken onto a stub line _(layer: cli)_
2. [ ] **Finding 1** — Name `fix_test_timing_attribution` in place of "until this change" in `docs/development.md`'s clarifying sentence _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. `docs/development.md`'s new clarifying sentence says "until this change", which reads as the measured concurrency change
→ [finding_1.md](fix_test_timing_attribution_code_review/finding_1.md)

---

## Nice to Have

### 2. `doctor.test.mjs`'s header choice 4 breaks "the three slowest — the" onto a stub line
→ [finding_2.md](fix_test_timing_attribution_code_review/finding_2.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and this section has no divergence call-outs.
